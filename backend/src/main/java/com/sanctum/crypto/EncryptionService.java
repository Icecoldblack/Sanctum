package com.sanctum.crypto;

import com.sanctum.config.SanctumProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * AES-256-GCM with a fresh random 96-bit IV per value. The master key comes from the environment.
 * Two independent subkeys are derived from it (HMAC-SHA256), one for data at rest and one for
 * payloads hidden in images, so neither kind of ciphertext can be substituted for the other.
 */
@Service
public class EncryptionService {

    private static final String TEXT_PREFIX = "v1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    /** Bytes added to a plaintext by {@link #sealForImage}: IV plus GCM tag. */
    public static final int SEAL_OVERHEAD_BYTES = IV_BYTES + TAG_BITS / 8;

    private final SecretKey atRestKey;
    private final SecretKey imageKey;
    private final SecureRandom random = new SecureRandom();

    public EncryptionService(SanctumProperties properties) {
        byte[] master = decodeMasterKey(properties.encryption() == null ? null : properties.encryption().key());
        this.atRestKey = deriveKey(master, "sanctum/at-rest/v1");
        this.imageKey = deriveKey(master, "sanctum/steganography/v1");
    }

    /**
     * Encrypts text for storage. {@code context} is bound as associated data (for example the owning
     * session and the column), so a ciphertext copied to another row or column fails to decrypt.
     */
    public String encrypt(String plaintext, String context) {
        if (plaintext == null) {
            return null;
        }
        byte[] sealed = seal(atRestKey, plaintext.getBytes(StandardCharsets.UTF_8), aad(context));
        return TEXT_PREFIX + Base64.getEncoder().encodeToString(sealed);
    }

    public String decrypt(String ciphertext, String context) {
        if (ciphertext == null) {
            return null;
        }
        if (!ciphertext.startsWith(TEXT_PREFIX)) {
            throw new DecryptionException();
        }
        byte[] sealed;
        try {
            sealed = Base64.getDecoder().decode(ciphertext.substring(TEXT_PREFIX.length()));
        } catch (IllegalArgumentException e) {
            throw new DecryptionException();
        }
        return new String(open(atRestKey, sealed, aad(context)), StandardCharsets.UTF_8);
    }

    public byte[] sealForImage(byte[] plaintext) {
        return seal(imageKey, plaintext, null);
    }

    public byte[] openFromImage(byte[] sealed) {
        return open(imageKey, sealed, null);
    }

    private byte[] seal(SecretKey key, byte[] plaintext, byte[] aad) {
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            if (aad != null) {
                cipher.updateAAD(aad);
            }
            byte[] ciphertext = cipher.doFinal(plaintext);
            return ByteBuffer.allocate(iv.length + ciphertext.length).put(iv).put(ciphertext).array();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Encryption failed", e);
        }
    }

    private byte[] open(SecretKey key, byte[] sealed, byte[] aad) {
        if (sealed == null || sealed.length < SEAL_OVERHEAD_BYTES) {
            throw new DecryptionException();
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, sealed, 0, IV_BYTES));
            if (aad != null) {
                cipher.updateAAD(aad);
            }
            return cipher.doFinal(sealed, IV_BYTES, sealed.length - IV_BYTES);
        } catch (GeneralSecurityException e) {
            throw new DecryptionException();
        }
    }

    private static byte[] aad(String context) {
        return context == null ? null : context.getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] decodeMasterKey(String base64) {
        if (base64 == null || base64.isBlank()) {
            throw new IllegalStateException(
                    "SANCTUM_ENCRYPTION_KEY is not set. Provide a base64-encoded 32-byte key.");
        }
        byte[] key;
        try {
            key = Base64.getDecoder().decode(base64.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("SANCTUM_ENCRYPTION_KEY is not valid base64.");
        }
        if (key.length != 32) {
            throw new IllegalStateException("SANCTUM_ENCRYPTION_KEY must decode to exactly 32 bytes.");
        }
        return key;
    }

    private static SecretKey deriveKey(byte[] master, String purpose) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(master, "HmacSHA256"));
            return new SecretKeySpec(mac.doFinal(purpose.getBytes(StandardCharsets.UTF_8)), "AES");
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Key derivation failed", e);
        }
    }

    /** Authentication failed or the input is malformed. Deliberately carries no detail. */
    public static class DecryptionException extends RuntimeException {
        public DecryptionException() {
            super("Decryption failed", null, false, false);
        }
    }
}

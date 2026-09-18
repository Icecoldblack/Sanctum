package com.sanctum.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sanctum.TestProperties;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class EncryptionServiceTest {

    private final EncryptionService service = new EncryptionService(TestProperties.defaults());

    @Test
    void roundTripsUnicodeText() {
        String text = "He took my phone 📱\nI'm at Maria's — ünïcödé, 日本語, עברית";
        String ciphertext = service.encrypt(text, "ctx");
        assertThat(ciphertext).startsWith("v1:").doesNotContain("phone").doesNotContain("Maria");
        assertThat(service.decrypt(ciphertext, "ctx")).isEqualTo(text);
    }

    @Test
    void usesFreshIvPerValue() {
        assertThat(service.encrypt("same", "ctx")).isNotEqualTo(service.encrypt("same", "ctx"));
    }

    @Test
    void nullPassesThrough() {
        assertThat(service.encrypt(null, "ctx")).isNull();
        assertThat(service.decrypt(null, "ctx")).isNull();
    }

    @Test
    void ciphertextIsBoundToItsContext() {
        String ciphertext = service.encrypt("secret", "session:a:message");
        assertThatThrownBy(() -> service.decrypt(ciphertext, "session:b:message"))
                .isInstanceOf(EncryptionService.DecryptionException.class);
    }

    @Test
    void detectsTampering() {
        String ciphertext = service.encrypt("secret", "ctx");
        char last = ciphertext.charAt(ciphertext.length() - 2);
        String tampered = ciphertext.substring(0, ciphertext.length() - 2) + (last == 'A' ? 'B' : 'A')
                + ciphertext.charAt(ciphertext.length() - 1);
        assertThatThrownBy(() -> service.decrypt(tampered, "ctx"))
                .isInstanceOf(EncryptionService.DecryptionException.class);
        assertThatThrownBy(() -> service.decrypt("not-ciphertext", "ctx"))
                .isInstanceOf(EncryptionService.DecryptionException.class);
        assertThatThrownBy(() -> service.decrypt("v1:%%%", "ctx"))
                .isInstanceOf(EncryptionService.DecryptionException.class);
    }

    @Test
    void differentKeyCannotDecrypt() {
        EncryptionService other = new EncryptionService(
                TestProperties.withKey("HyAdHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQA="));
        String ciphertext = service.encrypt("secret", "ctx");
        assertThatThrownBy(() -> other.decrypt(ciphertext, "ctx"))
                .isInstanceOf(EncryptionService.DecryptionException.class);
    }

    @Test
    void imageSealingUsesSeparateKey() {
        byte[] sealed = service.sealForImage("hello".getBytes(StandardCharsets.UTF_8));
        assertThat(sealed).hasSize(5 + EncryptionService.SEAL_OVERHEAD_BYTES);
        assertThat(new String(service.openFromImage(sealed), StandardCharsets.UTF_8)).isEqualTo("hello");
        assertThatThrownBy(() -> service.openFromImage(new byte[5]))
                .isInstanceOf(EncryptionService.DecryptionException.class);
    }

    @Test
    void rejectsMissingOrInvalidKeys() {
        assertThatThrownBy(() -> new EncryptionService(TestProperties.withKey(null)))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("not set");
        assertThatThrownBy(() -> new EncryptionService(TestProperties.withKey("  ")))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new EncryptionService(TestProperties.withKey("!!notbase64!!")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("base64");
        assertThatThrownBy(() -> new EncryptionService(TestProperties.withKey("c2hvcnQ=")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("32 bytes");
    }
}

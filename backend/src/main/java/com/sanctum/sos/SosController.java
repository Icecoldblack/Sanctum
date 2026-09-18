package com.sanctum.sos;

import com.sanctum.common.exceptions.Errors;
import com.sanctum.sos.dto.SosDtos.DecodeResponse;
import com.sanctum.sos.dto.SosDtos.EncodeResponse;
import com.sanctum.sos.dto.SosDtos.ExpandRequest;
import com.sanctum.sos.dto.SosDtos.ExpandResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Base64;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    private static final String DOWNLOAD_NAME = "sanctum-image.png";

    private final SosService sosService;

    public SosController(SosService sosService) {
        this.sosService = sosService;
    }

    @PostMapping("/expand")
    public ExpandResponse expand(@Valid @RequestBody ExpandRequest request) {
        return new ExpandResponse(sosService.expand(request.sessionId(), request.shortInput()));
    }

    /**
     * Returns raw PNG bytes as an attachment when the client asks for {@code Accept: image/png}.
     * Otherwise returns JSON {@code { imageUrl, byteSize }} with the PNG as a data URL, which is
     * what the current frontend reads.
     */
    @PostMapping(value = "/encode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> encode(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("message") String message,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String accept) {
        byte[] png = sosService.encode(sessionId, message, bytesOf(image));
        if (accept != null && accept.contains(MediaType.IMAGE_PNG_VALUE)) {
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.attachment().filename(DOWNLOAD_NAME).build().toString())
                    .body(png);
        }
        String dataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(new EncodeResponse(dataUrl, png.length));
    }

    @PostMapping(value = "/decode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DecodeResponse decode(@RequestPart("image") MultipartFile image, HttpServletRequest request) {
        byte[] png = bytesOf(image);
        if (png == null || png.length == 0) {
            throw Errors.badRequest("image must not be empty");
        }
        return sosService.decode(png, request.getRemoteAddr());
    }

    private static byte[] bytesOf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw Errors.invalidImage();
        }
    }
}

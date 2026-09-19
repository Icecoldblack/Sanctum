package com.sanctum.support;

import com.sanctum.ai.ImageGenerator;
import com.sanctum.common.exceptions.Errors;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.imageio.ImageIO;

/** Records the prompts sent for image generation and returns a small solid PNG, or fails. */
public class StubImageGenerator implements ImageGenerator {

    private final List<String> prompts = new CopyOnWriteArrayList<>();
    private volatile boolean fail;

    @Override
    public byte[] generatePng(String description) {
        prompts.add(description);
        if (fail) {
            throw Errors.aiUnavailable();
        }
        BufferedImage image = new BufferedImage(320, 240, BufferedImage.TYPE_INT_RGB);
        var g = image.createGraphics();
        g.setColor(new Color(90, 140, 110));
        g.fillRect(0, 0, 320, 240);
        g.dispose();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public void reset() {
        prompts.clear();
        fail = false;
    }

    public void failNextCalls() {
        fail = true;
    }

    public List<String> prompts() {
        return prompts;
    }

    public String lastPrompt() {
        return prompts.get(prompts.size() - 1);
    }
}

package com.sanctum.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.turbo.TurboFilter;
import ch.qos.logback.core.spi.FilterReply;
import java.util.regex.Pattern;
import org.slf4j.Marker;
import org.slf4j.helpers.MessageFormatter;

/**
 * Last line of defence for the logging policy. Code must never log session IDs, IPs, or message
 * content; if something does (a library, an exception message), the event is dropped and replaced
 * with a line that says only that something was suppressed and from which logger.
 */
public class SensitiveDataTurboFilter extends TurboFilter {

    static final Pattern SENSITIVE = Pattern.compile(
            // UUIDs, i.e. session IDs
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                    // IPv4
                    + "|\\b(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}\\b"
                    // IPv6: full form, or compressed form containing "::"
                    + "|\\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\b"
                    + "|(?:\\b[0-9a-fA-F]{1,4})?(?::[0-9a-fA-F]{1,4})*::(?:[0-9a-fA-F]{1,4}\\b)?(?::[0-9a-fA-F]{1,4}\\b)*"
                    // Email addresses
                    + "|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private static final String FQCN = SensitiveDataTurboFilter.class.getName();
    private static final ThreadLocal<Boolean> EMITTING = ThreadLocal.withInitial(() -> false);

    @Override
    public FilterReply decide(Marker marker, Logger logger, Level level, String format, Object[] params, Throwable t) {
        if (format == null || EMITTING.get()) {
            return FilterReply.NEUTRAL;
        }
        String message = params == null || params.length == 0
                ? format
                : MessageFormatter.arrayFormat(format, params).getMessage();
        Throwable throwable = t != null ? t : MessageFormatter.getThrowableCandidate(params);
        if (!containsSensitive(message) && !throwableContainsSensitive(throwable)) {
            return FilterReply.NEUTRAL;
        }
        EMITTING.set(true);
        try {
            String replacement = "[log event suppressed: matched sensitive-data pattern]"
                    + (throwable != null ? " exception=" + throwable.getClass().getName() : "");
            logger.log(marker, FQCN, Level.toLocationAwareLoggerInteger(level), replacement, null, null);
        } finally {
            EMITTING.set(false);
        }
        return FilterReply.DENY;
    }

    static boolean containsSensitive(String text) {
        return text != null && SENSITIVE.matcher(text).find();
    }

    private static boolean throwableContainsSensitive(Throwable throwable) {
        int depth = 0;
        for (Throwable current = throwable; current != null && depth < 10; current = current.getCause(), depth++) {
            if (containsSensitive(current.getMessage())) {
                return true;
            }
        }
        return false;
    }
}

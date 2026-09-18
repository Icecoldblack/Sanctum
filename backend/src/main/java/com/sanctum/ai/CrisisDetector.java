package com.sanctum.ai;

import com.sanctum.config.SanctumProperties;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Deterministic scan of user input for imminent-danger and self-harm signals. On a hit, the chat
 * reply is prefixed with emergency resources whatever the model returns, so this safety net does
 * not depend on the model behaving correctly. It favours recall: a false positive only adds a
 * list of hotline numbers.
 */
@Component
public class CrisisDetector {

    public enum Category { IMMINENT_DANGER, SELF_HARM }

    public record Assessment(Set<Category> categories) {
        public boolean detected() {
            return !categories.isEmpty();
        }
    }

    private static final String PRONOUN = "(?:he|she|they|him|her|them|my (?:husband|wife|partner|boyfriend|girlfriend|ex|dad|father|mom|mother|son|brother))";

    private static final List<Pattern> IMMINENT_DANGER = compile(
            PRONOUN + "(?:'s|'re| is| are| will| would)? (?:going to|gonna|about to|trying to|threatening to|threatened to|will|wants to|said (?:he|she|they)(?:'d| would| will)) (?:kill|murder|shoot|stab|hurt|beat|strangle|choke)",
            "(?:going|gonna|about) to kill me",
            "(?:threat(?:en(?:ed|ing|s)?)?|said) (?:he|she|they)?(?:'d| would| will)? ?(?:to )?kill me",
            "threat(?:en(?:ed|ing|s)?)? to kill",
            "(?:has|have|got|grabbed|holding|pointing|pointed|with) (?:a |his |her |their )?(?:gun|knife|weapon|firearm|pistol|rifle)",
            "(?:chok|strangl)(?:e|ed|es|ing)\\b",
            "strangulation",
            "can'?t breathe",
            "(?:in|into) (?:immediate |real )?danger (?:right )?now",
            "(?:i'?m|i am) (?:not safe|in danger|scared for my life|afraid for my life)",
            "fear(?:ing|ed)? for my life",
            "(?:breaking|broke|kicking|banging) (?:in|down|on) (?:the |my )?door",
            "locked me (?:in|up|out)",
            "won'?t let me (?:leave|go|out)",
            "(?:hitting|beating|attacking|hurting) me (?:right )?now",
            "help me (?:right )?now",
            "please help me",
            "hid(?:e|ing) from (?:him|her|them)",
            "(?:kill|hurt) (?:my|the) (?:kids?|children|baby|dog|cat|pet)");

    private static final List<Pattern> SELF_HARM = compile(
            "kill(?:ing)? myself",
            "end(?:ing)? (?:my life|it all|things|myself)",
            "take my (?:own )?life",
            "suicid",
            "want(?:ed)? to die",
            "wish i (?:was|were) dead",
            "better off (?:dead|without me)",
            "don'?t want to (?:live|be alive|be here|exist|wake up)",
            "no (?:reason|point) (?:to|in) (?:live|living|going on)",
            "(?:hurt|harm|cut|cutting|burn|burning)(?:ing)? myself",
            "self[- ]?harm",
            "overdos(?:e|ing)",
            "can'?t go on");

    private final String resourceBlock;

    public CrisisDetector(SanctumProperties properties) {
        List<String> resources = properties.crisis() == null ? List.of() : properties.crisis().resources();
        StringBuilder block = new StringBuilder("If you are in danger or thinking about harming yourself, help is available right now:");
        for (String resource : resources) {
            block.append("\n- ").append(resource);
        }
        this.resourceBlock = block.toString();
    }

    public Assessment assess(String input) {
        if (input == null || input.isBlank()) {
            return new Assessment(Set.of());
        }
        String text = normalize(input);
        Set<Category> hits = EnumSet.noneOf(Category.class);
        if (matchesAny(IMMINENT_DANGER, text)) {
            hits.add(Category.IMMINENT_DANGER);
        }
        if (matchesAny(SELF_HARM, text)) {
            hits.add(Category.SELF_HARM);
        }
        return new Assessment(Set.copyOf(hits));
    }

    /** The emergency-resources text prepended to a reply when a crisis signal is detected. */
    public String resourceBlock() {
        return resourceBlock;
    }

    public String applyTo(String reply, Assessment assessment) {
        return assessment.detected() ? resourceBlock + "\n\n" + reply : reply;
    }

    private static String normalize(String input) {
        return input.toLowerCase(Locale.ROOT)
                .replace('’', '\'')
                .replace('‘', '\'')
                .replaceAll("\\s+", " ");
    }

    private static boolean matchesAny(List<Pattern> patterns, String text) {
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private static List<Pattern> compile(String... regexes) {
        return java.util.Arrays.stream(regexes).map(Pattern::compile).toList();
    }
}

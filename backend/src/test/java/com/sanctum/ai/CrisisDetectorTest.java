package com.sanctum.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.sanctum.TestProperties;
import com.sanctum.ai.CrisisDetector.Category;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CrisisDetectorTest {

    private final CrisisDetector detector = new CrisisDetector(TestProperties.defaults());

    @ParameterizedTest
    @ValueSource(strings = {
        "He said he's going to kill me tonight",
        "she is gonna hurt me when she gets home",
        "my husband threatened to kill me",
        "He threatened to kill the kids",
        "he has a gun",
        "He grabbed a knife and is in the kitchen",
        "he choked me last night",
        "I was strangled until I passed out",
        "I can't breathe he's on top of me",
        "I CAN’T BREATHE",
        "I'm not safe right now",
        "I am in danger right now",
        "I fear for my life",
        "he is breaking down the door",
        "They locked me in the bedroom",
        "he won't let me leave the house",
        "he is hitting me right now",
        "please help me",
        "i'm hiding from him in the bathroom",
    })
    void detectsImminentDanger(String phrase) {
        assertThat(detector.assess(phrase).categories()).contains(Category.IMMINENT_DANGER);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "I want to kill myself",
        "sometimes I think about ending it all",
        "I've been having suicidal thoughts",
        "i just want to die",
        "Everyone would be better off without me",
        "I don't want to live anymore",
        "there is no reason to live",
        "I've been cutting myself again",
        "I keep hurting myself",
        "self-harm",
        "thinking about taking an overdose",
        "I can't go on like this",
        "I wish I was dead",
    })
    void detectsSelfHarm(String phrase) {
        assertThat(detector.assess(phrase).categories()).contains(Category.SELF_HARM);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "How do I file for a protective order?",
        "I had a hard day and I feel tired",
        "Can you teach me a grounding exercise?",
        "My landlord won't return my deposit",
        "I'm worried about custody of my kids",
        "That movie was killer",
        "I feel anxious when he comes home late",
        "",
        "   ",
    })
    void ignoresOrdinaryMessages(String phrase) {
        assertThat(detector.assess(phrase).detected()).isFalse();
    }

    @Test
    void nullIsNotACrisis() {
        assertThat(detector.assess(null).detected()).isFalse();
    }

    @Test
    void prependsConfiguredResourcesOnlyWhenDetected() {
        String reply = "I'm here with you.";
        CrisisDetector.Assessment hit = detector.assess("he has a gun");
        String withResources = detector.applyTo(reply, hit);
        assertThat(withResources).startsWith(detector.resourceBlock()).endsWith(reply)
                .contains("Call 911.").contains("Hotline 1-800-799-7233.");

        assertThat(detector.applyTo(reply, detector.assess("hello"))).isEqualTo(reply);
    }

    @Test
    void detectsBothCategoriesAtOnce() {
        assertThat(detector.assess("he said he will kill me and honestly I want to die").categories())
                .containsExactlyInAnyOrder(Category.IMMINENT_DANGER, Category.SELF_HARM);
    }
}

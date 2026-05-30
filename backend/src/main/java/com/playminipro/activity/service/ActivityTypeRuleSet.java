package com.playminipro.activity.service;

import java.util.Map;

final class ActivityTypeRuleSet {

    private static final ActivityTypeRule DEFAULT_RULE = new ActivityTypeRule(false, false, "");

    private static final Map<String, ActivityTypeRule> RULES = Map.of(
            "dinner", new ActivityTypeRule(true, true, "吃饭"),
            "coffee", new ActivityTypeRule(true, true, "咖啡")
    );

    private ActivityTypeRuleSet() {
    }

    static ActivityTypeRule resolve(String typeCode) {
        if (typeCode == null || typeCode.isBlank()) {
            return DEFAULT_RULE;
        }
        return RULES.getOrDefault(typeCode, DEFAULT_RULE);
    }

    record ActivityTypeRule(boolean offlineOnly, boolean requireLocation, String displayName) {
    }
}
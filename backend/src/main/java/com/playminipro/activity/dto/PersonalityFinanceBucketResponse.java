package com.playminipro.activity.dto;

public record PersonalityFinanceBucketResponse(
        String key,
        String label,
        int spentFen,
        String spentText,
        int activityCount
) {
}
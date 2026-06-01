package com.playminipro.activity.dto;

public record PersonalityActivityStatsResponse(
        int total,
        String latestTime,
        String favoriteCategory,
        int favoriteCategoryPercent
) {
}
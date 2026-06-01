package com.playminipro.activity.dto;

public record PersonalityRadarMetricResponse(
        String key,
        String label,
        int value,
        int percent
) {
}
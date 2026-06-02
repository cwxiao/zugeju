package com.playminipro.activity.dto;

public record JoinActivityResponse(
        String activityId,
        boolean joined,
        int joinedCount,
        int maxParticipantCount
) {
}
package com.playminipro.activity.dto;

import java.time.OffsetDateTime;

public record ActivitySummaryResponse(
        String id,
        String title,
        String mode,
        String status,
        OffsetDateTime startTime,
        String venueAddress,
        int joinedCount,
        int maxParticipantCount
) {
}
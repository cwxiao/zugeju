package com.playminipro.activity.dto;

import java.time.OffsetDateTime;

public record ActivityArchiveItemResponse(
        String id,
        String title,
        String typeName,
        String role,
        String status,
        String mode,
        OffsetDateTime startTime,
        OffsetDateTime roleTime,
        String place,
        int joinedCount,
        int maxParticipantCount,
        int totalAmountFen,
        String expenseMode,
        String settlementLabel,
        String highlight,
        String overview
) {
}
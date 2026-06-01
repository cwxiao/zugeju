package com.playminipro.activity.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record ActivityDetailResponse(
        String id,
        String title,
        String description,
        String typeCode,
        String typeName,
        String mode,
        String status,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        OffsetDateTime meetupTime,
        String meetupAddress,
        String venueAddress,
        String onlineJoinInfo,
        String expenseMode,
        int expenseFlag,
        boolean allowMemberAddExpense,
        int joinedCount,
        int maxParticipantCount,
        List<ActivityMemberResponse> members
) {
}
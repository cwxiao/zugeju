package com.playminipro.activity.dto;

import java.time.OffsetDateTime;

public record ActivityFinanceRowResponse(
        String activityId,
        String role,
        String status,
        OffsetDateTime startTime,
        int joinedCount,
        int totalAmountFen,
        String expenseMode
) {
}
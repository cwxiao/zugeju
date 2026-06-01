package com.playminipro.activity.dto;

public record ActivitySettlementItemResponse(
        String userId,
        String nickname,
        String avatarUrl,
        String role,
        Integer amountFen
) {
}
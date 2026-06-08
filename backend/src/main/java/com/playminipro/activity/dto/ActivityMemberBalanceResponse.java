package com.playminipro.activity.dto;

public record ActivityMemberBalanceResponse(
        String userId,
        String nickname,
        String avatarUrl,
        String role,
        Integer paidAmountFen,
        Integer shareAmountFen,
        Integer balanceFen
) {
}

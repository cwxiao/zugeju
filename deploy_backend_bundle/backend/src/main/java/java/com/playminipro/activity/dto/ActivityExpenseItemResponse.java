package com.playminipro.activity.dto;

public record ActivityExpenseItemResponse(
        String id,
        String itemName,
        Integer amountFen,
        String payerUserId,
        String payerNickname
) {
}
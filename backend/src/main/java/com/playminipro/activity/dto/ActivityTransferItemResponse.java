package com.playminipro.activity.dto;

public record ActivityTransferItemResponse(
        String fromUserId,
        String fromNickname,
        String fromAvatarUrl,
        String toUserId,
        String toNickname,
        String toAvatarUrl,
        Integer amountFen
) {
}

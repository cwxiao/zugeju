package com.playminipro.activity.dto;

public record ActivityMemberResponse(
        String userId,
        String nickname,
        String avatarUrl,
        String role,
        String joinStatus
) {
}
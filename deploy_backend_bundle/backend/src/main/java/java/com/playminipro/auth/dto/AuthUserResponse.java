package com.playminipro.auth.dto;

public record AuthUserResponse(
        String id,
        String nickname,
        String avatarUrl
) {
}
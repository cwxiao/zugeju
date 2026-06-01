package com.playminipro.auth.dto;

public record WechatLoginResponse(
        String token,
        AuthUserResponse user,
        boolean isNewUser
) {
}
package com.playminipro.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WechatLoginRequest(
        @NotBlank(message = "code is required") String code,
        @Size(max = 128) String phoneCode,
        @Size(max = 64) String nickname,
        @Size(max = 512) String avatarUrl
) {
}
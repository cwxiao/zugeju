package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatCode2SessionResponse(
        @JsonProperty("openid") String openId,
        @JsonProperty("session_key") String sessionKey,
        @JsonProperty("unionid") String unionId,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public String resolvedOpenId() {
        return openId;
    }

    public Integer resolvedErrorCode() {
        return errorCode;
    }

    public String resolvedErrorMessage() {
        return errorMessage;
    }
}
package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatAccessTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") Integer expiresIn,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public String resolvedAccessToken() {
        return accessToken;
    }

    public Integer resolvedExpiresIn() {
        return expiresIn;
    }

    public Integer resolvedErrorCode() {
        return errorCode;
    }

    public String resolvedErrorMessage() {
        return errorMessage;
    }
}
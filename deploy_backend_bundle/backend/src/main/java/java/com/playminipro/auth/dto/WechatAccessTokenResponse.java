package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatAccessTokenResponse(
        String access_token,
        Integer expires_in,
        Integer errcode,
        String errmsg,
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") Integer expiresIn,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public String resolvedAccessToken() {
        return access_token != null ? access_token : accessToken;
    }

    public Integer resolvedExpiresIn() {
        return expires_in != null ? expires_in : expiresIn;
    }

    public Integer resolvedErrorCode() {
        return errcode != null ? errcode : errorCode;
    }

    public String resolvedErrorMessage() {
        return errmsg != null ? errmsg : errorMessage;
    }
}
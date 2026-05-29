package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatCode2SessionResponse(
        String openid,
        String session_key,
        String unionid,
        Integer errcode,
        String errmsg,
        @JsonProperty("openid") String openId,
        @JsonProperty("session_key") String sessionKey,
        @JsonProperty("unionid") String unionId,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public String resolvedOpenId() {
        return openid != null ? openid : openId;
    }

    public Integer resolvedErrorCode() {
        return errcode != null ? errcode : errorCode;
    }

    public String resolvedErrorMessage() {
        return errmsg != null ? errmsg : errorMessage;
    }
}
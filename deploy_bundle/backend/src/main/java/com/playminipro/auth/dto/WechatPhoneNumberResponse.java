package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatPhoneNumberResponse(
        @JsonProperty("phone_info") PhoneInfo phoneInfo,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public PhoneInfo resolvedPhoneInfo() {
        return phoneInfo;
    }

    public Integer resolvedErrorCode() {
        return errorCode;
    }

    public String resolvedErrorMessage() {
        return errorMessage;
    }

    public record PhoneInfo(
            String phoneNumber,
            String purePhoneNumber,
            String countryCode
    ) {

        public String resolvedPurePhoneNumber() {
            return purePhoneNumber != null ? purePhoneNumber : phoneNumber;
        }
    }
}
package com.playminipro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatPhoneNumberResponse(
        PhoneInfo phone_info,
        Integer errcode,
        String errmsg,
        @JsonProperty("phone_info") PhoneInfo phoneInfo,
        @JsonProperty("errcode") Integer errorCode,
        @JsonProperty("errmsg") String errorMessage
) {

    public PhoneInfo resolvedPhoneInfo() {
        return phone_info != null ? phone_info : phoneInfo;
    }

    public Integer resolvedErrorCode() {
        return errcode != null ? errcode : errorCode;
    }

    public String resolvedErrorMessage() {
        return errmsg != null ? errmsg : errorMessage;
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
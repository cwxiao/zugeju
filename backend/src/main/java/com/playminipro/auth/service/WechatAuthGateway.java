package com.playminipro.auth.service;

import com.playminipro.auth.dto.WechatCode2SessionResponse;
import com.playminipro.auth.dto.WechatAccessTokenResponse;
import com.playminipro.auth.dto.WechatPhoneNumberResponse;
import com.playminipro.common.config.WechatProperties;
import com.playminipro.common.exception.BusinessException;
import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
public class WechatAuthGateway {

    private static final long ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 300L;

    private final WechatProperties wechatProperties;

    private final RestClient restClient;

    private volatile String cachedAccessToken;

    private volatile Instant accessTokenExpiresAt = Instant.EPOCH;

    public WechatAuthGateway(WechatProperties wechatProperties) {
        this.wechatProperties = wechatProperties;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.weixin.qq.com")
                .build();
    }

    public String exchangeCodeForOpenId(String code) {
        if (!StringUtils.hasText(wechatProperties.getAppSecret())) {
            if (wechatProperties.isMockLoginEnabled()) {
                return null;
            }
            throw new BusinessException(4005, "wechat app secret is not configured");
        }

        WechatCode2SessionResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/sns/jscode2session")
                        .queryParam("appid", wechatProperties.getAppId())
                        .queryParam("secret", wechatProperties.getAppSecret())
                        .queryParam("js_code", code)
                        .queryParam("grant_type", "authorization_code")
                        .build())
                .retrieve()
                .body(WechatCode2SessionResponse.class);

        if (response == null) {
            throw new BusinessException(4006, "wechat login failed");
        }
        if (response.resolvedErrorCode() != null && response.resolvedErrorCode() != 0) {
            throw new BusinessException(4006, "wechat login failed: " + response.resolvedErrorMessage());
        }
        if (!StringUtils.hasText(response.resolvedOpenId())) {
            throw new BusinessException(4006, "wechat openId is empty");
        }
        return response.resolvedOpenId();
    }

    public boolean isMockMode() {
        return !StringUtils.hasText(wechatProperties.getAppSecret()) && wechatProperties.isMockLoginEnabled();
    }

    public String exchangeCodeForPhoneNumber(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BusinessException(4007, "wechat phone code is required");
        }
        if (isMockMode()) {
            return "13800000000";
        }

        WechatPhoneNumberResponse response = restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/wxa/business/getuserphonenumber")
                        .queryParam("access_token", getAccessToken())
                        .build())
                .body(Map.of("code", code))
                .retrieve()
                .body(WechatPhoneNumberResponse.class);

        if (response == null) {
            throw new BusinessException(4007, "wechat phone fetch failed");
        }
        if (response.resolvedErrorCode() != null && response.resolvedErrorCode() != 0) {
            throw new BusinessException(4007, "wechat phone fetch failed: " + response.resolvedErrorMessage());
        }

        WechatPhoneNumberResponse.PhoneInfo phoneInfo = response.resolvedPhoneInfo();
        if (phoneInfo == null || !StringUtils.hasText(phoneInfo.resolvedPurePhoneNumber())) {
            throw new BusinessException(4007, "wechat phone number is empty");
        }
        return phoneInfo.resolvedPurePhoneNumber();
    }

    private String getAccessToken() {
        Instant now = Instant.now();
        if (StringUtils.hasText(cachedAccessToken) && now.isBefore(accessTokenExpiresAt)) {
            return cachedAccessToken;
        }

        synchronized (this) {
            now = Instant.now();
            if (StringUtils.hasText(cachedAccessToken) && now.isBefore(accessTokenExpiresAt)) {
                return cachedAccessToken;
            }

            if (!StringUtils.hasText(wechatProperties.getAppSecret())) {
                throw new BusinessException(4005, "wechat app secret is not configured");
            }

            WechatAccessTokenResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/cgi-bin/token")
                            .queryParam("grant_type", "client_credential")
                            .queryParam("appid", wechatProperties.getAppId())
                            .queryParam("secret", wechatProperties.getAppSecret())
                            .build())
                    .retrieve()
                    .body(WechatAccessTokenResponse.class);

            if (response == null) {
                throw new BusinessException(4008, "wechat access token fetch failed");
            }
            if (response.resolvedErrorCode() != null && response.resolvedErrorCode() != 0) {
                throw new BusinessException(4008, "wechat access token fetch failed: " + response.resolvedErrorMessage());
            }
            if (!StringUtils.hasText(response.resolvedAccessToken())) {
                throw new BusinessException(4008, "wechat access token is empty");
            }

            long expiresIn = response.resolvedExpiresIn() != null ? response.resolvedExpiresIn() : 7200L;
            cachedAccessToken = response.resolvedAccessToken();
            accessTokenExpiresAt = now.plusSeconds(Math.max(60L, expiresIn - ACCESS_TOKEN_REFRESH_BUFFER_SECONDS));
            return cachedAccessToken;
        }
    }
}
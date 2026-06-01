package com.playminipro.auth.service;

import com.playminipro.auth.dto.AuthUserResponse;
import com.playminipro.auth.dto.WechatLoginRequest;
import com.playminipro.auth.dto.WechatLoginResponse;
import com.playminipro.auth.entity.UserEntity;
import com.playminipro.auth.mapper.UserMapper;
import com.playminipro.common.exception.BusinessException;
import com.playminipro.common.security.AuthSessionService;
import com.playminipro.common.security.JwtTokenProvider;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final UserMapper userMapper;

    private final JwtTokenProvider jwtTokenProvider;

    private final AuthSessionService authSessionService;

    private final WechatAuthGateway wechatAuthGateway;

    public AuthService(UserMapper userMapper,
                       JwtTokenProvider jwtTokenProvider,
                       AuthSessionService authSessionService,
                       WechatAuthGateway wechatAuthGateway) {
        this.userMapper = userMapper;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authSessionService = authSessionService;
        this.wechatAuthGateway = wechatAuthGateway;
    }

    @Transactional
    public WechatLoginResponse wechatLogin(WechatLoginRequest request) {
        String openId = wechatAuthGateway.exchangeCodeForOpenId(request.code());
        if (!StringUtils.hasText(openId)) {
            openId = buildMockOpenId(request.code());
        }

        String nickname = StringUtils.hasText(request.nickname()) ? request.nickname() : "微信用户";
        String phoneNumber = StringUtils.hasText(request.phoneCode())
                ? wechatAuthGateway.exchangeCodeForPhoneNumber(request.phoneCode())
                : null;
        UserEntity user = userMapper.findByOpenId(openId);
        boolean isNewUser = user == null;
        String avatarUrl = resolveAvatarUrl(request.avatarUrl(), user);
        String resolvedPhoneNumber = resolvePhoneNumber(phoneNumber, user);

        if (isNewUser) {
            user = new UserEntity();
            user.setId(UUID.randomUUID().toString());
            user.setOpenId(openId);
            user.setNickname(nickname);
            user.setAvatarUrl(avatarUrl);
            user.setPhoneNumber(resolvedPhoneNumber);
            userMapper.insert(user);
        } else {
            user.setNickname(nickname);
            user.setAvatarUrl(avatarUrl);
            user.setPhoneNumber(resolvedPhoneNumber);
            userMapper.updateProfile(user);
        }

        String sessionId = authSessionService.createSession(user.getId());
        String token = jwtTokenProvider.generateToken(user.getId(), user.getNickname(), sessionId);
        AuthUserResponse authUserResponse = new AuthUserResponse(user.getId(), user.getNickname(), user.getAvatarUrl());
        return new WechatLoginResponse(token, authUserResponse, isNewUser);
    }

    private String resolveAvatarUrl(String avatarUrl, UserEntity user) {
        if (StringUtils.hasText(avatarUrl)) {
            return avatarUrl;
        }
        return user != null ? user.getAvatarUrl() : null;
    }

    private String resolvePhoneNumber(String phoneNumber, UserEntity user) {
        if (StringUtils.hasText(phoneNumber)) {
            return phoneNumber;
        }
        return user != null ? user.getPhoneNumber() : null;
    }

    private String buildMockOpenId(String code) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(code.getBytes(StandardCharsets.UTF_8));
            return "mock_" + HexFormat.of().formatHex(digest).substring(0, 24);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
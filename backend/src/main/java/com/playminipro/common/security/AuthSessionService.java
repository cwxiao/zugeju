package com.playminipro.common.security;

import com.playminipro.common.config.JwtProperties;
import java.time.Duration;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthSessionService {

    private static final String SESSION_KEY_PREFIX = "auth:session:";

    private final StringRedisTemplate stringRedisTemplate;

    private final JwtProperties jwtProperties;

    public AuthSessionService(StringRedisTemplate stringRedisTemplate,
                              JwtProperties jwtProperties) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.jwtProperties = jwtProperties;
    }

    public String createSession(String userId) {
        String sessionId = UUID.randomUUID().toString();
        stringRedisTemplate.opsForValue().set(buildKey(sessionId), userId, resolveTtl());
        return sessionId;
    }

    public boolean validateAndRefresh(String sessionId, String userId) {
        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(userId)) {
            return false;
        }

        String key = buildKey(sessionId);
        String cachedUserId = stringRedisTemplate.opsForValue().get(key);
        if (!userId.equals(cachedUserId)) {
            return false;
        }

        stringRedisTemplate.expire(key, resolveTtl());
        return true;
    }

    private Duration resolveTtl() {
        return Duration.ofSeconds(jwtProperties.getExpireSeconds());
    }

    private String buildKey(String sessionId) {
        return SESSION_KEY_PREFIX + sessionId;
    }
}
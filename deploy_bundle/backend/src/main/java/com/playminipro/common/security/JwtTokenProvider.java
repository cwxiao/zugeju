package com.playminipro.common.security;

import com.playminipro.common.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;

    private final JwtProperties jwtProperties;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String userId, String nickname, String sessionId) {
        Instant now = Instant.now();
        Instant expiredAt = now.plusSeconds(jwtProperties.getExpireSeconds());

        return Jwts.builder()
                .subject(userId)
                .claim("nickname", nickname)
                .claim("sid", sessionId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiredAt))
                .signWith(secretKey)
                .compact();
    }

    public boolean validate(String token) {
        parseClaims(token);
        return true;
    }

    public String getUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String getSessionId(String token) {
        return parseClaims(token).get("sid", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
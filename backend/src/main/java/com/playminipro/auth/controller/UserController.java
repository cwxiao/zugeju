package com.playminipro.auth.controller;

import com.playminipro.auth.entity.UserEntity;
import com.playminipro.auth.mapper.UserMapper;
import com.playminipro.common.response.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserMapper userMapper;

    public UserController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @PutMapping("/avatar")
    public ApiResponse<Void> updateAvatar(Authentication authentication,
                                          @RequestBody UpdateAvatarRequest request) {
        String userId = authentication.getName();
        UserEntity user = userMapper.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("user not found");
        }
        user.setAvatarUrl(request.avatarUrl());
        userMapper.updateProfile(user);
        return ApiResponse.success(null);
    }

    public record UpdateAvatarRequest(String avatarUrl) {
    }
}

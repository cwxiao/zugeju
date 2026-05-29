package com.playminipro.activity.controller;

import com.playminipro.activity.dto.ActivityDetailResponse;
import com.playminipro.activity.dto.ActivitySummaryResponse;
import com.playminipro.activity.dto.CreateActivityRequest;
import com.playminipro.activity.dto.CreateActivityResponse;
import com.playminipro.activity.service.ActivityService;
import com.playminipro.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ApiResponse<CreateActivityResponse> create(Authentication authentication,
                                                      @Valid @RequestBody CreateActivityRequest request) {
        return ApiResponse.success(activityService.create(authentication.getName(), request));
    }

    @GetMapping("/mine/ongoing")
    public ApiResponse<List<ActivitySummaryResponse>> listMineOngoing(Authentication authentication) {
        return ApiResponse.success(activityService.listMineOngoing(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityDetailResponse> detail(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success(activityService.getDetail(authentication.getName(), id));
    }
}
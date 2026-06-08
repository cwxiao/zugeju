package com.playminipro.activity.controller;

import com.playminipro.activity.dto.ActivityDetailResponse;
import com.playminipro.activity.dto.ActivityArchiveItemResponse;
import com.playminipro.activity.dto.ActivityExpenseSummaryResponse;
import com.playminipro.activity.dto.ActivitySummaryResponse;
import com.playminipro.activity.dto.AddActivityExpenseRequest;
import com.playminipro.activity.dto.CreateActivityRequest;
import com.playminipro.activity.dto.CreateActivityResponse;
import com.playminipro.activity.dto.JoinActivityResponse;
import com.playminipro.activity.dto.PersonalityReportResponse;
import com.playminipro.activity.service.ActivityExpenseService;
import com.playminipro.activity.service.ActivityInsightService;
import com.playminipro.activity.service.ActivityService;
import com.playminipro.activity.dto.UpdateActivityExpenseRequest;
import com.playminipro.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    private final ActivityExpenseService activityExpenseService;

    private final ActivityInsightService activityInsightService;

    public ActivityController(ActivityService activityService,
                              ActivityExpenseService activityExpenseService,
                              ActivityInsightService activityInsightService) {
        this.activityService = activityService;
        this.activityExpenseService = activityExpenseService;
        this.activityInsightService = activityInsightService;
    }

    @PostMapping
    public ApiResponse<CreateActivityResponse> create(Authentication authentication,
                                                      @Valid @RequestBody CreateActivityRequest request) {
        return ApiResponse.success(activityService.create(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CreateActivityResponse> update(Authentication authentication,
                                                      @PathVariable String id,
                                                      @Valid @RequestBody CreateActivityRequest request) {
        return ApiResponse.success(activityService.update(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<CreateActivityResponse> cancel(Authentication authentication,
                                                      @PathVariable String id) {
        return ApiResponse.success(activityService.cancel(authentication.getName(), id));
    }

    @GetMapping("/mine/ongoing")
    public ApiResponse<List<ActivitySummaryResponse>> listMineOngoing(Authentication authentication) {
        return ApiResponse.success(activityService.listMineOngoing(authentication.getName()));
    }

    @GetMapping("/mine/archive")
    public ApiResponse<List<ActivityArchiveItemResponse>> listMineArchive(Authentication authentication) {
        return ApiResponse.success(activityInsightService.listMineArchive(authentication.getName()));
    }

    @GetMapping("/mine/personality-report")
    public ApiResponse<PersonalityReportResponse> personalityReport(Authentication authentication) {
        return ApiResponse.success(activityInsightService.getPersonalityReport(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityDetailResponse> detail(@Nullable Authentication authentication, @PathVariable String id) {
        String userId = authentication != null ? authentication.getName() : null;
        return ApiResponse.success(activityService.getDetail(userId, id));
    }

    @PostMapping("/{id}/join")
    public ApiResponse<JoinActivityResponse> join(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success(activityService.join(authentication.getName(), id));
    }

    @PostMapping("/{id}/decline")
    public ApiResponse<CreateActivityResponse> decline(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success(activityService.decline(authentication.getName(), id));
    }

    @GetMapping("/{id}/expenses/summary")
    public ApiResponse<ActivityExpenseSummaryResponse> expenseSummary(Authentication authentication,
                                                                     @PathVariable String id) {
        return ApiResponse.success(activityExpenseService.getSummary(authentication.getName(), id));
    }

    @PostMapping("/{id}/expenses")
    public ApiResponse<ActivityExpenseSummaryResponse> addExpense(Authentication authentication,
                                                                 @PathVariable String id,
                                                                 @Valid @RequestBody AddActivityExpenseRequest request) {
        return ApiResponse.success(activityExpenseService.addExpense(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}/expenses/{expenseId}")
    public ApiResponse<ActivityExpenseSummaryResponse> deleteExpense(Authentication authentication,
                                                                     @PathVariable String id,
                                                                     @PathVariable String expenseId) {
        return ApiResponse.success(activityExpenseService.deleteExpense(authentication.getName(), id, expenseId));
    }

    @PutMapping("/{id}/expenses/{expenseId}")
    public ApiResponse<ActivityExpenseSummaryResponse> updateExpense(Authentication authentication,
                                                                     @PathVariable String id,
                                                                     @PathVariable String expenseId,
                                                                     @Valid @RequestBody UpdateActivityExpenseRequest request) {
        return ApiResponse.success(activityExpenseService.updateExpense(authentication.getName(), id, expenseId, request));
    }

    @PostMapping("/{id}/finish")
    public ApiResponse<ActivityExpenseSummaryResponse> finish(Authentication authentication,
                                                             @PathVariable String id) {
        return ApiResponse.success(activityExpenseService.finish(authentication.getName(), id));
    }
}
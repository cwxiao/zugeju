package com.playminipro.activity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.playminipro.activity.dto.ActivityDetailResponse;
import com.playminipro.activity.dto.JoinActivityResponse;
import com.playminipro.activity.dto.ActivitySummaryResponse;
import com.playminipro.activity.dto.CreateActivityRequest;
import com.playminipro.activity.dto.CreateActivityResponse;
import com.playminipro.activity.entity.ActivityEntity;
import com.playminipro.activity.entity.ActivityMemberEntity;
import com.playminipro.activity.mapper.ActivityMapper;
import com.playminipro.activity.mapper.ActivityMemberMapper;
import com.playminipro.common.exception.BusinessException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {

    private final ActivityMapper activityMapper;

    private final ActivityMemberMapper activityMemberMapper;

    private final ObjectMapper objectMapper;

    private final ActivityNotificationService notificationService;

    public ActivityService(ActivityMapper activityMapper,
                           ActivityMemberMapper activityMemberMapper,
                           ObjectMapper objectMapper,
                           ActivityNotificationService notificationService) {
        this.activityMapper = activityMapper;
        this.activityMemberMapper = activityMemberMapper;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public CreateActivityResponse create(String userId, CreateActivityRequest request) {
        validateRequest(request);

        ActivityEntity activity = buildActivity(userId, request, UUID.randomUUID().toString());
        activity.setStatus("recruiting");
        activityMapper.insert(activity);

        ActivityMemberEntity activityMember = new ActivityMemberEntity();
        activityMember.setId(UUID.randomUUID().toString());
        activityMember.setActivityId(activity.getId());
        activityMember.setUserId(userId);
        activityMember.setRole("creator");
        activityMember.setJoinStatus("joined");
        activityMemberMapper.insert(activityMember);

        return new CreateActivityResponse(activity.getId());
    }

    @Transactional
    public CreateActivityResponse update(String userId, String activityId, CreateActivityRequest request) {
        validateRequest(request);

        ActivityEntity existingActivity = activityMapper.findById(activityId);
        if (existingActivity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        if (!userId.equals(existingActivity.getCreatorId())) {
            throw new BusinessException(4003, "forbidden");
        }

        ActivityEntity activity = buildActivity(userId, request, activityId);
        activity.setStatus(existingActivity.getStatus());
        int updated = activityMapper.update(activity);
        if (updated == 0) {
            throw new BusinessException(4004, "activity not found");
        }

        return new CreateActivityResponse(activityId);
    }

    @Transactional
    public CreateActivityResponse cancel(String userId, String activityId) {
        ActivityEntity existingActivity = activityMapper.findById(activityId);
        if (existingActivity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        if (!userId.equals(existingActivity.getCreatorId())) {
            throw new BusinessException(4003, "forbidden");
        }

        int updated = activityMapper.cancel(userId, activityId);
        if (updated == 0) {
            throw new BusinessException(4004, "activity not found");
        }

        return new CreateActivityResponse(activityId);
    }

    private void validateRequest(CreateActivityRequest request) {
        if (request.maxParticipantCount() < request.targetParticipantCount()) {
            throw new BusinessException(4001, "maxParticipantCount must be greater than or equal to targetParticipantCount");
        }

        ActivityTypeRuleSet.ActivityTypeRule typeRule = ActivityTypeRuleSet.resolve(request.typeCode());
        if (typeRule.offlineOnly() && !"offline".equals(request.mode())) {
            throw new BusinessException(4001, typeRule.displayName() + "活动必须是线下");
        }

        if ((typeRule.requireLocation() || "offline".equals(request.mode()))
                && isBlank(request.meetupAddress())
                && isBlank(request.venueAddress())) {
            throw new BusinessException(4001, "线下活动必须填写地点");
        }
    }

    private ActivityEntity buildActivity(String userId, CreateActivityRequest request, String activityId) {
        ActivityEntity activity = new ActivityEntity();
        activity.setId(activityId);
        activity.setCreatorId(userId);
        activity.setTypeCode(request.typeCode());
        activity.setTypeName(request.typeName());
        activity.setTitle(request.title());
        activity.setDescription(request.description());
        activity.setMode(request.mode());
        activity.setTargetParticipantCount(request.targetParticipantCount());
        activity.setMaxParticipantCount(request.maxParticipantCount());
        activity.setStartTime(request.startTime());
        activity.setEndTime(request.endTime());
        activity.setMeetupTime(request.meetupTime());
        activity.setMeetupAddress(request.meetupAddress());
        activity.setVenueAddress(request.venueAddress());
        activity.setLatitude(request.latitude());
        activity.setLongitude(request.longitude());
        activity.setOnlineJoinInfo(writeJson(request));
        activity.setExpenseMode(request.expenseMode());
        activity.setExpenseFlag(request.expenseFlag());
        activity.setAllowMemberAddExpense(request.allowMemberAddExpense());
        return activity;
    }

    public List<ActivitySummaryResponse> listMineOngoing(String userId) {
        return activityMapper.findMineOngoing(userId);
    }

    public ActivityDetailResponse getDetail(String userId, String activityId) {
        ActivityEntity activity = activityMapper.findById(activityId);
        if (activity == null) {
            throw new BusinessException(4004, "activity not found");
        }

        int joinedCount = activityMapper.countJoinedMembers(activityId);
        boolean currentUserJoined = userId != null && activityMemberMapper.existsJoinedMember(activityId, userId) > 0;
        boolean currentUserCreator = userId != null && activityMemberMapper.existsJoinedCreator(activityId, userId) > 0;
        boolean canJoin = !currentUserJoined
                && userId != null
                && "recruiting".equals(activity.getStatus())
                && joinedCount < activity.getMaxParticipantCount();

        return new ActivityDetailResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getDescription(),
                activity.getTypeCode(),
                activity.getTypeName(),
                activity.getMode(),
                activity.getStatus(),
                activity.getStartTime(),
                activity.getEndTime(),
                activity.getMeetupTime(),
                activity.getMeetupAddress(),
                activity.getVenueAddress(),
                activity.getLatitude(),
                activity.getLongitude(),
                activity.getOnlineJoinInfo(),
                activity.getExpenseMode(),
                activity.getExpenseFlag(),
                Boolean.TRUE.equals(activity.getAllowMemberAddExpense()),
                joinedCount,
                activity.getMaxParticipantCount(),
                currentUserJoined,
                currentUserCreator,
                canJoin,
                activityMemberMapper.findJoinedMembers(activityId)
        );
    }

    @Transactional
    public JoinActivityResponse join(String userId, String activityId) {
        ActivityEntity activity = activityMapper.findById(activityId);
        if (activity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        if (!"recruiting".equals(activity.getStatus()) && !"full".equals(activity.getStatus())) {
            throw new BusinessException(4001, "activity is not joinable");
        }
        if (activityMemberMapper.existsJoinedMember(activityId, userId) == 0
                && activityMapper.countJoinedMembers(activityId) >= activity.getMaxParticipantCount()) {
            throw new BusinessException(4001, "activity is full");
        }

        int insertedOrUpdated = activityMemberMapper.joinAsMember(UUID.randomUUID().toString(), activityId, userId);
        int joinedCount = activityMapper.countJoinedMembers(activityId);
        activityMapper.markFullIfNeeded(activityId);

        if (insertedOrUpdated > 0) {
            notificationService.recordMemberJoined(activity, userId);
        }

        return new JoinActivityResponse(activityId, true, joinedCount, activity.getMaxParticipantCount());
    }

    @Transactional
    public CreateActivityResponse decline(String userId, String activityId) {
        ActivityEntity activity = activityMapper.findById(activityId);
        if (activity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        activityMemberMapper.decline(activityId, userId);
        return new CreateActivityResponse(activityId);
    }

    private String writeJson(CreateActivityRequest request) {
        if (request.onlineJoinInfo() == null || request.onlineJoinInfo().isNull()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(request.onlineJoinInfo());
        } catch (JsonProcessingException exception) {
            throw new BusinessException(4002, "onlineJoinInfo is invalid");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
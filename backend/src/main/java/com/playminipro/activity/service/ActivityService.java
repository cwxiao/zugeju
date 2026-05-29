package com.playminipro.activity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.playminipro.activity.dto.ActivityDetailResponse;
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

    public ActivityService(ActivityMapper activityMapper,
                           ActivityMemberMapper activityMemberMapper,
                           ObjectMapper objectMapper) {
        this.activityMapper = activityMapper;
        this.activityMemberMapper = activityMemberMapper;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CreateActivityResponse create(String userId, CreateActivityRequest request) {
        if (request.maxParticipantCount() < request.targetParticipantCount()) {
            throw new BusinessException(4001, "maxParticipantCount must be greater than or equal to targetParticipantCount");
        }

        ActivityEntity activity = new ActivityEntity();
        activity.setId(UUID.randomUUID().toString());
        activity.setCreatorId(userId);
        activity.setTypeCode(request.typeCode());
        activity.setTypeName(request.typeName());
        activity.setTitle(request.title());
        activity.setDescription(request.description());
        activity.setMode(request.mode());
        activity.setStatus("recruiting");
        activity.setTargetParticipantCount(request.targetParticipantCount());
        activity.setMaxParticipantCount(request.maxParticipantCount());
        activity.setStartTime(request.startTime());
        activity.setEndTime(request.endTime());
        activity.setMeetupTime(request.meetupTime());
        activity.setMeetupAddress(request.meetupAddress());
        activity.setVenueAddress(request.venueAddress());
        activity.setOnlineJoinInfo(writeJson(request));
        activity.setExpenseMode(request.expenseMode());
        activity.setExpenseFlag(request.expenseFlag());
        activity.setAllowMemberAddExpense(request.allowMemberAddExpense());
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

    public List<ActivitySummaryResponse> listMineOngoing(String userId) {
        return activityMapper.findMineOngoing(userId);
    }

    public ActivityDetailResponse getDetail(String userId, String activityId) {
        ActivityEntity activity = activityMapper.findById(activityId);
        if (activity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        if (activityMapper.existsMember(activityId, userId) == 0) {
            throw new BusinessException(4003, "forbidden");
        }

        int joinedCount = activityMapper.countJoinedMembers(activityId);
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
                activity.getOnlineJoinInfo(),
                activity.getExpenseMode(),
                activity.getExpenseFlag(),
                Boolean.TRUE.equals(activity.getAllowMemberAddExpense()),
                joinedCount,
                activity.getMaxParticipantCount(),
                activityMemberMapper.findJoinedMembers(activityId)
        );
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
}
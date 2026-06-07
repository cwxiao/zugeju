package com.playminipro.activity.service;

import com.playminipro.activity.dto.ActivityExpenseItemResponse;
import com.playminipro.activity.dto.ActivityExpenseSummaryResponse;
import com.playminipro.activity.dto.ActivityMemberResponse;
import com.playminipro.activity.dto.ActivitySettlementItemResponse;
import com.playminipro.activity.dto.AddActivityExpenseRequest;
import com.playminipro.activity.entity.ActivityEntity;
import com.playminipro.activity.entity.ActivityExpenseEntity;
import com.playminipro.activity.mapper.ActivityExpenseMapper;
import com.playminipro.activity.mapper.ActivityMapper;
import com.playminipro.activity.mapper.ActivityMemberMapper;
import com.playminipro.common.exception.BusinessException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityExpenseService {

    private final ActivityMapper activityMapper;

    private final ActivityMemberMapper activityMemberMapper;

    private final ActivityExpenseMapper activityExpenseMapper;

    public ActivityExpenseService(ActivityMapper activityMapper,
                                  ActivityMemberMapper activityMemberMapper,
                                  ActivityExpenseMapper activityExpenseMapper) {
        this.activityMapper = activityMapper;
        this.activityMemberMapper = activityMemberMapper;
        this.activityExpenseMapper = activityExpenseMapper;
    }

    public ActivityExpenseSummaryResponse getSummary(String userId, String activityId) {
        ActivityEntity activity = getAccessibleActivity(userId, activityId);
        return buildSummary(userId, activity);
    }

    @Transactional
    public ActivityExpenseSummaryResponse addExpense(String userId, String activityId, AddActivityExpenseRequest request) {
        ActivityEntity activity = getAccessibleActivity(userId, activityId);
        assertOfflineActivity(activity);
        assertEditableStatus(activity);

        if (!userId.equals(activity.getCreatorId()) && !Boolean.TRUE.equals(activity.getAllowMemberAddExpense())) {
            throw new BusinessException(4003, "only creator can add expenses for this activity");
        }

        ActivityExpenseEntity expense = new ActivityExpenseEntity();
        expense.setId(UUID.randomUUID().toString());
        expense.setActivityId(activityId);
        expense.setPayerUserId(userId);
        expense.setItemName(request.itemName().trim());
        expense.setAmountFen(request.amountFen());
        activityExpenseMapper.insert(expense);

        return buildSummary(userId, activityMapper.findById(activityId));
    }

    @Transactional
    public ActivityExpenseSummaryResponse finish(String userId, String activityId) {
        ActivityEntity activity = getAccessibleActivity(userId, activityId);
        assertCreator(userId, activity);
        if ("cancelled".equals(activity.getStatus())) {
            throw new BusinessException(4001, "cancelled activity cannot be finished");
        }

        if (!"finished".equals(activity.getStatus())) {
            int updated = activityMapper.finish(userId, activityId);
            if (updated == 0) {
                throw new BusinessException(4004, "activity not found");
            }
            activity = activityMapper.findById(activityId);
        }

        return buildSummary(userId, activity);
    }

    private ActivityEntity getAccessibleActivity(String userId, String activityId) {
        ActivityEntity activity = activityMapper.findById(activityId);
        if (activity == null) {
            throw new BusinessException(4004, "activity not found");
        }
        if (activityMapper.existsMember(activityId, userId) == 0) {
            throw new BusinessException(4003, "forbidden");
        }
        return activity;
    }

    private void assertCreator(String userId, ActivityEntity activity) {
        if (!userId.equals(activity.getCreatorId())) {
            throw new BusinessException(4003, "forbidden");
        }
    }

    private void assertOfflineActivity(ActivityEntity activity) {
        if (!"offline".equals(activity.getMode())) {
            throw new BusinessException(4001, "only offline activity supports expenses");
        }
    }

    private void assertEditableStatus(ActivityEntity activity) {
        if ("finished".equals(activity.getStatus()) || "cancelled".equals(activity.getStatus())) {
            throw new BusinessException(4001, "activity status does not allow expense editing");
        }
    }

    private ActivityExpenseSummaryResponse buildSummary(String userId, ActivityEntity activity) {
        List<ActivityMemberResponse> joinedMembers = activityMemberMapper.findJoinedMembers(activity.getId());
        List<ActivityExpenseItemResponse> expenseItems = activityExpenseMapper.findByActivityId(activity.getId());
        int totalAmountFen = activityExpenseMapper.sumAmountFenByActivityId(activity.getId());
        boolean creatorView = userId.equals(activity.getCreatorId());

        return new ActivityExpenseSummaryResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getStatus(),
                activity.getExpenseMode(),
                joinedMembers.size(),
                totalAmountFen,
                creatorView,
                creatorView && "offline".equals(activity.getMode()) && !"finished".equals(activity.getStatus()) && !"cancelled".equals(activity.getStatus()),
                creatorView && !"finished".equals(activity.getStatus()) && !"cancelled".equals(activity.getStatus()),
                buildSettlementNote(activity, joinedMembers.size(), totalAmountFen),
                expenseItems,
                buildSettlementItems(activity, joinedMembers, totalAmountFen)
        );
    }

    private String buildSettlementNote(ActivityEntity activity, int joinedCount, int totalAmountFen) {
        if ("host_treat".equals(activity.getExpenseMode())) {
            return "这场由发起人请客，记账只做留档。";
        }
        if ("aa".equals(activity.getExpenseMode())) {
            if (joinedCount <= 1 || totalAmountFen <= 0) {
                return "结束活动后会按到场人数均摊，没有人需要转账。";
            }
            return "结束活动后会按到场人数均摊，非发起人转给发起人。";
        }
        return "当前活动不需要结算。";
    }

    private List<ActivitySettlementItemResponse> buildSettlementItems(ActivityEntity activity,
                                                                      List<ActivityMemberResponse> joinedMembers,
                                                                      int totalAmountFen) {
        List<ActivitySettlementItemResponse> items = new ArrayList<>();
        int shareAmountFen = 0;
        if ("aa".equals(activity.getExpenseMode()) && joinedMembers.size() > 0 && totalAmountFen > 0) {
            shareAmountFen = totalAmountFen / joinedMembers.size();
        }

        for (ActivityMemberResponse member : joinedMembers) {
            int amountFen = 0;
            if ("aa".equals(activity.getExpenseMode()) && !"creator".equals(member.role())) {
                amountFen = shareAmountFen;
            }
            items.add(new ActivitySettlementItemResponse(
                    member.userId(),
                    member.nickname(),
                    member.avatarUrl(),
                    member.role(),
                    amountFen
            ));
        }
        return items;
    }
}
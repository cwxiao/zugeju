package com.playminipro.activity.service;

import com.playminipro.activity.dto.ActivityExpenseItemResponse;
import com.playminipro.activity.dto.ActivityExpenseSummaryResponse;
import com.playminipro.activity.dto.ActivityMemberBalanceResponse;
import com.playminipro.activity.dto.ActivityMemberResponse;
import com.playminipro.activity.dto.ActivitySettlementItemResponse;
import com.playminipro.activity.dto.ActivityTransferItemResponse;
import com.playminipro.activity.dto.AddActivityExpenseRequest;
import com.playminipro.activity.dto.UpdateActivityExpenseRequest;
import com.playminipro.activity.entity.ActivityEntity;
import com.playminipro.activity.entity.ActivityExpenseEntity;
import com.playminipro.activity.mapper.ActivityExpenseMapper;
import com.playminipro.activity.mapper.ActivityMapper;
import com.playminipro.activity.mapper.ActivityMemberMapper;
import com.playminipro.common.exception.BusinessException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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

        // 支持指定付款人，未指定则默认为当前操作人
        String payerUserId = request.payerUserId() != null && !request.payerUserId().isBlank()
                ? request.payerUserId() : userId;

        // 验证付款人是活动成员
        if (activityMapper.existsMember(activityId, payerUserId) == 0) {
            throw new BusinessException(4003, "payer must be a member of the activity");
        }

        ActivityExpenseEntity expense = new ActivityExpenseEntity();
        expense.setId(UUID.randomUUID().toString());
        expense.setActivityId(activityId);
        expense.setPayerUserId(payerUserId);
        expense.setItemName(request.itemName().trim());
        expense.setAmountFen(request.amountFen());
        activityExpenseMapper.insert(expense);

        return buildSummary(userId, activityMapper.findById(activityId));
    }

    @Transactional
    public ActivityExpenseSummaryResponse deleteExpense(String userId, String activityId, String expenseId) {
        ActivityEntity activity = getAccessibleActivity(userId, activityId);
        assertOfflineActivity(activity);
        assertEditableStatus(activity);
        assertCreator(userId, activity);

        ActivityExpenseEntity expense = activityExpenseMapper.findById(expenseId);
        if (expense == null || !expense.getActivityId().equals(activityId)) {
            throw new BusinessException(4004, "expense not found");
        }

        activityExpenseMapper.deleteById(expenseId);
        return buildSummary(userId, activityMapper.findById(activityId));
    }

    @Transactional
    public ActivityExpenseSummaryResponse updateExpense(String userId, String activityId, String expenseId, UpdateActivityExpenseRequest request) {
        ActivityEntity activity = getAccessibleActivity(userId, activityId);
        assertOfflineActivity(activity);
        assertEditableStatus(activity);
        assertCreator(userId, activity);

        ActivityExpenseEntity expense = activityExpenseMapper.findById(expenseId);
        if (expense == null || !expense.getActivityId().equals(activityId)) {
            throw new BusinessException(4004, "expense not found");
        }

        String itemName = request.itemName() != null ? request.itemName().trim() : expense.getItemName();
        Integer amountFen = request.amountFen() != null ? request.amountFen() : expense.getAmountFen();
        String payerUserId = request.payerUserId() != null ? request.payerUserId() : expense.getPayerUserId();

        // 验证付款人是活动成员
        if (activityMapper.existsMember(activityId, payerUserId) == 0) {
            throw new BusinessException(4003, "payer must be a member of the activity");
        }

        activityExpenseMapper.update(expenseId, itemName, amountFen, payerUserId);
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
                buildSettlementItems(activity, joinedMembers, totalAmountFen),
                buildTransferItems(activity, joinedMembers, expenseItems, totalAmountFen),
                buildMemberBalances(activity, joinedMembers, expenseItems, totalAmountFen)
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
            return "结束活动后按到场人数均摊，多退少补自动算好。";
        }
        return "当前活动不需要结算。";
    }

    /**
     * 旧版结算项（向后兼容），每人的应付金额
     */
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

    /**
     * 每位成员的付款/分摊/差额
     */
    private List<ActivityMemberBalanceResponse> buildMemberBalances(ActivityEntity activity,
                                                                     List<ActivityMemberResponse> joinedMembers,
                                                                     List<ActivityExpenseItemResponse> expenseItems,
                                                                     int totalAmountFen) {
        List<ActivityMemberBalanceResponse> balances = new ArrayList<>();
        if (!"aa".equals(activity.getExpenseMode()) || joinedMembers.isEmpty() || totalAmountFen <= 0) {
            for (ActivityMemberResponse member : joinedMembers) {
                balances.add(new ActivityMemberBalanceResponse(
                        member.userId(), member.nickname(), member.avatarUrl(), member.role(), 0, 0, 0
                ));
            }
            return balances;
        }

        int shareAmountFen = totalAmountFen / joinedMembers.size();
        int remainder = totalAmountFen % joinedMembers.size();

        // 统计每人已付
        Map<String, Integer> paidByUser = new HashMap<>();
        for (ActivityExpenseItemResponse item : expenseItems) {
            paidByUser.merge(item.payerUserId(), item.amountFen(), Integer::sum);
        }

        // 计算每人差额，余数由发起人承担
        for (int i = 0; i < joinedMembers.size(); i++) {
            ActivityMemberResponse member = joinedMembers.get(i);
            int paid = paidByUser.getOrDefault(member.userId(), 0);
            int share = shareAmountFen;
            // 发起人承担余数
            if (i == 0 && remainder > 0) {
                share += remainder;
            }
            int balance = paid - share; // 正=多付（应收），负=少付（应付）
            balances.add(new ActivityMemberBalanceResponse(
                    member.userId(), member.nickname(), member.avatarUrl(), member.role(), paid, share, balance
            ));
        }

        return balances;
    }

    /**
     * 多付款人结算算法 —— 贪心法计算最少转账路径
     *
     * 原理：
     * 1. 算出每人的差额（已付 - 应摊）
     * 2. 差额>0 的人应该收钱，差额<0 的人应该付钱
     * 3. 贪心匹配：最大的债权人和最大的债务人配对，转min(债权,债务)
     * 4. 重复直到所有差额为0
     */
    private List<ActivityTransferItemResponse> buildTransferItems(ActivityEntity activity,
                                                                   List<ActivityMemberResponse> joinedMembers,
                                                                   List<ActivityExpenseItemResponse> expenseItems,
                                                                   int totalAmountFen) {
        List<ActivityTransferItemResponse> transfers = new ArrayList<>();
        if (!"aa".equals(activity.getExpenseMode()) || joinedMembers.isEmpty() || totalAmountFen <= 0) {
            return transfers;
        }

        int shareAmountFen = totalAmountFen / joinedMembers.size();
        int remainder = totalAmountFen % joinedMembers.size();

        // 统计每人已付
        Map<String, Integer> paidByUser = new HashMap<>();
        for (ActivityExpenseItemResponse item : expenseItems) {
            paidByUser.merge(item.payerUserId(), item.amountFen(), Integer::sum);
        }

        // 构建成员信息Map
        Map<String, ActivityMemberResponse> memberMap = joinedMembers.stream()
                .collect(Collectors.toMap(ActivityMemberResponse::userId, m -> m));

        // 计算每人差额
        Map<String, Integer> balances = new LinkedHashMap<>();
        for (int i = 0; i < joinedMembers.size(); i++) {
            ActivityMemberResponse member = joinedMembers.get(i);
            int paid = paidByUser.getOrDefault(member.userId(), 0);
            int share = shareAmountFen;
            if (i == 0 && remainder > 0) {
                share += remainder;
            }
            balances.put(member.userId(), paid - share);
        }

        // 贪心匹配：最大债权人和最大债务人配对
        while (true) {
            // 找最大债权人
            String maxCreditor = null;
            int maxCredit = 0;
            String maxDebtor = null;
            int maxDebt = 0;

            for (Map.Entry<String, Integer> entry : balances.entrySet()) {
                if (entry.getValue() > maxCredit) {
                    maxCredit = entry.getValue();
                    maxCreditor = entry.getKey();
                }
                if (entry.getValue() < maxDebt) {
                    maxDebt = entry.getValue();
                    maxDebtor = entry.getKey();
                }
            }

            // 没有债权/债务了
            if (maxCreditor == null || maxDebtor == null || maxCredit == 0 || maxDebt == 0) {
                break;
            }

            // 转账金额 = min(债权, |债务|)
            int transferAmount = Math.min(maxCredit, -maxDebt);

            ActivityMemberResponse from = memberMap.get(maxDebtor);
            ActivityMemberResponse to = memberMap.get(maxCreditor);
            transfers.add(new ActivityTransferItemResponse(
                    from.userId(), from.nickname(), from.avatarUrl(),
                    to.userId(), to.nickname(), to.avatarUrl(),
                    transferAmount
            ));

            // 更新差额
            balances.put(maxDebtor, maxDebt + transferAmount);
            balances.put(maxCreditor, maxCredit - transferAmount);
        }

        return transfers;
    }
}

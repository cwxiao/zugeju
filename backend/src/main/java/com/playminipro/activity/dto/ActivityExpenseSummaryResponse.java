package com.playminipro.activity.dto;

import java.util.List;

public record ActivityExpenseSummaryResponse(
        String activityId,
        String activityTitle,
        String activityStatus,
        String expenseMode,
        int joinedCount,
        int totalAmountFen,
        boolean creatorView,
        boolean canAddExpense,
        boolean canFinish,
        String settlementNote,
        List<ActivityExpenseItemResponse> expenseItems,
        List<ActivitySettlementItemResponse> settlementItems,
        List<ActivityTransferItemResponse> transferItems,
        List<ActivityMemberBalanceResponse> memberBalances
) {
}

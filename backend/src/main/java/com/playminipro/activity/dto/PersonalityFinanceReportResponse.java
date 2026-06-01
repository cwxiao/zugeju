package com.playminipro.activity.dto;

import java.util.List;

public record PersonalityFinanceReportResponse(
        int treatCount,
        int totalSpentFen,
        String totalSpentText,
        int aaSpentFen,
        String aaSpentText,
        int treatSpentFen,
        String treatSpentText,
        List<PersonalityFinanceBucketResponse> daily,
        List<PersonalityFinanceBucketResponse> weekly,
        List<PersonalityFinanceBucketResponse> monthly,
        List<PersonalityFinanceBucketResponse> quarterly,
        List<PersonalityFinanceBucketResponse> yearly
) {
}
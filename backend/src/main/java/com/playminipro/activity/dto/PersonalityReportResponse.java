package com.playminipro.activity.dto;

import java.util.List;

public record PersonalityReportResponse(
        String nickname,
        String periodLabel,
        int score,
        int surpassPercent,
        String title,
        String titleReason,
        String coverHeadline,
        String coverCaption,
        List<PersonalityDnaItemResponse> dnaList,
        List<PersonalityRadarMetricResponse> radarMetrics,
        String socialLabel,
        String socialDescription,
        int nightPercent,
        List<PersonalitySummaryStatResponse> summaryStats,
        PersonalityActivityStatsResponse activityStats,
        PersonalityFinanceReportResponse financeReport,
        List<String> sharpComments,
        List<String> honors,
        String animalName,
        String animalDescription,
        String posterTitle,
        String posterText,
        String shareCallout
) {
}
package com.playminipro.activity.service;

import com.playminipro.activity.dto.ActivityArchiveItemResponse;
import com.playminipro.activity.dto.ActivityFinanceRowResponse;
import com.playminipro.activity.dto.PersonalityActivityStatsResponse;
import com.playminipro.activity.dto.PersonalityDnaItemResponse;
import com.playminipro.activity.dto.PersonalityFinanceBucketResponse;
import com.playminipro.activity.dto.PersonalityFinanceReportResponse;
import com.playminipro.activity.dto.PersonalityRadarMetricResponse;
import com.playminipro.activity.dto.PersonalityReportResponse;
import com.playminipro.activity.dto.PersonalitySummaryStatResponse;
import com.playminipro.activity.mapper.ActivityMapper;
import com.playminipro.auth.entity.UserEntity;
import com.playminipro.auth.mapper.UserMapper;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ActivityInsightService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ActivityMapper activityMapper;

    private final UserMapper userMapper;

    public ActivityInsightService(ActivityMapper activityMapper,
                                  UserMapper userMapper) {
        this.activityMapper = activityMapper;
        this.userMapper = userMapper;
    }

    public List<ActivityArchiveItemResponse> listMineArchive(String userId) {
        return activityMapper.findMineArchive(userId).stream()
                .map(this::enrichArchiveItem)
                .toList();
    }

    public PersonalityReportResponse getPersonalityReport(String userId) {
        List<ActivityArchiveItemResponse> archive = listMineArchive(userId);
        List<ActivityArchiveItemResponse> scopedArchive = buildRecentWindow(archive);
        List<ActivityFinanceRowResponse> financeRows = activityMapper.findMineFinanceRows(userId);
        UserEntity user = userMapper.findById(userId);
        String nickname = user != null && user.getNickname() != null && !user.getNickname().isBlank() ? user.getNickname() : "你";

        int createdCount = countByRole(scopedArchive, "creator");
        int joinedCount = countByRole(scopedArchive, "member");
        int socialReach = scopedArchive.stream()
                .mapToInt(item -> Math.max(0, item.joinedCount() - 1))
                .sum();
        int streakDays = calculateActiveStreak(scopedArchive);
        int rawScore = createdCount * 5 + joinedCount * 3 + socialReach * 2 + streakDays;
        int score = Math.min(99, Math.max(56, 48 + rawScore));
        int surpassPercent = Math.min(99, Math.max(72, score + 4));
        List<PersonalityDnaItemResponse> dnaList = buildDnaList(scopedArchive);
        int nightPercent = calculateNightPercent(scopedArchive);
        List<PersonalityRadarMetricResponse> radarMetrics = buildRadarMetrics(scopedArchive, createdCount, joinedCount, socialReach, streakDays, nightPercent);
        PersonalityFinanceReportResponse financeReport = buildFinanceReport(financeRows);
        TitleDecision titleDecision = resolveTitle(scopedArchive, dnaList, nightPercent, createdCount, joinedCount);
        SocialDecision socialDecision = resolveSocial(scopedArchive, createdCount, joinedCount, socialReach);
        AnimalDecision animalDecision = resolveAnimal(titleDecision.key(), socialDecision.key(), nightPercent, socialReach);

        List<PersonalitySummaryStatResponse> summaryStats = List.of(
                new PersonalitySummaryStatResponse("发起活动", createdCount + " 场"),
                new PersonalitySummaryStatResponse("参与活动", joinedCount + " 场"),
                new PersonalitySummaryStatResponse("带动到场", socialReach + " 人次"),
                new PersonalitySummaryStatResponse("连续活跃", streakDays + " 天")
        );

        PersonalityActivityStatsResponse activityStats = new PersonalityActivityStatsResponse(
                scopedArchive.size(),
                scopedArchive.isEmpty() ? "最近还没开局" : formatDateTime(scopedArchive.getFirst().startTime()),
                dnaList.isEmpty() ? "随缘整活" : dnaList.getFirst().name(),
                dnaList.isEmpty() ? 0 : dnaList.getFirst().percent()
        );

        return new PersonalityReportResponse(
                nickname,
                "过去 30 天",
                score,
                surpassPercent,
                titleDecision.name(),
                titleDecision.reason(),
                nickname + " 的活动分析报告",
                resolveCoverCaption(titleDecision.name(), score),
                dnaList,
                radarMetrics,
                socialDecision.name(),
                socialDecision.description(),
                nightPercent,
                summaryStats,
                activityStats,
                financeReport,
                buildSharpComments(nickname, titleDecision.name(), dnaList, nightPercent, createdCount, joinedCount, socialReach),
                buildHonors(scopedArchive, createdCount, joinedCount, nightPercent),
                animalDecision.name(),
                animalDecision.description(),
                titleDecision.name() + " · " + animalDecision.name(),
                nickname + " 这 30 天发起了 " + createdCount + " 场、参与了 " + joinedCount + " 场，最常出现的主题是 "
                        + (dnaList.isEmpty() ? "整活" : dnaList.getFirst().name()) + "。",
                "你的称号是 " + titleDecision.name() + "。最近 30 天发起 " + createdCount + " 场活动，夜场占比 " + nightPercent + "% 。"
        );
    }

    private ActivityArchiveItemResponse enrichArchiveItem(ActivityArchiveItemResponse item) {
        return new ActivityArchiveItemResponse(
                item.id(),
                item.title(),
                item.typeName(),
                item.role(),
                item.status(),
                item.mode(),
                item.startTime(),
                item.roleTime(),
                item.place(),
                item.joinedCount(),
                item.maxParticipantCount(),
                item.totalAmountFen(),
                item.expenseMode(),
                buildSettlementLabel(item.expenseMode(), item.totalAmountFen(), item.status()),
                buildHighlight(item),
                buildOverview(item)
        );
    }

    private List<ActivityArchiveItemResponse> buildRecentWindow(List<ActivityArchiveItemResponse> archive) {
        OffsetDateTime since = OffsetDateTime.now().minusDays(30);
        List<ActivityArchiveItemResponse> recent = archive.stream()
                .filter(item -> item.startTime() != null && item.startTime().isAfter(since))
                .toList();
        return recent.isEmpty() ? archive.stream().limit(8).toList() : recent;
    }

    private int countByRole(List<ActivityArchiveItemResponse> items, String role) {
        return (int) items.stream().filter(item -> role.equals(item.role())).count();
    }

    private List<PersonalityRadarMetricResponse> buildRadarMetrics(List<ActivityArchiveItemResponse> items,
                                                                   int createdCount,
                                                                   int joinedCount,
                                                                   int socialReach,
                                                                   int streakDays,
                                                                   int nightPercent) {
        int finishCount = (int) items.stream().filter(item -> "finished".equals(item.status())).count();
        int total = Math.max(items.size(), 1);
        return List.of(
                new PersonalityRadarMetricResponse("organize", "组局力", createdCount, clampPercent(createdCount * 18)),
                new PersonalityRadarMetricResponse("participate", "参与度", joinedCount, clampPercent(joinedCount * 16)),
                new PersonalityRadarMetricResponse("reach", "带动力", socialReach, clampPercent(socialReach * 8)),
                new PersonalityRadarMetricResponse("finish", "落地率", finishCount, clampPercent(Math.round(finishCount * 100.0f / total))),
                new PersonalityRadarMetricResponse("night", "夜场热度", nightPercent, clampPercent(nightPercent)),
                new PersonalityRadarMetricResponse("streak", "连续性", streakDays, clampPercent(streakDays * 20))
        );
    }

    private PersonalityFinanceReportResponse buildFinanceReport(List<ActivityFinanceRowResponse> rows) {
        // 财报只在内存里做一次轻量分桶：数据库先按用户拉出活动总额，避免日/周/月/季/年各查一遍。
        List<ActivityFinanceCost> costs = rows.stream()
                .map(row -> new ActivityFinanceCost(row, calculateUserSpentFen(row)))
                .filter(cost -> cost.spentFen() > 0)
                .toList();
        int totalSpentFen = costs.stream().mapToInt(ActivityFinanceCost::spentFen).sum();
        int aaSpentFen = costs.stream()
                .filter(cost -> "aa".equals(cost.row().expenseMode()))
                .mapToInt(ActivityFinanceCost::spentFen)
                .sum();
        int treatSpentFen = totalSpentFen - aaSpentFen;
        int treatCount = (int) rows.stream()
                .filter(row -> "creator".equals(row.role()))
                .filter(row -> row.totalAmountFen() > 0)
                .filter(row -> "host_treat".equals(row.expenseMode()) || "designated_treat".equals(row.expenseMode()))
                .count();

        return new PersonalityFinanceReportResponse(
                treatCount,
                totalSpentFen,
                formatFen(totalSpentFen),
                aaSpentFen,
                formatFen(aaSpentFen),
                treatSpentFen,
                formatFen(treatSpentFen),
                buildFinanceBuckets(costs, "daily", 14),
                buildFinanceBuckets(costs, "weekly", 12),
                buildFinanceBuckets(costs, "monthly", 12),
                buildFinanceBuckets(costs, "quarterly", 8),
                buildFinanceBuckets(costs, "yearly", 6)
        );
    }

    private int calculateUserSpentFen(ActivityFinanceRowResponse row) {
        // 当前口径：AA 按到场人数均摊；发起人请客/指定请客先按发起人承担整单计算。
        if (row.totalAmountFen() <= 0 || row.joinedCount() <= 0) {
            return 0;
        }
        if ("aa".equals(row.expenseMode())) {
            return Math.toIntExact(Math.round(row.totalAmountFen() * 1.0 / row.joinedCount()));
        }
        if ("creator".equals(row.role()) && ("host_treat".equals(row.expenseMode()) || "designated_treat".equals(row.expenseMode()))) {
            return row.totalAmountFen();
        }
        return 0;
    }

    private List<PersonalityFinanceBucketResponse> buildFinanceBuckets(List<ActivityFinanceCost> costs, String period, int limit) {
        Map<String, FinanceBucketAccumulator> buckets = new LinkedHashMap<>();
        for (ActivityFinanceCost cost : costs) {
            if (cost.row().startTime() == null) {
                continue;
            }
            String key = buildPeriodKey(cost.row().startTime().toLocalDate(), period);
            buckets.computeIfAbsent(key, ignored -> new FinanceBucketAccumulator()).add(cost.spentFen());
        }

        return buckets.entrySet().stream()
                .sorted(Map.Entry.<String, FinanceBucketAccumulator>comparingByKey().reversed())
                .limit(limit)
                .map(entry -> new PersonalityFinanceBucketResponse(
                        entry.getKey(),
                        buildPeriodLabel(entry.getKey(), period),
                        entry.getValue().spentFen(),
                        formatFen(entry.getValue().spentFen()),
                        entry.getValue().activityCount()
                ))
                .toList();
    }

    private String buildPeriodKey(LocalDate date, String period) {
        if ("daily".equals(period)) {
            return date.toString();
        }
        if ("weekly".equals(period)) {
            WeekFields weekFields = WeekFields.ISO;
            return date.getYear() + "-W" + String.format("%02d", date.get(weekFields.weekOfWeekBasedYear()));
        }
        if ("monthly".equals(period)) {
            return date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }
        if ("quarterly".equals(period)) {
            return date.getYear() + "-Q" + ((date.getMonthValue() - 1) / 3 + 1);
        }
        return String.valueOf(date.getYear());
    }

    private String buildPeriodLabel(String key, String period) {
        if ("weekly".equals(period)) {
            return key.replace("-W", " 第") + "周";
        }
        if ("quarterly".equals(period)) {
            return key.replace("-Q", " 第") + "季度";
        }
        return key;
    }

    private int calculateNightPercent(List<ActivityArchiveItemResponse> items) {
        if (items.isEmpty()) {
            return 0;
        }
        long nightCount = items.stream()
                .filter(item -> item.startTime() != null)
                .filter(item -> item.startTime().getHour() >= 22 || item.startTime().getHour() < 5)
                .count();
        return Math.toIntExact(Math.round(nightCount * 100.0 / items.size()));
    }

    private int calculateActiveStreak(List<ActivityArchiveItemResponse> items) {
        List<LocalDate> activeDates = items.stream()
                .map(ActivityArchiveItemResponse::roleTime)
                .filter(java.util.Objects::nonNull)
                .map(OffsetDateTime::toLocalDate)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        if (activeDates.isEmpty()) {
            return 0;
        }

        int streak = 1;
        for (int index = 1; index < activeDates.size(); index++) {
            if (activeDates.get(index - 1).minusDays(1).equals(activeDates.get(index))) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private List<PersonalityDnaItemResponse> buildDnaList(List<ActivityArchiveItemResponse> items) {
        if (items.isEmpty()) {
            return List.of();
        }

        Map<String, Integer> counter = new LinkedHashMap<>();
        for (ActivityArchiveItemResponse item : items) {
            counter.merge(item.typeName(), 1, Integer::sum);
        }

        int total = items.size();
        return counter.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> {
                    int percent = Math.max(8, Math.toIntExact(Math.round(entry.getValue() * 100.0 / total)));
                    return new PersonalityDnaItemResponse(entry.getKey(), entry.getValue(), percent, percent + "%");
                })
                .toList();
    }

    private TitleDecision resolveTitle(List<ActivityArchiveItemResponse> items,
                                       List<PersonalityDnaItemResponse> dnaList,
                                       int nightPercent,
                                       int createdCount,
                                       int joinedCount) {
        String favorite = dnaList.isEmpty() ? "" : dnaList.getFirst().name();

        if (nightPercent >= 60) {
            return new TitleDecision("night_king", "深夜整活王", "最近 " + nightPercent + "% 的活动发生在晚上 10 点以后。");
        }
        if ("电竞".equals(favorite) && !dnaList.isEmpty() && dnaList.getFirst().count() >= 2) {
            return new TitleDecision("esports_engine", "电竞永动机", "最近这段时间高频出没在开黑局，属于随叫随到型输出位。");
        }
        if ("聚餐".equals(favorite) && createdCount >= 2) {
            return new TitleDecision("food_engine", "聚餐发动机", "一到饭点就容易出现你的新局，吃饭这件事你是会点火的。");
        }
        if (createdCount <= 1 && joinedCount <= 2 && items.size() <= 3) {
            return new TitleDecision("lone_wolf", "独狼玩家", "出手不算频繁，但基本每一场都踩在自己真的想去的点上。");
        }
        return new TitleDecision("social_ceiling", "社交天花板", "你不只会到场，还挺会让一场局慢慢热起来。");
    }

    private SocialDecision resolveSocial(List<ActivityArchiveItemResponse> items,
                                         int createdCount,
                                         int joinedCount,
                                         int socialReach) {
        if (createdCount >= joinedCount + 2) {
            return new SocialDecision("organizer", "组织者", "你更像活动发动机，擅长先把局支起来，再等人往里进。");
        }
        if (joinedCount >= createdCount + 2) {
            return new SocialDecision("follower", "跟车党", "你不一定第一个举手，但很会挑局，经常补上最需要的那个人。");
        }
        if (socialReach >= 12 && items.size() >= 5) {
            return new SocialDecision("social_star", "社牛", "你在场的时候，局一般不会太冷，这种热度是很难装出来的。");
        }
        return new SocialDecision("vibe_builder", "氛围组", "你不一定抢麦，但你在场的时候，整个活动通常会更顺。");
    }

    private AnimalDecision resolveAnimal(String titleKey, String socialKey, int nightPercent, int socialReach) {
        if ("night_king".equals(titleKey) && socialReach >= 10) {
            return new AnimalDecision("哈士奇", "活跃、热闹、爱拉人，夜越深越像刚开机。");
        }
        if ("organizer".equals(socialKey)) {
            return new AnimalDecision("金毛", "组织能力强，人缘稳定，很适合把陌生人拉成一个局。");
        }
        if (nightPercent <= 30) {
            return new AnimalDecision("猫", "出现频率不算夸张，但每次都踩在自己舒服的节奏上。");
        }
        return new AnimalDecision("狼", "执行力高，选局精准，关键时刻总能自己补上效率。");
    }

    private List<String> buildSharpComments(String nickname,
                                            String title,
                                            List<PersonalityDnaItemResponse> dnaList,
                                            int nightPercent,
                                            int createdCount,
                                            int joinedCount,
                                            int socialReach) {
        String favorite = dnaList.isEmpty() ? "整活" : dnaList.getFirst().name();
        List<String> comments = new ArrayList<>();
        comments.add(nickname + " 的开局风格偏 " + title + "，别人刚准备休息，你已经开始问“还差几个人”。");
        comments.add("最近最常出现的主题是 " + favorite + "，说明你对“热闹但不空转”的局有稳定偏好。");
        comments.add("这 30 天发起了 " + createdCount + " 场、参与了 " + joinedCount + " 场，夜场占比 " + nightPercent
            + "% ，一共带动了 " + socialReach + " 人次到场。");
        return comments;
    }

    private List<String> buildHonors(List<ActivityArchiveItemResponse> items,
                                     int createdCount,
                                     int joinedCount,
                                     int nightPercent) {
        List<String> honors = new ArrayList<>();
        if (nightPercent >= 60) {
            honors.add("夜场出勤奖");
        }
        if (createdCount >= 3) {
            honors.add("组局发电机");
        }
        if (joinedCount >= 3) {
            honors.add("补位救场王");
        }
        if (items.stream().anyMatch(item -> item.joinedCount() >= 6)) {
            honors.add("大桌控场选手");
        }
        if (honors.isEmpty()) {
            honors.add("稳定整活选手");
        }
        return honors;
    }

    private String buildSettlementLabel(String expenseMode, int totalAmountFen, String status) {
        if ("host_treat".equals(expenseMode)) {
            return "发起人请客，账单主要做留档";
        }
        if ("aa".equals(expenseMode)) {
            return totalAmountFen > 0 ? ("finished".equals(status) ? "AA 已结清" : "AA 待最终结算") : "AA，但这场还没记消费";
        }
        return "无需结算";
    }

    private String buildHighlight(ActivityArchiveItemResponse item) {
        if (item.startTime() != null && (item.startTime().getHour() >= 22 || item.startTime().getHour() < 5)) {
            return "这是一场明显偏夜场节奏的局，散场时间大概率会比计划再晚一点。";
        }
        if (item.joinedCount() >= item.maxParticipantCount()) {
            return "人数直接拉满，说明这类活动在你的圈子里响应一直不错。";
        }
        if ("creator".equals(item.role())) {
            return "这场是你发起来的，节奏和氛围基本都跟着你的风格走。";
        }
        return "你虽然不是发起人，但这场你是实打实到场补位的那个人。";
    }

    private String buildOverview(ActivityArchiveItemResponse item) {
        String roleLabel = "creator".equals(item.role()) ? "你发起了这场" : "你参与了这场";
        String modeLabel = "offline".equals(item.mode()) ? "线下" : "线上";
        return roleLabel + item.typeName() + " " + modeLabel + "活动，共到场 " + item.joinedCount() + " 人，"
                + buildSettlementLabel(item.expenseMode(), item.totalAmountFen(), item.status()) + "。";
    }

    private String resolveCoverCaption(String title, int score) {
        if (score >= 90) {
            return title + " 已就位，这个月的整活火力值非常在线。";
        }
        if (score >= 80) {
            return title + " 稳定发挥，属于越到周末越容易开局的那类人。";
        }
        return title + " 正在升温，下一场很可能就是你这个月的代表作。";
    }

    private String formatDateTime(OffsetDateTime value) {
        return value == null ? "时间待定" : value.format(DATE_TIME_FORMATTER);
    }

    private String formatFen(int amountFen) {
        return String.format("%.2f 元", amountFen / 100.0);
    }

    private int clampPercent(int value) {
        return Math.min(100, Math.max(0, value));
    }

    private record TitleDecision(String key, String name, String reason) {
    }

    private record SocialDecision(String key, String name, String description) {
    }

    private record AnimalDecision(String name, String description) {
    }

    private record ActivityFinanceCost(ActivityFinanceRowResponse row, int spentFen) {
    }

    private static final class FinanceBucketAccumulator {
        private int spentFen;

        private int activityCount;

        void add(int amountFen) {
            this.spentFen += amountFen;
            this.activityCount++;
        }

        int spentFen() {
            return spentFen;
        }

        int activityCount() {
            return activityCount;
        }
    }
}
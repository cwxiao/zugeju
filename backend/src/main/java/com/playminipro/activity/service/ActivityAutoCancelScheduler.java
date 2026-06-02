package com.playminipro.activity.service;

import com.playminipro.activity.entity.ActivityEntity;
import com.playminipro.activity.mapper.ActivityMapper;
import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ActivityAutoCancelScheduler {

    private final ActivityMapper activityMapper;
    private final ActivityNotificationService notificationService;

    public ActivityAutoCancelScheduler(ActivityMapper activityMapper, ActivityNotificationService notificationService) {
        this.activityMapper = activityMapper;
        this.notificationService = notificationService;
    }

    /**
     * 每 5 分钟扫描孤活动：开始后 2.5 小时提醒，开始后 3 小时取消。
     * SQL 侧已限制“只有 1 个 joined 成员”，这里仅区分提醒窗口和取消窗口。
     */
    @Scheduled(fixedDelayString = "${app.activity.auto-cancel-scan-delay-ms:300000}")
    @Transactional
    public void scanSoloActivities() {
        OffsetDateTime now = OffsetDateTime.now();
        for (ActivityEntity activity : activityMapper.findSoloActivitiesNeedingAutoCancelFlow()) {
            if (activity.getStartTime().plusHours(3).isAfter(now)) {
                notificationService.recordAutoCancelReminder(activity);
                continue;
            }

            if (activityMapper.autoCancel(activity.getId()) > 0) {
                notificationService.recordAutoCancelled(activity);
            }
        }
    }
}
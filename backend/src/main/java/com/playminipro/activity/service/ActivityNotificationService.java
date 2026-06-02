package com.playminipro.activity.service;

import com.playminipro.activity.entity.ActivityEntity;
import com.playminipro.activity.mapper.ActivityNotificationEventMapper;
import com.playminipro.auth.entity.UserEntity;
import com.playminipro.auth.mapper.UserMapper;
import org.springframework.stereotype.Service;

@Service
public class ActivityNotificationService {

    private final ActivityNotificationEventMapper eventMapper;

    private final UserMapper userMapper;

    public ActivityNotificationService(ActivityNotificationEventMapper eventMapper, UserMapper userMapper) {
        this.eventMapper = eventMapper;
        this.userMapper = userMapper;
    }

    /**
     * 记录“新成员加入”活动通知。当前版本先落库形成可调试事件流；接入微信订阅模板后，
     * 可以在这个方法里按 event_type 分发到微信 sendMessage API。
     */
    public void recordMemberJoined(ActivityEntity activity, String actorUserId) {
        UserEntity actor = userMapper.findById(actorUserId);
        String actorName = actor != null ? actor.getNickname() : "新成员";
        String title = "有人加入活动";
        String content = actorName + " 加入了「" + activity.getTitle() + "」";
        String pagePath = "/pages/detail/index?id=" + activity.getId();

        for (String targetUserId : eventMapper.findJoinedMemberIdsExceptActor(activity.getId(), actorUserId)) {
            eventMapper.insert(activity.getId(), targetUserId, actorUserId, "member_joined", title, content, pagePath, "pending");
        }
    }

    /**
     * 自动取消前半小时只提醒一次发起人，避免定时任务每轮重复产生消息。
     */
    public void recordAutoCancelReminder(ActivityEntity activity) {
        String eventType = "auto_cancel_reminder";
        if (eventMapper.existsForTarget(activity.getId(), activity.getCreatorId(), eventType) > 0) {
            return;
        }

        eventMapper.insert(
                activity.getId(),
                activity.getCreatorId(),
                activity.getCreatorId(),
                eventType,
                "活动即将自动取消",
                "「" + activity.getTitle() + "」还没有新成员加入，半小时后会自动取消。",
                "/pages/detail/index?id=" + activity.getId(),
                "pending"
        );
    }

    public void recordAutoCancelled(ActivityEntity activity) {
        eventMapper.insert(
                activity.getId(),
                activity.getCreatorId(),
                activity.getCreatorId(),
                "auto_cancelled",
                "活动已自动取消",
                "「" + activity.getTitle() + "」超过活动时间 3 小时仍只有发起人，已自动取消。",
                "/pages/home/index",
                "pending"
        );
    }
}
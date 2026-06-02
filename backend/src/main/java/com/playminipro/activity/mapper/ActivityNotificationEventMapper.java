package com.playminipro.activity.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ActivityNotificationEventMapper {

    @Insert("""
            INSERT INTO activity_notification_events (
                id, activity_id, target_user_id, actor_user_id, event_type, title, content, page_path, send_status
            ) VALUES (
                gen_random_uuid(), CAST(#{activityId} AS UUID), CAST(#{targetUserId} AS UUID),
                CAST(#{actorUserId} AS UUID), #{eventType}, #{title}, #{content}, #{pagePath}, #{sendStatus}
            )
            """)
    int insert(String activityId,
               String targetUserId,
               String actorUserId,
               String eventType,
               String title,
               String content,
               String pagePath,
               String sendStatus);

    @Select("""
            SELECT CAST(am.user_id AS text)
            FROM activity_members am
            WHERE am.activity_id = CAST(#{activityId} AS UUID)
              AND am.join_status = 'joined'
              AND am.user_id <> CAST(#{actorUserId} AS UUID)
            """)
    List<String> findJoinedMemberIdsExceptActor(String activityId, String actorUserId);

    @Select("""
            SELECT COUNT(1)
            FROM activity_notification_events
            WHERE activity_id = CAST(#{activityId} AS UUID)
              AND target_user_id = CAST(#{targetUserId} AS UUID)
              AND event_type = #{eventType}
            """)
    int existsForTarget(String activityId, String targetUserId, String eventType);

    @Update("""
            UPDATE activity_notification_events
            SET send_status = #{sendStatus},
                sent_at = CASE WHEN #{sendStatus} = 'sent' THEN NOW() ELSE sent_at END
            WHERE id = CAST(#{id} AS UUID)
            """)
    int updateStatus(String id, String sendStatus);
}
package com.playminipro.activity.mapper;

import com.playminipro.activity.dto.ActivitySummaryResponse;
import com.playminipro.activity.dto.ActivityArchiveItemResponse;
import com.playminipro.activity.dto.ActivityFinanceRowResponse;
import com.playminipro.activity.entity.ActivityEntity;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ActivityMapper {

    @Insert("""
            INSERT INTO activities (
                id, creator_id, type_code, type_name, title, description, mode, status,
                target_participant_count, max_participant_count, start_time, end_time,
                meetup_time, meetup_address, venue_address, latitude, longitude, online_join_info,
                expense_mode, expense_flag, allow_member_add_expense
            ) VALUES (
                CAST(#{id} AS UUID), CAST(#{creatorId} AS UUID), #{typeCode}, #{typeName}, #{title}, #{description}, #{mode}, #{status},
                #{targetParticipantCount}, #{maxParticipantCount}, #{startTime}, #{endTime},
                #{meetupTime}, #{meetupAddress}, #{venueAddress}, #{latitude}, #{longitude}, CAST(#{onlineJoinInfo} AS JSONB),
                #{expenseMode}, #{expenseFlag}, #{allowMemberAddExpense}
            )
            """)
    int insert(ActivityEntity activity);

    @Select("""
            SELECT id, creator_id, type_code, type_name, title, description, mode, status,
                   target_participant_count, max_participant_count, start_time, end_time,
                   meetup_time, meetup_address, venue_address, latitude, longitude, online_join_info::text AS online_join_info,
                   expense_mode, expense_flag, allow_member_add_expense, created_at, updated_at
            FROM activities
            WHERE id = CAST(#{id} AS UUID)
            """)
    ActivityEntity findById(String id);

    @Update("""
            UPDATE activities
            SET title = #{title},
                description = #{description},
                mode = #{mode},
                target_participant_count = #{targetParticipantCount},
                max_participant_count = #{maxParticipantCount},
                start_time = #{startTime},
                end_time = #{endTime},
                meetup_time = #{meetupTime},
                meetup_address = #{meetupAddress},
                venue_address = #{venueAddress},
                latitude = #{latitude},
                longitude = #{longitude},
                online_join_info = CAST(#{onlineJoinInfo} AS JSONB),
                expense_mode = #{expenseMode},
                expense_flag = #{expenseFlag},
                allow_member_add_expense = #{allowMemberAddExpense},
                updated_at = NOW()
            WHERE id = CAST(#{id} AS UUID)
              AND creator_id = CAST(#{creatorId} AS UUID)
            """)
    int update(ActivityEntity activity);

    @Update("""
            UPDATE activities
            SET status = 'cancelled',
                updated_at = NOW()
            WHERE id = CAST(#{activityId} AS UUID)
              AND creator_id = CAST(#{creatorId} AS UUID)
            """)
    int cancel(String creatorId, String activityId);

    @Update("""
            UPDATE activities
            SET status = 'full',
                updated_at = NOW()
            WHERE id = CAST(#{activityId} AS UUID)
              AND status = 'recruiting'
              AND (
                  SELECT COUNT(1)
                  FROM activity_members
                  WHERE activity_id = CAST(#{activityId} AS UUID)
                    AND join_status = 'joined'
              ) >= max_participant_count
            """)
    int markFullIfNeeded(String activityId);

    @Update("""
            UPDATE activities
            SET status = 'cancelled',
                updated_at = NOW()
            WHERE id = CAST(#{activityId} AS UUID)
              AND status IN ('draft', 'recruiting', 'full', 'pending_start')
            """)
    int autoCancel(String activityId);

                @Update("""
                                                UPDATE activities
                                                SET status = 'finished',
                                                                end_time = COALESCE(end_time, NOW()),
                                                                updated_at = NOW()
                                                WHERE id = CAST(#{activityId} AS UUID)
                                                        AND creator_id = CAST(#{creatorId} AS UUID)
                                                """)
                int finish(String creatorId, String activityId);

    @Select("""
            SELECT a.id,
                   a.title,
                   a.mode,
                   a.status,
                   a.start_time,
                   COALESCE(a.venue_address, a.meetup_address, '待补充') AS venue_address,
                   COUNT(am2.id) AS joined_count,
                   a.max_participant_count
            FROM activities a
            JOIN activity_members am ON am.activity_id = a.id AND am.user_id = CAST(#{userId} AS UUID) AND am.join_status = 'joined'
            LEFT JOIN activity_members am2 ON am2.activity_id = a.id AND am2.join_status = 'joined'
            WHERE a.status IN ('draft', 'recruiting', 'full', 'pending_start', 'in_progress')
            GROUP BY a.id
            ORDER BY a.start_time ASC
            """)
    List<ActivitySummaryResponse> findMineOngoing(String userId);

        @Select("""
                        SELECT a.id,
                                   a.title,
                                   a.type_name AS typeName,
                                   am.role,
                                   a.status,
                                   a.mode,
                                   a.start_time AS startTime,
                                   CASE WHEN am.role = 'creator' THEN a.created_at ELSE am.joined_at END AS roleTime,
                                   COALESCE(a.venue_address, a.meetup_address, '待补充') AS place,
                                   COALESCE(ms.joined_count, 0) AS joinedCount,
                                   a.max_participant_count AS maxParticipantCount,
                                   COALESCE(es.total_amount_fen, 0) AS totalAmountFen,
                                   a.expense_mode AS expenseMode,
                                   '' AS settlementLabel,
                                   '' AS highlight,
                                   '' AS overview
                        FROM activities a
                        JOIN activity_members am ON am.activity_id = a.id
                         AND am.user_id = CAST(#{userId} AS UUID)
                         AND am.join_status = 'joined'
                        LEFT JOIN (
                                SELECT activity_id, COUNT(1) AS joined_count
                                FROM activity_members
                                WHERE join_status = 'joined'
                                GROUP BY activity_id
                        ) ms ON ms.activity_id = a.id
                        LEFT JOIN (
                                SELECT activity_id, SUM(amount_fen) AS total_amount_fen
                                FROM activity_expenses
                                GROUP BY activity_id
                        ) es ON es.activity_id = a.id
                        ORDER BY CASE WHEN am.role = 'creator' THEN a.created_at ELSE am.joined_at END DESC, a.start_time DESC
                        """)
        List<ActivityArchiveItemResponse> findMineArchive(String userId);

                        @Select("""
                                        SELECT a.id AS activityId,
                                                   am.role,
                                                   a.status,
                                                   a.start_time AS startTime,
                                                   COALESCE(ms.joined_count, 0) AS joinedCount,
                                                   COALESCE(es.total_amount_fen, 0) AS totalAmountFen,
                                                   a.expense_mode AS expenseMode
                                        FROM activities a
                                        JOIN activity_members am ON am.activity_id = a.id
                                         AND am.user_id = CAST(#{userId} AS UUID)
                                         AND am.join_status = 'joined'
                                        LEFT JOIN (
                                                SELECT activity_id, COUNT(1) AS joined_count
                                                FROM activity_members
                                                WHERE join_status = 'joined'
                                                GROUP BY activity_id
                                        ) ms ON ms.activity_id = a.id
                                        LEFT JOIN (
                                                SELECT activity_id, SUM(amount_fen) AS total_amount_fen
                                                FROM activity_expenses
                                                GROUP BY activity_id
                                        ) es ON es.activity_id = a.id
                                        WHERE a.status <> 'cancelled'
                                        ORDER BY a.start_time DESC
                                        """)
                        List<ActivityFinanceRowResponse> findMineFinanceRows(String userId);

    @Select("""
            SELECT COUNT(1)
            FROM activities a
            JOIN activity_members am ON am.activity_id = a.id
            WHERE a.id = CAST(#{activityId} AS UUID)
              AND am.user_id = CAST(#{userId} AS UUID)
              AND am.join_status = 'joined'
            """)
    int existsMember(String activityId, String userId);

    @Select("""
            SELECT COUNT(1)
            FROM activity_members
            WHERE activity_id = CAST(#{activityId} AS UUID)
              AND join_status = 'joined'
            """)
    int countJoinedMembers(String activityId);

    @Select("""
            SELECT a.id, a.creator_id, a.type_code, a.type_name, a.title, a.description, a.mode, a.status,
                   a.target_participant_count, a.max_participant_count, a.start_time, a.end_time,
                   a.meetup_time, a.meetup_address, a.venue_address, a.latitude, a.longitude, a.online_join_info::text AS online_join_info,
                   a.expense_mode, a.expense_flag, a.allow_member_add_expense, a.created_at, a.updated_at
            FROM activities a
            WHERE a.status IN ('draft', 'recruiting', 'full', 'pending_start')
              AND a.start_time <= NOW() - INTERVAL '150 minutes'
              AND (
                  SELECT COUNT(1)
                  FROM activity_members am
                  WHERE am.activity_id = a.id
                    AND am.join_status = 'joined'
              ) = 1
            """)
    List<ActivityEntity> findSoloActivitiesNeedingAutoCancelFlow();
}
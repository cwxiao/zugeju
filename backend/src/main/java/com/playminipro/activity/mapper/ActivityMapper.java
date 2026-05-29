package com.playminipro.activity.mapper;

import com.playminipro.activity.dto.ActivitySummaryResponse;
import com.playminipro.activity.entity.ActivityEntity;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ActivityMapper {

    @Insert("""
            INSERT INTO activities (
                id, creator_id, type_code, type_name, title, description, mode, status,
                target_participant_count, max_participant_count, start_time, end_time,
                meetup_time, meetup_address, venue_address, online_join_info,
                expense_mode, expense_flag, allow_member_add_expense
            ) VALUES (
                CAST(#{id} AS UUID), CAST(#{creatorId} AS UUID), #{typeCode}, #{typeName}, #{title}, #{description}, #{mode}, #{status},
                #{targetParticipantCount}, #{maxParticipantCount}, #{startTime}, #{endTime},
                #{meetupTime}, #{meetupAddress}, #{venueAddress}, CAST(#{onlineJoinInfo} AS JSONB),
                #{expenseMode}, #{expenseFlag}, #{allowMemberAddExpense}
            )
            """)
    int insert(ActivityEntity activity);

    @Select("""
            SELECT id, creator_id, type_code, type_name, title, description, mode, status,
                   target_participant_count, max_participant_count, start_time, end_time,
                   meetup_time, meetup_address, venue_address, online_join_info::text AS online_join_info,
                   expense_mode, expense_flag, allow_member_add_expense, created_at, updated_at
            FROM activities
            WHERE id = CAST(#{id} AS UUID)
            """)
    ActivityEntity findById(String id);

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
}
package com.playminipro.activity.mapper;

import com.playminipro.activity.dto.ActivityMemberResponse;
import com.playminipro.activity.entity.ActivityMemberEntity;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ActivityMemberMapper {

    @Insert("""
            INSERT INTO activity_members (id, activity_id, user_id, role, join_status)
            VALUES (CAST(#{id} AS UUID), CAST(#{activityId} AS UUID), CAST(#{userId} AS UUID), #{role}, #{joinStatus})
            """)
    int insert(ActivityMemberEntity activityMember);

    @Insert("""
            INSERT INTO activity_members (id, activity_id, user_id, role, join_status, joined_at, updated_at)
            VALUES (CAST(#{id} AS UUID), CAST(#{activityId} AS UUID), CAST(#{userId} AS UUID), 'member', 'joined', NOW(), NOW())
            ON CONFLICT (activity_id, user_id)
            DO UPDATE SET join_status = 'joined',
                          joined_at = NOW(),
                          updated_at = NOW()
            WHERE activity_members.join_status <> 'joined'
            """)
    int joinAsMember(String id, String activityId, String userId);

    @Select("""
            SELECT COUNT(1)
            FROM activity_members
            WHERE activity_id = CAST(#{activityId} AS UUID)
              AND user_id = CAST(#{userId} AS UUID)
              AND join_status = 'joined'
            """)
    int existsJoinedMember(String activityId, String userId);

    @Select("""
            SELECT COUNT(1)
            FROM activity_members
            WHERE activity_id = CAST(#{activityId} AS UUID)
              AND user_id = CAST(#{userId} AS UUID)
              AND role = 'creator'
              AND join_status = 'joined'
            """)
    int existsJoinedCreator(String activityId, String userId);

    @Update("""
            UPDATE activity_members
            SET join_status = 'quit',
                updated_at = NOW()
            WHERE activity_id = CAST(#{activityId} AS UUID)
              AND user_id = CAST(#{userId} AS UUID)
              AND role <> 'creator'
            """)
    int decline(String activityId, String userId);

    @Select("""
            SELECT u.id AS user_id,
                   u.nickname,
                   u.avatar_url,
                   am.role,
                   am.join_status
            FROM activity_members am
            JOIN users u ON u.id = am.user_id
            WHERE am.activity_id = CAST(#{activityId} AS UUID)
              AND am.join_status = 'joined'
            ORDER BY am.created_at ASC
            """)
    List<ActivityMemberResponse> findJoinedMembers(String activityId);
}
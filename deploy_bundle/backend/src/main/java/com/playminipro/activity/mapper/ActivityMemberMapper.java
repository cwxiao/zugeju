package com.playminipro.activity.mapper;

import com.playminipro.activity.dto.ActivityMemberResponse;
import com.playminipro.activity.entity.ActivityMemberEntity;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ActivityMemberMapper {

    @Insert("""
            INSERT INTO activity_members (id, activity_id, user_id, role, join_status)
            VALUES (CAST(#{id} AS UUID), CAST(#{activityId} AS UUID), CAST(#{userId} AS UUID), #{role}, #{joinStatus})
            """)
    int insert(ActivityMemberEntity activityMember);

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
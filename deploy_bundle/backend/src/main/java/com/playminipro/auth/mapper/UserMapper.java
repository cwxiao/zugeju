package com.playminipro.auth.mapper;

import com.playminipro.auth.entity.UserEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserMapper {

    @Select("""
            SELECT id, open_id, nickname, avatar_url, phone_number, created_at, updated_at
            FROM users
            WHERE open_id = #{openId}
            """)
    UserEntity findByOpenId(String openId);

    @Select("""
            SELECT id, open_id, nickname, avatar_url, phone_number, created_at, updated_at
            FROM users
            WHERE id = CAST(#{id} AS UUID)
            """)
    UserEntity findById(String id);

    @Insert("""
            INSERT INTO users (id, open_id, nickname, avatar_url, phone_number)
            VALUES (CAST(#{id} AS UUID), #{openId}, #{nickname}, #{avatarUrl}, #{phoneNumber})
            """)
    int insert(UserEntity user);

    @Update("""
            UPDATE users
            SET nickname = #{nickname},
                avatar_url = #{avatarUrl},
                phone_number = #{phoneNumber},
                updated_at = NOW()
            WHERE id = CAST(#{id} AS UUID)
            """)
    int updateProfile(UserEntity user);
}
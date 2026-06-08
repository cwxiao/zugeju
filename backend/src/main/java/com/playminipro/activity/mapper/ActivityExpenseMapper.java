package com.playminipro.activity.mapper;

import com.playminipro.activity.dto.ActivityExpenseItemResponse;
import com.playminipro.activity.entity.ActivityExpenseEntity;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ActivityExpenseMapper {

    @Insert("""
            INSERT INTO activity_expenses (
                id, activity_id, payer_user_id, item_name, amount_fen
            ) VALUES (
                CAST(#{id} AS UUID), CAST(#{activityId} AS UUID), CAST(#{payerUserId} AS UUID), #{itemName}, #{amountFen}
            )
            """)
    int insert(ActivityExpenseEntity expense);

    @Select("""
            SELECT ae.id,
                   ae.item_name,
                   ae.amount_fen,
                   ae.payer_user_id,
                   u.nickname AS payer_nickname
            FROM activity_expenses ae
            JOIN users u ON u.id = ae.payer_user_id
            WHERE ae.activity_id = CAST(#{activityId} AS UUID)
            ORDER BY ae.created_at DESC
            """)
    List<ActivityExpenseItemResponse> findByActivityId(String activityId);

    @Select("""
            SELECT COALESCE(SUM(amount_fen), 0)
            FROM activity_expenses
            WHERE activity_id = CAST(#{activityId} AS UUID)
            """)
    int sumAmountFenByActivityId(String activityId);

    @Select("""
            SELECT id, activity_id, payer_user_id, item_name, amount_fen, created_at, updated_at
            FROM activity_expenses
            WHERE id = CAST(#{id} AS UUID)
            """)
    ActivityExpenseEntity findById(String id);

    @Delete("""
            DELETE FROM activity_expenses
            WHERE id = CAST(#{id} AS UUID)
            """)
    int deleteById(String id);

    @Update("""
            UPDATE activity_expenses
            SET item_name = #{itemName},
                amount_fen = #{amountFen},
                payer_user_id = CAST(#{payerUserId} AS UUID),
                updated_at = NOW()
            WHERE id = CAST(#{id} AS UUID)
            """)
    int update(String id, String itemName, Integer amountFen, String payerUserId);
}
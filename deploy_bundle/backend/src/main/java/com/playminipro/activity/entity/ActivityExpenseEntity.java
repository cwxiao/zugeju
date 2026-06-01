package com.playminipro.activity.entity;

import java.time.OffsetDateTime;

public class ActivityExpenseEntity {

    private String id;

    private String activityId;

    private String payerUserId;

    private String itemName;

    private Integer amountFen;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActivityId() { return activityId; }
    public void setActivityId(String activityId) { this.activityId = activityId; }
    public String getPayerUserId() { return payerUserId; }
    public void setPayerUserId(String payerUserId) { this.payerUserId = payerUserId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public Integer getAmountFen() { return amountFen; }
    public void setAmountFen(Integer amountFen) { this.amountFen = amountFen; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
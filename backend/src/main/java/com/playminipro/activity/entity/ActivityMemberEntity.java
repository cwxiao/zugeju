package com.playminipro.activity.entity;

public class ActivityMemberEntity {

    private String id;

    private String activityId;

    private String userId;

    private String role;

    private String joinStatus;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActivityId() { return activityId; }
    public void setActivityId(String activityId) { this.activityId = activityId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getJoinStatus() { return joinStatus; }
    public void setJoinStatus(String joinStatus) { this.joinStatus = joinStatus; }
}
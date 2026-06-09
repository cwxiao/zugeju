package com.playminipro.activity.entity;

import java.time.OffsetDateTime;

public class ActivityEntity {

    private String id;

    private String creatorId;

    private String typeCode;

    private String typeName;

    private String title;

    private String description;

    private String mode;

    private String status;

    private Integer targetParticipantCount;

    private Integer maxParticipantCount;

    private OffsetDateTime startTime;

    private OffsetDateTime endTime;

    private OffsetDateTime meetupTime;

    private String meetupAddress;

    private String venueAddress;

    private Double latitude;

    private Double longitude;

    private String onlineJoinInfo;

    private String expenseMode;

    private Integer expenseFlag;

    private Boolean allowMemberAddExpense;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String creatorId) { this.creatorId = creatorId; }
    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTargetParticipantCount() { return targetParticipantCount; }
    public void setTargetParticipantCount(Integer targetParticipantCount) { this.targetParticipantCount = targetParticipantCount; }
    public Integer getMaxParticipantCount() { return maxParticipantCount; }
    public void setMaxParticipantCount(Integer maxParticipantCount) { this.maxParticipantCount = maxParticipantCount; }
    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
    public OffsetDateTime getMeetupTime() { return meetupTime; }
    public void setMeetupTime(OffsetDateTime meetupTime) { this.meetupTime = meetupTime; }
    public String getMeetupAddress() { return meetupAddress; }
    public void setMeetupAddress(String meetupAddress) { this.meetupAddress = meetupAddress; }
    public String getVenueAddress() { return venueAddress; }
  public void setVenueAddress(String venueAddress) { this.venueAddress = venueAddress; }
  public Double getLatitude() { return latitude; }
  public void setLatitude(Double latitude) { this.latitude = latitude; }
  public Double getLongitude() { return longitude; }
  public void setLongitude(Double longitude) { this.longitude = longitude; }
  public String getOnlineJoinInfo() { return onlineJoinInfo; }
    public void setOnlineJoinInfo(String onlineJoinInfo) { this.onlineJoinInfo = onlineJoinInfo; }
    public String getExpenseMode() { return expenseMode; }
    public void setExpenseMode(String expenseMode) { this.expenseMode = expenseMode; }
    public Integer getExpenseFlag() { return expenseFlag; }
    public void setExpenseFlag(Integer expenseFlag) { this.expenseFlag = expenseFlag; }
    public Boolean getAllowMemberAddExpense() { return allowMemberAddExpense; }
    public void setAllowMemberAddExpense(Boolean allowMemberAddExpense) { this.allowMemberAddExpense = allowMemberAddExpense; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
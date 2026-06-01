package com.playminipro.activity.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateActivityRequest(
        @NotBlank(message = "typeCode is required") @Size(max = 64) String typeCode,
        @NotBlank(message = "typeName is required") @Size(max = 64) String typeName,
        @NotBlank(message = "title is required") @Size(max = 128) String title,
        @Size(max = 1000) String description,
        @NotBlank(message = "mode is required") @Pattern(regexp = "online|offline", message = "mode must be online or offline") String mode,
        @NotNull(message = "targetParticipantCount is required") @Min(value = 1) Integer targetParticipantCount,
        @NotNull(message = "maxParticipantCount is required") @Min(value = 1) Integer maxParticipantCount,
        @NotNull(message = "startTime is required") OffsetDateTime startTime,
        OffsetDateTime endTime,
        OffsetDateTime meetupTime,
        String meetupAddress,
        String venueAddress,
        JsonNode onlineJoinInfo,
        @NotBlank(message = "expenseMode is required") @Pattern(regexp = "none|aa|host_treat|designated_treat", message = "expenseMode is invalid") String expenseMode,
        @NotNull(message = "expenseFlag is required") @Min(0) @Max(1) Integer expenseFlag,
        @NotNull(message = "allowMemberAddExpense is required") Boolean allowMemberAddExpense
) {
}
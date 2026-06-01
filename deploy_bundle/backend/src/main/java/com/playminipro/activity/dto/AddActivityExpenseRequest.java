package com.playminipro.activity.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddActivityExpenseRequest(
        @NotBlank(message = "itemName is required") @Size(max = 64) String itemName,
        @NotNull(message = "amountFen is required") @Min(value = 1, message = "amountFen must be greater than 0") Integer amountFen
) {
}
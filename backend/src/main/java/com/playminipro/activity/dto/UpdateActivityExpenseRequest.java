package com.playminipro.activity.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateActivityExpenseRequest(
        @Size(max = 64) String itemName,
        @Min(value = 1, message = "amountFen must be greater than 0") Integer amountFen,
        String payerUserId
) {
}

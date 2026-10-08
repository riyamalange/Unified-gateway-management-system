package com.unipay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class RefundRequest {

    private Long transactionId;
    private String transactionCode; // e.g. TXN-10001
    private Long userId;            // Logged-in customer ID

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Refund amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Reason is required")
    private String reason;

    public RefundRequest() {}

    public RefundRequest(Long transactionId, String transactionCode, Long userId, BigDecimal amount, String reason) {
        this.transactionId = transactionId;
        this.transactionCode = transactionCode;
        this.userId = userId;
        this.amount = amount;
        this.reason = reason;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

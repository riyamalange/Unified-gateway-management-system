package com.unipay.dto;

import java.math.BigDecimal;

public class MerchantSummaryDTO {

    private Long merchantId;
    private String merchantName;
    private long totalTransactions;
    private long successfulPayments;
    private long failedPayments;
    private long pendingPayments;
    private BigDecimal totalPaymentVolume;

    public MerchantSummaryDTO() {}

    public MerchantSummaryDTO(Long merchantId, String merchantName, long totalTransactions, 
                              long successfulPayments, long failedPayments, long pendingPayments, 
                              BigDecimal totalPaymentVolume) {
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.totalTransactions = totalTransactions;
        this.successfulPayments = successfulPayments;
        this.failedPayments = failedPayments;
        this.pendingPayments = pendingPayments;
        this.totalPaymentVolume = totalPaymentVolume != null ? totalPaymentVolume : BigDecimal.ZERO;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getSuccessfulPayments() {
        return successfulPayments;
    }

    public void setSuccessfulPayments(long successfulPayments) {
        this.successfulPayments = successfulPayments;
    }

    public long getFailedPayments() {
        return failedPayments;
    }

    public void setFailedPayments(long failedPayments) {
        this.failedPayments = failedPayments;
    }

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public BigDecimal getTotalPaymentVolume() {
        return totalPaymentVolume;
    }

    public void setTotalPaymentVolume(BigDecimal totalPaymentVolume) {
        this.totalPaymentVolume = totalPaymentVolume;
    }
}

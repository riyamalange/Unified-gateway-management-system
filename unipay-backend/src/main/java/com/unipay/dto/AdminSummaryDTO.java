package com.unipay.dto;

import java.math.BigDecimal;

public class AdminSummaryDTO {

    private long totalMerchants;
    private long totalGateways;
    private long totalTransactions;
    private long successfulPayments;
    private long failedPayments;
    private long pendingPayments;
    private BigDecimal totalPaymentVolume;

    public AdminSummaryDTO() {}

    public AdminSummaryDTO(long totalMerchants, long totalGateways, long totalTransactions, 
                           long successfulPayments, long failedPayments, long pendingPayments, 
                           BigDecimal totalPaymentVolume) {
        this.totalMerchants = totalMerchants;
        this.totalGateways = totalGateways;
        this.totalTransactions = totalTransactions;
        this.successfulPayments = successfulPayments;
        this.failedPayments = failedPayments;
        this.pendingPayments = pendingPayments;
        this.totalPaymentVolume = totalPaymentVolume != null ? totalPaymentVolume : BigDecimal.ZERO;
    }

    public long getTotalMerchants() {
        return totalMerchants;
    }

    public void setTotalMerchants(long totalMerchants) {
        this.totalMerchants = totalMerchants;
    }

    public long getTotalGateways() {
        return totalGateways;
    }

    public void setTotalGateways(long totalGateways) {
        this.totalGateways = totalGateways;
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

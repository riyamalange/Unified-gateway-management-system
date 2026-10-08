package com.unipay.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "settlement_id")
    private Long settlementId;

    @Column(name = "settlement_code", nullable = false, unique = true, length = 50)
    private String settlementCode; // e.g. SET-30001

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gateway_id", nullable = false)
    private PaymentGateway gateway;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "fee_deducted", nullable = false, precision = 12, scale = 2)
    private BigDecimal feeDeducted;

    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Column(nullable = false, length = 20)
    private String status = "SETTLED"; // SETTLED, PENDING

    @Column(name = "settlement_date")
    private LocalDateTime settlementDate = LocalDateTime.now();

    public Settlement() {}

    public Settlement(Long settlementId, String settlementCode, Merchant merchant, PaymentGateway gateway, 
                      BigDecimal grossAmount, BigDecimal feeDeducted, BigDecimal netAmount, String status) {
        this.settlementId = settlementId;
        this.settlementCode = settlementCode;
        this.merchant = merchant;
        this.gateway = gateway;
        this.grossAmount = grossAmount;
        this.feeDeducted = feeDeducted;
        this.netAmount = netAmount;
        this.status = status;
        this.settlementDate = LocalDateTime.now();
    }

    public Long getSettlementId() {
        return settlementId;
    }

    public void setSettlementId(Long settlementId) {
        this.settlementId = settlementId;
    }

    public String getSettlementCode() {
        return settlementCode;
    }

    public void setSettlementCode(String settlementCode) {
        this.settlementCode = settlementCode;
    }

    public Merchant getMerchant() {
        return merchant;
    }

    public void setMerchant(Merchant merchant) {
        this.merchant = merchant;
    }

    public PaymentGateway getGateway() {
        return gateway;
    }

    public void setGateway(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(BigDecimal grossAmount) {
        this.grossAmount = grossAmount;
    }

    public BigDecimal getFeeDeducted() {
        return feeDeducted;
    }

    public void setFeeDeducted(BigDecimal feeDeducted) {
        this.feeDeducted = feeDeducted;
    }

    public BigDecimal getNetAmount() {
        return netAmount;
    }

    public void setNetAmount(BigDecimal netAmount) {
        this.netAmount = netAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(LocalDateTime settlementDate) {
        this.settlementDate = settlementDate;
    }
}

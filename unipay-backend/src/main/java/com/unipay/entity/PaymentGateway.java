package com.unipay.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_gateways")
public class PaymentGateway {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gateway_id")
    private Long gatewayId;

    @Column(nullable = false, unique = true, length = 50)
    private String name; // Razorpay, Stripe, PayPal, PayU

    @Column(nullable = false, unique = true, length = 50)
    private String code; // RAZORPAY, STRIPE, PAYPAL, PAYU

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE or INACTIVE

    @Column(name = "fee_percent", precision = 5, scale = 2)
    private BigDecimal feePercent = new BigDecimal("1.50");

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PaymentGateway() {}

    public PaymentGateway(Long gatewayId, String name, String code, String status, BigDecimal feePercent) {
        this.gatewayId = gatewayId;
        this.name = name;
        this.code = code;
        this.status = status;
        this.feePercent = feePercent;
        this.createdAt = LocalDateTime.now();
    }

    public Long getGatewayId() {
        return gatewayId;
    }

    public void setGatewayId(Long gatewayId) {
        this.gatewayId = gatewayId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getFeePercent() {
        return feePercent;
    }

    public void setFeePercent(BigDecimal feePercent) {
        this.feePercent = feePercent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

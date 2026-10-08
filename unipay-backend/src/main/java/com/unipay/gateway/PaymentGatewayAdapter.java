package com.unipay.gateway;

import com.unipay.dto.PaymentRequest;

/**
 * PaymentGatewayAdapter: The Strategy / Adapter interface for UNIPAY.
 * Demonstrates the Open/Closed Principle and Adapter Design Pattern in Software Engineering.
 * UNIPAY communicates solely through this interface without knowing proprietary gateway API details.
 */
public interface PaymentGatewayAdapter {

    /**
     * Unique gateway code identifier, e.g. "RAZORPAY", "STRIPE", "PAYPAL", "PAYU".
     */
    String getGatewayCode();

    /**
     * Friendly display name of the gateway provider.
     */
    String getGatewayName();

    /**
     * Executes the simulated transaction lifecycle with the payment provider.
     *
     * @param request The normalized UNIPAY payment request
     * @return Normalized GatewayResult containing status and reference identifiers
     */
    GatewayResult processPayment(PaymentRequest request);
}

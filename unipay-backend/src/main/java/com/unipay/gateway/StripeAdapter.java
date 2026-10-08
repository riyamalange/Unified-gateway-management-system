package com.unipay.gateway;

import com.unipay.dto.PaymentRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StripeAdapter implements PaymentGatewayAdapter {

    @Override
    public String getGatewayCode() {
        return "STRIPE";
    }

    @Override
    public String getGatewayName() {
        return "Stripe";
    }

    @Override
    public GatewayResult processPayment(PaymentRequest request) {
        // Simulated Stripe payment tokenization and charge logic
        String refId = "ch_stripe_" + UUID.randomUUID().toString().substring(0, 8);

        return GatewayResult.success(
            refId,
            "Stripe Payment Intent captured for Card settlement: " + refId + " for Order " + request.getOrderId()
        );
    }
}

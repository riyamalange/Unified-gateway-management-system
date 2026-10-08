package com.unipay.gateway;

import com.unipay.dto.PaymentRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PayPalAdapter implements PaymentGatewayAdapter {

    @Override
    public String getGatewayCode() {
        return "PAYPAL";
    }

    @Override
    public String getGatewayName() {
        return "PayPal";
    }

    @Override
    public GatewayResult processPayment(PaymentRequest request) {
        // Simulated PayPal express checkout / wallet logic
        String refId = "pp_order_" + UUID.randomUUID().toString().substring(0, 8);

        return GatewayResult.success(
            refId,
            "PayPal wallet order captured successfully: " + refId + " for Order " + request.getOrderId()
        );
    }
}

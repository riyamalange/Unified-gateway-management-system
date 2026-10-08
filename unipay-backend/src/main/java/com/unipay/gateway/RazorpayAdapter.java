package com.unipay.gateway;

import com.unipay.dto.PaymentRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class RazorpayAdapter implements PaymentGatewayAdapter {

    @Override
    public String getGatewayCode() {
        return "RAZORPAY";
    }

    @Override
    public String getGatewayName() {
        return "Razorpay";
    }

    @Override
    public GatewayResult processPayment(PaymentRequest request) {
        // Simulated Razorpay transaction logic
        String refId = "rzp_pay_" + UUID.randomUUID().toString().substring(0, 8);
        
        // Academic simulation: successful payment simulation
        return GatewayResult.success(
            refId,
            "Razorpay Payment Gateway verified UPI/Instant payment: " + refId + " for Order " + request.getOrderId()
        );
    }
}

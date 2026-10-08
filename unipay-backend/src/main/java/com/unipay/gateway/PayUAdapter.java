package com.unipay.gateway;

import com.unipay.dto.PaymentRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PayUAdapter implements PaymentGatewayAdapter {

    @Override
    public String getGatewayCode() {
        return "PAYU";
    }

    @Override
    public String getGatewayName() {
        return "PayU";
    }

    @Override
    public GatewayResult processPayment(PaymentRequest request) {
        // Simulated PayU net-banking / wallet gateway logic
        String refId = "payu_txn_" + UUID.randomUUID().toString().substring(0, 8);

        return GatewayResult.success(
            refId,
            "PayU Gateway approved direct banking transaction: " + refId + " for Order " + request.getOrderId()
        );
    }
}

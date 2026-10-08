package com.unipay.service;

import com.unipay.entity.PaymentGateway;
import com.unipay.repository.PaymentGatewayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoutingService {

    private final PaymentGatewayRepository gatewayRepository;

    @Autowired
    public RoutingService(PaymentGatewayRepository gatewayRepository) {
        this.gatewayRepository = gatewayRepository;
    }

    /**
     * Determines the optimal active payment gateway based on payment method and gateway availability.
     * Rule-based routing engine:
     *   UPI          -> Razorpay (preferred)
     *   Card         -> Stripe (preferred)
     *   Net Banking  -> PayU (preferred)
     *   Wallet       -> PayU (preferred)
     *   PayPal       -> PayPal (preferred)
     *
     * Fallback mechanism:
     * If preferred gateway is INACTIVE, failover to the next available ACTIVE gateway.
     */
    public PaymentGateway route(String paymentMethod) {
        String preferredCode = determinePreferredGatewayCode(paymentMethod);

        // Check if preferred gateway is ACTIVE in database
        Optional<PaymentGateway> preferredOpt = gatewayRepository.findByCodeIgnoreCase(preferredCode);
        if (preferredOpt.isPresent() && "ACTIVE".equalsIgnoreCase(preferredOpt.get().getStatus())) {
            return preferredOpt.get();
        }

        // Preferred gateway is INACTIVE or missing - execute Failover Routing
        List<PaymentGateway> activeGateways = gatewayRepository.findByStatus("ACTIVE");
        if (!activeGateways.isEmpty()) {
            return activeGateways.get(0);
        }

        // If no gateways are active, failover to whatever exists or throw error
        throw new IllegalStateException("Payment routing failure: All payment gateways are currently INACTIVE.");
    }

    private String determinePreferredGatewayCode(String paymentMethod) {
        if (paymentMethod == null) return "RAZORPAY";
        String method = paymentMethod.trim().toUpperCase();

        switch (method) {
            case "UPI":
                return "RAZORPAY";
            case "CARD":
            case "CREDIT CARD":
            case "DEBIT CARD":
                return "STRIPE";
            case "NET BANKING":
            case "NETBANKING":
                return "PAYU";
            case "WALLET":
                return "PAYU";
            case "PAYPAL":
                return "PAYPAL";
            default:
                return "RAZORPAY";
        }
    }
}

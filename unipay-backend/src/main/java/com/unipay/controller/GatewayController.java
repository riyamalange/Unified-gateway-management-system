package com.unipay.controller;

import com.unipay.entity.PaymentGateway;
import com.unipay.repository.PaymentGatewayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/gateways")
@CrossOrigin(origins = "*")
public class GatewayController {

    private final PaymentGatewayRepository gatewayRepository;

    @Autowired
    public GatewayController(PaymentGatewayRepository gatewayRepository) {
        this.gatewayRepository = gatewayRepository;
    }

    @GetMapping
    public ResponseEntity<List<PaymentGateway>> getAllGateways() {
        return ResponseEntity.ok(gatewayRepository.findAll());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateGatewayStatus(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Optional<PaymentGateway> gatewayOpt = gatewayRepository.findById(id);
        if (gatewayOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PaymentGateway gateway = gatewayOpt.get();
        String newStatus;
        if (body != null && body.containsKey("status")) {
            newStatus = body.get("status").toUpperCase();
        } else {
            // Toggle status if not provided
            newStatus = "ACTIVE".equalsIgnoreCase(gateway.getStatus()) ? "INACTIVE" : "ACTIVE";
        }

        gateway.setStatus(newStatus);
        PaymentGateway updated = gatewayRepository.save(gateway);

        return ResponseEntity.ok(updated);
    }
}

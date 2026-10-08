package com.unipay.controller;

import com.unipay.dto.RefundRequest;
import com.unipay.entity.Refund;
import com.unipay.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
@CrossOrigin(origins = "*")
public class RefundController {

    private final RefundService refundService;

    @Autowired
    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @GetMapping
    public ResponseEntity<List<Refund>> getAllRefunds() {
        return ResponseEntity.ok(refundService.getAllRefunds());
    }

    @PostMapping
    public ResponseEntity<?> createRefund(@Valid @RequestBody RefundRequest request) {
        try {
            Refund refund = refundService.processRefund(request);
            return ResponseEntity.ok(refund);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRefund(@PathVariable("id") Long id) {
        try {
            Refund refund = refundService.approveRefund(id);
            return ResponseEntity.ok(refund);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRefund(@PathVariable("id") Long id) {
        try {
            Refund refund = refundService.rejectRefund(id);
            return ResponseEntity.ok(refund);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        try {
            String status = body != null ? body.get("status") : "";
            Refund refund = refundService.updateStatus(id, status);
            return ResponseEntity.ok(refund);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

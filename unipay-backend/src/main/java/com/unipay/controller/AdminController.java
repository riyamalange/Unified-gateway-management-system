package com.unipay.controller;

import com.unipay.dto.AdminSummaryDTO;
import com.unipay.entity.Merchant;
import com.unipay.entity.PaymentGateway;
import com.unipay.entity.Refund;
import com.unipay.entity.Transaction;
import com.unipay.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final MerchantRepository merchantRepository;
    private final PaymentGatewayRepository gatewayRepository;
    private final TransactionRepository transactionRepository;
    private final RefundRepository refundRepository;

    @Autowired
    public AdminController(MerchantRepository merchantRepository,
                           PaymentGatewayRepository gatewayRepository,
                           TransactionRepository transactionRepository,
                           RefundRepository refundRepository) {
        this.merchantRepository = merchantRepository;
        this.gatewayRepository = gatewayRepository;
        this.transactionRepository = transactionRepository;
        this.refundRepository = refundRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminSummaryDTO> getAdminSummary() {
        long totalMerchants = merchantRepository.count();
        long totalGateways = gatewayRepository.count();
        long totalTxns = transactionRepository.count();
        long successTxns = transactionRepository.countByStatus("SUCCESS");
        long failedTxns = transactionRepository.countByStatus("FAILED");
        long pendingTxns = transactionRepository.countByStatus("PENDING");
        BigDecimal totalVolume = transactionRepository.sumTotalSuccessfulVolume();

        AdminSummaryDTO summary = new AdminSummaryDTO(
                totalMerchants,
                totalGateways,
                totalTxns,
                successTxns,
                failedTxns,
                pendingTxns,
                totalVolume
        );

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/merchants")
    public ResponseEntity<List<Merchant>> getAdminMerchants() {
        return ResponseEntity.ok(merchantRepository.findAll());
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Transaction>> getAdminTransactions() {
        return ResponseEntity.ok(transactionRepository.findAllByOrderByTransactionDateDesc());
    }

    @GetMapping("/gateways")
    public ResponseEntity<List<PaymentGateway>> getAdminGateways() {
        return ResponseEntity.ok(gatewayRepository.findAll());
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<Refund>> getAdminRefunds() {
        return ResponseEntity.ok(refundRepository.findAllByOrderByRefundDateDesc());
    }
}

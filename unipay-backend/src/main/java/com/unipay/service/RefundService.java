package com.unipay.service;

import com.unipay.dto.RefundRequest;
import com.unipay.entity.Refund;
import com.unipay.entity.Transaction;
import com.unipay.repository.RefundRepository;
import com.unipay.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class RefundService {

    private final RefundRepository refundRepository;
    private final TransactionRepository transactionRepository;

    private static final List<String> ALLOWED_REASONS = Arrays.asList(
            "Order cancelled",
            "Duplicate payment",
            "Payment issue",
            "Other"
    );

    @Autowired
    public RefundService(RefundRepository refundRepository, TransactionRepository transactionRepository) {
        this.refundRepository = refundRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<Refund> getAllRefunds() {
        return refundRepository.findAllByOrderByRefundDateDesc();
    }

    public List<Refund> getMerchantRefunds(Long merchantId) {
        return refundRepository.findByTransactionMerchantMerchantIdOrderByRefundDateDesc(merchantId);
    }

    public List<Refund> getUserRefunds(Long userId) {
        return refundRepository.findByTransactionUserUserIdOrderByRefundDateDesc(userId);
    }

    @Transactional
    public Refund processRefund(RefundRequest request) {
        // 1. Transaction exists check (by transactionCode or transactionId)
        Optional<Transaction> txnOpt = Optional.empty();
        if (request.getTransactionCode() != null && !request.getTransactionCode().trim().isEmpty()) {
            txnOpt = transactionRepository.findByTransactionCode(request.getTransactionCode().trim().toUpperCase());
        }
        if (txnOpt.isEmpty() && request.getTransactionId() != null) {
            txnOpt = transactionRepository.findById(request.getTransactionId());
        }

        if (txnOpt.isEmpty()) {
            throw new IllegalArgumentException("Transaction not found. Please verify Transaction Code or ID.");
        }

        Transaction transaction = txnOpt.get();

        // 2. Transaction belongs to logged-in customer check
        if (request.getUserId() != null) {
            if (transaction.getUser() == null || !transaction.getUser().getUserId().equals(request.getUserId())) {
                throw new IllegalStateException("Transaction does not belong to the logged-in customer.");
            }
        }

        // 3. Transaction status must be SUCCESS
        if (!"SUCCESS".equalsIgnoreCase(transaction.getStatus())) {
            throw new IllegalStateException("Only successful transactions can be refunded. Current status: " + transaction.getStatus());
        }

        // 4. Amount validation
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero.");
        }
        if (request.getAmount().compareTo(transaction.getAmount()) > 0) {
            throw new IllegalArgumentException("Refund amount (₹" + request.getAmount() + ") cannot exceed original transaction amount (₹" + transaction.getAmount() + ").");
        }

        // 5. Valid refund reason validation
        String reason = request.getReason() != null ? request.getReason().trim() : "";
        if (!ALLOWED_REASONS.contains(reason)) {
            throw new IllegalArgumentException("Invalid refund reason. Must be one of: " + String.join(", ", ALLOWED_REASONS));
        }

        // 6. Create refund record with status = PENDING
        String refundCode = "REF-" + (20000 + refundRepository.count() + 1);

        Refund refund = new Refund();
        refund.setRefundCode(refundCode);
        refund.setTransaction(transaction);
        refund.setAmount(request.getAmount());
        refund.setReason(reason);
        refund.setStatus("PENDING"); // Required: Do NOT immediately mark as COMPLETED
        refund.setRefundDate(LocalDateTime.now());

        return refundRepository.save(refund);
    }

    @Transactional
    public Refund approveRefund(Long refundId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund record not found for ID: " + refundId));
        refund.setStatus("COMPLETED");
        return refundRepository.save(refund);
    }

    @Transactional
    public Refund rejectRefund(Long refundId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund record not found for ID: " + refundId));
        refund.setStatus("REJECTED");
        return refundRepository.save(refund);
    }

    @Transactional
    public Refund updateStatus(Long refundId, String status) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund record not found for ID: " + refundId));
        String upper = status != null ? status.trim().toUpperCase() : "";
        if (!Arrays.asList("PENDING", "COMPLETED", "REJECTED").contains(upper)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        refund.setStatus(upper);
        return refundRepository.save(refund);
    }
}

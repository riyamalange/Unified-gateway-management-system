package com.unipay.controller;

import com.unipay.dto.MerchantSummaryDTO;
import com.unipay.entity.Merchant;
import com.unipay.entity.Refund;
import com.unipay.entity.Settlement;
import com.unipay.entity.Transaction;
import com.unipay.repository.MerchantRepository;
import com.unipay.repository.SettlementRepository;
import com.unipay.repository.TransactionRepository;
import com.unipay.service.RefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@CrossOrigin(origins = "*")
public class MerchantController {

    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;
    private final SettlementRepository settlementRepository;
    private final RefundService refundService;

    @Autowired
    public MerchantController(MerchantRepository merchantRepository,
                              TransactionRepository transactionRepository,
                              SettlementRepository settlementRepository,
                              RefundService refundService) {
        this.merchantRepository = merchantRepository;
        this.transactionRepository = transactionRepository;
        this.settlementRepository = settlementRepository;
        this.refundService = refundService;
    }

    @GetMapping
    public ResponseEntity<List<Merchant>> getAllMerchants() {
        return ResponseEntity.ok(merchantRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Merchant> getMerchantById(@PathVariable Long id) {
        return merchantRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<Transaction>> getMerchantTransactions(@PathVariable Long id) {
        return ResponseEntity.ok(transactionRepository.findByMerchantMerchantIdOrderByTransactionDateDesc(id));
    }

    @GetMapping("/{id}/settlements")
    public ResponseEntity<List<Settlement>> getMerchantSettlements(@PathVariable Long id) {
        return ResponseEntity.ok(settlementRepository.findByMerchantMerchantIdOrderBySettlementDateDesc(id));
    }

    @GetMapping("/{id}/refunds")
    public ResponseEntity<List<Refund>> getMerchantRefunds(@PathVariable Long id) {
        return ResponseEntity.ok(refundService.getMerchantRefunds(id));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<MerchantSummaryDTO> getMerchantSummary(@PathVariable Long id) {
        Merchant merchant = merchantRepository.findById(id).orElse(null);
        if (merchant == null) {
            return ResponseEntity.notFound().build();
        }

        long totalTxns = transactionRepository.countByMerchantMerchantId(id);
        long successTxns = transactionRepository.countByMerchantMerchantIdAndStatus(id, "SUCCESS");
        long failedTxns = transactionRepository.countByMerchantMerchantIdAndStatus(id, "FAILED");
        long pendingTxns = transactionRepository.countByMerchantMerchantIdAndStatus(id, "PENDING");
        BigDecimal volume = transactionRepository.sumSuccessfulVolumeByMerchant(id);

        MerchantSummaryDTO summary = new MerchantSummaryDTO(
                merchant.getMerchantId(),
                merchant.getName(),
                totalTxns,
                successTxns,
                failedTxns,
                pendingTxns,
                volume
        );

        return ResponseEntity.ok(summary);
    }
}

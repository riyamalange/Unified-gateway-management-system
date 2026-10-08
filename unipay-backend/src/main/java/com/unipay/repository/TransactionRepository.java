package com.unipay.repository;

import com.unipay.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByOrderByTransactionDateDesc();

    List<Transaction> findByUserUserIdOrderByTransactionDateDesc(Long userId);

    List<Transaction> findByMerchantMerchantIdOrderByTransactionDateDesc(Long merchantId);

    Optional<Transaction> findByTransactionCode(String transactionCode);

    List<Transaction> findByOrderId(String orderId);

    long countByStatus(String status);

    long countByMerchantMerchantId(Long merchantId);

    long countByMerchantMerchantIdAndStatus(Long merchantId, String status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = 'SUCCESS'")
    BigDecimal sumTotalSuccessfulVolume();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.merchant.merchantId = :merchantId AND t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulVolumeByMerchant(@Param("merchantId") Long merchantId);
}

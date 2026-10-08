package com.unipay.repository;

import com.unipay.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findAllByOrderBySettlementDateDesc();
    List<Settlement> findByMerchantMerchantIdOrderBySettlementDateDesc(Long merchantId);
}

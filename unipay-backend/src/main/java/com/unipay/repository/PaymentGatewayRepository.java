package com.unipay.repository;

import com.unipay.entity.PaymentGateway;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentGatewayRepository extends JpaRepository<PaymentGateway, Long> {
    Optional<PaymentGateway> findByNameIgnoreCase(String name);
    Optional<PaymentGateway> findByCodeIgnoreCase(String code);
    List<PaymentGateway> findByStatus(String status);
}

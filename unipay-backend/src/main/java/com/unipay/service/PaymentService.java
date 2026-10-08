package com.unipay.service;

import com.unipay.dto.PaymentRequest;
import com.unipay.dto.PaymentResponse;
import com.unipay.entity.Merchant;
import com.unipay.entity.PaymentGateway;
import com.unipay.entity.Transaction;
import com.unipay.entity.User;
import com.unipay.gateway.GatewayResult;
import com.unipay.gateway.PaymentGatewayAdapter;
import com.unipay.repository.MerchantRepository;
import com.unipay.repository.PaymentGatewayRepository;
import com.unipay.repository.TransactionRepository;
import com.unipay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentService {

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final PaymentGatewayRepository gatewayRepository;
    private final TransactionRepository transactionRepository;
    private final RoutingService routingService;
    private final Map<String, PaymentGatewayAdapter> adapterMap = new HashMap<>();

    @Autowired
    public PaymentService(UserRepository userRepository,
                          MerchantRepository merchantRepository,
                          PaymentGatewayRepository gatewayRepository,
                          TransactionRepository transactionRepository,
                          RoutingService routingService,
                          List<PaymentGatewayAdapter> adapters) {
        this.userRepository = userRepository;
        this.merchantRepository = merchantRepository;
        this.gatewayRepository = gatewayRepository;
        this.transactionRepository = transactionRepository;
        this.routingService = routingService;

        for (PaymentGatewayAdapter adapter : adapters) {
            this.adapterMap.put(adapter.getGatewayCode().toUpperCase(), adapter);
        }
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        // 1. Identify User
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }
        if (user == null) {
            // Default to Rahul for academic demo flow if user not specified
            user = userRepository.findById(1L).orElseGet(() -> 
                userRepository.findAll().stream().findFirst().orElseThrow(() -> 
                    new IllegalStateException("No registered users found in database.")
                )
            );
        }

        // 2. Identify Merchant
        Merchant merchant = null;
        if (request.getMerchantId() != null) {
            merchant = merchantRepository.findById(request.getMerchantId()).orElse(null);
        }
        if (merchant == null) {
            // Default to FoodFast (Merchant 1)
            merchant = merchantRepository.findById(1L).orElseGet(() ->
                merchantRepository.findAll().stream().findFirst().orElseThrow(() ->
                    new IllegalStateException("No active merchants registered.")
                )
            );
        }

        // 3. Routing Engine - Determine optimal ACTIVE gateway
        PaymentGateway selectedGateway = routingService.route(request.getPaymentMethod());

        // 4. Delegate to Gateway Adapter
        PaymentGatewayAdapter adapter = adapterMap.get(selectedGateway.getCode().toUpperCase());
        if (adapter == null) {
            throw new IllegalStateException("No adapter registered for gateway code: " + selectedGateway.getCode());
        }

        GatewayResult result = adapter.processPayment(request);

        // 5. Generate unique Transaction Code (e.g. TXN-10023)
        long currentCount = transactionRepository.count();
        long randomSuffix = ThreadLocalRandom.current().nextLong(100, 999);
        String txnCode = "TXN-" + (10000 + currentCount + 1);
        if (transactionRepository.findByTransactionCode(txnCode).isPresent()) {
            txnCode = "TXN-" + (10000 + currentCount + randomSuffix);
        }

        // 6. Save Transaction in MySQL
        Transaction transaction = new Transaction();
        transaction.setTransactionCode(txnCode);
        transaction.setOrderId(request.getOrderId());
        transaction.setUser(user);
        transaction.setMerchant(merchant);
        transaction.setGateway(selectedGateway);
        transaction.setAmount(request.getAmount());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setStatus(result.getStatus());
        transaction.setGatewayReference(result.getGatewayReference());
        transaction.setResponseMessage(result.getMessage());
        transaction.setTransactionDate(LocalDateTime.now());

        Transaction savedTxn = transactionRepository.save(transaction);

        // 7. Build and return standard response DTO
        PaymentResponse response = new PaymentResponse();
        response.setTransactionId(savedTxn.getTransactionId());
        response.setTransactionCode(savedTxn.getTransactionCode());
        response.setOrderId(savedTxn.getOrderId());
        response.setAmount(savedTxn.getAmount());
        response.setPaymentMethod(savedTxn.getPaymentMethod());
        response.setGateway(selectedGateway.getName());
        response.setStatus(savedTxn.getStatus());
        response.setMessage(result.getMessage());
        response.setCustomerName(user.getName());
        response.setMerchantName(merchant.getName());
        response.setGatewayReference(savedTxn.getGatewayReference());
        response.setTransactionDate(savedTxn.getTransactionDate());

        return response;
    }
}

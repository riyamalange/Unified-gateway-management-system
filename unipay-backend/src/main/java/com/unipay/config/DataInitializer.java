package com.unipay.config;

import com.unipay.entity.*;
import com.unipay.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final PaymentGatewayRepository gatewayRepository;
    private final AdminRepository adminRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public DataInitializer(UserRepository userRepository,
                           MerchantRepository merchantRepository,
                           PaymentGatewayRepository gatewayRepository,
                           AdminRepository adminRepository,
                           TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.merchantRepository = merchantRepository;
        this.gatewayRepository = gatewayRepository;
        this.adminRepository = adminRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Gateways if not present
        if (gatewayRepository.count() == 0) {
            gatewayRepository.save(new PaymentGateway(null, "Razorpay", "RAZORPAY", "ACTIVE", new BigDecimal("1.80")));
            gatewayRepository.save(new PaymentGateway(null, "Stripe", "STRIPE", "ACTIVE", new BigDecimal("2.20")));
            gatewayRepository.save(new PaymentGateway(null, "PayPal", "PAYPAL", "ACTIVE", new BigDecimal("2.90")));
            gatewayRepository.save(new PaymentGateway(null, "PayU", "PAYU", "ACTIVE", new BigDecimal("1.50")));
            System.out.println(">>> UNIPAY DataInitializer: Seeded 4 Gateways (Razorpay, Stripe, PayPal, PayU)");
        }

        // 2. Seed Users if not present
        User rahul = null;
        if (userRepository.count() == 0) {
            rahul = userRepository.save(new User(null, "Rahul Sharma", "rahul@gmail.com", "12345", "CUSTOMER"));
            userRepository.save(new User(null, "FoodFast Merchant", "merchant@gmail.com", "123", "MERCHANT"));
            userRepository.save(new User(null, "UNIPAY Administrator", "admin@gmail.com", "098", "ADMIN"));
            userRepository.save(new User(null, "Priya Patel", "priya@gmail.com", "12345", "CUSTOMER"));
            userRepository.save(new User(null, "Amit Verma", "amit@gmail.com", "12345", "CUSTOMER"));
            System.out.println(">>> UNIPAY DataInitializer: Seeded users (Rahul Sharma [CUSTOMER], merchant@gmail.com [MERCHANT], admin@gmail.com [ADMIN])");
        } else {
            rahul = userRepository.findAll().get(0);
        }

        // 3. Seed Merchants if not present
        Merchant foodFast = null;
        if (merchantRepository.count() == 0) {
            foodFast = merchantRepository.save(new Merchant(null, "MRC-FOODFAST", "FoodFast", "billing@foodfast.com", "key_live_fdft99281", "ACTIVE"));
            merchantRepository.save(new Merchant(null, "MRC-SHOPKART", "ShopKart", "payments@shopkart.com", "key_live_shkp33718", "ACTIVE"));
            merchantRepository.save(new Merchant(null, "MRC-TICKETGO", "TicketGo", "finance@ticketgo.com", "key_live_tktg44092", "ACTIVE"));
            System.out.println(">>> UNIPAY DataInitializer: Seeded 3 Merchants (FoodFast, ShopKart, TicketGo)");
        } else {
            foodFast = merchantRepository.findAll().get(0);
        }

        // 4. Seed Admins if not present
        if (adminRepository.count() == 0) {
            adminRepository.save(new Admin(null, "UNIPAY Administrator", "admin@unipay.com", "admin123", "SUPER_ADMIN"));
            System.out.println(">>> UNIPAY DataInitializer: Seeded Admin Account (admin@unipay.com)");
        }

        // 5. Seed sample initial transactions if empty
        if (transactionRepository.count() == 0 && rahul != null && foodFast != null) {
            PaymentGateway rzp = gatewayRepository.findByCodeIgnoreCase("RAZORPAY").orElse(null);
            if (rzp != null) {
                Transaction initialTxn = new Transaction(
                    null,
                    "TXN-10001",
                    "ORD-INIT-001",
                    rahul,
                    foodFast,
                    rzp,
                    new BigDecimal("450.00"),
                    "UPI",
                    "SUCCESS",
                    "rzp_pay_init_8819",
                    "Initial benchmark transaction via Razorpay Adapter",
                    LocalDateTime.now().minusDays(1)
                );
                transactionRepository.save(initialTxn);
                System.out.println(">>> UNIPAY DataInitializer: Seeded initial transaction TXN-10001");
            }
        }
    }
}

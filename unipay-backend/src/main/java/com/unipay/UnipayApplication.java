package com.unipay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UnipayApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnipayApplication.class, args);
        System.out.println("==========================================================");
        System.out.println("  UNIPAY – Unified Payment Gateway is running on port 8080");
        System.out.println("  Connected to database: unipay");
        System.out.println("  Ready to process payment requests from merchant applications");
        System.out.println("==========================================================");
    }
}

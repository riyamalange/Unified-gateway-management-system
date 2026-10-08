package com.unipay.service;

import com.unipay.dto.LoginRequest;
import com.unipay.dto.SignupRequest;
import com.unipay.entity.Admin;
import com.unipay.entity.User;
import com.unipay.repository.AdminRepository;
import com.unipay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Academic Authentication Service.
 * Note for viva / evaluation:
 * In production banking systems, passwords must be hashed using BCrypt / Argon2,
 * and authenticated using OAuth2 / JWT. For this academic DBMS demonstration,
 * clear, straightforward authentication is implemented for transparency.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Autowired
    public AuthService(UserRepository userRepository, AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @Transactional
    public Map<String, Object> signup(SignupRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            response.put("success", false);
            response.put("message", "Passwords do not match");
            return response;
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            response.put("success", false);
            response.put("message", "Email is already registered");
            return response;
        }

        User newUser = new User();
        newUser.setName(request.getName());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(request.getPassword()); // In production, use BCryptPasswordEncoder

        User savedUser = userRepository.save(newUser);

        response.put("success", true);
        response.put("message", "User registered successfully");
        response.put("userId", savedUser.getUserId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", "CUSTOMER");
        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        // Check if admin first
        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (admin.getPassword().equals(request.getPassword())) {
                response.put("success", true);
                response.put("message", "Admin login successful");
                response.put("userId", admin.getAdminId());
                response.put("name", admin.getName());
                response.put("email", admin.getEmail());
                response.put("role", "ADMIN");
                return response;
            }
        }

        // Check regular customer
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(request.getPassword())) {
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("userId", user.getUserId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("role", user.getRole() != null ? user.getRole() : "CUSTOMER");
                return response;
            } else {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return response;
            }
        }

        response.put("success", false);
        response.put("message", "User not found with provided email");
        return response;
    }
}

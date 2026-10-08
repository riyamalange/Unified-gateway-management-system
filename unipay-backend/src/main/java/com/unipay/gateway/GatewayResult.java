package com.unipay.gateway;

public class GatewayResult {

    private boolean success;
    private String status; // "SUCCESS" or "FAILED"
    private String gatewayReference;
    private String message;

    public GatewayResult() {}

    public GatewayResult(boolean success, String status, String gatewayReference, String message) {
        this.success = success;
        this.status = status;
        this.gatewayReference = gatewayReference;
        this.message = message;
    }

    public static GatewayResult success(String gatewayReference, String message) {
        return new GatewayResult(true, "SUCCESS", gatewayReference, message);
    }

    public static GatewayResult failure(String gatewayReference, String message) {
        return new GatewayResult(false, "FAILED", gatewayReference, message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public void setGatewayReference(String gatewayReference) {
        this.gatewayReference = gatewayReference;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

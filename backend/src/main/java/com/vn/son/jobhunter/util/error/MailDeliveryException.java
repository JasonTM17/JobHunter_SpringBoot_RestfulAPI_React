package com.vn.son.jobhunter.util.error;

public class MailDeliveryException extends Exception {
    private final String errorCode;

    public MailDeliveryException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public MailDeliveryException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

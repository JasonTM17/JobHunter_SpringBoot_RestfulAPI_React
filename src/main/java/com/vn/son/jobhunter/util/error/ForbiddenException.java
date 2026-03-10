package com.vn.son.jobhunter.util.error;

public class ForbiddenException extends Exception {
    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}

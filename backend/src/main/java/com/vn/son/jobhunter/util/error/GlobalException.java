package com.vn.son.jobhunter.util.error;

import com.vn.son.jobhunter.domain.res.RestResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.text.ParseException;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalException {
    private static final Logger logger = LoggerFactory.getLogger(GlobalException.class);
    private static final String GENERIC_SERVER_MESSAGE = "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.";

    @ExceptionHandler(value = {
            UsernameNotFoundException.class,
            BadCredentialsException.class,
            ParseException.class,
            MissingRequestCookieException.class
    })
    public ResponseEntity<Object> handleSecurityException(Exception ex) {
        if (ex instanceof MissingRequestCookieException) {
            return buildErrorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
            );
        }

        if (ex instanceof BadCredentialsException || ex instanceof UsernameNotFoundException) {
            return buildErrorResponse(
                    HttpStatus.BAD_REQUEST,
                    "BAD_REQUEST",
                    "Email hoặc mật khẩu chưa đúng."
            );
        }

        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "Thông tin xác thực chưa hợp lệ."
        );
    }

    @ExceptionHandler(value = {
            UnauthorizedException.class
    })
    public ResponseEntity<Object> handleUnauthorizedException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                sanitizeClientMessage(ex.getMessage(), "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.")
        );
    }

    @ExceptionHandler(value = {
            NoResourceFoundException.class,
            ResourceNotFoundException.class
    })
    public ResponseEntity<Object> handleNotFoundException(Exception ex) {
        String fallbackMessage = "Không tìm thấy tài nguyên yêu cầu.";
        String message = ex instanceof ResourceNotFoundException
                ? sanitizeClientMessage(ex.getMessage(), fallbackMessage)
                : fallbackMessage;
        return buildErrorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }

    @ExceptionHandler(value = {
            AiServiceException.class
    })
    public ResponseEntity<Object> handleAiServiceException(AiServiceException ex) {
        HttpStatus status = "AI_NOT_CONFIGURED".equalsIgnoreCase(ex.getErrorCode())
                ? HttpStatus.SERVICE_UNAVAILABLE
                : HttpStatus.BAD_GATEWAY;

        RestResponse<Object> res = new RestResponse<>();
        res.setStatusCode(status.value());
        res.setError(ex.getErrorCode());
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = {
            MailDeliveryException.class
    })
    public ResponseEntity<Object> handleMailDeliveryException(MailDeliveryException ex) {
        HttpStatus status = switch (ex.getErrorCode()) {
            case "MAIL_INVALID_RECIPIENT", "MAIL_INVALID_SENDER", "MAIL_INVALID_SUBJECT", "MAIL_INVALID_CONTENT" ->
                    HttpStatus.BAD_REQUEST;
            case "MAIL_NOT_CONFIGURED" -> HttpStatus.SERVICE_UNAVAILABLE;
            case "MAIL_TEMPLATE_INVALID" -> HttpStatus.BAD_REQUEST;
            case "MAIL_TEMPLATE_RENDER_FAILED" -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_GATEWAY;
        };

        RestResponse<Object> res = new RestResponse<>();
        res.setStatusCode(status.value());
        res.setError(ex.getErrorCode());
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = {
            IdInvalidException.class,
            DataIntegrityViolationException.class,
            IllegalStateException.class,
            BadRequestException.class
    })
    public ResponseEntity<Object> handleBadRequestException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                sanitizeClientMessage(ex.getMessage(), "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu gửi lên.")
        );
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<Object> validationError(MethodArgumentNotValidException ex) {
        BindingResult result = ex.getBindingResult();
        final List<FieldError> fieldErrors = result.getFieldErrors();

        RestResponse<Object> res = new RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("VALIDATION_ERROR");

        List<String> errors = fieldErrors.stream().map(FieldError::getDefaultMessage).collect(Collectors.toList());
        if (errors.isEmpty()) {
            res.setMessage("Dữ liệu gửi lên chưa hợp lệ.");
        } else {
            res.setMessage(errors.size() > 1 ? errors : errors.get(0));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(value = {
            StorageException.class
    })
    public ResponseEntity<Object> handleFileUploadException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "STORAGE_ERROR",
                "Không thể xử lý tệp tin lúc này. Vui lòng thử lại."
        );
    }

    @ExceptionHandler(value = {
            PermissionException.class,
            ForbiddenException.class
    })
    public ResponseEntity<Object> handlePermissionException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                "Bạn không có quyền thực hiện thao tác này."
        );
    }

    @ExceptionHandler(value = {
            ConflictException.class
    })
    public ResponseEntity<Object> handleConflictException(Exception ex) {
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                "CONFLICT",
                sanitizeClientMessage(ex.getMessage(), "Dữ liệu đang xung đột hoặc đã tồn tại.")
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestResponse<Object>> handleAllException(Exception ex) {
        logger.error("Unhandled exception", ex);
        RestResponse<Object> res = new RestResponse<>();
        res.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
        res.setMessage(GENERIC_SERVER_MESSAGE);
        res.setError("INTERNAL_SERVER_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res);
    }

    private ResponseEntity<Object> buildErrorResponse(HttpStatus status, String errorCode, Object message) {
        RestResponse<Object> res = new RestResponse<>();
        res.setStatusCode(status.value());
        res.setError(errorCode);
        res.setMessage(message);
        return ResponseEntity.status(status).body(res);
    }

    private String sanitizeClientMessage(String rawMessage, String fallback) {
        if (rawMessage == null) return fallback;
        String message = rawMessage.trim();
        if (message.isEmpty()) return fallback;
        if (message.length() > 200) return fallback;

        String normalized = message.toLowerCase();
        if (normalized.contains("exception")
                || normalized.contains("stack")
                || normalized.contains("org.springframework")
                || normalized.contains("java.")
                || normalized.contains("hibernate")
                || normalized.contains("sql")
                || normalized.contains("jdbc")
                || normalized.contains("token")
                || normalized.contains("authorization")
                || normalized.contains("password")
                || normalized.contains("api key")
                || normalized.contains("apikey")) {
            return fallback;
        }
        return message;
    }
}

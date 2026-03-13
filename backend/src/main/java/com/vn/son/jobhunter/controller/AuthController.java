package com.vn.son.jobhunter.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.LoginDTO;
import com.vn.son.jobhunter.domain.dto.RegisterDTO;
import com.vn.son.jobhunter.domain.res.auth.AuthCapabilityResponse;
import com.vn.son.jobhunter.domain.dto.auth.EmailPreferenceUpdateDTO;
import com.vn.son.jobhunter.domain.res.auth.EmailPreferenceResponse;
import com.vn.son.jobhunter.domain.res.auth.LoginResponse;
import com.vn.son.jobhunter.domain.res.auth.UserActionCapabilityResponse;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import com.vn.son.jobhunter.util.security.SecurityUtils;
import com.vn.son.jobhunter.service.SecurityService;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;

import java.util.List;

@RequestMapping(path = "${apiPrefix}/auth")
@RestController
@RequiredArgsConstructor
@Tag(name = "Xác thực & tài khoản", description = "Nhóm API đăng ký, đăng nhập và quản lý phiên người dùng")
public class AuthController {
    private static final String ACCESS_TOKEN_COOKIE_NAME = "access_token";
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityService securityService;
    private final UserService userService;
    private final SecurityUtils securityUtils;

    @Value("${son.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${son.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    @Value("${son.jwt.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${son.jwt.cookie.same-site:Lax}")
    private String sameSitePolicy;

    @PostMapping("/register")
    @ApiMessage("Đăng ký tài khoản mới")
    public ResponseEntity<CreatedUserResponse> createUser(@Valid @RequestBody RegisterDTO registerDTO) throws Exception {
        CreatedUserResponse newUser = this.userService.createUser(this.toRegisterUser(registerDTO));
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @PostMapping(path = "/login")
    @ApiMessage("Đăng nhập bằng email và mật khẩu")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginDTO loginDTO){
        UsernamePasswordAuthenticationToken authenticationToken
                = new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword());

        Authentication authentication =
                this.authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        SecurityContextHolder.getContext().setAuthentication(authentication);


        LoginResponse loginResponse = new LoginResponse();

        User currentUserDB = this.userService.handleGetUserByUsernameWithRolePermissions(loginDTO.getUsername());
        if(currentUserDB != null){
            LoginResponse.UserLogin userLogin = this.toUserLogin(currentUserDB);
            loginResponse.setUser(userLogin);
        }

        String accessToken = this.securityService.createAccessToken(authentication.getName());
        String refreshToken = this.securityService.createRefreshToken(authentication.getName());
        //update user
        this.userService.updateUserToken(refreshToken, loginDTO.getUsername());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, this.accessTokenExpiration).toString());
        headers.add(HttpHeaders.SET_COOKIE, buildCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, this.refreshTokenExpiration).toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(loginResponse);
    }

    @GetMapping("/account")
    @ApiMessage("Lấy thông tin tài khoản hiện tại")
    public ResponseEntity<LoginResponse.UserGetAccout> getAccount(){
        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";
        User currentUserDB = this.userService.handleGetUserByUsernameWithRolePermissions(email);
        LoginResponse.UserGetAccout userGetAccout = new LoginResponse.UserGetAccout();
        if(currentUserDB != null){
            userGetAccout.setUser(this.toUserLogin(currentUserDB));
        }
        return ResponseEntity.ok().body(userGetAccout);
    }

    @GetMapping("/preferences/email")
    @ApiMessage("Lấy tùy chọn nhận email gợi ý")
    public ResponseEntity<EmailPreferenceResponse> getCurrentEmailPreference() throws UnauthorizedException {
        User currentUser = this.userService.getCurrentAuthenticatedUserOrThrow();
        return ResponseEntity.ok(new EmailPreferenceResponse(currentUser.isWeeklyJobRecommendationEnabled()));
    }

    @PatchMapping("/preferences/email")
    @ApiMessage("Cập nhật tùy chọn nhận email gợi ý")
    public ResponseEntity<EmailPreferenceResponse> updateCurrentEmailPreference(
            @Valid @RequestBody EmailPreferenceUpdateDTO request
    ) throws UnauthorizedException {
        User updatedUser = this.userService.updateCurrentWeeklyRecommendationPreference(
                Boolean.TRUE.equals(request.getWeeklyJobRecommendationEnabled())
        );
        return ResponseEntity.ok(new EmailPreferenceResponse(updatedUser.isWeeklyJobRecommendationEnabled()));
    }

    @GetMapping("/capabilities")
    @ApiMessage("Lấy danh sách quyền thao tác của tài khoản hiện tại")
    public ResponseEntity<AuthCapabilityResponse> getCapabilities() {
        List<String> actionKeys = this.userService.getCurrentPermissionKeys();
        List<AuthCapabilityResponse.RoleOption> assignableRoles = this.userService.getAssignableRoleOptionsForCurrentUser();
        boolean canAccessManagement = this.userService.canAccessManagement(actionKeys);
        return ResponseEntity.ok(new AuthCapabilityResponse(actionKeys, canAccessManagement, assignableRoles));
    }

    @GetMapping("/capabilities/users/{id}")
    @ApiMessage("Lấy quyền thao tác của tài khoản hiện tại trên người dùng mục tiêu")
    public ResponseEntity<UserActionCapabilityResponse> getUserActionCapability(
            @PathVariable("id") Long id
    ) throws Exception {
        return ResponseEntity.ok(this.userService.getUserActionCapability(id));
    }

    @GetMapping("/refresh")
    @ApiMessage("Làm mới phiên đăng nhập và trả về thông tin tài khoản")
    public ResponseEntity<LoginResponse> getRefreshToken(
            @CookieValue("refresh_token") String refreshToken
    ) throws IdInvalidException {
        Jwt decodedToken = this.securityUtils.checkValidRefreshToken(refreshToken);
        String email = decodedToken.getSubject();
        User user = this.userService.getUserByRefreshTokenAndEmail(refreshToken, email);
        if(user != null){
            LoginResponse loginResponse = new LoginResponse();
            User userWithRole = this.userService.handleGetUserByUsernameWithRolePermissions(email);
            LoginResponse.UserLogin userLogin = this.toUserLogin(
                    userWithRole != null ? userWithRole : user
            );
            loginResponse.setUser(userLogin);

            String accessToken = this.securityService.createAccessToken(email);
            String new_refresh_token = this.securityService.createRefreshToken(email);
            //update user
            this.userService.updateUserToken(new_refresh_token, email);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, this.accessTokenExpiration).toString());
            headers.add(HttpHeaders.SET_COOKIE, buildCookie(REFRESH_TOKEN_COOKIE_NAME, new_refresh_token, this.refreshTokenExpiration).toString());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(loginResponse);
        }else{
            throw new IdInvalidException("Refresh token is not valid");
        }
    }

    @PostMapping("/logout")
    @ApiMessage("Đăng xuất tài khoản")
    public ResponseEntity<Void> logout(
            @CookieValue(value = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken
    ){
        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";

        if (email.isBlank() && refreshToken != null && !refreshToken.isBlank()) {
            try {
                Jwt decodedToken = this.securityUtils.checkValidRefreshToken(refreshToken);
                email = decodedToken.getSubject();
            } catch (Exception ignored) {
                // Ignore invalid refresh token on logout; still clear cookies.
            }
        }

        if (!email.isBlank()) {
            this.userService.updateUserToken(null, email);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, clearCookie(ACCESS_TOKEN_COOKIE_NAME).toString());
        headers.add(HttpHeaders.SET_COOKIE, clearCookie(REFRESH_TOKEN_COOKIE_NAME).toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(null);
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie
                .from(name, value)
                .httpOnly(true)
                .secure(this.secureCookie)
                .sameSite(this.sameSitePolicy)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie
                .from(name, "")
                .httpOnly(true)
                .secure(this.secureCookie)
                .sameSite(this.sameSitePolicy)
                .path("/")
                .maxAge(0)
                .build();
    }

    private LoginResponse.UserLogin toUserLogin(User user) {
        LoginResponse.RoleLogin roleLogin = null;
        Role role = user.getRole();

        if (role != null) {
            roleLogin = new LoginResponse.RoleLogin(
                    role.getName()
            );
        }

        return new LoginResponse.UserLogin(
                user.getId(),
                user.getEmail(),
                user.getName(),
                roleLogin,
                user.isWeeklyJobRecommendationEnabled()
        );
    }

    private User toRegisterUser(RegisterDTO dto) {
        User user = new User();
        user.setName(dto.getName() == null ? null : dto.getName().trim());
        user.setAge(dto.getAge() == null ? 0 : dto.getAge());
        user.setEmail(dto.getEmail() == null ? null : dto.getEmail().trim().toLowerCase());
        user.setPassword(dto.getPassword());
        user.setAddress(dto.getAddress() == null ? null : dto.getAddress().trim());
        user.setGender(dto.getGender() == null ? GenderEnum.OTHER : dto.getGender());
        return user;
    }
}

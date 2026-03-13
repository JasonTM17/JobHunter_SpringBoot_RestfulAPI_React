package com.vn.son.jobhunter.controller;

import jakarta.servlet.http.Cookie;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.auth.AuthCapabilityResponse;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import com.vn.son.jobhunter.service.SecurityService;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.error.GlobalException;
import com.vn.son.jobhunter.util.security.SecurityUtils;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManagerBuilder authenticationManagerBuilder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private SecurityService securityService;

    @Mock
    private UserService userService;

    @Mock
    private SecurityUtils securityUtils;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(
                authenticationManagerBuilder,
                securityService,
                userService,
                securityUtils
        );
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        this.mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalException())
                .setValidator(validator)
                .addPlaceholderValue("apiPrefix", "/api/v1")
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginShouldReturnBadRequestWhenCredentialsInvalid() throws Exception {
        when(authenticationManagerBuilder.getObject()).thenReturn(authenticationManager);
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        String payload = """
                {
                  "username": "wrong@mail.com",
                  "password": "wrong-password"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Bad credentials"));
    }

    @Test
    void loginShouldReturnBadRequestWhenPayloadInvalid() throws Exception {
        String invalidPayload = """
                {
                  "username": "",
                  "password": ""
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    @Test
    void registerShouldNotAllowPrivilegedFieldsInPayload() throws Exception {
        User created = new User();
        created.setId(10L);
        created.setName("Candidate");
        created.setEmail("candidate@mail.com");
        created.setGender(GenderEnum.MALE);

        when(userService.createUser(any(User.class))).thenReturn(
                com.vn.son.jobhunter.util.convert.UserConvert.convertToResCreatedUserRes(created)
        );

        String payload = """
                {
                  "id": 99,
                  "name": "Candidate",
                  "age": 24,
                  "email": "candidate@mail.com",
                  "password": "123456",
                  "address": "HCM",
                  "gender": "MALE",
                  "refresh_token": "attacker-token",
                  "role": { "id": 1 },
                  "company": { "id": 2 }
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userService).createUser(captor.capture());
        User request = captor.getValue();
        assertNull(request.getId());
        assertNull(request.getRole());
        assertNull(request.getCompany());
        assertNull(request.getRefreshToken());
        assertEquals("candidate@mail.com", request.getEmail());
    }

    @Test
    void refreshShouldReturnBadRequestWhenCookieMissing() throws Exception {
        mockMvc.perform(get("/api/v1/auth/refresh"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message")
                        .value(containsString("Required cookie 'refresh_token'")));
    }

    @Test
    void refreshShouldReturnBadRequestWhenTokenNotMappedToUser() throws Exception {
        Jwt jwt = Jwt.withTokenValue("valid-refresh-token")
                .header("alg", "HS512")
                .subject("user@mail.com")
                .build();

        when(securityUtils.checkValidRefreshToken("valid-refresh-token")).thenReturn(jwt);
        when(userService.getUserByRefreshTokenAndEmail("valid-refresh-token", "user@mail.com")).thenReturn(null);

        mockMvc.perform(get("/api/v1/auth/refresh")
                        .cookie(new Cookie("refresh_token", "valid-refresh-token")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Refresh token is not valid"));
    }

    @Test
    void logoutShouldReturnBadRequestWhenNoAuthenticatedPrincipal() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    List<String> setCookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
                    assertTrue(setCookies.stream().anyMatch(cookie -> cookie.contains("access_token=")));
                    assertTrue(setCookies.stream().anyMatch(cookie -> cookie.contains("refresh_token=")));
                    assertTrue(setCookies.stream().allMatch(cookie -> cookie.contains("Max-Age=0")));
                });
    }

    @Test
    void loginShouldNotExposeRolePermissionGraph() throws Exception {
        when(authenticationManagerBuilder.getObject()).thenReturn(authenticationManager);
        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(
                        "admin.operations@jobhunter.local",
                        "n/a",
                        AuthorityUtils.NO_AUTHORITIES
                )
        );
        when(securityService.createAccessToken("admin.operations@jobhunter.local")).thenReturn("access-token");
        when(securityService.createRefreshToken("admin.operations@jobhunter.local")).thenReturn("refresh-token");

        Permission permission = new Permission("Get users", "/api/v1/users", "GET", "USERS");
        permission.setId(99L);

        Role role = new Role();
        role.setId(11L);
        role.setName("ADMIN");
        role.setDescription("Internal role description");
        role.setPermissions(List.of(permission));

        User user = new User();
        user.setId(5L);
        user.setEmail("admin.operations@jobhunter.local");
        user.setName("Admin User");
        user.setRole(role);

        when(userService.handleGetUserByUsernameWithRolePermissions("admin.operations@jobhunter.local")).thenReturn(user);

        String payload = """
                {
                  "username": "admin.operations@jobhunter.local",
                  "password": "123456"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(5))
                .andExpect(jsonPath("$.user.email").value("admin.operations@jobhunter.local"))
                .andExpect(jsonPath("$.user.role.name").value("ADMIN"))
                .andExpect(jsonPath("$.user.role.id").doesNotExist())
                .andExpect(jsonPath("$.user.role.description").doesNotExist())
                .andExpect(jsonPath("$.user.role.permissions").doesNotExist());
    }

    @Test
    void capabilitiesShouldExposeMinimalSafeContract() throws Exception {
        List<String> actionKeys = List.of("GET /api/v1/users", "GET /api/v1/roles");
        List<AuthCapabilityResponse.RoleOption> roles = List.of(
                new AuthCapabilityResponse.RoleOption(1L, "USER"),
                new AuthCapabilityResponse.RoleOption(2L, "RECRUITER")
        );

        when(userService.getCurrentPermissionKeys()).thenReturn(actionKeys);
        when(userService.getAssignableRoleOptionsForCurrentUser()).thenReturn(roles);
        when(userService.canAccessManagement(actionKeys)).thenReturn(true);

        mockMvc.perform(get("/api/v1/auth/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionKeys[0]").value("GET /api/v1/users"))
                .andExpect(jsonPath("$.canAccessManagement").value(true))
                .andExpect(jsonPath("$.permissions").doesNotExist())
                .andExpect(jsonPath("$.assignableRoles[0].id").value(1))
                .andExpect(jsonPath("$.assignableRoles[0].name").value("USER"))
                .andExpect(jsonPath("$.assignableRoles[0].description").doesNotExist());
    }
}

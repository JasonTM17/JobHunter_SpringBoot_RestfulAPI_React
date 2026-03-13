package com.vn.son.jobhunter.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.vn.son.jobhunter.controller.UserController;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.GlobalException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.response.FormatRestResponse;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({ GlobalException.class, FormatRestResponse.class })
@TestPropertySource(properties = { "apiPrefix=/api/v1" })
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void createUserShouldReturnWrappedSuccessBody() throws Exception {
        CreatedUserResponse response = new CreatedUserResponse();
        response.setId(1L);
        response.setName("Integration User");
        response.setEmail("integration@mail.com");

        when(userService.createUser(any(User.class))).thenReturn(response);

        String payload = """
                {
                  "name": "Integration User",
                  "age": 28,
                  "email": "integration@mail.com",
                  "password": "secret123",
                  "gender": "MALE",
                  "address": "HCM"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo người dùng"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("integration@mail.com"));
    }

    @Test
    void createUserShouldReturnValidationError() throws Exception {
        String invalidPayload = """
                {
                  "name": "",
                  "age": -1,
                  "email": "invalid-email",
                  "password": "",
                  "gender": null
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    @Test
    void fetchUserByIdShouldReturnNotFoundFromGlobalException() throws Exception {
        when(userService.fetchUserById(99L))
                .thenThrow(new ResourceNotFoundException("User with id 99 not found"));

        mockMvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message").value("User with id 99 not found"));
    }

    @Test
    void createUserShouldReturnConflictFromGlobalException() throws Exception {
        when(userService.createUser(any(User.class)))
                .thenThrow(new ConflictException("Email already exists"));

        String payload = """
                {
                  "name": "Duplicated Email",
                  "age": 25,
                  "email": "duplicated@mail.com",
                  "password": "secret123",
                  "gender": "MALE"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }
}

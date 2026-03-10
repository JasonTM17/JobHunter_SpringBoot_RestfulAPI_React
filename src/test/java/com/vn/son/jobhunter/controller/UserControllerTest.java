package com.vn.son.jobhunter.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.error.GlobalException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        UserController userController = new UserController(userService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        this.mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalException())
                .setValidator(validator)
                .addPlaceholderValue("apiPrefix", "/api/v1")
                .build();
    }

    @Test
    void createUserShouldReturnCreated() throws Exception {
        String request = """
                {
                  "name": "John Doe",
                  "age": 28,
                  "email": "john.doe@mail.com",
                  "password": "secret123",
                  "gender": "MALE",
                  "address": "Ha Noi"
                }
                """;

        CreatedUserResponse response = new CreatedUserResponse();
        response.setId(1L);
        response.setName("John Doe");
        response.setEmail("john.doe@mail.com");

        when(userService.createUser(any(User.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("john.doe@mail.com"));
    }

    @Test
    void createUserShouldReturnBadRequestWhenPayloadInvalid() throws Exception {
        String invalidRequest = """
                {
                  "name": "",
                  "age": -1,
                  "password": ""
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        verifyNoInteractions(userService);
    }

    @Test
    void fetchUserByIdShouldReturnNotFoundWhenUserMissing() throws Exception {
        when(userService.fetchUserById(99L))
                .thenThrow(new ResourceNotFoundException("User with id 99 not found"));

        mockMvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message").value("User with id 99 not found"));
    }

    @Test
    void updateUserShouldReturnBadRequestWhenPayloadInvalid() throws Exception {
        String invalidRequest = """
                {
                  "age": -5
                }
                """;

        mockMvc.perform(put("/api/v1/users/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    @Test
    void deleteUserShouldReturnNoContent() throws Exception {
        doNothing().when(userService).deleteUser(5L);

        mockMvc.perform(delete("/api/v1/users/5"))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(eq(5L));
    }
}

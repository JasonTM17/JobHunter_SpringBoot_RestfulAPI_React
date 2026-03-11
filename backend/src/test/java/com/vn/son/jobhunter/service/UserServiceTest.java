package com.vn.son.jobhunter.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.UpdateUserDTO;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyService companyService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private UserService userService;

    @Test
    void createUserShouldEncodePasswordAndReturnCreatedResponse() throws Exception {
        User request = buildUser(0L, "new.user@mail.com");
        request.setPassword("plain-password");
        request.setCompany(buildCompany(10L, "ACME"));
        request.setRole(buildRole(20L, "ADMIN"));

        User saved = buildUser(1L, "new.user@mail.com");
        saved.setPassword("encoded-password");
        saved.setCompany(buildCompany(10L, "ACME"));
        saved.setRole(buildRole(20L, "ADMIN"));

        when(userRepository.existsByEmail("new.user@mail.com")).thenReturn(false);
        when(companyService.findCompanyById(10L)).thenReturn(buildCompany(10L, "ACME"));
        when(roleService.fetchRoleById(20L)).thenReturn(buildRole(20L, "ADMIN"));
        when(passwordEncoder.encode("plain-password")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(saved);

        CreatedUserResponse response = userService.createUser(request);

        assertEquals(1L, response.getId());
        assertEquals("new.user@mail.com", response.getEmail());
        assertEquals("ACME", response.getCompany().getName());
        assertEquals("ADMIN", response.getRole().getName());
        verify(passwordEncoder).encode("plain-password");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUserShouldThrowConflictWhenEmailExists() {
        User request = buildUser(0L, "duplicated@mail.com");
        when(userRepository.existsByEmail("duplicated@mail.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.createUser(request));
    }

    @Test
    void fetchUserByIdShouldThrowWhenUserMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.fetchUserById(99L));
    }

    @Test
    void updateUserShouldUpdateFieldsAndRelations() throws Exception {
        User existing = buildUser(7L, "old@mail.com");
        existing.setCompany(buildCompany(1L, "Old Co"));
        existing.setRole(buildRole(1L, "USER"));

        UpdateUserDTO request = new UpdateUserDTO();
        request.setName("Updated Name");
        request.setAge(30);
        request.setAddress("New Address");
        request.setGender(GenderEnum.OTHER);
        request.setCompany(buildCompany(2L, "New Co"));
        request.setRole(buildRole(2L, "MANAGER"));

        when(userRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(companyService.findCompanyById(2L)).thenReturn(buildCompany(2L, "New Co"));
        when(roleService.fetchRoleById(2L)).thenReturn(buildRole(2L, "MANAGER"));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdatedUserResponse response = userService.updateUser(7L, request);

        assertEquals("Updated Name", response.getName());
        assertEquals("New Co", response.getCompany().getName());
        assertEquals("MANAGER", response.getRole().getName());
    }

    @Test
    void deleteUserShouldThrowWhenUserMissing() {
        when(userRepository.findById(88L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(88L));
    }

    @Test
    void getAllUserShouldReturnPaginatedResponse() {
        User user = buildUser(1L, "user1@mail.com");
        Page<User> page = new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1);
        when(userRepository.findAll(nullable(Specification.class), any(Pageable.class))).thenReturn(page);

        ResultPaginationResponse response = userService.getAllUser(PageRequest.of(0, 10), null);

        assertEquals(1, response.getMeta().getPage());
        assertEquals(10, response.getMeta().getPageSize());
        assertEquals(1, response.getMeta().getTotal());
        assertInstanceOf(List.class, response.getResult());
    }

    private static User buildUser(long id, String email) {
        User user = new User();
        user.setId(id);
        user.setName("Test User");
        user.setAge(25);
        user.setAddress("Test Address");
        user.setEmail(email);
        user.setPassword("password");
        user.setGender(GenderEnum.MALE);
        return user;
    }

    private static Company buildCompany(long id, String name) {
        Company company = new Company();
        company.setId(id);
        company.setName(name);
        return company;
    }

    private static Role buildRole(long id, String name) {
        Role role = new Role();
        role.setId(id);
        role.setName(name);
        return role;
    }
}

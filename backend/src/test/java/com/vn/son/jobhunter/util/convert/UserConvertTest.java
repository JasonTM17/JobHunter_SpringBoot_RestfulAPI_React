package com.vn.son.jobhunter.util.convert;

import org.junit.jupiter.api.Test;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.util.constant.GenderEnum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserConvertTest {

    @Test
    void convertToResCreatedUserResShouldMapAllFields() {
        User user = buildUser(1L, "unit.user@mail.com");
        user.setCompany(buildCompany(10L, "Company A"));
        user.setRole(buildRole(20L, "ADMIN"));

        CreatedUserResponse result = UserConvert.convertToResCreatedUserRes(user);

        assertEquals(1L, result.getId());
        assertEquals("Unit User", result.getName());
        assertEquals("unit.user@mail.com", result.getEmail());
        assertEquals(GenderEnum.MALE, result.getGender());
        assertNotNull(result.getCompany());
        assertEquals("Company A", result.getCompany().getName());
        assertNotNull(result.getRole());
        assertEquals("ADMIN", result.getRole().getName());
    }

    @Test
    void convertToResUpdatedUserResShouldMapAllFields() {
        User user = buildUser(2L, "update.user@mail.com");
        user.setCompany(buildCompany(30L, "Company B"));
        user.setRole(buildRole(40L, "MANAGER"));

        UpdatedUserResponse result = UserConvert.convertToResUpdatedUserRes(user);

        assertEquals(2L, result.getId());
        assertEquals("Unit User", result.getName());
        assertEquals(25, result.getAge());
        assertEquals("Ha Noi", result.getAddress());
        assertNotNull(result.getCompany());
        assertEquals("Company B", result.getCompany().getName());
        assertNotNull(result.getRole());
        assertEquals("MANAGER", result.getRole().getName());
    }

    @Test
    void convertShouldAllowNullCompanyAndRole() {
        User user = buildUser(3L, "null.fields@mail.com");

        CreatedUserResponse created = UserConvert.convertToResCreatedUserRes(user);
        UpdatedUserResponse updated = UserConvert.convertToResUpdatedUserRes(user);

        assertNull(created.getCompany());
        assertNull(created.getRole());
        assertNull(updated.getCompany());
        assertNull(updated.getRole());
    }

    private static User buildUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setName("Unit User");
        user.setAge(25);
        user.setAddress("Ha Noi");
        user.setEmail(email);
        user.setPassword("password");
        user.setGender(GenderEnum.MALE);
        return user;
    }

    private static Company buildCompany(Long id, String name) {
        Company company = new Company();
        company.setId(id);
        company.setName(name);
        return company;
    }

    private static Role buildRole(Long id, String name) {
        Role role = new Role();
        role.setId(id);
        role.setName(name);
        return role;
    }
}

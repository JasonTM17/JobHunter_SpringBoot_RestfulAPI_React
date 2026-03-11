package com.vn.son.jobhunter.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.util.constant.GenderEnum;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:user_repo_it;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class UserRepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Test
    void existsByEmailShouldReturnTrueWhenUserExists() {
        userRepository.saveAndFlush(buildUser("exists@mail.com", null, null));

        assertTrue(userRepository.existsByEmail("exists@mail.com"));
        assertFalse(userRepository.existsByEmail("missing@mail.com"));
    }

    @Test
    void findByRefreshTokenAndEmailShouldReturnUser() {
        userRepository.saveAndFlush(buildUser("token.user@mail.com", "token-123", null));

        User found = userRepository.findByRefreshTokenAndEmail("token-123", "token.user@mail.com");

        assertNotNull(found);
        assertEquals("token.user@mail.com", found.getEmail());
    }

    @Test
    void findByCompanyShouldReturnUsersBelongingToCompany() {
        Company companyA = new Company();
        companyA.setName("Company A");
        companyA.setDescription("A");
        companyA.setCreatedBy("test");

        Company companyB = new Company();
        companyB.setName("Company B");
        companyB.setDescription("B");
        companyB.setCreatedBy("test");

        Company savedCompanyA = companyRepository.saveAndFlush(companyA);
        Company savedCompanyB = companyRepository.saveAndFlush(companyB);

        userRepository.saveAndFlush(buildUser("a1@mail.com", null, savedCompanyA));
        userRepository.saveAndFlush(buildUser("a2@mail.com", null, savedCompanyA));
        userRepository.saveAndFlush(buildUser("b1@mail.com", null, savedCompanyB));

        List<User> usersInCompanyA = userRepository.findByCompany(savedCompanyA);

        assertEquals(2, usersInCompanyA.size());
    }

    private User buildUser(String email, String refreshToken, Company company) {
        User user = new User();
        user.setName("Repository User");
        user.setAge(22);
        user.setEmail(email);
        user.setPassword("password");
        user.setGender(GenderEnum.MALE);
        user.setAddress("HCM");
        user.setRefreshToken(refreshToken);
        user.setCompany(company);
        user.setCreatedBy("test");
        return user;
    }
}

package com.vn.son.jobhunter.util.response;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.util.constant.GenderEnum;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class FormatResultPagainationTest {

    @Test
    void createPaginationResponseShouldBuildMetaFromAnyPage() {
        Page<String> page = new PageImpl<>(List.of("a", "b"), PageRequest.of(0, 2), 4);

        ResultPaginationResponse result = FormatResultPagaination.createPaginationResponse(page);

        assertEquals(1, result.getMeta().getPage());
        assertEquals(2, result.getMeta().getPageSize());
        assertEquals(2, result.getMeta().getPages());
        assertEquals(4, result.getMeta().getTotal());
        assertInstanceOf(List.class, result.getResult());
    }

    @Test
    void createPaginateUserResShouldMapUserPageToCreatedUserResponseList() {
        User user1 = buildUser(1L, "user1@mail.com");
        User user2 = buildUser(2L, "user2@mail.com");
        Page<User> page = new PageImpl<>(List.of(user1, user2), PageRequest.of(0, 10), 2);

        ResultPaginationResponse result = FormatResultPagaination.createPaginateUserRes(page);

        assertEquals(1, result.getMeta().getPage());
        assertEquals(10, result.getMeta().getPageSize());
        assertEquals(2, result.getMeta().getTotal());
        assertInstanceOf(List.class, result.getResult());
        List<?> users = (List<?>) result.getResult();
        assertEquals(2, users.size());
    }

    private static User buildUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setName("Pagination User");
        user.setAge(24);
        user.setAddress("HN");
        user.setEmail(email);
        user.setPassword("password");
        user.setGender(GenderEnum.MALE);
        return user;
    }
}

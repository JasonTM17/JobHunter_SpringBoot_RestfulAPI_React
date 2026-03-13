package com.vn.son.jobhunter.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    boolean existsByEmail(String email);
    User findByEmail(String email);
    @EntityGraph(attributePaths = {"role", "role.permissions"})
    Optional<User> findOneByEmail(String email);
    User findByRefreshTokenAndEmail(String token,String email);
    List<User> findByCompany(Company company);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByRole_NameIgnoreCase(String roleName);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByRole_NameIgnoreCaseAndWeeklyJobRecommendationEnabledTrue(String roleName);

    @EntityGraph(attributePaths = {"role"})
    Page<User> findByRole_NameIgnoreCaseAndWeeklyJobRecommendationEnabledTrue(String roleName, Pageable pageable);
}

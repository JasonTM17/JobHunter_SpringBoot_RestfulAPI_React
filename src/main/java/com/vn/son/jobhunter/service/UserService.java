package com.vn.son.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.UpdateUserDTO;
import com.vn.son.jobhunter.domain.res.user.CompanyUser;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.convert.UserConvert;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final CompanyService companyService;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    public CreatedUserResponse createUser(User user) throws Exception {
        String email = user.getEmail();

        if (this.userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        if (user.getCompany() != null) {
            Company company = this.companyService.findCompanyById(user.getCompany().getId());
            if (company == null) {
                throw new BadRequestException("Company ID is invalid");
            }
            user.setCompany(company);
        }

        if (user.getRole() != null) {
            Role role = this.roleService.fetchRoleById(user.getRole().getId());
            user.setRole(role);
        }

        String hashPassword = this.passwordEncoder.encode(user.getPassword());
        user.setPassword(hashPassword);

        return UserConvert.convertToResCreatedUserRes(this.userRepository.save(user));
    }

    public CreatedUserResponse fetchUserById(Long id) throws Exception {
        User user = this.findUserByIdOrThrow(id);
        return UserConvert.convertToResCreatedUserRes(user);
    }

    public void deleteUser(Long id) throws Exception {
        User user = this.findUserByIdOrThrow(id);
        this.userRepository.delete(user);
    }

    public User handleGetUserByUsername(String username) {
        return this.userRepository.findByEmail(username);
    }

    public ResultPaginationResponse getAllUser(Pageable pageable, Specification<User> spec){
        Page<User> userPage = this.userRepository.findAll(spec, pageable);

        return FormatResultPagaination.createPaginateUserRes(userPage);
    }

    public UpdatedUserResponse updateUser(Long id, UpdateUserDTO user) throws Exception {
        User currentUser = this.findUserByIdOrThrow(id);
        currentUser.setName(user.getName());
        currentUser.setGender(user.getGender());
        currentUser.setAge(user.getAge());
        currentUser.setAddress(user.getAddress());

        if (user.getCompany() != null) {
            Company company = this.companyService.findCompanyById(user.getCompany().getId());
            if (company == null) {
                throw new BadRequestException("Company ID is invalid");
            }
            currentUser.setCompany(company);
        }

        if (user.getRole() != null) {
            Role role = this.roleService.fetchRoleById(user.getRole().getId());
            currentUser.setRole(role);
        }

        return UserConvert.convertToResUpdatedUserRes(this.userRepository.save(currentUser));
    }

    public void updateUserToken(String token, String email){
        User user = this.handleGetUserByUsername(email);
        if(user != null){
            user.setRefreshToken(token);
            this.userRepository.save(user);
        }
    }

    public User getUserByRefreshTokenAndEmail(String token, String email){
        return this.userRepository.findByRefreshTokenAndEmail(token, email);
    }

    private User findUserByIdOrThrow(Long id) throws ResourceNotFoundException {
        return this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + id + " not found"));
    }
}

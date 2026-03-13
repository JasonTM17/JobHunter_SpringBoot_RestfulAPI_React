package com.vn.son.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.UpdateUserDTO;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.auth.AuthCapabilityResponse;
import com.vn.son.jobhunter.domain.res.auth.UserActionCapabilityResponse;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.convert.UserConvert;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ForbiddenException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;
import com.vn.son.jobhunter.util.security.SecurityUtils;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class UserService {
    private static final String API_USERS_COLLECTION = "/api/v1/users";
    private static final String API_USERS_ITEM = "/api/v1/users/{id}";
    private static final List<String> MANAGEMENT_ACTION_KEYS = List.of(
            "GET /api/v1/users",
            "POST /api/v1/users",
            "GET /api/v1/roles",
            "GET /api/v1/permissions",
            "GET /api/v1/resumes",
            "PUT /api/v1/resumes",
            "DELETE /api/v1/resumes/{id}",
            "POST /api/v1/jobs",
            "PUT /api/v1/jobs",
            "DELETE /api/v1/jobs/{id}",
            "POST /api/v1/companies",
            "PUT /api/v1/companies",
            "DELETE /api/v1/companies/{id}",
            "POST /api/v1/skills",
            "PUT /api/v1/skills",
            "DELETE /api/v1/skills/{id}"
    );

    private final UserRepository userRepository;
    private final CompanyService companyService;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    public CreatedUserResponse createUser(User user) throws Exception {
        user.setId(null);
        user.setRefreshToken(null);

        String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase(Locale.ROOT);
        user.setEmail(email);

        if (this.userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        User actor = getCurrentAuthenticatedUserOptional();
        if (actor == null && user.getRole() != null) {
            throw new ForbiddenException("Public registration cannot assign role");
        }

        if (actor == null && user.getCompany() != null) {
            throw new ForbiddenException("Public registration cannot assign company");
        }

        if (user.getCompany() != null) {
            Company company = this.companyService.findCompanyById(user.getCompany().getId());
            if (company == null) {
                throw new BadRequestException("Company ID is invalid");
            }
            user.setCompany(company);
        }

        if (user.getRole() != null) {
            if (actor == null) {
                throw new ForbiddenException("Public registration cannot assign role");
            }
            Role role = validateAssignableRole(actor, user.getRole().getId(), null);
            user.setRole(role);
        } else if (actor == null) {
            user.setRole(null);
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
        User actor = getCurrentAuthenticatedUserOrThrow();
        User target = this.findUserByIdOrThrow(id);

        if (!hasApiPermission(actor, API_USERS_ITEM, "DELETE")) {
            throw new ForbiddenException("You do not have permission to delete users");
        }
        if (!canDeleteTarget(actor, target)) {
            throw new ForbiddenException("You cannot delete this user");
        }

        this.userRepository.delete(target);
    }

    public User handleGetUserByUsername(String username) {
        return this.userRepository.findByEmail(username);
    }

    public User handleGetUserByUsernameWithRolePermissions(String username) {
        if (username == null || username.isBlank()) {
            return null;
        }
        return this.userRepository.findOneByEmail(username).orElse(null);
    }

    public ResultPaginationResponse getAllUser(Pageable pageable, Specification<User> spec) {
        Page<User> userPage = this.userRepository.findAll(spec, pageable);
        return FormatResultPagaination.createPaginateUserRes(userPage);
    }

    public UpdatedUserResponse updateUser(Long id, UpdateUserDTO user) throws Exception {
        User actor = getCurrentAuthenticatedUserOrThrow();
        User currentUser = this.findUserByIdOrThrow(id);

        if (!hasApiPermission(actor, API_USERS_ITEM, "PUT")) {
            throw new ForbiddenException("You do not have permission to update users");
        }
        if (!canEditTarget(actor, currentUser)) {
            throw new ForbiddenException("You cannot update this user");
        }

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
            Role role = validateAssignableRole(actor, user.getRole().getId(), currentUser);
            currentUser.setRole(role);
        }

        return UserConvert.convertToResUpdatedUserRes(this.userRepository.save(currentUser));
    }

    public void updateUserToken(String token, String email) {
        User user = this.handleGetUserByUsername(email);
        if (user != null) {
            user.setRefreshToken(token);
            this.userRepository.save(user);
        }
    }

    public User updateCurrentWeeklyRecommendationPreference(boolean enabled) throws UnauthorizedException {
        User currentUser = this.getCurrentAuthenticatedUserOrThrow();
        currentUser.setWeeklyJobRecommendationEnabled(enabled);
        return this.userRepository.save(currentUser);
    }

    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userRepository.findByRefreshTokenAndEmail(token, email);
    }

    public List<String> getCurrentPermissionKeys() {
        User actor = getCurrentAuthenticatedUserOptional();
        if (actor == null || actor.getRole() == null || actor.getRole().getPermissions() == null) {
            return Collections.emptyList();
        }
        return actor.getRole().getPermissions().stream()
                .map(permission -> permission.getMethod().toUpperCase(Locale.ROOT) + " " + permission.getApiPath())
                .distinct()
                .collect(Collectors.toList());
    }

    public List<AuthCapabilityResponse.RoleOption> getAssignableRoleOptionsForCurrentUser() {
        User actor = getCurrentAuthenticatedUserOptional();
        if (actor == null) {
            return Collections.emptyList();
        }

        return resolveAssignableRoles(actor, null).stream()
                .map(role -> new AuthCapabilityResponse.RoleOption(role.getId(), role.getName()))
                .collect(Collectors.toList());
    }

    public UserActionCapabilityResponse getUserActionCapability(Long targetUserId) throws Exception {
        User actor = getCurrentAuthenticatedUserOrThrow();
        User target = this.findUserByIdOrThrow(targetUserId);

        boolean canView = hasApiPermission(actor, API_USERS_ITEM, "GET") || hasApiPermission(actor, API_USERS_COLLECTION, "GET");
        boolean canUpdate = hasApiPermission(actor, API_USERS_ITEM, "PUT") && canEditTarget(actor, target);
        boolean canDelete = hasApiPermission(actor, API_USERS_ITEM, "DELETE") && canDeleteTarget(actor, target);

        List<AuthCapabilityResponse.RoleOption> assignableRoles = Collections.emptyList();
        if (canUpdate) {
            assignableRoles = resolveAssignableRoles(actor, target).stream()
                    .map(role -> new AuthCapabilityResponse.RoleOption(role.getId(), role.getName()))
                    .collect(Collectors.toList());
        }

        return new UserActionCapabilityResponse(
                targetUserId,
                canView,
                canUpdate,
                canDelete,
                !assignableRoles.isEmpty(),
                assignableRoles
        );
    }

    public boolean canAccessManagement(List<String> actionKeys) {
        if (actionKeys == null || actionKeys.isEmpty()) {
            return false;
        }
        return MANAGEMENT_ACTION_KEYS.stream().anyMatch(actionKeys::contains);
    }

    private Role validateAssignableRole(User actor, Long targetRoleId, User targetUser) throws Exception {
        Role requestedRole = this.roleService.fetchRoleById(targetRoleId);
        List<Role> assignableRoles = resolveAssignableRoles(actor, targetUser);
        boolean allowed = assignableRoles.stream().anyMatch(role -> role.getId() == requestedRole.getId());
        if (!allowed) {
            throw new ForbiddenException("You cannot assign this role");
        }
        return requestedRole;
    }

    private List<Role> resolveAssignableRoles(User actor, User targetUser) {
        if (actor == null || actor.getRole() == null) {
            return Collections.emptyList();
        }

        if (targetUser != null && !canEditTarget(actor, targetUser)) {
            return Collections.emptyList();
        }

        List<Role> activeRoles = this.roleService.fetchActiveRoles();
        if (isSuperAdmin(actor)) {
            return activeRoles;
        }

        int actorRank = roleRank(actor.getRole());
        return activeRoles.stream()
                .filter(role -> roleRank(role) < actorRank)
                .collect(Collectors.toList());
    }

    private boolean hasApiPermission(User actor, String apiPath, String method) {
        if (actor == null || actor.getRole() == null || actor.getRole().getPermissions() == null) {
            return false;
        }
        return actor.getRole().getPermissions().stream().anyMatch(permission ->
                apiPath.equals(permission.getApiPath()) && method.equalsIgnoreCase(permission.getMethod())
        );
    }

    private boolean canEditTarget(User actor, User target) {
        if (actor == null || target == null) {
            return false;
        }
        if (actor.getId().equals(target.getId())) {
            return true;
        }
        if (isSuperAdmin(actor)) {
            return true;
        }
        return roleRank(actor.getRole()) > roleRank(target.getRole());
    }

    private boolean canDeleteTarget(User actor, User target) {
        if (actor == null || target == null) {
            return false;
        }
        if (actor.getId().equals(target.getId())) {
            return false;
        }
        if (isSuperAdmin(actor)) {
            return true;
        }
        return roleRank(actor.getRole()) > roleRank(target.getRole());
    }

    private boolean isSuperAdmin(User user) {
        if (user == null || user.getRole() == null || user.getRole().getName() == null) {
            return false;
        }
        return "SUPER_ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private int roleRank(Role role) {
        if (role == null || role.getName() == null) {
            return 0;
        }
        String roleName = role.getName().toUpperCase(Locale.ROOT);
        return switch (roleName) {
            case "SUPER_ADMIN" -> 100;
            case "ADMIN" -> 80;
            case "MANAGER" -> 70;
            case "HR" -> 60;
            case "RECRUITER" -> 50;
            case "USER" -> 20;
            default -> 10;
        };
    }

    public User getCurrentAuthenticatedUserOrThrow() throws UnauthorizedException {
        User user = getCurrentAuthenticatedUserOptional();
        if (user == null) {
            throw new UnauthorizedException("Access token is not valid");
        }
        return user;
    }

    private User getCurrentAuthenticatedUserOptional() {
        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";
        if (email.isBlank()) {
            return null;
        }
        return this.handleGetUserByUsernameWithRolePermissions(email);
    }

    private User findUserByIdOrThrow(Long id) throws ResourceNotFoundException {
        return this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + id + " not found"));
    }
}

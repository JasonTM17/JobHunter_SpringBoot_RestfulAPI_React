package com.vn.son.jobhunter.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.repository.PermissionRepository;
import com.vn.son.jobhunter.repository.RoleRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.GenderEnum;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@Slf4j
@ConditionalOnProperty(name = "jobhunter.seed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecruitmentDemoDataSeeder recruitmentDemoDataSeeder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting database bootstrap");
        if (this.permissionRepository.count() == 0) {
            ArrayList<Permission> arr = new ArrayList<>();
            arr.add(new Permission("Create a company", "/api/v1/companies", "POST", "COMPANIES"));
            arr.add(new Permission("Update a company", "/api/v1/companies", "PUT", "COMPANIES"));
            arr.add(new Permission("Delete a company", "/api/v1/companies/{id}", "DELETE", "COMPANIES"));
            arr.add(new Permission("Get a company by id", "/api/v1/companies/{id}", "GET", "COMPANIES"));
            arr.add(new Permission("Get companies with pagination", "/api/v1/companies", "GET", "COMPANIES"));

            arr.add(new Permission("Create a job", "/api/v1/jobs", "POST", "JOBS"));
            arr.add(new Permission("Update a job", "/api/v1/jobs", "PUT", "JOBS"));
            arr.add(new Permission("Delete a job", "/api/v1/jobs/{id}", "DELETE", "JOBS"));
            arr.add(new Permission("Get a job by id", "/api/v1/jobs/{id}", "GET", "JOBS"));
            arr.add(new Permission("Get jobs with pagination", "/api/v1/jobs", "GET", "JOBS"));

            arr.add(new Permission("Create a permission", "/api/v1/permissions", "POST", "PERMISSIONS"));
            arr.add(new Permission("Update a permission", "/api/v1/permissions", "PUT", "PERMISSIONS"));
            arr.add(new Permission("Delete a permission", "/api/v1/permissions/{id}", "DELETE", "PERMISSIONS"));
            arr.add(new Permission("Get a permission by id", "/api/v1/permissions/{id}", "GET", "PERMISSIONS"));
            arr.add(new Permission("Get permissions with pagination", "/api/v1/permissions", "GET", "PERMISSIONS"));

            arr.add(new Permission("Create a resume", "/api/v1/resumes", "POST", "RESUMES"));
            arr.add(new Permission("Update a resume", "/api/v1/resumes", "PUT", "RESUMES"));
            arr.add(new Permission("Delete a resume", "/api/v1/resumes/{id}", "DELETE", "RESUMES"));
            arr.add(new Permission("Get a resume by id", "/api/v1/resumes/{id}", "GET", "RESUMES"));
            arr.add(new Permission("Get resumes with pagination", "/api/v1/resumes", "GET", "RESUMES"));

            arr.add(new Permission("Create a role", "/api/v1/roles", "POST", "ROLES"));
            arr.add(new Permission("Update a role", "/api/v1/roles", "PUT", "ROLES"));
            arr.add(new Permission("Delete a role", "/api/v1/roles/{id}", "DELETE", "ROLES"));
            arr.add(new Permission("Get a role by id", "/api/v1/roles/{id}", "GET", "ROLES"));
            arr.add(new Permission("Get roles with pagination", "/api/v1/roles", "GET", "ROLES"));

            arr.add(new Permission("Create a user", "/api/v1/users", "POST", "USERS"));
            arr.add(new Permission("Update a user", "/api/v1/users/{id}", "PUT", "USERS"));
            arr.add(new Permission("Delete a user", "/api/v1/users/{id}", "DELETE", "USERS"));
            arr.add(new Permission("Get a user by id", "/api/v1/users/{id}", "GET", "USERS"));
            arr.add(new Permission("Get users with pagination", "/api/v1/users", "GET", "USERS"));

            arr.add(new Permission("Create a subscriber", "/api/v1/subscribers", "POST", "SUBSCRIBERS"));
            arr.add(new Permission("Update a subscriber", "/api/v1/subscribers", "PUT", "SUBSCRIBERS"));
            arr.add(new Permission("Delete a subscriber", "/api/v1/subscribers/{id}", "DELETE", "SUBSCRIBERS"));
            arr.add(new Permission("Get a subscriber by id", "/api/v1/subscribers/{id}", "GET", "SUBSCRIBERS"));
            arr.add(new Permission("Get subscribers with pagination", "/api/v1/subscribers", "GET", "SUBSCRIBERS"));

            arr.add(new Permission("Upload a file", "/api/v1/files", "POST", "FILES"));
            arr.add(new Permission("Download a file", "/api/v1/files", "GET", "FILES"));

            arr.add(new Permission("Send subscribers digest email", "/api/v1/email/subscribers", "POST", "EMAIL"));
            arr.add(new Permission("Send a test email", "/api/v1/email/test", "POST", "EMAIL"));
            arr.add(new Permission("Send a test template email", "/api/v1/email/test-template", "POST", "EMAIL"));
            arr.add(new Permission("Trigger scheduler mail heartbeat", "/api/v1/email/scheduler/trigger", "POST", "EMAIL"));
            arr.add(new Permission("Trigger weekly recommendation email", "/api/v1/email/recommendations/weekly/trigger", "POST", "EMAIL"));
            arr.add(new Permission("Trigger log cleanup", "/api/v1/email/logs/cleanup/trigger", "POST", "EMAIL"));

            this.permissionRepository.saveAll(arr);
        }

        ensureFilePermissionsAreCorrect();
        ensureUserPermissionsAreCorrect();
        ensureSkillPermissionsAreCorrect();
        ensureEmailPermissionsAreCorrect();
        ensureSuperAdminBootstrap();
        this.recruitmentDemoDataSeeder.seedDemoData();
        log.info("Database bootstrap completed");
    }

    private void ensureSuperAdminBootstrap() {
        List<Permission> allPermissions = this.permissionRepository.findAll();
        if (allPermissions.isEmpty()) {
            return;
        }

        Role superAdminRole = this.roleRepository.findByName("SUPER_ADMIN");
        if (superAdminRole == null) {
            superAdminRole = new Role();
            superAdminRole.setName("SUPER_ADMIN");
            superAdminRole.setDescription("Super admin has full permissions");
            superAdminRole.setActive(true);
            superAdminRole.setPermissions(allPermissions);
            superAdminRole = this.roleRepository.save(superAdminRole);
        } else {
            superAdminRole.setActive(true);
            if (superAdminRole.getDescription() == null || superAdminRole.getDescription().isBlank()) {
                superAdminRole.setDescription("Super admin has full permissions");
            }
            // Always re-sync permissions to avoid stale data and avoid lazy-read side effects during bootstrap.
            superAdminRole.setPermissions(allPermissions);
            superAdminRole = this.roleRepository.save(superAdminRole);
        }

        ensureBootstrapAdminUser("admin@gmail.com", "I'm super admin", superAdminRole);
        ensureBootstrapAdminUser("superadmin@jobhunter.local", "Super Admin Jobhunter", superAdminRole);
    }

    private void ensureBootstrapAdminUser(String email, String name, Role superAdminRole) {
        User existing = this.userRepository.findByEmail(email);
        if (existing == null) {
            User adminUser = new User();
            adminUser.setEmail(email);
            adminUser.setAddress("HN");
            adminUser.setAge(30);
            adminUser.setGender(GenderEnum.MALE);
            adminUser.setName(name);
            adminUser.setPassword(this.passwordEncoder.encode("123456"));
            adminUser.setRole(superAdminRole);
            this.userRepository.save(adminUser);
            return;
        }

        if (existing.getRole() == null || !Objects.equals(existing.getRole().getId(), superAdminRole.getId())) {
            existing.setRole(superAdminRole);
            this.userRepository.save(existing);
        }
    }

    private void ensureFilePermissionsAreCorrect() {
        List<Permission> permissions = this.permissionRepository.findAll();
        List<Permission> toUpdate = new ArrayList<>();

        for (Permission permission : permissions) {
            if (!"FILES".equalsIgnoreCase(permission.getModule())) {
                continue;
            }
            if (!"/api/v1/files".equals(permission.getApiPath())) {
                continue;
            }

            if ("Upload a file".equalsIgnoreCase(permission.getName())
                    && !"POST".equalsIgnoreCase(permission.getMethod())) {
                permission.setMethod("POST");
                toUpdate.add(permission);
            }

            if ("Download a file".equalsIgnoreCase(permission.getName())
                    && !"GET".equalsIgnoreCase(permission.getMethod())) {
                permission.setMethod("GET");
                toUpdate.add(permission);
            }
        }

        if (!toUpdate.isEmpty()) {
            this.permissionRepository.saveAll(toUpdate);
        }
    }

    private void ensureUserPermissionsAreCorrect() {
        List<Permission> permissions = this.permissionRepository.findAll();
        List<Permission> toUpdate = new ArrayList<>();
        boolean hasUpdatePermission = false;

        for (Permission permission : permissions) {
            if (!"USERS".equalsIgnoreCase(permission.getModule())) {
                continue;
            }

            if ("Update a user".equalsIgnoreCase(permission.getName())) {
                hasUpdatePermission = true;
                boolean changed = false;

                if (!"/api/v1/users/{id}".equals(permission.getApiPath())) {
                    permission.setApiPath("/api/v1/users/{id}");
                    changed = true;
                }

                if (!"PUT".equalsIgnoreCase(permission.getMethod())) {
                    permission.setMethod("PUT");
                    changed = true;
                }

                if (changed) {
                    toUpdate.add(permission);
                }
            }
        }

        if (!hasUpdatePermission) {
            Permission permission = new Permission("Update a user", "/api/v1/users/{id}", "PUT", "USERS");
            this.permissionRepository.save(permission);
        }

        if (!toUpdate.isEmpty()) {
            this.permissionRepository.saveAll(toUpdate);
        }
    }

    private void ensureSkillPermissionsAreCorrect() {
        List<Permission> permissions = this.permissionRepository.findAll();
        ensurePermissionByNameAndContract(
                permissions,
                "Create a skill",
                "/api/v1/skills",
                "POST",
                "SKILLS"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Update a skill",
                "/api/v1/skills",
                "PUT",
                "SKILLS"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Delete a skill",
                "/api/v1/skills/{id}",
                "DELETE",
                "SKILLS"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Get skills with pagination",
                "/api/v1/skills",
                "GET",
                "SKILLS"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Get resumes by current user",
                "/api/v1/resumes/by-user",
                "POST",
                "RESUMES"
        );
    }

    private void ensureEmailPermissionsAreCorrect() {
        List<Permission> permissions = this.permissionRepository.findAll();
        ensurePermissionByNameAndContract(
                permissions,
                "Send subscribers digest email",
                "/api/v1/email/subscribers",
                "POST",
                "EMAIL"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Send a test email",
                "/api/v1/email/test",
                "POST",
                "EMAIL"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Send a test template email",
                "/api/v1/email/test-template",
                "POST",
                "EMAIL"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Trigger scheduler mail heartbeat",
                "/api/v1/email/scheduler/trigger",
                "POST",
                "EMAIL"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Trigger weekly recommendation email",
                "/api/v1/email/recommendations/weekly/trigger",
                "POST",
                "EMAIL"
        );
        ensurePermissionByNameAndContract(
                permissions,
                "Trigger log cleanup",
                "/api/v1/email/logs/cleanup/trigger",
                "POST",
                "EMAIL"
        );
    }

    private void ensurePermissionByNameAndContract(
            List<Permission> permissions,
            String name,
            String apiPath,
            String method,
            String module
    ) {
        Permission existing = permissions.stream()
                .filter(permission -> name.equalsIgnoreCase(permission.getName()))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            Permission created = new Permission(name, apiPath, method, module);
            this.permissionRepository.save(created);
            permissions.add(created);
            return;
        }

        boolean changed = false;
        if (!apiPath.equals(existing.getApiPath())) {
            existing.setApiPath(apiPath);
            changed = true;
        }
        if (!method.equalsIgnoreCase(existing.getMethod())) {
            existing.setMethod(method);
            changed = true;
        }
        if (!module.equalsIgnoreCase(existing.getModule())) {
            existing.setModule(module);
            changed = true;
        }

        if (changed) {
            this.permissionRepository.save(existing);
        }
    }
}

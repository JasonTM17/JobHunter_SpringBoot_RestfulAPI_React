package com.vn.son.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.repository.PermissionRepository;
import com.vn.son.jobhunter.repository.RoleRepository;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public Role create(Role role) throws Exception{
        if(this.roleRepository.existsByName(
              role.getName()
        )){
            throw new DataIntegrityViolationException("Role already exists");
        }
        if(role.getPermissions() != null){
            List<Long> reqPermissions = role.getPermissions()
                    .stream().map(
                            permission -> permission.getId()
                    ).collect(Collectors.toList());
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            role.setPermissions(dbPermissions);
        }
        return this.roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public Role fetchRoleById(Long id) throws Exception {
        Optional<Role> role = this.roleRepository.findById(id);
        if(role.isPresent()){
            Hibernate.initialize(role.get().getPermissions());
            return role.get();
        }else{
            throw new IdInvalidException("The specified Role ID is invalid");
        }
    }

    public Role update(Role role) throws Exception{
        Role currentRole = this.fetchRoleById(role.getId());

        if(role.getPermissions() != null){
            List<Long> reqPermissions = role.getPermissions()
                    .stream().map(
                            Permission::getId
                    ).collect(Collectors.toList());
            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            currentRole.setPermissions(dbPermissions);
        }

        currentRole.setName(role.getName());
        currentRole.setActive(role.isActive());
        currentRole.setDescription(role.getDescription());

        return this.roleRepository.save(currentRole);
    }

    public void delete(Long id) throws Exception {
        Role role = this.fetchRoleById(id);

        this.roleRepository.delete(role);
    }

    @Transactional(readOnly = true)
    public ResultPaginationResponse fetchAll(Specification<Role> spec, Pageable pageable){
        Page<Role> rolePage = this.roleRepository.findAll(spec, pageable);
        rolePage.getContent().forEach(role -> Hibernate.initialize(role.getPermissions()));
        ResultPaginationResponse response = FormatResultPagaination.createPaginationResponse(rolePage);
        return response;
    }

    public List<Role> fetchActiveRoles() {
        return this.roleRepository.findByActiveTrueOrderByNameAsc();
    }
}

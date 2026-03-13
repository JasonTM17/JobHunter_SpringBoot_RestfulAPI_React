package com.vn.son.jobhunter.controller;

import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.resume.FetchResumeResponse;
import com.vn.son.jobhunter.service.RoleService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.convert.ResumeConvert;

@RequestMapping(path = "${apiPrefix}/roles")
@RestController
@RequiredArgsConstructor
@Tag(name = "Vai trò", description = "Nhóm API quản lý vai trò và phạm vi quyền")
public class RoleController {
    private final RoleService roleService;

    @PostMapping("")
    @ApiMessage("Tạo vai trò")
    public ResponseEntity<Role> create(@Valid @RequestBody Role role) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(role));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật vai trò")
    public ResponseEntity<Role> update(@Valid @RequestBody Role role) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.roleService.update(role));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách vai trò")
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Role> spec,
            Pageable pageable
    ){
        return ResponseEntity.status(HttpStatus.OK).body(
                this.roleService.fetchAll(spec, pageable)
        );
    }

    @GetMapping("/{id}")
    @ApiMessage("Lấy chi tiết vai trò theo mã")
    public ResponseEntity<Role> fetchById(@PathVariable("id") Long id) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.roleService.fetchRoleById(id));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa vai trò")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception{
        this.roleService.delete(id);
        return ResponseEntity.ok().body(null);
    }
}

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
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.service.PermissionService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;

@RequestMapping(path = "${apiPrefix}/permissions")
@RestController
@RequiredArgsConstructor
@Tag(name = "Phân quyền", description = "Nhóm API quản lý permission trong hệ thống")
public class PermissionController {
    private final PermissionService permissionService;

    @PostMapping("")
    @ApiMessage("Tạo quyền")
    public ResponseEntity<Permission> create(@Valid @RequestBody Permission permission) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.permissionService.create(permission));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật quyền")
    public ResponseEntity<Permission> update(@Valid @RequestBody Permission permission) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.permissionService.update(permission));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách quyền")
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Permission> spec,
            Pageable pageable
    ){
        return ResponseEntity.status(HttpStatus.OK).body(
                this.permissionService.fetchAll(spec, pageable)
        );
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa quyền")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception{
        this.permissionService.delete(id);
        return ResponseEntity.ok().body(null);
    }
}

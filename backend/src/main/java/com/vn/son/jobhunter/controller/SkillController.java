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
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.service.SkillService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.error.IdInvalidException;

@RequestMapping(path = "${apiPrefix}/skills")
@RequiredArgsConstructor
@RestController
@Tag(name = "Kỹ năng", description = "Nhóm API quản lý danh mục kỹ năng tuyển dụng")
public class SkillController {
    private final SkillService skillService;

    @PostMapping("")
    @ApiMessage("Tạo kỹ năng")
    public ResponseEntity<Skill> create(@Valid @RequestBody Skill skill) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.skillService.create(skill));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật kỹ năng")
    public ResponseEntity<Skill> update(@Valid @RequestBody Skill skill) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.skillService.update(skill));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách kỹ năng")
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Skill> spec,
            Pageable pageable
            ){
        return ResponseEntity.status(HttpStatus.OK).body(
                this.skillService.fetchAllSkill(spec, pageable)
        );
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa kỹ năng")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception{
        this.skillService.deleteSkill(id);
        return ResponseEntity.ok().body(null);
    }
}

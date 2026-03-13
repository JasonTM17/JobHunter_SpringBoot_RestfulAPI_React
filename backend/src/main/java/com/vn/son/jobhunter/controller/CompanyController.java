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
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.service.CompanyService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;


@RequestMapping(path = "${apiPrefix}/companies")
@RestController
@RequiredArgsConstructor
@Tag(name = "Công ty", description = "Nhóm API quản lý thông tin công ty tuyển dụng")
public class CompanyController {
    private final CompanyService companyService;

    @PostMapping("")
    @ApiMessage("Tạo công ty")
    public ResponseEntity<Company> createCompany(@Valid @RequestBody Company company){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.companyService.createCompany(company));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách công ty")
    public ResponseEntity<ResultPaginationResponse> getAllCompany(
            @Filter Specification<Company> spec,
            Pageable pageable
    ){
        return ResponseEntity.status(HttpStatus.OK)
                .body(this.companyService.getAllCompany(pageable, spec));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật công ty")
    public ResponseEntity<Company> updateCompany(
            @Valid @RequestBody Company company
    ){
        return ResponseEntity.ok(this.companyService.updateCompany(company));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa công ty")
    public ResponseEntity<Void> deleteCompany(
            @PathVariable("id") Long id
    ){
        this.companyService.deleteCompany(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    @ApiMessage("Lấy chi tiết công ty theo mã")
    public ResponseEntity<Company> getCompany(@PathVariable("id") Long id) throws Exception{
        return ResponseEntity.ok().body(this.companyService.findCompanyById(id));
    }
}

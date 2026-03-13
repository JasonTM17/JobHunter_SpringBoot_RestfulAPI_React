package com.vn.son.jobhunter.controller;

import com.turkraft.springfilter.boot.Filter;
import com.turkraft.springfilter.builder.FilterBuilder;
import com.turkraft.springfilter.converter.FilterSpecificationConverter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.vn.son.jobhunter.domain.*;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.resume.CreatedResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.FetchResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.UpdatedResumeResponse;
import com.vn.son.jobhunter.service.ResumeService;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.convert.ResumeConvert;
import com.vn.son.jobhunter.util.security.SecurityUtils;

import java.util.List;
import java.util.stream.Collectors;

@RequestMapping(path = "${apiPrefix}/resumes")
@RequiredArgsConstructor
@RestController
@Tag(name = "Hồ sơ ứng tuyển", description = "Nhóm API quản lý hồ sơ ứng tuyển của ứng viên")
public class ResumeController {
    private final ResumeService resumeService;
    private final UserService userService;
    private final FilterSpecificationConverter filterSpecificationConverter;
    private final FilterBuilder filterBuilder;

    @PostMapping("")
    @ApiMessage("Tạo hồ sơ ứng tuyển")
    public ResponseEntity<CreatedResumeResponse> create(@Valid @RequestBody Resume resume) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.create(resume));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật hồ sơ ứng tuyển")
    public ResponseEntity<UpdatedResumeResponse> update(@Valid @RequestBody Resume resume) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.update(resume));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa hồ sơ ứng tuyển")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception{
        this.resumeService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/{id}")
    @ApiMessage("Lấy chi tiết hồ sơ ứng tuyển theo mã")
    public ResponseEntity<FetchResumeResponse> fetchById(@PathVariable("id") Long id) throws Exception {

        return ResponseEntity.status(HttpStatus.OK).body(
                ResumeConvert.convertToResFetchResumeRes(this.resumeService.fetchResumelById(id))
        );
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách hồ sơ ứng tuyển")
    @Transactional(readOnly = true)
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Resume> spec,
            Pageable pageable
    ){
        List<Long> arrJobIds = null;
        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null) {
            Company userCompany = currentUser.getCompany();
            if (userCompany != null) {
                List<Job> companyJobs = userCompany.getJobs();
                if (companyJobs != null && !companyJobs.isEmpty()) {
                    arrJobIds = companyJobs.stream().map(Job::getId)
                            .collect(Collectors.toList());
                }
            }
        }

        Specification<Resume> jobInSpec = filterSpecificationConverter.convert(filterBuilder.field("job")
                .in(filterBuilder.input(arrJobIds)).get());

        Specification<Resume> finalSpec = jobInSpec.and(spec);

        return ResponseEntity.ok().body(this.resumeService.fetchAllResume(finalSpec, pageable));
    }

    @PostMapping("/by-user")
    @ApiMessage("Lấy danh sách hồ sơ theo người dùng hiện tại")
    public ResponseEntity<ResultPaginationResponse> fetchResumeByUser(Pageable pageable) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.resumeService.fetchResumeByUser(pageable));
    }
}

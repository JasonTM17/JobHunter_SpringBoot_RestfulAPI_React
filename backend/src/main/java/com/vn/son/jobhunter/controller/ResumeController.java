package com.vn.son.jobhunter.controller;

import com.turkraft.springfilter.boot.Filter;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.dto.resume.ResumeCreateDTO;
import com.vn.son.jobhunter.domain.dto.resume.ResumeStatusUpdateDTO;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.resume.CreatedResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.FetchResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.ResumeStatusAuditResponse;
import com.vn.son.jobhunter.domain.res.resume.UpdatedResumeResponse;
import com.vn.son.jobhunter.service.ResumeService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.convert.ResumeConvert;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping(path = "${apiPrefix}/resumes")
@RequiredArgsConstructor
@RestController
@Tag(name = "Hồ sơ ứng tuyển", description = "Nhóm API quản lý hồ sơ ứng tuyển của ứng viên")
public class ResumeController {
    private final ResumeService resumeService;

    @PostMapping("")
    @ApiMessage("Tạo hồ sơ ứng tuyển")
    public ResponseEntity<CreatedResumeResponse> create(@Valid @RequestBody ResumeCreateDTO request) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.create(request));
    }

    @PutMapping("")
    @ApiMessage("Cập nhật hồ sơ ứng tuyển")
    public ResponseEntity<UpdatedResumeResponse> update(@Valid @RequestBody Resume resume) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.update(resume));
    }

    @PatchMapping("/{id}/status")
    @ApiMessage("Cập nhật trạng thái hồ sơ ứng tuyển")
    public ResponseEntity<UpdatedResumeResponse> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody ResumeStatusUpdateDTO request
    ) throws Exception {
        return ResponseEntity.ok(this.resumeService.updateStatus(id, request.getStatus(), request.getNote()));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa hồ sơ ứng tuyển")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception {
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

    @GetMapping("/{id}/audits")
    @ApiMessage("Lấy lịch sử cập nhật trạng thái hồ sơ ứng tuyển")
    public ResponseEntity<List<ResumeStatusAuditResponse>> fetchAudits(@PathVariable("id") Long id) throws Exception {
        return ResponseEntity.ok(this.resumeService.fetchResumeAudits(id));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách hồ sơ ứng tuyển")
    @Transactional(readOnly = true)
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Resume> spec,
            Pageable pageable
    ) throws Exception {
        return ResponseEntity.ok().body(this.resumeService.fetchAllResume(spec, pageable));
    }

    @PostMapping("/by-user")
    @ApiMessage("Lấy danh sách hồ sơ theo người dùng hiện tại")
    public ResponseEntity<ResultPaginationResponse> fetchResumeByUser(Pageable pageable) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.resumeService.fetchResumeByUser(pageable));
    }
}

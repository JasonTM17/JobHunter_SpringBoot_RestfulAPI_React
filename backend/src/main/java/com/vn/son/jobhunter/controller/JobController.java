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
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.job.CreatedJobResponse;
import com.vn.son.jobhunter.domain.res.job.UpdatedJobResponse;
import com.vn.son.jobhunter.service.JobService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;

@RequestMapping(path = "${apiPrefix}/jobs")
@RequiredArgsConstructor
@RestController
@Tag(name = "Việc làm", description = "Nhóm API quản lý và tra cứu tin tuyển dụng")
public class JobController {
    private final JobService jobService;

    @PostMapping("")
    @ApiMessage("Tạo việc làm")
    public ResponseEntity<CreatedJobResponse> create(@Valid @RequestBody Job job){
        return ResponseEntity.status(HttpStatus.CREATED).body(
                this.jobService.create(job)
        );
    }

    @PutMapping("")
    @ApiMessage("Cập nhật việc làm")
    public ResponseEntity<UpdatedJobResponse> update(@Valid @RequestBody Job job) throws Exception {
        return ResponseEntity.status(HttpStatus.OK).body(this.jobService.update(job));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa việc làm theo mã")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception{
        this.jobService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/{id}")
    @ApiMessage("Lấy chi tiết việc làm theo mã")
    public ResponseEntity<Job> getJob(@PathVariable("id") Long id) throws Exception{
        return ResponseEntity.ok().body(this.jobService.fetchJobById(id));
    }

    @GetMapping("")
    @ApiMessage("Lấy danh sách việc làm")
    public ResponseEntity<ResultPaginationResponse> getAll(
            @Filter Specification<Job> spec,
            Pageable pageable
    ){
        return ResponseEntity.status(HttpStatus.OK).body(
                this.jobService.fetchAllJob(spec, pageable)
        );
    }
}

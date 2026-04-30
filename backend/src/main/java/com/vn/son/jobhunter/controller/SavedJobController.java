package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.service.SavedJobService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping(path = "${apiPrefix}/saved-jobs")
@RequiredArgsConstructor
@RestController
@Tag(name = "Viec lam da luu", description = "Nhom API dong bo viec lam da luu theo tai khoan ung vien")
public class SavedJobController {
    private final SavedJobService savedJobService;

    @GetMapping("")
    @ApiMessage("Lay danh sach viec lam da luu cua tai khoan hien tai")
    public ResponseEntity<List<Job>> getCurrentUserSavedJobs() throws Exception {
        return ResponseEntity.ok(this.savedJobService.getCurrentUserSavedJobs());
    }

    @PostMapping("/{jobId}")
    @ApiMessage("Luu viec lam vao tai khoan hien tai")
    public ResponseEntity<List<Job>> saveJob(@PathVariable("jobId") Long jobId) throws Exception {
        return ResponseEntity.ok(this.savedJobService.saveJob(jobId));
    }

    @DeleteMapping("/{jobId}")
    @ApiMessage("Bo luu viec lam khoi tai khoan hien tai")
    public ResponseEntity<List<Job>> removeJob(@PathVariable("jobId") Long jobId) throws Exception {
        return ResponseEntity.ok(this.savedJobService.removeJob(jobId));
    }
}

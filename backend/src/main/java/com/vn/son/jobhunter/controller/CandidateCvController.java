package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.dto.candidate.CandidateCvRequest;
import com.vn.son.jobhunter.domain.res.candidate.CandidateCvResponse;
import com.vn.son.jobhunter.service.CandidateCvService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping(path = "${apiPrefix}/candidate/cvs")
@RequiredArgsConstructor
@RestController
@Tag(name = "Candidate CV Library", description = "Manage reusable CV files for the signed-in candidate")
public class CandidateCvController {
    private final CandidateCvService candidateCvService;

    @GetMapping("")
    @ApiMessage("Lấy danh sách CV của ứng viên hiện tại")
    public ResponseEntity<List<CandidateCvResponse>> findMine() throws Exception {
        return ResponseEntity.ok(this.candidateCvService.findMine());
    }

    @PostMapping("")
    @ApiMessage("Thêm CV vào thư viện ứng viên")
    public ResponseEntity<CandidateCvResponse> create(@Valid @RequestBody CandidateCvRequest request) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.candidateCvService.create(request));
    }

    @PatchMapping("/{id}/default")
    @ApiMessage("Đặt CV mặc định")
    public ResponseEntity<CandidateCvResponse> setDefault(@PathVariable("id") Long id) throws Exception {
        return ResponseEntity.ok(this.candidateCvService.setDefault(id));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa CV khỏi thư viện ứng viên")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws Exception {
        this.candidateCvService.delete(id);
        return ResponseEntity.ok().body(null);
    }
}

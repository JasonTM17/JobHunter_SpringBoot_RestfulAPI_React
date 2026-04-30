package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.CandidateCv;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.candidate.CandidateCvRequest;
import com.vn.son.jobhunter.domain.res.candidate.CandidateCvResponse;
import com.vn.son.jobhunter.repository.CandidateCvRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import com.vn.son.jobhunter.util.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidateCvService {
    private final CandidateCvRepository candidateCvRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CandidateCvResponse> findMine() throws UnauthorizedException {
        User user = getCurrentUser();
        return this.candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CandidateCvResponse create(CandidateCvRequest request) throws Exception {
        User user = getCurrentUser();
        String fileUrl = normalizeUrl(request.getFileUrl());
        if (this.candidateCvRepository.existsByUser_IdAndFileUrl(user.getId(), fileUrl)) {
            throw new ConflictException("CV này đã có trong thư viện của bạn.");
        }

        boolean makeDefault = Boolean.TRUE.equals(request.getDefaultCv())
                || this.candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(user.getId()).isEmpty();
        if (makeDefault) {
            clearDefault(user.getId());
        }

        CandidateCv candidateCv = new CandidateCv();
        candidateCv.setUser(user);
        candidateCv.setFileUrl(fileUrl);
        candidateCv.setFileName(normalizeFileName(request.getFileName(), fileUrl));
        candidateCv.setDefaultCv(makeDefault);
        return toResponse(this.candidateCvRepository.save(candidateCv));
    }

    @Transactional
    public CandidateCvResponse setDefault(Long id) throws Exception {
        User user = getCurrentUser();
        CandidateCv candidateCv = this.candidateCvRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CV not found"));
        clearDefault(user.getId());
        candidateCv.setDefaultCv(true);
        return toResponse(this.candidateCvRepository.save(candidateCv));
    }

    @Transactional
    public void delete(Long id) throws Exception {
        User user = getCurrentUser();
        CandidateCv candidateCv = this.candidateCvRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CV not found"));
        boolean wasDefault = candidateCv.isDefaultCv();
        this.candidateCvRepository.delete(candidateCv);

        if (wasDefault) {
            List<CandidateCv> remaining = this.candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(user.getId());
            if (!remaining.isEmpty()) {
                CandidateCv nextDefault = remaining.get(0);
                nextDefault.setDefaultCv(true);
                this.candidateCvRepository.save(nextDefault);
            }
        }
    }

    private void clearDefault(Long userId) {
        List<CandidateCv> candidateCvs = this.candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(userId);
        for (CandidateCv candidateCv : candidateCvs) {
            if (candidateCv.isDefaultCv()) {
                candidateCv.setDefaultCv(false);
                this.candidateCvRepository.save(candidateCv);
            }
        }
    }

    private User getCurrentUser() throws UnauthorizedException {
        String email = SecurityUtils.getCurrentUserLogin().orElse("");
        if (email.isBlank()) {
            throw new UnauthorizedException("Access token is not valid");
        }
        return this.userRepository.findOneByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Access token is not valid"));
    }

    private CandidateCvResponse toResponse(CandidateCv candidateCv) {
        return new CandidateCvResponse(
                candidateCv.getId(),
                candidateCv.getFileUrl(),
                candidateCv.getFileName(),
                candidateCv.isDefaultCv(),
                candidateCv.getCreatedDate()
        );
    }

    private String normalizeUrl(String rawUrl) throws BadRequestException {
        String fileUrl = rawUrl == null ? "" : rawUrl.trim();
        if (fileUrl.isBlank()) {
            throw new BadRequestException("CV URL is required");
        }
        if (fileUrl.length() > 500) {
            throw new BadRequestException("CV URL must be at most 500 characters");
        }
        return fileUrl;
    }

    private String normalizeFileName(String rawFileName, String fileUrl) {
        String fileName = rawFileName == null ? "" : rawFileName.trim();
        if (!fileName.isBlank()) {
            return fileName.length() > 255 ? fileName.substring(0, 255) : fileName;
        }
        int slash = fileUrl.lastIndexOf('/');
        String fallback = slash >= 0 ? fileUrl.substring(slash + 1) : fileUrl;
        if (fallback.isBlank()) fallback = "CV";
        return fallback.length() > 255 ? fallback.substring(0, 255) : fallback;
    }
}

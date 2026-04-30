package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.CandidateCv;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.candidate.CandidateCvRequest;
import com.vn.son.jobhunter.domain.res.candidate.CandidateCvResponse;
import com.vn.son.jobhunter.repository.CandidateCvRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.ConflictException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CandidateCvServiceTest {
    @Mock
    private CandidateCvRepository candidateCvRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CandidateCvService candidateCvService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("candidate@jobhunter.local", "token")
        );
        currentUser = new User();
        currentUser.setId(11L);
        currentUser.setEmail("candidate@jobhunter.local");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createShouldNormalizeFirstCvAndMakeItDefault() throws Exception {
        CandidateCvRequest request = new CandidateCvRequest();
        request.setFileUrl(" https://example.com/cv.pdf ");

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(currentUser));
        when(candidateCvRepository.existsByUser_IdAndFileUrl(11L, "https://example.com/cv.pdf")).thenReturn(false);
        when(candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(11L)).thenReturn(List.of());
        when(candidateCvRepository.save(any(CandidateCv.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CandidateCvResponse response = candidateCvService.create(request);

        ArgumentCaptor<CandidateCv> captor = ArgumentCaptor.forClass(CandidateCv.class);
        verify(candidateCvRepository).save(captor.capture());
        CandidateCv saved = captor.getValue();

        assertEquals("https://example.com/cv.pdf", saved.getFileUrl());
        assertEquals("cv.pdf", saved.getFileName());
        assertTrue(saved.isDefaultCv());
        assertTrue(response.defaultCv());
    }

    @Test
    void createShouldRejectDuplicateCvForCurrentUser() {
        CandidateCvRequest request = new CandidateCvRequest();
        request.setFileUrl(" https://example.com/cv.pdf ");

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(currentUser));
        when(candidateCvRepository.existsByUser_IdAndFileUrl(11L, "https://example.com/cv.pdf")).thenReturn(true);

        assertThrows(ConflictException.class, () -> candidateCvService.create(request));
    }

    @Test
    void setDefaultShouldClearPreviousDefaultForSameUser() throws Exception {
        CandidateCv currentDefault = candidateCv(301L, true);
        CandidateCv nextDefault = candidateCv(302L, false);

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(currentUser));
        when(candidateCvRepository.findByIdAndUser_Id(302L, 11L)).thenReturn(Optional.of(nextDefault));
        when(candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(11L))
                .thenReturn(List.of(currentDefault, nextDefault));
        when(candidateCvRepository.save(any(CandidateCv.class))).thenAnswer(invocation -> invocation.getArgument(0));

        candidateCvService.setDefault(302L);

        assertFalse(currentDefault.isDefaultCv());
        assertTrue(nextDefault.isDefaultCv());
    }

    @Test
    void deleteDefaultShouldPromoteRemainingCv() throws Exception {
        CandidateCv currentDefault = candidateCv(301L, true);
        CandidateCv remaining = candidateCv(302L, false);

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(currentUser));
        when(candidateCvRepository.findByIdAndUser_Id(301L, 11L)).thenReturn(Optional.of(currentDefault));
        when(candidateCvRepository.findByUser_IdOrderByDefaultCvDescCreatedDateDesc(11L))
                .thenReturn(List.of(remaining));
        when(candidateCvRepository.save(any(CandidateCv.class))).thenAnswer(invocation -> invocation.getArgument(0));

        candidateCvService.delete(301L);

        verify(candidateCvRepository).delete(currentDefault);
        assertTrue(remaining.isDefaultCv());
    }

    private CandidateCv candidateCv(Long id, boolean defaultCv) {
        CandidateCv candidateCv = new CandidateCv();
        candidateCv.setId(id);
        candidateCv.setUser(currentUser);
        candidateCv.setFileUrl("https://example.com/cv-" + id + ".pdf");
        candidateCv.setFileName("cv-" + id + ".pdf");
        candidateCv.setDefaultCv(defaultCv);
        return candidateCv;
    }
}

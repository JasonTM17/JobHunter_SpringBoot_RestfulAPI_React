package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.repository.CompanyRepository;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {
    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private CompanyService companyService;

    @Test
    void deleteCompanyShouldBlockWhenUsersOrJobsAreLinked() {
        Company company = buildCompany(5L);
        when(companyRepository.findById(5L)).thenReturn(Optional.of(company));
        when(userRepository.countByCompany(company)).thenReturn(2L);
        when(jobRepository.countByCompany(company)).thenReturn(3L);

        assertThrows(ConflictException.class, () -> companyService.deleteCompany(5L));
        verify(companyRepository, never()).delete(company);
    }

    @Test
    void findCompanyByIdOrThrowShouldReturnNotFoundForMissingCompany() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> companyService.findCompanyByIdOrThrow(99L));
    }

    private static Company buildCompany(long id) {
        Company company = new Company();
        company.setId(id);
        company.setName("Company " + id);
        return company;
    }
}

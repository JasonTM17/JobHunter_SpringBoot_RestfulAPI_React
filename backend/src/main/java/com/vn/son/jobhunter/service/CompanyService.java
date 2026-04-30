package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.repository.CompanyRepository;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    public Company createCompany(Company company) throws BadRequestException {
        normalizeCompany(company);
        return companyRepository.save(company);
    }

    public ResultPaginationResponse getAllCompany(Pageable pageable, Specification<Company> spec) {
        Page<Company> companyPage = companyRepository.findAll(spec, pageable);
        return FormatResultPagaination.createPaginationResponse(companyPage);
    }

    public Company findCompanyById(Long id) {
        return this.companyRepository.findById(id).orElse(null);
    }

    public Company findCompanyByIdOrThrow(Long id) throws ResourceNotFoundException {
        if (id == null || id <= 0) {
            throw new ResourceNotFoundException("Company not found");
        }
        return this.companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    public Company updateCompany(Company company) throws Exception {
        if (company == null || company.getId() <= 0) {
            throw new BadRequestException("Company ID is required");
        }
        normalizeCompany(company);

        Company currentCompany = findCompanyByIdOrThrow(company.getId());
        currentCompany.setName(company.getName());
        currentCompany.setLogo(company.getLogo());
        currentCompany.setDescription(company.getDescription());
        currentCompany.setAddress(company.getAddress());
        return this.companyRepository.save(currentCompany);
    }

    @Transactional
    public void deleteCompany(Long id) throws Exception {
        Company company = findCompanyByIdOrThrow(id);
        long userCount = this.userRepository.countByCompany(company);
        long jobCount = this.jobRepository.countByCompany(company);

        if (userCount > 0 || jobCount > 0) {
            throw new ConflictException(
                    "Không thể xóa công ty vì vẫn còn " + userCount + " tài khoản và " + jobCount + " việc làm liên kết."
            );
        }

        this.companyRepository.delete(company);
    }

    private void normalizeCompany(Company company) throws BadRequestException {
        if (company == null) {
            throw new BadRequestException("Company payload is required");
        }
        String name = company.getName() == null ? "" : company.getName().trim();
        if (name.isBlank()) {
            throw new BadRequestException("Company name is required");
        }
        company.setName(name);
        company.setAddress(company.getAddress() == null ? null : company.getAddress().trim());
        company.setLogo(company.getLogo() == null ? null : company.getLogo().trim());
        company.setDescription(company.getDescription() == null ? null : company.getDescription().trim());
    }
}

package com.vn.son.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.repository.CompanyRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public Company createCompany(Company company){
        return companyRepository.save(company);
    }

    public ResultPaginationResponse getAllCompany(Pageable pageable, Specification<Company> spec){
        Page<Company> companyPage = companyRepository.findAll(spec,pageable);
        ResultPaginationResponse response = FormatResultPagaination.createPaginationResponse(companyPage);
        return response;
    }

    public Company findCompanyById(Long id){
        Optional<Company> companyOptional = this.companyRepository.findById(id);
        return companyOptional.orElse(null);
    }

    public Company updateCompany(Company company){
        Optional<Company> companyOptional = this.companyRepository.findById(company.getId());
        if(companyOptional.isPresent()){
            Company currentCompany = companyOptional.get();
            currentCompany.setName(company.getName());
            currentCompany.setLogo(company.getLogo());
            currentCompany.setDescription(company.getDescription());
            currentCompany.setAddress(company.getAddress());
            return this.companyRepository.save(currentCompany);
        }
        return null;
    }

    public void deleteCompany(Long id){
        Optional<Company> companyOptional = this.companyRepository.findById(id);
        if(companyOptional.isPresent()){
            Company company = companyOptional.get();
            List<User> users = this.userRepository.findByCompany(company);
            this.userRepository.deleteAll(users);
            this.companyRepository.deleteById(id);
        }
    }
}

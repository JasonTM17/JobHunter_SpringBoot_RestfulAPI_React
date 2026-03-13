package com.vn.son.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.repository.SkillRepository;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class SkillService {
    private final SkillRepository skillRepository;

    public Skill create(Skill skill) throws Exception{
        if(this.skillRepository.existsByName(skill.getName())){
            throw new DataIntegrityViolationException("Skill name already exists");
        }
        return this.skillRepository.save(skill);
    }

    public Skill fetchSkillById(Long id) throws Exception {
        Optional<Skill> skill = this.skillRepository.findById(id);
        if (skill.isPresent()) {
            return skill.get();
        }
        throw new IdInvalidException("The specified Skill ID is invalid");
    }

    public Skill update(Skill skill) throws Exception{
        Skill currentSkill = this.fetchSkillById(skill.getId());
        if (skill.getName() != null
                && !skill.getName().trim().equalsIgnoreCase(currentSkill.getName())
                && this.skillRepository.existsByName(skill.getName().trim())) {
            throw new DataIntegrityViolationException("Skill name already exists");
        }
        currentSkill.setName(skill.getName().trim());
        return this.skillRepository.save(currentSkill);
    }

    public ResultPaginationResponse fetchAllSkill(Specification<Skill> spec, Pageable pageable){
        Page<Skill> skillPage = this.skillRepository.findAll(spec, pageable);
        ResultPaginationResponse response = FormatResultPagaination.createPaginationResponse(skillPage);
        return response;
    }

    @Transactional
    public void deleteSkill(Long id) throws Exception {
        Skill currentSkill = this.fetchSkillById(id);

        if (currentSkill.getJobs() != null) {
            currentSkill.getJobs().forEach(job -> job.getSkills().remove(currentSkill));
        }
        if (currentSkill.getSubscribers() != null) {
            currentSkill.getSubscribers().forEach(subs -> subs.getSkills().remove(currentSkill));
        }
        this.skillRepository.delete(currentSkill);
    }
}

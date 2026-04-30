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
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class SkillService {
    private final SkillRepository skillRepository;

    public Skill create(Skill skill) throws Exception{
        String name = normalizeName(skill);
        if(this.skillRepository.existsByName(name)){
            throw new DataIntegrityViolationException("Skill name already exists");
        }
        skill.setName(name);
        return this.skillRepository.save(skill);
    }

    public Skill fetchSkillById(Long id) throws Exception {
        if (id == null || id <= 0) {
            throw new ResourceNotFoundException("Skill not found");
        }
        Optional<Skill> skill = this.skillRepository.findById(id);
        if (skill.isPresent()) {
            return skill.get();
        }
        throw new ResourceNotFoundException("Skill not found");
    }

    public Skill update(Skill skill) throws Exception{
        String nextName = normalizeName(skill);
        Skill currentSkill = this.fetchSkillById(skill.getId());
        if (!nextName.equalsIgnoreCase(currentSkill.getName())
                && this.skillRepository.existsByName(nextName)) {
            throw new DataIntegrityViolationException("Skill name already exists");
        }
        currentSkill.setName(nextName);
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

    private String normalizeName(Skill skill) throws BadRequestException {
        if (skill == null) {
            throw new BadRequestException("Skill payload is required");
        }
        String name = skill.getName() == null ? "" : skill.getName().trim();
        if (name.isBlank()) {
            throw new BadRequestException("Skill name is required");
        }
        return name;
    }
}

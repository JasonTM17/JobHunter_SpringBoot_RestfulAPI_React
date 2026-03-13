package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.Subscriber;
import com.vn.son.jobhunter.domain.res.email.ResEmailJob;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.SkillRepository;
import com.vn.son.jobhunter.repository.SubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriberService {
    private final SubscriberRepository subscriberRepository;
    private final SkillRepository skillRepository;
    private final EmailService emailService;
    private final JobRepository jobRepository;

    public boolean isExistsByEmail(String email) {
        return this.subscriberRepository.existsByEmail(email);
    }

    public Subscriber create(Subscriber subs) {
        if (subs.getSkills() != null) {
            List<Long> reqSkills = subs.getSkills()
                    .stream().map(Skill::getId)
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            subs.setSkills(dbSkills);
        }

        return this.subscriberRepository.save(subs);
    }

    public Subscriber update(Subscriber subsDB, Subscriber subsRequest) {
        if (subsRequest.getSkills() != null) {
            List<Long> reqSkills = subsRequest.getSkills()
                    .stream().map(Skill::getId)
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            subsDB.setSkills(dbSkills);
        }
        return this.subscriberRepository.save(subsDB);
    }

    public Subscriber findById(long id) {
        Optional<Subscriber> subsOptional = this.subscriberRepository.findById(id);
        return subsOptional.orElse(null);
    }

    public void sendSubscribersEmailJobs() {
        List<Subscriber> listSubs = this.subscriberRepository.findAll();
        if (listSubs == null || listSubs.isEmpty()) {
            return;
        }

        for (Subscriber sub : listSubs) {
            List<Skill> listSkills = sub.getSkills();
            if (listSkills == null || listSkills.isEmpty()) {
                continue;
            }

            List<Job> listJobs = this.jobRepository.findBySkillsIn(listSkills);
            if (listJobs == null || listJobs.isEmpty()) {
                log.debug("No matching jobs for subscriber {}", sub.getEmail());
                continue;
            }

            List<ResEmailJob> digestJobs = listJobs.stream()
                    .map(this::convertJobToSendEmail)
                    .collect(Collectors.toList());

            this.emailService.sendTemplateEmailSafely(
                    sub.getEmail(),
                    "Cơ hội việc làm phù hợp đang chờ bạn khám phá",
                    "mail/subscriber-job-digest",
                    Map.of(
                            "recipientName", sub.getName() == null ? "Bạn" : sub.getName().trim(),
                            "jobs", digestJobs,
                            "digestTitle", "Gợi ý việc làm mới theo kỹ năng bạn đã đăng ký",
                            "digestSummary", "Đội ngũ Jobhunter vừa tổng hợp các vị trí phù hợp để bạn tham khảo và ứng tuyển nhanh."
                    )
            );
        }
    }

    public ResEmailJob convertJobToSendEmail(Job job) {
        ResEmailJob res = new ResEmailJob();
        res.setName(job.getName());
        res.setSalary(job.getSalary());
        res.setCompany(new ResEmailJob.CompanyEmail(job.getCompany().getName()));
        List<Skill> skills = job.getSkills();
        List<ResEmailJob.SkillEmail> skillRes = skills.stream()
                .map(skill -> new ResEmailJob.SkillEmail(skill.getName()))
                .collect(Collectors.toList());
        res.setSkills(skillRes);
        return res;
    }

    public Subscriber findByEmail(String email) {
        return this.subscriberRepository.findByEmail(email);
    }
}

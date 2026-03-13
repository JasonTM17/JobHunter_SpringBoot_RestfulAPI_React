package com.vn.son.jobhunter.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.Subscriber;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.repository.CompanyRepository;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.PermissionRepository;
import com.vn.son.jobhunter.repository.ResumeRepository;
import com.vn.son.jobhunter.repository.RoleRepository;
import com.vn.son.jobhunter.repository.SkillRepository;
import com.vn.son.jobhunter.repository.SubscriberRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import com.vn.son.jobhunter.util.constant.LevelEnum;
import com.vn.son.jobhunter.util.constant.ResumeStateEnum;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecruitmentDemoDataSeeder {
    private static final String DEFAULT_PASSWORD = "123456";
    private static final Pattern JOB_SEED_PATTERN =
            Pattern.compile("seed:jobhunter:([A-Z0-9\\-]+?)(?=-->|\\s|<|$)", Pattern.CASE_INSENSITIVE);

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final SkillRepository skillRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final SubscriberRepository subscriberRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void seedDemoData() {
        Map<String, Permission> permissionByName = this.permissionRepository.findAll().stream()
                .collect(Collectors.toMap(
                        permission -> normalizeKey(permission.getName()),
                        permission -> permission,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        Map<String, Role> roleByName = upsertRoles(permissionByName);
        List<CompanySeed> companySeeds = buildCompanySeeds();
        Map<String, Company> companyByName = upsertCompanies(companySeeds);
        Map<String, Skill> skillByName = upsertSkills(buildSkillSeeds());

        List<JobSeed> jobSeeds = buildJobSeeds(companySeeds);
        List<Job> seededJobs = upsertJobs(jobSeeds, companyByName, skillByName);

        SeededUsers seededUsers = upsertUsers(companySeeds, companyByName, roleByName);
        seedResumes(seededUsers.candidates, seededJobs);
        seedSubscribers(skillByName);

        log.info(
                "Demo seed summary => roles={}, companies={}, skills={}, jobs={}, users={}, resumes={}, subscribers={}",
                this.roleRepository.count(),
                this.companyRepository.count(),
                this.skillRepository.count(),
                this.jobRepository.count(),
                this.userRepository.count(),
                this.resumeRepository.count(),
                this.subscriberRepository.count()
        );
    }

    private Map<String, Role> upsertRoles(Map<String, Permission> permissionByName) {
        Map<String, Role> roleByName = this.roleRepository.findAll().stream()
                .collect(Collectors.toMap(
                        role -> normalizeKey(role.getName()),
                        role -> role,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        Role adminRole = upsertRole(
                roleByName,
                "ADMIN",
                "Admin can manage operational data, user accounts, and recruitment flow",
                permissionsFromNames(permissionByName, List.of(
                        "Create a company",
                        "Update a company",
                        "Delete a company",
                        "Get a company by id",
                        "Get companies with pagination",
                        "Create a job",
                        "Update a job",
                        "Delete a job",
                        "Get a job by id",
                        "Get jobs with pagination",
                        "Create a resume",
                        "Update a resume",
                        "Delete a resume",
                        "Get a resume by id",
                        "Get resumes with pagination",
                        "Get resumes by current user",
                        "Create a user",
                        "Update a user",
                        "Delete a user",
                        "Get a user by id",
                        "Get users with pagination",
                        "Get a role by id",
                        "Get roles with pagination",
                        "Get a permission by id",
                        "Get permissions with pagination",
                        "Create a subscriber",
                        "Update a subscriber",
                        "Delete a subscriber",
                        "Get a subscriber by id",
                        "Get subscribers with pagination",
                        "Create a skill",
                        "Update a skill",
                        "Delete a skill",
                        "Get skills with pagination",
                        "Upload a file",
                        "Download a file"
                ))
        );

        Role recruiterRole = upsertRole(
                roleByName,
                "RECRUITER",
                "Recruiter can manage jobs and process applications from candidates",
                permissionsFromNames(permissionByName, List.of(
                        "Get a company by id",
                        "Get companies with pagination",
                        "Create a job",
                        "Update a job",
                        "Delete a job",
                        "Get a job by id",
                        "Get jobs with pagination",
                        "Get skills with pagination",
                        "Get resumes with pagination",
                        "Update a resume",
                        "Get a resume by id",
                        "Upload a file",
                        "Download a file"
                ))
        );

        Role userRole = upsertRole(
                roleByName,
                "USER",
                "Candidate can browse jobs and submit applications",
                permissionsFromNames(permissionByName, List.of(
                        "Get a company by id",
                        "Get companies with pagination",
                        "Get a job by id",
                        "Get jobs with pagination",
                        "Get skills with pagination",
                        "Create a resume",
                        "Get resumes by current user"
                ))
        );

        roleByName.put(normalizeKey(adminRole.getName()), adminRole);
        roleByName.put(normalizeKey(recruiterRole.getName()), recruiterRole);
        roleByName.put(normalizeKey(userRole.getName()), userRole);
        return roleByName;
    }

    private Role upsertRole(
            Map<String, Role> roleByName,
            String name,
            String description,
            List<Permission> permissions
    ) {
        String key = normalizeKey(name);
        Role role = roleByName.get(key);
        if (role == null) {
            role = this.roleRepository.findByName(name);
        }
        if (role == null) {
            role = new Role();
            role.setName(name);
        }
        role.setDescription(description);
        role.setActive(true);
        role.setPermissions(permissions);
        Role saved = this.roleRepository.save(role);
        roleByName.put(key, saved);
        return saved;
    }

    private List<Permission> permissionsFromNames(
            Map<String, Permission> permissionByName,
            List<String> permissionNames
    ) {
        List<Permission> permissions = new ArrayList<>();
        for (String permissionName : permissionNames) {
            Permission permission = permissionByName.get(normalizeKey(permissionName));
            if (permission != null) {
                permissions.add(permission);
            }
        }
        return permissions;
    }

    private Map<String, Company> upsertCompanies(List<CompanySeed> seeds) {
        Map<String, Company> companyByName = this.companyRepository.findAll().stream()
                .collect(Collectors.toMap(
                        company -> normalizeKey(company.getName()),
                        company -> company,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        for (CompanySeed seed : seeds) {
            String key = normalizeKey(seed.name);
            Company company = companyByName.get(key);
            if (company == null) {
                company = new Company();
                company.setName(seed.name);
            }

            company.setDescription(seed.description);
            company.setAddress(seed.address);
            company.setLogo(seed.logo);
            Company saved = this.companyRepository.save(company);
            companyByName.put(key, saved);
        }
        return companyByName;
    }

    private Map<String, Skill> upsertSkills(List<String> skillSeeds) {
        Map<String, Skill> skillByName = this.skillRepository.findAll().stream()
                .collect(Collectors.toMap(
                        skill -> normalizeKey(skill.getName()),
                        skill -> skill,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        for (String skillName : skillSeeds) {
            String key = normalizeKey(skillName);
            Skill skill = skillByName.get(key);
            if (skill == null) {
                skill = new Skill();
                skill.setName(skillName);
            } else {
                skill.setName(skillName);
            }

            Skill saved = this.skillRepository.save(skill);
            skillByName.put(key, saved);
        }
        return skillByName;
    }

    private List<Job> upsertJobs(
            List<JobSeed> jobSeeds,
            Map<String, Company> companyByName,
            Map<String, Skill> skillByName
    ) {
        Map<String, Job> existingSeededJobs = new HashMap<>();
        for (Job job : this.jobRepository.findAll()) {
            extractSeedCode(job.getDescription()).ifPresent(code -> existingSeededJobs.put(code, job));
        }

        List<Job> savedJobs = new ArrayList<>();
        for (JobSeed seed : jobSeeds) {
            Job job = existingSeededJobs.get(seed.code);
            if (job == null) {
                job = new Job();
            }

            Company company = companyByName.get(normalizeKey(seed.companyName));
            if (company == null) {
                continue;
            }

            List<Skill> skills = seed.skillNames.stream()
                    .map(skillName -> skillByName.get(normalizeKey(skillName)))
                    .filter(skill -> skill != null)
                    .distinct()
                    .collect(Collectors.toCollection(ArrayList::new));

            job.setName(seed.name);
            job.setLocation(seed.location);
            job.setSalary(seed.salary);
            job.setQuantity(seed.quantity);
            job.setLevel(seed.level);
            job.setActive(seed.active);
            job.setStartDate(seed.startDate);
            job.setEndDate(seed.endDate);
            job.setDescription(seed.description);
            job.setCompany(company);
            job.setSkills(skills);

            Job saved = this.jobRepository.save(job);
            existingSeededJobs.put(seed.code, saved);
            savedJobs.add(saved);
        }

        return savedJobs;
    }

    private SeededUsers upsertUsers(
            List<CompanySeed> companies,
            Map<String, Company> companyByName,
            Map<String, Role> roleByName
    ) {
        List<UserSeed> seeds = new ArrayList<>();

        seeds.add(new UserSeed("admin.operations@jobhunter.local", "Tran Quoc Bao", 33, GenderEnum.MALE, "Hanoi", "ADMIN", null));
        seeds.add(new UserSeed("admin.hr@jobhunter.local", "Le My Linh", 31, GenderEnum.FEMALE, "Ho Chi Minh City", "ADMIN", null));

        List<String> recruiterNames = List.of(
                "Pham Thu Ha", "Nguyen Van Khoa", "Do Minh Chau", "Bui Thanh Son",
                "Truong Gia Han", "Dang Quoc Viet", "Hoang Linh Chi", "Tran Hoai Nam",
                "Ngo Bao Ngoc", "Phan Anh Tuan", "Le Quynh Nhu", "Vo Duc Minh",
                "Nguyen Thi Huong", "Pham Gia Huy"
        );

        for (int i = 0; i < recruiterNames.size() && i < companies.size(); i++) {
            CompanySeed company = companies.get(i);
            seeds.add(new UserSeed(
                    String.format("recruiter%02d@jobhunter.local", i + 1),
                    recruiterNames.get(i),
                    24 + (i % 8),
                    i % 3 == 0 ? GenderEnum.FEMALE : GenderEnum.MALE,
                    company.primaryLocation,
                    "RECRUITER",
                    company.name
            ));
        }

        List<String> candidateNames = List.of(
                "Nguyen Minh Anh", "Tran Quoc Tuan", "Le Hoang Nam", "Pham Bao Han",
                "Vu Thanh Dat", "Ngo Quynh Anh", "Do Duc Long", "Bui My Tien",
                "Phan Gia Bao", "Hoang Thu Trang", "Nguyen Duc Huy", "Tran Kim Ngan",
                "Le Quoc Khanh", "Dang Anh Thu", "Vo Minh Quan", "Phung Thanh Truc",
                "Mai Khanh Linh", "Nguyen Huu Phuoc", "Ta Minh Chau", "Dinh Thanh Son",
                "Pham The Anh", "Truong Bao Ngoc", "Le Duy Khang", "Nguyen Thao Vy"
        );

        List<String> candidateLocations = List.of(
                "Hanoi", "Ho Chi Minh City", "Da Nang", "Can Tho", "Hai Phong", "Nha Trang"
        );

        for (int i = 0; i < candidateNames.size(); i++) {
            seeds.add(new UserSeed(
                    String.format("candidate%02d@jobhunter.local", i + 1),
                    candidateNames.get(i),
                    21 + (i % 10),
                    i % 3 == 0 ? GenderEnum.FEMALE : (i % 3 == 1 ? GenderEnum.MALE : GenderEnum.OTHER),
                    candidateLocations.get(i % candidateLocations.size()),
                    "USER",
                    null
            ));
        }

        List<User> candidateUsers = new ArrayList<>();

        for (UserSeed seed : seeds) {
            User existing = this.userRepository.findByEmail(seed.email);
            boolean isNew = existing == null;
            User user = isNew ? new User() : existing;

            if (isNew) {
                user.setEmail(seed.email);
                user.setPassword(this.passwordEncoder.encode(DEFAULT_PASSWORD));
            } else if (user.getPassword() == null || user.getPassword().isBlank()) {
                user.setPassword(this.passwordEncoder.encode(DEFAULT_PASSWORD));
            }

            user.setName(seed.name);
            user.setAge(seed.age);
            user.setGender(seed.gender);
            user.setAddress(seed.address);

            Role role = roleByName.get(normalizeKey(seed.roleName));
            if (role != null) {
                user.setRole(role);
            }

            if (seed.companyName != null) {
                Company company = companyByName.get(normalizeKey(seed.companyName));
                user.setCompany(company);
            } else {
                user.setCompany(null);
            }

            User saved = this.userRepository.save(user);
            if ("USER".equalsIgnoreCase(seed.roleName)) {
                candidateUsers.add(saved);
            }
        }

        return new SeededUsers(candidateUsers);
    }

    private void seedResumes(List<User> candidates, List<Job> seededJobs) {
        List<Job> activeJobs = seededJobs.stream()
                .filter(Job::isActive)
                .sorted(Comparator.comparing(Job::getId))
                .toList();

        if (candidates.isEmpty() || activeJobs.isEmpty()) {
            return;
        }

        Set<String> existingPairs = new HashSet<>();
        for (Resume resume : this.resumeRepository.findAll()) {
            if (resume.getUser() == null || resume.getJob() == null) {
                continue;
            }
            existingPairs.add(resumeKey(resume.getUser().getId(), resume.getJob().getId()));
        }

        for (int i = 0; i < candidates.size(); i++) {
            User candidate = candidates.get(i);
            int applyCount = 2 + (i % 3);

            for (int j = 0; j < applyCount; j++) {
                Job job = activeJobs.get((i * 5 + j * 7) % activeJobs.size());
                String key = resumeKey(candidate.getId(), job.getId());
                if (existingPairs.contains(key)) {
                    continue;
                }

                Resume resume = new Resume();
                resume.setEmail(candidate.getEmail());
                resume.setUrl(buildResumeUrl(candidate, job));
                resume.setStatus(resolveResumeStatus(i + j));
                resume.setUser(candidate);
                resume.setJob(job);
                this.resumeRepository.save(resume);
                existingPairs.add(key);
            }
        }
    }

    private void seedSubscribers(Map<String, Skill> skillByName) {
        List<SubscriberSeed> seeds = List.of(
                new SubscriberSeed("subscriber01@jobhunter.local", "Khanh Subscriber", List.of("Java", "Spring Boot", "MySQL")),
                new SubscriberSeed("subscriber02@jobhunter.local", "Ngan Subscriber", List.of("ReactJS", "TypeScript", "Next.js")),
                new SubscriberSeed("subscriber03@jobhunter.local", "Phuoc Subscriber", List.of("Node.js", "Docker", "Redis")),
                new SubscriberSeed("subscriber04@jobhunter.local", "Bao Subscriber", List.of("AWS", "Kubernetes", "Terraform")),
                new SubscriberSeed("subscriber05@jobhunter.local", "Linh Subscriber", List.of("QA Automation", "Cypress", "Selenium")),
                new SubscriberSeed("subscriber06@jobhunter.local", "Quan Subscriber", List.of("Business Analysis", "Product Management", "UI/UX Design")),
                new SubscriberSeed("subscriber07@jobhunter.local", "Vy Subscriber", List.of("Python", "Machine Learning", "TensorFlow")),
                new SubscriberSeed("subscriber08@jobhunter.local", "Dat Subscriber", List.of("Data Engineering", "Apache Spark", "ETL")),
                new SubscriberSeed("subscriber09@jobhunter.local", "Han Subscriber", List.of("Flutter", "Mobile Development", "React Native")),
                new SubscriberSeed("subscriber10@jobhunter.local", "Trang Subscriber", List.of("DevOps", "CI/CD", "Linux")),
                new SubscriberSeed("subscriber11@jobhunter.local", "Tuan Subscriber", List.of("PostgreSQL", "Kafka", "Microservices")),
                new SubscriberSeed("subscriber12@jobhunter.local", "Minh Subscriber", List.of("Azure", "GCP", "Cloud Engineering"))
        );

        for (SubscriberSeed seed : seeds) {
            Subscriber subscriber = this.subscriberRepository.findByEmail(seed.email());
            if (subscriber == null) {
                subscriber = new Subscriber();
                subscriber.setEmail(seed.email());
            }

            subscriber.setName(seed.name());
            List<Skill> skills = seed.skillNames().stream()
                    .map(skillName -> skillByName.get(normalizeKey(skillName)))
                    .filter(skill -> skill != null)
                    .distinct()
                    .collect(Collectors.toCollection(ArrayList::new));
            subscriber.setSkills(skills);
            this.subscriberRepository.save(subscriber);
        }
    }

    private List<CompanySeed> buildCompanySeeds() {
        return List.of(
                new CompanySeed("VinaFin Tech", "Fintech", "Ha Noi", "Product company building digital banking and payment infrastructure.", "1716687538974-amzon.jpg", "HANOI"),
                new CompanySeed("Lotus Commerce", "E-commerce", "Ho Chi Minh City", "Omni-channel commerce platform serving retail chains across Vietnam.", "1716688292011-shopee.png", "HOCHIMINH"),
                new CompanySeed("Mekong Digital Solutions", "Outsourcing", "Can Tho", "Delivery center focused on modern web and cloud projects for APAC clients.", "1716688251710-pr.jpg", "HOCHIMINH"),
                new CompanySeed("Saigon Product Studio", "Product", "Ho Chi Minh City", "Cross-functional studio shipping SaaS products for SMEs.", "1716687768336-apple.jpg", "HOCHIMINH"),
                new CompanySeed("CloudNova Vietnam", "Cloud", "Da Nang", "Cloud engineering team specialized in platform modernization.", "1716687909879-google.png", "DANANG"),
                new CompanySeed("EduSpark Labs", "Edtech", "Ha Noi", "Learning technology startup building adaptive classroom tools.", "1716688187365-photoshop.png", "HANOI"),
                new CompanySeed("PixelForge Games", "Game", "Ho Chi Minh City", "Game studio focused on multiplayer mobile titles.", "1716688067538-netflix.png", "HOCHIMINH"),
                new CompanySeed("DataBridge Analytics", "AI/Data", "Ha Noi", "Data consulting and analytics services for enterprise clients.", "1716688386288-tiktok.jpg", "HANOI"),
                new CompanySeed("GreenLogistics AI", "AI/Data", "Da Nang", "Logistics optimization platform using machine learning models.", "1716688017004-lazada.png", "DANANG"),
                new CompanySeed("NextPay Systems", "Fintech", "Ho Chi Minh City", "Payment orchestration and merchant risk management platform.", "1716688336563-tiki.jpg", "HOCHIMINH"),
                new CompanySeed("Bao Minh Software", "Enterprise Software", "Ha Noi", "Enterprise workflow and document management solutions.", null, "HANOI"),
                new CompanySeed("Orion Outsourcing", "Outsourcing", "Da Nang", "Offshore engineering center for Japan and Singapore projects.", null, "DANANG"),
                new CompanySeed("VietHealth Tech", "Healthtech", "Ho Chi Minh City", "Healthcare digital records and appointment scheduling ecosystem.", null, "HOCHIMINH"),
                new CompanySeed("SmartFactory Hub", "Industry 4.0", "Bac Ninh", "Manufacturing IoT platform for factory quality and planning.", null, "HANOI"),
                new CompanySeed("Nova Retail Platform", "E-commerce", "Ho Chi Minh City", "Retail growth suite for online and in-store operations.", null, "HOCHIMINH"),
                new CompanySeed("Sunbyte Security", "Cybersecurity", "Ha Noi", "Security product team building SOC automation and compliance tools.", null, "HANOI"),
                new CompanySeed("Riverbank Banking Tech", "Fintech", "Ha Noi", "Core banking modernization and anti-fraud data pipelines.", null, "HANOI"),
                new CompanySeed("Delta Mobility", "Mobility", "Ho Chi Minh City", "Ride and delivery platform with real-time dispatch systems.", null, "HOCHIMINH"),
                new CompanySeed("AlphaAI Research Vietnam", "AI/Data", "Da Nang", "Applied AI lab for natural language and vision products.", null, "DANANG"),
                new CompanySeed("Hikari Global Services", "Outsourcing", "Ha Noi", "Engineering partner for Japanese product companies.", null, "HANOI"),
                new CompanySeed("TeraOps Cloud", "Cloud", "Da Nang", "DevOps and SRE consultancy for cloud-native teams.", null, "DANANG"),
                new CompanySeed("Zenith ERP Vietnam", "Enterprise Software", "Ha Noi", "ERP modules for finance, supply chain, and HR operations.", null, "HANOI"),
                new CompanySeed("InsightX Consulting", "Consulting", "Ho Chi Minh City", "Technology advisory and delivery for digital transformation.", null, "HOCHIMINH"),
                new CompanySeed("HomeLink Property Tech", "Proptech", "Ho Chi Minh City", "Property platform for listing, booking, and brokerage operations.", null, "HOCHIMINH")
        );
    }

    private List<String> buildSkillSeeds() {
        return List.of(
                "Java", "Spring Boot", "Hibernate", "REST API", "Microservices",
                "MySQL", "PostgreSQL", "Redis", "Kafka", "RabbitMQ",
                "Docker", "Kubernetes", "AWS", "Azure", "GCP",
                "Terraform", "CI/CD", "Linux", "Git", "DevOps",
                "TypeScript", "JavaScript", "ReactJS", "Next.js", "TailwindCSS",
                "Node.js", "Express.js", "Python", "FastAPI", "Data Engineering",
                "Apache Spark", "ETL", "Machine Learning", "TensorFlow", "QA Manual",
                "QA Automation", "Selenium", "Cypress", "Product Management", "Business Analysis",
                "UI/UX Design", "Mobile Development", "Flutter", "React Native", "Cloud Engineering"
        );
    }

    private List<JobTemplate> buildJobTemplates() {
        return List.of(
                new JobTemplate(
                        "JAVA_BACKEND",
                        "Java Backend Developer",
                        List.of("Java", "Spring Boot", "MySQL", "REST API", "Microservices"),
                        22000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Design and implement backend services for recruitment workflows",
                                "Optimize SQL queries and API response time for high traffic screens",
                                "Collaborate with frontend and QA to deliver production-ready releases"
                        ),
                        List.of(
                                "At least 2 years of backend development with Java and Spring Boot",
                                "Strong understanding of relational database design and transaction handling",
                                "Hands-on experience with REST API design and integration testing"
                        ),
                        List.of(
                                "13th month bonus and annual salary review",
                                "Premium health insurance for employee and family package",
                                "Hybrid schedule and modern engineering tooling support"
                        )
                ),
                new JobTemplate(
                        "SPRING_PLATFORM",
                        "Spring Boot Developer",
                        List.of("Java", "Spring Boot", "Kafka", "Redis", "Docker"),
                        24000000,
                        List.of(LevelEnum.FRESHER, LevelEnum.JUNIOR, LevelEnum.MIDDLE),
                        List.of(
                                "Build modular services and event-driven integrations for product teams",
                                "Develop reusable libraries for internal APIs and data contracts",
                                "Participate in code review and release planning with technical lead"
                        ),
                        List.of(
                                "Solid Java core knowledge and understanding of Spring ecosystem",
                                "Comfortable working with Dockerized local environments",
                                "Good communication for cross-team feature delivery"
                        ),
                        List.of(
                                "Structured onboarding plan for first 90 days",
                                "Weekly technical sharing and architecture guild",
                                "Laptop and learning budget from first month"
                        )
                ),
                new JobTemplate(
                        "FULLSTACK_REACT_JAVA",
                        "Fullstack Developer",
                        List.of("Java", "Spring Boot", "ReactJS", "TypeScript", "PostgreSQL"),
                        26000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Implement end-to-end features from API layer to responsive web UI",
                                "Collaborate with product team to refine sprint scope and acceptance criteria",
                                "Write maintainable tests to prevent regression during frequent releases"
                        ),
                        List.of(
                                "Experience delivering both frontend and backend modules in production",
                                "Strong JavaScript or TypeScript fundamentals and modern React practices",
                                "Comfortable with SQL, API debugging, and performance profiling"
                        ),
                        List.of(
                                "Performance bonus linked with product impact metrics",
                                "Flexible working hours for better engineering productivity",
                                "Internal mentorship from senior fullstack engineers"
                        )
                ),
                new JobTemplate(
                        "FRONTEND_REACT",
                        "Frontend ReactJS Developer",
                        List.of("ReactJS", "TypeScript", "Next.js", "TailwindCSS", "REST API"),
                        21000000,
                        List.of(LevelEnum.INTERN, LevelEnum.FRESHER, LevelEnum.JUNIOR, LevelEnum.MIDDLE),
                        List.of(
                                "Build user-facing modules for job search, detail, and application flows",
                                "Work with designers to translate Figma into production UI components",
                                "Improve usability and accessibility for desktop and mobile breakpoints"
                        ),
                        List.of(
                                "Hands-on experience with React and TypeScript in real projects",
                                "Good sense of UI consistency and component reusability",
                                "Ability to consume backend APIs and handle loading or error states"
                        ),
                        List.of(
                                "Quarterly frontend craft workshops and pair programming sessions",
                                "Company-funded tool licenses for productivity",
                                "Clear growth path from junior to senior frontend engineer"
                        )
                ),
                new JobTemplate(
                        "DEVOPS_ENGINEER",
                        "DevOps Engineer",
                        List.of("Docker", "Kubernetes", "CI/CD", "Linux", "AWS"),
                        30000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Maintain CI/CD pipelines and release reliability for multiple teams",
                                "Automate infrastructure provisioning and environment consistency",
                                "Monitor production systems and improve incident response playbooks"
                        ),
                        List.of(
                                "Experience with Kubernetes and cloud infrastructure operations",
                                "Knowledge of observability stack and incident analysis",
                                "Strong scripting mindset and automation-first approach"
                        ),
                        List.of(
                                "On-call compensation and production incident bonus policy",
                                "Annual cloud certification support package",
                                "Remote-first workflow with quarterly onsite team meetup"
                        )
                ),
                new JobTemplate(
                        "QA_ENGINEER",
                        "QA Engineer",
                        List.of("QA Manual", "QA Automation", "Cypress", "Selenium", "REST API"),
                        18000000,
                        List.of(LevelEnum.FRESHER, LevelEnum.JUNIOR, LevelEnum.MIDDLE),
                        List.of(
                                "Design test plans and execute regression across release cycles",
                                "Coordinate with developers to reproduce and prioritize defects",
                                "Automate critical test scenarios for core product features"
                        ),
                        List.of(
                                "Understanding of software testing lifecycle and defect management",
                                "Practical experience with API testing and browser automation tools",
                                "Detail-oriented mindset with strong communication in triage meetings"
                        ),
                        List.of(
                                "Stable release cadence and realistic testing timeline",
                                "Dedicated budget for QA tooling and environment setup",
                                "Career path toward SDET and quality lead roles"
                        )
                ),
                new JobTemplate(
                        "PRODUCT_MANAGER",
                        "Product Manager",
                        List.of("Product Management", "Business Analysis", "UI/UX Design", "Data Engineering"),
                        32000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Own roadmap planning and cross-team delivery for strategic features",
                                "Translate market insights into clear PRD and measurable outcomes",
                                "Work closely with engineering and design to balance scope and timeline"
                        ),
                        List.of(
                                "Prior experience in B2B or platform product management",
                                "Strong analytical skills and ability to make data-informed decisions",
                                "Excellent communication to align stakeholders and delivery teams"
                        ),
                        List.of(
                                "KPI-based bonus tied with shipped impact",
                                "Dedicated user research and product analytics support",
                                "Opportunity to lead regional product initiatives"
                        )
                ),
                new JobTemplate(
                        "DATA_ENGINEER",
                        "Data Engineer",
                        List.of("Python", "Data Engineering", "Apache Spark", "ETL", "Kafka"),
                        29000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Build and maintain scalable ETL pipelines for analytics and ML teams",
                                "Design data models that support product and business reporting use cases",
                                "Collaborate with platform team to improve data reliability and governance"
                        ),
                        List.of(
                                "Experience with distributed data processing and scheduling workflows",
                                "Strong SQL and data modeling fundamentals",
                                "Ability to monitor and optimize pipeline performance in production"
                        ),
                        List.of(
                                "Modern data stack with clear ownership and standards",
                                "Annual data conference budget and training support",
                                "Flexible hybrid policy for focused implementation work"
                        )
                ),
                new JobTemplate(
                        "BUSINESS_ANALYST",
                        "Business Analyst",
                        List.of("Business Analysis", "Product Management", "REST API", "UI/UX Design"),
                        22000000,
                        List.of(LevelEnum.FRESHER, LevelEnum.JUNIOR, LevelEnum.MIDDLE),
                        List.of(
                                "Gather business requirements and document workflow specifications",
                                "Coordinate communication between clients and delivery squads",
                                "Support UAT and release validation with domain stakeholders"
                        ),
                        List.of(
                                "Strong requirement analysis and stakeholder management capabilities",
                                "Ability to write clear user stories and process documentation",
                                "Comfortable with Agile planning and iterative delivery"
                        ),
                        List.of(
                                "Structured BA competency framework and coaching support",
                                "Cross-domain exposure across fintech, commerce, and SaaS products",
                                "Transparent progression path toward product ownership roles"
                        )
                ),
                new JobTemplate(
                        "MOBILE_ENGINEER",
                        "Mobile Developer",
                        List.of("Mobile Development", "Flutter", "React Native", "REST API", "TypeScript"),
                        23000000,
                        List.of(LevelEnum.INTERN, LevelEnum.FRESHER, LevelEnum.JUNIOR, LevelEnum.MIDDLE),
                        List.of(
                                "Develop mobile features for candidate and recruiter journeys",
                                "Ensure application performance and crash-free release quality",
                                "Integrate backend APIs and push notification workflows"
                        ),
                        List.of(
                                "Experience with Flutter or React Native in shipped applications",
                                "Understanding of mobile lifecycle, state handling, and build pipelines",
                                "Good collaboration with QA for release quality assurance"
                        ),
                        List.of(
                                "Dedicated mobile devices for QA and performance profiling",
                                "Support budget for store release and tooling",
                                "Fast-track ownership for high-impact modules"
                        )
                ),
                new JobTemplate(
                        "AI_ENGINEER",
                        "AI Engineer",
                        List.of("Python", "Machine Learning", "TensorFlow", "Data Engineering", "GCP"),
                        36000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Build ML services for matching, recommendation, and ranking use cases",
                                "Deploy model pipelines and monitor model quality in production",
                                "Work with product teams to design measurable AI experiments"
                        ),
                        List.of(
                                "Practical experience with ML frameworks and production deployment",
                                "Strong understanding of feature engineering and model evaluation",
                                "Ability to communicate trade-offs to non-technical stakeholders"
                        ),
                        List.of(
                                "Research budget and experimentation cloud credits",
                                "Collaboration with data and platform experts in one squad",
                                "Opportunity to publish internal technical papers"
                        )
                ),
                new JobTemplate(
                        "CLOUD_ENGINEER",
                        "Cloud Engineer",
                        List.of("Cloud Engineering", "AWS", "Azure", "Terraform", "Kubernetes"),
                        33000000,
                        List.of(LevelEnum.JUNIOR, LevelEnum.MIDDLE, LevelEnum.SENIOR),
                        List.of(
                                "Design secure cloud architecture for multi-service products",
                                "Automate infrastructure changes through infrastructure-as-code",
                                "Partner with application teams for scalability and cost optimization"
                        ),
                        List.of(
                                "Hands-on cloud operations experience across at least one major provider",
                                "Solid understanding of networking, IAM, and cloud security controls",
                                "Comfortable driving architecture reviews and implementation plans"
                        ),
                        List.of(
                                "Cloud certification path with exam reimbursement",
                                "Impact on large-scale systems serving nationwide users",
                                "Engineering-focused culture with practical ownership"
                        )
                )
        );
    }

    private List<JobSeed> buildJobSeeds(List<CompanySeed> companySeeds) {
        List<JobTemplate> templates = buildJobTemplates();
        List<JobSeed> seeds = new ArrayList<>();
        Instant now = Instant.now();
        int codeCounter = 1;

        for (int i = 0; i < companySeeds.size(); i++) {
            CompanySeed company = companySeeds.get(i);
            int jobsPerCompany = i % 2 == 0 ? 4 : 3;

            for (int j = 0; j < jobsPerCompany; j++) {
                JobTemplate template = templates.get((i * 3 + j) % templates.size());
                LevelEnum level = template.levels.get((i + j) % template.levels.size());
                String location = resolveLocation(company.primaryLocation, i, j);
                boolean active = (i + j) % 6 != 0;

                Instant startDate = now.minusSeconds((20L + ((i * 7L + j * 3L) % 40L)) * 24L * 3600L);
                Instant endDate = active
                        ? now.plusSeconds((25L + ((i * 5L + j * 11L) % 70L)) * 24L * 3600L)
                        : now.minusSeconds((2L + ((i * 3L + j) % 20L)) * 24L * 3600L);

                double salary = template.baseSalary + ((i % 5) * 1_500_000d) + (j * 700_000d);
                int quantity = 1 + ((i + j) % 5);
                String code = String.format("JOB-%03d", codeCounter++);
                String jobName = decorateJobTitle(template.baseTitle, level);
                String description = buildJobDescription(code, company, template, jobName);

                seeds.add(new JobSeed(
                        code,
                        jobName,
                        company.name,
                        location,
                        salary,
                        quantity,
                        level,
                        active,
                        startDate,
                        endDate,
                        description,
                        template.skillNames
                ));
            }
        }
        return seeds;
    }

    private String buildJobDescription(
            String code,
            CompanySeed company,
            JobTemplate template,
            String jobName
    ) {
        String responsibilities = toHtmlList(template.responsibilities);
        String requirements = toHtmlList(template.requirements);
        String benefits = toHtmlList(template.benefits);

        return """
                <!--seed:jobhunter:%s-->
                <h3>Mo ta cong viec</h3>
                <p>%s dang mo rong doi ngu va can %s de phat trien san pham trong linh vuc %s.</p>
                <ul>%s</ul>
                <h3>Yeu cau</h3>
                <ul>%s</ul>
                <h3>Quyen loi</h3>
                <ul>%s</ul>
                """.formatted(
                code,
                company.name,
                jobName,
                company.sector,
                responsibilities,
                requirements,
                benefits
        ).trim();
    }

    private String toHtmlList(List<String> items) {
        return items.stream()
                .map(item -> "<li>" + item + "</li>")
                .collect(Collectors.joining());
    }

    private String decorateJobTitle(String baseTitle, LevelEnum level) {
        return switch (level) {
            case INTERN -> baseTitle + " Intern";
            case FRESHER -> baseTitle + " Fresher";
            case JUNIOR -> "Junior " + baseTitle;
            case MIDDLE -> baseTitle;
            case SENIOR -> "Senior " + baseTitle;
        };
    }

    private String resolveLocation(String primaryLocation, int companyIndex, int slotIndex) {
        if (slotIndex == 0) {
            return primaryLocation;
        }
        if ((companyIndex + slotIndex) % 5 == 0) {
            return "REMOTE";
        }
        if ((companyIndex + slotIndex) % 3 == 0) {
            return "DANANG";
        }
        return (companyIndex + slotIndex) % 2 == 0 ? "HANOI" : "HOCHIMINH";
    }

    private Optional<String> extractSeedCode(String description) {
        if (description == null || description.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = JOB_SEED_PATTERN.matcher(description);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).toUpperCase(Locale.ROOT));
        }
        return Optional.empty();
    }

    private ResumeStateEnum resolveResumeStatus(int value) {
        int idx = Math.floorMod(value, 4);
        if (idx == 0) {
            return ResumeStateEnum.PENDING;
        }
        if (idx == 1) {
            return ResumeStateEnum.REVIEWING;
        }
        if (idx == 2) {
            return ResumeStateEnum.APPROVED;
        }
        return ResumeStateEnum.REJECTED;
    }

    private String buildResumeUrl(User candidate, Job job) {
        String safeName = candidate.getName() == null
                ? "candidate"
                : candidate.getName().trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return "https://cv.jobhunter.local/" + safeName + "-u" + candidate.getId() + "-j" + job.getId() + ".pdf";
    }

    private String resumeKey(Long userId, Long jobId) {
        return userId + "-" + jobId;
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private record CompanySeed(
            String name,
            String sector,
            String address,
            String description,
            String logo,
            String primaryLocation
    ) {}

    private record JobTemplate(
            String code,
            String baseTitle,
            List<String> skillNames,
            double baseSalary,
            List<LevelEnum> levels,
            List<String> responsibilities,
            List<String> requirements,
            List<String> benefits
    ) {}

    private record JobSeed(
            String code,
            String name,
            String companyName,
            String location,
            double salary,
            int quantity,
            LevelEnum level,
            boolean active,
            Instant startDate,
            Instant endDate,
            String description,
            List<String> skillNames
    ) {}

    private record UserSeed(
            String email,
            String name,
            int age,
            GenderEnum gender,
            String address,
            String roleName,
            String companyName
    ) {}

    private record SubscriberSeed(
            String email,
            String name,
            List<String> skillNames
    ) {}

    private static class SeededUsers {
        private final List<User> candidates;

        private SeededUsers(List<User> candidates) {
            this.candidates = candidates;
        }
    }
}

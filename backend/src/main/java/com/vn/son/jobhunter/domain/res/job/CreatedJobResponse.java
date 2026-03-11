package com.vn.son.jobhunter.domain.res.job;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.util.constant.LevelEnum;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class CreatedJobResponse {
    private Long id;
    private String name;
    private String location;
    private double salary;
    private int quantity;
    private LevelEnum level;
    private boolean isActive;
    private String description;
    private Instant startDate;
    private Instant endDate;
    private String createdBy;
    private Instant createdDate;
    private List<String> skills;
}

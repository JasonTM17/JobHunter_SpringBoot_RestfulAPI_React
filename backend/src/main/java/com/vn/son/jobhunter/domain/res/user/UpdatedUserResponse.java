package com.vn.son.jobhunter.domain.res.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.vn.son.jobhunter.util.constant.GenderEnum;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdatedUserResponse {
    private Long id;

    private String name;

    private int age;

    private String address;

    private GenderEnum gender;

//    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss a", timezone = "GMT+7")
    private Instant lastModifiedDate;

    private CompanyUser company;

    private RoleUser role;
}

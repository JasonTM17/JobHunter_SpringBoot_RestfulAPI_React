package com.vn.son.jobhunter.util.convert;

import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.res.resume.CreatedResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.FetchResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.UpdatedResumeResponse;

public class ResumeConvert {
    public static CreatedResumeResponse convertToResCreatedResumeRes(Resume resume){
        CreatedResumeResponse res = new CreatedResumeResponse();

        res.setId(resume.getId());
        res.setCreatedDate(resume.getCreatedDate());
        res.setCreatedBy(resume.getCreatedBy());

        return res;
    }

    public static UpdatedResumeResponse convertToResUpdatedResumeRes(Resume resume){
        UpdatedResumeResponse res = new UpdatedResumeResponse();

        res.setLastModifiedDate(resume.getLastModifiedDate());
        res.setLastModifiedBy(resume.getLastModifiedBy());

        return res;
    }

    public static FetchResumeResponse convertToResFetchResumeRes(Resume resume){
        FetchResumeResponse res = new FetchResumeResponse();

        res.setId(resume.getId());
        res.setEmail(resume.getEmail());
        res.setUrl(resume.getUrl());
        res.setStatus(resume.getStatus());
        res.setLastModifiedDate(resume.getLastModifiedDate());
        res.setLastModifiedBy(resume.getLastModifiedBy());
        res.setCreatedDate(resume.getCreatedDate());
        res.setCreatedBy(resume.getCreatedBy());

        if(resume.getJob() != null && resume.getJob().getCompany() != null){
            res.setCompanyName(resume.getJob().getCompany().getName());
        }

        if (resume.getUser() != null) {
            res.setUser(new FetchResumeResponse.UserResume(resume.getUser().getId(), resume.getUser().getName()));
        }
        if (resume.getJob() != null) {
            res.setJob(new FetchResumeResponse.JobResume(resume.getJob().getId(), resume.getJob().getName()));
        }
        return res;
    }
}

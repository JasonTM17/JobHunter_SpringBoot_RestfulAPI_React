package com.vn.son.jobhunter.util.response;

import org.springframework.data.domain.Page;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.resume.FetchResumeResponse;
import com.vn.son.jobhunter.domain.res.user.CompanyUser;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.MetaResponse;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.util.convert.ResumeConvert;
import com.vn.son.jobhunter.util.convert.UserConvert;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class FormatResultPagaination {
    public static ResultPaginationResponse createPaginationResponse(Page page) {
        ResultPaginationResponse rs = new ResultPaginationResponse();
        MetaResponse mr = new MetaResponse();

        mr.setPage(page.getNumber() + 1);
        mr.setPageSize(page.getSize());
        mr.setPages(page.getTotalPages());
        mr.setTotal(page.getTotalElements());

        rs.setMeta(mr);
        rs.setResult(page.getContent());

        return rs;
    }

    public static ResultPaginationResponse createPaginateUserRes(Page<User> page) {
        ResultPaginationResponse rs = new ResultPaginationResponse();
        MetaResponse mr = new MetaResponse();

        mr.setPage(page.getNumber() + 1);
        mr.setPageSize(page.getSize());
        mr.setPages(page.getTotalPages());
        mr.setTotal(page.getTotalElements());

        rs.setMeta(mr);

        List<CreatedUserResponse> listUser = page.getContent()
                .stream().map(UserConvert::convertToResCreatedUserRes)
                .collect(Collectors.toList());

        rs.setResult(listUser);

        return rs;
    }

    public static ResultPaginationResponse createPaginateResumeRes(Page<Resume> page) {
        ResultPaginationResponse rs = new ResultPaginationResponse();
        MetaResponse mr = new MetaResponse();

        mr.setPage(page.getNumber() + 1);
        mr.setPageSize(page.getSize());
        mr.setPages(page.getTotalPages());
        mr.setTotal(page.getTotalElements());

        rs.setMeta(mr);

        List<FetchResumeResponse> listResume = page.getContent()
                .stream().map(
                        ResumeConvert::convertToResFetchResumeRes
                ).toList();

        rs.setResult(listResume);

        return rs;
    }
}

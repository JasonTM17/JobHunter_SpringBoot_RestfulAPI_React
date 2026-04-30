package com.vn.son.jobhunter.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import com.vn.son.jobhunter.domain.Subscriber;
import com.vn.son.jobhunter.service.SubscriberService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.security.SecurityUtils;

@RestController
@RequestMapping(path = "${apiPrefix}")
@Tag(name = "Đăng ký nhận mail", description = "Nhóm API đăng ký nhận email gợi ý theo kỹ năng")
public class SubscriberController {
    private final SubscriberService subscriberService;

    public SubscriberController(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    @PostMapping("/subscribers")
    @ApiMessage("Tạo subscriber mới")
    public ResponseEntity<Subscriber> create(@Valid @RequestBody Subscriber sub) throws IdInvalidException, ConflictException {
        Subscriber existing = this.subscriberService.findByEmail(sub.getEmail());
        if (existing != null && existing.getUnsubscribedAt() != null) {
            return ResponseEntity.status(HttpStatus.OK).body(this.subscriberService.update(existing, sub));
        }
        if (existing != null) {
            throw new ConflictException("Email đã đăng ký nhận gợi ý việc làm.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(this.subscriberService.create(sub));
    }

    @PutMapping("/subscribers")
    @ApiMessage("Cập nhật thông tin subscriber")
    public ResponseEntity<Subscriber> update(@RequestBody Subscriber subsRequest) throws IdInvalidException {
        // check id
        Subscriber subsDB = this.subscriberService.findById(subsRequest.getId());
        if (subsDB == null) {
            throw new IdInvalidException("Id " + subsRequest.getId() + " is not valid");
        }
        return ResponseEntity.ok().body(this.subscriberService.update(subsDB, subsRequest));
    }

    @PostMapping("/subscribers/skills")
    @ApiMessage("Lấy danh sách kỹ năng đã theo dõi của subscriber hiện tại")
    public ResponseEntity<Subscriber> getSubscribersSkill() throws IdInvalidException {
        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";
        return ResponseEntity.status(HttpStatus.OK).body(this.subscriberService.findByEmail(email));
    }

    @GetMapping("/subscribers/unsubscribe")
    @ApiMessage("Huy dang ky nhan email goi y viec lam")
    public ResponseEntity<String> unsubscribe(@RequestParam("token") String token) {
        this.subscriberService.unsubscribe(token);
        return ResponseEntity.ok("Email preference updated.");
    }
}

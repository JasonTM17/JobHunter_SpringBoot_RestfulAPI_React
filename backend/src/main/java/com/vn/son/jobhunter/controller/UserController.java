package com.vn.son.jobhunter.controller;

import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.UpdateUserDTO;
import com.vn.son.jobhunter.domain.res.user.CreatedUserResponse;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.user.UpdatedUserResponse;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;

@RequestMapping(path = "${apiPrefix}/users")
@RequiredArgsConstructor
@RestController
public class UserController {
    private final UserService userService;

    @PostMapping("")
    @ApiMessage("Create a user")
    public ResponseEntity<CreatedUserResponse> createUser(@Valid @RequestBody User user) throws Exception {
        CreatedUserResponse newUser = this.userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @GetMapping("")
    @ApiMessage("Fetch all user data")
    public ResponseEntity<ResultPaginationResponse> getAllUser(
            @Filter Specification<User> spec,
            Pageable pageable
    ){
        return ResponseEntity.status(HttpStatus.OK)
                .body(this.userService.getAllUser(pageable, spec));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch user by id")
    public ResponseEntity<CreatedUserResponse> fetchUserById(
            @PathVariable("id") Long id
    ) throws Exception {
        return ResponseEntity.ok(this.userService.fetchUserById(id));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update a user")
    public ResponseEntity<UpdatedUserResponse> updateUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserDTO user
    ) throws Exception {
        return ResponseEntity.ok(this.userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete a user")
    public ResponseEntity<Void> deleteUser(
            @PathVariable("id") Long id
    ) throws Exception {
        this.userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

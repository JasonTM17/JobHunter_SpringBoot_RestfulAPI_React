package com.vn.son.jobhunter.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.vn.son.jobhunter.domain.res.files.UploadFileResponse;
import com.vn.son.jobhunter.service.FileService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.error.StorageException;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping(path = "${apiPrefix}/files")
@RequiredArgsConstructor
public class FileController {
    private static final Pattern SAFE_FOLDER = Pattern.compile("^[a-zA-Z0-9/_-]+$");
    private final FileService fileService;
    @Value("${son.upload-file.base-uri}")
    private String baseURI;

    @PostMapping("")
    @ApiMessage("Upload single file")
    public ResponseEntity<UploadFileResponse> upload(
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestParam("folder") String folder
    ) throws URISyntaxException, IOException, StorageException {
        validateFolder(folder);
        if(file == null || file.isEmpty()){
            throw new StorageException("File is empty, please up load a file");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.isBlank()) {
            throw new StorageException("File name is invalid");
        }
        String lowerCaseName = fileName.toLowerCase(Locale.ROOT);
        List<String> allowedExtensions = Arrays.asList(".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx");
        boolean isValid = allowedExtensions.stream().anyMatch(
                lowerCaseName::endsWith
        );

        if(!isValid){
            throw new StorageException("Invalid file extension. Only allows " + allowedExtensions.toString());
        }

        this.fileService.createUploadFolder(baseURI + folder);
        return ResponseEntity.ok().body(this.fileService.store(file, folder));
    }

    @GetMapping("")
    @ApiMessage("Download a file")
    public ResponseEntity<Resource> download(
            @RequestParam(name = "fileName", required = false) String fileName,
            @RequestParam(name = "folder", required = false) String folder)
            throws StorageException, URISyntaxException, FileNotFoundException {
        if (fileName == null || folder == null) {
            throw new StorageException("Missing required params : (fileName or folder) in query params.");
        }
        validateFolder(folder);
        if (fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            throw new StorageException("Invalid fileName");
        }

        // check file exist (and not a directory)
        long fileLength = this.fileService.getFileLength(fileName, folder);
        if (fileLength == 0) {
            throw new StorageException("File with name = " + fileName + " not found.");
        }

        // download a file
        InputStreamResource resource = this.fileService.getResource(fileName, folder);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(fileLength)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    private void validateFolder(String folder) throws StorageException {
        if (folder == null || folder.isBlank()) {
            throw new StorageException("Folder is required");
        }
        if (folder.contains("..") || folder.startsWith("/") || folder.startsWith("\\")) {
            throw new StorageException("Invalid folder value");
        }
        if (!SAFE_FOLDER.matcher(folder).matches()) {
            throw new StorageException("Folder contains invalid characters");
        }
    }
}

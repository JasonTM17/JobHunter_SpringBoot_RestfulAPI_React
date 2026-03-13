package com.vn.son.jobhunter.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.vn.son.jobhunter.domain.res.files.UploadFileResponse;

import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;

@Service
@Slf4j
public class FileService {
    @Value("${son.upload-file.base-uri}")
    private String baseURI;
    public void createUploadFolder(String folder) throws URISyntaxException {
        URI uri = new URI(folder);
        Path path = Paths.get(uri);
        if (!Files.isDirectory(path)) {
            try {
                Files.createDirectories(path);
                log.info("Created upload directory at {}", path);
            } catch (IOException e) {
                log.error("Failed to create upload directory at {}", path, e);
                throw new IllegalStateException("Cannot create upload directory.", e);
            }
        } else {
            log.debug("Skip creating upload directory because it already exists at {}", path);
        }
    }

    public UploadFileResponse store(MultipartFile file, String folder) throws URISyntaxException,
            IOException {
        // create unique filename
        String finalName = System.currentTimeMillis() + "-" + StringUtils.cleanPath(file.getOriginalFilename());
        URI uri = new URI(baseURI + folder + "/" + finalName);
        Path path = Paths.get(uri);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path,
                    StandardCopyOption.REPLACE_EXISTING);
        }
        return new UploadFileResponse(finalName, Instant.now());
    }

    public long getFileLength(String fileName, String folder) throws URISyntaxException {
        URI uri = new URI(baseURI + folder + "/" + fileName);
        Path path = Paths.get(uri);

        File tmpDir = new File(path.toString());

        // file không tồn tại, hoặc file là 1 director => return 0
        if (!tmpDir.exists() || tmpDir.isDirectory())
            return 0;
        return tmpDir.length();
    }

    public InputStreamResource getResource(String fileName, String folder)
            throws URISyntaxException, FileNotFoundException {
        URI uri = new URI(baseURI + folder + "/" + fileName);
        Path path = Paths.get(uri);

        File file = new File(path.toString());
        return new InputStreamResource(new FileInputStream(file));
    }
}

package com.vn.son.jobhunter.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.vn.son.jobhunter.domain.res.files.UploadFileResponse;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
public class FileService {
    @Value("${son.upload-file.base-uri}")
    private String baseURI;

    public void createUploadFolder(String folder) throws URISyntaxException {
        Path path = resolveFolderPath(folder);
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

    public UploadFileResponse store(MultipartFile file, String folder) throws URISyntaxException, IOException {
        String normalizedFolder = normalizeFolder(folder);
        Path folderPath = resolveFolderPath(normalizedFolder);
        if (!Files.isDirectory(folderPath)) {
            Files.createDirectories(folderPath);
        }

        String finalName = generateStoredFileName(file.getOriginalFilename());
        Path target = folderPath.resolve(finalName).normalize();
        if (!target.startsWith(folderPath)) {
            throw new IllegalStateException("Cannot write file outside configured storage folder");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String publicUrl = "/storage/" + normalizedFolder + "/" + finalName;
        return new UploadFileResponse(
                finalName,
                normalizedFolder,
                publicUrl,
                file.getContentType(),
                file.getSize(),
                Instant.now()
        );
    }

    public long getFileLength(String fileName, String folder) throws URISyntaxException {
        Path path = resolveFilePath(folder, fileName);
        File target = path.toFile();

        if (!target.exists() || target.isDirectory()) {
            return 0;
        }
        return target.length();
    }

    public InputStreamResource getResource(String fileName, String folder)
            throws URISyntaxException, FileNotFoundException {
        Path path = resolveFilePath(folder, fileName);
        File file = path.toFile();
        return new InputStreamResource(new FileInputStream(file));
    }

    private Path resolveFilePath(String folder, String fileName) throws URISyntaxException {
        Path folderPath = resolveFolderPath(folder);
        Path filePath = folderPath.resolve(fileName).normalize();
        if (!filePath.startsWith(folderPath)) {
            throw new IllegalStateException("Invalid file path");
        }
        return filePath;
    }

    private Path resolveFolderPath(String folder) throws URISyntaxException {
        URI uri = new URI(baseURI);
        Path rootPath = Paths.get(uri).normalize();
        String normalizedFolder = normalizeFolder(folder);
        Path folderPath = normalizedFolder.isEmpty()
                ? rootPath
                : rootPath.resolve(normalizedFolder).normalize();

        if (!folderPath.startsWith(rootPath)) {
            throw new IllegalStateException("Invalid folder path");
        }
        return folderPath;
    }

    private String normalizeFolder(String folder) {
        if (folder == null) return "";
        String normalized = folder.trim().replace("\\", "/");
        normalized = normalized.replaceAll("/+", "/");
        normalized = normalized.replaceAll("^/+", "");
        normalized = normalized.replaceAll("/+$", "");
        return normalized;
    }

    private String generateStoredFileName(String originalFileName) {
        String cleanName = StringUtils.cleanPath(originalFileName == null ? "" : originalFileName);
        String extension = extractExtension(cleanName);
        String token = UUID.randomUUID().toString().replace("-", "");
        return Instant.now().toEpochMilli() + "-" + token + extension;
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf(".");
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        String extension = filename.substring(dotIndex).toLowerCase(Locale.ROOT);
        return extension.replaceAll("[^a-z0-9.]", "");
    }
}

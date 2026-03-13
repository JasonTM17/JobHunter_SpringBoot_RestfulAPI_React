package com.vn.son.jobhunter.controller;

import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.vn.son.jobhunter.domain.res.files.UploadFileResponse;
import com.vn.son.jobhunter.service.FileService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.error.StorageException;

import javax.imageio.ImageIO;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping(path = "${apiPrefix}/files")
@RequiredArgsConstructor
@Tag(name = "Tệp & lưu trữ", description = "Nhóm API tải lên và tải xuống tệp")
public class FileController {
    private static final Pattern SAFE_FOLDER = Pattern.compile("^[a-zA-Z0-9/_-]+$");
    private static final List<String> IMAGE_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final List<String> DOCUMENT_EXTENSIONS = List.of(".pdf", ".doc", ".docx");
    private static final Set<String> IMAGE_ONLY_FOLDERS = Set.of("company", "avatar", "image", "images");
    private static final Set<String> DOCUMENT_FOLDERS = Set.of("resume", "resumes", "cv", "document", "documents");

    private final FileService fileService;

    @Value("${son.upload-file.max-size-bytes:5242880}")
    private long maxUploadSizeBytes;

    @PostMapping("")
    @ApiMessage("Tải lên một tệp")
    public ResponseEntity<UploadFileResponse> upload(
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestParam("folder") String folder
    ) throws URISyntaxException, IOException, StorageException {
        String normalizedFolder = normalizeFolder(folder);
        validateFolder(normalizedFolder);

        if (file == null || file.isEmpty()) {
            throw new StorageException("File is empty, please upload a valid file");
        }

        String fileName = file.getOriginalFilename();
        if (!StringUtils.hasText(fileName)) {
            throw new StorageException("File name is invalid");
        }

        String cleanedFileName = StringUtils.cleanPath(fileName);
        if (cleanedFileName.contains("..") || cleanedFileName.contains("/") || cleanedFileName.contains("\\")) {
            throw new StorageException("File name is invalid");
        }

        validateFile(file, cleanedFileName, resolvePolicy(normalizedFolder));
        this.fileService.createUploadFolder(normalizedFolder);
        return ResponseEntity.ok(this.fileService.store(file, normalizedFolder));
    }

    @GetMapping("")
    @ApiMessage("Tải xuống tệp")
    public ResponseEntity<Resource> download(
            @RequestParam(name = "fileName", required = false) String fileName,
            @RequestParam(name = "folder", required = false) String folder)
            throws StorageException, URISyntaxException, FileNotFoundException {
        if (fileName == null || folder == null) {
            throw new StorageException("Missing required params : (fileName or folder) in query params.");
        }
        String normalizedFolder = normalizeFolder(folder);
        validateFolder(normalizedFolder);
        if (fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            throw new StorageException("Invalid fileName");
        }

        long fileLength = this.fileService.getFileLength(fileName, normalizedFolder);
        if (fileLength == 0) {
            throw new StorageException("File with name = " + fileName + " not found.");
        }

        InputStreamResource resource = this.fileService.getResource(fileName, normalizedFolder);

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

    private String normalizeFolder(String folder) {
        if (folder == null) return "";
        String normalized = folder.trim().replace("\\", "/");
        normalized = normalized.replaceAll("/+", "/");
        normalized = normalized.replaceAll("^/+", "");
        normalized = normalized.replaceAll("/+$", "");
        return normalized;
    }

    private UploadPolicy resolvePolicy(String normalizedFolder) {
        String root = normalizedFolder.split("/", 2)[0].toLowerCase(Locale.ROOT);
        if (IMAGE_ONLY_FOLDERS.contains(root)) return UploadPolicy.IMAGE_ONLY;
        if (DOCUMENT_FOLDERS.contains(root)) return UploadPolicy.DOCUMENT_ONLY;
        return UploadPolicy.MIXED;
    }

    private void validateFile(MultipartFile file, String cleanFileName, UploadPolicy policy) throws StorageException, IOException {
        if (file.getSize() <= 0) {
            throw new StorageException("File is empty, please upload a valid file");
        }
        if (maxUploadSizeBytes > 0 && file.getSize() > maxUploadSizeBytes) {
            throw new StorageException("File is too large. Max upload size is " + maxUploadSizeBytes + " bytes");
        }

        String extension = extractExtension(cleanFileName);
        List<String> allowedExtensions = switch (policy) {
            case IMAGE_ONLY -> IMAGE_EXTENSIONS;
            case DOCUMENT_ONLY -> DOCUMENT_EXTENSIONS;
            case MIXED -> {
                Set<String> allExtensions = new LinkedHashSet<>(IMAGE_EXTENSIONS);
                allExtensions.addAll(DOCUMENT_EXTENSIONS);
                yield List.copyOf(allExtensions);
            }
        };

        if (!allowedExtensions.contains(extension)) {
            throw new StorageException("Invalid file extension. Allowed: " + allowedExtensions);
        }

        String contentType = normalizeContentType(file.getContentType());
        boolean expectsImage = policy == UploadPolicy.IMAGE_ONLY || (policy == UploadPolicy.MIXED && IMAGE_EXTENSIONS.contains(extension));
        if (expectsImage) {
            if (!contentType.isBlank() && !contentType.startsWith("image/")) {
                throw new StorageException("Only image files are allowed for this folder");
            }
            if (!isValidImage(file)) {
                throw new StorageException("Uploaded file is not a valid image");
            }
        }
    }

    private String extractExtension(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        int dotIndex = lower.lastIndexOf(".");
        if (dotIndex < 0 || dotIndex == lower.length() - 1) {
            return "";
        }
        return lower.substring(dotIndex);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) return "";
        int semicolon = contentType.indexOf(';');
        String normalized = semicolon >= 0 ? contentType.substring(0, semicolon) : contentType;
        return normalized.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isValidImage(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            return ImageIO.read(inputStream) != null;
        }
    }

    private enum UploadPolicy {
        IMAGE_ONLY,
        DOCUMENT_ONLY,
        MIXED
    }
}

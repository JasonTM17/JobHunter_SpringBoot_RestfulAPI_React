param(
    # Để trống = build local: jobhunter-backend:tag và jobhunter-frontend:tag
    [string]$DockerhubUsername = "",

    [string]$ImageTag = "latest",

    [string]$NextPublicApiBaseUrl = "http://localhost:8080",
    [string]$NextPublicStorageBaseUrl = "http://localhost:8080",
    [string]$InternalApiBaseUrl = "http://backend:8080",
    [string]$InternalStorageBaseUrl = "http://backend:8080",

    [switch]$NoCache,
    [switch]$AlsoTagLatest
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendContext = Join-Path $repoRoot "backend"
$frontendContext = Join-Path $repoRoot "frontend"

if ([string]::IsNullOrWhiteSpace($DockerhubUsername)) {
    $backendImage = "jobhunter-backend:$ImageTag"
    $frontendImage = "jobhunter-frontend:$ImageTag"
}
else {
    $backendImage = "$DockerhubUsername/jobhunter-backend:$ImageTag"
    $frontendImage = "$DockerhubUsername/jobhunter-frontend:$ImageTag"
}

$commonBuildArgs = @()
if ($NoCache) {
    $commonBuildArgs += "--no-cache"
}

Write-Host "Building backend image: $backendImage"
docker build @commonBuildArgs `
    -f (Join-Path $backendContext "Dockerfile") `
    -t $backendImage `
    $backendContext

Write-Host "Building frontend image: $frontendImage"
docker build @commonBuildArgs `
    -f (Join-Path $frontendContext "Dockerfile") `
    --build-arg "NEXT_PUBLIC_API_BASE_URL=$NextPublicApiBaseUrl" `
    --build-arg "NEXT_PUBLIC_STORAGE_BASE_URL=$NextPublicStorageBaseUrl" `
    --build-arg "INTERNAL_API_BASE_URL=$InternalApiBaseUrl" `
    --build-arg "INTERNAL_STORAGE_BASE_URL=$InternalStorageBaseUrl" `
    -t $frontendImage `
    $frontendContext

if ($AlsoTagLatest -and $ImageTag -ne "latest") {
    if ([string]::IsNullOrWhiteSpace($DockerhubUsername)) {
        $backendLatest = "jobhunter-backend:latest"
        $frontendLatest = "jobhunter-frontend:latest"
    }
    else {
        $backendLatest = "$DockerhubUsername/jobhunter-backend:latest"
        $frontendLatest = "$DockerhubUsername/jobhunter-frontend:latest"
    }

    Write-Host "Tagging backend image: $backendImage -> $backendLatest"
    docker tag $backendImage $backendLatest

    Write-Host "Tagging frontend image: $frontendImage -> $frontendLatest"
    docker tag $frontendImage $frontendLatest
}

Write-Host "Build completed."

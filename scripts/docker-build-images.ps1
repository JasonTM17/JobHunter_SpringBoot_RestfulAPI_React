param(
    # Leave empty to build local images: jobhunter-backend:tag and jobhunter-frontend:tag.
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

function Invoke-Docker {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "docker $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

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
Invoke-Docker build @commonBuildArgs `
    -f (Join-Path $backendContext "Dockerfile") `
    -t $backendImage `
    $backendContext

Write-Host "Building frontend image: $frontendImage"
Invoke-Docker build @commonBuildArgs `
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
    Invoke-Docker tag $backendImage $backendLatest

    Write-Host "Tagging frontend image: $frontendImage -> $frontendLatest"
    Invoke-Docker tag $frontendImage $frontendLatest
}

Write-Host "Build completed."

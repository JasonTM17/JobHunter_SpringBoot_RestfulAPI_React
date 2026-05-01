param(
    [Parameter(Mandatory = $true)]
    [string]$DockerhubUsername,

    [string[]]$ImageTags = @("latest")
)

$ErrorActionPreference = "Stop"

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

if ($ImageTags.Count -eq 0) {
    throw "ImageTags cannot be empty."
}

$normalizedImageTags = @(
    $ImageTags |
        ForEach-Object { $_ -split "," } |
        ForEach-Object { $_.Trim() } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
)

if ($normalizedImageTags.Count -eq 0) {
    throw "ImageTags cannot be empty."
}

foreach ($tag in $normalizedImageTags) {
    $backendImage = "$DockerhubUsername/jobhunter-backend:$tag"
    $frontendImage = "$DockerhubUsername/jobhunter-frontend:$tag"

    Write-Host "Checking local image: $backendImage"
    Invoke-Docker image inspect $backendImage | Out-Null

    Write-Host "Checking local image: $frontendImage"
    Invoke-Docker image inspect $frontendImage | Out-Null

    Write-Host "Pushing backend image: $backendImage"
    Invoke-Docker push $backendImage

    Write-Host "Pushing frontend image: $frontendImage"
    Invoke-Docker push $frontendImage
}

Write-Host "Push completed."

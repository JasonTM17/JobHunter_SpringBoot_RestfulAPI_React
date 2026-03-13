param(
    [Parameter(Mandatory = $true)]
    [string]$DockerhubUsername,

    [string[]]$ImageTags = @("latest")
)

$ErrorActionPreference = "Stop"

if ($ImageTags.Count -eq 0) {
    throw "ImageTags cannot be empty."
}

foreach ($tag in $ImageTags) {
    $backendImage = "$DockerhubUsername/jobhunter-backend:$tag"
    $frontendImage = "$DockerhubUsername/jobhunter-frontend:$tag"

    Write-Host "Checking local image: $backendImage"
    docker image inspect $backendImage | Out-Null

    Write-Host "Checking local image: $frontendImage"
    docker image inspect $frontendImage | Out-Null

    Write-Host "Pushing backend image: $backendImage"
    docker push $backendImage

    Write-Host "Pushing frontend image: $frontendImage"
    docker push $frontendImage
}

Write-Host "Push completed."

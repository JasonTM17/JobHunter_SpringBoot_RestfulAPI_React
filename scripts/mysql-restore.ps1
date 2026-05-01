param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [string]$EnvFile = ".env",
    [string[]]$ComposeFiles = @("docker-compose.yml", "docker-compose.backup.yml")
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedBackup = Resolve-Path $BackupFile
$backupDir = Resolve-Path (Join-Path $repoRoot "backups/mysql")

if (-not $resolvedBackup.Path.StartsWith($backupDir.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "BackupFile must be inside $($backupDir.Path)"
}

$containerPath = "/backups/" + (Split-Path $resolvedBackup.Path -Leaf)

Push-Location $repoRoot
try {
    $args = @()
    if (Test-Path $EnvFile) {
        $args += @("--env-file", $EnvFile)
    }
    foreach ($file in $ComposeFiles) {
        $args += @("-f", $file)
    }
    $args += @("--profile", "restore", "run", "--rm", "mysql-restore", $containerPath)
    docker compose @args
}
finally {
    Pop-Location
}


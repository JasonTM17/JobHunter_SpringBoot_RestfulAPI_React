param(
    [string]$EnvFile = ".env",
    [string[]]$ComposeFiles = @("docker-compose.yml", "docker-compose.backup.yml")
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $repoRoot
try {
    $args = @()
    if (Test-Path $EnvFile) {
        $args += @("--env-file", $EnvFile)
    }
    foreach ($file in $ComposeFiles) {
        $args += @("-f", $file)
    }
    $args += @("run", "--rm", "mysql-backup", "sh", "/scripts/backup-mysql.sh")
    docker compose @args
}
finally {
    Pop-Location
}


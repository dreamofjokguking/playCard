param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$GhArgs
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFilePath = Join-Path $projectRoot '.env.local'

function Unquote-EnvValue {
  param([string]$Value)
  $trimmed = $Value.Trim()
  if (
    ($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
    ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))
  ) {
    return $trimmed.Substring(1, $trimmed.Length - 2)
  }
  return $trimmed
}

function Read-EnvFromFile {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }

  $lines = Get-Content -LiteralPath $Path
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.TrimStart().StartsWith('#')) { continue }
    $match = [regex]::Match($line, '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$')
    if (-not $match.Success) { continue }
    $key = $match.Groups[1].Value
    $value = Unquote-EnvValue -Value $match.Groups[2].Value
    $map[$key] = $value
  }

  return $map
}

$envMap = Read-EnvFromFile -Path $envFilePath

if ($envMap.ContainsKey('GH_TOKEN') -and -not [string]::IsNullOrWhiteSpace($envMap['GH_TOKEN'])) {
  $env:GH_TOKEN = $envMap['GH_TOKEN']
} elseif ($envMap.ContainsKey('GITHUB_TOKEN') -and -not [string]::IsNullOrWhiteSpace($envMap['GITHUB_TOKEN'])) {
  $env:GH_TOKEN = $envMap['GITHUB_TOKEN']
}

# Guard against broken local proxy settings that block gh api calls.
foreach ($proxyVar in @('HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'GIT_HTTP_PROXY', 'GIT_HTTPS_PROXY')) {
  $proxyValue = [Environment]::GetEnvironmentVariable($proxyVar, 'Process')
  if ($proxyValue -match '^https?://127\.0\.0\.1:9/?$') {
    Remove-Item -Path ("Env:{0}" -f $proxyVar) -ErrorAction SilentlyContinue
  }
}

if ($GhArgs.Count -eq 0) {
  gh auth status
  exit $LASTEXITCODE
}

& gh @GhArgs
exit $LASTEXITCODE

# Holiday Service Setup Script

Write-Host "Holiday Service Setup"
Write-Host "======================"
Write-Host ""

# Check Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "Node.js: $nodeVersion"
} else {
    Write-Host "Node.js not found. Install from https://nodejs.org/"
    exit 1
}

# Check PostgreSQL
$pgVersion = psql --version 2>$null
if ($pgVersion) {
    Write-Host "PostgreSQL: $pgVersion"
} else {
    Write-Host "PostgreSQL not found (optional)"
}

# Ensure package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "Run this from the HolidayService folder"
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed"
    exit 1
}

# Ensure .env exists
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example"
} else {
    Write-Host ".env already exists"
}

Write-Host ""
Write-Host "Setup complete. Next: npm run dev"

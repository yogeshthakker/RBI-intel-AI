# rbi-intel: pack + fresh-folder validation
# Run this from inside D:\Downloads\rbi-intel-updated

$ErrorActionPreference = "Stop"
$src = "D:\Downloads\rbi-intel-updated"
$dest = "D:\Downloads\rbi-intel-validate"

Write-Host "=== Step 1: npm pack (builds first via prepack) ===" -ForegroundColor Cyan
Set-Location $src
npm pack
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED at npm pack"; exit 1 }

$tarball = Get-ChildItem -Filter "rbi-intel-*.tgz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Packed: $($tarball.Name)"

Write-Host "`n=== Step 2: extract into fresh folder ===" -ForegroundColor Cyan
if (Test-Path $dest) { Write-Host "Destination already exists: $dest -- remove it manually first if you want a truly clean run, or continue to overwrite files."; }
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Set-Location $dest
tar -xzf "$src\$($tarball.Name)" --strip-components=1
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED at tar extract"; exit 1 }

Write-Host "`n=== Step 3: npm install (fresh, no dev deps carried over) ===" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED at npm install"; exit 1 }

Write-Host "`n=== Step 4: npm run build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED at npm run build"; exit 1 }

Write-Host "`n=== Step 5: npm run doctor (checks RBI site reachability) ===" -ForegroundColor Cyan
npm run doctor
if ($LASTEXITCODE -ne 0) { Write-Host "doctor reported an issue -- see above, not necessarily fatal"; }

Write-Host "`n=== Step 6: point at your EXISTING production database (real data, real duplicates) ===" -ForegroundColor Cyan
$env:RBI_INTEL_DB = "$env:USERPROFILE\.rbi-intel\regdata.db"
Write-Host "RBI_INTEL_DB = $env:RBI_INTEL_DB"

Write-Host "`n=== Step 7: python rbi.py validate ===" -ForegroundColor Cyan
python rbi.py validate
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED at validate"; exit 1 }

Write-Host "`n=== Step 8: python rbi.py dedupe (dry-run first, no changes) ===" -ForegroundColor Cyan
python rbi.py dedupe
Write-Host "`nIf the dry-run above lists groups worth applying, re-run manually with:"
Write-Host "  python rbi.py dedupe --apply"

Write-Host "`n=== Step 9: python rbi.py stats ===" -ForegroundColor Cyan
python rbi.py stats

Write-Host "`n=== ALL STEPS COMPLETE ===" -ForegroundColor Green
Write-Host "Fresh copy is at: $dest"
Write-Host "Next: run 'streamlit run streamlit_app.py' from $dest to check the dashboard against real data."

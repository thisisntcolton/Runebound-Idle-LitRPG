# Runebound — deployment diagnosis (PowerShell)
# Run this from inside your runebound-idle repo folder. It changes nothing.
#
#   cd C:\path\to\runebound-idle
#   .\diagnose.ps1
#
# If PowerShell refuses to run it ("running scripts is disabled"), use:
#   powershell -ExecutionPolicy Bypass -File .\diagnose.ps1

function Section($t) { Write-Host "`n== $t ==" -ForegroundColor Cyan }

Section "branch"
$branch = git branch --show-current
Write-Host $branch

Section "last 5 commits"
git log --oneline -5

Section "uncommitted changes"
$dirty = git status --short
if ($dirty) { $dirty } else { Write-Host "(clean)" }

Section "remote"
git remote -v

Section "local vs remote"
git fetch -q
git status -sb | Select-Object -First 1

Section "version on disk"
Select-String -Path package.json -Pattern '"version"'

Section "version on the remote branch"
$remoteRef = "origin/$branch" + ":package.json"
$remotePkg = git show $remoteRef 2>$null
if ($remotePkg) { $remotePkg | Select-String -Pattern '"version"' }
else { Write-Host "(could not read package.json from origin/$branch)" -ForegroundColor Yellow }

Section "is node_modules tracked?"
$tracked = git ls-files node_modules | Select-Object -First 3
if ($tracked) { Write-Host "YES — this should be removed:" -ForegroundColor Yellow; $tracked }
else { Write-Host "no (good)" }

Section "is the stale nested folder tracked?"
$nested = git ls-files runebound-idle | Select-Object -First 3
if ($nested) { Write-Host "YES — committed cruft:" -ForegroundColor Yellow; $nested }
else { Write-Host "no (good)" }

Section "repo root"
Get-ChildItem -Force | Select-Object Mode, LastWriteTime, Name | Format-Table -AutoSize

Write-Host "`nDone. Copy everything above and send it back." -ForegroundColor Green
$f = 'e:\Code_Project\FlowLedger\src\app\dashboard\accounts\page.tsx'
$lines = [System.IO.File]::ReadAllLines($f)
Write-Host "Line 152 raw chars:"
$chars = $lines[151].ToCharArray()
for ($i = 0; $i -lt 10 -and $i -lt $chars.Length; $i++) {
    if ($chars[$i] -eq 9) { Write-Host "  index $i = TAB" }
    elseif ($chars[$i] -eq 32) { Write-Host "  index $i = SPACE" }
    else { Write-Host "  index $i = '$($chars[$i])'" }
}

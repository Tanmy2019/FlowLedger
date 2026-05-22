$files = @(
    'e:\Code_Project\FlowLedger\src\app\dashboard\accounts\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\budgets\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\categories\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\settings\tags\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\settings\templates\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\settings\rules\page.tsx',
    'e:\Code_Project\FlowLedger\src\app\dashboard\settings\page.tsx'
)

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f)

    # Replace GET fetch("/api/xxx") -> fetch(ledgerFetchUrl("/api/xxx"))
    $content = [regex]::Replace($content, 'fetch\("/api/(tags|accounts|budgets|categories|rules|templates|ledgers|members|import)"\)', {
        return 'fetch(ledgerFetchUrl("/api/' + $args[0].Groups[1].Value + '"))'
    })

    # Replace POST/DELETE fetch("/api/xxx", { -> fetch(ledgerFetchUrl("/api/xxx")), {
    $content = [regex]::Replace($content, '(?<=const res = await )fetch\("/api/(tags|accounts|budgets|categories|rules|templates)"\),\s*{', {
        $match = $args[0].Value
        $apiName = $args[0].Groups[1].Value
        return 'fetch(ledgerFetchUrl("/api/' + $apiName + '")), {'
    })

    [System.IO.File]::WriteAllText($f, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Updated: $f"
}

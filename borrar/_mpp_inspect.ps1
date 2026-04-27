$mpp = Join-Path $PSScriptRoot "Proyecto1.mpp"
$app = New-Object -ComObject MSProject.Application
$app.Visible = $false
$app.DisplayAlerts = $false
try {
    $app.FileOpen($mpp)
    $pj = $app.ActiveProject
    Write-Host "=== PROJECT ==="
    Write-Host ("Start: " + $pj.Start)
    Write-Host ("Finish: " + $pj.Finish)
    Write-Host "=== RESOURCES ==="
    foreach ($r in $pj.Resources) {
        if ($r.Name) { Write-Host (" - " + $r.Name + " | Cal=" + $r.BaseCalendar) }
    }
    Write-Host "=== TASKS (outline) ==="
    foreach ($t in $pj.Tasks) {
        if (-not $t.Name) { continue }
        $ind = ("  " * ([int]$t.OutlineLevel - 1))
        Write-Host ($ind + $t.ID + " " + $t.Name + " | L" + $t.OutlineLevel + " | dur=" + $t.DurationText + " | " + $t.ResourceNames)
    }
} finally {
    $app.FileClose(0) | Out-Null
    $app.Quit() | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}

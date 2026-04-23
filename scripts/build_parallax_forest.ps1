$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\chris\.cursor\projects\c-Users-chris-Downloads-wardenfall\assets\c__Users_chris_AppData_Roaming_Cursor_User_workspaceStorage_880bc8b1874bf2062d228ae4ddb58504_images_image-458f892e-4421-493b-b30e-26c8421155bf.png"
$outDir = "assets/parallax"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$outW = 1024
$outH = 540
$src = [System.Drawing.Bitmap]::new($srcPath)

function Clamp([double]$v, [double]$a, [double]$b) {
  if ($v -lt $a) { return $a }
  if ($v -gt $b) { return $b }
  return $v
}

function Sample([System.Drawing.Bitmap]$bmp, [double]$u, [double]$v) {
  $u = Clamp $u 0 ($bmp.Width - 1)
  $v = Clamp $v 0 ($bmp.Height - 1)
  return $bmp.GetPixel([int][Math]::Round($u), [int][Math]::Round($v))
}

function NewLayer() {
  return [System.Drawing.Bitmap]::new($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Put([System.Drawing.Bitmap]$bmp, [int]$x, [int]$y, [System.Drawing.Color]$c, [double]$aMul) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $bmp.Width -or $y -ge $bmp.Height) { return }
  $a = [int][Math]::Round($c.A * (Clamp $aMul 0 1))
  if ($a -le 0) { return }
  $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $c.R, $c.G, $c.B))
}

function BlendSeamX([System.Drawing.Bitmap]$bmp, [int]$band = 28) {
  $w = $bmp.Width; $h = $bmp.Height
  for ($x = 0; $x -lt $band; $x++) {
    $rx = $w - $band + $x
    for ($y = 0; $y -lt $h; $y++) {
      $l = $bmp.GetPixel($x, $y)
      $r = $bmp.GetPixel($rx, $y)
      $mix = [System.Drawing.Color]::FromArgb(
        [int](($l.A + $r.A) / 2),
        [int](($l.R + $r.R) / 2),
        [int](($l.G + $r.G) / 2),
        [int](($l.B + $r.B) / 2)
      )
      $bmp.SetPixel($x, $y, $mix)
      $bmp.SetPixel($rx, $y, $mix)
    }
  }
}

$far = NewLayer
$mid = NewLayer
$near = NewLayer

# FAR: sky + distant haze
for ($y = 0; $y -lt 280; $y++) {
  for ($x = 0; $x -lt $outW; $x++) {
    $u = ($x / [double]($outW - 1)) * ($src.Width - 1)
    $v = ($y / 280.0) * 220.0
    $c = Sample $src $u $v
    $a = 1.0 - ($y / 330.0)
    Put $far $x $y $c $a
  }
}

# MID: canopy and trunks behind play space
for ($y = 0; $y -lt 300; $y++) {
  for ($x = 0; $x -lt $outW; $x++) {
    $u = ($x / [double]($outW - 1)) * ($src.Width - 1)
    $v = 160.0 + ($y / 300.0) * 210.0
    $c = Sample $src $u $v
    $a = 0.85
    if ($y -lt 40) { $a = 0.45 + ($y / 100.0) }
    Put $mid $x ($y + 120) $c $a
  }
}

# NEAR: foreground roots/platform stone strip (kept low to preserve readability)
for ($y = 0; $y -lt 190; $y++) {
  for ($x = 0; $x -lt $outW; $x++) {
    $u = ($x / [double]($outW - 1)) * ($src.Width - 1)
    $v = 345.0 + ($y / 190.0) * 145.0
    $c = Sample $src $u $v
    $a = Clamp ($y / 160.0) 0.40 0.95
    Put $near $x ($y + 300) $c $a
  }
}

BlendSeamX $far 28
BlendSeamX $mid 28
BlendSeamX $near 28

$far.Save((Join-Path $outDir "far.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$mid.Save((Join-Path $outDir "mid.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$near.Save((Join-Path $outDir "near.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$far.Dispose(); $mid.Dispose(); $near.Dispose(); $src.Dispose()
Write-Host "Wrote forest parallax layers to assets/parallax/far.png mid.png near.png"

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$imgAPath = "C:\Users\chris\.cursor\projects\c-Users-chris-Downloads-wardenfall\assets\c__Users_chris_AppData_Roaming_Cursor_User_workspaceStorage_880bc8b1874bf2062d228ae4ddb58504_images_image-458f892e-4421-493b-b30e-26c8421155bf.png" # forest sky
$imgBPath = "C:\Users\chris\.cursor\projects\c-Users-chris-Downloads-wardenfall\assets\c__Users_chris_AppData_Roaming_Cursor_User_workspaceStorage_880bc8b1874bf2062d228ae4ddb58504_images_image-9ff5e30d-666c-44fe-b9ea-e326d914f294.png" # mushroom (black bg)
$imgCPath = "C:\Users\chris\.cursor\projects\c-Users-chris-Downloads-wardenfall\assets\c__Users_chris_AppData_Roaming_Cursor_User_workspaceStorage_880bc8b1874bf2062d228ae4ddb58504_images_image-697a971d-4dea-4c70-a729-ee18722f3750.png" # lab (black bg)

$outDir = "assets/parallax"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$outW = 1024
$outH = 540

function Clamp([double]$v, [double]$a, [double]$b) {
  if ($v -lt $a) { return $a }
  if ($v -gt $b) { return $b }
  return $v
}

function IsBlackBg([System.Drawing.Color]$c) {
  return ($c.R -lt 20 -and $c.G -lt 20 -and $c.B -lt 20)
}

function NewLayer() {
  return [System.Drawing.Bitmap]::new($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function AddPixel([System.Drawing.Bitmap]$dst, [int]$x, [int]$y, [System.Drawing.Color]$src, [double]$aMul) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $dst.Width -or $y -ge $dst.Height) { return }
  $a = [int][Math]::Round($src.A * (Clamp $aMul 0.0 1.0))
  if ($a -le 0) { return }
  $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $src.R, $src.G, $src.B))
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

function SampleBilinear([System.Drawing.Bitmap]$bmp, [double]$u, [double]$v) {
  $u = Clamp $u 0 ($bmp.Width - 1)
  $v = Clamp $v 0 ($bmp.Height - 1)
  $x0 = [int][Math]::Floor($u); $x1 = [Math]::Min($bmp.Width - 1, $x0 + 1)
  $y0 = [int][Math]::Floor($v); $y1 = [Math]::Min($bmp.Height - 1, $y0 + 1)
  $tx = $u - $x0; $ty = $v - $y0
  $c00 = $bmp.GetPixel($x0, $y0); $c10 = $bmp.GetPixel($x1, $y0)
  $c01 = $bmp.GetPixel($x0, $y1); $c11 = $bmp.GetPixel($x1, $y1)
  $lerp = {
    param($a,$b,$t)
    return $a + ($b - $a) * $t
  }
  $r0 = & $lerp $c00.R $c10.R $tx; $r1 = & $lerp $c01.R $c11.R $tx
  $g0 = & $lerp $c00.G $c10.G $tx; $g1 = & $lerp $c01.G $c11.G $tx
  $b0 = & $lerp $c00.B $c10.B $tx; $b1 = & $lerp $c01.B $c11.B $tx
  $a0 = & $lerp $c00.A $c10.A $tx; $a1 = & $lerp $c01.A $c11.A $tx
  return [System.Drawing.Color]::FromArgb(
    [int](& $lerp $a0 $a1 $ty),
    [int](& $lerp $r0 $r1 $ty),
    [int](& $lerp $g0 $g1 $ty),
    [int](& $lerp $b0 $b1 $ty)
  )
}

$imgA = [System.Drawing.Bitmap]::new($imgAPath)
$imgB = [System.Drawing.Bitmap]::new($imgBPath)
$imgC = [System.Drawing.Bitmap]::new($imgCPath)

$far = NewLayer
$mid = NewLayer
$near = NewLayer

# FAR: sky-only from A (avoid platform/enemy rows)
for ($y = 0; $y -lt 220; $y++) {
  for ($x = 0; $x -lt $outW; $x++) {
    $u = ($x / [double]($outW - 1)) * ($imgA.Width - 1)
    $v = ($y / 220.0) * 120.0
    $c = SampleBilinear $imgA $u $v
    $a = (1.0 - ($y / 260.0))
    AddPixel $far $x $y $c ($a * 0.95)
  }
}

# MID: lab geometry from C only (enemy-free screenshot)
for ($x = 0; $x -lt $outW; $x++) {
  for ($y = 0; $y -lt 260; $y++) {
    $uc = ($x / [double]($outW - 1)) * ($imgC.Width - 1)
    $vc = 50 + ($y / 260.0) * 220
    if ($vc -ge $imgC.Height) { continue }
    $cc = SampleBilinear $imgC $uc $vc
    if (-not (IsBlackBg $cc)) {
      $a = 0.62
      if ($y -lt 30) { $a = 0.35 }
      AddPixel $mid $x ($y + 120) $cc $a
    }
  }
}

# NEAR: lower structures/ground from B (continuous platform band)
for ($x = 0; $x -lt $outW; $x++) {
  for ($y = 0; $y -lt 260; $y++) {
    $ub = ($x / [double]($outW - 1)) * ($imgB.Width - 1)
    $vb = 145 + ($y / 260.0) * 235
    if ($vb -ge $imgB.Height) { continue }
    $cb = SampleBilinear $imgB $ub $vb
    if (-not (IsBlackBg $cb)) {
      $a = Clamp ($y / 220.0) 0.40 1.0
      AddPixel $near $x ($y + 230) $cb $a
    }
  }
}

# Seam blend for horizontal tiling.
BlendSeamX $far 28
BlendSeamX $mid 28
BlendSeamX $near 28

$far.Save((Join-Path $outDir "far.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$mid.Save((Join-Path $outDir "mid.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$near.Save((Join-Path $outDir "near.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$far.Dispose(); $mid.Dispose(); $near.Dispose()
$imgA.Dispose(); $imgB.Dispose(); $imgC.Dispose()
Write-Host "Wrote assets/parallax/far.png, mid.png, near.png (mapset composite)"

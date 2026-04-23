# Minimal static server for local Wayfinder (ES modules need http://)
$ErrorActionPreference = 'Stop'
$port = 5501
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Wayfinder: http://127.0.0.1:$port/  (Ctrl+C to stop)"
while ($listener.IsListening) {
  $ctx    = $listener.GetContext()
  $req    = $ctx.Request
  $res    = $ctx.Response
  $path   = [Uri]::UnescapeDataString($req.Url.LocalPath)
  if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
  $rel    = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  $file   = [IO.Path]::GetFullPath((Join-Path $root $rel))
  if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
    $res.StatusCode = 403
    $res.Close()
    continue
  }
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    $res.StatusCode = 404
    $res.Close()
    continue
  }
  $bytes = [IO.File]::ReadAllBytes($file)
  $ext   = [IO.Path]::GetExtension($file).ToLowerInvariant()
  $res.ContentType = switch ($ext) {
    '.html' { 'text/html; charset=utf-8' }
    '.js'   { 'text/javascript; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.json' { 'application/json' }
    '.png'  { 'image/png' }
    default { 'application/octet-stream' }
  }
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.Close()
}

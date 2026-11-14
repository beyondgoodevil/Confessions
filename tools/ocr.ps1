# Read the text off a scanned PDF with the OCR engine built into Windows (no installs).
# Used by tools/intake.mjs; you can also run it yourself:
#   powershell -ExecutionPolicy Bypass -File tools/ocr.ps1 -Pdf "C:\path\book.pdf" -Out "C:\path\book.txt"
# Pages are written in order, separated by a form-feed character. -Lang en-US picks a language
# (it must be installed in Windows: Settings > Time & language > Language); the default is your profile's.
param(
  [Parameter(Mandatory = $true)][string]$Pdf,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$First = 1,
  [int]$Last = 0,
  [double]$Scale = 2.0,
  [string]$Lang = ''
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

$ext = [System.WindowsRuntimeSystemExtensions].GetMethods()
$asTaskOp = ($ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskAct = ($ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function Await($op, [Type]$type) { $t = $asTaskOp.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }
function AwaitAction($op) { $t = $asTaskAct.Invoke($null, @($op)); $t.Wait(-1) | Out-Null }

$Pdf = (Resolve-Path -LiteralPath $Pdf).Path
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Pdf)) ([Windows.Storage.StorageFile])
$doc = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
if ($Lang) { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new($Lang)) }
else { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() }
if (-not $engine) { Write-Error "No OCR language is available. Install one in Windows Settings > Time & language > Language, or pass -Lang en-US."; exit 2 }
$maxDim = [Windows.Media.Ocr.OcrEngine]::MaxImageDimension
$count = [int]$doc.PageCount
if ($Last -le 0 -or $Last -gt $count) { $Last = $count }
$sb = New-Object System.Text.StringBuilder
for ($i = $First; $i -le $Last; $i++) {
  $page = $doc.GetPage([uint32]($i - 1))
  try {
    $w = $page.Size.Width * $Scale; $h = $page.Size.Height * $Scale
    $big = [Math]::Max($w, $h); if ($big -gt $maxDim) { $w = $w * $maxDim / $big }
    $opts = [Windows.Data.Pdf.PdfPageRenderOptions]::new(); $opts.DestinationWidth = [uint32][Math]::Floor($w)
    $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    AwaitAction ($page.RenderToStreamAsync($stream, $opts))
    $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
    foreach ($line in $res.Lines) { [void]$sb.AppendLine($line.Text) }
    $bmp.Dispose(); $stream.Dispose()
  } catch { [void]$sb.AppendLine("[page $i could not be read: $($_.Exception.Message)]") }
  finally { $page.Dispose() }
  if ($i -lt $Last) { [void]$sb.Append([char]12) }
  if (($i - $First + 1) % 25 -eq 0) { Write-Host "  read $($i - $First + 1) of $($Last - $First + 1) pages" }
}
[System.IO.File]::WriteAllText($Out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  read $($Last - $First + 1) pages"

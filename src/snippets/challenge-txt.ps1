$p = "C:\Program Files\Google\Google Cloud Certificate Connector\challenge.txt"; [IO.File]::WriteAllText($p, (Read-Host "SCEP challenge"))

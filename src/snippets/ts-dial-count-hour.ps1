@(Get-WinEvent -FilterHashtable @{LogName='Application';ProviderName='GoogleCloudCertificateConnector';StartTime=(Get-Date).AddHours(-1)} | ? { $_.Message -match 'ProxyContextDialer called' }).Count

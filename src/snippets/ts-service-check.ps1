Get-Service GoogleCloudCertificateConnector
Get-WinEvent -FilterHashtable @{LogName='Application';ProviderName='GoogleCloudCertificateConnector'} -MaxEvents 3000 | ? Message -match 'Connector version|Parsed configurations|Listening to requests' | Select -First 3 | fl TimeCreated,Message

# Run as Administrator on the NDES server. It prompts for the service account's password; nothing is stored.
$key = 'HKLM:\SOFTWARE\Microsoft\Cryptography\MSCEP'
foreach ($name in 'EncryptionTemplate', 'GeneralPurposeTemplate', 'SignatureTemplate') {
  Set-ItemProperty -Path $key -Name $name -Value '{{ca_template}}'
}
Set-ItemProperty -Path "$key\UseSinglePassword" -Name UseSinglePassword -Value 1

Import-Module WebAdministration
$cred = Get-Credential -Message "NDES service account (DOMAIN\{{ndes_service_account}})"
$pool = 'IIS:\AppPools\SCEP'
Set-ItemProperty $pool -Name managedPipelineMode -Value Integrated
Set-ItemProperty $pool -Name processModel.loadUserProfile -Value $true
Set-ItemProperty $pool -Name processModel.identityType -Value SpecificUser
Set-ItemProperty $pool -Name processModel.userName -Value $cred.UserName
Set-ItemProperty $pool -Name processModel.password -Value $cred.GetNetworkCredential().Password
iisreset

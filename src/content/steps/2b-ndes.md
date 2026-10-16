---
title: Set up Microsoft NDES
order: 2.5
paths: [SCEP]
when: adcs-scep-product:ndes
officialLinks:
  - label: SCEP with Microsoft NDES (Google guide)
    url: https://support.google.com/chrome/a/answer/11338941
---

## Before you start

- Run the NDES configuration as an **Enterprise Admin** (the wizard enrols the NDES certificates).
- Use a server that does **not** run the Microsoft Intune Certificate Connector.

## 1. Active Directory

- Create a user account for NDES. No special permissions. Name: {{ndes_service_account}}

## 2. Issuing CA

In the **Certification Authority** console:

- CA properties → **Security** → **Add** {{ndes_service_account}} → allow **Issue and Manage Certificates** and **Request Certificates**.
- **Certificate Templates** → **Manage** → duplicate **User** (user certificates) or **Computer** (device certificates).
  - **General:** template name {{ca_template}} (the template name, not the display name); untick **Publish certificate in Active Directory**.
  - **Subject Name:** **Supply in the request**.
  - **Security:** add {{ndes_service_account}} → **Read** and **Enroll**.
- **Certificate Templates** → **New** → **Certificate Template to Issue** → {{ca_template}}.
- Export the root CA certificate as **Base-64 encoded X.509 (.cer)**. You upload it in the Admin console step.

## 3. NDES server

Server: {{ndes_host}}

- Add {{ndes_service_account}} to the local group **IIS_IUSRS**.
- Server Manager → **Add roles and features** → Active Directory Certificate Services → **Network Device Enrollment Service**. Then **Configure Active Directory Certificate Services** → NDES → service account {{ndes_service_account}} → pick your issuing CA.

## 4. Configure NDES

<div data-tabs>
<div data-tab="Click-through">

- Registry `HKLM\SOFTWARE\Microsoft\Cryptography\MSCEP`: set **EncryptionTemplate**, **GeneralPurposeTemplate** and **SignatureTemplate** to {{ca_template}}. (All three: NDES picks one based on the key usage in the Admin console profile.)
- Same key: create the subkey **UseSinglePassword** with DWORD **UseSinglePassword = 1**.
- IIS Manager → Application Pools → **SCEP**: **Advanced Settings** → Identity = {{ndes_service_account}}, **Load User Profile = True**; **Basic Settings** → Managed pipeline mode **Integrated**.
- Run `iisreset`.

</div>
<div data-tab="PowerShell">

Run this as Administrator on the NDES server. Click a placeholder to fill it in.

```snippet
ndes-config
```

</div>
</div>

## 5. Get the challenge

- Browse to `http://{{ndes_host}}/certsrv/mscep_admin` (as an admin) and copy the password. This is your static SCEP challenge: you put it in `challenge.txt` in the connector step. Don't store it anywhere else.

## How to know it's working

- SCEP URL: {{scep_url}} (it follows from the NDES server above; click to override).
- From the box that will run the connector, the check below returns a response.

```snippet
scep-check
```

GCCC to NDES over plain HTTP is fine (SCEP encrypts its own messages). If you use HTTPS, the NDES certificate must be trusted on the connector server.

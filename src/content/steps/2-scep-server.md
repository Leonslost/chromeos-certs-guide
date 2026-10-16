---
title: Do you need a SCEP server?
order: 2
paths: [SCEP, DIY]
officialLinks:
  - label: SCEP with Microsoft NDES (Google guide)
    url: https://support.google.com/chrome/a/answer/11338941
    paths: [SCEP]
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
    paths: [SCEP]
  - label: Certificate Provisioning API guide
    url: https://developers.google.com/chrome/management/guides/certprovisioning_api
    paths: [DIY]
  - label: Certificate Provisioning API reference
    url: https://developers.google.com/chrome/management/reference/rest/v1/customers.certificateProvisioningProcesses
    paths: [DIY]
  - label: Code samples
    url: https://developers.google.com/chrome/management/guides/samples_certprovisioningapi
    paths: [DIY]
  - label: "Public example: Leonslost/chromeos-certprov-example"
    url: https://github.com/Leonslost/chromeos-certprov-example
    paths: [DIY]
---

ChromeOS asks for certificates through Google's Certificate Provisioning API. To bridge that API to your CA, the Google Cloud Certificate Connector (GCCC) talks SCEP to a SCEP server. This guide does not explain how to configure a SCEP server: it tells you whether you need one and links to the vendor's own documentation.

<div data-ca="A">

> **NDES callout.** The NDES server must **not** be the one running the Microsoft Intune Certificate Connector. Its policy module breaks standard SCEP, so use a separate NDES server.

</div>

<div data-ca="B">

<blockquote class="warning">

**Intune Cloud PKI's SCEP only serves Intune-managed devices.** ChromeOS devices cannot use it, so you need a different SCEP server (or your own adapter).

</blockquote>

</div>

```choice
```

<div data-answer="scep-or-diy:scep">

## SCEP solutions

Follow the vendor's documentation to set one up. All are products we know first-hand.

<ul>
<li data-ca="A"><strong><a href="https://support.google.com/chrome/a/answer/11338941" rel="noopener">Microsoft NDES</a> (Recommended)</strong>. Google publishes a guide: <a href="https://support.google.com/chrome/a/answer/11338941" rel="noopener">SCEP with Microsoft NDES</a>.</li>
<li><strong><a href="https://scepman.com/" rel="noopener">SCEPman</a></strong></li>
<li><strong><a href="https://www.securew2.com/" rel="noopener">SecureW2</a></strong>. SecureW2 also offers the native Certificate Provisioning API path. Use that first: go back to Step 1 and choose the native Certificate Provisioning API option.</li>
<li><strong><a href="https://www.keyfactor.com/" rel="noopener">Keyfactor</a></strong></li>
<li><strong><a href="https://www.venafi.com/" rel="noopener">Venafi</a></strong></li>
<li><strong><a href="https://smallstep.com/docs/step-ca/" rel="noopener">step-ca</a></strong> (Smallstep) as a SCEP RA in front of another CA. This is what our test bench runs.</li>
</ul>

</div>

<div data-paths-strict="DIY">

## Building your own

You will build an adapter on the Certificate Provisioning API. This guide only gives pointers (Step 4 hand-off), not build instructions.

</div>

<div data-paths-strict="SCEP">

## Enter your SCEP URL

Enter the SCEP server's URL (used in Step 5). If your CA uses certificate templates, also enter the template name (used in Step 4).

```field
scep_url ca_template
```

## How to know it's working

From the box that will run GCCC, ask the SCEP server what it supports. Any response means the box can reach it. This is the only SCEP-side check in this guide.

```snippet
scep-check
```

</div>

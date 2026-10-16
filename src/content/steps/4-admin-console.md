---
title: Google Admin console
order: 4
paths: [SCEP, DIY]
officialLinks:
  - label: Manage client certificates on ChromeOS
    url: https://support.google.com/chrome/a/answer/6080885
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

Everything here is in the [Google Admin console](https://admin.google.com) under **Devices → Networks → Certificates**. Create the CA connection first, because the profile points at it.

1. **Trust your CA** *(if devices don't already)*: **Certificates → Add certificate**, upload your CA's root (and issuing) certificate, and tick it for ChromeOS.
2. **Create the CA connection:** **Certificate Authority connections → Add connection**. CA connections apply to the whole domain, not per OU. Enter:
   - **Name:** anything descriptive.
   - **Service account email:** {{connector_sa_email}}
   - **Pub/Sub topic:** projects/{{project_id}}/topics/{{topic_id}} (the **topic**, not the subscription).
   - **CA connection configuration identifier:** any short ID you choose. Then enter it here: {{ca_connection_id}}. It must match exactly in Step 5.
3. **Create the certificate provisioning profile:** **Certificate provisioning profiles → Add profile**. Start with a pilot OU. Enter:
   - **CA connection:** the one from the previous step.
   - **Profile name:** anything descriptive. Then enter it here: {{profile_name}}
   - **CA template name:** {{ca_template}} (leave empty if your CA doesn't use templates).
   - Choose **user or device**, then the key type, key usage, subject name and renewal window to suit your CA.

<div data-paths-strict="DIY">

Building your own adapter? Use a **SCEP** connection and profile, so every profile setting stays in the Admin console. A **Generic** connection is the alternative if your adapter decides those settings itself.

</div>

<div data-paths-strict="SCEP">

4. **Download the connector:** **Certificate Authority connections → Download connector**. You install it in Step 5.

</div>

## How to know it's working

The CA connection and profile are both listed, and a test device in the pilot OU shows `RequiredClientCertificateForDevice` or `RequiredClientCertificateForUser` in `chrome://policy`.

<div id="handoff" data-paths-strict="DIY">

## Hand-off: build your adapter

Pub/Sub and the Admin console are ready. Your adapter is yours to build. Start here:

- [Certificate Provisioning API guide](https://developers.google.com/chrome/management/guides/certprovisioning_api)
- [API reference](https://developers.google.com/chrome/management/reference/rest/v1/customers.certificateProvisioningProcesses)
- [Code samples](https://developers.google.com/chrome/management/guides/samples_certprovisioningapi)
- [Public example: Leonslost/chromeos-certprov-example](https://github.com/Leonslost/chromeos-certprov-example)

</div>

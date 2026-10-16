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

All of this is in the [Google Admin console](https://admin.google.com/ac/networks/) under **Devices → Networks → Certificates**. Create the CA connection before the profile.

1. **Trust your CA** *(if devices don't already)*: [Certificates](https://admin.google.com/ac/networks/certificates/server-ca-certs) → **Add certificate**. Upload your root (and issuing) CA certificate and tick **Enabled for Chromebook**.
2. **Create the CA connection:** [Certificate authority connections](https://admin.google.com/ac/networks/certificates/ca-connections) → **Add connection**. It applies to the whole domain, not per OU.
   - **Name:** anything descriptive.
   - **Service account email:** {{connector_sa_email}}
   - **Pub/Sub topic:** projects/{{project_id}}/topics/{{topic_id}}
   - **CA connection configuration identifier:** any short ID. Enter it here: {{ca_connection_id}}. It must match exactly in Step 5.
3. **Create the profile:** [Certificate provisioning profiles](https://admin.google.com/ac/networks/certificates/profiles). Select your pilot OU on the left → **Add profile**.
   - **Referenced certificate authority connection:** the connection from step 2.
   - **User** or **Device**.
   - **Certificate provisioning profile name:** anything descriptive. Enter it here: {{profile_name}}
   - **Days before expiry to initiate renewal:** 1–90.
   - **Authentication type:** **None** (required for ChromeOS Flex) or **Remote attestation** (ChromeOS devices only).
   - **Key usage:** tick **Key encipherment**, **Signing**, or both. At least one is required.
   - **Subject common name:** `${DEVICE_SERIAL_NUMBER}` for device certificates, or `${USER_EMAIL}` for user certificates.
   - **Organisation, OU, locality, state, country:** optional.
   - **Subject alternative names:** optional.
   - **Certificate template name:** {{ca_template}} (optional; leave empty if your CA doesn't use templates).
   - **Encryption key type:** **RSA** or **ECC**. With ECC, the static SCEP challenge is sent to the device; with RSA it never leaves the server.

<div data-paths-strict="DIY">

Building your own adapter? Use a **SCEP** connection and profile, so every profile setting stays in the Admin console. A **Generic** connection is the alternative if your adapter decides those settings itself.

</div>


## How to know it's working

On a test device in the pilot OU:

- `chrome://policy` shows **RequiredClientCertificateForDevice** (device profile, device in the pilot OU) or **RequiredClientCertificateForUser** (user profile, user in the pilot OU).
- `chrome://certificate-manager/clientcerts` lists the profile.

<div id="handoff" data-paths-strict="DIY">

## Hand-off: build your adapter

Pub/Sub and the Admin console are ready. Your adapter is yours to build. Start here:

- [Certificate Provisioning API guide](https://developers.google.com/chrome/management/guides/certprovisioning_api)
- [API reference](https://developers.google.com/chrome/management/reference/rest/v1/customers.certificateProvisioningProcesses)
- [Code samples](https://developers.google.com/chrome/management/guides/samples_certprovisioningapi)
- [Public example: Leonslost/chromeos-certprov-example](https://github.com/Leonslost/chromeos-certprov-example)

</div>

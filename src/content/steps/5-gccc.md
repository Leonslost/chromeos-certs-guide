---
title: Google Cloud Certificate Connector (GCCC)
order: 5
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
  - label: Manage client certificates on ChromeOS
    url: https://support.google.com/chrome/a/answer/6080885
---

## Requirements

- Windows Server 2016 or later, 2 cores at 2 GHz, 2 GB RAM.
- It can reach your SCEP URL: {{scep_url}}
- Outbound **TCP 443** to `pubsub.googleapis.com`, `oauth2.googleapis.com`, `chromemanagement.googleapis.com`, `update.googleapis.com`, `edgedl.me.gvt1.com`, `dl.google.com` and `google.com/dl`.
- **No TLS/SSL inspection** on that traffic. This is the most common real-world failure, and it fails **silently**.
- Proxy needed? Set `proxy_mode` / `proxy_server` in `adapter_config.json`. See troubleshooting for details.

## Install

1. **Download and install the connector:** [Google Cloud Certificate Connector](https://tools.google.com/dlpage/certificate_connector). Run the installer as Administrator.
2. **Add the key:** copy `service_account.json` from Step 3 into `C:\Program Files\Google\Google Cloud Certificate Connector\`.
3. **Create `challenge.txt`** in the same folder. It holds your SCEP server's static challenge, with no trailing newline. Run this in PowerShell as Administrator; it prompts for the value:

   ```snippet
   challenge-txt
   ```

4. **Add `adapter_config.json`** to the same folder. Copy it, or download it.

   ```snippet
   adapter-config
   ```

5. **Start or restart** the `GoogleCloudCertificateConnector` service.

## How to know it's working

In the Application event log (source `GoogleCloudCertificateConnector`), you should see the connector version and `Listening to requests...` with no Error:

```snippet
ts-service-check
```

Then, for real proof, enrol a test device in your pilot OU. **"Listening…" alone does not prove connectivity.** If a device keeps waiting, go to [Troubleshooting](/troubleshooting/).

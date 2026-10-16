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

> **Prototype note.** Requirements and install steps below are drafted from the plan. The adapter configuration generator is complete.

## Requirements

- Windows Server 2016 or later, 2 cores at 2 GHz, 2 GB RAM *(official)*.
- It can reach your SCEP URL.
- Outbound **TCP 443** to `pubsub.googleapis.com`, `oauth2.googleapis.com`, `chromemanagement.googleapis.com`, `update.googleapis.com`, and the update download hosts (`edgedl.me.gvt1.com`, `dl.google.com`, `google.com/dl`) *(official list)*.
- **No TLS/SSL inspection** on that traffic. This is the most common real-world failure, and it fails **silently**.
- If a proxy is required: set `proxy_mode` / `proxy_server` in `adapter_config.json`. Full proxy behaviour is in troubleshooting.

## Install

1. Download the connector from the Admin console (Step 4) and install it as Administrator. It starts and logs a config error straight away. That is expected.
2. Put the service account key from Step 3 in the connector folder as **`service_account.json`**. (Not `key.json`: legacy SCEP setups use that name.)
3. Create **`challenge.txt`**. The challenge must be **static** (the SCEP server's single password) and the file must contain exactly the challenge, **with no trailing newline**. Run this as Administrator in PowerShell on the connector box. It prompts for the value, so it never touches this site:

   ```snippet
   challenge-txt
   ```

   > **ECC note.** With an **ECC** key type in the profile, a static challenge is sent to the device. With RSA, the request is hashed server-side and the device never sees it *(Google, answer 6080885)*.

4. Add **`adapter_config.json`** to the connector folder. It is filled in from your scratchpad. Copy it into your RDP session, or download it. The download is UTF-8 **without a BOM**.

   ```snippet
   adapter-config
   ```

5. Make sure the service account (`LOCAL SERVICE`) can **read** the key and challenge files.
6. Start (or restart) the `GoogleCloudCertificateConnector` service.

Installed on the bench (5.23): folder `C:\Program Files\Google\Google Cloud Certificate Connector\`, service `GoogleCloudCertificateConnector` (the Event Viewer source has the same name), running as `NT AUTHORITY\LOCAL SERVICE`.

## How to know it's working

In the Application event log (source `GoogleCloudCertificateConnector`), you should see the connector version and `Listening to requests...` with no Error:

```snippet
ts-service-check
```

Then, for real proof, enrol a test device in your pilot OU. **"Listening…" alone does not prove connectivity.** If a device keeps waiting, go to [Troubleshooting](/troubleshooting/).

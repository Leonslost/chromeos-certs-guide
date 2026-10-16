---
title: 3. Device waiting, connector silent
order: 3
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

**You see:** the device shows "Waiting for next operation" with no error, and the connector log ends at `Listening to requests...` with no Error.

**Why the log is silent:** `Listening to requests...` is printed once at startup and stays the last line while idle. The connector logs an Error only when its own dialer fails. A TCP connection that then stalls, resets or fails TLS leaves only repeating dial lines.

Work down steps 1–7. Run PowerShell on the connector server in an elevated window, and `gcloud` in Cloud Shell. **Shortcut:** if `curl.exe` already shows `CRYPT_E_NO_REVOCATION_CHECK`, jump to [step 6](#s3-step-6).

<h3 id="s3-step-1">Step 1. Is the connector running, and on which subscription?</h3>

Connector server.

```snippet
ts-service-check
```

Healthy: the service is `Running` and the log shows `Listening to requests...` on {{subscription_id}}. In the `Parsed configurations` line check:

- `request_subscriptions` = `projects/{{project_id}}/subscriptions/{{subscription_id}}`
- `ca_connection_config_id` = {{ca_connection_id}}, matching the Admin console CA connection

Wrong or not running? Fix `adapter_config.json` or start the service ([section 2](#t2-connector-errors) lists the startup errors). Then set `"log_level": "debug"` in `adapter_config.json` (under `adapter_configuration`) and restart the service, for steps 3 and 5c.

<h3 id="s3-step-2">Step 2. Send a test message</h3>

Cloud Shell, in the project that owns the topic. Paste it exactly: the bytes include length prefixes.

```snippet
ts-probe
```

- It publishes a 49-byte fake enrolment notification with a dummy process ID and a dummy customer ID. It creates nothing, and the connector acknowledges it, so it does not loop.
- Publish to the **topic**, not the subscription. Note the `messageIds:` it prints.
- **Never publish other payloads** (for example text from the Cloud console's "Publish message"). The connector never acknowledges unknown request types, and Pub/Sub redelivers them in a loop. If that happens, [purge the subscription](#err-connectiontestrequest).

<h3 id="s3-step-3">Step 3. Did the connector receive it?</h3>

Connector server, within about 10 seconds of step 2.

```snippet
ts-received
```

Success looks like:

```text
Info: subID:{{subscription_id}}, received message with msgID:<id from step 2>
Info: Received pubsub notification using config v2. Msg: Enrollment request: {CustomerID:C00000000, CertificateProvisioningProcessID:000…001}
Warning: failed to claim … response error:googleapi: Error 500: Internal error encountered., backendError
```

The Warning is expected: the IDs are fake, so Google can't claim the process (the error code may differ). `received message` is the proof.

| Result | Next |
| --- | --- |
| `received message` is there | [Step 4](#s3-step-4) |
| Nothing | [Step 5](#s3-step-5) |

<h3 id="s3-step-4">Step 4. Received, but devices still don't enrol</h3>

The topic, subscription, connector and network are fine. Check:

- The device: see [section 1](#t1-start-on-the-device).
- The Admin console CA connection's topic is `projects/{{project_id}}/topics/{{topic_id}}`, the one you published to.
- The publisher grant: one of these two must list `serviceAccount:cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com`.

```snippet
ts-publisher-iam
```

<h3 id="s3-step-5">Step 5. Never received: is the connector connected?</h3>

**a. Subscription wiring.**

```snippet
ts-sub-describe
```

Healthy prints only `topic:` = `projects/{{project_id}}/topics/{{topic_id}}`. A `filter:` line or a wrong topic drops everything silently.

**b. Is anything holding a connection?** Cloud console → the subscription → **Metrics**, or Metrics Explorer `pubsub.googleapis.com/subscription/open_streaming_pulls` (lags 1–3 minutes).

| `open_streaming_pulls` | Means | Next |
| --- | --- | --- |
| About 10, but nothing logged in step 3 | Another consumer is taking the messages (an old connector, a second server, a script) | Find it and stop it |
| About 20 | Two connectors | Stop one |
| 0 or no data, while the connector says Listening | Its stream never reaches Google | [Step 6](#s3-step-6) |

**c. Dial rate** (needs debug logging).

```snippet
ts-dial-counter
```

| Per hour | Means | Next |
| --- | --- | --- |
| About 2 | Healthy while idle | Back to [step 1](#s3-step-1) |
| About 100–220, no Error | Silent reconnect loop: TCP connects, then TLS or HTTP/2 fails | [Step 6](#s3-step-6) |

<h3 id="s3-step-6">Step 6. Network: hostnames, then who actually answers TLS</h3>

Connector server.

**a. TCP to the hostnames.**

```snippet
ts-tcp-hostnames
```

`TcpTestSucceeded` **False**: a firewall or DNS blocks it. The connector logs that loudly (`connectex`, `i/o timeout`): see [section 2](#err-io-timeout). **True** proves TCP only, not TLS: go on to b.

**b. Who answers TLS?** The deciding check.

```snippet
ts-tls-issuer
```

| Issuer | Means |
| --- | --- |
| `… O=Google Trust Services …` | No inspection: look elsewhere (c, d, and the proxy note below) |
| Any other issuer | TLS inspection is in the path. It reproduces the silent loop: [step 7](#s3-step-7) |
| Hang, reset or exception | A firewall kills TLS after TCP connects. Silent: [step 7](#s3-step-7) |

**c. curl.** Inbox `curl.exe`; schannel caches sessions, so repeat after changes.

```snippet
ts-curl-check
```

| Result | Means |
| --- | --- |
| `http=404` | Normal |
| `CRYPT_E_NO_REVOCATION_CHECK (0x80092012)`, then `404` with the flag | A trusted inspection CA without revocation info: [step 7](#s3-step-7) |
| `SEC_E_UNTRUSTED_ROOT (0x80090325)` | Inspection with a CA this server does not trust: [step 7](#s3-step-7) |
| `CRYPT_E_REVOCATION_OFFLINE (0x80092013)` | Google's CRL/OCSP hosts are blocked. The connector is unaffected: ignore it |

**d. Optional: does the inspection pass HTTP/2?** PowerShell 7 (`pwsh`).

```snippet
ts-http2-check
```

| Result | Means |
| --- | --- |
| `ALPN=h2` with a non-Google issuer | Inspection that carries HTTP/2: works |
| `ALPN=http/1.1` with a non-Google issuer | Breaks the connector silently (gRPC needs HTTP/2): [step 7](#s3-step-7) |

**Proxy:** read the `Proxy info:` line the connector prints at start. Dial lines saying `Dialed proxy server` instead of `No proxy found` mean a proxy is in use. A proxy that answers `200` and then goes quiet gives the same loop.

<h3 id="s3-step-7">Step 7. The fix, if step 6 shows inspection</h3>

<div class="ts-fix">

**Fix:** Ask the network team to exempt `*.googleapis.com` from TLS inspection for the connector server, or to pass HTTP/2 through. Restart the connector, then repeat steps 2–3: a `received message` line confirms the fix.

</div>

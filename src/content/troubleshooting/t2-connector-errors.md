---
title: 2. Connector error lookup
order: 2
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

**Event Viewer → Windows Logs → Application → source GoogleCloudCertificateConnector.** Search this page (Ctrl-F) for your error text.

When the connector fails a request, the device shows `Failure: Server response contains error: 9 … The adapter provided the following error message: <text>`. Error 9 means the device is repeating the connector's error verbatim: search this page for the `<text>` after "error message:".

<h3 id="grp-wont-start">Connector won't start</h3>

<h4 id="err-cannot-parse-configurations"><code>Cannot parse configurations</code></h4>

**Means:** `adapter_config.json` is missing, is invalid JSON, or was saved with a BOM. `invalid character '\ufeff' looking for beginning of value` in the same message means a BOM (for example Notepad's "UTF-8 with BOM"). Also appears right after install, before the files exist (expected). The message always mentions a legacy `config.json` not found: ignore that part and read the `Failed to parse new config` part. **Fix:** re-create the file from the connector step (copy or download it), then restart the service.

<h4 id="err-invalid-proxy-mode"><code>invalid proxy mode</code></h4>

**Means:** `proxy_mode` must be exactly `direct`, `system` or `fixed_servers` (lower case). In `adapter_config.json` an invalid value stops the connector; in the registry it silently falls back to `system`. **Fix:** correct the value and restart the service.

<h4 id="err-key-file-missing"><code>key file "&lt;name&gt;" does not exist or not accessible</code></h4>

**Means:** appears inside a `Cannot parse configurations` error: `key_filename` in `adapter_config.json` points at a missing file. The connector does not start. **Fix:** put `service_account.json` in the connector folder, or fix the name.

<h4 id="err-parse-credentials"><code>could not parse credentials in file</code></h4>

**Means:** the key file is not valid JSON (corrupted, or not the downloaded key). The connector does not start. **Fix:** re-download the JSON key (Pub/Sub step) as `service_account.json`, then restart the service.

<h3 id="grp-pubsub-network">Pub/Sub and network</h3>

<h4 id="err-socket-forbidden"><code>An attempt was made to access a socket in a way forbidden by its access permissions</code></h4>

**Means:** a local firewall blocks `connector.exe` outbound on 443. **Fix:** allow it.

<h4 id="err-io-timeout"><code>i/o timeout</code> (with <code>dial tcp …:443</code>)</h4>

**Means:** outbound 443 to Google is blocked or dropped. **Fix:** open the hostnames in the connector step's requirements.

<h4 id="err-proxy-unreachable"><code>Error connecting to the target server at &lt;proxy:port&gt;</code></h4>

**Means:** a proxy (often from a PAC/WPAD) is unreachable. **Fix:** correct the proxy, or set `proxy_mode`.

<h4 id="err-proxy-407"><code>407 Proxy Authentication Required</code></h4>

**Means:** the proxy wants authentication. **Fix:** allow the connector's traffic without authentication, or bypass the proxy.

<h4 id="err-notfound"><code>code = NotFound</code> (with <code>resource=</code>)</h4>

**Means:** the subscription in `adapter_config.json` does not exist, or is misspelled. Expected: `projects/{{project_id}}/subscriptions/{{subscription_id}}`. After the first few, these repeat only at debug log level. **Fix:** correct `request_subscriptions` and restart the service.

<h4 id="err-permissiondenied"><code>code = PermissionDenied</code> (with <code>User not authorized to perform this action</code>)</h4>

**Means:** the connector's service account lacks Pub/Sub Subscriber. **Fix:** IAM → grant {{connector_sa_email}} the role **Pub/Sub Subscriber**. It recovers within about 10 seconds, no restart needed.

<h4 id="err-connectiontestrequest"><code>ConnectionTestRequest is not supported</code></h4>

**Means:** a test message of an unsupported type is stuck on the subscription, and Pub/Sub redelivers it in a loop. **Fix:** purge the subscription.

```snippet
ts-sub-seek
```

<h4 id="err-failed-to-decode"><code>Failed to decode received req</code></h4>

**Means:** a non-protobuf test message (for example one published from the Cloud console). Harmless: it is acknowledged.

<h3 id="grp-scep-ca">SCEP and CA</h3>

These appear only when a request arrives, not at startup.

<h4 id="err-static-challenge"><code>failed to fetch the static challenge</code> (with <code>challenge file read error</code>)</h4>

**Means:** the file named by `challenge_filename` in `adapter_config.json` is missing or unreadable. The connector starts normally and only fails when a request arrives. **Fix:** create `challenge.txt` in the connector folder (connector step) and check the filename matches.

<h4 id="err-certrep-failure"><code>received CertRep FAILURE with failInfo badRequest</code></h4>

**Means:** the SCEP server rejected the request, most often because the challenge is wrong (for example an NDES challenge that changed or expired, or was copied wrongly). The connector does not say why: read the SCEP server's own log (step-ca logs `failed validating challenge password`; on NDES, the NDES server's Application event log). **Fix:** re-create `challenge.txt` with the current challenge, then restart the service.

<h4 id="err-printablestring"><code>parse challenge password in pkiEnvelope: asn1: syntax error: PrintableString contains invalid character</code></h4>

**Means:** `challenge.txt` has a trailing newline or another invalid character. Seen with step-ca; other SCEP servers may report it as a wrong challenge instead. **Fix:** re-create `challenge.txt` with the connector step's PowerShell one-liner (no newline), then restart the service.

<h4 id="err-ca-connection-not-found"><code>configuration not found for CAConnection with reference: &lt;id&gt;</code></h4>

**Means:** the CA connection identifier in the Admin console does not match `ca_connection_config_id` in `adapter_config.json`. The `<id>` in the message is what the console sent. **Fix:** make them identical ({{ca_connection_id}}), then restart the service.

<h4 id="err-cannot-get-ca-certs-refused"><code>cannot get CA certificates</code> (with <code>No connection could be made because the target machine actively refused it</code>)</h4>

**Means:** nothing is listening at the SCEP URL's host and port (SCEP server down, wrong port). If a firewall drops the traffic instead, the same line ends in `i/o timeout`. **Fix:** check the SCEP URL ({{scep_url}}) and that the SCEP service is running. Test from the connector server:

```snippet
scep-check
```

<h4 id="err-cannot-get-ca-certs-http"><code>cannot get CA certificates: http request failed with status</code></h4>

**Means:** the server answered but the URL path is wrong (step-ca: `500 … provisioner <name> not found`; NDES/IIS: 404). **Fix:** correct the SCEP URL path (NDES: `http://<ndes-host>/certsrv/mscep/mscep.dll`).

<h3 id="harmless-lines">Harmless lines</h3>

Normal with no proxy configured. Ignore them.

- `Proxy troubleshooter faced error(s)`
- `Could not read ProxyMode registry key … fall back to 'system'`

*Captured with GCCC 5.23 and a step-ca SCEP server; NDES-specific wording to be added.*

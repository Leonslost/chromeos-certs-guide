---
title: 2. Connector error lookup
order: 2
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

**Event Viewer → Windows Logs → Application → source GoogleCloudCertificateConnector.** Search this page (Ctrl-F) for your error text.

<h3 id="err-cannot-parse-configurations"><code>Cannot parse configurations</code></h3>

**Means:** `adapter_config.json` is missing, is invalid JSON, or was saved with a BOM. Also appears right after install, before the files exist (expected). **Fix:** re-create the file from the connector step (copy or download it), then restart the service.

<h3 id="err-invalid-proxy-mode"><code>invalid proxy mode</code></h3>

**Means:** `proxy_mode` must be exactly `direct`, `system` or `fixed_servers` (lower case). In `adapter_config.json` an invalid value stops the connector; in the registry it silently falls back to `system`. **Fix:** correct the value and restart the service.

<h3 id="err-socket-forbidden"><code>An attempt was made to access a socket in a way forbidden by its access permissions</code></h3>

**Means:** a local firewall blocks `connector.exe` outbound on 443. **Fix:** allow it.

<h3 id="err-io-timeout"><code>i/o timeout</code> (with <code>dial tcp …:443</code>)</h3>

**Means:** outbound 443 to Google is blocked or dropped. **Fix:** open the hostnames in the connector step's requirements.

<h3 id="err-proxy-unreachable"><code>Error connecting to the target server at &lt;proxy:port&gt;</code></h3>

**Means:** a proxy (often from a PAC/WPAD) is unreachable. **Fix:** correct the proxy, or set `proxy_mode`.

<h3 id="err-proxy-407"><code>407 Proxy Authentication Required</code></h3>

**Means:** the proxy wants authentication. **Fix:** allow the connector's traffic without authentication, or bypass the proxy.

<h3 id="err-notfound"><code>code = NotFound</code> (with <code>resource=</code>)</h3>

**Means:** the subscription in `adapter_config.json` does not exist, or is misspelled. Expected: `projects/{{project_id}}/subscriptions/{{subscription_id}}`. After the first few, these repeat only at debug log level. **Fix:** correct `request_subscriptions` and restart the service.

<h3 id="err-permissiondenied"><code>code = PermissionDenied</code> (with <code>User not authorized to perform this action</code>)</h3>

**Means:** the connector's service account lacks Pub/Sub Subscriber. **Fix:** IAM → grant {{connector_sa_email}} the role **Pub/Sub Subscriber**. It recovers within about 10 seconds, no restart needed.

<h3 id="err-connectiontestrequest"><code>ConnectionTestRequest is not supported</code></h3>

**Means:** a test message of an unsupported type is stuck on the subscription, and Pub/Sub redelivers it in a loop. **Fix:** purge the subscription.

```snippet
ts-sub-seek
```

<h3 id="err-failed-to-decode"><code>Failed to decode received req</code></h3>

**Means:** a non-protobuf test message (for example one published from the Cloud console). Harmless: it is acknowledged.

<h3 id="scep-ca-errors">SCEP and CA errors</h3>

*Being captured on the test bench: wrong challenge, CA connection identifier mismatch, SCEP URL unreachable, missing or invalid key file.*

<h3 id="harmless-lines">Harmless lines</h3>

Normal with no proxy configured. Ignore them.

- `Proxy troubleshooter faced error(s)`
- `Could not read ProxyMode registry key … fall back to 'system'`

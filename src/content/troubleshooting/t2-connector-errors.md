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

<nav class="ts-jump-nav" aria-label="Jump to connector error">
  <div class="ts-jump-header">Jump to error:</div>
  <div class="ts-jump-grid">
    <div class="ts-jump-col">
      <div class="ts-jump-grp-title">Connector won't start</div>
      <ul class="ts-jump-list">
        <li><a href="#err-cannot-parse-configurations">Config file missing / invalid</a></li>
        <li><a href="#err-invalid-proxy-mode">Invalid proxy mode</a></li>
        <li><a href="#err-key-file-missing">Key file missing</a></li>
        <li><a href="#err-parse-credentials">Could not parse credentials</a></li>
      </ul>
    </div>
    <div class="ts-jump-col">
      <div class="ts-jump-grp-title">Pub/Sub and network</div>
      <ul class="ts-jump-list">
        <li><a href="#err-socket-forbidden">Socket access forbidden</a></li>
        <li><a href="#err-io-timeout">Outbound i/o timeout</a></li>
        <li><a href="#err-proxy-unreachable">Proxy unreachable</a></li>
        <li><a href="#err-proxy-407">Proxy 407 Auth Required</a></li>
        <li><a href="#err-notfound">Subscription NotFound</a></li>
        <li><a href="#err-permissiondenied">Pub/Sub PermissionDenied</a></li>
        <li><a href="#err-connectiontestrequest">ConnectionTestRequest loop</a></li>
        <li><a href="#err-failed-to-decode">Non-protobuf message</a></li>
      </ul>
    </div>
    <div class="ts-jump-col">
      <div class="ts-jump-grp-title">SCEP and CA</div>
      <ul class="ts-jump-list">
        <li><a href="#err-static-challenge">Challenge file missing</a></li>
        <li><a href="#err-certrep-failure">CertRep FAILURE (badRequest)</a></li>
        <li><a href="#err-printablestring">PrintableString syntax error</a></li>
        <li><a href="#err-ca-connection-not-found">CAConnection ID mismatch</a></li>
        <li><a href="#err-cannot-get-ca-certs-refused">Connection refused</a></li>
        <li><a href="#err-cannot-get-ca-certs-http">Invalid SCEP URL path</a></li>
      </ul>
    </div>
  </div>
</nav>

<h3 id="grp-wont-start">Connector won't start</h3>

<article class="ts-entry" id="err-cannot-parse-configurations">
  <h4 class="ts-title"><a href="#err-cannot-parse-configurations">Config file missing or invalid</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Cannot parse configurations</code>
    <code>invalid character '\ufeff' looking for beginning of value</code>
    <code>Failed to parse new config</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> <code>adapter_config.json</code> is missing, is invalid JSON, or was saved with a BOM (for example Notepad's "UTF-8 with BOM"). Also appears right after install, before the files exist (expected). The message always mentions a legacy <code>config.json</code> not found: ignore that part and read the <code>Failed to parse new config</code> part.</p>
  <div class="ts-fix">

**Fix:** Re-create the file from the connector step (copy or download it), then restart the service.

  </div>
</article>

<article class="ts-entry" id="err-invalid-proxy-mode">
  <h4 class="ts-title"><a href="#err-invalid-proxy-mode">Invalid proxy mode</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>invalid proxy mode</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> <code>proxy_mode</code> must be exactly <code>direct</code>, <code>system</code> or <code>fixed_servers</code> (lower case). In <code>adapter_config.json</code> an invalid value stops the connector; in the registry it silently falls back to <code>system</code>.</p>
  <div class="ts-fix">

**Fix:** Correct the value in `adapter_config.json` and restart the service.

  </div>
</article>

<article class="ts-entry" id="err-key-file-missing">
  <h4 class="ts-title"><a href="#err-key-file-missing">Service account key file missing</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>key file "&lt;name&gt;" does not exist or not accessible</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> Appears inside a <code>Cannot parse configurations</code> error: <code>key_filename</code> in <code>adapter_config.json</code> points at a missing file. The connector does not start.</p>
  <div class="ts-fix">

**Fix:** Put `service_account.json` in the connector folder, or fix the filename in `adapter_config.json`.

  </div>
</article>

<article class="ts-entry" id="err-parse-credentials">
  <h4 class="ts-title"><a href="#err-parse-credentials">Corrupted key credentials</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>could not parse credentials in file</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The key file is not valid JSON (corrupted, or not the downloaded key). The connector does not start.</p>
  <div class="ts-fix">

**Fix:** Re-download the JSON key (Pub/Sub step) as `service_account.json`, place it in the connector folder, then restart the service.

  </div>
</article>

<h3 id="grp-pubsub-network">Pub/Sub and network</h3>

<article class="ts-entry" id="err-socket-forbidden">
  <h4 class="ts-title"><a href="#err-socket-forbidden">Socket access forbidden</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>An attempt was made to access a socket in a way forbidden by its access permissions</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> A local Windows firewall blocks <code>connector.exe</code> outbound on port 443.</p>
  <div class="ts-fix">

**Fix:** Allow outbound TCP 443 for `connector.exe` in the local firewall.

  </div>
</article>

<article class="ts-entry" id="err-io-timeout">
  <h4 class="ts-title"><a href="#err-io-timeout">Outbound connection timeout</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>i/o timeout (with dial tcp …:443)</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> Outbound 443 to Google Cloud is blocked or dropped by the network.</p>
  <div class="ts-fix">

**Fix:** Open outbound access to the hostnames listed in the connector step's requirements (`pubsub.googleapis.com`, `oauth2.googleapis.com`, etc.).

  </div>
</article>

<article class="ts-entry" id="err-proxy-unreachable">
  <h4 class="ts-title"><a href="#err-proxy-unreachable">Proxy server unreachable</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Error connecting to the target server at &lt;proxy:port&gt;</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> A proxy server (often discovered from a PAC/WPAD) is unreachable or offline.</p>
  <div class="ts-fix">

**Fix:** Correct the proxy address/port, or set `proxy_mode` in `adapter_config.json`.

  </div>
</article>

<article class="ts-entry" id="err-proxy-407">
  <h4 class="ts-title"><a href="#err-proxy-407">Proxy authentication required</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>407 Proxy Authentication Required</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The proxy server requires authentication, which GCCC does not support.</p>
  <div class="ts-fix">

**Fix:** Allow the connector's traffic without authentication, or bypass the proxy.

  </div>
</article>

<article class="ts-entry" id="err-notfound">
  <h4 class="ts-title"><a href="#err-notfound">Subscription not found</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>code = NotFound (with resource=)</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The subscription in <code>adapter_config.json</code> does not exist, or is misspelled. Expected: <code>projects/{{project_id}}/subscriptions/{{subscription_id}}</code>. After the first few, these repeat only at debug log level.</p>
  <div class="ts-fix">

**Fix:** Correct `request_subscriptions` in `adapter_config.json` and restart the service.

  </div>
</article>

<article class="ts-entry" id="err-permissiondenied">
  <h4 class="ts-title"><a href="#err-permissiondenied">Pub/Sub permission denied</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>code = PermissionDenied (with User not authorized to perform this action)</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The connector's service account lacks the Pub/Sub Subscriber role.</p>
  <div class="ts-fix">

**Fix:** In Google Cloud IAM, grant {{connector_sa_email}} the role **Pub/Sub Subscriber**. It recovers within about 10 seconds without needing a restart.

  </div>
</article>

<article class="ts-entry" id="err-connectiontestrequest">
  <h4 class="ts-title"><a href="#err-connectiontestrequest">Unsupported test message looping</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>ConnectionTestRequest is not supported</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> A test message of an unsupported type is stuck on the subscription, and Pub/Sub redelivers it in an infinite loop.</p>
  <div class="ts-fix">

**Fix:** Purge the subscription by seeking past the message:

  </div>

```snippet
ts-sub-seek
```

</article>

<article class="ts-entry" id="err-failed-to-decode">
  <h4 class="ts-title"><a href="#err-failed-to-decode">Non-protobuf message received</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Failed to decode received req</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> A non-protobuf test message (for example one published from the Cloud console) was received.</p>
  <p class="ts-note"><strong>Note:</strong> Harmless: the connector acknowledges the message and discards it. No action needed.</p>
</article>

<h3 id="grp-scep-ca">SCEP and CA</h3>

<p class="ts-section-note">These appear only when a request arrives, not at startup.</p>

<article class="ts-entry" id="err-static-challenge">
  <h4 class="ts-title"><a href="#err-static-challenge">Static challenge file missing</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>failed to fetch the static challenge (with challenge file read error)</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The file named by <code>challenge_filename</code> in <code>adapter_config.json</code> is missing or unreadable. The connector starts normally and only fails when a request arrives.</p>
  <div class="ts-fix">

**Fix:** Create `challenge.txt` in the connector folder (connector step) and check that the filename matches `adapter_config.json`.

  </div>
</article>

<article class="ts-entry" id="err-certrep-failure">
  <h4 class="ts-title"><a href="#err-certrep-failure">SCEP server rejected request (badRequest)</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>received CertRep FAILURE with failInfo badRequest</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The SCEP server rejected the request, most often because the challenge is wrong (for example an NDES challenge that changed or expired, or was copied wrongly). The connector does not say why: read the SCEP server's own log (step-ca logs <code>failed validating challenge password</code>; on NDES, check the NDES server's Application event log).</p>
  <div class="ts-fix">

**Fix:** Re-create `challenge.txt` with the current challenge password, then restart the service.

  </div>
</article>

<article class="ts-entry" id="err-printablestring">
  <h4 class="ts-title"><a href="#err-printablestring">Invalid character in challenge password</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>parse challenge password in pkiEnvelope: asn1: syntax error: PrintableString contains invalid character</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> <code>challenge.txt</code> has a trailing newline or another invalid character. Seen with step-ca; other SCEP servers may report it as a wrong challenge instead.</p>
  <div class="ts-fix">

**Fix:** Re-create `challenge.txt` with the connector step's PowerShell one-liner (ensuring no trailing newline), then restart the service.

  </div>
</article>

<article class="ts-entry" id="err-ca-connection-not-found">
  <h4 class="ts-title"><a href="#err-ca-connection-not-found">CA connection ID mismatch</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>configuration not found for CAConnection with reference: &lt;id&gt;</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The CA connection identifier in the Admin console does not match <code>ca_connection_config_id</code> in <code>adapter_config.json</code>. The <code>&lt;id&gt;</code> in the message is what the console sent.</p>
  <div class="ts-fix">

**Fix:** Make them identical ({{ca_connection_id}}), then restart the service.

  </div>
</article>

<article class="ts-entry" id="err-cannot-get-ca-certs-refused">
  <h4 class="ts-title"><a href="#err-cannot-get-ca-certs-refused">SCEP connection refused</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>cannot get CA certificates (with No connection could be made because the target machine actively refused it)</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> Nothing is listening at the SCEP URL's host and port (SCEP server down, wrong port). If a firewall drops the traffic instead, the same line ends in <code>i/o timeout</code>.</p>
  <div class="ts-fix">

**Fix:** Check the SCEP URL ({{scep_url}}) and that the SCEP service is running. Test connectivity from the connector server:

  </div>

```snippet
scep-check
```

</article>

<article class="ts-entry" id="err-cannot-get-ca-certs-http">
  <h4 class="ts-title"><a href="#err-cannot-get-ca-certs-http">Invalid SCEP URL path</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>cannot get CA certificates: http request failed with status</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The server answered but the URL path is wrong (step-ca: <code>500 … provisioner &lt;name&gt; not found</code>; NDES/IIS: 404).</p>
  <div class="ts-fix">

**Fix:** Correct the SCEP URL path (NDES: `http://<ndes-host>/certsrv/mscep/mscep.dll`).

  </div>
</article>

<h3 id="harmless-lines">Harmless lines</h3>

<p class="ts-section-note">Normal with no proxy configured. These lines can safely be ignored.</p>

<article class="ts-entry ts-entry-muted">
  <div class="ts-quote">
    <span class="ts-quote-label">Lines you may see:</span>
    <code>Proxy troubleshooter faced error(s)</code>
    <code>Could not read ProxyMode registry key … fall back to 'system'</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The connector attempted to query proxy configuration from registry and local troubleshooter, but found none configured.</p>
  <p class="ts-note"><strong>Action:</strong> None needed. The connector falls back to standard system/direct networking.</p>
</article>

*Captured with GCCC 5.23 and a step-ca SCEP server; NDES-specific wording to be added.*

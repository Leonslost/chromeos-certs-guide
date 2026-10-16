---
title: 1. Start on the device
order: 1
paths: [SCEP, DIY, VENDOR]
officialLinks:
  - label: Manage client certificates on ChromeOS
    url: https://support.google.com/chrome/a/answer/6080885
---

On the test device, open `chrome://certificate-manager/clientcerts`. What it shows tells you where to look.

<div class="ts-legend" aria-label="Error code legend">
  <span class="ts-legend-title">Error codes seen so far:</span>
  <a class="ts-legend-item" href="#dev-err-21"><span class="ts-code-badge">21</span> Publisher permission missing</a>
  <a class="ts-legend-item" href="#dev-err-13"><span class="ts-code-badge">13</span> Topic not found</a>
  <span class="ts-legend-item" data-paths="SCEP"><a class="ts-legend-item" href="#dev-err-9"><span class="ts-code-badge">9</span> Connector or CA error (<span class="ts-legend-link">card 2</span>)</a></span>
</div>

<article class="ts-entry" id="dev-no-profile">
  <h4 class="ts-title"><a href="#dev-no-profile">No profile listed</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>chrome://certificate-manager/clientcerts has no certificate profile listed</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The user (user profile) or the device (device profile) is not in the profile's OU.</p>
  <div class="ts-fix">

**Fix:** Check `chrome://policy` for **RequiredClientCertificateForUser** / **RequiredClientCertificateForDevice** → click **Reload policies**. Confirm the target OU in the Google Admin console.

  </div>
</article>

<article class="ts-entry" id="dev-err-21">
  <h4 class="ts-title"><a href="#dev-err-21">Publisher grant missing (error 21)</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Failure: Server response contains error: 21. Debug message: The Google-owned well-known borg service account cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com was not granted Pub/Sub Publisher permissions in the Google Cloud project which also owns the Pub/Sub topic projects/&lt;project&gt;/topics/&lt;topic&gt;.</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The publisher grant is missing, so Google never published the request and the connector logs nothing.</p>
  <div class="ts-fix">

**Fix:** In Google Cloud IAM, grant `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` the role **Pub/Sub Publisher**. Can't add it? See [Domain restricted sharing](/#domain-restricted-sharing).

  </div>
</article>

<article class="ts-entry" id="dev-err-13">
  <h4 class="ts-title"><a href="#dev-err-13">Topic does not exist (error 13)</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Failure: Server response contains error: 13. Debug message: The specified pubsub topic projects/&lt;project&gt;/topics/&lt;topic&gt; does not exist.</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The topic in the Admin console CA connection is wrong or does not exist.</p>
  <div class="ts-fix">

**Fix:** Set the topic in the Admin console CA connection to `projects/{{project_id}}/topics/{{topic_id}}`.

  </div>
</article>

<div data-paths="SCEP">

<article class="ts-entry" id="dev-err-9">
  <h4 class="ts-title"><a href="#dev-err-9">Connector or CA error (error 9)</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>Failure: Server response contains error: 9 … The adapter provided the following error message: &lt;text&gt;</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The device is repeating the connector's error verbatim.</p>
  <div class="ts-fix">

**Fix:** Search [card 2](#t2-connector-errors) for the text after `The adapter provided the following error message:`.

  </div>
</article>

<article class="ts-entry" id="dev-waiting">
  <h4 class="ts-title"><a href="#dev-waiting">Waiting for next operation</a></h4>
  <div class="ts-quote">
    <span class="ts-quote-label">What you see:</span>
    <code>"Waiting for next operation"</code>
  </div>
  <p class="ts-means"><strong>Means:</strong> The device is waiting. Check the connector log (Event Viewer → Windows Logs → Application → source <strong>GoogleCloudCertificateConnector</strong>).</p>
  <div class="ts-fix">

**Fix:** If there is an error in the connector log, see [card 2](#t2-connector-errors). If the log only shows `Listening to requests...`, follow [card 3](#t3-device-waiting-gccc-silent).

  </div>
</article>

</div>


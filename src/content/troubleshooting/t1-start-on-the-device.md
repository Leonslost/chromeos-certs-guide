---
title: 1. Start on the device
order: 1
paths: [SCEP, DIY, VENDOR]
officialLinks:
  - label: Manage client certificates on ChromeOS
    url: https://support.google.com/chrome/a/answer/6080885
---

On the test device, open `chrome://certificate-manager/clientcerts`. What it shows tells you where to look.

- **No profile listed:** the user (user profile) or the device (device profile) is not in the profile's OU. Check `chrome://policy` for **RequiredClientCertificateForUser** / **RequiredClientCertificateForDevice** → **Reload policies**. Confirm the OU in the Admin console.
- **`Failure: Server response contains error: 21. Debug message: The Google-owned well-known borg service account cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com was not granted Pub/Sub Publisher permissions in the Google Cloud project which also owns the Pub/Sub topic projects/<project>/topics/<topic>.`** The publisher grant is missing, so Google never published and the connector logs nothing. **Fix:** IAM → grant `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` the role **Pub/Sub Publisher**. Can't add it? See [Domain restricted sharing](/#domain-restricted-sharing).
- **`Failure: Server response contains error: 13. Debug message: The specified pubsub topic projects/<project>/topics/<topic> does not exist.`** The topic in the Admin console CA connection is wrong. **Fix:** set it to `projects/{{project_id}}/topics/{{topic_id}}`.

<div data-paths="SCEP">

- **`Failure: Server response contains error: 9 … The adapter provided the following error message: <text>`** The device is repeating the connector's error verbatim. Search [card 2](#t2-connector-errors) for the text after `The adapter provided the following error message:`.
- **"Waiting for next operation":** check the connector log (Event Viewer → Windows Logs → Application → source **GoogleCloudCertificateConnector**). An error there: [card 2](#t2-connector-errors). Only `Listening to requests...`: [card 3](#t3-device-waiting-gccc-silent).

</div>

Error codes seen so far: **21** = publisher permission, **13** = topic not found<span data-paths="SCEP">, **9** = connector or CA error (see card 2)</span>.

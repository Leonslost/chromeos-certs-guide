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
- **An error naming the publisher service account, or a permission:** the publisher grant is missing. IAM → grant `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` the role **Pub/Sub Publisher**. Can't add it? See [Domain restricted sharing](/#domain-restricted-sharing). <!-- TODO capture exact device error text --> *Exact wording to be added.*
- **Topic not found:** the Pub/Sub topic in the CA connection is wrong. It must be `projects/{{project_id}}/topics/{{topic_id}}`. <!-- TODO capture exact device error text --> *Exact wording to be added.*

<div data-paths="SCEP">

- **Any other error:** usually the device repeating the connector's error. Go to [card 2](#t2-connector-errors).
- **"Waiting for next operation":** check the connector log (Event Viewer → Windows Logs → Application → source **GoogleCloudCertificateConnector**). An error there: [card 2](#t2-connector-errors). Only `Listening to requests...`: [card 3](#t3-device-waiting-gccc-silent).

</div>

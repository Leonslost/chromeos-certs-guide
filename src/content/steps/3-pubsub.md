---
title: Pub/Sub
order: 3
paths: [SCEP, DIY, VENDOR]
officialLinks:
  - label: Set up Pub/Sub for Certificate Provisioning API certificates
    url: https://support.google.com/chrome/a/answer/16560738
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

Google publishes certificate requests to a Pub/Sub topic that **you** own. This step creates the project, the topic, its subscription, and the permissions between them.

## Set it up

Use either route.

<div data-tabs>
<div data-tab="Console click-through">

1. **Create a project:** [Create project](https://console.cloud.google.com/projectcreate). Project ID: {{project_id}}

2. **Enable the APIs:** [Chrome Management API](https://console.cloud.google.com/apis/library/chromemanagement.googleapis.com) and [Cloud Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com).

3. **Create the service account:** [Create service account](https://console.cloud.google.com/iam-admin/serviceaccounts/create). Name: {{connector_sa_name}} → **Create and continue** → role **Pub/Sub Subscriber** → **Done**.

<div data-paths-strict="SCEP">

4. **Create a key:** in the service account list, **⋮** on {{connector_sa_email}} → **Manage keys** → **Add key** → **Create new key** → **JSON** → **Create**. Rename the downloaded file to `service_account.json` for the connector step. Fails? See [Key creation disabled](#key-creation-disabled).

</div>

5. **Grant the publisher:** [IAM](https://console.cloud.google.com/iam-admin/iam) → **Grant access** → New principals `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` → role **Pub/Sub Publisher** → **Save**. Fails? See [Domain restricted sharing](#domain-restricted-sharing).

6. **Create the topic:** [Pub/Sub → Topics](https://console.cloud.google.com/cloudpubsub/topic/list) → **Create topic**. Tick **Add a default subscription**, keep **Google-managed encryption key** → **Create**. Topic ID: {{topic_id}}

7. **Set the subscription to never expire:** [Edit subscription](https://console.cloud.google.com/cloudpubsub/subscription/edit/{{subscription_id}} "fallback: https://console.cloud.google.com/cloudpubsub/subscription/list") → **Expiration period: Never expire** → **Update**.

</div>
<div data-tab="Cloud Shell (gcloud)">

Run these in Cloud Shell, in order. Click a placeholder to fill it in.

```snippet
gcloud-create-project gcloud-enable-apis gcloud-create-sa gcloud-grant-subscriber gcloud-grant-publisher gcloud-create-key
```

Publisher grant fails? See [Domain restricted sharing](#domain-restricted-sharing).

<p data-paths-strict="SCEP">Download <code>service_account.json</code> (⋮ menu → <strong>Download</strong>) for the connector step. Key creation fails? See <a href="#key-creation-disabled">Key creation disabled</a>.</p>

```snippet
gcloud-create-topic gcloud-create-subscription
```

</div>
</div>

## If something fails

<h3 id="domain-restricted-sharing">Domain restricted sharing</h3>

**Symptom:** adding `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` in IAM fails. **Cause:** your organisation enforces the org policy `constraints/iam.allowedPolicyMemberDomains`, which blocks principals from outside it. **Fix:** an org policy administrator must allow that principal, or set an exception for this project. See the [official Pub/Sub setup page](https://support.google.com/chrome/a/answer/16560738).

<div data-paths-strict="SCEP">

<h3 id="key-creation-disabled">Key creation disabled</h3>

**Symptom:** creating the service account key fails. **Cause:** the org policy `iam.disableServiceAccountKeyCreation` (or `iam.managed.disableServiceAccountKeyCreation`) is enforced. Newer organisations have it on by default. **Fix:** an org policy administrator must allow key creation for this project.

</div>

<h3 id="permission-denied-after-grant">Permission denied straight after a grant</h3>

**Cause:** IAM changes can take up to about 90 seconds to apply. **Fix:** wait and retry.

<h3 id="cannot-create-project">Can't create a project</h3>

**Cause:** your account lacks the Project Creator role in the organisation or folder. **Fix:** ask an admin, or use an existing project.

## How to know it's working

Run the read-backs in Cloud Shell and check:

- the **topic** exists;
- the **subscription** is on that topic, has **no `filter`**, and has no expiry `ttl` under `expirationPolicy`;
- the project's IAM policy lists `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` as `roles/pubsub.publisher` and the connector service account as `roles/pubsub.subscriber`.

```snippet
gcloud-verify-topic gcloud-verify-subscription gcloud-verify-iam
```

<div id="handoff" data-paths-strict="VENDOR">

## Hand-off to your vendor

**Pub/Sub is done. Continue with your vendor's documentation:** for SecureW2, follow their [ChromeOS Certificate Provisioning API guide](https://securew2.com/documentation/google/chromeos-api-google-certificate-provisioning). This is the end of the guided setup. Troubleshooting remains available for the Pub/Sub side.

</div>

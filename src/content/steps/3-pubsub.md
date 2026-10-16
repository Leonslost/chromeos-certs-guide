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

Google publishes certificate requests to a Pub/Sub topic that **you** own. This step creates the project, the topic, its subscription, and the permissions between them. The gcloud commands below are drafted from the plan and have not been run end to end yet; the read-backs at the end tell you whether it worked.

## Set it up

Use either route. Each value you enter fills every command and link on this site.

<div data-tabs>
<div data-tab="Console click-through">

1. **Create a project:** [Create project](https://console.cloud.google.com/projectcreate). Then enter its ID: {{project_id}}

2. **Enable the APIs:** the [Chrome Management API](https://console.cloud.google.com/apis/library/chromemanagement.googleapis.com) and the [Cloud Pub/Sub API](https://console.cloud.google.com/apis/library/pubsub.googleapis.com).
3. **Create the topic:** [Pub/Sub → Topics](https://console.cloud.google.com/cloudpubsub/topic/list) → **Create topic**. Enter a topic ID, tick **Add a default subscription** (this creates a subscription named `<topic-id>-sub`), and leave **Encryption** on **Google-managed encryption key**, the default. Then click **Create**. Then enter the topic's ID: {{topic_id}}. The subscription it created is {{subscription_id}}.

4. **Stop the subscription expiring:** in [Pub/Sub → Subscriptions](https://console.cloud.google.com/cloudpubsub/subscription/list) open the subscription {{subscription_id}} → **Edit** → **Expiration period: Never expire** → **Update**. A default subscription expires after 31 days with no activity (for example, if the connector is offline for a month), and requests then silently stop. Leave the message filter as it is (none).

5. **Publisher grant:** open the topic → Permissions → add principal `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` with role **Pub/Sub Publisher**. We recommend topic scope; official docs also allow project scope. If this fails, see [If something fails → Domain restricted sharing](#domain-restricted-sharing).
6. **Create the connector service account:** [IAM & Admin → Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) → Create service account. Then enter its name: {{connector_sa_name}}. Its email is {{connector_sa_email}}.

7. **Grant it Pub/Sub Subscriber on the subscription:** open the subscription → Permissions → add the service account's email with role **Pub/Sub Subscriber**.

<div data-paths-strict="SCEP">

8. **Create a JSON key** for the service account (service account → Keys → Add key → JSON) and save it as `service_account.json`. You need it in Step 5. Treat it as a secret. If key creation is blocked, see [If something fails → Key creation disabled](#key-creation-disabled).

</div>

</div>
<div data-tab="Cloud Shell (gcloud)">

Run these in Cloud Shell, in order. Click a placeholder to fill it in.

```snippet
gcloud-create-project gcloud-enable-apis gcloud-create-topic gcloud-create-subscription
```

If the next command fails, see [If something fails → Domain restricted sharing](#domain-restricted-sharing).

```snippet
gcloud-grant-publisher gcloud-create-sa gcloud-grant-subscriber gcloud-create-key
```

<p data-paths-strict="SCEP">Download <code>service_account.json</code> from Cloud Shell (⋮ menu → Download) and keep it safe. You need it in Step 5. If key creation is blocked, see <a href="#key-creation-disabled">If something fails → Key creation disabled</a>.</p>

</div>
</div>

## If something fails

<h3 id="domain-restricted-sharing">Domain restricted sharing</h3>

**Symptom:** adding `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com` to the topic fails. **Cause:** your organisation enforces the org policy `constraints/iam.allowedPolicyMemberDomains`, which blocks principals from outside it. **Fix:** an org policy administrator must allow that principal, or set an exception for this project. See the [official Pub/Sub setup page](https://support.google.com/chrome/a/answer/16560738).

<div data-paths-strict="SCEP">

<h3 id="key-creation-disabled">Key creation disabled</h3>

**Symptom:** creating the service account key fails. **Cause:** the org policy `iam.disableServiceAccountKeyCreation` (or `iam.managed.disableServiceAccountKeyCreation`) is enforced. Newer organisations have it on by default. **Fix:** an org policy administrator must allow key creation for this project.

</div>

<h3 id="billing">Billing</h3>

<!-- TODO verify: is billing actually required to enable pubsub/chromemanagement? -->

**Symptom:** enabling an API asks you to link billing. **Fix:** link a billing account to the project. Pub/Sub usage for this is tiny.

<h3 id="permission-denied-after-grant">Permission denied straight after a grant</h3>

**Cause:** IAM changes can take up to about 90 seconds to apply. **Fix:** wait and retry.

<h3 id="cannot-create-project">Can't create a project</h3>

**Cause:** your account lacks the Project Creator role in the organisation or folder. **Fix:** ask an admin, or use an existing project.

## How to know it's working

Run the read-backs in Cloud Shell and check:

- the **topic** exists and its IAM policy lists the publisher grant for `cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com`;
- the **subscription** is on that topic, has **no `filter`**, and has no expiry `ttl` under `expirationPolicy`;
- the subscription's IAM policy lists the connector service account as `roles/pubsub.subscriber`.

```snippet
gcloud-verify-topic gcloud-verify-subscription
```

<div id="handoff" data-paths-strict="VENDOR">

## Hand-off to your vendor

**Pub/Sub is done. Continue with your vendor's documentation:** for SecureW2, follow their [Google ChromeOS / Certificate Provisioning API guide](https://www.securew2.com/). This is the end of the guided setup. Troubleshooting remains available for the Pub/Sub side.

</div>

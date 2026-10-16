---
title: 3. Device waiting, connector silent
order: 3
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

**You see:** the device shows "Waiting for next operation" (or similar) with no error, and the connector log ends at `Listening to requests...` with no Error.

**Why the log is silent:** `Listening to requests...` is printed once at startup and stays the last line while idle. GCCC logs an Error only when its own dialer fails. A TCP connection that then stalls, resets or fails TLS leaves only repeating dial lines.

**Proof a message arrived:** `received message with msgID:…`. Work down the checks and stop at the first hop with no evidence.

Run the PowerShell checks elevated on the connector server. The dial-line checks need debug logging: set `"log_level": "debug"` in `adapter_config.json`, then restart the service.

**Optional probe:** send a labelled, enrollment-shaped test message to the topic with `gcloud` and expect a 404 at claim. Never send payload shapes you do not know: Pub/Sub redelivers them in a loop.

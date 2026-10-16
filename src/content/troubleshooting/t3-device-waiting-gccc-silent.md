---
title: Device waiting, GCCC log silent
order: 3
paths: [SCEP]
officialLinks:
  - label: Use the Google Cloud Certificate Connector
    url: https://support.google.com/chrome/a/answer/11053129
---

**You see:** the device shows "Waiting for next operation" (or similar) with no error, and the connector log ends at `Listening to requests...` with no Error.

**Why the log is silent:** `Listening to requests...` is printed once at startup. On a healthy system it is also the last line for minutes or hours between enrolments, so it cannot tell "nothing was published" from "published but never delivered" from "fine and idle". GCCC only logs an Error when its own dialer fails. Once a TCP connection exists, a stalled, reset or mis-answered TLS handshake is invisible: the only trace is the dial lines repeating.

**The proof that a message arrived** is a different line: `received message with msgID:…`. If it never appears, work down the checks and stop at the first hop with no evidence.

Run the PowerShell checks on the GCCC server, in an elevated window. Debug logging (`"log_level": "debug"` in `adapter_config.json`, then restart the service) is needed for the dial-line checks.

**The probe:** instead of waiting for a real enrolment you can send a labelled, enrollment-shaped test message to the topic with `gcloud` and expect a 404 at claim. See probe. Never send payload shapes you do not know: Pub/Sub redelivers them in a loop.

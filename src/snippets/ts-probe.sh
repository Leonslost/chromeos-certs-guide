# A fake enrolment notification (49 bytes: dummy process ID, dummy customer ID). It creates nothing and the connector acknowledges it.
gcloud pubsub topics publish {{topic_id}} --project={{project_id}} --attribute=probe=manual --message=$'\x10\x02\x0a\x2d\x0a\x2000000000000000000000000000000001\x12\x09C00000000'

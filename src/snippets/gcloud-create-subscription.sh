# No --message-filter, and never expire (the default expires after 31 days with nothing reading it).
gcloud pubsub subscriptions create {{subscription_id}} \
  --topic={{topic_id}} \
  --expiration-period=never \
  --project={{project_id}}

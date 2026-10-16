# Skips every message published so far, including the stuck test message.
gcloud pubsub subscriptions seek {{subscription_id}} --time=$(date -u +%Y-%m-%dT%H:%M:%SZ) --project={{project_id}}

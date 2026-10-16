gcloud pubsub subscriptions describe {{subscription_id}} --project={{project_id}} \
  --format="yaml(topic,filter,expirationPolicy,deadLetterPolicy)"

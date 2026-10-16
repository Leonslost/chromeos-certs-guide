gcloud pubsub subscriptions describe {{subscription_id}} --project={{project_id}} \
  --format="yaml(topic,filter,expirationPolicy,deadLetterPolicy)"
gcloud pubsub subscriptions get-iam-policy {{subscription_id}} --project={{project_id}}

# Scoped to the subscription, not the project.
gcloud pubsub subscriptions add-iam-policy-binding {{subscription_id}} \
  --project={{project_id}} \
  --member="serviceAccount:{{connector_sa_email}}" \
  --role="roles/pubsub.subscriber"

# Project scope: this project only holds the certificate topic.
gcloud projects add-iam-policy-binding {{project_id}} \
  --member="serviceAccount:{{connector_sa_email}}" \
  --role="roles/pubsub.subscriber"

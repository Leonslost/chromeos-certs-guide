# Project scope: this project only holds the certificate topic.
gcloud projects add-iam-policy-binding {{project_id}} \
  --member="serviceAccount:cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

# Scoped to the topic, not the project.
gcloud pubsub topics add-iam-policy-binding {{topic_id}} \
  --project={{project_id}} \
  --member="serviceAccount:cert-provisioning-api-pubsub-publisher@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

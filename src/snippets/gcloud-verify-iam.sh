# Expect the publisher principal with roles/pubsub.publisher and the connector service account with roles/pubsub.subscriber.
gcloud projects get-iam-policy {{project_id}} \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/pubsub.publisher OR bindings.role:roles/pubsub.subscriber" \
  --format="table(bindings.role,bindings.members)"

gcloud projects get-iam-policy {{project_id}} --flatten=bindings --filter="bindings.role:roles/pubsub.publisher" --format="value(bindings.members)"
gcloud pubsub topics get-iam-policy {{topic_id}} --project={{project_id}}

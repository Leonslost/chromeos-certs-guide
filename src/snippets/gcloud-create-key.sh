# Writes the key to the current Cloud Shell folder. Treat it as a secret.
gcloud iam service-accounts keys create service_account.json \
  --iam-account={{connector_sa_email}} \
  --project={{project_id}}

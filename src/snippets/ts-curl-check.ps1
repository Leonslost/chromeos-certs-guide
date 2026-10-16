curl.exe -sS -o NUL -w "http=%{http_code}`n" https://pubsub.googleapis.com/
curl.exe -sS -o NUL -w "http=%{http_code}`n" --ssl-revoke-best-effort https://pubsub.googleapis.com/

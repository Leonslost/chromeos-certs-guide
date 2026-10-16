'pubsub.googleapis.com','oauth2.googleapis.com','chromemanagement.googleapis.com' | % { Test-NetConnection $_ -Port 443 | Select ComputerName,RemoteAddress,TcpTestSucceeded }

docker run -d --name gaokao-web \
  --env-file .env.docker \
  -p 13000:3000 \
  gaokao-web
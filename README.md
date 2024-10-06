# nicebreakers

Learn React, Express, Socket.io

## Run Locally

### Docker

```shell
npm run docker:build
```

#### Run Server

1. Create a copy of the `.docker-env.example` file
   ```shell
   cp .docker-env.example .docker-env
   ```
2. docker compose up

#### Upload Image

1. Tag image

```shell
docker tag nicebreakers:latest tinkermonkey808/nicebreakers:latest
```

2. Push to Docker Hub

```
docker push tinkermonkey808/nicebreakers:latest
```

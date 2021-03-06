# DAZN Coding Test

## Set Up

### Local

Ensure the correct tools are installed and available.

#### `nvm`
```
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
$ nvm install 10.15.3
$ nvm use
```

#### `yarn`
```
$ npm i -g yarn
```

#### `Docker`
Visit [the Docker website](https://hub.docker.com/search?q=&type=edition&offering=community) and choose the version of the Docker Engine you wish to install locally.

## Building

### Locally

For working outside of docker containers, the top level directory contains the following helper scripts that can be used to initiate the related scripts within each of the child projects.

```
$ yarn install:all  # install deps
$ yarn nuke:deps    # remove deps
$ yarn test         # run tests
```

However, with a correctly constructed Dockerfile the builds should be rapid, so development can be done utilising the containerised services.

Due to containers defined in different `docker-compose.yml` files not being able to communicate over the defined `bridge` network, they cannot be started locally as I originally desired (i.e. using the following commands in each directory and everything simply working).

```
$ yarn build        # builds images using docker-compose
$ yarn start:dev    # spins up containers using docker-compose
```

Or both commands in one go with:

```
$ yarn build:start:dev
```

The best way to get them working locally is going to `services/auth-server` and running:
```sh
$ yarn build:start:dev
```
Then going to `services/stream-management-server` and running:
```sh
$ docker run redis -p 4001:6379

# 4001 is the external port as defined in the docker-compose.yml

$ yarn
$ yarn start
```

## Deploying

Unfortunately I didn't get round to creating a deployment process/pipeline, but it could operate as described here.

_Small_, single-concern pull requests should be made on the chosen source control management service (Github / Bitbucket). Commits made to the remote branch should fire a webhook that can be used to trigger the following CI pipeline stages on the chosen CI system:
- **PR Linting** - used to take away the overhead in reviews about PR / commit conventions.
  - this can be implemented with Danger CI to ensure conformance to specific commit message formats, analyse package version updates and associate these with areas of the service to focus testing on etc.
  - these warnings, errors and hints can be displayed on the PR itself via webhooks or simply via output in the console
- **Build & Test** - this will use the Dockerfile to build an image that tests can then be run in
  - if the image fails to build, the CI pipeline errors and merging is blocked for the PR
  - if the image builds, but one of the test phases fails, the CI pipeline should again error
  - if the tests pass, this stage should be considered complete
- **Review App** - this will create a container from the previously built image and host the server, making the endpoint available via notification on the PR (using Danger CI or another webhook)
  - this could get automatically linked with stage versions of other services to ensure like-for-like comparisons can be made with the working stage environment during smoke testing

Once the Build & Test stage is complete, and the PR has the required developer/tester approvals, the PR can be merged into `master`, which will trigger it's own pipeline stages:

- **Build & Test** - as before
- **Auto-Deploy - Stage**
  - container spun up from the pre-built image using the ENV vars set for this stage of the pipeline
  - other stage-services may be pointing to this environment, so wider testing may need to be performed
- **Auto-Deploy - NFT**
  - container spun up from the pre-built image using the ENV vars set for this stage of the pipeline
  - possible stubbing of external services to ensure load testing is scoped to this serivce only
- **Auto-Deploy - Production Offline**
  - container spun up from the pre-built image using production ENV vars to permit a like-for-like experience that is not yet live
- **Manual-Deploy - Production**
  - perform a zero-downtime deployment that will swap old containers out for their new counterparts
  - this will likely be managed by the container orchestration suite (Kubernetes or Docker Swarm managers)

## Scalability Strategy

- Each service should exist in its own Docker image
  - Dockerisation means the services become more easily platform-agnostic, so the company won't be tied to a particular cloud-service vendor
- Database and Redis instances should also exist in their own containers
  - This decouples these instances from the web server (and each other) and will improve the horizontal scalability of each services (they won't have to scale proportionally with each other)
  - Hot services/instances can therefore be scaled up with ease
- A cluster orchestration tool can be used to effecively manage containers
  - For this coding challenge, I deployed the images from Docker Hub using AWS ECS, but preferably Kubernetes would be used to get comparable features whilst preventing vendor lock-in.
- Managed services should be preferred as this takes support burden off the business
- Message queues should be used for fire-and-forget situations (like logging) so that services are decoupled from each other - consumers can subscribe or ignore as they please without having to code for new services that wish to connect or conform to multiple bespoke communication formats
- Where data storage is concerned, consider sharding (e.g. Redis clustering, assigning hash ranges to specific instances, similar setup with databases)
  - Also, when it comes to databases, one table per database isn't necessarily the worst idea. It may get harder to create complex queries for data between tables as that data would be distributed, however atomicity can still be achieved by way of acknowledgements and centralised message queues.
- Cache where possible. Try to reduce hits through to inner-servers without degrading the perceived responsiveness of the system.

# 🚨🚨 Architecture 🚨🚨

Please see the
### [ARCHITECTURE.md](ARCHITECTURE.md)
for information on the envisioned services and how they interconnect, along with the process of how this idea of the architecture came to be.

## Testing AWS-Deployed API

`AUTH_SERVER`               = `52.14.133.151:5000`

`STREAM_MANAGEMENT_SERVER`  = `52.15.190.97:4000`

The overview of where these services live in the hierarchy is in the ARCHITECTURE file.

A fake user `john` can be used for these tests, which will first be against the `AUTH_SERVER`.

### Test 1

In a REST client, set up a `POST` request with the following body against the `/login` route.

```json
{
	"username": "john",
	"password": "johns_password"
}
```

Ensure your client has auto-added the `Content-Type`: `application/json` header.

### Result

This should return a `204` (no body content, the session comes back in a cookie).

Copy the returned `Set-Cookie` value and save it for the next step.

### Test 2

Change the username or password in the body.

### Result

This should return a `401` as a non-existent user will not authorised to stream any event.

### Test 3

Set up another `POST` request against the `/session/check` route.

Add the session cookie from before (easiest to paste the entirety of the previously copied value into a `Cookie` header).

### Result

This should return a `200` and return a JSON containing a hashed version of the username, for use by the Stream Management Service as a cache key (discussed in ARCHITECTURE.md).

```json
{
  "userHash": "527bd5b5d689e2c32ae974c6229ff785"
}
```

### Test 4

Change any character in the session JWT string.

### Result

This should return a `401` as the token will not have been verified.


The next tests are for requests to the `STREAM_MANAGEMENT_SERVER`.


### Test 5

Set up a `POST` request against the `/authorized/check` route.

Add an arbitrary `eventID` in the JSON body (this ID will become a list value set against the hashed-username cache key)

```json
{
	"eventID": "AN_EVENT_ID"
}
```

Add the session cookie from before (easiest to paste the entirety of the previously copied value into a `Cookie` header) and verify the client has added the `Content-Type`: `application/json` header.

### Result

This should return a `200` and return the same JSON as before, containing a hashed version of the username.

```json
{
  "userHash": "527bd5b5d689e2c32ae974c6229ff785"
}
```

This is passed back here by the auth server's `/session/check` to allow the request-initiating Stream Service to use when pinging this Stream Management Service (letting it know a user is still streaming an event and keeping the "concurrent event cache" up-to-date).

This pinging could happen directly or via a message queue.

### Test 6

Repeat this request multiple times.

### Result

The subsequent two times should return the same `200` response as before.

Any time after that should return a `401` with a message indicating the user has reached the maximum stream limit.

```json
{
  "error": "Maximum number of concurrent streams reached."
}
```

To retest this, hit the `/flushall` route with a `GET` request.

### Test 7

Leave the `AUTH_SERVER` `/authorized/check` POST request for over an hour, then reattempt with the same session cookie.

### Result

Token will have expired.

```json
{
  "error": "jwt expired"
}
```

If any of these endpoints seems to be failing, please get in touch 😄

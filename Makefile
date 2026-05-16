DOCKER_PLATFORM ?= linux/amd64
REGISTRY := registry.recklessabandon.dev

.PHONY: run build install docker-build docker-build-frontend docker-push docker-push-frontend deploy

run:
	npm run dev & npm run dev:server

build:
	npm run build && npm run build:server

install:
	npm install

docker-build:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) ./scripts/docker-build.sh

docker-build-frontend:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) \
	VITE_API_BASE_URL=$(VITE_API_BASE_URL) \
	VITE_CLERK_PUBLISHABLE_KEY=$(VITE_CLERK_PUBLISHABLE_KEY) \
	./scripts/docker-build-frontend.sh

docker-push:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) PUSH=true ./scripts/docker-build.sh

docker-push-frontend:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) PUSH=true \
	VITE_API_BASE_URL=$(VITE_API_BASE_URL) \
	VITE_CLERK_PUBLISHABLE_KEY=$(VITE_CLERK_PUBLISHABLE_KEY) \
	./scripts/docker-build-frontend.sh

deploy: docker-push docker-push-frontend

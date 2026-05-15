DOCKER_PLATFORM ?= linux/amd64
REGISTRY := registry.recklessabandon.dev

.PHONY: run build install docker-build docker-push deploy

run:
	npm run dev & npm run dev:server

build:
	npm run build && npm run build:server

install:
	npm install

docker-build:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) ./scripts/docker-build.sh

docker-push:
	DOCKER_PLATFORM=$(DOCKER_PLATFORM) REGISTRY=$(REGISTRY) PUSH=true ./scripts/docker-build.sh

deploy: docker-push

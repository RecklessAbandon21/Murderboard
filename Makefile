.PHONY: run build install docker-build docker-push deploy

run:
	npm run dev & npm run dev:server

build:
	npm run build && npm run build:server

install:
	npm install

docker-build:
	./scripts/docker-build.sh

docker-push:
	PUSH=true ./scripts/docker-build.sh

deploy: docker-push

.PHONY: run build install

run:
	npm run dev & npm run dev:server

build:
	npm run build && npm run build:server

install:
	npm install

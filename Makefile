.DEFAULT_GOAL := help

IMAGE = ruby:2.7.2-buster
DOCKER = docker run --rm -v $(PWD):/usr/src/app -v $(PWD)/vendor/bundle:/usr/local/bundle:rw,delegated -w /usr/src/app

.PHONY: install
install: ## Install dependencies
	@$(DOCKER) $(IMAGE) bundle install

.PHONY: start
start: ## Start local development environment
	$(DOCKER) -p 4000:4000 $(IMAGE) jekyll serve --host 0.0.0.0 --port 4000

.PHONY: build
build: ## Build static-site for deployment
	@$(DOCKER) $(IMAGE) jekyll build

.PHONY: shell
shell: ## Shell instance for development purposes
	@$(DOCKER) -it $(IMAGE) bash

.PHONY: open
open: ## Open local development website
	open "http://0.0.0.0:4000"

# https://blog.thapaliya.com/posts/well-documented-makefiles/
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

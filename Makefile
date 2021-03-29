.DEFAULT_GOAL := help

IMAGE = jekyll/builder:3.8
DOCKER = docker run --rm -v $(PWD):/srv/jekyll -v $(PWD)/vendor/bundle:/usr/local/bundle:rw,delegated

.PHONY: start
start: ## Start local development instance
	$(DOCKER) -p 4000:4000 $(IMAGE) jekyll serve

.PHONY: build
build: ## Build static-site for deployment
	@$(DOCKER) -e JEKYLL_UID -e JEKYLL_GID $(IMAGE) jekyll build

.PHONY: shell
shell: ## Shell instance for development purposes
	@$(DOCKER) -it $(IMAGE) sh

.PHONY: open
open: ## Open local development website
	open "http://0.0.0.0:4000"

# https://blog.thapaliya.com/posts/well-documented-makefiles/
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

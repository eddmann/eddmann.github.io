---
layout: post
title: 'Using Homebrew to Manage Project Development Scripts'
link: https://tech.mybuilder.com/using-homebrew-to-manage-project-development-scripts/
meta: 'Looking into using Homebrew to Manage Project Development Scripts'
---

When a project becomes sufficiently large in size you will undoubtedly encounter the need to simplify certain tasks, such as managing external dependencies or configuring environment parameters.
Within the MyBuilder code-base we have required these kinds of processes for some time.

<!--more-->

Initially starting with a `dev-upload` function, it soon grew to a shared shell script which all users had to manually update (think 'old-school' copy n' paste dependency management).
This was not ideal and we pondered on several different solutions to manage this problem, such as using [Composer scripts](https://getcomposer.org/doc/articles/scripts.md).
We eventually settled on taking advantage of [Homebrew](https://brew.sh/) (the Mac package manager), thanks to a [podcast](https://changelog.com/podcast/223) that Gavin had listened to.
Using this approach allows us to not only manage scripts, but far more complex installation requirements in the future.

In this post I would like to discuss how we went about creating a personal Homebrew [Tap](http://docs.brew.sh/brew-tap.html) and [Formula](http://docs.brew.sh/Formula-Cookbook.html), configured to provide the desired up-to-date scripts which aid in managing the project.

### Defining the Formula

Homebrew is well suited to accessing and downloading Taps found on GitHub, providing you abide by some conventions.
The repository name (Tap) should begin with `homebrew-` and include all Formulas within a root `Formula` directory.
Below is a simple Formula definiton which provides access to two scripts along with 'keg-only' access to a `common` script file which is used in both.

```ruby
class ProjectDevTools < Formula
    desc "Provides scripts to make it easier to work with the code-base"
    url 'https://github.com/eddmann/homebrew-project-dev-tools.git'

    def install
        prefix.install "src/common"
        bin.install "src/dev-rebuild", "src/dev-tools-update"
    end
end
```

### Setting up the Example Scripts

Now that we have a mechanism to manage the development scripts lets create some example scripts.
I have found it beneficial to be able to reuse an environment variable guard and `run` function within each of the subsequent scripts.
The `run` function provides us with the ability to conditional suppress command invocation output, if verbose mode is not enabled.

```bash
#!/bin/bash

ERROR='\033[41;1;37m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

if [[ -z "$PROJECT_ROOT_DIR" || ! -d "$PROJECT_ROOT_DIR" ]]; then
    printf "⚠️ Make sure you have ${ERROR}PROJECT_ROOT_DIR${NC} set\n"
    exit 1
fi

for arg in "$@"; do
    shift

    if [[ "$arg" == "-v" ]]; then
        VERBOSE_MODE=1
        continue # remove `-v` from args
    fi

    set -- "$@" "$arg"
done

function run()
{
    if [[ $VERBOSE_MODE -eq 1 ]]; then
        echo "$" "$@"
        eval $(printf '%q ' "$@")
    else
        eval $(printf '%q ' "$@") &> /dev/null
        if [ $? -ne 0 ]; then
            printf "${ERROR}⚠️ Error${NC}\n"
            exit 1
        else
            printf "✓\n"
        fi
    fi
}
```

With this script now in-place, we can move on to defining the required steps to rebuild the contrived project.
You will notice below that we attempt to source the `common` file from the local `src` directory first, this is so throughout development we can easily work with pending changes.

```bash
#!/bin/bash

source src/common 2> /dev/null || source $(brew --prefix project-dev-tools)/common

APP_NAME="${1:-*}"

for app in $PROJECT_ROOT_DIR/app/$APP_NAME/; do
    [[ ! -d "$app" ]] && continue

    name=$(basename "$app")
    printf "💾 ${GREEN}$name${NC} ${BLUE}[$app]${NC}\n"

    printf "> running composer install... "
    run composer install -d "$app"

    printf "> clearing cache... "
    run rm -fr "${app}cache/*"

    printf "\n"
done

printf "🎉 Rebuild Complete!\n"

exit 0
```

Another useful script that we have found is the ability to update the Formula without the need to understand how Homebrew works.
Using the script below - the Tap is updated and Formula re-installed, to ensure that we are using the latest version available within the repository.

```bash
#!/bin/bash

source src/common 2> /dev/null || source $(brew --prefix project-dev-tools)/common

printf "> reinstalling project-dev-tools... "
run brew reinstall project-dev-tools

printf "🎉 Update Complete!\n"

exit 0
```

With this now all in-place we can use the following commands to initially install the new Formula on a development machine.
Once this has been successfully run, we can move over to use the newly installed `dev-tools-update` script for future updates.

```bash
brew tap eddmann/project-dev-tools
brew install project-dev-tools
```

### Demo

The example Tap and Formula can be found within [this](https://github.com/eddmann/homebrew-project-dev-tools) GitHub repository.
You can see an interactive example of installing and using the scripts created below:

<p><script type="text/javascript" src="https://asciinema.org/a/apc3kpg72qgrizdhzt1s7h1kc.js" id="asciicast-apc3kpg72qgrizdhzt1s7h1kc" async></script></p>

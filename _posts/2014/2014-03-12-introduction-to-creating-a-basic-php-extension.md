---
layout: post
title: 'Introduction to Creating a Basic PHP Extension'
meta: 'Basic introduction to setting up and building a PHP Extension.'
---

I recently decided to test my novice C skills in the field of building a PHP extension.
However, despite some very good resources ([here](http://www.phpinternalsbook.com/) and [here](http://devzone.zend.com/303/extension-writing-part-i-introduction-to-php-and-zend/)), there still seems to be a lack of beginner-friendly material on the subject.
In this post I will be documenting a simple development environment that has worked well on a fresh CentOS 6.5 installation.
Once this has been setup, we will then move on to creating a simple 'Hello World' extension, highlighting some of the extension platforms capabilities.

<!--more-->

## Setup

The first step we need to take is to install all the prerequisite development tools (automake, autoconf etc.) required to compile PHP from source.
We can do this simply by running the following commands within a shell instance.

```bash
$ sed -i "s/^\exclude.*$/exclude=/g" /etc/yum.conf # allow kernel-devel package.
$ yum groupinstall -y 'Development Tools'
```

With these tools now successfully available to us we can now pull-down the PHP source code and checkout the desired version.

```bash
$ git clone http://git.php.net/repository/php-src.git
$ git checkout PHP-5.5
```

The final step is to configure and compile the code-base, specifying where you wish the installed binary files to be located.
As this build is simply for testing purposes I have decided to compile as bare-bones installation as possible, whilst still taking into consideration development requirements (i.e. debugging).

```bash
$ ./buildconf
$ ./configure --prefix=$HOME/php --disable-cgi --disable-all --enable-debug --enable-maintainer-zts
$ make && make install
```

## Creating the Extension

With the development environment now setup we can commence with creating the extension.
The extension we will be creating will provide the user with two functions, which go as follows:

- hello_world () - returns the string "Hello, World!" to the user.
- hello (string $name, [, bool $format ] ) - greets the supplied users name (i.e. "Hello, Joe!"), neatly formatting the input if specified.

So as to provide you with some context for what this extension is trying to achieve, the equivalent PHP code has been provided below.

```php
function hello_world()
{
    return "Hello, World!";
}

function hello($name, $format = true)
{
    if ($format) {
        $name = ucfirst(strtolower($name));
    }

    return "Hello, " . $name . "!";
}
```

The first file that is required to successfully compile the new extension is the 'config.m4' file, used when running 'phpize'.
This file defines where the extension is located and how it can be enabled.

```bash
PHP_ARG_ENABLE(hello, whether to enable hello support,
[ --enable-hello   Enable hello support])

if test "$PHP_HELLO" = "yes"; then
    AC_DEFINE(HAVE_HELLO, 1, [Whether you have hello])
    PHP_NEW_EXTENSION(hello, hello.c, $ext_shared)
fi
```

We are then able to provide the extension with an implementation using the ('hello.c') example below.

```c
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "php.h"

#define PHP_MY_EXTENSION_VERSION "1.0"
#define PHP_MY_EXTENSION_EXTNAME "hello"

PHP_FUNCTION(hello_world);
PHP_FUNCTION(hello);

extern zend_module_entry hello_module_entry;
#define phpext_my_extension_ptr &hello_module_entry

static zend_function_entry hello_functions[] = {
    PHP_FE(hello_world, NULL)
    PHP_FE(hello, NULL)
    {NULL, NULL, NULL}
};

zend_module_entry hello_module_entry = {
#if ZEND_MODULE_API_NO >= 20010901
    STANDARD_MODULE_HEADER,
#endif
    PHP_MY_EXTENSION_EXTNAME,
    hello_functions,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
#if ZEND_MODULE_API_NO >= 20010901
    PHP_MY_EXTENSION_VERSION,
#endif
    STANDARD_MODULE_PROPERTIES
};

ZEND_GET_MODULE(hello)

PHP_FUNCTION(hello_world)
{
    RETURN_STRING("Hello, World!", 1);
}

PHP_FUNCTION(hello)
{
    char *name;
    size_t name_len;
    zend_bool *format = 1;

    if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s|b", &name, &name_len, &format) == FAILURE) {
        RETURN_NULL();
    }

    if (format && name_len) {
        name = estrndup(name, name_len);
        php_strtolower(name, name_len);
        *name = toupper(*name);
    }

    char *out;
    size_t out_len = spprintf(&out, 0, "Hello, %s!", name);

    RETVAL_STRINGL(out, out_len, 0);

    if (format && name_len) {
        efree(name);
    }

    return;
}
```

Looking at the example above you will notice that there is far more boilerplate work required to initially setup and define the functions supplied.
An interesting section I would like to draw your attention to is the 'zend_parse_parameters' function call, which supplies the function with the users provided string name and optional format boolean.
If the user has decided to format the input we must first make a copy of the name value to work on.
Finally, if we were required to format the string we must do some housekeeping at the end of the function, so as to not cause any memory leaks.

With the implementation now in place we are able to build and test the new extension.
We must first run 'phpize' to create the necessary build scripts, notice that I am specifying the full path to where I installed the compiled PHP binaries.
In a similar manner we must also configure the build, supplying the full path to the 'php-config' application.

```bash
$ $HOME/php/bin/phpize
$ ./configure --with-php-config=$HOME/php/bin/php-config
$ make && make install
```

We can now test the extension is working correctly, by running the CLI PHP binary with the new extension specified.

```bash
$ $HOME/php/bin/php -dextension=hello.so -r "echo hello_world();"       # Hello, World!
$ $HOME/php/bin/php -dextension=hello.so -r "echo hello('JoE');"        # Hello, Joe!
$ $HOME/php/bin/php -dextension=hello.so -r "echo hello('JoE', false);" # Hello, JoE!
```

## Resources

- [PHP Internals Book](http://www.phpinternalsbook.com/)
- [Extension Writing](http://devzone.zend.com/303/extension-writing-part-i-introduction-to-php-and-zend/)
- [PHP Extensions Made Eldrich](http://www.kchodorow.com/blog/2011/08/11/php-extensions-made-eldrich-installing-php/)

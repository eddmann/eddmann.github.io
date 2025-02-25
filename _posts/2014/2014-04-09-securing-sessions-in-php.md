---
layout: post
title: 'Securing Sessions in PHP'
meta: 'A comprehensive guide to creating a secure PHP session handler class using best practices for session management and encryption.'
tags: php security
---

Following on from my previous post on [Self-signed SSL certificates](/posts/self-signed-ssl-certificates-with-nginx-and-apache/), I would now like to address the second most common Web application vulnerability ([Broken Authentication and Session Management](https://www.owasp.org/index.php/Top_10_2013-A2-Broken_Authentication_and_Session_Management)).
When delving into the subject I was unable to find a definitive resource for a PHP implementation.
Due to this, I set out to combine all the best practice I could find into a single session handler, to help protect against the common attack vectors.
Since PHP 5.4, you are able to set the session handler based on a class instance that extends the default `SessionHandler` class.

<!--more-->

In my initial research I found multiple commonly mis-configured options that should be addressed, and these are presented below in the `setup` method.
Here we specify that sessions should only be passed via cookies, removing the possibility of the session identifier being sent as a _GET_ parameter.
We then alter the session name (from the default) to a specified application-specific name, which is good practice.
Finally, we set the cookie parameters of the session identifier.
These parameters can be overridden when initialising the session handler.
However, recommended defaults are to only allow it to be sent over HTTPS (if present) and to restrict HTTP access (no client-side script access).
It is recommended that you override the path and domain based on the application instance (abiding by the principle of least privilege).

```php
class SecureSessionHandler extends SessionHandler {

    protected $key, $name, $cookie;

    public function __construct($key, $name = 'MY_SESSION', $cookie = [])
    {
        $this->key = $key;
        $this->name = $name;
        $this->cookie = $cookie;

        $this->cookie += [
            'lifetime' => 0,
            'path'     => ini_get('session.cookie_path'),
            'domain'   => ini_get('session.cookie_domain'),
            'secure'   => isset($_SERVER['HTTPS']),
            'httponly' => true
        ];

        $this->setup();
    }

    protected function setup()
    {
        ini_set('session.use_cookies', 1);
        ini_set('session.use_only_cookies', 1);

        session_name($this->name);

        session_set_cookie_params(
            $this->cookie['lifetime'], $this->cookie['path'],
            $this->cookie['domain'], $this->cookie['secure'],
            $this->cookie['httponly']
        );
    }

    // ...

}
```

## Session Management

With the environment successfully configured we are now able to safely start, destroy and regenerate the current session using the provided methods below.
The `start` method in principle wraps the `session_start` function; however, as a precaution there is a one-in-five chance that the session identifier is regenerated (to address session fixation).
The `forget` method removes the contents of the `$_SESSION` array (for access during the remainder of the current request), expires the session cookie and then destroys the session itself.
Finally, the `refresh` method replaces the current session identifier with a new one.

```php
public function start()
{
    if (session_id() === '') {
        if (session_start()) {
            return (mt_rand(0, 4) === 0) ? $this->refresh() : true; // 1/5
        }
    }

    return false;
}

public function forget()
{
    if (session_id() === '') {
        return false;
    }

    $_SESSION = [];

    setcookie(
        $this->name, '', time() - 42000,
        $this->cookie['path'], $this->cookie['domain'],
        $this->cookie['secure'], $this->cookie['httponly']
    );

    return session_destroy();
}

public function refresh()
{
    return session_regenerate_id(true);
}
```

## Session Content Encryption

There are many different ways to persist the contents of a user's session, dependent on your business requirements.
Extending the default SessionHandler allows us to rewrite how sessions are read and written.
In this case I have decided to encrypt/decrypt (using mcrypt) the serialised contents using a specified key, before calling the original read/write methods.
Typically the session contents are written to plain-text files, and if not correctly configured (file permissions, directory location) they are stored in the global PHP session directory.
This may not be an issue if you have sole access to the server (or are using a security patch such as [Suhosin](http://www.hardened-php.net/suhosin/)), but in a shared-hosting environment it could result in a major security breach.

```php
public function read($id)
{
    return mcrypt_decrypt(MCRYPT_3DES, $this->key, parent::read($id), MCRYPT_MODE_ECB);
}

public function write($id, $data)
{
    return parent::write($id, mcrypt_encrypt(MCRYPT_3DES, $this->key, $data, MCRYPT_MODE_ECB));
}
```

## Session Expiration and Validation

With the session contents now encrypted we can move on to ensure that the current session times out (expires) after a defined idle period, and that the user is as expected (to counter session hijacking).
Sessions are garbage collected based on a configured time; however, it is good practice to check and expire idle sessions in the application-land per request.
The example below stores the time of the last activity in the user's session, checking against the current time to validate if it has exceeded the specified duration (in minutes).
Fingerprinting the current session with the user's user-agent and IP address allows us to provide another layer of security against session hijacking.
To address network proxy issues (which could cause false positives), only the first two IP blocks are used in the calculation of the fingerprint hash.

```php
public function isExpired($ttl = 30)
{
    $activity = isset($_SESSION['_last_activity'])
        ? $_SESSION['_last_activity']
        : false;

    if ($activity !== false && time() - $activity > $ttl * 60) {
        return true;
    }

    $_SESSION['_last_activity'] = time();

    return false;
}

public function isFingerprint()
{
    $hash = md5(
        $_SERVER['HTTP_USER_AGENT'] .
        (ip2long($_SERVER['REMOTE_ADDR']) & ip2long('255.255.0.0'))
    );

    if (isset($_SESSION['_fingerprint'])) {
        return $_SESSION['_fingerprint'] === $hash;
    }

    $_SESSION['_fingerprint'] = $hash;

    return true;
}

public function isValid($ttl = 30)
{
    return ! $this->isExpired($ttl) && $this->isFingerprint();
}
```

## Session Access

This section is not exactly security related, but as we are creating a session wrapper it is worthwhile to provide the ability to add and retrieve session values based on dot notation.
Doing so increases the readability when accessing large array-based data structures.

```php
public function get($name)
{
    $parsed = explode('.', $name);

    $result = $_SESSION;

    while ($parsed) {
        $next = array_shift($parsed);

        if (isset($result[$next])) {
            $result = $result[$next];
        } else {
            return null;
        }
    }

    return $result;
}

public function put($name, $value)
{
    $parsed = explode('.', $name);

    $session =& $_SESSION;

    while (count($parsed) > 1) {
        $next = array_shift($parsed);

        if ( ! isset($session[$next]) || ! is_array($session[$next])) {
            $session[$next] = [];
        }

        $session =& $session[$next];
    }

    $session[array_shift($parsed)] = $value;
}
```

## Example Usage

With the implementation now in place we can see the example in practice.
I have constructed a test environment which ensures that the PHP configuration uses session files stored in a relative directory.
In conjunction, we create a new session handler instance (passing in our encryption key) and register it with the PHP engine.

```php
$session = new SecureSessionHandler('cheese');

ini_set('session.save_handler', 'files');
session_set_save_handler($session, true);
session_save_path(__DIR__ . '/sessions');
```

Finally, we start the session instance and add a worthwhile validation check (expiration of five minutes), deleting the session if the checks do not pass.
Values can then be added to the current session using the 'put' method and accessed in a similar manner.

```php
$session->start();

if ( ! $session->isValid(5)) {
    $session->destroy();
}

$session->put('hello.world', 'bonjour');

$session->get('hello.world'); // bonjour
```

The full class implementation can be found as a Gist - [SecureSessionHandler.php](https://gist.github.com/eddmann/10262795).

## Resources

- [Top 10 2013-A2-Broken Authentication and Session Management](https://www.owasp.org/index.php/Top_10_2013-A2-Broken_Authentication_and_Session_Management)
- [How to Create Bulletproof Sessions](http://blog.teamtreehouse.com/how-to-create-bulletproof-sessions)
- [How to Hack a Web Site](http://www.youtube.com/watch?v=O90lSMmTjjo)
- [Encrypt session data in PHP](http://www.zimuel.it/encrypt-php-session-data/)
- [PHP - SessionHandler](http://www.php.net/manual/en/class.sessionhandler.php)

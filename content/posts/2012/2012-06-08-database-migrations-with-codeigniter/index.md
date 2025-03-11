---
layout: post
title: 'Database Migrations with CodeIgniter'
meta: 'Discover how to manage database migrations with CodeIgniter through practical examples and step-by-step guidance on synchronising your database schema with your source code.'
tags: ['codeigniter', 'php']
---

I first became aware of database migrations a few years ago when I was exploring the world of [Rails](http://rubyonrails.org/).
However, I have only recently used them again, prompted by a gentle nudge from SE-Radio ([Episode 186](http://www.se-radio.net/2012/06/episode-186-martin-fowler-and-pramod-sadalage-on-agile-database-development/)) and a large web application build which re-introduced them into my development lifecycle.
Due to current events, I, for one, do not wish to see them go any time soon.

<!--more-->

## So What Are Database Migrations?

Since it is extremely rare for any common web application to not be driven by a database, it is crucial to maintain synchronisation between the state of the schema and the source code.
Migrations are used to achieve this goal, providing you with the ability to version control your schema alterations, so to speak.
Using this approach, developers can pull down schema changes along with source code alterations (if using some form of [SCM](http://en.wikipedia.org/wiki/Source_Control_Management)), without the need to run external tear up/down scripts.
As a result, it allows you to quickly roll back and forth through the history of the schema to work with the desired version.
These migrations are commonly used to easily modify the state of the database based on the environment, for example, development, testing/QA or production.

## An Example...

I have spent more and more time using CodeIgniter (and, as a result, PHP) over the past few weeks.
This coincided with my interest in migrations, as I was pleasantly surprised to discover that CodeIgniter provides a simple out-of-the-box [database migration implementation](http://codeigniter.com/user_guide/libraries/migration.html).
It should be noted that many different migration tools are available in most programming languages.
Be warned against vendor lock-in; spend some time making your decision.

Below is a sample migration that should be created inside `./application/migrations/` with the filename `001-create-users.php`.
Migration files in CodeIgniter follow the convention of prefixing the version number, followed by a descriptive name (commonly the class name).

```php
class Migration_Create_Users extends CI_Migration {

  public function up()
  {
    $fields = array(
      'id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT',
      'username VARCHAR(10) DEFAULT NULL',
      'password VARCHAR(50) DEFAULT NULL'
    );

    $this->dbforge->add_field($fields);
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('users');
  }

  public function down()
  {
    $this->dbforge->drop_table('users');
  }

}
```

The code snippet above creates a table (in MySQL) with an auto-incrementing primary key called `id` and columns for `username` and `password`.
If this migration is rolled back, the `users` table is dropped from the schema.
To run this migration, you must first ensure that migrations are enabled and that the desired version is set in your application's configuration file (found at `./application/config/migration.php`).
Once configured, you can create a simple controller, as displayed below, which calls the migration library when visited.

```php
class Migrate extends CI_Controller {

  public function index()
  {
    $this->load->library('migration');

    if ( ! $this->migration->current()) {
      show_error($this->migration->error_string());
    }
  }

}
```

By adding a second migration (named `002-add-name-fields.php`) to the application, you can see how the database can be procedurally altered.

```php
class Migration_Add_Name_Fields extends CI_Migration {

  public function up()
  {
    $fields = array(
      'first_name VARCHAR(50) DEFAULT NULL',
      'last_name VARCHAR(50) DEFAULT NULL'
    );

    $this->dbforge->add_column('users', $fields);
  }

  public function down()
  {
    $this->dbforge->drop_column('users', 'first_name');
    $this->dbforge->drop_column('users', 'last_name');
  }

}
```

As demonstrated by these two migration examples, switching between versions is incredibly simple.
This simplicity arises from the creation of well-thought-out methods for both applying (tear up) and reverting (tear down) migrations.
Reflecting on the migration ethos, I can certainly appreciate the benefits of managing schemas in this manner.

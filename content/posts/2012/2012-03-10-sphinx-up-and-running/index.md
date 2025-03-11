---
layout: post
title: 'Sphinx, up and running'
meta: 'A comprehensive guide to installing and configuring Sphinx, a powerful full-text search engine, with SphinxSE integration for MySQL.'
tags: ['sphinx', 'mysql']
---

Sphinx (_SQL Phrase Index_) is an open-source, full-text search engine, independent of any one data store implementation.
The origin of the data does not concern Sphinx, as interaction with the data source is abstracted by the many drivers available.
Currently, built-in to the product are drivers for MySQL, PostgreSQL, ODBC-compliant databases and the ability to parse XML-formatted streams (via pipes).
It must be noted, however, that each data record is required to have a single unique field ID.

<!--more-->

To query the search engine (through the daemon – _searchd_) you have three different options (depending on your selected data source):

1. **SphinxAPI**, a lightweight native search API. PHP, Perl, Ruby and Java implementations are distributed out of the box. Due to its small size and minimal complexity, many third-party ports exist along with the ability to easily create your own.
2. **SphinxQL**, using Sphinx's own MySQL network protocol implementation you have the ability to communicate using a MySQL client and query the data with this SQL subset.
3. **SphinxSE**, a MySQL server storage engine plugin which allows you to interface with the search daemon via tables (with specifically defined schemas).

## MySQL and Sphinx

Sphinx is heavily used in conjunction with the MySQL server, hence the greater number of options available to interact with each of the two.
It is, however, often misconstrued as being the full-text search engine for InnoDB tables.
This is true to a degree, as it opens up the possibility for full-text indexing on InnoDB tables, similar to MyISAM tables; however, both implementations are slightly different.

Being an external product, Sphinx indexes are not updated upon each change to its source (be it an `INSERT`, `UPDATE` or `DELETE`).
MySQL's MyISAM implementation, however, provides this functionality by processing these changes immediately after the effect has occurred.
As a result, huge performance hits are incurred when handling large data sets.
This can lead to Sphinx and the data source getting out of sync unless precautions are put in place (i.e. scheduled indexes).
On top of this, Sphinx only returns the matching records' primary keys, requiring extra processing to retrieve the relevant data for those records.
This hindrance can be mitigated by using SphinxSE.

## Installation

If you like the sound of Sphinx and want to give it a go, below I have provided a step-by-step guide to setting up a working installation with SphinxSE support on an Ubuntu 11.10 server.

```bash
$ wget http://sphinxsearch.com/files/sphinx-2.0.4-release.tar.gz
$ tar -zxf sphinx-2.0.4-release.tar.gz
$ cd sphinx-2.0.4-release/
$ ./configure --prefix=/usr/local/sphinx
$ sudo make install
```

You may be required to install the following dependencies to successfully compile Sphinx.

```bash
$ sudo apt-get install build-essential libmysql++-dev
```

## Setup

Once you have successfully compiled and installed Sphinx, you now need to configure the installation.
For this demonstration, we will use the test data/configuration provided with the distribution.

```bash
$ cd /usr/local/sphinx/etc/
$ sudo cp sphinx.conf.dist sphinx.conf
$ vim sphinx.conf # alter the username, password and db
$ mysql -u root -p test < /usr/local/sphinx/etc/example.sql
$ sudo indexer --all
$ search test # returns a few record matches
$ sudo searchd # begins the search daemon
```

## SphinxSE

Now that we have a fully functioning Sphinx setup along with a sample dataset, it is time to set up MySQL and Sphinx's special table engine.
There are two avenues that can be taken to achieve this, the first is compiling the MySQL server from source along with the Sphinx engine and installing the resulting compilation.
Alternatively, we can compile the Sphinx engine with the MySQL server version we have and then copy the required files to the current MySQL server setup.
I will be doing the latter in this article.

```bash
$ wget http://downloads.mysql.com/archives/mysql-5.1/mysql-5.1.58.tar.gz
$ tar -zxf mysql-5.1.58.tar.gz
$ cp -R sphinx-2.0.4-release/mysqlse/mysql-5.1.58/storage/sphinx
$ cd mysql-5.1.58/
$ sh BUILD/autorun.sh;
$ ./configure
$ make
# copy and install the new engine into our installation
$ cp storage/sphinx/.libs/ha_sphinx.* /usr/lib/mysql/plugin/
$ mysql -u root -p
$ mysql> INSTALL PLUGIN sphinx SONAME 'ha_sphinx.so';
```

You may be required to install the following dependencies to successfully compile MySQL with the Sphinx engine.

```bash
$ sudo apt-get install autotools-dev automake libtool ncurses-dev
```

## Usage

Now that you have successfully compiled and installed Sphinx and SphinxSE, all that is required is to create a special table to interface with the search daemon.

```sql
/* create the special table */
CREATE TABLE t1
(
  id INT UNSIGNED NOT NULL,
  weight INT NOT NULL,
  query VARCHAR(3072) NOT NULL,
  group_id INT,
  INDEX(query)
) ENGINE=SPHINX CONNECTION="sphinx://localhost:9312/test";

/* sample query that uses searchd */
SELECT * FROM t1 WHERE query='test;mode=any';
```

## Resources

- [Sphinx: Offical Site](http://sphinxsearch.com/)
- [Better MySQL searches with Sphinx](http://www.ibm.com/developerworks/opensource/library/os-sphinx/)
- [Sphinx & MySQL: facts and misconceptions](http://code.openark.org/blog/mysql/sphinx-mysql-facts-and-misconception)

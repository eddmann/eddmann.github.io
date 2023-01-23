---
layout: post
title: 'Managing Jenkins Project Builds and Configuration using PHP'
canonical: https://tech.mybuilder.com/managing-jenkins-project-builds-and-configuration-using-php/
meta: 'Using PHP to manage Jenkins Project Builds and Configuration via the command-line'
---

Throughout project development we use Jenkins to provide meaningful test feedback on each Git push event.
These builds are required for a sufficient amount of confidence to be gained for merging into _master_ and subsequently deployment.
Each member of the team has their own project which they manage with the current project/branch they are working on.
However, typically we find ourselves working on multiple branches throughout the day, and it can become cumbersome to update the projects configuration.

<!--more-->

I decided to create a simple PHP console script that can be run (or added as a git-hook) to maintain synchronization between the branch you are working on and the branch Jenkins is building.
Whilst developing this script, it dawned on me that many other automated use-cases could be achieved with the ability to easily update a projects configuration file.
Due to this I have provided the full script in question at the end of the post, but wish to discuss important areas in more detail throughout.

## Reading the Projects Configuration

Jenkins fortunately provides us with a RESTful interface to manage typical tasks and activities.
Included in this is the ability to read the XML configuration file for a specified project.
In this use-case we are only concerned with accessing the currently configured Git branch name.

```php?start_inline=1
$curl = curl_init(url('config.xml'));

curl_setopt_array($curl, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => false,
    CURLOPT_FOLLOWLOCATION => true,
));

$config = new SimpleXMLElement(curl_exec($curl));

$jobBranch = (string) $config->scm->branches->{'hudson.plugins.git.BranchSpec'}->name;
```

## Writing to the Projects Configuration

Now that we have access to the current projects configuration XML, we can update the specified branch as desired.
To achieve this we are required to POST the updated configuration file back to the API, as shown below.

```php?start_inline=1
$config->scm->branches->{'hudson.plugins.git.BranchSpec'}->name = $localBranch;

$fh = fopen('php://memory', 'rw');
fwrite($fh, $xml = $config->asXML());
rewind($fh);

curl_setopt_array($curl, array(
    CURLOPT_HTTPHEADER => array('Content-type: application/xml'),
    CURLOPT_INFILE => $fh,
    CURLOPT_INFILESIZE => strlen($xml),
    CURLOPT_UPLOAD => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
));

curl_exec($curl);
```

## Sending a Project Build Request

With the updated branch configuration now in-place, we can send Jenkins a request to start a new build of the project.
This can be simply achieved by updating the current cURL instance and making a POST request to the build API endpoint.

```php?start_inline=1
curl_setopt_array($curl, array(
    CURLOPT_URL => url('build'),
    CURLOPT_CUSTOMREQUEST => 'POST',
));

curl_exec($curl);
```

## The Full Script

Using these examples we are now able to combine them, solving the use-case laid out at the start of the post.
Accessing a specified projects configuration file, we check to see if the branch is the same as the one we are locally using.
If this is not the case we update the configuration XML and then ask the user if they wish to trigger a build of the project.

```php
#!/usr/bin/php
<?php

/*
.bash_profile
export JENKINS_AUTH="username:secretkey"
export JENKINS_JOB="Jenkins-Project"
export JENKINS_URL="jenkins.example.com"
*/

function url($path)
{
    return sprintf(
        'http://%s@%s/job/%s/%s',
        getenv('JENKINS_AUTH'), getenv('JENKINS_URL'), getenv('JENKINS_JOB'), $path
    );
}

// read branch

$curl = curl_init(url('config.xml'));

curl_setopt_array($curl, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => false,
    CURLOPT_FOLLOWLOCATION => true,
));

$config = new SimpleXMLElement(curl_exec($curl));

$localBranch = trim(shell_exec('git rev-parse --abbrev-ref HEAD'));
$jobBranch = (string) $config->scm->branches->{'hudson.plugins.git.BranchSpec'}->name;

if ($localBranch === $jobBranch) {
    echo $localBranch, "\n";
    goto build;
}

// rename branch

$config->scm->branches->{'hudson.plugins.git.BranchSpec'}->name = $localBranch;

$fh = fopen('php://memory', 'rw');
fwrite($fh, $xml = $config->asXML());
rewind($fh);

curl_setopt_array($curl, array(
    CURLOPT_HTTPHEADER => array('Content-type: application/xml'),
    CURLOPT_INFILE => $fh,
    CURLOPT_INFILESIZE => strlen($xml),
    CURLOPT_UPLOAD => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
));

curl_exec($curl);
echo "$jobBranch -> $localBranch\n";

// GOTO: eeeeewwwwww......
build:

echo "Would you like to perform a build? (y/[n]) ";

if (trim(fgets(STDIN)) === 'y') {
    curl_setopt_array($curl, array(
        CURLOPT_URL => url('build'),
        CURLOPT_CUSTOMREQUEST => 'POST',
    ));

    curl_exec($curl);
    echo "Sent build request\n";
}

curl_close($curl);
```

An interesting point to highlight in-regard to the full version is the use of defined environment variables to access the current Jenkins setup.
This is useful as it allows you to publish the script without any requirement to amend it, along with the ability to override configuration on a per-execution basis.
Finally, the comical use of the 'goto' statement to change execution flow based on if the configuration file is required to be modified or not.
This should obviously not be used in production code but within a small script such as this it has its uses.

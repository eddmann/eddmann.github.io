---
title: 'Containerising the DataDog Agent for HTTP health-checks using DigitalOcean App Platform and Terraform'
link: https://tech.mybuilder.com/containerising-the-datadog-agent-for-http-health-checks-using-digitalocean-app-platform-and-terraform/
meta: 'Documents my experience containerising the DataDog Agent for HTTP health-checks using DigitalOcean App Platform and Terraform'
---

We have been a big fan of DataDog and the level of telemetry/monitoring it provides us for many years now.
One such aspect of monitoring that we employ throughout the services we maintain are [HTTP health checks](https://docs.datadoghq.com/integrations/http_check/), which are intentionally run on a separate cloud provider to our primary which is AWS.
DataDog has supplied the ability to handle running these checks via [their agent](https://docs.datadoghq.com/agent/) for many years, providing us with a sufficient blackbox means of ensuring a service is functioning as expected.
This past week we explored the viability of containerising this responsibility into a service which could be run on a Serverless platform such as the [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform).

<!--more-->

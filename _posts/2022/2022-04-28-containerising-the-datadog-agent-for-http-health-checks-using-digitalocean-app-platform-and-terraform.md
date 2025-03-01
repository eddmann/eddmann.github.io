---
layout: post
title: 'Containerising the DataDog Agent for HTTP health-checks using DigitalOcean App Platform and Terraform'
canonical: https://tech.mybuilder.com/containerising-the-datadog-agent-for-http-health-checks-using-digitalocean-app-platform-and-terraform/
meta: 'Documents my experience containerising the DataDog Agent for HTTP health-checks using DigitalOcean App Platform and Terraform'
---

We have been a big fan of DataDog and the level of telemetry/monitoring it provides us for many years now.
One such aspect of monitoring that we employ throughout the services we maintain are [HTTP health checks](https://docs.datadoghq.com/integrations/http_check/), which are intentionally run on a separate cloud provider to our primary which is AWS.
DataDog has supplied the ability to handle running these checks via [their agent](https://docs.datadoghq.com/agent/) for many years, providing us with a sufficient blackbox means of ensuring a service is functioning as expected.
This past week we explored the viability of containerising this responsibility into a service which could be run on a Serverless platform such as the [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform).

<!--more-->

## How it was...

In the past we have been running the DataDog Agent which powers the HTTP check integration on a separate cloud provider's virtual private server (VPS).
This was provisioned using Puppet, and we were responsible for handling all server concerns (patching, upgrades etc.).
This worked well at the time as the instance was also responsible for several other infrastructural tasks.
However, these responsibilities have slowly been delegated to other means and as such the idea of hosting a full VPS for just handing HTTP checks was not ideal.

Over the past year or so we have explored using [DataDog Synthetic Monitoring](https://docs.datadoghq.com/synthetics/), which provides a means of not only evaluating HTTP checks, but also includes in-depth performance analysis and browser recording capabilities.
These additional features (combined with the Terraform support) are extremely powerful, with us having good success porting several key endpoint request checks over to this product.
Unfortunately this additional functionality comes with an increased price-tag, and we do not see an increase in monitoring confidence with moving all our current checks over to this product.
As such, we decided that it would be ideal if we could keep the same HTTP health checks in-place, but be able to manage this service at a higher-level of compute (Serverless 😎).

## Containerising the DataDog Agent

With this in-mind we looked into the viability of containerising the DataDog Agent itself.
Fortunately, there are many use-cases of carrying out such a task using [Docker](https://docs.datadoghq.com/agent/docker/) and container orchestration platforms such as [Kubernetes](https://docs.datadoghq.com/agent/kubernetes/)/[ECS](https://docs.datadoghq.com/agent/amazon_ecs/).
Our end-goal however was a little different to the norm, as we wished to only ship and run the agent as a standalone service, not provide a means for other ancillary containers to relay data back to DataDog.
With a little help from the DataDog documentation, we were able to assemble a `Dockerfile` which enabled only the desired built-in HTTP check integration like so.

```dockerfile
FROM datadog/agent:7

ENV DD_HOSTNAME "httpcheck"
ENV DD_USE_DOGSTATSD "false"
ENV DD_PROCESS_AGENT_ENABLED "false"
ENV DD_APM_ENABLED "false"
ENV DD_LOGS_ENABLED "false"
ENV DD_ENABLE_METADATA_COLLECTION "false"

RUN rm -rf /etc/datadog-agent/conf.d
ADD http_check.yaml /etc/datadog-agent/conf.d/http_check.d/conf.yaml
```

An example definition of what can be found in the `http_check.yaml` file is presented below.

```yaml
init_config:

instances:
  - name: Homepage
    url: https://www.mybuilder.com
    http_response_status_code: 200
    content_match: 'Hire an exceptional tradesperson'
    tls_verify: true
```

Upon experimentation with the built image we noticed that by-default the hostname is discerned from the running container instance id.
To keep a stable instance hostname within DataDog we opted to override the `DD_HOSTNAME` environment variable.

## Deploying the service

Now that we had built the service into a self-managed container, we investigated the platforms available to deploy and run it.
There are many platforms available which offer such a means, from [AWS Fargate](https://aws.amazon.com/fargate/) to [Google Cloud Run](https://cloud.google.com/run).
Upon review, we opted for [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/), which provided a cost-effective means ($5 a month!) of spinning up and running a container.

Not only is App Platform cost-efficient, it provided egress network access (a requirement for such a service as ours) and the ability to seamlessly integrate the deployment process into a GitHub repository pipeline.
This allows us to simply push changes to the service repository within GitHub and let DigitalOcean handle building and deploying the new image.

We are big proponents of Infrastructure as Code (IaC) at MyBuilder, and another selling point to us was the ability to define the App Platform service within Terraform.
Coupled with DataDog we were able to combine the two third-party providers into our desired configuration like so.

```hcl
resource "digitalocean_app" "datadog_http_check" {
  spec {
    name   = "datadog-http-check"
    region = "lon"

    worker {
      name               = "datadog-http-check"
      source_dir         = "/"
      dockerfile_path    = "Dockerfile"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = "mybuilder/datadog-http-check"
        branch         = "main"
        deploy_on_push = true
      }

      env {
        key   = "DD_API_KEY"
        value = datadog_api_key.datadog_http_check.key
        scope = "RUN_TIME"
        type  = "SECRET"
      }
    }
  }
}

resource "datadog_api_key" "datadog_http_check" {
  name = "datadog-http-check"
}
```

Finally, we were able to provision a DataDog monitor which handled alerting us to any unexpected change found by the newly created HTTP check service.

{% raw %}

```hcl
resource "datadog_monitor" "datadog_http_check" {
  type = "service check"
  name = "HTTP checks"

  query = "\"http.can_connect\".over(\"*\").by(\"url\").last(4).count_by_status()"

  message = <<-EOM
    {{#is_alert}}
    We are having issues connecting to {{url.name}}. {{check_message}}
    {{/is_alert}}

    {{#is_recovery}}
    We are now able to connect to {{url.name}}. {{check_message}}
    {{/is_recovery}}
  EOM

  monitor_thresholds {
    critical = 3
    warning  = 1
    ok       = 1
  }
}
```

{% endraw %}

### One small gotcha...

One additional change we were required to make to the built image for use with DigitalOcean App Platform was the inclusion of an overridden `/proc/cpuinfo` file.
Upon investigation, it seems as though the `/proc/cpuinfo` output provided by the DigitalOcean host machine includes an `unknown` value for the CPU `stepping` attribute.
This is expected to be an integer within the [Go package](https://github.com/DataDog/gopsutil/blob/dd/cpu/cpu_linux.go#L150) used by the DataDog Agent, and as such, causes the Agent to [critically restart](https://github.com/DataDog/datadog-agent/blob/main/cmd/process-agent/main_common.go#L332) upon initialisation.
Fortunately, the package does provide a means of supplying an [overridden host](https://github.com/DataDog/gopsutil#usage) `/proc` directory in which we were able to stub out this _stepping_ attribute to ensure the agent initialises correctly.

## Conclusion

To conclude we are very happy with the ease in which we have been able to abstract this service to a higher-level of compute, removing the concerns of having to manage the underlying host machine in the process.
Now only maintaining ownership of a Docker image, means that we can trivially move this service to another cloud provider platform in the future if we so wish.

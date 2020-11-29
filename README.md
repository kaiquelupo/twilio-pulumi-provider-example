# Twilio Dynamic Provider for Pulumi: Example of Implementation

This repository presents an example on how to use the [twilio-pulumi-provider package](https://www.npmjs.com/package/twilio-pulumi-provider) to describe as code your Twilio Project and use it in a CI/CD pipeline (this last part is not required). Also, by following this approach, handling different environments in Twilio (staging, production etc) becomes quite simple. 

For more info about concepts and technical decisions, please refer to the [package repo](https://github.com/kaiquelupo/twilio-pulumi-provider). 

## Twilio

Twilio powers the future of business communications. Enabling phones, VoIP, and messaging to be embedded into web, desktop, and mobile software. Millions of developers around the world have used Twilio to unlock the magic of communications to improve any human experience. For more information, please refer to this [link](https://www.twilio.com/).

## Pulumi

Pulumi is an open source infrastructure as code tool for creating, deploying, and managing cloud infrastructure. Pulumi works with traditional infrastructure like VMs, networks, and databases, in addition to modern architectures, including containers, Kubernetes clusters, and serverless functions.

Pulumi uses real languages for infrastructure as code, which means many benefits: IDEs, abstractions including functions, classes, and packages, existing debugging and testing tools, and more. The result is greater productivity with far less copy and paste, and it works the same way no matter which cloud you're targeting.

For more information, please refer to this [link](https://www.pulumi.com/docs/intro/concepts/)

### Pulumi CLI

First, you need to install the Pulumi CLI in your system. This CLI will be needed to test your code. Please refer to this [link](https://www.pulumi.com/docs/reference/cli/). 

After installing the CLI, you need to login using `pulumi login`. By default, this will log in to the managed Pulumi service backend. If you prefer to log in to a self-hosted Pulumi service backend, specify a URL. For more information, please refer to this [link](https://www.pulumi.com/docs/reference/cli/pulumi_login/).  Also, check the `State and Backends` section to understand how states are handled.

### Stack

Every Pulumi program is deployed to a stack. A stack is an isolated, independently configurable instance of a Pulumi program. Stacks are commonly used to denote different phases of development (such as development, staging and production) or feature branches (such as feature-x-dev, jane-feature-x-dev). For more information, please refer to this [link](https://www.pulumi.com/docs/intro/concepts/stack/).

In our project, we are considering that each git branch is a stack. For more information, please refer to this [link](https://www.pulumi.com/docs/intro/concepts/organizing-stacks-projects/).

### Configuration and Secrets

As we are considering that each branch is a stack, we can handle the environment variables as such following this [documentation](https://www.pulumi.com/docs/intro/concepts/stack/). However, in my opinion, secrets such as API Keys are not yet handle in a good way by Pulumi. Therefore, we are sending API Keys using `.env` file in development environment and GitHub Secrets (or similar feature) in our CI/CD environment. Check the section `How to Use` for more information.

### State and Backends

Pulumi stores its own copy of the current state of your infrastructure. This is often simply called state, and is stored in transactional snapshots we call checkpoints. A checkpoint is recorded by Pulumi at various points so that it can operate reliably — whether that means diffing goal state versus current state during an update, recovering from failure, or destroying resources accurately to clean up afterwards. Because state is critical to how Pulumi operates, we’ll cover a few of the state backend options on this page.

Pulumi supports multiple backends for storing your infrastructure state:

- The Pulumi Service backend
- A self-managed backend, either stored locally on your filesystem or remotely using a cloud storage service

For more information, check this [link](https://www.pulumi.com/docs/intro/concepts/state/).

### Dynamic Provider

There are different ways of creating providers inside Pulumi but for this project we choose to implement it as Dynamic Provider. This way is quite simple and quick to implement the Twilio Provider because you can use Node.js and integrate with the official Twilio Node.js SDK. For more information, please refer to this [link](https://www.pulumi.com/blog/dynamic-providers/). 

**Note**: it is probably better to implement a actual provider in the long term but to this repository goal, the dynamic provider is enough. Let me know about your thoughts on that! :D 

## How to Use

Before starting make sure you login with your Pulumi CLI. 

1. Create you Pulumi project file by copying the example (`cp Pulumi.example.yaml Pulumi.yaml`) and setting `name`, `runtime` (keep as it is) and `description`.

2. For development environment, you should copy the .dev.env.example (`cp .dev.env.example .dev.env`) and fill out the variables: 

* `FLEX_WORKSPACE_SID`: This is the SID of the "Flex Task Assignment" TaskRouter Workspace in your Flex project
* `BRANCH_NAME`: This is the name you want to give to the Pulumi stack (e.g. `dev`)

3. Create two files called `.<BRANCH_NAME>.env` in  `serverless/autopilot` and `serverless/main`, where `BRACH_NAME` is the value of the variable set above. These files holds configuration for autoppilot and serverless. For this example you can leave them blank. 

4. You can now run the package scripts without the `ci:` in the beginning of their names. For example: 

- **deploy-resources**: deploy all resources to your dev project
- **preview-resources**: preview all changes to your dev project
- **watch-resources**: this sends all changes to your dev project on the fly (as soon as the changes are saved in the file). It is similar to a `hot reload` feature and in my opinion it is **an amazing feature for developing and testing without using the console at all!**
If you want to test different branches locally, you can change the environment variables for each branch. Remember, the idea is that each branch/stack is a different Twilio Project (but you can change this abstraction depending on your use case). 

3. For CI/CD environments, you need to add same environment variables to your secrets in your system. In the case of `GitHub Actions`, you can use `Secrets` as described [here](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets). The mapping is as following:

- PULUMI_ACCESS_TOKEN
- TWILIO_<BRANCH_NAME>_ACCOUNT_SID
- TWILIO_<BRANCH_NAME>_AUTH_TOKEN

**Remember:** if you deploy this repository, it may incur cost from Twilio side.    

## CI/CD with Pulumi

For this project, we are going to use `Github Actions` with Pulumi as described [here](https://www.pulumi.com/docs/guides/continuous-delivery/github-actions/). If you want to implmenet it with other CI/CD environment, please refer to this [link](https://www.pulumi.com/docs/guides/continuous-delivery/).

In this project, you can check how to configure it by checking workflow files inside `.github/workflows`.
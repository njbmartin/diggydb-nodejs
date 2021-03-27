# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.140.1/containers/typescript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version: 14, 12, 10
ARG VARIANT="14-buster"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:${VARIANT}

# Install Pulumi and move it
RUN curl -fsSL https://get.pulumi.com | sh && mv ~/.pulumi/bin/* /usr/bin
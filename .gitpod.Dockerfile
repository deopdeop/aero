FROM gitpod/workspace-full

USER gitpod

# Install Crystal
RUN curl -sSL https://dist.crystal-lang.org/apt/setup.sh | sudo bash

RUN sudo apt-get update \
    && sudo apt-get install -yq crystal
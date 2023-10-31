FROM mcr.microsoft.com/vscode/devcontainers/java:11

# Set up nodesource, install node, yarn, fontconfig for static viz, rlwrap for dev ergonomics
RUN apt update
RUN apt install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
RUN apt update
RUN apt install -y nodejs
# RUN ( curl -fsSL https://deb.nodesource.com/setup_14.x | bash ) \
#   && export DEBIAN_FRONTEND=noninteractive \
#   && apt-key adv --refresh-keys --keyserver keyserver.ubuntu.com \
#   && apt-get update && apt-get -y install --no-install-recommends nodejs yarn rlwrap fontconfig

# install Clojure
RUN curl https://download.clojure.org/install/linux-install-1.11.0.1100.sh | bash

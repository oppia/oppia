FROM python:3.8

WORKDIR /app/oppia

# installing the pre-requisites libs and dependencies
RUN apt-get update -y && apt-get upgrade -y \
    curl \
    git \
    python3-dev \
    python3-setuptools \
    python3-pip \
    unzip \
    python3-yaml \
    python3-matplotlib \
    chromium
RUN pip install --upgrade pip==21.2.3

RUN pip install pip-tools==6.6.2 setuptools==58.5.3

# installing python dependencies from the requirements.txt file
COPY requirements.in .
COPY requirements.txt .
COPY requirements_dev.in .
COPY requirements_dev.txt .

RUN pip-compile --generate-hashes requirements.in
RUN pip-compile --generate-hashes requirements_dev.in
RUN pip install cmake
# TODO: not installing pyarrow for now as facing problem while installing in my M1: refer - https://github.com/streamlit/streamlit/issues/2774
RUN pip install --require-hashes --no-deps -r requirements.txt
RUN pip install --require-hashes --no-deps -r requirements_dev.txt

## installing packages from the package.json file
COPY package.json .
COPY scripts/linters/custom_eslint_checks ./scripts/linters/custom_eslint_checks
RUN apt-get -y install npm

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs


RUN npm install -g yarn
RUN yarn install

COPY . .

# RUN python3 -m scripts.install_third_party
# COPY . .

EXPOSE 8181
# CMD ["node", "./node_modules/webpack/bin/webpack.js", "--config", "webpack.dev.config.ts", "--watch"]
# CMD ["./node_modules/.bin/ng", "build", "--watch"]



# TODO: tasks for the day: 2) install the packages from the dependencies.json! 3) connect with google cloud sdk, and launch app.

## NOTE:
## I am using Google App Engine to serve our app in to the browser (by serving the built webpack bundles) using
## the `app_dev.yaml` file. For the prototype to work, I am using the already installed `Google Cloud SDK- 364.0.0`
## from the /oppia-tools directory (copied to our root directory). This is a temporary solution,
## and I will be using the official docker image for the google cloud SDK while working in the GSoC project
## [link for the verified Google Cloud SDK image](https://hub.docker.com/r/google/cloud-sdk).
# CMD [ "./oppia_tools/google-cloud-sdk-364.0.0/google-cloud-sdk/bin/dev_appserver.py", "app_dev.yaml", "--runtime", "python38", "--host", "0.0.0.0"]
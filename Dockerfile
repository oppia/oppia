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
# TODO: not installing pyarrow for now as facing problem while installing in my mac M1: refer - https://github.com/streamlit/streamlit/issues/2774
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

# installing third party dependencies
COPY scripts ./scripts
COPY /core ./core
COPY /assets ./assets
COPY dependencies.json .
RUN python -m scripts.install_third_party

RUN python -m scripts.build

COPY . .

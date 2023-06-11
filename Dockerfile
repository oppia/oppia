# added platform flag here because -- https://stackoverflow.com/questions/71040681/qemu-x86-64-could-not-open-lib64-ld-linux-x86-64-so-2-no-such-file-or-direc
FROM --platform=linux/amd64 python:3.8

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
# COPY requirements.in .
# COPY requirements.txt .
COPY requirements_dev.in .
COPY requirements_dev.txt .

# RUN pip-compile --generate-hashes requirements.in
RUN pip-compile --generate-hashes requirements_dev.in
RUN pip install cmake
# TODO: not installing pyarrow for now as facing problem while installing in my mac M1: refer - https://github.com/streamlit/streamlit/issues/2774
# RUN pip install --require-hashes --no-deps -r requirements.txt
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

# installing buf and proto for Linux -- this docker container is based on Linux
ENV BUF_LINUX_FILES="buf-Linux-x86_64 protoc-gen-buf-check-lint-Linux-x86_64 protoc-gen-buf-check-breaking-Linux-x86_64" \
    PROTOC_LINUX_FILE='protoc-3.13.0-linux-x86_64.zip' \
    BUF_DIR='/app/buf-0.29.0' \
    PROTOC_DIR='/app/buf-0.29.0/protoc' \
    BUF_BASE_URL='https://github.com/bufbuild/buf/releases/download/v0.29.0/' \
    PROTOC_URL='https://github.com/protocolbuffers/protobuf/releases/download/v3.13.0'

# Download BUF_LINUX_FILES and PROTOC_LINUX_FILE
# set the shell as /bin/bash explicitly. This is required to make use of the array syntax correctly
SHELL ["/bin/bash", "-c"]
RUN IFS=' ' read -ra BUF_FILES <<< "$BUF_LINUX_FILES"; \
    for bin_file in "${BUF_FILES[@]}"; do \
        wget -P $BUF_DIR $BUF_BASE_URL/$bin_file; \
    done

RUN wget -P $BUF_DIR $PROTOC_URL/$PROTOC_LINUX_FILE
RUN unzip $BUF_DIR/$PROTOC_LINUX_FILE -d $PROTOC_DIR \
    && rm $BUF_DIR/$PROTOC_LINUX_FILE

RUN chmod -R 744 $BUF_DIR \
    && chmod -R 744 $PROTOC_DIR

RUN yarn add -D global grpc-tools ts-protoc-gen
# compiling the protobuf files
ENV PROTOC_FILES_PATH='/app/oppia/third_party/oppia-ml-proto-0.0.0'
    # PATH=':/app/buf-0.29.0/protoc/bin:/app/oppia/node_modules/protoc-gen-ts'

COPY buf.gen.yaml .
COPY /extensions/classifiers/proto/ ./extensions/classifiers/proto/
RUN mkdir /app/oppia/proto_files
# RUN /app/buf-0.29.0/buf-Linux-x86_64 generate $PROTOC_FILES_PATH
# RUN /app/buf-0.29.0/protoc/bin/protoc --plugin=protoc-gen-ts=/app/oppia/node_modules/.bin/protoc-gen-ts --ts_out=/output $PROTOC_FILES_PATH/*.proto --proto_path=$PROTOC_FILES_PATH
RUN /app/buf-0.29.0/protoc/bin/protoc \
    --plugin=protoc-gen-ts=/app/oppia/node_modules/.bin/protoc-gen-ts \
    --ts_out=/app/oppia/extensions/classifiers/proto/ \
    --js_out=import_style=commonjs,binary:/app/oppia/extensions/classifiers/proto/ \
    --python_out=/app/oppia/proto_files \
    --proto_path=$PROTOC_FILES_PATH \
    $PROTOC_FILES_PATH/*.proto

# RUN for file in /app/oppia/proto_files/*.py; do \
#     if [ -f "$file" ] && [ "${file##*.}" = "py" ]; then \
#         sed -i -r 's/^import (\w*_pb2 as)/from proto_files import \1/g' "$file"; \
#     fi; \
# done

# COPY setup.py .
# COPY requirements.in .
# COPY requirements.txt .
# RUN python setup.py -q sdist -d build

COPY . .

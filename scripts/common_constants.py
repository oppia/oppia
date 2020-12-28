# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Common constants used in Python scripts."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import platform
import sys


AFFIRMATIVE_CONFIRMATIONS = ['y', 'ye', 'yes']

CURRENT_PYTHON_BIN = sys.executable

# Versions of libraries used in devflow.
COVERAGE_VERSION = '5.3'
ESPRIMA_VERSION = '4.0.1'
ISORT_VERSION = '4.3.21'
PYCODESTYLE_VERSION = '2.6.0'
PSUTIL_VERSION = '5.7.3'
PYLINT_VERSION = '1.9.5'
PYLINT_QUOTES_VERSION = '0.1.8'
PYGITHUB_VERSION = '1.45'
WEBTEST_VERSION = '2.0.35'
PIP_TOOLS_VERSION = '5.4.0'
GRPCIO_VERSION = '1.0.0'
ENUM_VERSION = '1.1.10'
PROTOBUF_VERSION = '3.13.0'
SETUPTOOLS_VERSION = '36.6.0'

# Node version.
NODE_VERSION = '14.15.0'

# NB: Please ensure that the version is consistent with the version in .yarnrc.
YARN_VERSION = '1.22.10'

# Versions of libraries used in backend.
PILLOW_VERSION = '6.2.2'

# Buf version.
BUF_VERSION = '0.29.0'
# Protoc is the compiler for protobuf files and the version must be same as
# the version of protobuf library being used.
PROTOC_VERSION = PROTOBUF_VERSION

# We use redis 6.0.5 instead of the latest stable build of redis (6.0.6) because
# there is a `make test` bug in redis 6.0.6 where the solution has not been
# released. This is explained in this issue:
# https://github.com/redis/redis/issues/7540.
# IMPORTANT STEPS FOR DEVELOPERS TO UPGRADE REDIS:
# 1. Download the new version of the redis cli.
# 2. Extract the cli in the folder that it was downloaded, most likely
#    Downloads/.
# 3. Change directories into the folder you extracted, titled
#    redis-<new version>/ and change into that directory:
#    cd redis-<new version>/
# 4. From the top level of the redis-<new version> directory,
#    run `make test`.
# 5. All of the tests should pass with an [ok] status with no error codes. The
#    final output should be 'All tests pass'.
# 6. Be sure to leave a note in the PR description to confirm that you have read
#    this message, and that all of the `make test` tests pass before you commit
#    the upgrade to develop.
# 7. If any tests fail, DO NOT upgrade to this newer version of the redis cli.
REDIS_CLI_VERSION = '6.0.5'

RELEASE_BRANCH_NAME_PREFIX = 'release-'
CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')
OPPIA_TOOLS_DIR_ABS_PATH = os.path.abspath(OPPIA_TOOLS_DIR)
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR = os.path.join(THIRD_PARTY_DIR, 'python_libs')
GOOGLE_CLOUD_SDK_HOME = os.path.join(
    OPPIA_TOOLS_DIR_ABS_PATH, 'google-cloud-sdk-304.0.0', 'google-cloud-sdk')
GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    GOOGLE_CLOUD_SDK_HOME, 'platform', 'google_appengine')
GOOGLE_CLOUD_SDK_BIN = os.path.join(GOOGLE_CLOUD_SDK_HOME, 'bin')
GCLOUD_PATH = os.path.join(GOOGLE_CLOUD_SDK_BIN, 'gcloud')
NODE_PATH = os.path.join(OPPIA_TOOLS_DIR, 'node-%s' % NODE_VERSION)
PYLINT_PATH = os.path.join(OPPIA_TOOLS_DIR, 'pylint-%s' % PYLINT_VERSION)
PYCODESTYLE_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'pycodestyle-%s' % PYCODESTYLE_VERSION)
PYLINT_QUOTES_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'pylint-quotes-%s' % PYLINT_QUOTES_VERSION)
NODE_MODULES_PATH = os.path.join(CURR_DIR, 'node_modules')
FRONTEND_DIR = os.path.join(CURR_DIR, 'core', 'templates')
YARN_PATH = os.path.join(OPPIA_TOOLS_DIR, 'yarn-%s' % YARN_VERSION)
OS_NAME = platform.system()
ARCHITECTURE = platform.machine()
PSUTIL_DIR = os.path.join(OPPIA_TOOLS_DIR, 'psutil-%s' % PSUTIL_VERSION)
REDIS_SERVER_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'redis-cli-%s' % REDIS_CLI_VERSION,
    'src', 'redis-server')
REDIS_CLI_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'redis-cli-%s' % REDIS_CLI_VERSION,
    'src', 'redis-cli')

RELEASE_BRANCH_REGEX = r'release-(\d+\.\d+\.\d+)$'
RELEASE_MAINTENANCE_BRANCH_REGEX = r'release-maintenance-(\d+\.\d+\.\d+)$'
HOTFIX_BRANCH_REGEX = r'release-(\d+\.\d+\.\d+)-hotfix-[1-9]+$'
TEST_BRANCH_REGEX = r'test-[A-Za-z0-9-]*$'
USER_PREFERENCES = {'open_new_tab_in_browser': None}

FECONF_PATH = os.path.join('feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets', 'constants.ts')
MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS = 1000
REDIS_CONF_PATH = os.path.join('redis.conf')
# Path for the dump file the redis server autogenerates. It contains data
# used by the Redis server.
REDIS_DUMP_PATH = os.path.join(CURR_DIR, 'dump.rdb')
# The requirements.txt file is auto-generated and contains a deterministic list
# of all libraries and versions that should exist in the
# 'third_party/python_libs' directory.
# NOTE: Developers should NOT modify this file.
COMPILED_REQUIREMENTS_FILE_PATH = os.path.join(CURR_DIR, 'requirements.txt')
# The precompiled requirements file is the one that developers should be
# modifying. It is the file that we use to recompile the
# "requirements.txt" file so that all installations using "requirements.txt"
# will be identical.
REQUIREMENTS_FILE_PATH = os.path.join(CURR_DIR, 'requirements.in')

NODE_BIN_PATH = os.path.join(NODE_PATH, 'bin', 'node')
NODE_BIN_PATH_WINDOWS = os.path.join(NODE_PATH, '', 'node')

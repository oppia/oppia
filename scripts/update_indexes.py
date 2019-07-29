# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Helper script used for updating indexes.

ONLY RELEASE COORDINATORS SHOULD USE THIS SCRIPT.

Make sure to run this script from the oppia/ root folder:
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import argparse
import os
import sys

import common  # pylint: disable=relative-import
import gcloud_adapter  # pylint: disable=relative-import

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--app_name', help='name of the app whose indexes should be updated',
    type=str)

PARSED_ARGS = _PARSER.parse_args()
if PARSED_ARGS.app_name:
    APP_NAME = PARSED_ARGS.app_name
else:
    raise Exception('No app name specified.')

INDEX_YAML_PATH = os.path.join('.', 'index.yaml')


def _update_indexes():
    """Updates production indexes after doing the prerequisite checks."""

    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    gcloud_adapter.require_gcloud_to_be_available()
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'Indexes should only be updated from a release branch.')

    # Update the indexes.
    gcloud_adapter.update_indexes(INDEX_YAML_PATH, APP_NAME)


if __name__ == '__main__':
    _update_indexes()

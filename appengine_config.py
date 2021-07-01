# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Configuration for App Engine."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

import python_utils

from google.appengine.ext import vendor
import pkg_resources

from typing import Any, Text # isort:skip # pylint: disable=unused-import

# Root path of the app.
ROOT_PATH = os.path.dirname(__file__)
THIRD_PARTY_PATH = os.path.join(ROOT_PATH, 'third_party')
_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
OPPIA_TOOLS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools')
THIRD_PARTY_PYTHON_LIBS_PATH = os.path.join(THIRD_PARTY_PATH, 'python_libs')


# oppia_tools/ is available locally (in both dev and prod mode). However,
# on the GAE production server, oppia_tools/ is not available, and the default
# PIL third-party library is used instead.
#
# We cannot special-case this using DEV_MODE because it is possible to run
# Oppia in production mode locally, where a built-in PIL won't be available.
# Hence the check for oppia_tools instead.
if os.path.isdir(OPPIA_TOOLS_PATH):
    PIL_PATH = os.path.join(OPPIA_TOOLS_PATH, 'Pillow-6.2.2')
    if not os.path.isdir(PIL_PATH):
        raise Exception('Invalid path for oppia_tools library: %s' % PIL_PATH)
    sys.path.insert(0, PIL_PATH) # type: ignore[arg-type]


# Google App Engine (GAE) uses its own virtual environment that sets up the
# python library system path using their third party python library, vendor. In
# order to inform GAE of the packages that are required for Oppia, we need to
# add it using the vendor library. More information can be found here:
# https://cloud.google.com/appengine/docs/standard/python/tools/using-libraries-python-27
vendor.add(THIRD_PARTY_PYTHON_LIBS_PATH)
pkg_resources.working_set.add_entry(THIRD_PARTY_PYTHON_LIBS_PATH)

# It is necessary to reload the six module because of a bug in the google cloud
# ndb imports. More details can be found here:
# https://github.com/googleapis/python-ndb/issues/249.
# We need to reload at the very end of this file because we have to add the
# six python path to the app engine vendor first.
import six # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
reload(six) # pylint: disable=reload-builtin


# For some reason, pkg_resources.get_distribution returns an empty list in the
# prod env. We need to monkeypatch this function so that prod deployments
# work. Otherwise, pkg_resources.get_distribution('google-api-core').version in
# google/api_core/__init__.py throws a DistributionNotFound error, and
# similarly for pkg_resources.get_distribution('google-cloud-tasks').version in
# google/cloud/tasks_v2/gapic/cloud_tasks_client.py, which results in the
# entire application being broken on production.
import requests_toolbelt.adapters.appengine # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
requests_toolbelt.adapters.appengine.monkeypatch()
old_get_distribution = pkg_resources.get_distribution # pylint: disable=invalid-name

# Disables "AppEnginePlatformWarning" because it is a "warning" that occurs
# frequently and tends to bury other important logs.
# It should be fine to ignore this, see https://stackoverflow.com/a/47494229
# and https://github.com/urllib3/urllib3/issues/1138#issuecomment-290325277.
import requests # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
requests.packages.urllib3.disable_warnings( # type: ignore[no-untyped-call]
    requests.packages.urllib3.contrib.appengine.AppEnginePlatformWarning # type: ignore[attr-defined]
)


class MockDistribution(python_utils.OBJECT):
    """Mock distribution object for the monkeypatching function."""

    def __init__(self, version):
        # type: (Text) -> None
        self.version = version


def monkeypatched_get_distribution(distribution_name):
    # type: (Text) -> Any
    """Monkeypatched version of pkg_resources.get_distribution.

    This approach is inspired by the discussion at:

        https://github.com/googleapis/google-cloud-python/issues/1893#issuecomment-396983379

    Args:
        distribution_name: str. The name of the distribution to get the
            Distribution object for.

    Returns:
        *. An object that contains the version attribute needed for App Engine
        third-party libs to successfully initialize. This is a hack to get the
        new Python 3 libs working in a Python 2 environment.

    Raises:
        Exception. The mock is used in a context apart from the google-api-core
            and google-cloud-tasks initializations.
    """
    try:
        return old_get_distribution(distribution_name)
    except pkg_resources.DistributionNotFound:
        if distribution_name == 'google-cloud-tasks':
            return MockDistribution('1.5.0')
        if distribution_name == 'google-cloud-translate':
            return MockDistribution('2.0.1')
        else:
            raise


pkg_resources.get_distribution = monkeypatched_get_distribution

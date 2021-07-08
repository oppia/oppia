# coding: utf-8
#
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

"""Unit tests for appengine_config.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import appengine_config
from core.tests import test_utils
import pkg_resources

from typing import Text # isort:skip # pylint: disable=unused-import


class AppengineConfigTests(test_utils.GenericTestBase):
    """Test the appengine config mock methods."""

    def _mock_get_distribution_which_raises_error(self, distribution_name):
        # type: (Text) -> None
        """Mock function for pkg_resources.get_distribution().

        Args:
            distribution_name: str. The name of the distribution to get the
                Distribution object for.

        Raises:
            DistributionNotFound. This is always raised, in order to simulate
                the case where the distribution does not exist (which is what
                currently happens in a prod environment).
        """
        raise pkg_resources.DistributionNotFound(distribution_name, 'tests')

    def test_monkeypatched_get_distribution_for_google_cloud_tasks(self):
        # type: () -> None
        """Test that the monkey-patched get_distribution() method returns an
        object with a suitable version string for google-cloud-tasks.
        """
        with self.swap(
            appengine_config, 'old_get_distribution',
            self._mock_get_distribution_which_raises_error
        ):
            mock_distribution = appengine_config.monkeypatched_get_distribution(
                'google-cloud-tasks')
        self.assertEqual(mock_distribution.version, '1.5.0')

    def test_monkeypatched_get_distribution_for_google_cloud_translate(self):
        # type: () -> None
        """Test that the monkey-patched get_distribution() method returns an
        object with a suitable version string for google-cloud-tasks.
        """
        with self.swap(
            appengine_config, 'old_get_distribution',
            self._mock_get_distribution_which_raises_error
        ):
            mock_distribution = appengine_config.monkeypatched_get_distribution(
                'google-cloud-translate')
        self.assertEqual(mock_distribution.version, '2.0.1')

    def test_monkeypatched_get_distribution_behaves_like_existing_one(self):
        # type: () -> None
        """Test that the monkey-patched get_distribution() method returns an
        object with a suitable version string for google-cloud-tasks.
        """
        assert_raises_regexp_context_manager = self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            pkg_resources.DistributionNotFound, 'invalid-lib')
        with self.swap(
            appengine_config, 'old_get_distribution',
            self._mock_get_distribution_which_raises_error
            ):
            with assert_raises_regexp_context_manager:
                appengine_config.monkeypatched_get_distribution('invalid-lib')

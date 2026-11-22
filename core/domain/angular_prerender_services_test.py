# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for Angular prerender helpers."""

from __future__ import annotations

from core.domain import angular_prerender_services
from core.tests import test_utils


class AngularPrerenderServicesTests(test_utils.GenericTestBase):

    def test_terms_markup_is_prerendered_and_sanitized(self) -> None:
        markup = angular_prerender_services.get_prerendered_markup('/terms')

        self.assertIn('<oppia-terms-page-root>', markup)
        self.assertIn('<terms-page>', markup)
        self.assertIn('Terms of Use', markup)
        self.assertNotIn('#ourServices', markup)
        self.assertNotIn('(click)', markup)

    def test_maintenance_markup_is_prerendered(self) -> None:
        markup = angular_prerender_services.get_prerendered_markup(
            '/maintenance'
        )

        self.assertIn('<oppia-maintenance-page-root>', markup)
        self.assertIn('<oppia-maintenance-page>', markup)
        self.assertIn('The Oppia site is temporarily unavailable.', markup)
        self.assertNotIn('getStaticImageUrl', markup)

    def test_trailing_slashes_are_ignored(self) -> None:
        self.assertEqual(
            angular_prerender_services.get_prerendered_markup('/terms/'),
            angular_prerender_services.get_prerendered_markup('/terms'),
        )

    def test_other_paths_have_no_prerendered_markup(self) -> None:
        self.assertEqual(
            angular_prerender_services.get_prerendered_markup('/'), ''
        )
        self.assertEqual(
            angular_prerender_services.get_prerendered_markup(''), ''
        )
        self.assertEqual(
            angular_prerender_services.get_prerendered_markup(
                '/privacy-policy'
            ),
            '',
        )

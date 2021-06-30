# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the domain_objects_validator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import domain_objects_validator
from core.tests import test_utils


class ValidateExplorationChangeTests(test_utils.GenericTestBase):
    """Tests to validate domain objects coming from API."""

    def test_incorrect_object_raises_exception(self):
        # type: () -> None
        exploration_change = {
            'old_value': '',
            'property_name': 'title',
            'new_value': 'newValue'
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Missing cmd key in change dict'):
            domain_objects_validator.validate_exploration_change(
                exploration_change)

    def test_correct_object_do_not_raises_exception(self):
        # type: () -> None
        exploration_change = {
            'cmd': 'edit_exploration_property',
            'new_value': 'arbitary_new_value',
            'old_value': '',
            'property_name': 'title'
        }
        domain_objects_validator.validate_exploration_change(exploration_change)

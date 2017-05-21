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

"""Tests for the config property registry."""

from core.domain import config_domain
from core.domain import config_services
from core.tests import test_utils
import schema_utils_test


class ConfigPropertyRegistryTests(test_utils.GenericTestBase):
    """Tests for the config property registry."""

    def test_config_property_schemas_are_valid(self):
        for property_name in config_domain.Registry._config_registry:  # pylint: disable=protected-access
            schema = config_domain.Registry.get_config_property(
                property_name).schema
            schema_utils_test.validate_schema(schema)


class DerivedConfigPropertyTests(test_utils.GenericTestBase):
    """Tests for derived config properties (i.e., those that are not directly
    settable)."""

    def test_derived_config_properties_cannot_be_set_directly(self):
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)

        with self.assertRaisesRegexp(
            Exception,
            'Cannot modify value of config property moderator_ids directly'
            ):
            config_services.set_property(
                self.MODERATOR_EMAIL, config_domain.MODERATOR_IDS.name,
                [self.get_user_id_from_email(self.MODERATOR_EMAIL)])

    def test_setting_derived_config_properties(self):
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)

        self.assertEqual(config_domain.MODERATOR_USERNAMES.value, [])
        self.assertEqual(config_domain.MODERATOR_IDS.value, [])

        self.set_moderators([self.MODERATOR_USERNAME])
        self.assertEqual(
            config_domain.MODERATOR_USERNAMES.value,
            [self.MODERATOR_USERNAME])
        self.assertEqual(
            config_domain.MODERATOR_IDS.value,
            [self.get_user_id_from_email(self.MODERATOR_EMAIL)])

        self.set_moderators([])
        self.assertEqual(config_domain.MODERATOR_USERNAMES.value, [])
        self.assertEqual(config_domain.MODERATOR_IDS.value, [])

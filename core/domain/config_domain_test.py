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
from core.platform import models
from core.tests import test_utils
import feconf
import schema_utils_test

(config_models,) = models.Registry.import_models([models.NAMES.config])


class ConfigPropertyRegistryTests(test_utils.GenericTestBase):
    """Tests for the config property registry."""

    def test_config_property_schemas_are_valid(self):
        for property_name in config_domain.Registry._config_registry:  # pylint: disable=protected-access
            schema = config_domain.Registry.get_config_property(
                property_name).schema
            schema_utils_test.validate_schema(schema)

    def test_get_exception_creating_new_config_property_with_existing_name(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Property with name promo_bar_enabled already exists'):
            config_domain.ConfigProperty(
                'promo_bar_enabled', 'schema', 'description', 'default_value')

    def test_config_property_with_new_config_property_model(self):
        config_model = config_models.ConfigPropertyModel(
            id='config_model', value='new_value')
        config_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model = config_domain.ConfigProperty(
            'config_model', config_domain.BOOL_SCHEMA, 'description', False)
        self.assertEqual(retrieved_model.value, 'new_value')

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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.domain import config_domain
from core.platform import models
from core.tests import test_utils
import feconf
import schema_utils_test
import utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

(config_models,) = models.Registry.import_models([models.NAMES.config])


class ConfigPropertyChangeTests(test_utils.GenericTestBase):

    def test_config_property_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            config_domain.ConfigPropertyChange({'invalid': 'data'})

    def test_config_property_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            config_domain.ConfigPropertyChange({'cmd': 'invalid'})

    def test_config_property_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value')):
            config_domain.ConfigPropertyChange({
                'cmd': 'change_property_value'
            })

    def test_config_property_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            config_domain.ConfigPropertyChange({
                'cmd': 'change_property_value',
                'new_value': 'new_value',
                'invalid': 'invalid'
            })

    def test_config_property_change_object_with_change_property_value(self):
        config_property_change_object = config_domain.ConfigPropertyChange({
            'cmd': 'change_property_value',
            'new_value': 'new_value'
        })

        self.assertEqual(
            config_property_change_object.cmd, 'change_property_value')
        self.assertEqual(config_property_change_object.new_value, 'new_value')

    def test_to_dict(self):
        config_property_change_dict = {
            'cmd': 'change_property_value',
            'new_value': 'new_value'
        }
        config_property_change_object = config_domain.ConfigPropertyChange(
            config_property_change_dict)
        self.assertEqual(
            config_property_change_object.to_dict(),
            config_property_change_dict)


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

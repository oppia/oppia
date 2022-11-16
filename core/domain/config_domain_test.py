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

from __future__ import annotations

from core import feconf
from core import schema_utils_test
from core import utils
from core.domain import config_domain
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])


class ConfigPropertyChangeTests(test_utils.GenericTestBase):

    def test_config_property_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            config_domain.ConfigPropertyChange({'invalid': 'data'})

    def test_config_property_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            config_domain.ConfigPropertyChange({'cmd': 'invalid'})

    def test_config_property_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value')):
            config_domain.ConfigPropertyChange({
                'cmd': 'change_property_value'
            })

    def test_config_property_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            config_domain.ConfigPropertyChange({
                'cmd': 'change_property_value',
                'new_value': 'new_value',
                'invalid': 'invalid'
            })

    def test_config_property_change_object_with_change_property_value(
        self
    ) -> None:
        config_property_change_object = config_domain.ConfigPropertyChange({
            'cmd': 'change_property_value',
            'new_value': 'new_value'
        })

        self.assertEqual(
            config_property_change_object.cmd, 'change_property_value')
        self.assertEqual(config_property_change_object.new_value, 'new_value')

    def test_to_dict(self) -> None:
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

    def test_config_property_schemas_are_valid(self) -> None:
        for property_name in (
                config_domain.Registry.get_all_config_property_names()):
            config_property = config_domain.Registry.get_config_property(
                property_name)
            # Ruling out the possibility of None for mypy type checking.
            assert config_property is not None
            schema_utils_test.validate_schema(config_property.schema)

        schemas = config_domain.Registry.get_config_property_schemas()
        for property_name in (
                config_domain.Registry.get_all_config_property_names()):
            schema_utils_test.validate_schema(schemas[property_name]['schema'])

    def test_raises_error_if_invalid_config_property_fetched_with_strict(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No config property exists for the given property '
            'name: Invalid_config_name'
        ):
            config_domain.Registry.get_config_property(
                'Invalid_config_name', strict=True
            )

    def test_get_exception_creating_new_config_property_with_existing_name(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Property with name promo_bar_enabled already exists'):
            config_domain.ConfigProperty(
                'promo_bar_enabled',
                config_domain.BOOL_SCHEMA,
                'description',
                False
            )

    def test_config_property_with_new_config_property_model(self) -> None:
        config_model = config_models.ConfigPropertyModel(
            id='config_model', value='new_value')
        config_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model = config_domain.ConfigProperty(
            'config_model',
            config_domain.BOOL_SCHEMA,
            'description',
            False
        )
        self.assertEqual(retrieved_model.value, 'new_value')
        self.assertEqual(retrieved_model.description, 'description')

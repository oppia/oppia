# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.config.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
import feconf

(base_models, parameter_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.platform_parameter])


class PlatformParameterModelUnitTests(test_utils.GenericTestBase):
    """Test PlatformParameterModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            parameter_models.PlatformParameterModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_export_policy(self):
        self.assertEqual(
            parameter_models.PlatformParameterModel.get_export_policy(),
            base_models.EXPORT_POLICY.NOT_APPLICABLE)

    def test_create_model(self):
        parameter_model = parameter_models.PlatformParameterModel.create(
            name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
        )
        self.assertEqual(parameter_model.id, 'parameter_name')
        self.assertEqual(
            parameter_model.rules,
            [{'filters': [], 'value_when_matched': False}])

    def test_commit(self):
        parameter_name = 'parameter_name'
        rule_dicts = [{'filters': [], 'value_when_matched': False}]

        parameter_model = parameter_models.PlatformParameterModel.create(
            name=parameter_name,
            rule_dicts=rule_dicts,
        )

        parameter_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        retrieved_model1 = parameter_models.PlatformParameterModel.get_version(
            parameter_name, 1)
        self.assertEqual(retrieved_model1.rules, rule_dicts)

        new_rules = [
            {
                'filters': [
                    {'type': 'app_version', 'value': '>1.2.3'}
                ],
                'value_when_matched': True
            },
            {'filters': [], 'value_when_matched': False},
        ]

        retrieved_model1.rules = new_rules
        retrieved_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model2 = parameter_models.PlatformParameterModel.get_version(
            parameter_name, 2)

        self.assertEqual(retrieved_model2.rules, new_rules)

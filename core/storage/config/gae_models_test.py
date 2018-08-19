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

from core.platform import models
from core.tests import test_utils

(config_models,) = models.Registry.import_models([models.NAMES.config])


class ConfigPropertyModelUnitTests(test_utils.GenericTestBase):
    """Test ConfigPropertyModel class."""

    def test_create_and_get_model(self):
        config_models.ConfigPropertyModel(
            id='a', value='b')
        config_model = config_models.ConfigPropertyModel.get('a')
        self.assertEqual(config_model.id, 'a')
        self.assertEqual(config_model.value, 'b')

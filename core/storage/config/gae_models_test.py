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
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.platform import models
from core.tests import test_utils
import feconf

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


class ConfigPropertyModelUnitTests(test_utils.GenericTestBase):
    """Test ConfigPropertyModel class."""

    def test_create_model(self):
        config_model = config_models.ConfigPropertyModel(
            value='b')
        self.assertEqual(config_model.value, 'b')

    def test_commit(self):
        config_model1 = config_models.ConfigPropertyModel(
            id='config_model1', value='c')
        config_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model1 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 1)
        self.assertEqual(retrieved_model1.value, 'c')
        retrieved_model1.value = 'd'
        retrieved_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model2 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 2)
        self.assertEqual(retrieved_model2.value, 'd')

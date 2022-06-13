# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for Learner group models."""

from __future__ import annotations

import copy
import datetime

from core import feconf
from core.constants import constants
from core.platform import models
from core.storage import learner_group
from core.tests import test_utils

from typing import Any, Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import learner_group_models
    from mypy_imports import user_models

(base_models, exp_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration, models.NAMES.user])



class LearnerGroupDataModelUnitTest(test_utils.GenericTestBase):
    """Test the LearnerGroupDataModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            learner_group_models.LearnerGroupDataModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
        learner_group = learner_group_models.LearnerGroupDataModel.create(
            '3232', 'title', 'description',
            ['user_1'], ['user_2', 'user_3', 'user_4'],
            ['user_5', 'user_6'])
        learner_group.update_timestamps()
        learner_group.put()
        self.assertTrue(
            learner_group.LearnerGroupDataModel
            .has_reference_to_user_id('user_1'))
        self.assertTrue(
            learner_group.LearnerGroupDataModel
            .has_reference_to_user_id('user_2'))
        self.assertTrue(
            learner_group.LearnerGroupDataModel
            .has_reference_to_user_id('user_5'))
        self.assertFalse(
            learner_group.LearnerGroupDataModel
            .has_reference_to_user_id('user_32'))

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
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_domain
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import exp_models
    from mypy_imports import user_models

(base_models, exp_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration, models.NAMES.user])



class LearnerGroupDataModelUnitTest(test_utils.GenericTestBase):
    """Test the LearnerGroupDataModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_exploration_count(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration( # type: ignore[no-untyped-call]
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration) # type: ignore[no-untyped-call]

        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 1)
        saved_exploration: exp_models.ExplorationModel = (
            exp_models.ExplorationModel.get_all().fetch(limit=1)[0])
        self.assertEqual(saved_exploration.title, 'A Title')
        self.assertEqual(saved_exploration.category, 'A Category')
        self.assertEqual(saved_exploration.objective, 'An Objective')

    def test_reconstitute(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration( # type: ignore[no-untyped-call]
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration) # type: ignore[no-untyped-call]
        exp_model = exp_models.ExplorationModel.get_by_id('id')
        snapshot_dict = exp_model.compute_snapshot()
        snapshot_dict['skill_tags'] = ['tag1', 'tag2']
        snapshot_dict['default_skin'] = 'conversation_v1'
        snapshot_dict['skin_customizations'] = {}
        snapshot_dict = exp_models.ExplorationModel.convert_to_valid_dict(
            snapshot_dict)
        exp_model = exp_models.ExplorationModel(**snapshot_dict)
        snapshot_dict = exp_model.compute_snapshot()
        for field in ['skill_tags', 'default_skin', 'skin_customization']:
            self.assertNotIn(field, snapshot_dict)

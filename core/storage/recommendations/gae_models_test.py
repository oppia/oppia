# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.question.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

(base_models, recommendations_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.recommendations])


class ExplorationRecommendationsModelUnitTests(test_utils.GenericTestBase):
    """Tests the ExplorationRecommendationsModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            recommendations_models.ExplorationRecommendationsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            recommendations_models.ExplorationRecommendationsModel
            .has_reference_to_user_id('any_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            recommendations_models.ExplorationRecommendationsModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)


class TopicSimilaritiesModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicSimilaritiesModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            recommendations_models.TopicSimilaritiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for feedback models."""

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

from core import jobs
from core.domain import prod_validators
from core.platform import models

(exp_models, feedback_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback])


class CleanUpFeedbackAnalyticsModelModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to remove feedback analytics models for
    deleted explorations.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10809 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackAnalyticsModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        exp_model = exp_models.ExplorationModel.get_by_id(
            item.id)
        if exp_model is None or exp_model.deleted:
            yield ('Deleted Feedback Analytics Model', item.id)
            item.delete()

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class CleanUpGeneralFeedbackThreadModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to clean up GeneralFeedbackThreadModel by removing
    the model if the target model for which feedback was created is
    deleted. Target model can be exploration, question, skill or topic.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10809 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        target_model = (
            prod_validators.TARGET_TYPE_TO_TARGET_MODEL[
                item.entity_type].get_by_id(item.entity_id))
        if target_model is None or target_model.deleted:
            yield ('Deleted GeneralFeedbackThreadModel', item.id)
            item.delete()
            return

    @staticmethod
    def reduce(key, values):
        yield (key, values)

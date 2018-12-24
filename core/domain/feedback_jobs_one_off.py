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

"""One off jobs relating to the feedback framework."""

from core import jobs
from core.platform import models

(feedback_models, email_models, user_models) = models.Registry.import_models(
    [models.NAMES.feedback, models.NAMES.email, models.NAMES.user])


class PopulateLastUpdatedFieldOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for populating last updated field for migrated models."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadModel,
                feedback_models.GeneralFeedbackMessageModel,
                feedback_models.GeneralFeedbackThreadUserModel,
                email_models.GeneralFeedbackEmailReplyToIdModel,
                user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        if item.last_updated is None:
            # Sets the last updated time as the time of the job run.
            item.put()

    @staticmethod
    def reduce(key, value):
        pass


class ValidateLastUpdatedFieldOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for validating that the last updated field is not None for
    migrated models.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadModel,
                feedback_models.GeneralFeedbackMessageModel,
                feedback_models.GeneralFeedbackThreadUserModel,
                email_models.GeneralFeedbackEmailReplyToIdModel,
                user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        if item.last_updated is None:
            yield (type(item).__name__, item.id)

    @staticmethod
    def reduce(key, instance_ids):
        yield (key, instance_ids)

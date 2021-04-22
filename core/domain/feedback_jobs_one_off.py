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
from core.domain import feedback_services
from core.platform import models

(exp_models, feedback_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback])


class FeedbackThreadCacheOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate message data cache of threads."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """The list of datastore classes to map over."""
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(thread_model):
        """Implements the map function for this job."""
        last_nonempty_message = None
        for message in reversed(
                feedback_services.get_messages(thread_model.id)):
            if message.text:
                last_nonempty_message = message
                break

        cache_updated = any([
            FeedbackThreadCacheOneOffJob._cache_last_nonempty_message_text(
                thread_model, last_nonempty_message),
            FeedbackThreadCacheOneOffJob._cache_last_nonempty_message_author_id(
                thread_model, last_nonempty_message),
        ])
        if cache_updated:
            thread_model.update_timestamps(update_last_updated_time=False)
            thread_model.put()
            yield ('Updated', 1)
        else:
            yield ('Already up-to-date', 1)

    @staticmethod
    def reduce(key, value_strs):
        """Implements the reduce function for this job."""
        yield (key, sum(int(s) for s in value_strs))

    @staticmethod
    def _cache_last_nonempty_message_text(thread_model, last_nonempty_message):
        """Ensures the cached text for the given thread's last non-empty message
        is correct.

        Args:
            thread_model: GeneralFeedbackThreadModel. Model of the thread to
                have its cache updated.
            last_nonempty_message: FeedbackMessage|None. The most recent message
                with non-empty text, or None when no such message exists.

        Returns:
            bool. Whether the cache was actually updated.
        """
        message_text = last_nonempty_message and last_nonempty_message.text
        if thread_model.last_nonempty_message_text != message_text:
            thread_model.last_nonempty_message_text = message_text
            return True
        return False

    @staticmethod
    def _cache_last_nonempty_message_author_id(
            thread_model, last_nonempty_message):
        """Ensures the cached author ID for the given thread's last non-empty
        message is correct.

        Args:
            thread_model: GeneralFeedbackThreadModel. Model of the thread to
                have its cache updated.
            last_nonempty_message: FeedbackMessage|None. The most recent message
                with non-empty text, or None when no such message exists.

        Returns:
            bool. Whether the cache was actually updated.
        """
        message_author_id = (
            last_nonempty_message and last_nonempty_message.author_id)
        if thread_model.last_nonempty_message_author_id != message_author_id:
            thread_model.last_nonempty_message_author_id = message_author_id
            return True
        return False


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
            feedback_services.TARGET_TYPE_TO_TARGET_MODEL[
                item.entity_type].get_by_id(item.entity_id))
        if target_model is None or target_model.deleted:
            yield ('Deleted GeneralFeedbackThreadModel', item.id)
            item.delete()
            return

    @staticmethod
    def reduce(key, values):
        yield (key, values)

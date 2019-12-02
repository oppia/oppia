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
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import feedback_services
from core.platform import models

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class GeneralFeedbackThreadUserOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for setting user_id and thread_id for all
     GeneralFeedbackThreadUserModels.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadUserModel]

    @staticmethod
    def map(model_instance):
        """Implements the map function for this job."""
        user_id, thread_id = model_instance.id.split('.', 1)
        if model_instance.user_id is None:
            model_instance.user_id = user_id
        if model_instance.thread_id is None:
            model_instance.thread_id = thread_id
        model_instance.put(update_last_updated_time=False)
        yield ('SUCCESS', model_instance.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class FeedbackThreadCacheOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate message data cache of threads."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(thread):
        """Implements the map function for this job."""
        last_message, second_last_message = (
            feedback_models.GeneralFeedbackMessageModel.get_multi(
                feedback_services.get_last_two_message_ids(thread)))
        cache_updated = any([
            _cache_last_message(thread, last_message),
            _cache_second_last_message(thread, second_last_message),
            _cache_updated_status(thread, last_message, second_last_message),
        ])
        if cache_updated:
            thread.put()
            yield ('Updated', 1)

    @staticmethod
    def reduce(key, value_strs):
        """Implements the reduce function for this job."""
        yield (key, sum(int(s) for s in value_strs))


def _cache_last_message(thread, last_message):
    """Ensures the given thread's cache for the last message has its values set
    to the provided message.

    Args:
        thread: feedback_models.GeneralFeedbackThreadModel.
        last_message: feedback_models.GeneralFeedbackMessageModel.

    Returns:
        bool. Whether the cache was actually updated.
    """
    cache_updated = False
    last_message_text = last_message and last_message.text
    if thread.last_message_text != last_message_text:
        thread.last_message_text = last_message_text
        cache_updated = True
    last_message_author_id = last_message and last_message.author_id
    if thread.last_message_author_id != last_message_author_id:
        thread.last_message_author_id = last_message_author_id
        cache_updated = True
    return cache_updated


def _cache_second_last_message(thread, second_last_message):
    """Ensures the given thread's cache for the second-to-last message has its
    values set to the provided message.

    Args:
        thread: feedback_models.GeneralFeedbackThreadModel.
        second_last_message: feedback_models.GeneralFeedbackMessageModel.

    Returns:
        bool. Whether the cache was actually updated.
    """
    cache_updated = False
    second_last_message_text = second_last_message and second_last_message.text
    if thread.second_last_message_text != second_last_message_text:
        thread.second_last_message_text = second_last_message_text
        cache_updated = True
    second_last_message_author_id = (
        second_last_message and second_last_message.author_id)
    if thread.second_last_message_author_id != second_last_message_author_id:
        thread.second_last_message_author_id = second_last_message_author_id
        cache_updated = True
    return cache_updated


def _cache_updated_status(thread, last_message, second_last_message):
    """Ensures the given thread's cache for the change-in-status is based upon
    the actual difference between the last and second-to-last messages.

    Args:
        thread: feedback_models.GeneralFeedbackThreadModel.
        last_message: feedback_models.GeneralFeedbackMessageModel.
        second_last_message: feedback_models.GeneralFeedbackMessageModel.

    Returns:
        bool. Whether the cache was actually updated.
    """
    if (last_message and last_message.updated_status and second_last_message and
            last_message.updated_status != second_last_message.updated_status):
        updated_status = last_message.updated_status
    else:
        updated_status = None
    if thread.updated_status != updated_status:
        thread.updated_status = updated_status
        return True
    return False

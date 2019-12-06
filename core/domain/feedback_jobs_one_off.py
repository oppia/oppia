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
from core.domain import user_services
from core.platform import models

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class FeedbackThreadCacheOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate message data cache of threads."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(thread):
        """Implements the map function for this job."""
        last_message = feedback_models.GeneralFeedbackMessageModel.get_by_id(
            feedback_services.get_full_message_id(
                thread.id, thread.message_count - 1))
        cache_updated = any([
            _cache_last_message_text(thread, last_message),
            _cache_last_message_author(thread, last_message),
        ])
        if cache_updated:
            thread.put()
            yield ('Updated', 1)

    @staticmethod
    def reduce(key, value_strs):
        """Implements the reduce function for this job."""
        yield (key, sum(int(s) for s in value_strs))


def _cache_last_message_text(thread, last_message):
    """Ensures the given thread's cache for the last message's text is correct.

    Args:
        thread: feedback_models.GeneralFeedbackThreadModel.
        last_message: feedback_models.GeneralFeedbackMessageModel.

    Returns:
        bool. Whether the cache was actually updated.
    """
    last_message_text = last_message and last_message.text
    if thread.last_message_text != last_message_text:
        thread.last_message_text = last_message_text
        return True
    return False


def _cache_last_message_author(thread, last_message):
    """Ensures the given thread's cache for the last message's author is
    correct.

    Args:
        thread: feedback_models.GeneralFeedbackThreadModel.
        last_message: feedback_models.GeneralFeedbackMessageModel.

    Returns:
        bool. Whether the cache was actually updated.
    """
    last_message_author = (
        last_message and last_message.author_id and
        user_services.get_username(last_message.author_id))
    if thread.last_message_author != last_message_author:
        thread.last_message_author = last_message_author
        return True
    return False

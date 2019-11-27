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


class GeneralFeedbackThreadOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate message data cache of threads."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(thread):
        """Implements the map function for this job."""
        messages = feedback_services.get_messages(thread.id)

        last_message = messages[-1] if len(messages) > 0 else None
        thread.last_message_id = last_message and last_message.message_id
        thread.last_message_text = last_message and last_message.text
        thread.last_message_author_id = last_message and last_message.author_id

        second_last_message = messages[-2] if len(messages) > 1 else None
        thread.second_last_message_id = (
            second_last_message and second_last_message.message_id)
        thread.second_last_message_text = (
            second_last_message and second_last_message.text)
        thread.second_last_message_author_id = (
            second_last_message and second_last_message.author_id)

        thread.put()
        yield (thread.id, 1)

    @staticmethod
    def reduce(key, stringified_values):
        """Implements the reduce function for this job."""
        yield (key, sum(int(s) for s in stringified_values))

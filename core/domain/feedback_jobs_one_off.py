# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for feedback."""

import ast
import logging

from constants import constants
from core import jobs
from core.domain import feedback_services
from core.platform import models

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class FeedbackThreadMessagesCountOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for calculating the number of messages in a thread."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackMessageModel]

    @staticmethod
    def map(item):
        yield (item.thread_id, item.message_id)

    @staticmethod
    def reduce(key, stringified_message_ids):
        message_ids = [
            ast.literal_eval(v) for v in stringified_message_ids]

        thread_model = feedback_models.FeedbackThreadModel.get(key)
        next_message_id = max(message_ids) + 1
        thread_model.message_count = next_message_id
        thread_model.put(update_last_updated_time=False)

        if next_message_id != len(message_ids):
            exploration_and_thread_id = key.split('.')
            exploration_id = exploration_and_thread_id[0]
            thread_id = exploration_and_thread_id[1]
            thread = feedback_services.get_thread(exploration_id, thread_id)
            logging.error(
                'The number of messages in the thread, given by the id %s is %s'
                '. But the number of messages as estimated by the message ids '
                'is %s. Therefore the estimate is not equal to the actual '
                'number of messages.' % (
                    key, len(message_ids), next_message_id))

            yield ('error', {
                'subject': thread.subject,
                'exploration_id': exploration_id,
                'thread_id': thread_id,
                'next_message_id': next_message_id,
                'message_count': len(message_ids)
            })


class FeedbackSubjectOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for updating the feedback subject."""

    DEFAULT_SUBJECT = u'(Feedback from a learner)'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel]

    @staticmethod
    def map(item):
        if item.subject != FeedbackSubjectOneOffJob.DEFAULT_SUBJECT:
            return

        first_message = feedback_services.get_message(
            item.exploration_id, item.thread_id, 0)

        if not first_message.text:
            return

        if len(first_message.text) > constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT:
            updated_subject = first_message.text[
                :constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT]

            if ' ' in updated_subject:
                updated_subject = ' '.join(updated_subject.split(' ')[:-1])

            item.subject = updated_subject + '...'
        else:
            item.subject = first_message.text
        item.put(update_last_updated_time=False)

    @staticmethod
    def reduce(key, value):
        pass

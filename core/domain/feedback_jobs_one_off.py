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
from core.domain import exp_domain
from core.domain import feedback_services
from core.domain import exp_services
from core.platform import models

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])

class FeedbackThreadMessagesCountOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for calculating the number of messages in a thread."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackMessageModel]

    @staticmethod
    def map(item):
        yield (item.thread_id, item.message_id)

    @staticmethod
    def reduce(thread_id, stringified_message_ids):
        message_ids = [
            ast.literal_eval(v) for v in stringified_message_ids]

        thread_model = feedback_models.FeedbackThreadModel.get(thread_id)
        next_message_id = max(message_ids) + 1
        thread_model.message_count = next_message_id
        thread_model.put(update_last_updated_time=False)

        if next_message_id != len(message_ids):
            thread = feedback_services.get_thread(thread_id)
            logging.error(
                'The number of messages in the thread, given by the id %s is %s'
                '. But the number of messages as estimated by the message ids '
                'is %s. Therefore the estimate is not equal to the actual '
                'number of messages.' % (
                    thread_id, len(message_ids), next_message_id))

            yield (
                'error', {
                    'subject': thread.subject,
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

        first_message = feedback_services.get_message(item.id, 0)

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


class SuggestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for converting all suggestions from the old model to the
    new model.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.SuggestionModel]

    @staticmethod
    def map(suggestion):
        suggestion_id = (
            suggestion_models.TARGET_TYPE_EXPLORATION + '.' + suggestion.id)
        thread = feedback_models.FeedbackThreadModel.get_by_exp_and_thread_id(
            suggestion.id.split('.')[0], suggestion.id.split('.')[1])
        if thread.status == feedback_models.STATUS_CHOICES_OPEN:
            status = suggestion_models.STATUS_RECEIVED
        elif thread.status == feedback_models.STATUS_CHOICES_FIXED:
            status = suggestion_models.STATUS_ACCEPTED
        elif thread.status == feedback_models.STATUS_CHOICES_IGNORED:
            status = suggestion_models.STATUS_REJECTED
        else:
            print thread.status

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER +
            exp_services.get_exploration_by_id(
                suggestion.exploration_id).category)

        old_content = exp_services.get_exploration_by_id(
            suggestion.exploration_id, version=suggestion.exploration_version)

        # For old accepted/rejected suggestions, the audio_translations field
        # below value is not derivable as it is set only when the
        # suggestion is accepted and that exploration version is unknown to us.
        # We will never need to access the change_cmd parameter for these
        # suggestions. For suggestions still in review, when the suggestion is
        # accepted the audio_translations field will be updated. So while
        # migrating we can set it to {} without losing required data.
        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.state_name,
            'new_value': {
                'html': suggestion.suggestion_html,
                'audio_translations': {}
            }
        }

        suggestion_models.SuggestionModel(
            id=suggestion_id,
            suggestion_type=suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=suggestion.exploration_id,
            target_version_at_submission=suggestion.exploration_version,
            status=status, author_id=suggestion.author_id,
            assigned_reviewer_id=None, final_reviewer_id=None,
            change_cmd=change_cmd, score_category=score_category,
            created_on=suggestion.created_on, deleted=suggestion.deleted).put()

        @staticmethod
        def reduce(key, value):
            pass

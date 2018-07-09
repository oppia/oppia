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
from core.domain import exp_services
from core.domain import feedback_services
from core.platform import models

(suggestion_models, feedback_models, email_models, user_models) = (
    models.Registry.import_models(
        [models.NAMES.suggestion, models.NAMES.feedback, models.NAMES.email,
         models.NAMES.user]))


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
        new_suggestion_id = (
            suggestion_models.TARGET_TYPE_EXPLORATION + '.' + suggestion.id)
        thread = feedback_models.FeedbackThreadModel.get_by_id(suggestion.id)
        if thread.status == feedback_models.STATUS_CHOICES_OPEN:
            status = suggestion_models.STATUS_IN_REVIEW
        elif thread.status == feedback_models.STATUS_CHOICES_FIXED:
            status = suggestion_models.STATUS_ACCEPTED
        elif thread.status == feedback_models.STATUS_CHOICES_IGNORED:
            status = suggestion_models.STATUS_REJECTED

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER +
            exp_services.get_exploration_by_id(
                suggestion.exploration_id).category)

        # We do not have any suggestions for translations, hence the migration
        # job will not be dealing with such suggestions. So while migrating, we
        # can set the translations field as {} without losing any data.
        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.state_name,
            'new_value': {
                'html': suggestion.get_suggestion_html(),
                'content_id': 'content'
            }
        }

        suggestion_models.GeneralSuggestionModel(
            id=new_suggestion_id,
            suggestion_type=(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=suggestion.exploration_id,
            target_version_at_submission=suggestion.exploration_version,
            status=status, author_id=suggestion.author_id,
            final_reviewer_id=None, change_cmd=change_cmd,
            score_category=score_category, created_on=suggestion.created_on,
            deleted=suggestion.deleted).put()

    @staticmethod
    def reduce(key, value):
        pass


class SuggestionMigrationValdiationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for validating all suggestions from the old model are
    converted to the new model.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.SuggestionModel,
                suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        if isinstance(item, feedback_models.SuggestionModel):
            yield ('old', item.id)
        else:
            yield ('new', item.id)

    @staticmethod
    def reduce(key, value):
        yield (key, len(value))


class GeneralizeFeedbackThreadMigrationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One off job to populate two new fields for instances of Feedback thread
    model.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel]

    @staticmethod
    def map(thread):
        thread.entity_type = 'exploration'
        thread.entity_id = thread.exploration_id
        thread.put()

    @staticmethod
    def reduce(thread):
        pass


class FeedbackThreadIdMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for migrating instances of feedback thread model and related
    models to have thread ID of the for entity_type.entity_id.random_str.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel,
                feedback_models.FeedbackMessageModel,
                feedback_models.FeedbackThreadUserModel,
                email_models.FeedbackEmailReplyToIdModel,
                user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        if isinstance(item, feedback_models.FeedbackThreadModel):
            old_id = item.id
            # To make sure the job is idempotent, we create new instances with
            # the new id. If the id has 2 parts, it needs to be migrated,
            # else it has already been migrated.
            if len(old_id.split('.')) == 2:
                new_id = 'exploration.' + item.id
                feedback_models.FeedbackThreadModel(
                    id=new_id, entity_type=item.entity_type,
                    entity_id=item.entity_id,
                    exploration_id=item.exploration_id,
                    state_name=item.state_name,
                    original_author_id=item.original_author_id,
                    status=item.status, subject=item.subject,
                    summary=item.summary, has_suggestion=item.has_suggestion,
                    message_count=item.message_count,
                    last_updated=item.last_updated, created_on=item.created_on,
                    deleted=item.deleted).put()
        elif isinstance(item, feedback_models.FeedbackMessageModel):
            old_id = item.id
            if len(old_id.split('.')) == 3:
                new_id = 'exploration.' + item.id
                new_thread_id = 'exploration.' + item.thread_id
                feedback_models.FeedbackMessageModel(
                    id=new_id, thread_id=new_thread_id,
                    message_id=item.message_id, author_id=item.author_id,
                    updated_status=item.updated_status,
                    updated_subject=item.updated_subject, text=item.text,
                    received_via_email=item.received_via_email,
                    last_updated=item.last_updated, created_on=item.created_on,
                    deleted=item.deleted).put()
        elif isinstance(item, feedback_models.FeedbackThreadUserModel):
            old_id = item.id
            if len(old_id.split('.')) == 3:
                new_id = '.'.join(
                    [old_id.split('.')[0], 'exploration', old_id.split('.')[1],
                     old_id.split('.')[2]])
                feedback_models.FeedbackThreadUserModel(
                    id=new_id,
                    message_ids_read_by_user=item.message_ids_read_by_user
                ).put()
        elif isinstance(item, email_models.FeedbackEmailReplyToIdModel):
            old_id = item.id
            if len(old_id.split('.')) == 3:
                new_id = '.'.join(
                    [old_id.split('.')[0], 'exploration', old_id.split('.')[1],
                     old_id.split('.')[2]])
                email_models.FeedbackEmailReplyToIdModel(
                    id=new_id, reply_to_id=item.reply_to_id).put()
        elif isinstance(item, user_models.UserSubscriptionsModel):
            for thread_id in item.feedback_thread_ids:
                if len(thread_id.split('.')) == 2:
                    new_thread_id = 'exploration.' + thread_id
                    if new_thread_id not in item.feedback_thread_ids:
                        item.feedback_thread_ids.append(new_thread_id)
            item.put()

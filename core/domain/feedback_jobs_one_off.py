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

(base_models, email_models, feedback_models, suggestion_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.email, models.NAMES.feedback,
        models.NAMES.suggestion, models.NAMES.user]))


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
            thread_model.put(update_last_updated_time=False)
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


class FeedbackThreadIdRegenerateOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate message data cache of threads."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """The list of datastore classes to map over."""
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(thread_model):
        """Implements the map function for this job."""
        if len(thread_model.id.split('.')) < 4:
            return
        old_thread_id = thread_model.id
        new_thread_id = (
            feedback_models.GeneralFeedbackThreadModel.generate_new_thread_id(
                thread_model.entity_type, thread_model.entity_id))
        new_thread_model = feedback_models.GeneralFeedbackThreadModel(
            id=new_thread_id,
            entity_type=thread_model.entity_type,
            entity_id=thread_model.entity_id,
            original_author_id=thread_model.original_author_id,
            status=thread_model.status,
            subject=thread_model.subject,
            summary=thread_model.summary,
            has_suggestion=thread_model.has_suggestion,
            message_count=thread_model.message_count,
            last_nonempty_message_text=thread_model.last_nonempty_message_text,
            last_nonempty_message_author_id=(
                thread_model.last_nonempty_message_author_id),
            last_updated=thread_model.last_updated,
            created_on=thread_model.created_on)

        models_to_delete = [thread_model]
        models_to_put = [new_thread_model]

        if thread_model.has_suggestion:
            suggestion_model = (
                suggestion_models.GeneralSuggestionModel.get_by_id(
                    old_thread_id))
            models_to_delete.append(suggestion_model)
            models_to_put.append(suggestion_models.GeneralSuggestionModel(
                id=new_thread_id,
                suggestion_type=suggestion_model.suggestion_type,
                target_type=suggestion_model.target_type,
                target_id=suggestion_model.target_id,
                target_version_at_submission=(
                    suggestion_model.target_version_at_submission),
                status=suggestion_model.status,
                author_id=suggestion_model.author_id,
                final_reviewer_id=suggestion_model.final_reviewer_id,
                change_cmd=suggestion_model.change_cmd,
                score_category=suggestion_model.score_category,
                created_on=suggestion_model.created_on,
                last_updated=suggestion_model.last_updated
                ))

        feedback_message_models = (
            feedback_models.GeneralFeedbackMessageModel.get_all_thread_messages(
                old_thread_id))
        models_to_delete.extend(feedback_message_models)

        for feedback_message_model in feedback_message_models:
            new_model = feedback_models.GeneralFeedbackMessageModel.create(
                new_thread_id, feedback_message_model.message_id)
            new_model.thread_id = new_thread_id
            new_model.message_id = feedback_message_model.message_id
            new_model.author_id = feedback_message_model.author_id
            new_model.updated_status = feedback_message_model.updated_status
            new_model.updated_subject = feedback_message_model.updated_subject
            new_model.text = feedback_message_model.text
            new_model.received_via_email = (
                feedback_message_model.received_via_email)
            new_model.last_updated = feedback_message_model.last_updated
            new_model.created_on = feedback_message_model.created_on

            models_to_put.append(new_model)

        feedback_email_reply_to_id_models = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_thread_id(
                old_thread_id))
        if feedback_email_reply_to_id_models:
            models_to_delete.extend(feedback_email_reply_to_id_models)
            for model in feedback_email_reply_to_id_models:
                new_model = email_models.GeneralFeedbackEmailReplyToIdModel(
                    id=('.'.join([model.user_id, new_thread_id])),
                    user_id=model.user_id,
                    thread_id=new_thread_id,
                    reply_to_id=model.reply_to_id,
                    last_updated=model.last_updated,
                    created_on=model.created_on)
                models_to_put.append(new_model)

        subscription_models = (
            user_models.UserSubscriptionsModel
            .get_subscription_models_for_thread_id(old_thread_id))
        if subscription_models:
            for model in subscription_models:
                model.general_feedback_thread_ids = [
                    new_thread_id if thread_id == old_thread_id else thread_id
                    for thread_id in model.general_feedback_thread_ids]

            models_to_put.extend(subscription_models)

        base_models.BaseModel.put_multi(
            models_to_put, update_last_updated_time=False)
        base_models.BaseModel.delete_multi(models_to_delete)
        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, value_strs):
        """Implements the reduce function for this job."""
        yield (key, sum(int(s) for s in value_strs))

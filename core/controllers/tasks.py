# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Controllers for task queue handlers."""

import json

from core.controllers import base
from core.domain import email_manager
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.platform import models

(job_models, email_models) = models.Registry.import_models(
    [models.NAMES.job, models.NAMES.email])
transaction_services = models.Registry.import_transaction_services()


class UnsentFeedbackEmailHandler(base.BaseHandler):
    """Handler task of sending emails of feedback messages."""

    def post(self):
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        references = feedback_services.get_feedback_message_references(user_id)
        if not references:
            # Model may not exist if user has already attended to the feedback.
            return

        transaction_services.run_in_transaction(
            feedback_services.update_feedback_email_retries, user_id)

        messages = {}
        for reference in references:
            message = feedback_services.get_message(
                reference.thread_id, reference.message_id)

            exploration = exp_services.get_exploration_by_id(
                reference.entity_id)

            message_text = message.text
            if len(message_text) > 200:
                message_text = message_text[:200] + '...'

            if exploration.id in messages:
                messages[exploration.id]['messages'].append(message_text)
            else:
                messages[exploration.id] = {
                    'title': exploration.title,
                    'messages': [message_text]
                }

        email_manager.send_feedback_message_email(user_id, messages)
        transaction_services.run_in_transaction(
            feedback_services.pop_feedback_message_references, user_id,
            len(references))


class SuggestionEmailHandler(base.BaseHandler):
    """Handler task of sending email of suggestion."""

    def post(self):
        payload = json.loads(self.request.body)
        exploration_id = payload['exploration_id']
        thread_id = payload['thread_id']

        exploration_rights = (
            rights_manager.get_exploration_rights(exploration_id))
        exploration = exp_services.get_exploration_by_id(exploration_id)
        suggestion = feedback_services.get_suggestion(thread_id)

        email_manager.send_suggestion_email(
            exploration.title, exploration.id, suggestion.author_id,
            exploration_rights.owner_ids)


class InstantFeedbackMessageEmailHandler(base.BaseHandler):
    """Handles task of sending feedback message emails instantly."""

    def post(self):
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        reference_dict = payload['reference_dict']

        message = feedback_services.get_message(
            reference_dict['thread_id'], reference_dict['message_id'])
        exploration = exp_services.get_exploration_by_id(
            reference_dict['entity_id'])
        thread = feedback_services.get_thread(reference_dict['thread_id'])

        model = email_models.FeedbackEmailReplyToIdModel.get(
            user_id, reference_dict['thread_id'])
        reply_to_id = model.reply_to_id

        subject = 'New Oppia message in "%s"' % thread.subject
        email_manager.send_instant_feedback_message_email(
            user_id, message.author_id, message.text, subject,
            exploration.title, reference_dict['entity_id'],
            thread.subject, reply_to_id=reply_to_id)


class FeedbackThreadStatusChangeEmailHandler(base.BaseHandler):
    """Handles task of sending email instantly when feedback thread status is
    changed.
    """

    def post(self):
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        reference_dict = payload['reference_dict']
        old_status = payload['old_status']
        new_status = payload['new_status']

        message = feedback_services.get_message(
            reference_dict['thread_id'], reference_dict['message_id'])
        exploration = exp_services.get_exploration_by_id(
            reference_dict['entity_id'])
        thread = feedback_services.get_thread(reference_dict['thread_id'])

        text = 'changed status from %s to %s' % (old_status, new_status)
        subject = 'Oppia thread status change: "%s"' % thread.subject
        email_manager.send_instant_feedback_message_email(
            user_id, message.author_id, text, subject, exploration.title,
            reference_dict['entity_id'], thread.subject)


class FlagExplorationEmailHandler(base.BaseHandler):
    """Handles task of sending emails about flagged explorations
    to moderators.
    """

    def post(self):
        payload = json.loads(self.request.body)
        exploration_id = payload['exploration_id']
        report_text = payload['report_text']
        reporter_id = payload['reporter_id']

        exploration = exp_services.get_exploration_by_id(exploration_id)

        email_manager.send_flag_exploration_email(
            exploration.title, exploration_id, reporter_id, report_text)

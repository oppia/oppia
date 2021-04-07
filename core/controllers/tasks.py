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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from core import jobs_registry
from core.controllers import base
from core.domain import email_manager
from core.domain import email_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import stats_services
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import wipeout_service
import python_utils


class UnsentFeedbackEmailHandler(base.BaseHandler):
    """Handler task of sending emails of feedback messages."""

    def post(self):
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        references = feedback_services.get_feedback_message_references(user_id)
        if not references:
            # Model may not exist if user has already attended to the feedback.
            return

        feedback_services.update_feedback_email_retries_transactional(user_id)

        messages = {}
        for reference in references:
            message = feedback_services.get_message(
                reference.thread_id, reference.message_id)

            exploration = exp_fetchers.get_exploration_by_id(
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
        feedback_services.pop_feedback_message_references_transactional(
            user_id, len(references))
        self.render_json({})


class SuggestionEmailHandler(base.BaseHandler):
    """Handler task of sending email of suggestion."""

    def post(self):
        payload = json.loads(self.request.body)
        exploration_id = payload['exploration_id']
        thread_id = payload['thread_id']

        exploration_rights = (
            rights_manager.get_exploration_rights(exploration_id))
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        suggestion = suggestion_services.get_suggestion_by_id(thread_id)

        email_manager.send_suggestion_email(
            exploration.title, exploration.id, suggestion.author_id,
            exploration_rights.owner_ids)
        self.render_json({})


class InstantFeedbackMessageEmailHandler(base.BaseHandler):
    """Handles task of sending feedback message emails instantly."""

    def post(self):
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        reference_dict = payload['reference_dict']

        message = feedback_services.get_message(
            reference_dict['thread_id'], reference_dict['message_id'])
        exploration = exp_fetchers.get_exploration_by_id(
            reference_dict['entity_id'])
        thread = feedback_services.get_thread(reference_dict['thread_id'])
        feedback_thread_reply_info = (
            email_services.get_feedback_thread_reply_info_by_user_and_thread(
                user_id, reference_dict['thread_id']))
        if feedback_thread_reply_info is None:
            raise self.InvalidInputException(
                'Feedback thread for current user and thread_id does not exist')

        subject = 'New Oppia message in "%s"' % thread.subject
        email_manager.send_instant_feedback_message_email(
            user_id, message.author_id, message.text, subject,
            exploration.title, reference_dict['entity_id'],
            thread.subject, reply_to_id=feedback_thread_reply_info.reply_to_id)
        self.render_json({})


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
        exploration = exp_fetchers.get_exploration_by_id(
            reference_dict['entity_id'])
        thread = feedback_services.get_thread(reference_dict['thread_id'])

        text = 'changed status from %s to %s' % (old_status, new_status)
        subject = 'Oppia thread status change: "%s"' % thread.subject
        email_manager.send_instant_feedback_message_email(
            user_id, message.author_id, text, subject, exploration.title,
            reference_dict['entity_id'], thread.subject)
        self.render_json({})


class FlagExplorationEmailHandler(base.BaseHandler):
    """Handles task of sending emails about flagged explorations
    to moderators.
    """

    def post(self):
        payload = json.loads(self.request.body)
        exploration_id = payload['exploration_id']
        report_text = payload['report_text']
        reporter_id = payload['reporter_id']

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        email_manager.send_flag_exploration_email(
            exploration.title, exploration_id, reporter_id, report_text)
        self.render_json({})


class DeferredTasksHandler(base.BaseHandler):
    """This task handler handles special tasks that make single asynchronous
    function calls. For more complex tasks that require a large number of
    function calls, the correct approach is to create a special url handler that
    handles that specific task. However, it doesn't make sense to create a url
    handler for single function calls. This handler handles those cases.

    The convention of function ids and an explanation of the different queue
    names exists in 'core/domain/taskqueue_services.py' file.
    """

    DEFERRED_TASK_FUNCTIONS = {
        taskqueue_services.FUNCTION_ID_DISPATCH_EVENT: (
            jobs_registry.ContinuousComputationEventDispatcher.dispatch_event),
        taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS: (
            exp_services.delete_explorations_from_user_models),
        taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES: (
            exp_services.delete_explorations_from_activities),
        taskqueue_services.FUNCTION_ID_REGENERATE_EXPLORATION_SUMMARY: (
            exp_services.regenerate_exploration_summary_with_new_contributor),
        taskqueue_services.FUNCTION_ID_UPDATE_STATS: (
            stats_services.update_stats),
        taskqueue_services.FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS: (
            question_services.untag_deleted_misconceptions),
        taskqueue_services.FUNCTION_ID_REMOVE_USER_FROM_RIGHTS_MODELS: (
            wipeout_service
            .remove_user_from_activities_with_associated_rights_models)
    }

    def post(self):
        payload = json.loads(self.request.body.decode())
        if 'fn_identifier' not in payload:
            raise Exception(
                'This request cannot defer tasks because it does not contain a '
                'function identifier attribute (fn_identifier). Deferred tasks '
                'must contain a function_identifier in the payload.')
        if payload['fn_identifier'] not in self.DEFERRED_TASK_FUNCTIONS:
            raise Exception(
                'The function id, %s, is not valid.' %
                python_utils.convert_to_bytes(payload['fn_identifier']))

        deferred_task_function = self.DEFERRED_TASK_FUNCTIONS[
            payload['fn_identifier']]
        deferred_task_function(*payload['args'], **payload['kwargs'])
        self.render_json({})

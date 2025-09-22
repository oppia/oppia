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

from __future__ import annotations

import json

from core import feconf
from core.controllers import acl_decorators, base
from core.domain import (
    email_manager,
    exp_fetchers,
    exp_services,
    feedback_services,
    question_services,
    stats_services,
    suggestion_registry,
    taskqueue_services,
    voiceover_services,
    wipeout_service,
)

from typing import Callable, Dict


class UnsentFeedbackEmailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler task of sending emails of feedback messages."""

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Processes feedback messages for a user."""
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        references = feedback_services.get_feedback_message_references(user_id)
        if not references:
            # Model may not exist if user has already attended to the feedback.
            return

        feedback_services.update_feedback_email_retries_transactional(user_id)

        messages: Dict[str, email_manager.FeedbackMessagesDict] = {}
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


class ContributorDashboardAchievementEmailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler task of sending email of contributor dashboard achievements."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'contributor_user_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'contribution_type': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'contribution_sub_type': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'language_code': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'rank_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Sends an email notification to a contributor."""
        payload = json.loads(self.request.body)
        contributor_user_id = payload['contributor_user_id']
        contribution_type = payload['contribution_type']
        contribution_sub_type = payload['contribution_sub_type']
        language_code = payload['language_code']
        rank_name = payload['rank_name']

        email_info = suggestion_registry.ContributorMilestoneEmailInfo(
            contributor_user_id, contribution_type, contribution_sub_type,
            language_code, rank_name)

        email_manager.send_mail_to_notify_contributor_ranking_achievement(
            email_info)
        self.render_json({})


class InstantFeedbackMessageEmailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles task of sending feedback message emails instantly."""

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Sends an email notification to a user."""
        payload = json.loads(self.request.body)
        user_id = payload['user_id']
        reference_dict = payload['reference_dict']

        message = feedback_services.get_message(
            reference_dict['thread_id'], reference_dict['message_id'])
        exploration = exp_fetchers.get_exploration_by_id(
            reference_dict['entity_id'])
        thread = feedback_services.get_thread(reference_dict['thread_id'])

        subject = 'New Oppia message in "%s"' % thread.subject
        email_manager.send_instant_feedback_message_email(
            user_id, message.author_id, message.text, subject,
            exploration.title, reference_dict['entity_id'], thread.subject)
        self.render_json({})


class FeedbackThreadStatusChangeEmailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles task of sending email instantly when feedback thread status is
    changed.
    """

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Sends an email notification to a user."""
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


class FlagExplorationEmailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles task of sending emails about flagged explorations
    to moderators.
    """

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Sends an email notification to administrators."""
        payload = json.loads(self.request.body)
        exploration_id = payload['exploration_id']
        report_text = payload['report_text']
        reporter_id = payload['reporter_id']

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        email_manager.send_flag_exploration_email(
            exploration.title, exploration_id, reporter_id, report_text)
        self.render_json({})


class DeferredTasksHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """This task handler handles special tasks that make single asynchronous
    function calls. For more complex tasks that require a large number of
    function calls, the correct approach is to create a special url handler that
    handles that specific task. However, it doesn't make sense to create a url
    handler for single function calls. This handler handles those cases.

    The convention of function ids and an explanation of the different queue
    names exists in 'core/domain/taskqueue_services.py' file.
    """

    fn_ids_to_names = (
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS)

    DEFERRED_TASK_FUNCTIONS: Dict[str, Callable[..., None]] = {
        fn_ids_to_names[
            'FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS']: (
                exp_services.delete_explorations_from_user_models),
        fn_ids_to_names[
            'FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES']: (
                exp_services.delete_explorations_from_activities),
        fn_ids_to_names[
            'FUNCTION_ID_DELETE_USERS_PENDING_TO_BE_DELETED']: (
                wipeout_service.delete_users_pending_to_be_deleted),
        fn_ids_to_names[
            'FUNCTION_ID_CHECK_COMPLETION_OF_USER_DELETION']: (
                wipeout_service.check_completion_of_user_deletion),
        fn_ids_to_names[
            'FUNCTION_ID_REGENERATE_EXPLORATION_SUMMARY']: (
                exp_services.
                regenerate_exploration_summary_with_new_contributor),
        fn_ids_to_names[
            'FUNCTION_ID_UPDATE_STATS']: stats_services.update_stats,
        fn_ids_to_names[
            'FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS']: (
                question_services.untag_deleted_misconceptions),
        fn_ids_to_names[
            'FUNCTION_ID_REMOVE_USER_FROM_RIGHTS_MODELS']: (
                wipeout_service
                .remove_user_from_activities_with_associated_rights_models),
        fn_ids_to_names[
            'FUNCTION_ID_REGENERATE_VOICEOVER_ON_EXP_UPDATE']: (
                voiceover_services.regenerate_voiceover_for_updated_exploration)
    }

    @acl_decorators.can_perform_tasks_in_taskqueue
    def post(self) -> None:
        """Defers tasks for execution in the background.

        Raises:
            Exception. This request cannot defer tasks because it does not
                contain a function identifier attribute (fn_identifier).
                Deferred tasks must contain a function_identifier in the
                payload.
        """
        # The request body has bytes type, thus we need to decode it first.
        payload = json.loads(self.request.body.decode('utf-8'))
        if 'fn_identifier' not in payload:
            raise Exception(
                'This request cannot defer tasks because it does not contain a '
                'function identifier attribute (fn_identifier). Deferred tasks '
                'must contain a function_identifier in the payload.')
        if payload['fn_identifier'] not in self.DEFERRED_TASK_FUNCTIONS:
            raise Exception(
                'The function id, %s, is not valid.' % payload['fn_identifier'])

        if 'cloud_task_model_id' not in payload:
            raise Exception(
                'The payload must contain a cloud_task_model_id attribute.')

        cloud_task_model_id = payload['cloud_task_model_id']
        cloud_task_run_domain_instance = (
            taskqueue_services.get_cloud_task_run_by_model_id(
                cloud_task_model_id))
        assert cloud_task_run_domain_instance is not None
        cloud_task_run_domain_instance.latest_job_state = 'RUNNING'

        try:
            deferred_task_function = self.DEFERRED_TASK_FUNCTIONS[
                payload['fn_identifier']]
            deferred_task_function(*payload['args'], **payload['kwargs'])

            cloud_task_run_domain_instance.latest_job_state = 'SUCCEEDED'

            taskqueue_services.update_cloud_task_run_model(
                cloud_task_run_domain_instance)
        except Exception as e:
            # The maximum number of retries is enforced only for voiceover
            # regeneration tasks, as these depend on a cloud service. Retrying
            # indefinitely without investigating failures could result in
            # unnecessary resource usage.
            if (
                cloud_task_run_domain_instance.current_retry_attempt ==
                    taskqueue_services.CLOUD_TASK_MAX_RETRIES and
                cloud_task_run_domain_instance.queue_id ==
                    taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION
            ):
                cloud_task_run_domain_instance.latest_job_state = (
                    'PERMANENTLY_FAILED')
            else:
                cloud_task_run_domain_instance.current_retry_attempt += 1
                cloud_task_run_domain_instance.latest_job_state = (
                    'FAILED_AND_AWAITING_RETRY')

            (
                cloud_task_run_domain_instance.
                exception_messages_for_failed_runs.append(str(e))
            )

            taskqueue_services.update_cloud_task_run_model(
                cloud_task_run_domain_instance)

            raise Exception('Error running deferred task: %s' % e) from e

        self.render_json({})

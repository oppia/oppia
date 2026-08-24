# coding: utf-8

# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Methods for validating domain objects for schema validation of
handler arguments.
"""

from __future__ import annotations

import re
import urllib.parse

from core import feconf, utils
from core.constants import constants
from core.controllers import base
from core.domain import (
    blog_domain,
    blog_services,
    change_domain,
    exp_domain,
    general_feedback_domain,
    image_validation_services,
    improvements_domain,
    platform_parameter_domain,
    platform_parameter_list,
    platform_parameter_registry,
    question_domain,
    skill_domain,
    state_domain,
    stats_domain,
)

from typing import Any, Dict, Mapping

# The required fields of a certificate assessment answer. These are
# immutable because the answer schema never changes at runtime.
REQUIRED_CERTIFICATE_ASSESSMENT_ANSWER_KEYS = frozenset(
    {'question_id', 'is_correct'}
)
# The optional field of a certificate assessment answer. When it is not
# provided, the selected_answer defaults to None, which represents an
# unanswered question.
OPTIONAL_CERTIFICATE_ASSESSMENT_ANSWER_KEYS = frozenset({'selected_answer'})


def validate_suggestion_change(
    obj: Mapping[str, change_domain.AcceptableChangeDictTypes],
) -> Mapping[str, change_domain.AcceptableChangeDictTypes]:
    """Validates Exploration or Question change.

    Args:
        obj: dict. Data that needs to be validated.

    Returns:
        dict. Returns suggestion change dict after validation.
    """
    # No explicit call to validate_dict is required, because
    # ExplorationChange or QuestionSuggestionChange calls
    # validate method while initialization.
    if obj.get('cmd') is None:
        raise base.BaseHandler.InvalidInputException(
            'Missing cmd key in change dict'
        )

    exp_change_commands = [
        command['name']
        for command in exp_domain.ExplorationChange.ALLOWED_COMMANDS
    ]
    question_change_commands = [
        command['name']
        for command in question_domain.QuestionChange.ALLOWED_COMMANDS
    ]

    if obj['cmd'] in exp_change_commands:
        exp_domain.ExplorationChange(obj)
    elif obj['cmd'] in question_change_commands:
        question_domain.QuestionSuggestionChange(obj)
    else:
        raise base.BaseHandler.InvalidInputException(
            '%s cmd is not allowed.' % obj['cmd']
        )
    return obj


def validate_platform_params_values_for_blog_admin(
    new_platform_parameter_values: Mapping[
        str, platform_parameter_domain.PlatformDataTypes
    ],
) -> Mapping[str, platform_parameter_domain.PlatformDataTypes]:
    """Validates new platform parameter values.

    Args:
        new_platform_parameter_values: dict. Data that needs to be validated.

    Returns:
        dict(str, PlatformDataTypes). Returns the dict after validation.

    Raises:
        Exception. The name of the platform parameter is not of type string.
        Exception. The value of the platform parameter is not of valid type.
        Exception. The max_number_of_tags_assigned_to_blog_post platform
            parameter has incoming value less than or equal to 0.
    """
    for name, value in new_platform_parameter_values.items():
        if not isinstance(name, str):
            raise Exception(
                'Platform parameter name should be a string, received'
                ': %s' % name
            )

        if not isinstance(value, (bool, float, int, str)):
            raise Exception(
                'The value of %s platform parameter is not of valid type, '
                'it should be one of %s.'
                % (name, str(platform_parameter_domain.PlatformDataTypes))
            )

        parameter = platform_parameter_registry.Registry.get_platform_parameter(
            name
        )

        if not (
            (isinstance(value, bool) and parameter.data_type == 'bool')
            or (isinstance(value, str) and parameter.data_type == 'string')
            or (isinstance(value, float) and parameter.data_type == 'number')
            or (isinstance(value, int) and parameter.data_type == 'number')
        ):
            raise Exception(
                'The value of platform parameter %s is of type \'%s\', '
                'expected it to be of type \'%s\''
                % (name, value, parameter.data_type)
            )

        if (
            name
            == platform_parameter_list.ParamName.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
        ):
            assert isinstance(value, int)
            if value <= 0:
                raise Exception(
                    'The value of %s should be greater than 0, it is %s.'
                    % (name, value)
                )
    # The new_platform_parameter_values do not represent a domain class directly
    # and in the handler these dict values are used to set platform parameters
    # individually. Hence conversion of dicts to domain objects is not required
    # for new_platform_parameter_values.
    return new_platform_parameter_values


def validate_new_default_value_of_platform_parameter(
    default_value: Mapping[str, platform_parameter_domain.PlatformDataTypes],
) -> Mapping[str, platform_parameter_domain.PlatformDataTypes]:
    """Validates new default value of platform parameter.

    Args:
        default_value: dict. Data that needs to be validated.

    Returns:
        dict(str, PlatformDataTypes). Returns the default value dict after
        validating.

    Raises:
        Exception. The default_value is not of valid type.
    """

    if not isinstance(default_value['value'], (bool, float, int, str)):
        raise Exception(
            'Expected type to be %s but received %s'
            % (
                platform_parameter_domain.PlatformDataTypes,
                default_value['value'],
            )
        )

    # The default_value values do not represent a domain class directly
    # and in the handler it is used to set the default value of the platform
    # parameter. Hence conversion of dicts to domain objects is not required
    # for default_value.
    return default_value


def validate_change_dict_for_blog_post(
    change_dict: blog_services.BlogPostChangeDict,
) -> blog_services.BlogPostChangeDict:
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        dict. Returns the change_dict after validation.

    Raises:
        Exception. Invalid tags provided.
    """
    if 'title' in change_dict:
        blog_domain.BlogPost.require_valid_title(change_dict['title'], True)
    if 'thumbnail_filename' in change_dict:
        blog_domain.BlogPost.require_valid_thumbnail_filename(
            change_dict['thumbnail_filename']
        )
    if 'tags' in change_dict:
        blog_domain.BlogPost.require_valid_tags(change_dict['tags'], False)
        # Validates that the tags in the change dict are from the list of
        # default tags set by admin.
        list_of_default_tags = constants.LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST
        assert list_of_default_tags is not None
        list_of_default_tags_value = list_of_default_tags
        if not all(
            tag in list_of_default_tags_value for tag in change_dict['tags']
        ):
            raise Exception(
                'Invalid tags provided. Tags not in default tags list.'
            )
    # The method returns a dict containing blog post properties, they are used
    # to update blog posts in the domain layer. This dict does not correspond
    # to any domain class so we are validating the fields of change_dict
    # as a part of schema validation.
    return change_dict


def validate_certificate_assessment_answer(
    # Here we use type Any because the answer dict is raw JSON payload data,
    # so its values can be int, float, str, dict, list, or None.
    answer_dict: Mapping[str, Any],
    # Here we use type Any because the returned dict mirrors the raw answer
    # dict, whose selected_answer value can be any of the accepted types.
) -> Dict[str, Any]:
    """Validates a single answer submitted for a certificate assessment.

    The answer dict does not correspond to any domain class, so the fields
    are validated here as a part of schema validation. The selected_answer
    key is optional and, when omitted, defaults to None, which represents an
    unanswered question.

    Args:
        answer_dict: dict. The raw answer dict submitted by the client.

    Returns:
        dict. The normalized answer dict containing question_id,
        selected_answer, and is_correct.

    Raises:
        Exception. The answer dict is not valid.
    """
    if not isinstance(answer_dict, dict):
        raise Exception('Expected dict, received %s' % answer_dict)

    expected_keys = REQUIRED_CERTIFICATE_ASSESSMENT_ANSWER_KEYS
    missing_keys = expected_keys - set(answer_dict.keys())
    extra_keys = (
        set(answer_dict.keys())
        - expected_keys
        - OPTIONAL_CERTIFICATE_ASSESSMENT_ANSWER_KEYS
    )
    if missing_keys or extra_keys:
        raise Exception(
            'Missing keys: %s, Extra keys: %s'
            % (sorted(missing_keys), sorted(extra_keys))
        )

    question_id = answer_dict['question_id']
    if not isinstance(question_id, str) or not question_id:
        raise Exception('question_id must be a non-empty string.')
    is_correct = answer_dict['is_correct']
    if not isinstance(is_correct, bool):
        raise Exception('is_correct must be a boolean.')
    selected_answer = answer_dict.get('selected_answer')

    return {
        'question_id': question_id,
        'selected_answer': selected_answer,
        'is_correct': is_correct,
    }


def validate_state_dict(
    state_dict: state_domain.StateDict,
) -> state_domain.StateDict:
    """Validates state dict.

    Args:
        state_dict: dict. The dict representation of State object.

    Returns:
        State. The state_dict after validation.
    """
    state_object = state_domain.State.from_dict(state_dict)
    state_object.validate(
        exp_param_specs_dict=None, allow_null_interaction=True
    )
    # State dict is used as dictionary form in the handler and the data is not
    # transferred into the domain layer. Hence dict form of the data is returned
    # after schema validation.
    return state_dict


def validate_question_state_dict(
    question_state_dict: state_domain.StateDict,
) -> state_domain.StateDict:
    """Validates state dict for a question.

    Args:
        question_state_dict: dict. The dict representation of State object for
            a question.

    Returns:
        State. The question_state_dict after validation.
    """
    question_state_object = state_domain.State.from_dict(question_state_dict)
    # 'tagged_skill_misconception_id_required' is not None when a state is part
    # of a Question object that tests a particular skill.
    question_state_object.validate(
        exp_param_specs_dict=None,
        allow_null_interaction=True,
        tagged_skill_misconception_id_required=True,
    )

    return question_state_dict


def validate_task_entries(
    task_entries: improvements_domain.TaskEntryDict,
) -> improvements_domain.TaskEntryDict:
    """Validates the task entry dict.

    Args:
        task_entries: dict. Data that needs to be validated.

    Returns:
        dict. Returns the task entries dict after validation.
    """
    entity_version = task_entries.get('entity_version', None)
    if entity_version is None:
        raise base.BaseHandler.InvalidInputException(
            'No entity_version provided'
        )
    task_type = task_entries.get('task_type', None)
    if task_type is None:
        raise base.BaseHandler.InvalidInputException('No task_type provided')
    target_id = task_entries.get('target_id', None)
    if target_id is None:
        raise base.BaseHandler.InvalidInputException('No target_id provided')
    status = task_entries.get('status', None)
    if status is None:
        raise base.BaseHandler.InvalidInputException('No status provided')
    # For creating the TaskEntry domain object, we have to include the
    # exploration_id and the user_id which are not included in the
    # task_entry_dict. Thus, it is not possible to create the full
    # domain object at the payload validation stage. Hence, the key-value pairs
    # of task_entry_dict are being validated as a part of schema validation.
    return task_entries


def validate_aggregated_stats(
    aggregated_stats: stats_domain.AggregatedStatsDict,
) -> stats_domain.AggregatedStatsDict:
    """Validates the attribute stats dict.

    Args:
        aggregated_stats: dict. Data that needs to be validated.

    Returns:
        dict. Data after validation.

    Raises:
        InvalidInputException. Property not in aggregated stats dict.
    """
    return stats_domain.SessionStateStats.validate_aggregated_stats_dict(
        aggregated_stats
    )


def validate_suggestion_images(files: Dict[str, bytes]) -> Dict[str, bytes]:
    """Validates the files dict.

    Args:
        files: dict. Data that needs to be validated.

    Returns:
        dict. Returns the dict after validation.
    """
    for filename, raw_image in files.items():
        image_validation_services.validate_image_and_filename(
            raw_image, filename
        )
    # The files argument do not represent any domain class, hence dict form
    # of the data is returned from here.
    return files


def validate_skill_ids(comma_separated_skill_ids: str) -> str:
    """Checks whether the given skill ids are valid.

    Args:
        comma_separated_skill_ids: str. Comma separated skill IDs.

    Returns:
        str. The comma separated skill ids after validation.
    """
    skill_ids = comma_separated_skill_ids.split(',')
    skill_ids = list(set(skill_ids))
    try:
        for skill_id in skill_ids:
            skill_domain.Skill.require_valid_skill_id(skill_id)
    except utils.ValidationError as e:
        raise base.BaseHandler.InvalidInputException('Invalid skill id') from e

    return comma_separated_skill_ids


def is_feedback_submission_from_allowed_feedback_page_hostname(
    hostname: str,
) -> bool:
    """Checks whether the given hostname is allowed for feedback submission.

    Args:
        hostname: str. The hostname to be checked.

    Returns:
        bool. True if the hostname is allowed for feedback submission, False otherwise.
    """
    normalized_hostname = hostname.strip().lower()
    allowed_hostnames = (
        feconf.ALLOWED_FEEDBACK_PAGE_HOSTS
        if not feconf.ENV_IS_OPPIA_ORG_PRODUCTION_SERVER
        else ()
    )
    return normalized_hostname in allowed_hostnames or any(
        normalized_hostname == suffix
        or normalized_hostname.endswith('.%s' % suffix)
        for suffix in feconf.ALLOWED_FEEDBACK_PAGE_HOST_SUFFIXES
    )


def validate_general_feedback_page_url(page_url: str) -> str:
    """Validates the reported page URL for feedback submission.

    Args:
        page_url: str. The page URL to be validated.

    Returns:
        str. The validated page URL.
    """
    normalized_page_url = page_url.strip()
    if len(normalized_page_url) > feconf.MAX_PAGE_URL_LENGTH:
        raise base.BaseHandler.InvalidInputException(
            'Page URL exceeds maximum length of %d characters.'
            % feconf.MAX_PAGE_URL_LENGTH
        )
    parsed_url = urllib.parse.urlparse(normalized_page_url)
    if parsed_url.scheme not in ('http', 'https') or not parsed_url.hostname:
        raise base.BaseHandler.InvalidInputException(
            'Page URL must start with http:// or https://.'
        )
    if not is_feedback_submission_from_allowed_feedback_page_hostname(
        parsed_url.hostname
    ):
        raise base.BaseHandler.InvalidInputException(
            'Hostname of the page URL is not allowed for feedback submission.'
        )
    return normalized_page_url


# Here we use object because session-info diagnostics are heterogeneous
# JSON-like payloads (nested dict/list values) from client logs.
def validate_feedback_session_info_log_entries(
    session_info: Dict[str, object],
) -> Dict[str, object]:
    """Validates the session info log entries for feedback submission.

    Args:
        session_info: dict. The session info log entries to be validated.

    Returns:
        dict. The validated session info log entries.
    """
    unknown_keys = set(session_info.keys()) - set(
        feconf.ALLOWED_SESSION_INFO_TOP_LEVEL_KEYS
    )
    if unknown_keys:
        raise base.BaseHandler.InvalidInputException(
            'Session info contains unknown keys: %s' % ', '.join(unknown_keys)
        )
    console_logs = session_info.get('console_logs', [])
    if not isinstance(console_logs, list):
        raise base.BaseHandler.InvalidInputException(
            'console_logs should be a list.'
        )
    failed_requests = session_info.get('failed_requests', [])
    if not isinstance(failed_requests, list):
        raise base.BaseHandler.InvalidInputException(
            'failed_requests should be a list.'
        )
    navigation_history = session_info.get('navigation_history', [])
    if not isinstance(navigation_history, list):
        raise base.BaseHandler.InvalidInputException(
            'navigation_history should be a list.'
        )
    environment = session_info.get('environment', {})
    if not isinstance(environment, dict):
        raise base.BaseHandler.InvalidInputException(
            'environment should be a dict.'
        )
    if (
        len(console_logs) > feconf.MAX_SESSION_INFO_LOG_ENTRIES
        or len(failed_requests) > feconf.MAX_SESSION_INFO_LOG_ENTRIES
        or len(navigation_history) > feconf.MAX_NAVIGATION_HISTORY_ENTRIES
    ):
        raise base.BaseHandler.InvalidInputException(
            'Session info log entries exceed maximum allowed limit.'
        )

    for entry in console_logs:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'console_logs should be a list of dicts.'
            )
        error_message = entry.get('error_message')
        if not isinstance(error_message, str):
            raise base.BaseHandler.InvalidInputException(
                'error_message in console_logs should be a string.'
            )
        if len(error_message) > feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'error_message in console_logs exceeds maximum length of %d characters.'
                % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info console_logs.timestamp_msecs should be an int.'
            )
        log_level = entry.get('log_level')
        if log_level is not None and log_level not in (
            'error',
            'warn',
            'log',
            'info',
            'debug',
        ):
            raise base.BaseHandler.InvalidInputException(
                'Invalid log_level in console_logs.'
            )
        stack_trace = entry.get('stack_trace')
        if stack_trace is not None:
            if not isinstance(stack_trace, str):
                raise base.BaseHandler.InvalidInputException(
                    'stack_trace in console_logs should be a string.'
                )
            if len(stack_trace) > feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'stack_trace in console_logs exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH
                )
    for entry in failed_requests:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'failed_requests should be a list of dicts.'
            )
        url = entry.get('url')
        if not isinstance(url, str):
            raise base.BaseHandler.InvalidInputException(
                'url in failed_requests should be a string.'
            )
        if len(url) > feconf.MAX_PAGE_URL_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'url in failed_requests exceeds maximum length of %d characters.'
                % feconf.MAX_PAGE_URL_LENGTH
            )
        method = entry.get('method')
        if not isinstance(method, str):
            raise base.BaseHandler.InvalidInputException(
                'method in failed_requests should be a string.'
            )
        if len(method) > feconf.MAX_SESSION_INFO_METHOD_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'method in failed_requests exceeds maximum length of %d characters.'
                % feconf.MAX_SESSION_INFO_METHOD_LENGTH
            )
        if not isinstance(entry.get('status_code'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info failed_requests.status_code should be an int.'
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info failed_requests.timestamp_msecs '
                'should be an int.'
            )
        status_text = entry.get('status_text')
        if status_text is not None:
            if not isinstance(status_text, str):
                raise base.BaseHandler.InvalidInputException(
                    'status_text in failed_requests should be a string.'
                )
            if len(status_text) > feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'status_text in failed_requests exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH
                )
        error_message = entry.get('error_message')
        if error_message is not None:
            if not isinstance(error_message, str):
                raise base.BaseHandler.InvalidInputException(
                    'error_message in failed_requests should be a string.'
                )
            if len(error_message) > feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'error_message in failed_requests exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH
                )
    for entry in navigation_history:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'navigation_history should be a list of dicts.'
            )
        path = entry.get('path')
        if not isinstance(path, str):
            raise base.BaseHandler.InvalidInputException(
                'path in navigation_history should be a string.'
            )
        if len(path) > feconf.MAX_PAGE_URL_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'path in navigation_history exceeds maximum length of %d characters.'
                % feconf.MAX_PAGE_URL_LENGTH
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info navigation_history.timestamp_msecs '
                'should be an int.'
            )

    user_agent = environment.get('user_agent')
    if not isinstance(user_agent, str):
        raise base.BaseHandler.InvalidInputException(
            'user_agent in environment should be a string.'
        )
    if len(user_agent) > feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH:
        raise base.BaseHandler.InvalidInputException(
            'user_agent in environment exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH
        )
    page = environment.get('page')
    if not isinstance(page, dict):
        raise base.BaseHandler.InvalidInputException(
            'page in environment should be a dict.'
        )
    for key in ('url', 'title'):
        if not isinstance(page.get(key), str):
            raise base.BaseHandler.InvalidInputException(
                'Session info page.%s should be a string.' % key
            )
        if len(page[key]) > feconf.MAX_SESSION_INFO_PAGE_FIELD_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'Session info page.%s is too long.' % key
            )

    normalized_page_url = validate_general_feedback_page_url(page['url'])

    viewport_info = environment.get('viewport')
    if not isinstance(viewport_info, dict):
        raise base.BaseHandler.InvalidInputException(
            'Session info viewport should be a dict.'
        )
    for key in ('width', 'height'):
        if not isinstance(viewport_info.get(key), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info viewport.%s should be an int.' % key
            )

    locale_info = environment.get('locale')
    if not isinstance(locale_info, dict):
        raise base.BaseHandler.InvalidInputException(
            'Session info locale should be a dict.'
        )
    language_code = locale_info.get('language_code')
    if not isinstance(language_code, str):
        raise base.BaseHandler.InvalidInputException(
            'Session info locale.language_code should be a string.'
        )
    if not utils.is_valid_language_code(language_code):
        raise base.BaseHandler.InvalidInputException(
            'Session info locale.language_code is invalid.'
        )
    direction = locale_info.get('direction')
    if direction not in ('ltr', 'rtl'):
        raise base.BaseHandler.InvalidInputException(
            'Session info locale.direction should be "ltr" or "rtl".'
        )

    client_time_msecs = environment.get('client_time_msecs')
    timezone_offset_mins = environment.get('timezone_offset_mins')
    if not isinstance(client_time_msecs, int):
        raise base.BaseHandler.InvalidInputException(
            'Session info client_time_msecs should be an int.'
        )
    if not isinstance(timezone_offset_mins, int):
        raise base.BaseHandler.InvalidInputException(
            'Session info timezone_offset_mins should be an int.'
        )

    return {
        'console_logs': console_logs,
        'failed_requests': failed_requests,
        'navigation_history': navigation_history,
        'environment': {
            'client_time_msecs': client_time_msecs,
            'timezone_offset_mins': timezone_offset_mins,
            'user_agent': user_agent,
            'viewport': {
                'width': viewport_info['width'],
                'height': viewport_info['height'],
            },
            'page': {
                'url': normalized_page_url,
                'title': page['title'],
            },
            'locale': {
                'language_code': language_code,
                'direction': direction,
            },
        },
    }


def validate_lesson_feedback_submit_payload_coupling(
    payload: general_feedback_domain.FeedbackSubmitPayloadDict,
) -> None:
    """Validates cross-field constraints for FeedbackSubmitHandler POST payload."""
    feedback_text = payload.get('feedback_text', '')
    if not isinstance(feedback_text, str) or not feedback_text.strip():
        raise base.BaseHandler.InvalidInputException(
            'feedback_text must not be empty.'
        )

    lesson_metadata = payload.get('lesson_metadata')
    if lesson_metadata is None:
        raise base.BaseHandler.InvalidInputException(
            'lesson_metadata is required for lesson feedback.'
        )

    validate_lesson_metadata_fields(lesson_metadata)


def validate_platform_feedback_submit_payload_coupling(
    payload: general_feedback_domain.PlatformFeedbackSubmitPayloadDict,
) -> None:
    """Validates cross-field constraints for PlatformFeedbackSubmitHandler POST."""
    report_message = payload.get('report_message', '')
    if not isinstance(report_message, str) or not report_message.strip():
        raise base.BaseHandler.InvalidInputException(
            'report_message must not be empty.'
        )

    source = payload.get('source')
    lesson_metadata = payload.get('lesson_metadata')
    if source == 'lesson':
        if lesson_metadata is None:
            raise base.BaseHandler.InvalidInputException(
                'lesson_metadata is required for lesson reports.'
            )
        validate_lesson_metadata_fields(lesson_metadata)

    elif source == 'app':
        category = payload.get('category')
        if category is not None:
            raise base.BaseHandler.InvalidInputException(
                'category must be omitted for site reports.'
            )
        if lesson_metadata is not None:
            raise base.BaseHandler.InvalidInputException(
                'lesson_metadata must be omitted for site reports.'
            )

    include_technical_logs = payload.get('include_technical_logs', False)
    session_info = payload.get('session_info')

    if include_technical_logs and session_info is None:
        raise base.BaseHandler.InvalidInputException(
            'session_info must be provided when include_technical_logs is True.'
        )
    if not include_technical_logs and session_info is not None:
        raise base.BaseHandler.InvalidInputException(
            'session_info must be omitted when include_technical_logs is False.'
        )

    screenshot_filename = payload.get('screenshot_filename')
    screenshot_file = payload.get('screenshot_file')

    if screenshot_filename is not None and screenshot_file is None:
        raise base.BaseHandler.InvalidInputException(
            'screenshot_file is required when screenshot_filename is provided.'
        )
    if screenshot_file is not None and screenshot_filename is None:
        raise base.BaseHandler.InvalidInputException(
            'screenshot_filename is required when screenshot_file is provided.'
        )
    if screenshot_filename is not None and isinstance(screenshot_filename, str):
        if (
            re.fullmatch(
                utils.get_image_filename_regex_pattern(),
                screenshot_filename,
            )
            is None
        ):
            raise base.BaseHandler.InvalidInputException(
                'screenshot_filename is invalid.'
            )


def validate_lesson_metadata_fields(
    lesson_metadata: general_feedback_domain.LessonMetadataDict,
) -> general_feedback_domain.LessonMetadataDict:
    """Validates field presence and types within a lesson_metadata dict."""
    exploration_id = lesson_metadata.get('exploration_id')
    if not isinstance(exploration_id, str) or not exploration_id:
        raise base.BaseHandler.InvalidInputException(
            'lesson_metadata.exploration_id must be a non-empty string.'
        )

    exploration_version = lesson_metadata.get('exploration_version')
    if not isinstance(exploration_version, int) or exploration_version < 0:
        raise base.BaseHandler.InvalidInputException(
            'lesson_metadata.exploration_version must be an integer.'
        )

    state_name = lesson_metadata.get('state_name')
    if not isinstance(state_name, str) or not state_name:
        raise base.BaseHandler.InvalidInputException(
            'lesson_metadata.state_name must be a non-empty string.'
        )

    state_index = lesson_metadata.get('state_index')
    if not isinstance(state_index, int) or state_index < 0:
        raise base.BaseHandler.InvalidInputException(
            'lesson_metadata.state_index must be a non-negative integer.'
        )
    return lesson_metadata

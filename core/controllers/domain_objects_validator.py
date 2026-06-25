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

from typing import Dict, Mapping, Optional, Union


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


def validate_email_dashboard_data(
    data: Dict[str, Optional[Union[bool, int]]],
) -> Dict[str, Optional[Union[bool, int]]]:
    """Validates email dashboard data.

    Args:
        data: dict. Data that needs to be validated.

    Returns:
        dict. Returns the dict after validation.

    Raises:
        Exception. The key in 'data' is not one of the allowed keys.
    """
    predicates = constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
    possible_keys = [predicate['backend_attr'] for predicate in predicates]

    for key, value in data.items():
        if value is None:
            continue
        if key not in possible_keys:
            # Raise exception if key is not one of the allowed keys.
            raise Exception('400 Invalid input for query.')
    # The method returns a dict containing fields of email dashboard
    # query params. This dict represents the UserQueryParams class, which is a
    # namedtuple. Hence the fields of the dict are being validated as a part of
    # schema validation before saving new user queries in the handler.
    return data


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
def validate_general_feedback_session_info_log_entries(
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
    console_logs_json = session_info.get('console_logs_json', [])
    if not isinstance(console_logs_json, list):
        raise base.BaseHandler.InvalidInputException(
            'console_logs_json should be a list.'
        )
    failed_requests_json = session_info.get('failed_requests_json', [])
    if not isinstance(failed_requests_json, list):
        raise base.BaseHandler.InvalidInputException(
            'failed_requests_json should be a list.'
        )
    navigation_history_json = session_info.get('navigation_history_json', [])
    if not isinstance(navigation_history_json, list):
        raise base.BaseHandler.InvalidInputException(
            'navigation_history_json should be a list.'
        )
    environment_json = session_info.get('environment_json', {})
    if not isinstance(environment_json, dict):
        raise base.BaseHandler.InvalidInputException(
            'environment_json should be a dict.'
        )
    if (
        len(console_logs_json) > feconf.MAX_SESSION_INFO_LOG_ENTRIES
        or len(failed_requests_json) > feconf.MAX_SESSION_INFO_LOG_ENTRIES
        or len(navigation_history_json) > feconf.MAX_NAVIGATION_HISTORY_ENTRIES
    ):
        raise base.BaseHandler.InvalidInputException(
            'Session info log entries exceed maximum allowed limit.'
        )

    for entry in console_logs_json:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'console_logs_json should be a list of dicts.'
            )
        error_message = entry.get('error_message')
        if not isinstance(error_message, str):
            raise base.BaseHandler.InvalidInputException(
                'error_message in console_logs_json should be a string.'
            )
        if len(error_message) > feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'error_message in console_logs_json exceeds maximum length of %d characters.'
                % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info console_logs_json.timestamp_msecs '
                'should be an int.'
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
                'Invalid log_level in console_logs_json.'
            )
        stack_trace = entry.get('stack_trace')
        if stack_trace is not None:
            if not isinstance(stack_trace, str):
                raise base.BaseHandler.InvalidInputException(
                    'stack_trace in console_logs_json should be a string.'
                )
            if len(stack_trace) > feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'stack_trace in console_logs_json exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH
                )
    for entry in failed_requests_json:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'failed_requests_json should be a list of dicts.'
            )
        url = entry.get('url')
        if not isinstance(url, str):
            raise base.BaseHandler.InvalidInputException(
                'url in failed_requests_json should be a string.'
            )
        if len(url) > feconf.MAX_PAGE_URL_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'url in failed_requests_json exceeds maximum length of %d characters.'
                % feconf.MAX_PAGE_URL_LENGTH
            )
        method = entry.get('method')
        if not isinstance(method, str):
            raise base.BaseHandler.InvalidInputException(
                'method in failed_requests_json should be a string.'
            )
        if len(method) > feconf.MAX_SESSION_INFO_METHOD_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'method in failed_requests_json exceeds maximum length of %d characters.'
                % feconf.MAX_SESSION_INFO_METHOD_LENGTH
            )
        if not isinstance(entry.get('status_code'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info failed_requests_json.status_code '
                'should be an int.'
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info failed_requests_json.timestamp_msecs '
                'should be an int.'
            )
        status_text = entry.get('status_text')
        if status_text is not None:
            if not isinstance(status_text, str):
                raise base.BaseHandler.InvalidInputException(
                    'status_text in failed_requests_json should be a string.'
                )
            if len(status_text) > feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'status_text in failed_requests_json exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH
                )
        error_message = entry.get('error_message')
        if error_message is not None:
            if not isinstance(error_message, str):
                raise base.BaseHandler.InvalidInputException(
                    'error_message in failed_requests_json should be a string.'
                )
            if len(error_message) > feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH:
                raise base.BaseHandler.InvalidInputException(
                    'error_message in failed_requests_json exceeds maximum length of %d characters.'
                    % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH
                )
    for entry in navigation_history_json:
        if not isinstance(entry, dict):
            raise base.BaseHandler.InvalidInputException(
                'navigation_history_json should be a list of dicts.'
            )
        path = entry.get('path')
        if not isinstance(path, str):
            raise base.BaseHandler.InvalidInputException(
                'path in navigation_history_json should be a string.'
            )
        if len(path) > feconf.MAX_PAGE_URL_LENGTH:
            raise base.BaseHandler.InvalidInputException(
                'path in navigation_history_json exceeds maximum length of %d characters.'
                % feconf.MAX_PAGE_URL_LENGTH
            )
        if not isinstance(entry.get('timestamp_msecs'), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info navigation_history_json.timestamp_msecs '
                'should be an int.'
            )

    user_agent = environment_json.get('user_agent')
    if not isinstance(user_agent, str):
        raise base.BaseHandler.InvalidInputException(
            'user_agent in environment_json should be a string.'
        )
    if len(user_agent) > feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH:
        raise base.BaseHandler.InvalidInputException(
            'user_agent in environment_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH
        )
    page = environment_json.get('page')
    if not isinstance(page, dict):
        raise base.BaseHandler.InvalidInputException(
            'page in environment_json should be a dict.'
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

    viewport_info = environment_json.get('viewport')
    if not isinstance(viewport_info, dict):
        raise base.BaseHandler.InvalidInputException(
            'Session info viewport should be a dict.'
        )
    for key in ('width', 'height'):
        if not isinstance(viewport_info.get(key), int):
            raise base.BaseHandler.InvalidInputException(
                'Session info viewport.%s should be an int.' % key
            )

    locale_info = environment_json.get('locale')
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

    client_time_msecs = environment_json.get('client_time_msecs')
    timezone_offset_mins = environment_json.get('timezone_offset_mins')
    if not isinstance(client_time_msecs, int):
        raise base.BaseHandler.InvalidInputException(
            'Session info client_time_msecs should be an int.'
        )
    if not isinstance(timezone_offset_mins, int):
        raise base.BaseHandler.InvalidInputException(
            'Session info timezone_offset_mins should be an int.'
        )

    return {
        'console_logs_json': console_logs_json,
        'failed_requests_json': failed_requests_json,
        'navigation_history_json': navigation_history_json,
        'environment_json': {
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


# Here we use object because session-info diagnostics are heterogeneous
# JSON-like payloads (nested dict/list values) from client logs.
def validate_general_feedback_submit_payload_coupling(
    payload: general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict,
) -> None:
    """Validates the coupling between different fields of the payload for
    feedback submission.

    Args:
        payload: dict. The payload to be validated.
    """
    include_session_info = bool(payload.get('include_session_info'))
    session_info = payload.get('session_info')
    if include_session_info and session_info is None:
        raise base.BaseHandler.InvalidInputException(
            'Session info must be provided if include_session_info is True.'
        )

    if not include_session_info and session_info is not None:
        raise base.BaseHandler.InvalidInputException(
            'Session info should not be provided when '
            'include_session_info is False.'
        )

    description = payload.get('description')
    if not isinstance(description, str) or not description.strip():
        raise base.BaseHandler.InvalidInputException('Description is required.')

    category = payload.get('category')
    target_type = payload.get('target_type')
    target_id = payload.get('target_id')

    if category == 'lesson':
        if target_type != 'exploration':
            raise base.BaseHandler.InvalidInputException(
                'Lesson feedback requires target_type=exploration.'
            )

        if not target_id:
            raise base.BaseHandler.InvalidInputException(
                'Lesson feedback requires target_id.'
            )

    elif category == 'platform':
        if target_type != 'general':
            raise base.BaseHandler.InvalidInputException(
                'Platform feedback requires target_type=general.'
            )

        if target_id is not None:
            raise base.BaseHandler.InvalidInputException(
                'Platform feedback should not specify target_id.'
            )

    screenshot_filename = payload.get('screenshot_filename')
    screenshot_file = payload.get('screenshot_file')

    if screenshot_filename is None and screenshot_file:
        raise base.BaseHandler.InvalidInputException(
            'Screenshot file requires a screenshot filename.'
        )

    if screenshot_filename is not None and screenshot_file is None:
        raise base.BaseHandler.InvalidInputException(
            'Screenshot filename requires screenshot file data.'
        )

    if (
        screenshot_filename is not None
        and isinstance(screenshot_filename, str)
        and re.fullmatch(
            utils.get_image_filename_regex_pattern(),
            screenshot_filename,
        )
        is None
    ):
        raise base.BaseHandler.InvalidInputException(
            'Screenshot filename is invalid.'
        )


def validate_general_feedback_screenshot_file(
    screenshot_file: Optional[Dict[str, str]],
) -> Optional[Dict[str, str]]:
    """Validates the screenshot file.

    Args:
        screenshot_file: dict. The screenshot file to be validated.

    Returns:
        dict. The validated screenshot file.
    """
    if screenshot_file is None:
        return None

    files = screenshot_file

    if len(files) > 1:
        raise utils.ValidationError('Only one screenshot file is allowed.')

    for filename, encoded_data in files.items():
        if not isinstance(filename, str):
            raise utils.ValidationError('Filename should be a string.')

        if not isinstance(encoded_data, str):
            raise utils.ValidationError('Screenshot data should be a string.')

    return files

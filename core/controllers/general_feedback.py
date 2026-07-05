# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Controllers for learner lesson feedback and platform issue report submissions."""

from __future__ import annotations

import base64
import uuid

from core import feconf, utils
from core.controllers import acl_decorators, base, domain_objects_validator
from core.domain import (
    captcha_services,
    fs_services,
    general_feedback_domain,
    general_feedback_services,
)

from typing import Dict

_MAX_FEEDBACK_TEXT_LENGTH = 2500
_MAX_FILENAME_LENGTH = 200
_ALLOWED_REPORT_SOURCES = ('lesson', 'site')
_ALLOWED_REPORT_CATEGORIES = (
    'typo',
    'broken_layout_or_image',
    'confusing_or_incorrect_answer',
    'other_or_not_sure',
)


def _resolve_feedback_screenshot_entity_id(
    screenshot_filename: str,
    screenshot_file: str,
) -> str:
    """Decodes a base64 screenshot, validates and saves it, returns entity ID.

    Args:
        screenshot_filename: str. Filename of the screenshot.
        screenshot_file: str. The base64-encoded
            image data.

    Returns:
        str. The GCS entity ID under which the image was saved.
    """
    decoded_image = base64.decodebytes(screenshot_file.encode('utf-8'))
    entity_id = utils.convert_to_hash(uuid.uuid4().hex, 22)
    fs_services.validate_and_save_image(
        decoded_image,
        screenshot_filename,
        'image',
        feconf.ENTITY_TYPE_FEEDBACK,
        entity_id,
    )
    return entity_id


class LessonFeedbackSubmitHandler(
    base.BaseHandler[
        general_feedback_domain.FeedbackSubmitPayloadDict,
        Dict[str, str],
    ]
):
    """Handler for learner lesson feedback submissions."""

    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'feedback_text': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_FEEDBACK_TEXT_LENGTH,
                        }
                    ],
                }
            },
            'lesson_metadata_json': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_lesson_metadata_fields
                    ),
                },
            },
        }
    }

    @acl_decorators.open_access
    def post(self) -> None:
        """Submits a new lesson feedback entry.

        Response: { "id": "<feedback_id>" }
        """
        if self.user_id is None:
            raise self.UnauthorizedUserException(
                'You must be logged in to submit feedback.'
            )
        assert self.normalized_payload is not None
        payload = self.normalized_payload
        feedback_text = payload['feedback_text']
        lesson_metadata_json = payload['lesson_metadata_json']

        domain_objects_validator.validate_lesson_feedback_submit_payload_coupling(
            payload=payload
        )

        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.user_id,
            feedback_text=feedback_text,
            lesson_metadata_json=lesson_metadata_json,
        )

        self.render_json({'id': feedback.id})


class PlatformFeedbackSubmitHandler(
    base.BaseHandler[
        general_feedback_domain.PlatformFeedbackSubmitPayloadDict,
        Dict[str, str],
    ]
):
    """Handler for lesson issue reports and site issue reports.

    POST /platform_feedback
    Open access (no login required).
    Creates one PlatformFeedbackModel per submission.
    Uploads screenshot to GCS when provided.
    Routes report automatically based on source + category.
    """

    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'source': {
                'schema': {
                    'type': 'basestring',
                    'choices': _ALLOWED_REPORT_SOURCES,
                },
            },
            'report_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_FEEDBACK_TEXT_LENGTH,
                        }
                    ],
                }
            },
            'category': {
                'schema': {
                    'type': 'basestring',
                    'choices': _ALLOWED_REPORT_CATEGORIES,
                },
                'default_value': None,
            },
            'lesson_metadata_json': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_lesson_metadata_fields
                    ),
                },
                'default_value': None,
            },
            'include_technical_logs': {
                'schema': {
                    'type': 'bool',
                },
                'default_value': False,
            },
            'session_info': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_feedback_session_info_log_entries
                    ),
                },
                'default_value': None,
            },
            'screenshot_filename': {
                'schema': {
                    'type': 'unicode_or_none',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_FILENAME_LENGTH,
                        },
                    ],
                },
                'default_value': None,
            },
            'screenshot_file': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'page_url': {
                'schema': {
                    'type': 'basestring',
                    'post_normalizers': [
                        {
                            'id': 'sanitize_url',
                        }
                    ],
                }
            },
            'captcha_token': {
                'schema': {
                    'type': 'unicode_or_none',
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def post(self) -> None:
        """Submits a new issue report (lesson or site).

        Response: { "id": "<report_id>" }
        """
        assert self.normalized_payload is not None
        payload = self.normalized_payload
        domain_objects_validator.validate_platform_feedback_submit_payload_coupling(
            payload=payload
        )

        source = payload['source']
        report_message = payload['report_message']
        page_url = payload['page_url']
        assert page_url is not None
        category = payload.get('category')
        lesson_metadata_json = payload.get('lesson_metadata_json')
        include_technical_logs = payload.get('include_technical_logs', False)
        session_info = payload.get('session_info')
        screenshot_filename = payload.get('screenshot_filename')
        screenshot_file = payload.get('screenshot_file')
        captcha_token = payload.get('captcha_token')

        # Verify captcha token, only for logged-out users.
        if self.user_id is None:
            if not isinstance(captcha_token, str):
                raise self.InvalidInputException(
                    'Captcha token is required for logged-out users.'
                )

            if not captcha_services.verify_turnstile_token(captcha_token):
                raise self.InvalidInputException('Invalid captcha token.')

        screenshot_entity_id = None
        if screenshot_filename is not None and screenshot_file is not None:
            screenshot_entity_id = _resolve_feedback_screenshot_entity_id(
                screenshot_filename, screenshot_file
            )

        report = general_feedback_services.create_platform_report(
            feedback_text=report_message,
            source=source,
            page_url=page_url,
            category=category,
            lesson_metadata_json=lesson_metadata_json,
            session_info_json=session_info,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            include_technical_logs=include_technical_logs,
        )

        self.render_json({'id': report.id})


class GeneralFeedbackCaptchaConfigHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for getting the captcha config for web user feedback."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        site_key = captcha_services.get_turnstile_site_key()
        self.render_json({'site_key': site_key})

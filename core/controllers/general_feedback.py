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


"""Controllers for web user feedback threads, messages, and session logs."""

from __future__ import annotations

import base64
import uuid

from core import feconf, utils
from core.controllers import acl_decorators, base, domain_objects_validator
from core.domain import (
    captcha_services,
    exp_fetchers,
    fs_services,
    general_feedback_domain,
    general_feedback_services,
)

from typing import Dict

_MAX_DESCRIPTION_LENGTH = 2500
_MAX_FILENAME_LENGTH = 200
_ALLOWED_CATEGORIES = ('lesson', 'platform')
_ALLOWED_TARGET_TYPES = ('exploration', 'general')


def _resolve_feedback_screenshot_entity_id(
    screenshot_filename: str,
    screenshot_file: Dict[str, str],
) -> str:
    """Returns the entity id for a feedback screenshot."""
    decoded_image = base64.decodebytes(
        screenshot_file[screenshot_filename].encode('utf-8')
    )
    entity_id = utils.convert_to_hash(uuid.uuid4().hex, 22)

    fs_services.validate_and_save_image(
        decoded_image,
        screenshot_filename,
        'image',
        feconf.ENTITY_TYPE_FEEDBACK_SCREENSHOT,
        entity_id,
    )
    return entity_id


class GeneralFeedbackSubmitHandler(
    base.BaseHandler[
        general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict,
        Dict[str, str],
    ]
):
    """Handler for web user feedback submission."""

    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'category': {
                'schema': {
                    'type': 'basestring',
                    'choices': _ALLOWED_CATEGORIES,
                },
            },
            'description': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_DESCRIPTION_LENGTH,
                        }
                    ],
                }
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
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_valid_audio_language_code'}],
                }
            },
            'rating': {
                'schema': {
                    'type': 'int',
                    'validators': [
                        {
                            'id': 'is_at_least',
                            'min_value': 0,
                        },
                        {
                            'id': 'is_at_most',
                            'max_value': 5,
                        },
                    ],
                },
                'default_value': 0,
            },
            'target_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': _ALLOWED_TARGET_TYPES,
                },
            },
            'target_id': {
                'schema': {
                    'type': 'unicode_or_none',
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
            'submit_anonymously': {
                'schema': {
                    'type': 'bool',
                },
                'default_value': True,
            },
            'include_session_info': {
                'schema': {
                    'type': 'bool',
                },
                'default_value': True,
            },
            'captcha_token': {
                'schema': {
                    'type': 'unicode_or_none',
                },
                'default_value': None,
            },
            'screenshot_file': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_general_feedback_screenshot_file
                    ),
                },
                'default_value': None,
            },
            'session_info': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_general_feedback_session_info_log_entries
                    ),
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def post(self) -> None:
        """Submits web user feedback (platform or lesson)."""
        assert self.normalized_payload is not None
        payload = self.normalized_payload
        domain_objects_validator.validate_general_feedback_submit_payload_coupling(
            payload=payload
        )
        category = payload['category']
        description = payload['description']
        page_url = payload['page_url']
        language_code = payload['language_code']
        rating = payload['rating']
        target_type = payload['target_type']
        submit_anonymously = payload['submit_anonymously']

        target_id = payload.get('target_id')
        screenshot_filename = payload.get('screenshot_filename')
        session_info = payload.get('session_info')
        captcha_token = payload.get('captcha_token')
        screenshot_file = payload.get('screenshot_file')

        # Verify captcha token, only for logged-out users.
        if self.user_id is None:
            if not captcha_token:
                raise self.InvalidInputException(
                    'Captcha token is required for logged-out users.'
                )

            if not captcha_services.verify_turnstile_token(captcha_token):
                raise self.InvalidInputException('Invalid captcha token.')

        # Validate lesson's target_id existence.
        if category == 'lesson':
            assert target_id is not None

            exploration = exp_fetchers.get_exploration_by_id(
                target_id, strict=False
            )
            if exploration is None:
                raise self.InvalidInputException(
                    'Invalid target_id for lesson feedback, target_id is not '
                    'a valid exploration id.'
                )

        # Get screenshot_entity_id.
        screenshot_entity_id = None
        if screenshot_filename is not None:
            assert screenshot_file is not None
            screenshot_entity_id = _resolve_feedback_screenshot_entity_id(
                screenshot_filename, screenshot_file
            )
        # Set user_id to None if feedback is submitted anonymously (this is a option only for logged-in users), else set it to the current user's id.
        user_id = None
        if not submit_anonymously:
            user_id = self.user_id

        thread_id = general_feedback_services.create_thread(
            category=category,
            description=description,
            page_url=page_url,
            language_code=language_code,
            rating=rating,
            target_type=target_type,
            target_id=target_id,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            user_id=user_id,
            session_info=session_info,
        )

        self.render_json({'success': True, 'thread_id': thread_id})


class GeneralFeedbackCaptchaConfigHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for getting the captcha config for web user feedback"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        site_key = captcha_services.get_turnstile_site_key()
        self.render_json({'site_key': site_key})

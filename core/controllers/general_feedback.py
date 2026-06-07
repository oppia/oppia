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
    rights_manager,
)

from typing import Dict

_MAX_DESCRIPTION_LENGTH = 2500
_MAX_FILENAME_LENGTH = 200
_ALLOWED_CATEGORIES = ('lesson', 'platform')
_ALLOWED_TARGET_TYPES = ('exploration', 'general')
_ALLOWED_STATUSES = (
    'open',
    'fixed',
    'ignored',
    'compliment',
    'not_actionable',
)


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


class CreatorFeedbackListHandler(
    base.BaseHandler[
        Dict[str, str],
        general_feedback_domain.CreatorFeedbackListHandlerNormalizedRequestDict,
    ]
):
    """Handler that returns lesson feedback thread summaries for an exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'date_to_msecs': {
                'schema': {
                    'type': 'int',
                },
                'default_value': None,
            },
            'date_from_msecs': {
                'schema': {
                    'type': 'int',
                },
                'default_value': None,
            },
            'status_filter': {
                'schema': {
                    'type': 'basestring',
                    'choices': _ALLOWED_STATUSES,
                },
                'default_value': 'open',
            },
        }
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        assert self.normalized_request is not None
        req = self.normalized_request
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        if exploration is None:
            raise self.InvalidInputException('Invalid exploration id.')
        # Default date range is 3 months.
        now_msecs = utils.get_current_time_in_millisecs()
        three_months_ago_msecs = now_msecs - 90 * 24 * 60 * 60 * 1000

        date_from_msecs: float | None = req.get('date_from_msecs')
        date_to_msecs: float | None = req.get('date_to_msecs')

        if date_from_msecs is None:
            date_from_msecs = three_months_ago_msecs

        if date_to_msecs is None:
            date_to_msecs = now_msecs

        thread_summaries, next_cursor, more = (
            general_feedback_services.get_threads(
                page_size=20,
                cursor=req.get('cursor'),
                category_filter='lesson',
                status_filter=req.get('status_filter'),
                target_type_filter='exploration',
                target_id_filter=exploration_id,
                date_from_msecs=date_from_msecs,
                date_to_msecs=date_to_msecs,
            )
        )
        self.render_json(
            {
                'thread_summaries': thread_summaries,
                'next_cursor': next_cursor,
                'more': more,
            }
        )


class CreatorFeedbackDetailHandler(
    base.BaseHandler[
        general_feedback_domain.CreatorFeedbackDetailHandlerNormalizedPayloadDict,
        Dict[str, str],
    ]
):
    """Handler that returns full lesson feedback thread detail for an exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    PUT_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
            },
        },
        'thread_id': {
            'schema': {
                'type': 'basestring',
            }
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'action': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'message': {
                'schema': {
                    'type': 'unicode_or_none',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_DESCRIPTION_LENGTH,
                        }
                    ],
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
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_general_feedback_screenshot_file
                    ),
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str, thread_id: str) -> None:
        thread = general_feedback_services.get_thread(thread_id)
        if (
            thread is None
            or thread.category != 'lesson'
            or thread.target_type != 'exploration'
            or thread.target_id != exploration_id
        ):
            raise self.NotFoundException(
                'Feedback thread with id %s not found for exploration %s.'
                % (thread_id, exploration_id)
            )

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id
        )
        thread_dict = thread.to_dict()
        feedback_dict: (
            general_feedback_domain.CreatorFeedbackDetailHandlerNormalizedResponseDict
        ) = {
            'id': thread_dict['id'],
            'category': thread_dict['category'],
            'description': thread_dict['description'],
            'page_url': thread_dict['page_url'],
            'language_code': thread_dict['language_code'],
            'status': thread_dict['status'],
            'rating': thread_dict['rating'],
            'target_type': thread_dict['target_type'],
            'target_id': thread_dict['target_id'],
            'has_screenshot': thread_dict['has_screenshot'],
            'user_id': thread_dict['user_id'],
            'message_count': thread_dict['message_count'],
            'messages': thread_dict['messages'],
            'created_on_msecs': thread_dict['created_on_msecs'],
            # Session info is restricted in creator-facing endpoint.
            'session_info': None,
            'can_edit_exploration': bool(
                self.user
                and rights_manager.check_can_edit_activity(
                    self.user, exploration_rights
                )
            ),
        }
        self.render_json(feedback_dict)

    @acl_decorators.can_play_exploration_as_logged_in_user
    def put(self, exploration_id: str, thread_id: str) -> None:
        """Updates lesson thread status and/or adds a creator message."""
        assert self.user is not None
        assert self.normalized_payload is not None
        thread = general_feedback_services.get_thread(thread_id)
        if (
            thread is None
            or thread.category != 'lesson'
            or thread.target_type != 'exploration'
            or thread.target_id != exploration_id
        ):
            raise self.NotFoundException(
                'Feedback thread with id %s not found for exploration %s.'
                % (thread_id, exploration_id)
            )

        screenshot_filename = self.normalized_payload.get('screenshot_filename')
        screenshot_file = self.normalized_payload.get('screenshot_file')
        if screenshot_filename is not None and screenshot_file is None:
            raise self.InvalidInputException(
                'Screenshot files require a screenshot filename.'
            )

        action = self.normalized_payload.get('action')
        message = self.normalized_payload.get('message')
        if action and action not in _ALLOWED_STATUSES:
            raise self.InvalidInputException('Invalid action.')
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id
        )
        can_edit_exploration = rights_manager.check_can_edit_activity(
            self.user, exploration_rights
        )
        if action and not can_edit_exploration:
            raise self.UnauthorizedUserException(
                'You do not have credentials to update lesson feedback status.'
            )

        if screenshot_filename is not None and screenshot_file is not None:
            screenshot_entity_id = _resolve_feedback_screenshot_entity_id(
                screenshot_filename, screenshot_file
            )
        else:
            screenshot_entity_id = None

        if action:
            general_feedback_services.update_thread_status(
                thread_id=thread_id,
                new_status=action,
            )

        if message or screenshot_entity_id:
            general_feedback_services.create_message(
                thread_id=thread_id,
                author_id=self.user_id,
                author_status='editor' if can_edit_exploration else 'learner',
                text=message or '',
                screenshot_filename=screenshot_filename,
                screenshot_entity_id=screenshot_entity_id,
                updated_status=action,
            )

        self.render_json({'success': True})

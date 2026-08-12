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
    exp_fetchers,
    fs_services,
    general_feedback_domain,
    general_feedback_services,
)

from typing import Dict

_MAX_FEEDBACK_TEXT_LENGTH = 2500
_MAX_FILENAME_LENGTH = 200


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


class MyFeedbackListHandler(
    base.BaseHandler[
        Dict[str, str],
        general_feedback_domain.GeneralFeedbackListRequestDict,
    ]
):
    """Handler for list of learner's feedback in My Suggestions tab."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'status': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.STATUS_CHOICES,
                },
                'default_value': None,
            },
            'cursor': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'date_from_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
            'date_to_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Returns the learner's feedback list."""
        if self.user_id is None:
            raise self.UnauthorizedUserException(
                'You must be logged in to submit feedback.'
            )

        assert self.normalized_request is not None
        req = self.normalized_request
        summaries, next_cursor, more = (
            general_feedback_services.get_learner_feedback_summaries(
                author_id=self.user_id,
                status_filter=req.get('status'),
                cursor=req.get('cursor'),
                date_from_msecs=req.get('date_from_msecs'),
                date_to_msecs=req.get('date_to_msecs'),
            )
        )
        self.render_json(
            {
                'summaries': summaries,
                'next_cursor': next_cursor,
                'more': more,
            }
        )


class MyFeedbackDetailHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Handler for learner-facing feedback details."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'feedback_id': {
            'schema': {
                'type': 'basestring',
            },
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'feedback_text': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_FEEDBACK_TEXT_LENGTH,
                        },
                    ],
                }
            }
        },
    }

    @acl_decorators.open_access
    def get(self, feedback_id: str) -> None:
        """Returns learner-owned feedback details."""
        if self.user_id is None:
            raise self.UnauthorizedUserException(
                'You must be logged in to view feedback.'
            )

        feedback = general_feedback_services.get_learner_feedback(
            feedback_id=feedback_id,
            author_id=self.user_id,
        )
        if feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % feedback_id
            )
        self.render_json(feedback.to_learner_dict())

    @acl_decorators.open_access
    def post(self, feedback_id: str) -> None:
        """Creates a learner follow-up with parent_feedback_id set."""
        if self.user_id is None:
            raise self.UnauthorizedUserException(
                'You must be logged in to submit feedback.'
            )

        assert self.normalized_payload is not None
        payload = self.normalized_payload
        parent_feedback = general_feedback_services.get_learner_feedback(
            feedback_id=feedback_id,
            author_id=self.user_id,
        )
        if parent_feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % feedback_id
            )

        lesson_metadata = parent_feedback.lesson_metadata.copy()
        exploration = exp_fetchers.get_exploration_by_id(
            lesson_metadata['exploration_id'], strict=False
        )
        if exploration is None:
            raise self.NotFoundException(
                'Exploration with ID %s does not exist.'
                % lesson_metadata['exploration_id']
            )
        lesson_metadata['exploration_version'] = exploration.version

        general_feedback_services.create_lesson_feedback(
            parent_feedback_id=feedback_id,
            author_id=self.user_id,
            feedback_text=payload['feedback_text'],
            lesson_metadata=lesson_metadata,
        )
        self.render_json({'success': True})


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
            'lesson_metadata': {
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
        lesson_metadata = payload['lesson_metadata']

        domain_objects_validator.validate_lesson_feedback_submit_payload_coupling(
            payload=payload
        )

        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.user_id,
            feedback_text=feedback_text,
            lesson_metadata=lesson_metadata,
        )

        self.render_json({'id': feedback.id})


class LessonFeedbackDetailHandler(
    base.BaseHandler[
        general_feedback_domain.LessonFeedbackUpdatePayloadDict, Dict[str, str]
    ]
):
    """Handles retrieval of lesson feedback for the Creator Feedback Tab.

    GET /feedback/<exploration_id>/<feedback_id>
    POST /feedback/<exploration_id>/<feedback_id>

    URL path args:
        exploration_id: str. The exploration ID of the requested feedback.
        feedback_id: str. The feedback identifier.

    POST payload:
        status: str. The new moderation status.
        reply_text: str. The reply text.

    Access:
        - Creator Dashboard: Requires edit access to the exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
            },
        },
        'feedback_id': {
            'schema': {
                'type': 'basestring',
            },
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'status': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.STATUS_CHOICES,
                },
            },
            'reply_text': {
                'schema': {
                    'type': 'unicode_or_none',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': _MAX_FEEDBACK_TEXT_LENGTH,
                        }
                    ],
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_edit_exploration
    def get(
        self,
        exploration_id: str,
        feedback_id: str,
    ) -> None:
        feedback = general_feedback_services.get_lesson_feedback(feedback_id)
        if feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % feedback_id
            )
        if feedback.lesson_metadata['exploration_id'] != exploration_id:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist for exploration %s.'
                % (feedback_id, exploration_id)
            )
        self.render_json(feedback.to_dict())

    @acl_decorators.can_edit_exploration
    def post(
        self,
        exploration_id: str,
        feedback_id: str,
    ) -> None:
        assert self.normalized_payload is not None
        assert self.user_id is not None
        payload = self.normalized_payload
        status = payload['status']
        reply_text = payload.get('reply_text')
        try:
            updated_feedback = general_feedback_services.update_lesson_feedback(
                feedback_id=feedback_id,
                new_status=status,
                exp_id=exploration_id,
                responder_id=self.user_id,
                reply_text=reply_text,
            )
        except ValueError as e:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % feedback_id
            ) from e
        if updated_feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % feedback_id
            )
        self.render_json({'success': True})


class LessonFeedbackListHandler(
    base.BaseHandler[
        Dict[str, str], general_feedback_domain.GeneralFeedbackListRequestDict
    ]
):
    """Handles retrieval of Lesson feedback for the Creator.

    GET /feedback/<exploration_id>

    URL path args:
        exploration_id: str. The exploration id to retrieve feedback for.

    Query params:
        status: Optional[str]. Filters feedback by status.
        cursor: Optional[str]. Pagination cursor returned by a previous
            request.
        date_from_msecs: Optional[float]. Filters feedback from this date.
        date_to_msecs: Optional[float]. Filters feedback until this date.

    Access:
        - Creator Dashboard: Requires edit access to the exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
            },
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'status': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.STATUS_CHOICES,
                },
                'default_value': feconf.STATUS_CHOICES_OPEN,
            },
            'cursor': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'date_from_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
            'date_to_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_edit_exploration
    def get(
        self,
        exploration_id: str,
    ) -> None:
        assert self.normalized_request is not None
        req = self.normalized_request
        status = req.get('status')
        cursor = req.get('cursor')
        date_from_msecs = req.get('date_from_msecs')
        date_to_msecs = req.get('date_to_msecs')
        summaries, next_cursor, more = (
            general_feedback_services.get_lesson_feedback_summaries(
                exp_id=exploration_id,
                status_filter=status,
                cursor=cursor,
                date_from_msecs=date_from_msecs,
                date_to_msecs=date_to_msecs,
            )
        )
        self.render_json(
            {
                'summaries': summaries,
                'next_cursor': next_cursor,
                'more': more,
            }
        )


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
                    'choices': feconf.SOURCE_CHOICES,
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
                    'choices': feconf.CATEGORY_CHOICES,
                },
                'default_value': None,
            },
            'lesson_metadata': {
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
        lesson_metadata = payload.get('lesson_metadata')
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
            lesson_metadata=lesson_metadata,
            session_info=session_info,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            include_technical_logs=include_technical_logs,
        )

        self.render_json({'id': report.id})


class PlatformFeedbackListHandler(
    base.BaseHandler[
        Dict[str, str], general_feedback_domain.GeneralFeedbackListRequestDict
    ]
):
    """Handles retrieval of platform feedback for the Creator and Technical
    Dashboards.

    GET /platform-feedback/<dashboard>/<dashboard_id>

    URL path args:
        dashboard: str. The dashboard for which feedback is requested.
            Allowed values:
                - creator
                - technical
        dashboard_id: str. Identifier associated with the requested dashboard.
            For the Creator Dashboard, this is the exploration ID.
            For the Technical Dashboard, this is the team identifier
            ("tech-external" or "tech-internal").

    Query params:
        status: Optional[str]. Filters feedback by status.
        cursor: Optional[str]. Pagination cursor returned by a previous
            request.
        date_from_msecs: Optional[float]. Filters feedback from this date.
        date_to_msecs: Optional[float]. Filters feedback until this date.

    Access:
        - Creator Dashboard: Requires edit access to the exploration.
        - Technical Dashboard: Requires permission to access the technical feedback dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'dashboard': {
            'schema': {
                'type': 'basestring',
                'choices': feconf.PLATFORM_FEEDBACK_DASHBOARD_CHOICES,
            },
        },
        'dashboard_id': {
            'schema': {
                'type': 'basestring',
            },
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'status': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.STATUS_CHOICES,
                },
                'default_value': feconf.STATUS_CHOICES_OPEN,
            },
            'cursor': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None,
            },
            'date_from_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
            'date_to_msecs': {
                'schema': {
                    'type': 'float',
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_access_platform_feedback_reports
    def get(
        self,
        dashboard: str,
        dashboard_id: str,
    ) -> None:
        assert self.normalized_request is not None
        req = self.normalized_request
        status = req.get('status')
        cursor = req.get('cursor')
        date_from_msecs = req.get('date_from_msecs')
        date_to_msecs = req.get('date_to_msecs')
        summaries, next_cursor, more = (
            general_feedback_services.get_platform_feedback_summaries(
                dashboard=dashboard,
                dashboard_id=dashboard_id,
                status_filter=status,
                cursor=cursor,
                date_from_msecs=date_from_msecs,
                date_to_msecs=date_to_msecs,
            )
        )
        self.render_json(
            {
                'summaries': summaries,
                'next_cursor': next_cursor,
                'more': more,
            }
        )


class PlatformFeedbackDetailHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles retrieval of platform feedback for the Creator and Technical
    Dashboards.

    GET /platform-feedback/<dashboard>/<dashboard_id>/<report_id>
    POST /platform-feedback/<dashboard>/<dashboard_id>/<report_id>

    URL path args:
        dashboard: str. The dashboard for which feedback is requested.
            Allowed values:
                - creator
                - technical
        dashboard_id: str. Identifier associated with the requested dashboard.
            For the Creator Dashboard, this is the exploration ID.
            For the Technical Dashboard, this is the team identifier
            ("tech-external" or "tech-internal").
        report_id: str. The feedback identifier.

    POST payload:
        status: str. The new moderation status.

    Access:
        - Creator Dashboard: Requires edit access to the exploration.
        - Technical Dashboard: Requires permission to access the technical feedback dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    POST_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'dashboard': {
            'schema': {
                'type': 'basestring',
                'choices': feconf.PLATFORM_FEEDBACK_DASHBOARD_CHOICES,
            },
        },
        'dashboard_id': {
            'schema': {
                'type': 'basestring',
            },
        },
        'report_id': {
            'schema': {
                'type': 'basestring',
            },
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'status': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.STATUS_CHOICES,
                },
            },
        },
    }

    @acl_decorators.can_access_platform_feedback_reports
    def get(
        self,
        dashboard: str,
        dashboard_id: str,
        report_id: str,
    ) -> None:
        feedback = general_feedback_services.get_platform_feedback(
            report_id=report_id,
        )
        if feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % report_id
            )
        try:
            general_feedback_services.validate_platform_feedback_belongs_to_dashboard(
                feedback=feedback,
                dashboard=dashboard,
                dashboard_id=dashboard_id,
            )
        except ValueError as e:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % report_id
            ) from e
        self.render_json(feedback.to_dict())

    @acl_decorators.can_access_platform_feedback_reports
    def post(
        self,
        dashboard: str,
        dashboard_id: str,
        report_id: str,
    ) -> None:
        assert self.normalized_payload is not None
        payload = self.normalized_payload
        status = payload['status']
        try:
            updated_feedback = general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report_id,
                new_status=status,
                dashboard=dashboard,
                dashboard_id=dashboard_id,
            )
        except ValueError as e:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % report_id
            ) from e
        if updated_feedback is None:
            raise self.NotFoundException(
                'Feedback with ID %s does not exist.' % report_id
            )
        self.render_json({'success': True})


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

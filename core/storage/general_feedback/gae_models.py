# coding: utf-8
#
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

"""Models for web user feedback and session logs."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.platform import models

from typing import Any, Dict, List, Literal, Optional, Sequence, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class LessonFeedbackModel(base_models.BaseFeedbackModel):
    """Primary datastore model for learner lesson feedback submissions.

    Each learner submission creates exactly one LessonFeedbackModel.
    Creator responses are stored inline as a JSON list.

    When a learner clicks "Add a Note" from My Suggestions tab in New Learner Dashboard on a closed feedback entry, a new
    LessonFeedbackModel is created and its parent_feedback_id references
    the original entry.

    The id of instances of this class has the form
        feedback.lesson.<timestamp_base64><random_base64>

    Fields (in addition to BaseFeedbackModel fields):
        parent_feedback_id: Optional[str]. References the original
            LessonFeedbackModel when this entry is a follow-up note.
            None for top-level submissions.
        response_list_schema_version: int. Version of the response list.
        response_list: List[Dict]. Ordered list of creator responses. Each
            element is a dict with keys:
                response_text (str),
                responded_by (str),
                responded_on (float, milliseconds since epoch).
        unread_response_count: int. Number of Learner's unread responses.
    """

    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True
    ID_PREFIX: str = 'feedback.lesson'

    parent_feedback_id = datastore_services.StringProperty(
        required=False,
        indexed=True,
    )
    response_list_schema_version = datastore_services.IntegerProperty(
        required=False,
        indexed=True,
    )
    response_list = datastore_services.JsonProperty(
        required=True,
        indexed=False,
    )
    unread_response_count = datastore_services.IntegerProperty(
        required=True,
        default=0,
        indexed=False,
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains user IDs to pseudonymize."""
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """One user can have multiple lesson feedback entries."""
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(
            super().get_export_policy(),
            **{
                'parent_feedback_id': base_models.EXPORT_POLICY.EXPORTED,
                'response_list_schema_version': (
                    base_models.EXPORT_POLICY.EXPORTED
                ),
                # response_list stores responded_by (raw user ID) internally
                # but export_data strips it, emitting only response_text
                # and responded_on to the takeout output.
                'response_list': base_models.EXPORT_POLICY.EXPORTED,
                'unread_response_count': base_models.EXPORT_POLICY.EXPORTED,
                'created_on': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.EXPORTED,
                # author_id is pseudonymized, not exported directly.
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_id': base_models.EXPORT_POLICY.EXPORTED,
                'feedback_text': base_models.EXPORT_POLICY.EXPORTED,
                'status': base_models.EXPORT_POLICY.EXPORTED,
                'lesson_metadata_schema_version': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'lesson_metadata': base_models.EXPORT_POLICY.EXPORTED,
            },
        )

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Checks whether any non-deleted entry references the given user ID.

        Args:
            user_id: str. The ID of the user to check.

        Returns:
            bool. True if the user ID appears in any non-deleted entry.
        """
        return (
            cls.query(cls.author_id == user_id)
            .filter(cls.deleted.IN([False]))
            .get(keys_only=True)
            is not None
        )

    @classmethod
    def get_field_names_for_takeout(cls) -> Dict[str, str]:
        """Renames timestamp keys for takeout exports."""
        return {
            'created_on': 'created_on_msec',
            'last_updated': 'last_updated_msec',
        }

    @classmethod
    def export_data(cls, user_id: str) -> Dict[
        str,
        Dict[
            str,
            Union[
                str, int, float, bool, None, List[Dict[str, Union[str, float]]]
            ],
        ],
    ]:
        """Exports lesson feedback data corresponding to a user_id.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. A mapping of feedback IDs to their exported field values.
        """
        user_data = {}
        feedback_models: Sequence[LessonFeedbackModel] = (
            cls.get_all()
            .filter(cls.deleted.IN([False]))
            .filter(cls.author_id == user_id)
            .fetch()
        )

        for feedback_model in feedback_models:
            # Sanitize each response dict to ensure no raw user IDs are exported.
            sanitized_response_list = [
                {
                    'response_text': response.get('response_text'),
                    'responded_on': response.get('responded_on'),
                }
                for response in feedback_model.response_list
            ]
            user_data[feedback_model.id] = {
                'feedback_text': feedback_model.feedback_text,
                'status': feedback_model.status,
                'lesson_metadata': feedback_model.lesson_metadata,
                'exploration_id': feedback_model.exploration_id,
                'parent_feedback_id': feedback_model.parent_feedback_id,
                'response_list': sanitized_response_list,
                'unread_response_count': feedback_model.unread_response_count,
                'created_on_msec': utils.get_time_in_millisecs(
                    feedback_model.created_on
                ),
                'last_updated_msec': utils.get_time_in_millisecs(
                    feedback_model.last_updated
                ),
            }

        return user_data

    @classmethod
    def create(
        cls,
        author_id: str,
        feedback_text: str,
        lesson_metadata: Dict[str, Union[str, int, None]],
        parent_feedback_id: Optional[str] = None,
    ) -> str:
        """Creates a new LessonFeedbackModel and returns its ID.

        Args:
            author_id: str. User ID of the submitter.
            feedback_text: str. The main text body submitted by the learner.
            lesson_metadata: Dict.Lesson metadata at
                submission time. Must include exploration_id,
                exploration_version, state_name, state_index, and
                learner_current_answer.
            parent_feedback_id: Optional[str]. If this submission is a
                follow-up note, references the original LessonFeedbackModel.

        Returns:
            str. The ID of the newly created model.
        """
        feedback_id = cls._generate_new_id()
        feedback_model = cls(
            id=feedback_id,
            author_id=author_id,
            feedback_text=feedback_text,
            status=feconf.STATUS_CHOICES_OPEN,
            exploration_id=lesson_metadata['exploration_id'],
            lesson_metadata_schema_version=feconf.CURRENT_LESSON_METADATA_SCHEMA_VERSION,
            lesson_metadata=lesson_metadata,
            parent_feedback_id=parent_feedback_id,
            response_list_schema_version=feconf.CURRENT_RESPONSE_LIST_SCHEMA_VERSION,
            response_list=[],
            unread_response_count=0,
        )
        feedback_model.update_timestamps()
        feedback_model.put()
        return feedback_id


class PlatformFeedbackModel(base_models.BaseFeedbackModel):
    """Primary datastore model for lesson issue reports and site issue reports.

    Each report submission creates exactly one PlatformFeedbackModel. The
    destination_dashboard field is set automatically at creation time
    based on the page_url and category:

        typo                        → curriculum
        confusing_or_incorrect_answer → curriculum
        broken_layout_or_image      → tech-external or tech-internal
        other_or_not_sure           → tech-external or tech-internal
        all site (app) reports      → tech-external or tech-internal

    The id of instances of this class has the form
        feedback.platform.<timestamp_base64><random_base64>

    Fields (in addition to BaseFeedbackModel fields):
        source: str. Origin of the report ("lesson" | "app").
        platform: str. Platform of the report ("web" | "android").
        destination_dashboard: str. Routing target ("curriculum" |
            "tech-external" | "tech-internal").
        category: Optional[str]. Report category; required for lesson reports,
            must be None for site reports.
        include_technical_logs: bool. Whether session diagnostics are included.
        screenshot_filename: Optional[str]. Filename of the uploaded
            screenshot stored in GCS.
        screenshot_entity_id: Optional[str]. Entity ID used for screenshot
            storage in GCS. Must be present if and only if screenshot_filename
            is present.
        page_url: str. Page URL where the report was submitted.
    """

    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True
    ID_PREFIX: str = 'feedback.platform'

    source = datastore_services.StringProperty(
        required=True,
        indexed=True,
        choices=feconf.SOURCE_CHOICES,
    )
    platform = datastore_services.StringProperty(
        required=True,
        indexed=True,
        choices=feconf.PLATFORM_CHOICES,
    )
    destination_dashboard = datastore_services.StringProperty(
        required=True,
        indexed=True,
        choices=feconf.DESTINATION_CHOICES,
    )
    category = datastore_services.StringProperty(
        required=False,
        indexed=True,
        choices=feconf.CATEGORY_CHOICES,
    )
    include_technical_logs = datastore_services.BooleanProperty(
        required=True,
        indexed=True,
    )
    screenshot_filename = datastore_services.TextProperty(
        required=False,
    )
    screenshot_entity_id = datastore_services.TextProperty(
        required=False,
    )
    page_url = datastore_services.TextProperty(
        required=True,
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model is not directly associated with users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model is not directly associated with users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model does not correspond directly to a user."""
        return dict(
            super().get_export_policy(),
            **{
                # Fields inherited from BaseFeedbackModel.
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'feedback_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'lesson_metadata_schema_version': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'lesson_metadata': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                # Fields specific to PlatformFeedbackModel.
                'source': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'destination_dashboard': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'include_technical_logs': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'screenshot_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'screenshot_entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'page_url': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    @classmethod
    def _validate_create_args(
        cls,
        source: str,
        category: Optional[str],
        lesson_metadata: Optional[Dict[str, Union[str, int, None]]],
        screenshot_filename: Optional[str],
        screenshot_entity_id: Optional[str],
    ) -> None:
        """Validates arguments passed to create()."""

        if source == feconf.SOURCE_LESSON:
            if lesson_metadata is None:
                raise ValueError(
                    'Lesson feedback must include lesson metadata.'
                )

            if lesson_metadata.get('exploration_id') is None:
                raise ValueError(
                    'Lesson feedback must include an exploration ID.'
                )

        elif source == feconf.SOURCE_APP:
            if category is not None:
                raise ValueError('App feedback must not include a category.')

            if lesson_metadata is not None:
                raise ValueError(
                    'App feedback must not include lesson metadata.'
                )

        else:
            raise ValueError('Invalid source: %s' % source)

        screenshot_provided = (
            screenshot_filename is not None,
            screenshot_entity_id is not None,
        )
        if screenshot_provided[0] != screenshot_provided[1]:
            raise ValueError(
                'screenshot_filename and screenshot_entity_id must both be '
                'provided or both be None.'
            )

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @classmethod
    def _get_filtered_query(
        cls,
        author_id: Optional[str] = None,
        status_filter: Optional[str] = 'open',
        exploration_id: Optional[str] = None,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
        destination_dashboard: Optional[str] = None,
        platform: Optional[str] = None,
        source: Optional[str] = None,
        **kwargs: Any,
    ) -> datastore_services.Query:
        """Returns a filtered query based on the given parameters.

        Args:
            author_id: Optional[str]. If provided, filters by author ID.
            status_filter: Optional[str]. If provided, filters by status.
            exploration_id: Optional[str]. If provided, filters by
                exploration ID.
            date_from: Optional[datetime]. If provided, filters reports created
                on or after this date.
            date_to: Optional[datetime]. If provided, filters reports created
                on or before this date.
            destination_dashboard: Optional[str]. If provided, filters reports
                routed to this dashboard.
            platform: Optional[str]. If provided, filters by platform.
            source: Optional[str]. If provided, filters by source.
            **kwargs: *. Filters handled by BaseFeedbackModel.

        Returns:
            Query. The filtered query object.
        """
        query = super()._get_filtered_query(
            author_id=author_id,
            status_filter=status_filter,
            exploration_id=exploration_id,
            date_from=date_from,
            date_to=date_to,
            **kwargs,
        )

        if destination_dashboard is not None:
            query = query.filter(
                cls.destination_dashboard == destination_dashboard
            )
        if platform is not None:
            query = query.filter(cls.platform == platform)
        if source is not None:
            query = query.filter(cls.source == source)
        return query

    @classmethod
    def create(
        cls,
        feedback_text: str,
        source: str,
        platform: str,
        page_url: str,
        destination_dashboard: str,
        category: Optional[str],
        lesson_metadata: Optional[Dict[str, Union[str, int, None]]],
        include_technical_logs: bool,
        screenshot_filename: Optional[str],
        screenshot_entity_id: Optional[str],
    ) -> str:
        """Creates a new PlatformFeedbackModel and returns its ID.

        Args:
            feedback_text: str. The text body of the report.
            source: str. Origin of the report ("lesson" | "app").
            platform: str. Platform of the report ("web" | "android").
            category: Optional[str]. Report category; can be for lesson
                reports, must be None for site (app) reports.
            destination_dashboard: str. Routing target ("curriculum" |
                "tech-external" | "tech-internal").
            lesson_metadata_json: Optional[Dict]. Lesson metadata at
                submission time;
                required for lesson reports, must be None for site reports.
            include_technical_logs: bool. Whether session diagnostics are included.
            screenshot_filename: Optional[str]. GCS filename of the
                screenshot, or None if no screenshot was uploaded.
            screenshot_entity_id: Optional[str]. GCS entity ID for the
                screenshot. Must be provided if and only if screenshot_filename
                is provided.
            page_url: str. Page URL where the report was submitted.

        Returns:
            str. The ID of the newly created model.

        Raises:
            ValueError. If source is "lesson" and lesson_metadata is
                missing.
            ValueError. If source is "app" and category is not None.
            ValueError. If source is "app" and lesson_metadata is not
                None.
            ValueError. If exactly one of screenshot_filename and
                screenshot_entity_id is provided.
        """
        cls._validate_create_args(
            source=source,
            category=category,
            lesson_metadata=lesson_metadata,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
        )

        report_id = cls._generate_new_id()

        platform_feedback_model = cls(
            id=report_id,
            author_id=None,
            feedback_text=feedback_text,
            status=feconf.STATUS_CHOICES_OPEN,
            exploration_id=(
                lesson_metadata.get('exploration_id')
                if lesson_metadata is not None
                else None
            ),
            lesson_metadata_schema_version=(
                feconf.CURRENT_LESSON_METADATA_SCHEMA_VERSION
                if lesson_metadata is not None
                else None
            ),
            lesson_metadata=lesson_metadata,
            source=source,
            platform=platform,
            category=category,
            destination_dashboard=destination_dashboard,
            include_technical_logs=include_technical_logs,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            page_url=page_url,
        )
        platform_feedback_model.update_timestamps()
        platform_feedback_model.put()
        return report_id


class FeedbackSessionLogModel(base_models.BaseModel):
    """Storage model for feedback session diagnostics.

    This model stores optional debugging context associated with a
    feedback submission. Session diagnostics are collected when the
    user opts in to share session information in the feedback modal.

    Each session log is directly associated with a feedback
    using the same ID as PlatformFeedbackModel.

    Fields:
        id: str. PlatformFeedbackModel ID associated with the session log.
        session_info_schema_version: int. Schema version for FeedbackSessionLogModel schema.
        console_logs: List[Dict]. Console errors captured during session.
        failed_requests: List[Dict]. Failed HTTP request logs.
        navigation_history: List[Dict]. Recent navigation history.
        environment: Dict. Browser and device metadata.
        created_on: datetime. Timestamp of creation.
        last_updated: datetime. Timestamp of last update.
        deleted: bool.
    """

    # We use the thread ID as the model ID to ensure a one-to-one relationship.
    ID_IS_USED_AS_TAKEOUT_KEY: bool = True

    session_info_schema_version = datastore_services.IntegerProperty(
        required=True,
        indexed=True,
    )
    console_logs = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    failed_requests = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    navigation_history = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    environment = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model is not directly associated with users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model does not correspond directly to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model should not be exported directly in takeout."""
        return dict(
            super(cls, cls).get_export_policy(),
            **{
                'session_info_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'console_logs': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'failed_requests': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'navigation_history': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'environment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    @classmethod
    def create(
        cls,
        report_id: str,
        console_logs: Optional[List[Dict[str, str]]],
        failed_requests: Optional[List[Dict[str, str]]],
        navigation_history: Optional[List[Dict[str, str]]],
        environment: Optional[Dict[str, str]],
    ) -> str:
        """Creates a new FeedbackSessionLogModel for a given thread ID."""
        if cls.get_by_id(report_id):
            raise Exception(
                'Session log for thread ID %s already exists.' % report_id
            )
        session_log = cls(
            id=report_id,
            session_info_schema_version=feconf.CURRENT_SESSION_INFO_SCHEMA_VERSION,
            console_logs=console_logs,
            failed_requests=failed_requests,
            navigation_history=navigation_history,
            environment=environment,
        )
        session_log.update_timestamps()
        session_log.put()
        return report_id

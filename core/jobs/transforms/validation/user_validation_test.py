# coding: utf-8
#
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

"""Unit tests for jobs.transforms.user_validation."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import user_validation
from core.jobs.types import base_validation_errors
from core.jobs.types import user_validation_errors
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class ValidateModelWithUserIdTests(job_test_utils.PipelinedTestBase):

    def test_process_reports_error_for_invalid_uid(self) -> None:
        model_with_invalid_id = user_models.UserSettingsModel(
            id='123', email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_invalid_id])
            | beam.ParDo(user_validation.ValidateModelWithUserId())
        )

        self.assert_pcoll_equal(output, [
            base_validation_errors.ModelIdRegexError(
                model_with_invalid_id, feconf.USER_ID_REGEX),
        ])

    def test_process_reports_nothing_for_valid_uid(self) -> None:
        valid_user_id = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
        model_with_valid_id = user_models.UserSettingsModel(
            id=valid_user_id, email='a@a.com', created_on=self.NOW,
            last_updated=self.NOW)

        output = (
            self.pipeline
            | beam.Create([model_with_valid_id])
            | beam.ParDo(user_validation.ValidateModelWithUserId())
        )

        self.assert_pcoll_equal(output, [])


class ValidateActivityMappingOnlyAllowedKeysTests(
        job_test_utils.PipelinedTestBase):

    USER_ID: Final = 'test_id'
    EMAIL_ID: Final = 'a@a.com'
    INCORRECT_KEY: Final = 'audit'
    ROLE: Final = 'ADMIN'

    def test_process_with_incorrect_keys(self) -> None:
        test_model = user_models.PendingDeletionRequestModel(
            id=self.USER_ID,
            email=self.EMAIL_ID,
            created_on=self.NOW,
            last_updated=self.NOW,
            pseudonymizable_entity_mappings={
                models.Names.AUDIT.value: {'key': 'value'}
            }
        )

        output = (
            self.pipeline
            | beam.Create([test_model])
            | beam.ParDo(
                user_validation.ValidateActivityMappingOnlyAllowedKeys())
        )

        self.assert_pcoll_equal(output, [
            user_validation_errors.ModelIncorrectKeyError(
                test_model, [self.INCORRECT_KEY])
        ])

    def test_process_with_correct_keys(self) -> None:
        test_model = user_models.PendingDeletionRequestModel(
            id=self.USER_ID,
            email=self.EMAIL_ID,
            created_on=self.NOW,
            last_updated=self.NOW,
            pseudonymizable_entity_mappings={
                models.Names.COLLECTION.value: {'key': 'value'}
            }
        )

        output = (
            self.pipeline
            | beam.Create([test_model])
            | beam.ParDo(
                user_validation.ValidateActivityMappingOnlyAllowedKeys())
        )

        self.assert_pcoll_equal(output, [])


class ValidateOldModelsMarkedDeletedTests(job_test_utils.PipelinedTestBase):

    VALID_USER_ID: Final = 'test_user'
    SUBMITTER_ID: Final = 'submitter_id'

    def test_model_not_marked_as_deleted_when_older_than_4_weeks(self) -> None:
        model = user_models.UserQueryModel(
            id=self.VALID_USER_ID,
            submitter_id=self.SUBMITTER_ID,
            created_on=self.NOW - datetime.timedelta(weeks=5),
            last_updated=self.NOW - datetime.timedelta(weeks=5)
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateOldModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [
            user_validation_errors.ModelExpiringError(model)
        ])

    def test_model_not_marked_as_deleted_recently(self) -> None:
        model = user_models.UserQueryModel(
            id=self.VALID_USER_ID,
            submitter_id=self.SUBMITTER_ID,
            created_on=self.NOW - datetime.timedelta(weeks=1),
            last_updated=self.NOW - datetime.timedelta(weeks=1)
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateOldModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [])


class ValidateDraftChangeListLastUpdatedTests(job_test_utils.PipelinedTestBase):

    VALID_USER_ID: Final = 'test_user'
    VALID_EXPLORATION_ID: Final = 'exploration_id'
    VALID_DRAFT_CHANGE_LIST: Final = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'objective',
        'new_value': 'the objective'
    }]

    def test_model_with_draft_change_list_but_no_last_updated(self) -> None:
        model = user_models.ExplorationUserDataModel(
            id='123',
            user_id=self.VALID_USER_ID,
            exploration_id=self.VALID_EXPLORATION_ID,
            draft_change_list=self.VALID_DRAFT_CHANGE_LIST,
            draft_change_list_last_updated=None,
            created_on=self.NOW,
            last_updated=self.NOW
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateDraftChangeListLastUpdated())
        )
        self.assert_pcoll_equal(output, [
            user_validation_errors.DraftChangeListLastUpdatedNoneError(model)
        ])

    def test_model_with_draft_change_list_last_updated_greater_than_now(
        self
    ) -> None:
        model = user_models.ExplorationUserDataModel(
            id='123',
            user_id=self.VALID_USER_ID,
            exploration_id=self.VALID_EXPLORATION_ID,
            draft_change_list=self.VALID_DRAFT_CHANGE_LIST,
            draft_change_list_last_updated=(
                self.NOW + datetime.timedelta(days=5)),
            created_on=self.NOW,
            last_updated=self.NOW
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateDraftChangeListLastUpdated())
        )
        self.assert_pcoll_equal(output, [
            user_validation_errors.DraftChangeListLastUpdatedInvalidError(model)
        ])

    def test_model_with_valid_draft_change_list_last_updated(self) -> None:
        model = user_models.ExplorationUserDataModel(
            id='123',
            user_id=self.VALID_USER_ID,
            exploration_id=self.VALID_EXPLORATION_ID,
            draft_change_list=self.VALID_DRAFT_CHANGE_LIST,
            draft_change_list_last_updated=(
                self.NOW - datetime.timedelta(days=2)),
            created_on=self.NOW - datetime.timedelta(days=3),
            last_updated=self.NOW - datetime.timedelta(days=2)
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateDraftChangeListLastUpdated())
        )
        self.assert_pcoll_equal(output, [])


class RelationshipsOfTests(test_utils.TestBase):

    def test_completed_activities_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CompletedActivitiesModel', 'exploration_ids'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CompletedActivitiesModel', 'collection_ids'),
            ['CollectionModel'])

    def test_incomplete_activities_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'IncompleteActivitiesModel', 'exploration_ids'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'IncompleteActivitiesModel', 'collection_ids'),
            ['CollectionModel'])

    def test_exp_user_last_playthrough_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'ExpUserLastPlaythroughModel', 'exploration_id'),
            ['ExplorationModel'])

    def test_learner_playlist_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'LearnerPlaylistModel', 'exploration_ids'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'LearnerPlaylistModel', 'collection_ids'),
            ['CollectionModel'])

    def test_user_contributions_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserContributionsModel', 'created_exploration_ids'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserContributionsModel', 'edited_exploration_ids'),
            ['ExplorationModel'])

    def test_user_email_preferences_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserEmailPreferencesModel', 'id'),
            ['UserSettingsModel'])

    def test_user_subscriptions_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSubscriptionsModel', 'exploration_ids'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSubscriptionsModel', 'collection_ids'),
            ['CollectionModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSubscriptionsModel', 'general_feedback_thread_ids'),
            ['GeneralFeedbackThreadModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSubscriptionsModel', 'creator_ids'),
            ['UserSubscribersModel'])

    def test_user_subscribers_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSubscribersModel', 'subscriber_ids'),
            ['UserSubscriptionsModel'])

    def test_user_recent_changes_batch_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserRecentChangesBatchModel', 'id'),
            ['UserSettingsModel'])

    def test_user_stats_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserStatsModel', 'id'),
            ['UserSettingsModel'])

    def test_exploration_user_data_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'ExplorationUserDataModel', 'exploration_id'),
            ['ExplorationModel'])

    def test_collection_progress_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CollectionProgressModel', 'collection_id'),
            ['CollectionModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CollectionProgressModel', 'completed_explorations'),
            ['ExplorationModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'CollectionProgressModel', 'user_id'),
            ['CompletedActivitiesModel'])

    def test_story_progress_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'StoryProgressModel', 'story_id'),
            ['StoryModel'])

    def test_user_query_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserQueryModel', 'sent_email_model_id'),
            ['BulkEmailModel'])

    def test_user_bulk_emails_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserBulkEmailsModel', 'sent_email_model_ids'),
            ['BulkEmailModel'])

    def test_user_skill_mastery_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserSkillMasteryModel', 'skill_id'),
            ['SkillModel'])

    def test_user_contribution_proficiency_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserContributionProficiencyModel', 'user_id'),
            ['UserSettingsModel'])

    def test_user_contribution_rights_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'UserContributionRightsModel', 'id'),
            ['UserSettingsModel'])


class ValidateArchivedModelsMarkedDeletedTests(
        job_test_utils.PipelinedTestBase):

    def test_archived_model_not_marked_deleted(self) -> None:
        model = user_models.UserQueryModel(
            id='123',
            submitter_id='111',
            created_on=self.NOW,
            last_updated=self.NOW,
            query_status=feconf.USER_QUERY_STATUS_ARCHIVED
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateArchivedModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [
            user_validation_errors.ArchivedModelNotMarkedDeletedError(model)])

    def test_model_not_archived_not_marked_deleted(self) -> None:
        model = user_models.UserQueryModel(
            id='123',
            submitter_id='111',
            created_on=self.NOW,
            last_updated=self.NOW,
            query_status=feconf.USER_QUERY_STATUS_PROCESSING
        )
        output = (
            self.pipeline
            | beam.Create([model])
            | beam.ParDo(user_validation.ValidateArchivedModelsMarkedDeleted())
        )
        self.assert_pcoll_equal(output, [])

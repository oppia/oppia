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

"""Unit tests for jobs.batch_jobs.collection_info_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import collection_info_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.Names.COLLECTION, models.Names.FEEDBACK, models.Names.USER
    ])
)


class GetCollectionOwnersEmailsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        collection_info_jobs.GetCollectionOwnersEmailsJob
    ] = collection_info_jobs.GetCollectionOwnersEmailsJob

    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_counts_single_collection(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_1,
            email='some@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        )
        user.update_timestamps()
        collection = self.create_model(
            collection_models.CollectionRightsModel,
            id='col_1',
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.2
        )
        collection.update_timestamps()
        self.put_multi([user, collection])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=(
                    'collection_ids: [\'col_1\'], email: [\'some@email.com\']'))
        ])

    def test_counts_multiple_collection(self) -> None:
        user1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_1,
            email='some@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        )
        user2 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_2,
            email='some2@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        )
        # Checking a user who has no collection.
        user3 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_3,
            email='some3@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        )
        user1.update_timestamps()
        user2.update_timestamps()
        user3.update_timestamps()
        collection1 = self.create_model(
            collection_models.CollectionRightsModel,
            id='col_1',
            owner_ids=[self.USER_ID_1, self.USER_ID_2],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.2
        )
        collection1.update_timestamps()
        collection2 = self.create_model(
            collection_models.CollectionRightsModel,
            id='col_2',
            owner_ids=[self.USER_ID_2],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.2
        )
        collection2.update_timestamps()
        self.put_multi([user1, user2, user3, collection1, collection2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=(
                    'collection_ids: [\'col_1\'], email: '
                    '[\'some@email.com\']')),
            job_run_result.JobRunResult(
                stdout=(
                    'collection_ids: [\'col_1\', \'col_2\'], email: '
                    '[\'some2@email.com\']')
                )
        ])


class MatchEntityTypeCollectionJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        collection_info_jobs.MatchEntityTypeCollectionJob
    ] = collection_info_jobs.MatchEntityTypeCollectionJob

    USER_ID: Final = 'user_1'
    ENTITY_ID: Final = 'col_id_1'
    ENTITY_ID_1: Final = 'exp_id_1'
    ENTITY_ID_2: Final = 'top_id_1'

    ENTITY_TYPE: Final = 'collection'
    ENTITY_TYPE_1: Final = feconf.ENTITY_TYPE_EXPLORATION
    ENTITY_TYPE_2: Final = feconf.ENTITY_TYPE_TOPIC

    STATUS: Final = 'open'
    SUBJECT: Final = 'dummy subject'
    HAS_SUGGESTION: Final = True
    SUMMARY: Final = 'This is a great summary.'
    MESSAGE_COUNT: Final = 0

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_match_single_collection(self) -> None:
        feedback_thread_model = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='%s.%s.%s' % (self.ENTITY_TYPE, self.ENTITY_ID, 'random'),
            entity_type=self.ENTITY_TYPE,
            entity_id=self.ENTITY_ID,
            original_author_id=self.USER_ID,
            status=self.STATUS,
            subject=self.SUBJECT,
            has_suggestion=self.HAS_SUGGESTION,
            summary=self.SUMMARY,
            message_count=self.MESSAGE_COUNT
        )
        feedback_thread_model.update_timestamps()
        feedback_thread_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

    def test_match_multiple_collection(self) -> None:
        feedback_thread_model = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='%s.%s.%s' % (self.ENTITY_TYPE, self.ENTITY_ID, 'random'),
            entity_type=self.ENTITY_TYPE,
            entity_id=self.ENTITY_ID,
            original_author_id=self.USER_ID,
            status=self.STATUS,
            subject=self.SUBJECT,
            has_suggestion=self.HAS_SUGGESTION,
            summary=self.SUMMARY,
            message_count=self.MESSAGE_COUNT
        )
        feedback_thread_model.update_timestamps()
        feedback_thread_model.put()

        feedback_thread_model1 = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='%s.%s.%s' % (self.ENTITY_TYPE_1, self.ENTITY_ID_1, 'random'),
            entity_type=self.ENTITY_TYPE_1,
            entity_id=self.ENTITY_ID_1,
            original_author_id=self.USER_ID,
            status=self.STATUS,
            subject=self.SUBJECT,
            has_suggestion=self.HAS_SUGGESTION,
            summary=self.SUMMARY,
            message_count=self.MESSAGE_COUNT
        )
        feedback_thread_model1.update_timestamps()
        feedback_thread_model1.put()

        feedback_thread_model2 = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='%s.%s.%s' % (self.ENTITY_TYPE_2, self.ENTITY_ID_2, 'random'),
            entity_type=self.ENTITY_TYPE_2,
            entity_id=self.ENTITY_ID_2,
            original_author_id=self.USER_ID,
            status=self.STATUS,
            subject=self.SUBJECT,
            has_suggestion=self.HAS_SUGGESTION,
            summary=self.SUMMARY,
            message_count=self.MESSAGE_COUNT
        )
        feedback_thread_model2.update_timestamps()
        feedback_thread_model2.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

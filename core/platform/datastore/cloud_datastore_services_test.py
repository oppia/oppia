# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for the cloud_datastore_services.py"""

from __future__ import annotations

import datetime
import logging
import uuid

from core import utils
from core.platform import models
from core.platform.datastore import cloud_datastore_services
from core.tests import test_utils

from google.cloud import ndb
from typing import Sequence, Tuple

MYPY = False
if MYPY:
    from mypy_imports import datastore_services, user_models

(user_models,) = models.Registry.import_models([models.Names.USER])
datastore_services = models.Registry.import_datastore_services()


class AwareDateTimePropertyTestModel(datastore_services.Model):
    """Test model for AwareDateTimeProperty."""

    model_name = datastore_services.StringProperty(indexed=True)
    aware_datetime = datastore_services.AwareDateTimeProperty(indexed=True)


class AwareDateTimePropertyTests(test_utils.GenericTestBase):
    """Tests for AwareDateTimeProperty."""

    def _get_unique_model_id(self, prefix: str) -> str:
        """Returns a unique model ID for this test run."""
        return '%s_%s' % (prefix, uuid.uuid4().hex)

    def _clear_ndb_context_cache(self) -> None:
        """Clears the NDB context cache."""
        ndb.get_context().clear_cache()

    def _assert_aware_utc(self, value: datetime.datetime) -> None:
        """Asserts that value is a timezone-aware UTC datetime.

        Args:
            value: datetime.datetime. The value to check.
        """
        self.assertIsNotNone(value.tzinfo)
        self.assertEqual(value.utcoffset(), datetime.timedelta(0))

    def test_put_and_get_returns_aware_utc_datetime(self) -> None:
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        model_id = self._get_unique_model_id('put_get')

        AwareDateTimePropertyTestModel(
            id=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        fetched_model = AwareDateTimePropertyTestModel.get_by_id(model_id)

        self.assertIsNotNone(fetched_model)
        assert fetched_model is not None
        self.assertIs(type(fetched_model), AwareDateTimePropertyTestModel)

        fetched_datetime = fetched_model.aware_datetime
        self.assertEqual(fetched_datetime, model_datetime)
        self._assert_aware_utc(fetched_datetime)

    def test_non_utc_aware_datetime_is_converted_to_utc_equivalent(
        self,
    ) -> None:
        ist_timezone = datetime.timezone(
            datetime.timedelta(hours=5, minutes=30)
        )
        ist_datetime = datetime.datetime(
            2024, 3, 12, 14, 22, 17, tzinfo=ist_timezone
        )
        expected_utc_datetime = ist_datetime.astimezone(datetime.timezone.utc)
        model_id = self._get_unique_model_id('ist')
        AwareDateTimePropertyTestModel(
            id=model_id,
            aware_datetime=ist_datetime,
        ).put()
        self._clear_ndb_context_cache()

        fetched_model = AwareDateTimePropertyTestModel.get_by_id(model_id)
        self.assertIsNotNone(fetched_model)
        assert fetched_model is not None

        self.assertEqual(fetched_model.aware_datetime, expected_utc_datetime)
        self._assert_aware_utc(fetched_model.aware_datetime)

    def test_query_with_aware_datetime_filter_returns_model(self) -> None:
        model_id = self._get_unique_model_id('aware_query')
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        AwareDateTimePropertyTestModel(
            id=model_id,
            model_name=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        threshold_datetime = model_datetime - datetime.timedelta(minutes=10)
        results: Sequence[AwareDateTimePropertyTestModel] = (
            AwareDateTimePropertyTestModel.query(
                AwareDateTimePropertyTestModel.model_name == model_id,
                AwareDateTimePropertyTestModel.aware_datetime
                >= threshold_datetime,
            ).fetch()
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].key.id(), model_id)
        self._assert_aware_utc(results[0].aware_datetime)

    def test_query_with_naive_datetime_filter_treats_naive_as_utc(
        self,
    ) -> None:
        model_id = self._get_unique_model_id('naive_query_positive')
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        AwareDateTimePropertyTestModel(
            id=model_id,
            model_name=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        # Naive 9:59 treated as UTC — model at 10:00 UTC should match.
        naive_threshold_before = datetime.datetime(2024, 3, 12, 9, 59)
        results: Sequence[AwareDateTimePropertyTestModel] = (
            AwareDateTimePropertyTestModel.query(
                AwareDateTimePropertyTestModel.model_name == model_id,
                AwareDateTimePropertyTestModel.aware_datetime
                >= naive_threshold_before,
            ).fetch()
        )

        self.assertEqual(len(results), 1)

    def test_query_with_naive_datetime_filter_excludes_older_model(
        self,
    ) -> None:
        model_id = self._get_unique_model_id('naive_query_negative')
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        AwareDateTimePropertyTestModel(
            id=model_id,
            model_name=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        # Naive 10:01 treated as UTC — model at 10:00 UTC should NOT match.
        naive_threshold_after = datetime.datetime(2024, 3, 12, 10, 1)
        results: Sequence[AwareDateTimePropertyTestModel] = (
            AwareDateTimePropertyTestModel.query(
                AwareDateTimePropertyTestModel.model_name == model_id,
                AwareDateTimePropertyTestModel.aware_datetime
                >= naive_threshold_after,
            ).fetch()
        )

        self.assertEqual(results, [])

    def test_projection_query_returns_utc_equivalent_datetime(self) -> None:
        # Projection queries return int microseconds from Datastore (the
        # upstream docstring says nanoseconds, but the implementation divides
        # by 1e6), which DateTimeProperty._from_base_type converts to a
        # pytz.utc-aware datetime.
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        model_id = self._get_unique_model_id('proj')
        AwareDateTimePropertyTestModel(
            id=model_id,
            model_name=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        results: Sequence[AwareDateTimePropertyTestModel] = (
            AwareDateTimePropertyTestModel.query(
                AwareDateTimePropertyTestModel.model_name == model_id
            ).fetch(projection=[AwareDateTimePropertyTestModel.aware_datetime])
        )

        self.assertEqual(len(results), 1)
        self._assert_aware_utc(results[0].aware_datetime)
        self.assertEqual(results[0].aware_datetime, model_datetime)

    def test_legacy_naive_datetime_data_is_read_as_aware_utc(self) -> None:
        legacy_datetime = datetime.datetime(2024, 3, 12, 10, 15, 30)
        legacy_id = self._get_unique_model_id('legacy')

        try:

            class LegacyNaiveDateTimePropertyWriterModel(
                datastore_services.Model
            ):
                """Model for writing legacy naive datetime values."""

                aware_datetime = datastore_services.DateTimeProperty(
                    indexed=True
                )

                @classmethod
                def _get_kind(cls) -> str:
                    return (
                        AwareDateTimePropertyTestModel._get_kind()
                    )  # pylint: disable=protected-access

            LegacyNaiveDateTimePropertyWriterModel(
                id=legacy_id,
                aware_datetime=legacy_datetime,
            ).put()
        finally:
            # The temporary writer model intentionally targets the aware model's
            # kind to simulate pre-migration datastore data. Restore the kind map
            # so the read path uses AwareDateTimePropertyTestModel.
            AwareDateTimePropertyTestModel._update_kind_map()  # pylint: disable=protected-access

        self._clear_ndb_context_cache()

        fetched_model = AwareDateTimePropertyTestModel.get_by_id(legacy_id)

        self.assertIsNotNone(fetched_model)
        assert fetched_model is not None
        self.assertIs(type(fetched_model), AwareDateTimePropertyTestModel)

        fetched_datetime = fetched_model.aware_datetime
        self._assert_aware_utc(fetched_datetime)
        self.assertEqual(
            fetched_datetime,
            legacy_datetime.replace(tzinfo=datetime.timezone.utc),
        )

    def test_aware_utc_datetime_round_trip_is_idempotent(self) -> None:
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 15, 30, tzinfo=datetime.timezone.utc
        )
        model_id = self._get_unique_model_id('idem')
        AwareDateTimePropertyTestModel(
            id=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        fetched_model = AwareDateTimePropertyTestModel.get_by_id(model_id)
        self.assertIsNotNone(fetched_model)
        assert fetched_model is not None
        self.assertEqual(fetched_model.aware_datetime, model_datetime)

        fetched_model.put()
        self._clear_ndb_context_cache()

        refetched_model = AwareDateTimePropertyTestModel.get_by_id(model_id)
        self.assertIsNotNone(refetched_model)
        assert refetched_model is not None
        self.assertEqual(refetched_model.aware_datetime, model_datetime)
        self._assert_aware_utc(refetched_model.aware_datetime)

    def test_naive_datetime_assignment_is_coerced_to_aware_utc(self) -> None:
        naive_datetime = datetime.datetime(2024, 3, 12, 10, 0)
        model = AwareDateTimePropertyTestModel(
            id=self._get_unique_model_id('naive_assign'),
            aware_datetime=naive_datetime,
        )
        # Coercion happens on assignment, before any datastore interaction.
        self._assert_aware_utc(model.aware_datetime)
        self.assertEqual(
            model.aware_datetime,
            naive_datetime.replace(tzinfo=datetime.timezone.utc),
        )
        model.put()
        self._clear_ndb_context_cache()
        fetched_model = AwareDateTimePropertyTestModel.get_by_id(model.key.id())
        assert fetched_model is not None
        self._assert_aware_utc(fetched_model.aware_datetime)

    def test_non_datetime_value_raises_bad_value_error(self) -> None:
        with self.assertRaisesRegex(Exception, 'Expected datetime'):
            AwareDateTimePropertyTestModel(
                id='invalid_value_model_id',
                aware_datetime=datetime.date(2024, 3, 12),
            )

    def test_value_written_by_aware_property_is_readable_as_legacy_naive(
        self,
    ) -> None:
        """Verifies that values written via AwareDateTimeProperty are stored
        as naive UTC.

        This simulates a pre-migration reader using a plain DateTimeProperty for
        the same datastore kind.
        """
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 15, 30, tzinfo=datetime.timezone.utc
        )
        model_id = self._get_unique_model_id('legacy_reader')
        AwareDateTimePropertyTestModel(
            id=model_id,
            aware_datetime=model_datetime,
        ).put()
        self._clear_ndb_context_cache()

        try:

            class LegacyNaiveDateTimePropertyReaderModel(
                datastore_services.Model
            ):
                """Model simulating a pre-migration reader of the same kind."""

                aware_datetime = datastore_services.DateTimeProperty(
                    indexed=True
                )

                @classmethod
                def _get_kind(cls) -> str:
                    return (  # pylint: disable=protected-access
                        AwareDateTimePropertyTestModel._get_kind()
                    )

            legacy_view_model = (
                LegacyNaiveDateTimePropertyReaderModel.get_by_id(model_id)
            )
        finally:
            # Restore the kind map so later tests deserialize this kind using
            # AwareDateTimePropertyTestModel again.
            AwareDateTimePropertyTestModel._update_kind_map()  # pylint: disable=protected-access

        self.assertIsNotNone(legacy_view_model)
        assert legacy_view_model is not None

        legacy_datetime = legacy_view_model.aware_datetime
        self.assertIsNone(legacy_datetime.tzinfo)
        self.assertEqual(legacy_datetime, model_datetime.replace(tzinfo=None))

    def test_query_with_non_utc_aware_filter_is_shifted_to_utc(self) -> None:
        model_id = self._get_unique_model_id('ist_query')
        model_datetime = datetime.datetime(
            2024, 3, 12, 10, 0, tzinfo=datetime.timezone.utc
        )
        AwareDateTimePropertyTestModel(
            id=model_id, model_name=model_id, aware_datetime=model_datetime
        ).put()
        self._clear_ndb_context_cache()

        ist_timezone = datetime.timezone(
            datetime.timedelta(hours=5, minutes=30)
        )
        # 15:29 IST == 09:59 UTC, so the 10:00 UTC model must match.
        results: Sequence[AwareDateTimePropertyTestModel] = (
            AwareDateTimePropertyTestModel.query(
                AwareDateTimePropertyTestModel.model_name == model_id,
                AwareDateTimePropertyTestModel.aware_datetime
                >= datetime.datetime(2024, 3, 12, 15, 29, tzinfo=ist_timezone),
            ).fetch()
        )
        self.assertEqual(len(results), 1)

        # 15:31 IST == 10:01 UTC, so it must NOT match.
        results = AwareDateTimePropertyTestModel.query(
            AwareDateTimePropertyTestModel.model_name == model_id,
            AwareDateTimePropertyTestModel.aware_datetime
            >= datetime.datetime(2024, 3, 12, 15, 31, tzinfo=ist_timezone),
        ).fetch()

        self.assertEqual(results, [])

    def test_none_value_round_trips_as_none(self) -> None:
        model_id = self._get_unique_model_id('none_value')
        AwareDateTimePropertyTestModel(id=model_id, aware_datetime=None).put()
        self._clear_ndb_context_cache()

        fetched_model = AwareDateTimePropertyTestModel.get_by_id(model_id)
        assert fetched_model is not None
        self.assertIsNone(fetched_model.aware_datetime)


class CloudDatastoreServicesTests(test_utils.GenericTestBase):
    """Unit tests for the cloud_datastore_services.py"""

    THREE_WEEKS = datetime.timedelta(weeks=3)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.admin_user_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL
        )
        self.curr_time = utils.get_current_utc_datetime()
        self.completed_activities_model = user_models.CompletedActivitiesModel(
            id=self.admin_user_id,
            exploration_ids=[],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            last_updated=self.curr_time,
        )
        self.learner_goals_model = user_models.LearnerGoalsModel(
            id='goals_id',
            topic_ids_to_learn=[],
            topic_ids_to_master=[],
            last_updated=self.curr_time,
        )

    def test_update_timestamps_multi(self) -> None:
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id)
        )
        self.assertIsNone(user_models.LearnerGoalsModel.get_by_id('goals_id'))

        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.learner_goals_model], False
        )
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.learner_goals_model]
        )

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id)
        )
        self.assertIsNotNone(
            user_models.LearnerGoalsModel.get_by_id('goals_id')
        )

        self.assertEqual(
            self.completed_activities_model.get_by_id(
                self.admin_user_id
            ).last_updated,
            self.curr_time,
        )
        self.assertEqual(
            self.learner_goals_model.get_by_id('goals_id').last_updated,
            self.curr_time,
        )

    def test_delete_multi_transactional(self) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.learner_goals_model], False
        )
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.learner_goals_model]
        )

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id)
        )
        self.assertIsNotNone(
            user_models.LearnerGoalsModel.get_by_id('goals_id')
        )

        cloud_datastore_services.delete_multi_transactional(
            [
                datastore_services.Key(
                    user_models.CompletedActivitiesModel, self.admin_user_id
                ),
                datastore_services.Key(
                    user_models.LearnerGoalsModel, 'goals_id'
                ),
            ]
        )

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id)
        )
        self.assertIsNone(user_models.LearnerGoalsModel.get_by_id('goals_id'))

    def test_fetch_multiple_entities_by_ids_and_models(self) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.learner_goals_model], False
        )
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.learner_goals_model]
        )

        returned_models = (
            cloud_datastore_services.fetch_multiple_entities_by_ids_and_models(
                [
                    ('CompletedActivitiesModel', [self.admin_user_id]),
                    ('LearnerGoalsModel', ['goals_id']),
                ]
            )
        )

        self.assertEqual(
            returned_models,
            [[self.completed_activities_model], [self.learner_goals_model]],
        )

    def test_fetch_multiple_entities_throws_error_on_duplicate_parameters(
        self,
    ) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.learner_goals_model], False
        )
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.learner_goals_model]
        )

        error_msg = 'Model names should not be duplicated in input list.'
        with self.assertRaisesRegex(Exception, error_msg):
            cloud_datastore_services.fetch_multiple_entities_by_ids_and_models(
                [
                    ('LearnerGoalsModel', ['goals_id']),
                    ('LearnerGoalsModel', ['goals_id']),
                ]
            )

    def test_get_multi_throws_error_on_failure(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.exception()."""
            observed_log_messages.append(msg % args)

        dummy_keys = [
            ndb.Key('model1', 'id1'),
            ndb.Key('model2', 'id2'),
            ndb.Key('model3', 'id3'),
        ]
        error_msg = (
            'get_multi failed after %s retries'
            % cloud_datastore_services.MAX_GET_RETRIES
        )
        with self.swap_to_always_raise(
            ndb, 'get_multi', Exception('Mock key error')
        ), self.swap(logging, 'exception', _mock_logging_function):
            with self.assertRaisesRegex(Exception, error_msg):
                cloud_datastore_services.get_multi(dummy_keys)
        self.assertEqual(
            observed_log_messages,
            [
                'Exception raised: Mock key error',
                'Exception raised: Mock key error',
                'Exception raised: Mock key error',
            ],
        )

    def test_ndb_query_with_filters(self) -> None:
        user_group_model1 = user_models.UserGroupModel(
            id='group_id_1',
            name='Group One',
            user_ids=[self.admin_user_id],
            last_updated=self.curr_time - self.THREE_WEEKS,
        )
        user_group_model2 = user_models.UserGroupModel(
            id='group_id_2',
            name='Group Two',
            user_ids=[self.admin_user_id, 'new_id'],
            last_updated=self.curr_time,
        )
        cloud_datastore_services.update_timestamps_multi(
            [user_group_model1, user_group_model2], False
        )
        cloud_datastore_services.put_multi(
            [user_group_model1, user_group_model2]
        )

        result = user_models.UserGroupModel.query(
            cloud_datastore_services.all_of(
                user_models.UserGroupModel.name == 'Group Two',
                user_models.UserGroupModel.user_ids == 'new_id',
            )
        ).get()

        self.assertEqual(result, user_group_model2)

        result = user_models.UserGroupModel.query(
            cloud_datastore_services.any_of(
                user_models.UserGroupModel.name == 'Missing Group',
                user_models.UserGroupModel.user_ids == self.admin_user_id,
            )
        ).get()

        self.assertEqual(result, user_group_model1)

        result = user_models.UserGroupModel.query(
            cloud_datastore_services.not_equal(
                user_models.UserGroupModel.name,
                'Group One',
            )
        ).fetch()

        self.assertEqual(result, [user_group_model2])

        results: Tuple[
            Sequence[cloud_datastore_services.Model],
            cloud_datastore_services.Cursor,
            bool,
        ] = (
            user_models.UserGroupModel.query(
                user_models.UserGroupModel.user_ids == self.admin_user_id,
            )
            .order(user_models.UserGroupModel.name)
            .fetch_page(2, cloud_datastore_services.make_cursor())
        )

        self.assertEqual(results[0], [user_group_model1, user_group_model2])

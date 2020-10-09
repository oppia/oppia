# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the appengine datastore API wrapper."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import unittest

from core.domain import collection_services
from core.domain import exp_fetchers
from core.platform.datastore import gae_datastore_services
from core.tests import test_utils


class FetchMultipleEntitiesTests(test_utils.GenericTestBase):
    """Test fetching multiple entities from the datastore."""

    EXP_ID_0 = '0_en_arch_bridges_in_england'
    EXP_ID_1 = '1_fi_arch_sillat_suomi'
    COL_ID_0 = '0_arch_bridges_in_england'
    COL_ID_1 = '1_welcome_introduce_oppia'

    def setUp(self):
        super(FetchMultipleEntitiesTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_fetch_multiple_entities_by_ids_and_models(self):

        # Save a few explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

        # Save a few collections.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Bridges',
            category='Architecture')
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Introduce Oppia',
            category='Welcome')

        # Fetch the summaries of the collections and explorations.
        summary_models = (
            gae_datastore_services.fetch_multiple_entities_by_ids_and_models(
                [
                    ('ExpSummaryModel', [self.EXP_ID_0, self.EXP_ID_1]),
                    ('CollectionSummaryModel', [self.COL_ID_0, self.COL_ID_1])
                ]))

        exploration_summary_models = summary_models[0]
        collection_summary_models = summary_models[1]

        exploration_summaries = (
            [exp_fetchers.get_exploration_summary_from_model(model)
             if model else None for model in exploration_summary_models])
        collection_summaries = (
            [collection_services.get_collection_summary_from_model(model)
             if model else None for model in collection_summary_models])

        # Check that we have received the summaries of multiple entities of
        # different types correctly.
        self.assertEqual(exploration_summaries[0].title, 'Bridges in England')
        self.assertEqual(exploration_summaries[1].title, 'Sillat Suomi')
        self.assertEqual(collection_summaries[0].title, 'Bridges')
        self.assertEqual(collection_summaries[1].title, 'Introduce Oppia')


class MockDatetimeForDatastoreTests(test_utils.GenericTestBase):
    """Tests for mocking the datetime of an ndb.Model."""

    def test_exception_is_raised_when_passed_wrong_type(self):
        with self.assertRaisesRegexp(Exception, 'mocked_now must be datetime'):
            with gae_datastore_services.mock_datetime_for_datastore(2020):
                pass

    def test_utcnow_always_returns_provided_datetime(self):
        mocked_now = datetime.datetime(2000, 1, 1)
        with gae_datastore_services.mock_datetime_for_datastore(mocked_now):
            self.assertEqual(datetime.datetime.utcnow(), mocked_now)
            # Run twice to ensure it doesn't change with the passage of time.
            self.assertEqual(datetime.datetime.utcnow(), mocked_now)
        self.assertNotEqual(datetime.datetime.utcnow(), mocked_now)

    def test_model_accepts_mocked_datetime(self):
        mocked_now = datetime.datetime(2000, 1, 1)

        class TestModel(gae_datastore_services.Model):
            """Simple model for testing."""

            datetime_property = gae_datastore_services.DateTimeProperty()

        with gae_datastore_services.mock_datetime_for_datastore(mocked_now):
            test_model = TestModel(datetime_property=mocked_now)
            test_model.put()

        self.assertEqual(test_model.datetime_property, mocked_now)


class TransactionTests(test_utils.GenericTestBase):
    """Tests for running callbacks in a transaction."""

    def test_returns_value_of_callback(self):
        self.assertEqual(gae_datastore_services.transaction(lambda: 1), 1)

    def test_returns_none_from_void_callback(self):
        def do_nothing():
            """Does nothing."""

            pass

        self.assertIsNone(gae_datastore_services.transaction(do_nothing))

    def test_raises_exception_from_callback(self):
        def raise_exception():
            """Raises an Exception."""

            raise Exception('uh-oh!')

        with self.assertRaisesRegexp(Exception, 'uh-oh!'):
            gae_datastore_services.transaction(raise_exception)

    def test_returns_value_of_nested_transaction(self):
        self.assertEqual(
            gae_datastore_services.transaction(
                lambda: gae_datastore_services.transaction(lambda: 1)),
            1)


class EnforcedPropertyTests(unittest.TestCase):

    def test_string_property_raises_value_error_if_indexed_is_false(self):
        with self.assertRaisesRegexp(ValueError, 'no longer supported'):
            gae_datastore_services.StringProperty(indexed=False)

    def test_text_property_raises_value_error_if_indexed_is_true(self):
        with self.assertRaisesRegexp(ValueError, 'no longer supported'):
            gae_datastore_services.TextProperty(indexed=True)

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

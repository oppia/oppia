# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Exploration models."""

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils

(exploration_models,) = models.Registry.import_models(
    [models.NAMES.exploration])


class ExplorationModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationModel class."""

    def test_get_exploration_count(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration)

        self.assertEqual(
            exploration_models.ExplorationModel.get_exploration_count(), 1)
        saved_exploration = (
            exploration_models.ExplorationModel.get_all().fetch(1)[0])
        self.assertEqual(saved_exploration.title, 'A Title')
        self.assertEqual(saved_exploration.category, 'A Category')
        self.assertEqual(saved_exploration.objective, 'An Objective')


class ExplorationRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationRightsModel class."""

    def test_save(self):
        exploration_models.ExplorationRightsModel(
            id='id_0',
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            translator_ids=['translator_id'],
            viewer_ids=['viewer_id'],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            'cid', 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        saved_model = exploration_models.ExplorationRightsModel.get('id_0')
        self.assertEqual(saved_model.id, 'id_0')
        self.assertEqual(saved_model.owner_ids, ['owner_id'])
        self.assertEqual(saved_model.translator_ids, ['translator_id'])
        self.assertEqual(saved_model.viewer_ids, ['viewer_id'])


class ExplorationCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationCommitLogEntryModel class."""

    def test_get_all_non_private_commits(self):
        private_commit = (
            exploration_models.ExplorationCommitLogEntryModel.create(
                'a', 1, 'commiter_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PRIVATE, False))
        public_commit = (
            exploration_models.ExplorationCommitLogEntryModel.create(
                'b', 1, 'commiter_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        private_commit.exploration_id = 'a'
        public_commit.exploration_id = 'b'
        private_commit.put()
        public_commit.put()
        results, _, more = (
            exploration_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, None))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)

        with self.assertRaisesRegexp(
            Exception,
            'max_age must be a datetime.timedelta instance or None.'):
            results, _, more = (
                exploration_models.ExplorationCommitLogEntryModel
                .get_all_non_private_commits(2, None, 1))

        max_age = datetime.timedelta(hours=1)
        results, _, more = (
            exploration_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)


class ExpSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the ExpSummaryModel."""

    def test_get_non_private(self):
        public_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        public_exploration_summary_model.put()

        private_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        private_exploration_summary_model.put()
        exploration_summary_models = (
            exploration_models.ExpSummaryModel.get_non_private())
        self.assertEqual(
            exploration_summary_models,
            [public_exploration_summary_model])

    def test_get_top_rated(self):
        good_rating_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        good_rating_exploration_summary_model.scaled_average_rating = 100
        good_rating_exploration_summary_model.put()

        bad_rating_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        bad_rating_exploration_summary_model.scaled_average_rating = 0
        bad_rating_exploration_summary_model.put()

        self.assertEqual(
            exploration_models.ExpSummaryModel.get_top_rated(1),
            [good_rating_exploration_summary_model])
        self.assertEqual(
            exploration_models.ExpSummaryModel.get_top_rated(2),
            [good_rating_exploration_summary_model,
             bad_rating_exploration_summary_model])
        self.assertEqual(
            exploration_models.ExpSummaryModel.get_top_rated(3),
            [good_rating_exploration_summary_model,
             bad_rating_exploration_summary_model])

        # Test that private summaries should be ignored.
        good_rating_exploration_summary_model.status = (
            constants.ACTIVITY_STATUS_PRIVATE)
        good_rating_exploration_summary_model.put()
        self.assertEqual(
            exploration_models.ExpSummaryModel.get_top_rated(2),
            [bad_rating_exploration_summary_model])

    def test_get_private_at_least_viewable(self):
        viewable_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['a'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        viewable_exploration_summary_model.put()

        unviewable_exploration_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        unviewable_exploration_summary_model.put()
        exploration_summary_models = (
            exploration_models.ExpSummaryModel
            .get_private_at_least_viewable('a'))
        self.assertEqual(1, len(exploration_summary_models))
        self.assertEqual('id0', exploration_summary_models[0].id)

    def test_get_at_least_editable(self):
        editable_collection_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['a'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        editable_collection_summary_model.put()

        uneditable_collection_summary_model = (
            exploration_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        uneditable_collection_summary_model.put()

        exploration_summary_models = (
            exploration_models.ExpSummaryModel
            .get_at_least_editable('a'))
        self.assertEqual(1, len(exploration_summary_models))
        self.assertEqual('id0', exploration_summary_models[0].id)

        exploration_summary_models = (
            exploration_models.ExpSummaryModel
            .get_at_least_editable('viewer_id'))
        self.assertEqual(0, len(exploration_summary_models))

        exploration_summary_models = (
            exploration_models.ExpSummaryModel
            .get_at_least_editable('nonexistent_id'))
        self.assertEqual(0, len(exploration_summary_models))


class StateIdMappingModelUnitTest(test_utils.GenericTestBase):
    """Tests for the StateIdMappingModel."""

    def test_create_successfully_with_new_id(self):
        exploration_models.StateIdMappingModel.create(
            exp_id='id_0',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=0)

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_0', 0))

        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 0)

    def test_create_successfully_if_id_exists_and_overwrite(self):
        exploration_models.StateIdMappingModel.create(
            exp_id='id_1',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=1,
            overwrite=True)

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_1', 0))

        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 1)

        exploration_models.StateIdMappingModel.create(
            exp_id='id_1',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=0,
            overwrite=True)

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_1', 0))

        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 0)

    def test_create_failed_if_id_exists_and_no_overwrite(self):
        exploration_models.StateIdMappingModel.create(
            exp_id='id_1',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=1,
            overwrite=False)

        with self.assertRaisesRegexp(
            Exception,
            'State id mapping model already exists for exploration id_1,'
            ' version 0'):
            exploration_models.StateIdMappingModel.create(
                exp_id='id_1',
                exp_version=0,
                state_names_to_ids={},
                largest_state_id_used=0)

    def test_get_state_id_mapping_model(self):
        exploration_models.StateIdMappingModel.create(
            exp_id='id_2',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=1,
            overwrite=False)

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_2', 0))
        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 1)

    def test_delete_state_id_mapping_models(self):
        exploration_models.StateIdMappingModel.create(
            exp_id='id_3',
            exp_version=0,
            state_names_to_ids={},
            largest_state_id_used=1,
            overwrite=True)

        exploration_models.StateIdMappingModel.create(
            exp_id='id_3',
            exp_version=1,
            state_names_to_ids={},
            largest_state_id_used=1,
            overwrite=True)

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_3', 0))
        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 1)

        exploration_models.StateIdMappingModel.delete_state_id_mapping_models(
            'id_3', [0])

        with self.assertRaisesRegexp(
            Exception,
            'Entity for class StateIdMappingModel with id id_3.0 not found'):
            observed_model = (
                exploration_models.StateIdMappingModel.
                get_state_id_mapping_model('id_3', 0))

        observed_model = (
            exploration_models.StateIdMappingModel.
            get_state_id_mapping_model('id_3', 1))
        self.assertEqual(observed_model.state_names_to_ids, {})
        self.assertEqual(observed_model.largest_state_id_used, 1)

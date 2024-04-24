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

"""Tests for recent commit controllers."""

from __future__ import annotations

from core import feconf
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class RecentCommitsHandlerUnitTests(test_utils.GenericTestBase):
    """Test the RecentCommitsHandler class."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.committer_1_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.committer_2_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        commit1 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_1', 0, self.committer_1_id, 'create',
            'created first commit', [], 'public', True)
        commit2 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_1', 1, self.committer_2_id, 'edit', 'edited commit', [],
            'public', True)
        commit3 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_2', 0, self.committer_1_id, 'create',
            'created second commit', [], 'private', False)
        commit1.exploration_id = 'exp_1'
        commit2.exploration_id = 'exp_1'
        commit3.exploration_id = 'exp_2'
        commit1.update_timestamps()
        commit1.put()
        commit2.update_timestamps()
        commit2.put()
        commit3.update_timestamps()
        commit3.put()

    def test_get_recent_commits(self) -> None:
        """Test that this method should return all nonprivate commits."""
        self.login(self.MODERATOR_EMAIL)
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})
        self.assertEqual(len(response_dict['results']), 2)
        self.assertDictContainsSubset(
            {'username': self.VIEWER_USERNAME, 'exploration_id': 'exp_1',
             'post_commit_status': 'public', 'version': 0,
             'commit_message': 'created first commit',
             'commit_type': 'create'},
            response_dict['results'][1])
        self.assertDictContainsSubset(
            {'username': self.NEW_USER_USERNAME, 'exploration_id': 'exp_1',
             'post_commit_status': 'public', 'version': 1,
             'commit_message': 'edited commit',
             'commit_type': 'edit'},
            response_dict['results'][0])
        self.logout()

    def test_get_recent_commits_explorations(self) -> None:
        """Test that the response dict contains the correct exploration."""
        self.login(self.MODERATOR_EMAIL)
        self.save_new_default_exploration(
            'exp_1', 'owner0', title='MyExploration')
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})
        self.assertEqual(len(response_dict['exp_ids_to_exp_data']), 1)
        self.assertEqual(
            response_dict['exp_ids_to_exp_data']['exp_1']['title'],
            'MyExploration')
        self.logout()

    def test_get_recent_commits_three_pages_with_cursor(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})
        self.assertFalse(response_dict['more'])
        for i in range(feconf.COMMIT_LIST_PAGE_SIZE * 2):
            entity_id = 'my_entity_%s' % i
            exp_id = 'exp_%s' % i

            commit_i = exp_models.ExplorationCommitLogEntryModel.create(
                entity_id, 0, self.committer_2_id, 'create', 'created commit',
                [], 'public', True)
            commit_i.exploration_id = exp_id
            commit_i.update_timestamps()
            commit_i.put()
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})

        self.assertEqual(
            len(response_dict['results']), feconf.COMMIT_LIST_PAGE_SIZE)
        self.assertTrue(response_dict['more'])

        cursor = response_dict['cursor']
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={
                'query_type': 'all_non_private_commits',
                'cursor': cursor
            })
        self.assertEqual(
            len(response_dict['results']),
            feconf.COMMIT_LIST_PAGE_SIZE)
        self.assertTrue(response_dict['more'])
        cursor = response_dict['cursor']
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={
                'query_type': 'all_non_private_commits',
                'cursor': cursor
            })
        self.assertFalse(response_dict['more'])
        self.assertEqual(len(response_dict['results']), 2)
        self.logout()

    def test_get_recent_commits_with_invalid_query_type_returns_404_status(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        response = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'invalid_query_type'},
            expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Schema validation for \'query_type\' failed: Received '
            'invalid_query_type which is not in the allowed range of '
            'choices: [\'all_non_private_commits\']'
        )
        self.logout()

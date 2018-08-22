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

from core.platform import models
from core.tests import test_utils
import feconf

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class RecentCommitsHandlerUnitTests(test_utils.GenericTestBase):
    """Test the RecentCommitsHandler class."""

    def setUp(self):
        super(RecentCommitsHandlerUnitTests, self).setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        commit1 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_1', 0, 'committer_0', 'Janet',
            'create', 'created first commit', [], 'public', True)
        commit2 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_1', 1, 'committer_1', 'Joe',
            'edit', 'edited commit', [], 'public', True)
        commit3 = exp_models.ExplorationCommitLogEntryModel.create(
            'entity_2', 0, 'committer_0', 'Janet',
            'create', 'created second commit', [], 'private', False)
        commit1.exploration_id = 'exp_1'
        commit2.exploration_id = 'exp_1'
        commit3.exploration_id = 'exp_2'
        commit1.put()
        commit2.put()
        commit3.put()

    def test_get_recent_commits(self):
        """Test that this method should return all nonprivate commits."""
        self.login(self.MODERATOR_EMAIL)
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})
        self.assertEqual(len(response_dict['results']), 2)
        self.assertDictContainsSubset(
            {'username': 'Janet', 'exploration_id': 'exp_1',
             'post_commit_status': 'public', 'version': 0,
             'commit_message': 'created first commit',
             'commit_type': 'create'},
            response_dict['results'][1])
        self.assertDictContainsSubset(
            {'username': 'Joe', 'exploration_id': 'exp_1',
             'post_commit_status': 'public', 'version': 1,
             'commit_message': 'edited commit',
             'commit_type': 'edit'},
            response_dict['results'][0])
        self.logout()

    def test_get_recent_commits_explorations(self):
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

    def test_get_recent_commits_three_pages_with_cursor(self):
        self.login(self.MODERATOR_EMAIL)
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})
        self.assertFalse(response_dict['more'])
        for i in range(feconf.COMMIT_LIST_PAGE_SIZE * 2):
            entity_id = 'my_entity_%s' % i
            exp_id = 'exp_%s' % i

            commit_i = exp_models.ExplorationCommitLogEntryModel.create(
                entity_id, 0, 'committer_0', 'Joe',
                'create', 'created commit', [], 'public', True)
            commit_i.exploration_id = exp_id
            commit_i.put()
        response_dict = self.get_json(
            feconf.RECENT_COMMITS_DATA_URL,
            params={'query_type': 'all_non_private_commits'})

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

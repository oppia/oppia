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

"""Unit tests for jobs.batch_jobs.exp_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import stats_models

(
    exp_models,
    opportunity_models,
    stats_models
) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY,
    models.Names.STATISTICS
])


# Exploration migration backend tests with BEAM jobs involves creating and
# publishing the exploration. This requires a ElasticSearch stub for running
# while the backend tests run. JobTestBase does not initialize a
# ElasticSearch stub, so MigrateExplorationJobTests also inherits from
# GenericTestBase to successfully emulate the exploration publishing and
# verify the migration.
class MigrateExplorationJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):

    JOB_CLASS = exp_migration_jobs.MigrateExplorationJob

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_exp_is_not_migrated(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXP PREVIOUSLY MIGRATED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXP PROCESSED SUCCESS: 1')
        ])

        exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(exp_model.version, 1)

    def test_broken_exp_is_not_migrated(self) -> None:
        exploration_rights = rights_domain.ActivityRights(
            self.NEW_EXP_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights.id,
            owner_ids=exploration_rights.owner_ids,
            editor_ids=exploration_rights.editor_ids,
            voice_artist_ids=exploration_rights.voice_artist_ids,
            viewer_ids=exploration_rights.viewer_ids,
            community_owned=exploration_rights.community_owned,
            status=exploration_rights.status,
            viewable_if_private=exploration_rights.viewable_if_private,
            first_published_msec=exploration_rights.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.NEW_EXP_ID,
            title='title',
            category=' category',
            init_state_name='Introduction',
            states_schema_version=49)
        exp_model.update_timestamps()
        exp_model.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_1\', ''ValidationError('
                    '\'Names should not start or end with whitespace.\'))": 1'
                )
            )
        ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(migrated_exp_model.version, 1)

    def create_story_linked_to_exploration(self) -> None:
        """Creates a new story linked to the test exploration."""
        topic_id = 'topic_id_1'
        story_id = 'story_id_1'

        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description', 'fragment')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)
        topic_services.publish_topic(topic_id, feconf.SYSTEM_COMMITTER_ID)

        story = story_domain.Story.create_default_story(
            story_id, 'A story title', 'description', topic_id,
            'story-one')
        story_services.save_new_story(feconf.SYSTEM_COMMITTER_ID, story)
        topic_services.add_canonical_story(
            feconf.SYSTEM_COMMITTER_ID, topic_id, story_id)
        topic_services.publish_story(
            topic_id, story_id, feconf.SYSTEM_COMMITTER_ID)
        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'title': 'Title 1'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': self.NEW_EXP_ID
            })
        ]
        story_services.update_story(
            feconf.SYSTEM_COMMITTER_ID, story_id, change_list,
            'Added node.')

    def test_unmigrated_valid_published_exp_migrates(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = (
                self.save_new_linear_exp_with_state_names_and_interactions(
                    self.NEW_EXP_ID, feconf.SYSTEM_COMMITTER_ID,
                    ['Introduction'], ['EndExploration'],
                    title=self.EXP_TITLE, category='Algorithms',
                    correctness_feedback_enabled=True
            ))
            owner_action = user_services.get_user_actions_info(
                feconf.SYSTEM_COMMITTER_ID)
            exp_services.publish_exploration_and_update_user_profiles(
                owner_action, self.NEW_EXP_ID)
            opportunity_model = (
                opportunity_models.ExplorationOpportunitySummaryModel(
                    id=self.NEW_EXP_ID,
                    topic_id='topic_id1',
                    topic_name='topic',
                    story_id='story_id_1',
                    story_title='A story title',
                    chapter_title='Title 1',
                    content_count=20,
                    incomplete_translation_language_codes=['hi', 'ar'],
                    translation_counts={'hi': 1, 'ar': 2},
                    language_codes_needing_voice_artists=['en'],
                    language_codes_with_assigned_voice_artists=[]))
            opportunity_model.put()

            self.create_story_linked_to_exploration()

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXP MIGRATED SUCCESS: 1', stderr='')
        ])

        updated_opp_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.NEW_EXP_ID))
        updated_opp_summary = (
              opportunity_services
                  .get_exploration_opportunity_summary_from_model(
                      updated_opp_model))

        expected_opp_summary_dict = {
            'id': 'exp_1',
            'topic_name': 'topic',
            'chapter_title': 'Title 1',
            'story_title': 'A story title',
            'content_count': 1,
            'translation_counts': {},
            'translation_in_review_counts': {}}

        self.assertEqual(
            updated_opp_summary.to_dict(), expected_opp_summary_dict)

    def test_unmigrated_invalid_published_exp_raise_error(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='Algorithms')
            exploration.states['Introduction'].update_interaction_id(None)
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

            owner_action = user_services.get_user_actions_info(
                feconf.SYSTEM_COMMITTER_ID)
            exp_services.publish_exploration_and_update_user_profiles(
                owner_action, self.NEW_EXP_ID)
            opportunity_model = (
                opportunity_models.ExplorationOpportunitySummaryModel(
                    id=self.NEW_EXP_ID,
                    topic_id='topic_id1',
                    topic_name='topic',
                    story_id='story_id_1',
                    story_title='A story title',
                    chapter_title='Title 1',
                    content_count=20,
                    incomplete_translation_language_codes=['hi', 'ar'],
                    translation_counts={'hi': 1, 'ar': 2},
                    language_codes_needing_voice_artists=['en'],
                    language_codes_with_assigned_voice_artists=[]))
            opportunity_model.put()

            self.create_story_linked_to_exploration()

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_1\', ''ValidationError('
                    '\'This state does not have any interaction specified.\')'
                    ')": 1'
                )
            )
        ])

        updated_opp_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.NEW_EXP_ID))
        updated_opp_summary = (
              opportunity_services
                  .get_exploration_opportunity_summary_from_model(
                      updated_opp_model))

        expected_opp_summary_dict = {
            'id': 'exp_1',
            'topic_name': 'topic',
            'chapter_title': 'Title 1',
            'story_title': 'A story title',
            'content_count': 1,
            'translation_counts': {},
            'translation_in_review_counts': {}}

        self.assertEqual(
            updated_opp_summary.to_dict(), expected_opp_summary_dict)


# Exploration migration backend tests with BEAM jobs involves creating and
# publishing the exploration. This requires a ElasticSearch stub for running
# while the backend tests run. JobTestBase does not initialize a
# ElasticSearch stub, so MigrateExplorationJobTests also inherits from
# GenericTestBase to successfully emulate the exploration publishing and
# verify the migration.
class AuditExplorationMigrationJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):

    JOB_CLASS = exp_migration_jobs.AuditExplorationMigrationJob

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_exp_is_not_migrated(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXP PREVIOUSLY MIGRATED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXP PROCESSED SUCCESS: 1')
        ])

        exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(exp_model.version, 1)

    def test_broken_exp_is_not_migrated(self) -> None:
        exploration_rights = rights_domain.ActivityRights(
            self.NEW_EXP_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights.id,
            owner_ids=exploration_rights.owner_ids,
            editor_ids=exploration_rights.editor_ids,
            voice_artist_ids=exploration_rights.voice_artist_ids,
            viewer_ids=exploration_rights.viewer_ids,
            community_owned=exploration_rights.community_owned,
            status=exploration_rights.status,
            viewable_if_private=exploration_rights.viewable_if_private,
            first_published_msec=exploration_rights.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.NEW_EXP_ID,
            title='title',
            category=' category',
            init_state_name='Introduction',
            states_schema_version=49)
        exp_model.update_timestamps()
        exp_model.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_1\', ''ValidationError('
                    '\'Names should not start or end with whitespace.\'))": 1'
                )
            )
        ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(migrated_exp_model.version, 1)

    def create_story_linked_to_exploration(self) -> None:
        """Creates a new story linked to the test exploration."""
        topic_id = 'topic_id_1'
        story_id = 'story_id_1'

        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description', 'fragment')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)
        topic_services.publish_topic(topic_id, feconf.SYSTEM_COMMITTER_ID)

        story = story_domain.Story.create_default_story(
            story_id, 'A story title', 'description', topic_id,
            'story-one')
        story_services.save_new_story(feconf.SYSTEM_COMMITTER_ID, story)
        topic_services.add_canonical_story(
            feconf.SYSTEM_COMMITTER_ID, topic_id, story_id)
        topic_services.publish_story(
            topic_id, story_id, feconf.SYSTEM_COMMITTER_ID)
        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'title': 'Title 1'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': self.NEW_EXP_ID
            })
        ]
        story_services.update_story(
            feconf.SYSTEM_COMMITTER_ID, story_id, change_list,
            'Added node.')

    def test_unmigrated_exp_is_migrated(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = (
                self.save_new_linear_exp_with_state_names_and_interactions(
                    self.NEW_EXP_ID, feconf.SYSTEM_COMMITTER_ID,
                    ['Start'], ['Continue'],
                    title=self.EXP_TITLE, category='Algorithms',
                    correctness_feedback_enabled=True

                ))
            owner_action = user_services.get_user_actions_info(
                feconf.SYSTEM_COMMITTER_ID)
            exp_services.publish_exploration_and_update_user_profiles(
                owner_action, self.NEW_EXP_ID)
            opportunity_model = (
                opportunity_models.ExplorationOpportunitySummaryModel(
                    id=self.NEW_EXP_ID,
                    topic_id='topic_id1',
                    topic_name='topic',
                    story_id='story_id_1',
                    story_title='A story title',
                    chapter_title='Title 1',
                    content_count=20,
                    incomplete_translation_language_codes=['hi', 'ar'],
                    translation_counts={'hi': 1, 'ar': 2},
                    language_codes_needing_voice_artists=['en'],
                    language_codes_with_assigned_voice_artists=[]))
            opportunity_model.put()

            self.create_story_linked_to_exploration()

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXP MIGRATED SUCCESS: 1', stderr='')
        ])

        updated_opp_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.NEW_EXP_ID))
        updated_opp_summary = (
              opportunity_services
                  .get_exploration_opportunity_summary_from_model(
                      updated_opp_model))

        expected_opp_summary_dict = {
            'id': 'exp_1',
            'topic_name': 'topic',
            'chapter_title': 'Title 1',
            'story_title': 'A story title',
            'content_count': 1,
            'translation_counts': {},
            'translation_in_review_counts': {}}

        self.assertEqual(
            updated_opp_summary.to_dict(), expected_opp_summary_dict)

    def test_unmigrated_invalid_published_exp_raise_error(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='Algorithms')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

            owner_action = user_services.get_user_actions_info(
                feconf.SYSTEM_COMMITTER_ID)
            exp_services.publish_exploration_and_update_user_profiles(
                owner_action, self.NEW_EXP_ID)
            opportunity_model = (
                opportunity_models.ExplorationOpportunitySummaryModel(
                    id=self.NEW_EXP_ID,
                    topic_id='topic_id1',
                    topic_name='topic',
                    story_id='story_id_1',
                    story_title='A story title',
                    chapter_title='Title 1',
                    content_count=20,
                    incomplete_translation_language_codes=['hi', 'ar'],
                    translation_counts={'hi': 1, 'ar': 2},
                    language_codes_needing_voice_artists=['en'],
                    language_codes_with_assigned_voice_artists=[]))
            opportunity_model.put()

            self.create_story_linked_to_exploration()

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_1\', ''ValidationError('
                    '\'This state does not have any interaction specified.\')'
                    ')": 1'
                )
            )
        ])


class RegenerateMissingExplorationStatsModelsJobTests(
    job_test_utils.JobTestBase,
    test_utils.GenericTestBase
):
    """Tests for the RegenerateExplorationStatsJob."""

    JOB_CLASS = exp_migration_jobs.RegenerateMissingExplorationStatsModelsJob

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_regenerates_missing_stats_models(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 5'
            })], 'Changed title.')
        exp_stats_model_for_version_2 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        assert exp_stats_model_for_version_2 is not None
        exp_stats_model_for_version_2.delete()

        exp_stats_model_for_version_4 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 4)
        )
        assert exp_stats_model_for_version_4 is not None
        exp_stats_model_for_version_4.delete()

        self.assertIsNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        self.assertIsNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 4)
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1')
        ])

        self.assertIsNotNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        self.assertIsNotNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 4)
        )

    def test_job_regenerates_missing_stats_models_when_no_models_exist(
        self
    ) -> None:
        exp_id = 'ID1'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_stats_model_for_version_1 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )
        assert exp_stats_model_for_version_1 is not None
        exp_stats_model_for_version_1.delete()

        self.assertIsNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'ID1\', '
                    'Exception(\'No ExplorationStatsModels found\'))": 1'
                )
            )
        ])

        self.assertIsNotNone(
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )


class ExpSnapshotsMigrationAuditJobTests(
    job_test_utils.JobTestBase,
    test_utils.GenericTestBase
):
    """Tests for ExplorationMigrationAuditJob."""

    JOB_CLASS = exp_migration_jobs.ExpSnapshotsMigrationAuditJob
    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def create_exploration_with_states_schema_version(
        self,
        states_schema_version: int,
        exp_id: str,
        user_id: str,
        states_dict: Dict[str, state_domain.StateDict]
    ) -> None:
        """Saves a new default exploration with the given states dictionary in
        the given state schema version. All passed state dictionaries in
        'states_dict' must have the states schema version indicated by
        'states_schema_version'.
        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating explorations. This is
        because the latter approach would result in an exploration with the
        *current* states schema version.

        Args:
            states_schema_version: int. The state schema version.
            exp_id: str. The exploration ID.
            user_id: str. The user_id of the creator.
            states_dict: dict. The dict representation of all the states, in the
                given states schema version.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=states_schema_version,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=states_dict,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'title\'.'
        exp_model.commit(
            user_id, commit_message, [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id,
            title='title',
            category='category',
            objective='Old objective',
            language_code='en',
            tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids,
            contributor_ids=[],
            contributors_summary={},
        )
        exp_summary_model.put()

    def test_migration_audit_job_does_not_convert_up_to_date_exp(self) -> None:
        """Tests that the snapshot migration audit job does not convert a
        snapshot that is already the latest states schema version.
        """
        # Create a new, default exploration whose snapshots should not be
        # affected by the job.
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\'Snapshot'
                    ' is already at latest schema version\'))": 1'
                )
            )
        ])

    def test_migration_audit_job_skips_deleted_explorations(self) -> None:
        """Tests that the snapshot migration job skips deleted explorations
        and does not attempt to migrate any of the snapshots.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.VALID_EXP_ID)

        # Delete the exploration before migration occurs.
        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.VALID_EXP_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.VALID_EXP_ID)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', '
                    'Exception(\'Exploration does not exist.\'))": 2'
                )
            )
        ])

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_migration_job_audit_success(self) -> None:
        """Test that the audit job runs correctly on snapshots that use a
        previous state schema.
        """
        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 48)
        with swap_states_schema_version, swap_exp_schema_version:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '42',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID,
            self.VALID_EXP_ID,
            migration_change_list,
            'Ran Exploration Migration job.'
        )
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\'Snapshot'
                    ' is already at latest schema version\'))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='EXP PROCESSED SUCCESS: 1',
                stderr=''
            )
        ])

    def test_migration_job_audit_failure(self) -> None:
        """Test that the audit job catches any errors that would otherwise
        occur during the migration.
        """
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '42',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID,
            self.VALID_EXP_ID,
            migration_change_list,
            'Ran Exploration Migration job.'
        )
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Make a mock conversion function that raises an error when trying to
        # convert the old snapshot.
        mock_conversion = classmethod(
            lambda cls, exploration_dict: exploration_dict['property_that_dne'])

        with self.swap(
            exp_domain.Exploration, '_convert_states_v41_dict_to_v42_dict',
            mock_conversion
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception("'
                        'Exploration snapshot exp_id0 failed migration to '
                        'states v42: \'property_that_dne\'"))": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                        'Snapshot is already at latest schema version\'))": 1'
                    )
                )
            ])

    def test_audit_job_detects_invalid_exploration(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID,
            exploration
        )

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Changed language_code.', [])
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', '
                    'Exception(\'Exploration exp_id0 failed non-strict '
                    'validation\'))": 2'
                )
            )
        ])

    def test_audit_job_detects_exploration_that_is_not_up_to_date(self) -> None:
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        swap_states_schema_42 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_47 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_42, swap_exp_schema_47:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                        'Exploration is not at latest schema version\'))": 1'
                    )
                )
            ])

    def test_audit_job_handles_missing_states_schema_version(self) -> None:
        swap_exp_schema_37 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 37)
        with swap_exp_schema_37:
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                exploration = exp_domain.Exploration.create_default_exploration(
                    self.VALID_EXP_ID, title='title', category='category')
                exp_services.save_new_exploration(
                    feconf.SYSTEM_COMMITTER_ID, exploration)

            # Bring the main exploration to the latest schema.
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION, None,
                [self.VALID_EXP_ID])
            migration_change_list = [
                exp_domain.ExplorationChange({
                    'cmd': (
                        exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION),
                    'from_version': '41',
                    'to_version': '44'
                })
            ]
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                exp_services.update_exploration(
                    feconf.SYSTEM_COMMITTER_ID,
                    self.VALID_EXP_ID,
                    migration_change_list,
                    'Ran Exploration Migration job.'
                )
            exploration_model = exp_models.ExplorationModel.get(
                self.VALID_EXP_ID)
            self.assertEqual(exploration_model.states_schema_version, 44)

            # Modify the snapshot to have no states schema version. (This
            # implies a schema version of 0.)
            snapshot_content_model = (
                exp_models.ExplorationSnapshotContentModel.get(
                    '%s-1' % self.VALID_EXP_ID))
            del snapshot_content_model.content['states_schema_version']
            snapshot_content_model.update_timestamps(
                update_last_updated_time=False)
            snapshot_content_model.put()

            # There is no failure due to a missing states schema version.
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                self.assert_job_output_is([
                    job_run_result.JobRunResult(
                        stdout='',
                        stderr=(
                            'EXP PROCESSED ERROR: "(\'exp_id0\', Exception("'
                            'Exploration snapshot exp_id0 failed migration to '
                            'states v1: type object \'Exploration\' has no '
                            'attribute \'_convert_states_v0_dict_to_v1_dict\''
                            '"))": 1'
                        )
                    ),
                    job_run_result.JobRunResult(
                        stdout='',
                        stderr=(
                            'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                            'Snapshot is already at latest schema version\'))":'
                            ' 1'
                        )
                    )
                ])


class ExpSnapshotsMigrationJobTests(
    job_test_utils.JobTestBase,
    test_utils.GenericTestBase
):

    JOB_CLASS = exp_migration_jobs.ExpSnapshotsMigrationJob
    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def test_migration_job_does_not_convert_up_to_date_exp(self) -> None:
        """Tests that the exploration migration job does not convert a
        snapshot that is already the latest states schema version.
        """
        # Create a new, default exploration that should not be affected by the
        # job.
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                    'Snapshot is already at latest schema version\'))": 1'
                )
            )
        ])

    def test_migration_job_succeeds_on_default_exploration(self) -> None:
        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 48)
        with swap_states_schema_version, swap_exp_schema_version:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '42',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID,
            self.VALID_EXP_ID,
            migration_change_list,
            'Ran Exploration Migration job.'
        )
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\'Snapshot'
                    ' is already at latest schema version\'))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='EXP PROCESSED SUCCESS: 1',
                stderr=''
            )
        ])

    def test_migration_job_skips_deleted_explorations(self) -> None:
        """Tests that the exploration migration job skips deleted explorations
        and does not attempt to migrate.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.VALID_EXP_ID)

        # Delete the exploration before migration occurs.
        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.VALID_EXP_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.VALID_EXP_ID)

        # Start migration job on sample exploration.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', '
                    'Exception(\'Exploration does not exist.\'))": 2'
                )
            )
        ])

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_migration_job_detects_invalid_exploration(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Changed language_code.', [])
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='',
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_id0\', '
                    'Exception(\'Exploration exp_id0 failed non-strict '
                    'validation\'))": 2'
                )
            )
        ])

    def test_migration_job_detects_exploration_that_is_not_up_to_date(
        self
    ) -> None:
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)
        self.assertLess(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        swap_states_schema_42 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        swap_exp_schema_47 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 47)
        with swap_states_schema_42, swap_exp_schema_47:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                        'Exploration is not at latest schema version\'))": 1'
                    )
                )
            ])

    def test_migration_job_audit_failure(self) -> None:
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title='title', category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

        # Bring the main exploration to the latest schema.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.VALID_EXP_ID])
        latest_schema_version = str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '42',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID,
            self.VALID_EXP_ID,
            migration_change_list,
            'Ran Exploration Migration job.'
        )
        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        self.assertEqual(
            exploration_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Make a mock conversion function that raises an error when trying to
        # convert the old snapshot.
        mock_conversion = classmethod(
            lambda cls, exploration_dict: exploration_dict['property_that_dne'])

        with self.swap(
            exp_domain.Exploration, '_convert_states_v41_dict_to_v42_dict',
            mock_conversion
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception("'
                        'Exploration snapshot exp_id0 failed migration to '
                        'states v42: \'property_that_dne\'"))": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='',
                    stderr=(
                        'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                        'Snapshot is already at latest schema version\'))": 1'
                    )
                )
            ])

    def test_audit_job_handles_missing_states_schema_version(self) -> None:
        swap_exp_schema_37 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 37)
        with swap_exp_schema_37:
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                exploration = exp_domain.Exploration.create_default_exploration(
                    self.VALID_EXP_ID, title='title', category='category')
                exp_services.save_new_exploration(
                    feconf.SYSTEM_COMMITTER_ID, exploration)

            # Bring the main exploration to the latest schema.
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION, None,
                [self.VALID_EXP_ID])
            migration_change_list = [
                exp_domain.ExplorationChange({
                    'cmd': (
                        exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION),
                    'from_version': '41',
                    'to_version': '44'
                })
            ]
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                exp_services.update_exploration(
                    feconf.SYSTEM_COMMITTER_ID,
                    self.VALID_EXP_ID,
                    migration_change_list,
                    'Ran Exploration Migration job.'
                )
            exploration_model = exp_models.ExplorationModel.get(
                self.VALID_EXP_ID)
            self.assertEqual(exploration_model.states_schema_version, 44)

            # Modify the snapshot to have no states schema version. (This
            # implies a schema version of 0.)
            snapshot_content_model = (
                exp_models.ExplorationSnapshotContentModel.get(
                    '%s-1' % self.VALID_EXP_ID))
            del snapshot_content_model.content['states_schema_version']
            snapshot_content_model.update_timestamps(
                update_last_updated_time=False)
            snapshot_content_model.put()

            # There is no failure due to a missing states schema version.
            with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 44):
                self.assert_job_output_is([
                    job_run_result.JobRunResult(
                        stdout='',
                        stderr=(
                            'EXP PROCESSED ERROR: "(\'exp_id0\', Exception("'
                            'Exploration snapshot exp_id0 failed migration to '
                            'states v1: type object \'Exploration\' has no '
                            'attribute \'_convert_states_v0_dict_to_v1_dict\''
                            '"))": 1'
                        )
                    ),
                    job_run_result.JobRunResult(
                        stdout='',
                        stderr=(
                            'EXP PROCESSED ERROR: "(\'exp_id0\', Exception(\''
                            'Snapshot is already at latest schema version\'))":'
                            ' 1'
                        )
                    )
                ])

# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.jobs.transforms.exp_transforms."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import rights_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.transforms import exp_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(
    exp_models,
    opportunity_models,
) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY
])


class MigrateExplorationModelsTests(
    job_test_utils.PipelinedTestBase, test_utils.GenericTestBase):

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'
    EXP_ID_ONE = 'exp_one'
    EXP_ID_TWO = 'exp_two'

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

        unused_migrated_exps, job_run_results = (
            self.pipeline
            | exp_transforms.MigrateExplorationModels()
        )
        self.assert_pcoll_equal(
            job_run_results,
            [job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
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

    def test_broken_exp_is_not_migrated(self) -> None:
        exploration_rights = rights_domain.ActivityRights(
            self.EXP_ID_ONE, [feconf.SYSTEM_COMMITTER_ID],
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
            id=self.EXP_ID_ONE,
            title='title',
            category=' category',
            init_state_name='Introduction',
            states_schema_version=49)
        exp_model.update_timestamps()
        exp_model.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])
        # Save a valid unmigrated exploration.
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        with swap_states_schema_48:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.EXP_ID_TWO, title=self.EXP_TITLE, category='category')
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)

        unused_migrated_exps, job_run_results = (
            self.pipeline
            | exp_transforms.MigrateExplorationModels()
        )

        self.assert_pcoll_equal(
            job_run_results,
            [job_run_result.JobRunResult(
                stderr=(
                    'EXP PROCESSED ERROR: "(\'exp_one\', ''ValidationError('
                    '\'Names should not start or end with whitespace.\'))": 1'
                )
            ),
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1')
        ])

    def test_migrated_exp_is_not_migrated(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration)

        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        unused_migrated_exps, job_run_results = (
            self.pipeline
            | exp_transforms.MigrateExplorationModels()
        )

        self.assert_pcoll_equal(
            job_run_results,
            [job_run_result.JobRunResult(
                stdout='EXP PREVIOUSLY MIGRATED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='EXP PROCESSED SUCCESS: 1')
        ])

    def test_zero_objects_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([])
            | results_transforms.DrainResultsOnError()
        )

        self.assert_pcoll_empty(transform_result)

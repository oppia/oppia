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
from core import utils
from core.constants import constants
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import rights_domain
from core.domain import rights_manager
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

from typing import Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import translation_models

(
    exp_models, opportunity_models,
    translation_models
) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.OPPORTUNITY,
    models.Names.TRANSLATION
])


EXP_V46_DICT = utils.dict_from_yaml(
"""
author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Art
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 46
states:
  (untitled state):
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: END
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
            - - <p>Choice 1</p>
              - <p>Choice 2</p>
          rule_type: IsEqualToOrdering
        - inputs:
            x:
            - - <p>Choice 1</p>
          rule_type: IsEqualToOrderingWithOneItemAtIncorrectPosition
        - inputs:
            x: <p>Choice 1</p>
            y: 1
          rule_type: HasElementXAtPositionY
        - inputs:
            x: <p>Choice 1</p>
            y: <p>Choice 2</p>
          rule_type: HasElementXBeforeElementY
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        allowMultipleItemsInSamePosition:
          value: true
        choices:
          value:
          - content_id: ca_choices_2
            html: <p>Choice 1</p>
          - content_id: ca_choices_3
            html: <p>Choice 2</p>
      default_outcome:
        dest: (untitled state)
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: DragAndDropSortInput
      solution: null
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_choices_2: {}
        ca_choices_3: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
states_schema_version: 41
tags: []
title: Title
""")
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

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error')
        )

        exp_model = exp_models.ExplorationModel(
            id=self.NEW_EXP_ID,
            category=EXP_V46_DICT['category'],
            title=EXP_V46_DICT['title'],
            objective=EXP_V46_DICT['objective'],
            language_code=EXP_V46_DICT['language_code'],
            tags=EXP_V46_DICT['tags'],
            blurb=EXP_V46_DICT['blurb'],
            author_notes=EXP_V46_DICT['author_notes'],
            states_schema_version=EXP_V46_DICT['states_schema_version'],
            init_state_name=EXP_V46_DICT['init_state_name'],
            states=EXP_V46_DICT['states'],
            auto_tts_enabled=EXP_V46_DICT['auto_tts_enabled'],
            correctness_feedback_enabled=EXP_V46_DICT[
                'correctness_feedback_enabled']
        )
        rights_manager.create_new_exploration_rights(
            self.NEW_EXP_ID, feconf.SYSTEM_COMMITTER_ID)
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_summary_model = exp_models.ExpSummaryModel(**{
            'id': self.NEW_EXP_ID,
            'title': exp_model.title,
            'category': exp_model.category,
            'objective': exp_model.objective,
            'language_code': exp_model.language_code,
            'tags': exp_model.tags,
            'ratings': None,
            'scaled_average_rating': 4.0,
            'exploration_model_last_updated': exp_model.last_updated,
            'exploration_model_created_on': exp_model.created_on,
            'first_published_msec': None,
            'status': constants.ACTIVITY_STATUS_PRIVATE,
            'community_owned': False,
            'owner_ids': [feconf.SYSTEM_COMMITTER_ID],
            'editor_ids': [],
            'voice_artist_ids': [],
            'viewer_ids': [],
            'contributor_ids': [],
            'contributors_summary': {},
            'version': exp_model.version
        })
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'),
                job_run_result.JobRunResult(
                    stdout='EXP MIGRATED SUCCESS: 1', stderr='')
            ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(
            migrated_exp_model.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

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
        exp_model = exp_models.ExplorationModel(
            id=self.NEW_EXP_ID,
            category=EXP_V46_DICT['category'],
            title=EXP_V46_DICT['title'],
            objective=EXP_V46_DICT['objective'],
            language_code=EXP_V46_DICT['language_code'],
            tags=EXP_V46_DICT['tags'],
            blurb=EXP_V46_DICT['blurb'],
            author_notes=EXP_V46_DICT['author_notes'],
            states_schema_version=EXP_V46_DICT['states_schema_version'],
            init_state_name=EXP_V46_DICT['init_state_name'],
            states=EXP_V46_DICT['states'],
            auto_tts_enabled=EXP_V46_DICT['auto_tts_enabled'],
            correctness_feedback_enabled=EXP_V46_DICT[
                'correctness_feedback_enabled']
        )
        rights_manager.create_new_exploration_rights(
            self.NEW_EXP_ID, feconf.SYSTEM_COMMITTER_ID)
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_summary_model = exp_models.ExpSummaryModel(**{
            'id': self.NEW_EXP_ID,
            'title': exp_model.title,
            'category': exp_model.category,
            'objective': exp_model.objective,
            'language_code': exp_model.language_code,
            'tags': exp_model.tags,
            'ratings': None,
            'scaled_average_rating': 4.0,
            'exploration_model_last_updated': exp_model.last_updated,
            'exploration_model_created_on': exp_model.created_on,
            'first_published_msec': None,
            'status': constants.ACTIVITY_STATUS_PRIVATE,
            'community_owned': False,
            'owner_ids': [feconf.SYSTEM_COMMITTER_ID],
            'editor_ids': [],
            'voice_artist_ids': [],
            'viewer_ids': [],
            'contributor_ids': [],
            'contributors_summary': {},
            'version': exp_model.version
        })
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

        for i in range(2):
            translation_models.EntityTranslationsModel.create_new(
                feconf.TranslatableEntityType.EXPLORATION.value,
                exp_model.id,
                exp_model.version - i,
                'hi',
                {}
            ).put()

        all_translation_models: (
            Sequence[translation_models.EntityTranslationsModel]) = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(all_translation_models), 2)

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

        self.assertEqual(exp_model.states_schema_version, 41)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CACHE DELETION SUCCESS: 1', stderr=''),
            job_run_result.JobRunResult(
                stdout='EXP MIGRATED SUCCESS: 1', stderr=''),
            job_run_result.JobRunResult(
                stdout='TRANSLATION MODELS GENERATED SUCCESS: 1')
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
            'content_count': 4,
            'translation_counts': {
                'hi': 0
            },
            'translation_in_review_counts': {}}

        self.assertEqual(
            updated_opp_summary.to_dict(), expected_opp_summary_dict)

        all_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(all_translation_models), 3)
        self.assertEqual(
            [m.entity_version for m in all_translation_models], [0, 1, 2])


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
        exp_model = exp_models.ExplorationModel(
            id=self.NEW_EXP_ID,
            category=EXP_V46_DICT['category'],
            title=EXP_V46_DICT['title'],
            objective=EXP_V46_DICT['objective'],
            language_code=EXP_V46_DICT['language_code'],
            tags=EXP_V46_DICT['tags'],
            blurb=EXP_V46_DICT['blurb'],
            author_notes=EXP_V46_DICT['author_notes'],
            states_schema_version=EXP_V46_DICT['states_schema_version'],
            init_state_name=EXP_V46_DICT['init_state_name'],
            states=EXP_V46_DICT['states'],
            auto_tts_enabled=EXP_V46_DICT['auto_tts_enabled'],
            correctness_feedback_enabled=EXP_V46_DICT[
                'correctness_feedback_enabled']
        )
        rights_manager.create_new_exploration_rights(
            self.NEW_EXP_ID, feconf.SYSTEM_COMMITTER_ID)
        exp_model.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_summary_model = exp_models.ExpSummaryModel(**{
            'id': self.NEW_EXP_ID,
            'title': exp_model.title,
            'category': exp_model.category,
            'objective': exp_model.objective,
            'language_code': exp_model.language_code,
            'tags': exp_model.tags,
            'ratings': None,
            'scaled_average_rating': 4.0,
            'exploration_model_last_updated': exp_model.last_updated,
            'exploration_model_created_on': exp_model.created_on,
            'first_published_msec': None,
            'status': constants.ACTIVITY_STATUS_PRIVATE,
            'community_owned': False,
            'owner_ids': [feconf.SYSTEM_COMMITTER_ID],
            'editor_ids': [],
            'voice_artist_ids': [],
            'viewer_ids': [],
            'contributor_ids': [],
            'contributors_summary': {},
            'version': exp_model.version
        })
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            exp_model.id,
            exp_model.version,
            'hi',
            {}
        ).put()

        all_translation_models: (
            Sequence[translation_models.EntityTranslationsModel]) = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(
            len(all_translation_models), 1)

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

        exploration_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(exploration_model.states_schema_version, 41)

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
            'content_count': 4,
            'translation_counts': {
                'hi': 0
            },
            'translation_in_review_counts': {}
        }

        self.assertEqual(
            updated_opp_summary.to_dict(), expected_opp_summary_dict)

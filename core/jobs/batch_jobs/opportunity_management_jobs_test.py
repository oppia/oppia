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

"""Unit tests for jobs.batch_jobs.opportunity_management_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import opportunity_management_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import story_models
    from mypy_imports import topic_models

(
    exp_models, opportunity_models, story_models,
    topic_models,
) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.OPPORTUNITY, models.Names.STORY,
    models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()


class DeleteExplorationOpportunitySummariesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        opportunity_management_jobs.DeleteExplorationOpportunitySummariesJob)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_deletes_all_opportunities(self) -> None:
        opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='id1',
            topic_id='topic_id',
            topic_name='topic name',
            story_id='story_id',
            story_title='story title',
            chapter_title='chapter title',
            content_count=123,
            incomplete_translation_language_codes=['cs'],
            translation_counts=321,
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=['fr'])
        opportunity_model_1.update_timestamps()
        opportunity_model_1.put()
        opportunity_model_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='id2',
            topic_id='topic_id',
            topic_name='topic name',
            story_id='story_id',
            story_title='story title',
            chapter_title='chapter title',
            content_count=123,
            incomplete_translation_language_codes=['cs'],
            translation_counts=321,
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=['fr'])
        opportunity_model_2.update_timestamps()
        opportunity_model_2.put()

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)


class GenerateExplorationOpportunitySummariesJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
        opportunity_management_jobs.GenerateExplorationOpportunitySummariesJob)

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    TOPIC_1_ID = 'topic_1_id'
    TOPIC_2_ID = 'topic_2_id'
    STORY_1_ID = 'story_1_id'
    STORY_2_ID = 'story_2_id'
    LANG_1 = 'lang_1'

    def setUp(self) -> None:
        super().setUp()
        self.topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': False
            }])
        self.topic_model.update_timestamps()
        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel, id=self.TOPIC_1_ID)
        topic_rights_model.update_timestamps()

        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_1_ID,
            title='story title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.EXP_1_ID,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')
        story_model.update_timestamps()

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            })
        exp_model.update_timestamps()
        datastore_services.put_multi([
            exp_model, story_model, self.topic_model, topic_rights_model
        ])

    def test_empty_storage(self) -> None:
        self.topic_model.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.assert_job_output_is_empty()

    def test_generation_job_returns_initial_opportunity(self) -> None:
        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.EXP_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model is not None
        self.assertEqual(opportunity_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(opportunity_model.topic_name, 'topic title')
        self.assertEqual(opportunity_model.story_id, self.STORY_1_ID)
        self.assertEqual(opportunity_model.story_title, 'story title')
        self.assertEqual(opportunity_model.chapter_title, 'node title')
        self.assertEqual(opportunity_model.content_count, 1)
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} - {'cs'})
        self.assertEqual(opportunity_model.translation_counts, {})
        self.assertEqual(
            opportunity_model.language_codes_needing_voice_artists, ['cs'])

    def test_generation_job_returns_multiple_opportunities_for_one_topic(
        self
    ) -> None:
        self.topic_model.canonical_story_references.append({
            'story_id': self.STORY_2_ID,
            'story_is_published': False
        })
        self.topic_model.update_timestamps()

        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            title='story 2 title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node 2 title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.EXP_2_ID,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')
        story_model.update_timestamps()

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=48,
            states={
                'state1': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state1', is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            })
        exp_model.update_timestamps()
        datastore_services.put_multi([self.topic_model, exp_model, story_model])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.EXP_2_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model is not None
        self.assertEqual(opportunity_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(opportunity_model.topic_name, 'topic title')
        self.assertEqual(opportunity_model.story_id, self.STORY_2_ID)
        self.assertEqual(opportunity_model.story_title, 'story 2 title')
        self.assertEqual(opportunity_model.chapter_title, 'node 2 title')
        self.assertEqual(opportunity_model.content_count, 2)
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} - {'en'})
        self.assertEqual(opportunity_model.translation_counts, {})
        self.assertEqual(
            opportunity_model.language_codes_needing_voice_artists, ['en'])

    def test_job_returns_one_opportunity_for_multiple_topics_with_same_exp(
        self
    ) -> None:
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_2_ID,
            name='topic 2 title',
            canonical_name='topic 2 title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_2_ID,
                'story_is_published': False
            }])
        topic_model.update_timestamps()
        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel, id=self.TOPIC_2_ID)
        topic_rights_model.update_timestamps()

        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            title='story 2 title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node 2 title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.EXP_1_ID,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')
        story_model.update_timestamps()

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 1)

        opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.EXP_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model is not None
        self.assertEqual(opportunity_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(opportunity_model.topic_name, 'topic title')
        self.assertEqual(opportunity_model.story_id, self.STORY_1_ID)
        self.assertEqual(opportunity_model.story_title, 'story title')
        self.assertEqual(opportunity_model.chapter_title, 'node title')
        self.assertEqual(opportunity_model.content_count, 1)
        self.assertItemsEqual(  # type: ignore[no-untyped-call]
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} - {'cs'})
        self.assertEqual(opportunity_model.translation_counts, {})
        self.assertEqual(
            opportunity_model.language_codes_needing_voice_artists, ['cs'])

    def test_generation_job_fails_when_story_id_is_not_available(self) -> None:
        self.topic_model.canonical_story_references.append({
            'story_id': 'missing_id',
            'story_is_published': False
        })
        self.topic_model.update_timestamps()
        datastore_services.put_multi([self.topic_model])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stderr=(
                'ERROR: "Failed to regenerate opportunities for topic id: '
                'topic_1_id, missing_exp_with_ids: [], '
                'missing_story_with_ids: [\'missing_id\']": 1'
            ))
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

    def test_generation_job_fails_when_exp_id_is_not_available(self) -> None:
        self.topic_model.canonical_story_references.append({
            'story_id': self.STORY_2_ID,
            'story_is_published': False
        })
        self.topic_model.update_timestamps()

        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            title='story 2 title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node 2 title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': 'missing_id',
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')
        story_model.update_timestamps()

        datastore_services.put_multi([self.topic_model, story_model])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stderr=(
                'ERROR: "Failed to regenerate opportunities for topic id: '
                'topic_1_id, missing_exp_with_ids: [\'missing_id\'], '
                'missing_story_with_ids: []": 1'
            ))
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

    def test_generation_job_returns_multiple_opportunities_for_multiple_topics(
        self
    ) -> None:
        topic_model = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_2_ID,
            name='topic 2 title',
            canonical_name='topic 2 title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_2_ID,
                'story_is_published': False
            }])
        topic_model.update_timestamps()
        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel, id=self.TOPIC_2_ID)
        topic_rights_model.update_timestamps()

        story_model = self.create_model(
            story_models.StoryModel,
            id=self.STORY_2_ID,
            title='story 2 title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node 2 title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.EXP_2_ID,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')
        story_model.update_timestamps()

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=48,
            states={
                'state1': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state1', is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            })
        exp_model.update_timestamps()
        datastore_services.put_multi([
            exp_model, story_model, topic_model, topic_rights_model
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.EXP_2_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model is not None
        self.assertEqual(opportunity_model.topic_id, self.TOPIC_2_ID)
        self.assertEqual(opportunity_model.topic_name, 'topic 2 title')
        self.assertEqual(opportunity_model.story_id, self.STORY_2_ID)
        self.assertEqual(opportunity_model.story_title, 'story 2 title')
        self.assertEqual(opportunity_model.chapter_title, 'node 2 title')
        self.assertEqual(opportunity_model.content_count, 2)
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} - {'en'})
        self.assertEqual(opportunity_model.translation_counts, {})
        self.assertEqual(
            opportunity_model.language_codes_needing_voice_artists, ['en'])

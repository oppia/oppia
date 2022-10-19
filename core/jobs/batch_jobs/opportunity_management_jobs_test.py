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

from typing import Final, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import story_models
    from mypy_imports import topic_models

(
    exp_models,
    opportunity_models,
    story_models,
    topic_models,
    skill_models,
    question_models
) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY,
    models.Names.STORY,
    models.Names.TOPIC,
    models.Names.SKILL,
    models.Names.QUESTION
])

datastore_services = models.Registry.import_datastore_services()


class DeleteSkillOpportunityModelJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        opportunity_management_jobs.DeleteSkillOpportunityModelJob
    ] = opportunity_management_jobs.DeleteSkillOpportunityModelJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_deletes_all_opportunities(self) -> None:
        skill_opportunity_model_1 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='opportunity_id1',
            skill_description='A skill description',
            question_count=20,
        )
        skill_opportunity_model_1.update_timestamps()
        skill_opportunity_model_1.put()
        skill_opportunity_model_2 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='opportunity_id2',
            skill_description='A skill description',
            question_count=20,
        )
        skill_opportunity_model_2.update_timestamps()
        skill_opportunity_model_2.put()

        all_skill_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_skill_opportunity_models), 2)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        all_skill_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_skill_opportunity_models), 0)


class GenerateSkillOpportunityModelJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        opportunity_management_jobs.GenerateSkillOpportunityModelJob
    ] = opportunity_management_jobs.GenerateSkillOpportunityModelJob

    SKILL_1_ID: Final = 'skill_1'
    SKILL_1_DESCRIPTION: Final = 'skill 1'
    SKILL_2_ID: Final = 'skill_2'
    SKILL_2_DESCRIPTION: Final = 'skill 2'
    QUESTION_1_ID: Final = 'question_1'
    QUESTION_2_ID: Final = 'question_2'

    def setUp(self) -> None:
        super().setUp()

        question_skill_link_model_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_1_ID,
            skill_difficulty=1
        )

        question_skill_link_model_2 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_2_ID,
            skill_id=self.SKILL_2_ID,
            skill_difficulty=1
        )
        question_skill_link_model_1.update_timestamps()
        question_skill_link_model_2.update_timestamps()

        skill_1_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description=self.SKILL_1_DESCRIPTION,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'worked_examples': [],
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            superseding_skill_id='blah',
            all_questions_merged=False,
            prerequisite_skill_ids=[]
        )

        skill_2_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_2_ID,
            description=self.SKILL_2_DESCRIPTION,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'worked_examples': [],
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            superseding_skill_id='blah',
            all_questions_merged=False,
            prerequisite_skill_ids=[]
        )
        skill_1_model.update_timestamps()
        skill_2_model.update_timestamps()

        datastore_services.put_multi([
            skill_1_model,
            skill_2_model,
            question_skill_link_model_1,
            question_skill_link_model_2
        ])

    def test_generation_job_creates_new_models(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        opportunity_model_1 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description,
            self.SKILL_1_DESCRIPTION)
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_2_ID))
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description,
            self.SKILL_2_DESCRIPTION)
        self.assertEqual(opportunity_model_2.question_count, 1)

    def test_generation_job_does_not_count_duplicate_question_ids(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        question_1_duplicate_skilllinkmodel = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_1_ID,
            skill_difficulty=1
        )
        question_1_duplicate_skilllinkmodel.update_timestamps()
        datastore_services.put_multi([question_1_duplicate_skilllinkmodel])

        all_skill_link_models = list(
            question_models.QuestionSkillLinkModel.get_all())
        self.assertEqual(len(all_skill_link_models), 3)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        opportunity_model_1 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description,
            self.SKILL_1_DESCRIPTION)
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_2_ID))
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description,
            self.SKILL_2_DESCRIPTION)
        self.assertEqual(opportunity_model_2.question_count, 1)

    def test_generation_job_counts_multiple_questions(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        question_skill_link_model_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_2_ID,
            skill_difficulty=1
        )
        question_skill_link_model_1.update_timestamps()
        datastore_services.put_multi([question_skill_link_model_1])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 2')
        ])

        opportunity_model_1 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description,
            self.SKILL_1_DESCRIPTION)
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = (
            opportunity_models.SkillOpportunityModel.get(
                self.SKILL_2_ID))
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description,
            self.SKILL_2_DESCRIPTION)
        self.assertEqual(opportunity_model_2.question_count, 2)

    def test_generation_job_fails_when_validation_failure(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

        with self.swap(
            opportunity_management_jobs.GenerateSkillOpportunityModelJob,
            '_count_unique_question_ids',
            lambda _: -1
        ):

            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='', stderr='ERROR: \"Expected question_count to be '
                    'a non-negative integer, received -1\": 2'
                )
            ])


class DeleteExplorationOpportunitySummariesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        opportunity_management_jobs.DeleteExplorationOpportunitySummariesJob
    ] = opportunity_management_jobs.DeleteExplorationOpportunitySummariesJob

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

    JOB_CLASS: Type[
        opportunity_management_jobs.GenerateExplorationOpportunitySummariesJob
    ] = opportunity_management_jobs.GenerateExplorationOpportunitySummariesJob

    VALID_USER_ID_1: Final = 'uid_%s' % (
        'a' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    VALID_USER_ID_2: Final = 'uid_%s' % (
        'b' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'
    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    LANG_1: Final = 'lang_1'

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
            }],
            page_title_fragment_for_web='fragm'
        )
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
                'state': state_domain.State.create_default_state(
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
        self.assertItemsEqual(
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
                'state1': state_domain.State.create_default_state(
                    'state1', is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
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
        self.assertItemsEqual(
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
            }],
            page_title_fragment_for_web='fragm'
        )
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
        self.assertItemsEqual(
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
            }],
            page_title_fragment_for_web='fragm',
        )
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
                'state1': state_domain.State.create_default_state(
                    'state1', is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
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
        self.assertItemsEqual(
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} - {'en'})
        self.assertEqual(opportunity_model.translation_counts, {})
        self.assertEqual(
            opportunity_model.language_codes_needing_voice_artists, ['en'])

    def test_generation_job_ignores_contents_only_consisting_of_digits(
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
            language_code='en',
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

        init_state = state_domain.State.create_default_state(
            'state1', is_initial_state=True)
        # Set the content.
        init_state.update_content(
            state_domain.SubtitledHtml.from_dict({
                'content_id': 'content',
                'html': '<p>This is content</p>'
            })
        )
        # Set the multiple choice interaction.
        init_state.update_interaction_id('MultipleChoiceInput')
        state_interaction_cust_args: state_domain.CustomizationArgsDictType = {
            'showChoicesInShuffledOrder': {
                'value': True
            },
            'choices': {
                'value': [
                    {
                        'content_id': 'ca_choices_0',
                        'html': '<p>option 1</p>'
                    },
                    {
                        'content_id': 'ca_choices_1',
                        'html': '<p>1,000</p>'
                    },
                    {
                        'content_id': 'ca_choices_2',
                        'html': '<p>100</p>'
                    }
                ]
            }
        }
        init_state.update_interaction_customization_args(
            state_interaction_cust_args)
        # Set the default outcome.
        default_outcome = state_domain.Outcome(
            'Introduction', None, state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], None, None
        )
        init_state.update_interaction_default_outcome(default_outcome)
        # Set the translations for contents not only consisting of digits.
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>content in Hindi</p>',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>default_outcome in Hindi</p>',
                        'needs_update': False
                    }
                },
                'ca_choices_0': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>option 1 in Hindi</p>',
                        'needs_update': False
                    }
                },
                'ca_choices_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': '<p>1,000 in Hindi</p>',
                        'needs_update': False
                    }
                },
                'ca_choices_2': {}
            }
        }
        written_translations = state_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        init_state.update_written_translations(written_translations)

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
                'state': init_state.to_dict()
            }
        )
        exp_model.update_timestamps()

        datastore_services.put_multi([self.topic_model, story_model, exp_model])

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
                self.EXP_2_ID)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model is not None
        self.assertEqual(opportunity_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(opportunity_model.topic_name, 'topic title')
        self.assertEqual(opportunity_model.story_id, self.STORY_2_ID)
        self.assertEqual(opportunity_model.story_title, 'story 2 title')
        self.assertEqual(opportunity_model.chapter_title, 'node 2 title')
        # Choice 2 should not be counted as its value is numeric.
        self.assertEqual(opportunity_model.content_count, 4)
        # Translations in Hindi should be completed without translating the
        # content only consisting of digits.
        self.assertItemsEqual(
            opportunity_model.incomplete_translation_language_codes,
            {l['id'] for l in constants.SUPPORTED_AUDIO_LANGUAGES} -
            {'en', 'hi'}
        )
        self.assertEqual(opportunity_model.translation_counts, {'hi': 4})
        self.assertItemsEqual(
            opportunity_model.language_codes_needing_voice_artists,
            ['en', 'hi']
        )

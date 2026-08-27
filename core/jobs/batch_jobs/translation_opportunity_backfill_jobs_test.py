# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for translation_opportunity_backfill_jobs."""

from __future__ import annotations

import re

from core import feature_flag_list, feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    opportunity_services,
    rights_manager,
    skill_domain,
    skill_services,
)
from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_opportunity_backfill_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

import result
from typing import Dict, List, cast

MYPY = False
if MYPY:
    from mypy_imports import (
        exp_models,
        opportunity_models,
        skill_models,
        story_models,
        topic_models,
        translation_models,
    )

(
    exp_models,
    opportunity_models,
    translation_models,
    story_models,
    topic_models,
    skill_models,
) = models.Registry.import_models(
    [
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
        models.Names.STORY,
        models.Names.TOPIC,
        models.Names.SKILL,
    ]
)
datastore_services = models.Registry.import_datastore_services()


def get_opportunity_model(
    entity_type: feconf.TranslatableEntityType, entity_id: str
) -> opportunity_models.TranslationOpportunityModel:
    """Returns the opportunity model stored for the given entity.

    Args:
        entity_type: TranslatableEntityType. The type of the entity.
        entity_id: str. The ID of the entity.

    Returns:
        TranslationOpportunityModel. The stored opportunity model.
    """
    stored_models = (
        opportunity_models.TranslationOpportunityModel.get_by_entity_ids(
            entity_type.value, [entity_id]
        )
    )
    model = stored_models[0]
    assert model is not None
    return model


class TranslationOpportunityJobTestBase(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Base class for testing translation opportunity jobs."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('author@example.com', 'author')
        self.author_id = self.get_user_id_from_email('author@example.com')
        self.exp_id = 'exp_1'

        rights_manager.create_new_exploration_rights(
            self.exp_id, self.author_id
        )
        model = self.create_model(
            exp_models.ExplorationModel,
            id=self.exp_id,
            title='Test Exploration',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='Category',
            objective='Objective',
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exp_domain.Exploration.create_default_exploration(
                        self.exp_id
                    )
                    .states[feconf.DEFAULT_INIT_STATE_NAME]
                    .to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])

        # Create TopicModel and TopicRightsModel.
        topic_model = self.create_model(
            topic_models.TopicModel,
            id='topic_id',
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='topic',
            canonical_story_references=[
                {'story_id': 'story_id', 'story_is_published': True}
            ],
            page_title_fragment_for_web='fragm',
        )
        topic_model.update_timestamps()

        topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_id',
            topic_is_published=True,
        )
        topic_rights_model.update_timestamps()

        datastore_services.put_multi([topic_model, topic_rights_model])

        # Create StoryModel.
        story_model = self.create_model(
            story_models.StoryModel,
            id='story_id',
            title='story title',
            description='description',
            notes='notes',
            language_code='en',
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            corresponding_topic_id='topic_id',
            url_fragment='story-frag',
            story_contents={
                'initial_node_id': 'node_1',
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'chapter title',
                        'exploration_id': self.exp_id,
                        'destination_node_ids': [],
                        'prerequisite_skill_ids': [],
                        'acquired_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'thumbnail_size_in_bytes': None,
                    }
                ],
                'next_node_id': 'node_2',
            },
        )
        story_model.update_timestamps()
        story_model.commit(
            self.author_id, 'commit_message', [{'cmd': 'test_command'}]
        )

        # Create EntityTranslationsModel.
        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration',
                self.exp_id,
                1,
                'hi',
                {
                    feconf.EXPLORATION_TITLE_CONTENT_ID: {
                        'content_format': 'unicode',
                        'content_value': 'Hola',
                        'needs_update': False,
                    },
                    'content_1': {
                        'content_format': 'html',
                        'content_value': '<p>Needs update</p>',
                        'needs_update': True,
                    },
                },
            )
        )
        translation_model.update_timestamps()
        translation_model.put()


class BackfillExplorationTranslationOpportunityModelJobTests(
    TranslationOpportunityJobTestBase
):
    JOB_CLASS = (
        translation_opportunity_backfill_jobs.BackfillExplorationTranslationOpportunityModelJob
    )

    def test_creates_translation_opportunity_model(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.EXPLORATION, self.exp_id
        )
        self.assertIsNotNone(model)
        self.assertEqual(model.entity_type, 'exploration')
        self.assertEqual(model.entity_id, self.exp_id)
        self.assertEqual(model.topic_ids, ['topic_id'])
        # Exploration currently has 4 metadata fields (title, objective, category, 1 tag) when flag is overridden.
        self.assertEqual(model.content_count, 4)
        self.assertEqual(model.translation_counts, {'hi': 1})

    def test_translation_count_ignores_content_the_exploration_does_not_have(
        self,
    ) -> None:
        # A translation model keeps its entries when the content they belong
        # to is removed from the exploration, and it can also hold entries for
        # content whose value is now empty. Neither is part of content_count,
        # so counting the model's entries directly stores a count that is
        # larger than content_count, and the stored opportunity then fails
        # validation when the contributor dashboard reads it.
        translation_model = translation_models.EntityTranslationsModel.create_new(
            'exploration',
            self.exp_id,
            1,
            'ar',
            {
                feconf.EXPLORATION_TITLE_CONTENT_ID: {
                    'content_format': 'unicode',
                    'content_value': 'Arabic title',
                    'needs_update': False,
                },
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Translation of empty content</p>',
                    'needs_update': False,
                },
                'removed_content_id': {
                    'content_format': 'html',
                    'content_value': '<p>Translation of removed content</p>',
                    'needs_update': False,
                },
            },
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.EXPLORATION, self.exp_id
        )
        self.assertEqual(model.content_count, 4)
        self.assertEqual(model.translation_counts, {'hi': 1, 'ar': 1})
        self.assertIn('ar', model.incomplete_translation_language_codes)
        opportunity = (
            opportunity_services.get_translation_opportunity_summary_from_model(
                model
            )
        )
        self.assertEqual(opportunity.translation_counts['ar'], 1)

    def test_create_translation_opportunity_with_supported_language_code(
        self,
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration('exp_es')
        exp.language_code = 'es'
        res = translation_opportunity_backfill_jobs.BackfillExplorationTranslationOpportunityModelJob._create_translation_opportunity(  # pylint: disable=protected-access
            (
                'exp_es',
                {
                    'topic_ids': ['topic_id'],
                    'entity': [exp],
                    'translations': [],
                },
            )
        )
        # Err.unwrap() is typed NoReturn, so narrowing to Ok is what gives
        # the model its type here instead of unwrapping the result.
        assert isinstance(res, result.Ok)
        model = res.ok_value
        self.assertNotIn('es', model.incomplete_translation_language_codes)

    def test_run_with_datastore_updates_disabled(self) -> None:
        orphaned_model = opportunity_models.TranslationOpportunityModel(
            id='exploration.orphaned_exp_id',
            entity_type='exploration',
            entity_id='orphaned_exp_id',
            topic_ids=['topic_id'],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 1},
        )
        orphaned_model.update_timestamps()
        orphaned_model.put()

        with self.swap(self.JOB_CLASS, 'DATASTORE_UPDATES_ALLOWED', False):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                    ),
                    job_run_result.JobRunResult(
                        stdout='TRANSLATION OPPORTUNITY MODEL DELETION SUCCESS: 1'
                    ),
                ]
            )

        self.assertIsNotNone(
            opportunity_models.TranslationOpportunityModel.get_by_id(
                'exploration.orphaned_exp_id'
            )
        )

    def test_deletes_orphaned_translation_opportunity_model(self) -> None:
        orphaned_model = opportunity_models.TranslationOpportunityModel(
            id='exploration.orphaned_exp_id',
            entity_type='exploration',
            entity_id='orphaned_exp_id',
            topic_ids=['topic_id'],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 1},
        )
        orphaned_model.update_timestamps()
        orphaned_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL DELETION SUCCESS: 1'
                ),
            ]
        )

        self.assertIsNone(
            opportunity_models.TranslationOpportunityModel.get_by_id(
                'exploration.orphaned_exp_id'
            )
        )

    def test_does_not_delete_opportunities_of_other_entity_types(self) -> None:
        # A skill opportunity is never produced by this job's pipeline, so it
        # must not be counted as an orphan and deleted.
        skill_opportunity = (
            opportunity_models.TranslationOpportunityModel.create_new(
                entity_type=feconf.TranslatableEntityType.SKILL.value,
                entity_id='skill_id',
                topic_ids=['topic_id'],
                content_count=2,
                incomplete_translation_language_codes=['hi'],
                translation_counts={'hi': 1},
            )
        )
        skill_opportunity.update_timestamps()
        skill_opportunity.put()

        # No deletion result is reported, because the only model this job did
        # not recompute belongs to another entity type.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        surviving_model = get_opportunity_model(
            feconf.TranslatableEntityType.SKILL, 'skill_id'
        )
        self.assertEqual(surviving_model.content_count, 2)
        self.assertEqual(surviving_model.translation_counts, {'hi': 1})

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_creates_translation_opportunity_model_with_new_opp_models_flag_enabled(
        self,
    ) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.EXPLORATION, self.exp_id
        )
        self.assertIsNotNone(model)
        self.assertEqual(model.entity_type, 'exploration')
        self.assertEqual(model.entity_id, self.exp_id)
        self.assertEqual(model.topic_ids, ['topic_id'])
        # Exploration has 4 metadata fields (title, objective, category, 1 tag).
        self.assertEqual(model.content_count, 4)
        self.assertEqual(model.translation_counts, {'hi': 1})

    def test_creates_translation_opportunity_model_with_complete_native_language(
        self,
    ) -> None:
        translation_model_en = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration', self.exp_id, 1, 'en', {}
            )
        )
        translation_model_en.update_timestamps()
        translation_model_en.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.EXPLORATION, self.exp_id
        )
        self.assertEqual(model.translation_counts, {'hi': 1, 'en': 0})

    def test_fails_if_missing_story_model(self) -> None:
        story_model = story_models.StoryModel.get_by_id('story_id')
        story_model.delete(
            self.author_id, 'Deleting for test', force_deletion=True
        )
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr='TRANSLATION OPPORTUNITY MODEL CREATION ERROR: "Missing topic_id": 1'
                ),
            ]
        )

    def test_fails_if_missing_exploration_model(self) -> None:
        exp_model = exp_models.ExplorationModel.get_by_id(self.exp_id)
        exp_model.delete(self.author_id, 'Deleting for test')
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr='TRANSLATION OPPORTUNITY MODEL CREATION ERROR: "Missing ExplorationModel": 1'
                ),
            ]
        )

    def test_skips_explorations_linked_to_unpublished_stories(self) -> None:
        # Mark the story as unpublished in the topic's references.
        topic_model = topic_models.TopicModel.get_by_id('topic_id')
        topic_model.canonical_story_references = [
            {'story_id': 'story_id', 'story_is_published': False}
        ]
        topic_model.update_timestamps()
        datastore_services.put_multi([topic_model])

        # The exploration exists and has translations, but the story is
        # unpublished so no opportunity should be created.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'TRANSLATION OPPORTUNITY MODEL CREATION'
                        ' ERROR: "Missing topic_id": 1'
                    )
                ),
            ]
        )

    def test_creates_translation_opportunity_model_with_non_zero_content_count(
        self,
    ) -> None:
        # Create a new exploration 'exp_2' with non-empty content.
        exp_id = 'exp_2'
        rights_manager.create_new_exploration_rights(exp_id, self.author_id)

        exploration = exp_domain.Exploration.create_default_exploration(exp_id)
        exploration.states[feconf.DEFAULT_INIT_STATE_NAME].content.html = (
            '<p>HTML Content</p>'
        )
        default_outcome = exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME
        ].interaction.default_outcome
        assert default_outcome is not None
        default_outcome.feedback.html = '<p>Feedback HTML</p>'

        model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exploration.states[feconf.DEFAULT_INIT_STATE_NAME].to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])

        # Create StoryModel 2 pointing to exp_2.
        story_model_2 = self.create_model(
            story_models.StoryModel,
            id='story_id_2',
            title='story title 2',
            description='description 2',
            notes='notes 2',
            language_code='en',
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            corresponding_topic_id='topic_id',
            url_fragment='story-frag-2',
            story_contents={
                'initial_node_id': 'node_1',
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'chapter title 2',
                        'exploration_id': exp_id,
                        'destination_node_ids': [],
                        'prerequisite_skill_ids': [],
                        'acquired_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'thumbnail_size_in_bytes': None,
                    }
                ],
                'next_node_id': 'node_2',
            },
        )
        story_model_2.update_timestamps()
        story_model_2.commit(
            self.author_id, 'commit_message', [{'cmd': 'test_command'}]
        )

        # Add canonical story reference to TopicModel.
        topic_model = topic_models.TopicModel.get_by_id('topic_id')
        topic_model.canonical_story_references.append(
            {'story_id': 'story_id_2', 'story_is_published': True}
        )
        topic_model.update_timestamps()
        datastore_services.put_multi([topic_model])

        # Create EntityTranslationsModel for exp_2.
        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration',
                exp_id,
                1,
                'hi',
                {
                    'content_0': {
                        'content_format': 'html',
                        'content_value': '<p>Translated Content</p>',
                        'needs_update': False,
                    },
                    'default_outcome_1': {
                        'content_format': 'html',
                        'content_value': '<p>Translated Feedback</p>',
                        'needs_update': True,
                    },
                },
            )
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 2'
                ),
            ]
        )

        opportunity = get_opportunity_model(
            feconf.TranslatableEntityType.EXPLORATION, exp_id
        )
        self.assertIsNotNone(opportunity)
        # 2 translatable contents + 2 metadata fields (title, tag) = 4.
        self.assertEqual(opportunity.content_count, 4)
        self.assertEqual(opportunity.translation_counts, {'hi': 1})

    def test_additional_story_references_and_missing_exploration_ids(
        self,
    ) -> None:
        # Create a new exploration 'exp_3'.
        exp_id = 'exp_3'
        rights_manager.create_new_exploration_rights(exp_id, self.author_id)

        exploration = exp_domain.Exploration.create_default_exploration(exp_id)
        model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test Exploration 3',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exploration.states[feconf.DEFAULT_INIT_STATE_NAME].to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])

        # Create TopicModel with additional story references.
        topic_model_3 = self.create_model(
            topic_models.TopicModel,
            id='topic_id_3',
            name='topic title 3',
            canonical_name='topic title 3',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='topic-three',
            canonical_story_references=[],
            additional_story_references=[
                {'story_id': 'story_id_3', 'story_is_published': True},
                {'story_id': 'story_id_4', 'story_is_published': False},
            ],
            page_title_fragment_for_web='fragm3',
        )
        topic_model_3.update_timestamps()

        topic_rights_model_3 = self.create_model(
            topic_models.TopicRightsModel,
            id='topic_id_3',
            topic_is_published=True,
        )
        topic_rights_model_3.update_timestamps()

        datastore_services.put_multi([topic_model_3, topic_rights_model_3])

        # Create StoryModel 3 with a node having no exploration_id.
        story_model_3 = self.create_model(
            story_models.StoryModel,
            id='story_id_3',
            title='story title 3',
            description='description 3',
            notes='notes 3',
            language_code='en',
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            corresponding_topic_id='topic_id_3',
            url_fragment='story-frag-3',
            story_contents={
                'initial_node_id': 'node_1',
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'chapter title 3',
                        'exploration_id': exp_id,
                        'destination_node_ids': [],
                        'prerequisite_skill_ids': [],
                        'acquired_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'thumbnail_size_in_bytes': None,
                    },
                    {
                        'id': 'node_2',
                        'title': 'chapter title 4',
                        'exploration_id': None,
                        'destination_node_ids': [],
                        'prerequisite_skill_ids': [],
                        'acquired_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'thumbnail_size_in_bytes': None,
                    },
                ],
                'next_node_id': 'node_3',
            },
        )
        story_model_3.update_timestamps()
        story_model_3.commit(
            self.author_id, 'commit_message', [{'cmd': 'test_command'}]
        )

        # Create EntityTranslationsModel for exp_3.
        translation_model_3 = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration',
                exp_id,
                1,
                'hi',
                {},
            )
        )
        translation_model_3.update_timestamps()
        translation_model_3.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 2'
                ),
            ]
        )


class AuditBackfillExplorationTranslationOpportunityModelJobTests(
    TranslationOpportunityJobTestBase
):
    """Tests for AuditBackfillExplorationTranslationOpportunityModelJob."""

    JOB_CLASS = (
        translation_opportunity_backfill_jobs.AuditBackfillExplorationTranslationOpportunityModelJob
    )

    def test_empty_job_output(self) -> None:
        # Here we use cast because we are narrowing down the type of models.
        exp_models_list = cast(
            List[exp_models.ExplorationModel],
            exp_models.ExplorationModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in exp_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        topic_models_list = cast(
            List[topic_models.TopicModel],
            topic_models.TopicModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in topic_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        story_models_list = cast(
            List[story_models.StoryModel],
            story_models.StoryModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in story_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        translation_models_list = cast(
            List[translation_models.EntityTranslationsModel],
            translation_models.EntityTranslationsModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in translation_models_list]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 0\n'
                        '- Total Content Count (Computed): 0\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
            ]
        )

    def test_audit_identifies_matching_model(self) -> None:
        exp_model = exp_models.ExplorationModel.get_by_id(self.exp_id)
        exp_model.states[feconf.DEFAULT_INIT_STATE_NAME]['content'][
            'html'
        ] = '<p>Content</p>'
        exp_model.update_timestamps()
        exp_model.commit(
            self.author_id,
            'Update content',
            [{'cmd': 'edit_exploration_property'}],
        )

        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration',
                self.exp_id,
                2,
                'hi',
                {
                    feconf.EXPLORATION_TITLE_CONTENT_ID: {
                        'content_format': 'unicode',
                        'content_value': 'Hola',
                        'needs_update': False,
                    },
                    'content_1': {
                        'content_format': 'html',
                        'content_value': '<p>Needs update</p>',
                        'needs_update': True,
                    },
                },
            )
        )
        translation_model.update_timestamps()
        translation_model.put()

        matching_model = opportunity_models.TranslationOpportunityModel(
            id='exploration.exp_1',
            entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
            entity_id=self.exp_id,
            topic_ids=['topic_id'],
            content_count=5,
            incomplete_translation_language_codes=[
                lang['id']
                for lang in constants.SUPPORTED_AUDIO_LANGUAGES
                if lang['id'] != 'en'
            ],
            translation_counts={'hi': 1},
        )
        matching_model.update_timestamps()
        matching_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 1\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 5\n'
                        '- Total Content Count (Computed): 5\n'
                        '- Total Translation Counts (Existing): hi: 1\n'
                        '- Total Translation Counts (Computed): hi: 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_missing_model(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 1\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 0\n'
                        '- Total Content Count (Computed): 4\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): hi: 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_discrepancy_model(self) -> None:
        discrepant_model = opportunity_models.TranslationOpportunityModel(
            id='exploration.exp_1',
            entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
            entity_id=self.exp_id,
            topic_ids=['topic_id'],
            content_count=10,
            incomplete_translation_language_codes=[],
            translation_counts={},
        )
        discrepant_model.update_timestamps()
        discrepant_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 1\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 10\n'
                        '- Total Content Count (Computed): 4\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): hi: 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'Discrepancy for model exploration.exp_1: '
                        'Existing (content_count=10, translation_counts={}), '
                        'Computed (content_count=4, translation_counts={\'hi\': 1})'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_orphaned_model(self) -> None:
        # Here we use cast because we are narrowing down the type of models.
        exp_models_list = cast(
            List[exp_models.ExplorationModel],
            exp_models.ExplorationModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in exp_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        topic_models_list = cast(
            List[topic_models.TopicModel],
            topic_models.TopicModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in topic_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        story_models_list = cast(
            List[story_models.StoryModel],
            story_models.StoryModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in story_models_list]
        )
        # Here we use cast because we are narrowing down the type of models.
        translation_models_list = cast(
            List[translation_models.EntityTranslationsModel],
            translation_models.EntityTranslationsModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in translation_models_list]
        )

        orphaned_model = opportunity_models.TranslationOpportunityModel(
            id='exploration.exp_1',
            entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
            entity_id=self.exp_id,
            topic_ids=['topic_id'],
            content_count=1,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 1},
        )
        orphaned_model.update_timestamps()
        orphaned_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 1\n'
                        '- Total Content Count (Existing): 1\n'
                        '- Total Content Count (Computed): 0\n'
                        '- Total Translation Counts (Existing): hi: 1\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
            ]
        )

    def test_audit_ignores_opportunities_of_other_entity_types(self) -> None:
        # A skill opportunity is never produced by this job's pipeline, so it
        # must not be reported as orphaned.
        skill_opportunity = (
            opportunity_models.TranslationOpportunityModel.create_new(
                entity_type=feconf.TranslatableEntityType.SKILL.value,
                entity_id='skill_id',
                topic_ids=['topic_id'],
                content_count=2,
                incomplete_translation_language_codes=['hi'],
                translation_counts={'hi': 1},
            )
        )
        skill_opportunity.update_timestamps()
        skill_opportunity.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 1\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 0\n'
                        '- Total Content Count (Computed): 4\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): hi: 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )


class SkillOpportunityJobTestBase(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Base class for testing skill translation opportunity jobs."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('skillauthor@example.com', 'skillauthor')
        self.admin_id = self.get_user_id_from_email('skillauthor@example.com')
        self.skill_id = 'skill_1'

        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['<p>Explanation 1</p>']
            ),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['<p>Explanation 2</p>']
            ),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['<p>Explanation 3</p>']
            ),
        ]

        skill = skill_domain.Skill.create_default_skill(
            self.skill_id, 'Skill Description', rubrics
        )
        skill_services.save_new_skill(self.admin_id, skill)

        topic_model = self.create_model(
            topic_models.TopicModel,
            id='topic_id',
            name='topic title',
            canonical_name='topic title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='topic',
            uncategorized_skill_ids=[self.skill_id],
            page_title_fragment_for_web='fragm',
        )
        topic_model.update_timestamps()
        datastore_services.put_multi([topic_model])


class BackfillSkillOpportunityModelJobTests(SkillOpportunityJobTestBase):
    """Tests for BackfillSkillOpportunityModelJob."""

    JOB_CLASS = (
        translation_opportunity_backfill_jobs.BackfillSkillOpportunityModelJob
    )

    def test_creates_skill_translation_opportunity_model(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.SKILL, self.skill_id
        )
        self.assertIsNotNone(model)
        self.assertEqual(model.entity_type, 'skill')
        self.assertEqual(model.entity_id, self.skill_id)
        self.assertEqual(model.topic_ids, ['topic_id'])
        self.assertEqual(model.content_count, 1)

    def test_creates_skill_translation_opportunity_model_with_translations(
        self,
    ) -> None:
        translation_model = translation_models.EntityTranslationsModel(
            id=f'skill.{self.skill_id}.1.hi',
            entity_type='skill',
            entity_id=self.skill_id,
            entity_version=1,
            language_code='hi',
            translations={
                feconf.SKILL_DESCRIPTION_CONTENT_ID: {
                    'content_format': 'unicode',
                    'content_value': 'Hindi description',
                    'needs_update': False,
                }
            },
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.SKILL, self.skill_id
        )
        self.assertIsNotNone(model)
        self.assertEqual(model.translation_counts, {'hi': 1})

    def test_translation_count_ignores_content_the_skill_does_not_have(
        self,
    ) -> None:
        # A skill's rubric explanations are not translatable content, and a
        # skill whose explanation is empty does not count it either, so
        # translations of them are not part of content_count. Counting the
        # translation model's entries directly stores a count larger than
        # content_count, and the stored opportunity then fails validation
        # when the contributor dashboard reads it.
        translation_model = translation_models.EntityTranslationsModel(
            id=f'skill.{self.skill_id}.1.ar',
            entity_type='skill',
            entity_id=self.skill_id,
            entity_version=1,
            language_code='ar',
            translations={
                feconf.SKILL_DESCRIPTION_CONTENT_ID: {
                    'content_format': 'unicode',
                    'content_value': 'Arabic description',
                    'needs_update': False,
                },
                'rubric_explanation_0': {
                    'content_format': 'html',
                    'content_value': '<p>Arabic explanation 1</p>',
                    'needs_update': False,
                },
                'rubric_explanation_1': {
                    'content_format': 'html',
                    'content_value': '<p>Arabic explanation 2</p>',
                    'needs_update': False,
                },
            },
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = get_opportunity_model(
            feconf.TranslatableEntityType.SKILL, self.skill_id
        )
        self.assertEqual(model.content_count, 1)
        self.assertEqual(model.translation_counts, {'ar': 1})
        opportunity = (
            opportunity_services.get_translation_opportunity_summary_from_model(
                model
            )
        )
        self.assertEqual(opportunity.translation_counts['ar'], 1)

    def test_create_skill_translation_opportunity_returns_error_cases(
        self,
    ) -> None:
        err1 = translation_opportunity_backfill_jobs.BackfillSkillOpportunityModelJob._create_translation_opportunity(  # pylint: disable=protected-access
            ('skill_1', {'topic_ids': [], 'entity': [], 'translations': []})
        )
        self.assertEqual(err1, result.Err('Missing topic_id'))

        err2 = translation_opportunity_backfill_jobs.BackfillSkillOpportunityModelJob._create_translation_opportunity(  # pylint: disable=protected-access
            (
                'skill_1',
                {'topic_ids': ['topic_id'], 'entity': [], 'translations': []},
            )
        )
        self.assertEqual(err2, result.Err('Missing SkillModel'))

    def test_create_skill_translation_opportunity_with_needs_update_and_supported_lang(
        self,
    ) -> None:
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['<p>Explanation 1</p>']
            ),
        ]
        skill = skill_domain.Skill.create_default_skill(
            'skill_es', 'Skill Description', rubrics
        )
        skill.version = 1
        skill.language_code = 'es'

        translation_model = translation_models.EntityTranslationsModel(
            id='skill.skill_es.1.es',
            entity_type='skill',
            entity_id='skill_es',
            entity_version=1,
            language_code='es',
            translations={
                feconf.SKILL_DESCRIPTION_CONTENT_ID: {
                    'content_format': 'unicode',
                    'content_value': 'Spanish description',
                    'needs_update': True,
                }
            },
        )

        res = translation_opportunity_backfill_jobs.BackfillSkillOpportunityModelJob._create_translation_opportunity(  # pylint: disable=protected-access
            (
                'skill_es',
                {
                    'topic_ids': ['topic_id'],
                    'entity': [skill],
                    'translations': [translation_model],
                },
            )
        )
        # Err.unwrap() is typed NoReturn, so narrowing to Ok is what gives
        # the model its type here instead of unwrapping the result.
        assert isinstance(res, result.Ok)
        model = res.ok_value
        self.assertEqual(model.translation_counts, {'es': 0})
        self.assertNotIn('es', model.incomplete_translation_language_codes)

    def test_deletes_orphaned_skill_translation_opportunity_model(
        self,
    ) -> None:
        orphaned_model = opportunity_models.TranslationOpportunityModel(
            id='skill.orphaned_skill_id',
            entity_type='skill',
            entity_id='orphaned_skill_id',
            topic_ids=['topic_id'],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 1},
        )
        orphaned_model.update_timestamps()
        orphaned_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL DELETION SUCCESS: 1'
                ),
            ]
        )

        self.assertIsNone(
            opportunity_models.TranslationOpportunityModel.get_by_id(
                'skill.orphaned_skill_id'
            )
        )


class AuditBackfillSkillOpportunityModelJobTests(SkillOpportunityJobTestBase):
    """Tests for AuditBackfillSkillOpportunityModelJob."""

    JOB_CLASS = (
        translation_opportunity_backfill_jobs.AuditBackfillSkillOpportunityModelJob
    )

    def _put_skill_opportunity(
        self,
        entity_id: str,
        content_count: int,
        translation_counts: Dict[str, int],
    ) -> None:
        """Stores a skill opportunity model for the audit job to compare
        against.

        Args:
            entity_id: str. The ID of the skill.
            content_count: int. The stored translatable content count.
            translation_counts: dict(str, int). The stored translation counts.
        """
        model = opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.TranslatableEntityType.SKILL.value,
            entity_id=entity_id,
            topic_ids=['topic_id'],
            content_count=content_count,
            incomplete_translation_language_codes=['hi'],
            translation_counts=translation_counts,
        )
        model.update_timestamps()
        model.put()

    def _delete_all_skill_source_models(self) -> None:
        """Deletes the models the skill opportunities are computed from, so
        that the pipeline computes nothing.
        """
        # Here we use cast because we are narrowing down the type of models.
        stored_skill_models = cast(
            List[skill_models.SkillModel],
            skill_models.SkillModel.get_all().fetch(),
        )
        # Here we use cast because we are narrowing down the type of models.
        stored_topic_models = cast(
            List[topic_models.TopicModel],
            topic_models.TopicModel.get_all().fetch(),
        )
        datastore_services.delete_multi(
            [model.key for model in stored_skill_models]
            + [model.key for model in stored_topic_models]
        )

    def test_audit_identifies_missing_model(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 1\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 0\n'
                        '- Total Content Count (Computed): 1\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_matching_model(self) -> None:
        translation_model = translation_models.EntityTranslationsModel(
            id=f'skill.{self.skill_id}.1.hi',
            entity_type=feconf.TranslatableEntityType.SKILL.value,
            entity_id=self.skill_id,
            entity_version=1,
            language_code='hi',
            translations={
                feconf.SKILL_DESCRIPTION_CONTENT_ID: {
                    'content_format': 'unicode',
                    'content_value': 'Hindi description',
                    'needs_update': False,
                }
            },
        )
        translation_model.update_timestamps()
        translation_model.put()

        self._put_skill_opportunity(self.skill_id, 1, {'hi': 1})

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 1\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 1\n'
                        '- Total Content Count (Computed): 1\n'
                        '- Total Translation Counts (Existing): hi: 1\n'
                        '- Total Translation Counts (Computed): hi: 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_discrepancy_model(self) -> None:
        self._put_skill_opportunity(self.skill_id, 10, {})

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 1\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 10\n'
                        '- Total Content Count (Computed): 1\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'Discrepancy for model skill.skill_1: '
                        'Existing (content_count=10, translation_counts={}), '
                        'Computed (content_count=1, translation_counts={})'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_identifies_orphaned_model(self) -> None:
        self._put_skill_opportunity('orphaned_skill_id', 2, {'hi': 1})
        self._delete_all_skill_source_models()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 0\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 1\n'
                        '- Total Content Count (Existing): 2\n'
                        '- Total Content Count (Computed): 0\n'
                        '- Total Translation Counts (Existing): hi: 1\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
            ]
        )

    def test_audit_ignores_opportunities_of_other_entity_types(self) -> None:
        # An exploration opportunity is never produced by this job's pipeline,
        # so it must not be reported as orphaned.
        exp_opportunity = (
            opportunity_models.TranslationOpportunityModel.create_new(
                entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
                entity_id='exp_id',
                topic_ids=['topic_id'],
                content_count=4,
                incomplete_translation_language_codes=['hi'],
                translation_counts={'hi': 1},
            )
        )
        exp_opportunity.update_timestamps()
        exp_opportunity.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 1\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 0\n'
                        '- Total Content Count (Existing): 0\n'
                        '- Total Content Count (Computed): 1\n'
                        '- Total Translation Counts (Existing): None\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

    def test_audit_job_does_not_modify_datastore(self) -> None:
        self._put_skill_opportunity('orphaned_skill_id', 2, {'hi': 1})

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Audit Summary:\n'
                        '- Matches: 0\n'
                        '- Missing in Datastore: 1\n'
                        '- Discrepancies: 0\n'
                        '- Orphaned in Datastore: 1\n'
                        '- Total Content Count (Existing): 2\n'
                        '- Total Content Count (Computed): 1\n'
                        '- Total Translation Counts (Existing): hi: 1\n'
                        '- Total Translation Counts (Computed): None'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        # The orphan is reported but not deleted, and the missing opportunity
        # is reported but not created.
        orphan = get_opportunity_model(
            feconf.TranslatableEntityType.SKILL, 'orphaned_skill_id'
        )
        self.assertEqual(orphan.content_count, 2)
        self.assertIsNone(
            opportunity_models.TranslationOpportunityModel.get_by_entity_ids(
                feconf.TranslatableEntityType.SKILL.value, [self.skill_id]
            )[0]
        )


class BackfillTranslationOpportunityModelJobBaseTests(
    job_test_utils.PipelinedTestBase
):
    """Tests for the base class shared by the backfill and audit jobs."""

    def test_compute_translation_opportunities_raises_not_implemented_error(
        self,
    ) -> None:
        job = translation_opportunity_backfill_jobs.BackfillTranslationOpportunityModelJobBase(
            self.pipeline
        )
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'Subclasses must implement the '
                '_compute_translation_opportunities() method'
            ),
        ):
            job._compute_translation_opportunities()  # pylint: disable=protected-access

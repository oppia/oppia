# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.
reject_invalid_suggestion_and_delete_invalid_translation_jobs.
"""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import rights_domain
from core.domain import translation_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import (
    reject_invalid_suggestion_and_delete_invalid_translation_jobs)
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models
    from mypy_imports import translation_models

(
    exp_models,
    opportunity_models,
    story_models,
    suggestion_models,
    topic_models,
    translation_models) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY,
    models.Names.STORY,
    models.Names.SUGGESTION,
    models.Names.TOPIC,
    models.Names.TRANSLATION
])

STATE_DICT_IN_V52 = {
    'content': {'content_id': 'content', 'html': ''},
    'param_changes': [],
    'interaction': {
        'solution': None,
        'answer_groups': [],
        'default_outcome': {
            'param_changes': [],
            'feedback': {
                'content_id': 'default_outcome',
                'html': 'Default outcome'
            },
            'dest': 'Introduction',
            'dest_if_really_stuck': None,
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'labelled_as_correct': False
        },
        'customization_args': {
            'rows': {
                'value': 1
            },
            'placeholder': {
                'value': {
                    'unicode_str': '',
                    'content_id': 'ca_placeholder_1'
                }
            }
        },
        'confirmed_unclassified_answers': [],
        'id': 'TextInput',
        'hints': []
    },
    'linked_skill_id': None,
    'recorded_voiceovers': {
        'voiceovers_mapping': {
            'content': {},
            'default_outcome': {},
            'ca_placeholder_1': {}
        }
    },
    'written_translations': {
        'translations_mapping': {
            'content': {},
            'default_outcome': {},
            'ca_placeholder_1': {}
        }
    },
    'classifier_model_id': None,
    'card_is_checkpoint': False,
    'solicit_answer_details': False,
    'next_content_id_index': 2
}

TRANSLATION_HTML = (
    '<p>another translation</p>'
)

TRANSLATED_CONTENT_DICT = translation_domain.TranslatedContent(
    '<p>translated content</p>',
    translation_domain.TranslatableContentFormat.HTML, False).to_dict()

TRANSLATED_CONTENT_DICT_NEEDS_UPDATE = translation_domain.TranslatedContent(
    '<p>translated content</p>',
    translation_domain.TranslatableContentFormat.HTML, True).to_dict()

CHANGE_DICT = {
    'cmd': 'add_translation',
    'content_id': 'content_0',
    'language_code': 'hi',
    'content_html': 'html',
    'state_name': 'Introduction',
    'translation_html': TRANSLATION_HTML
}


class RejectTranslationSuggestionsForTranslatedContentsJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        reject_invalid_suggestion_and_delete_invalid_translation_jobs
        .RejectTranslationSuggestionsForTranslatedContentsJob
    )
    EXP_1_ID = 'exp1'
    EXP_2_ID = 'exp2'

    def setUp(self) -> None:
        super().setUp()

        exploration_rights_1 = rights_domain.ActivityRights(
            self.EXP_1_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_1.id,
            owner_ids=exploration_rights_1.owner_ids,
            editor_ids=exploration_rights_1.editor_ids,
            voice_artist_ids=exploration_rights_1.voice_artist_ids,
            viewer_ids=exploration_rights_1.viewer_ids,
            community_owned=exploration_rights_1.community_owned,
            status=exploration_rights_1.status,
            viewable_if_private=exploration_rights_1.viewable_if_private,
            first_published_msec=exploration_rights_1.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_1.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        exploration_rights_2 = rights_domain.ActivityRights(
            self.EXP_2_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_2.id,
            owner_ids=exploration_rights_2.owner_ids,
            editor_ids=exploration_rights_2.editor_ids,
            voice_artist_ids=exploration_rights_2.voice_artist_ids,
            viewer_ids=exploration_rights_2.viewer_ids,
            community_owned=exploration_rights_2.community_owned,
            status=exploration_rights_2.status,
            viewable_if_private=exploration_rights_2.viewable_if_private,
            first_published_msec=exploration_rights_2.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exp 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_2.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT,
            'default_outcome_1': TRANSLATED_CONTENT_DICT_NEEDS_UPDATE}
        ))
        self.entity_translation_2 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_2_ID,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT,
            'default_outcome_1': TRANSLATED_CONTENT_DICT_NEEDS_UPDATE}
        ))
        self.put_multi([
            self.entity_translation_1, self.entity_translation_2])

    def test_no_suggestions_are_rejected_in_case_of_no_invalid_suggestions(
        self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_suggestion_is_rejected(self) -> None:
        CHANGE_DICT['content_id'] = 'content_0'
        invalid_suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.exp_1.id,
            target_version_at_submission=self.exp_1.version,
            language_code='hi'
        )
        invalid_suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([invalid_suggestion])

        CHANGE_DICT['content_id'] = 'default_outcome_1'
        valid_suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.exp_1.id,
            target_version_at_submission=self.exp_1.version,
            language_code='hi'
        )
        valid_suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([valid_suggestion])

        errored_value = (
            '{'
            f'\'entity_id\': \'{self.exp_1.id}\', \'entity_version\': '
            f'{self.exp_1.version}, \'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', \'content_id\': '
            f'\'content_0\', \'suggestion_id\': {invalid_suggestion.id}'
            '}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='REJECTED SUGGESTIONS COUNT SUCCESS: 1'
            )
        ])

        updated_suggestion = suggestion_models.GeneralSuggestionModel.get(
            invalid_suggestion.id)
        self.assertEqual(
            updated_suggestion.status,
            suggestion_models.STATUS_REJECTED
        )

        not_updated_suggestion = suggestion_models.GeneralSuggestionModel.get(
            valid_suggestion.id)
        self.assertEqual(
            not_updated_suggestion.status,
            suggestion_models.STATUS_IN_REVIEW
        )


class AuditRejectTranslationSuggestionsForTranslatedContentsJobTests(
    job_test_utils.JobTestBase
):
    JOB_CLASS = (
        reject_invalid_suggestion_and_delete_invalid_translation_jobs
        .AuditRejectTranslationSuggestionsForTranslatedContentsJob
    )
    EXP_1_ID = 'exp1'
    EXP_2_ID = 'exp2'

    def setUp(self) -> None:
        super().setUp()

        exploration_rights_1 = rights_domain.ActivityRights(
            self.EXP_1_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_1.id,
            owner_ids=exploration_rights_1.owner_ids,
            editor_ids=exploration_rights_1.editor_ids,
            voice_artist_ids=exploration_rights_1.voice_artist_ids,
            viewer_ids=exploration_rights_1.viewer_ids,
            community_owned=exploration_rights_1.community_owned,
            status=exploration_rights_1.status,
            viewable_if_private=exploration_rights_1.viewable_if_private,
            first_published_msec=exploration_rights_1.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_1.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        exploration_rights_2 = rights_domain.ActivityRights(
            self.EXP_2_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_2.id,
            owner_ids=exploration_rights_2.owner_ids,
            editor_ids=exploration_rights_2.editor_ids,
            voice_artist_ids=exploration_rights_2.voice_artist_ids,
            viewer_ids=exploration_rights_2.viewer_ids,
            community_owned=exploration_rights_2.community_owned,
            status=exploration_rights_2.status,
            viewable_if_private=exploration_rights_2.viewable_if_private,
            first_published_msec=exploration_rights_2.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exp 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_2.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT,
            'content_0': TRANSLATED_CONTENT_DICT_NEEDS_UPDATE}
        ))
        self.entity_translation_2 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_2_ID,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT,
            'content_0': TRANSLATED_CONTENT_DICT_NEEDS_UPDATE}
        ))
        self.put_multi([
            self.entity_translation_1, self.entity_translation_2])

    def test_no_suggestions_are_reported_in_case_of_no_invalid_suggestions(
        self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_suggestions_are_reported(self) -> None:
        CHANGE_DICT['content_id'] = 'default_outcome_1'
        invalid_suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.exp_1.id,
            target_version_at_submission=self.exp_1.version,
            language_code='hi'
        )
        invalid_suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            invalid_suggestion])

        CHANGE_DICT['content_id'] = 'content_0'
        valid_suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.exp_1.id,
            target_version_at_submission=self.exp_1.version,
            language_code='hi'
        )
        valid_suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            valid_suggestion])

        errored_value = (
            '{'
            f'\'entity_id\': \'{self.exp_1.id}\', \'entity_version\': '
            f'{self.exp_1.version}, \'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', \'content_id\': '
            '\'default_outcome_1\', \'suggestion_id\': '
            f'{invalid_suggestion.id}'
            '}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='SUGGESTIONS TO BE REJECTED COUNT SUCCESS: 1'
            )
        ])

        invalid_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(
                invalid_suggestion.id)
        )
        self.assertEqual(
            invalid_suggestion_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )

        valid_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(
                valid_suggestion.id)
        )
        self.assertEqual(
            valid_suggestion_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )


class DeleteTranslationsForInvalidContentIDsJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        reject_invalid_suggestion_and_delete_invalid_translation_jobs
        .DeleteTranslationsForInvalidContentIDsJob
    )
    EXP_1_ID = 'exp1'
    TOPIC_1_ID = 'topic_1_id'
    STORY_1_ID = 'story_1_id'

    def setUp(self) -> None:
        super().setUp()

        exploration_rights_1 = rights_domain.ActivityRights(
            self.EXP_1_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_1.id,
            owner_ids=exploration_rights_1.owner_ids,
            editor_ids=exploration_rights_1.editor_ids,
            voice_artist_ids=exploration_rights_1.voice_artist_ids,
            viewer_ids=exploration_rights_1.viewer_ids,
            community_owned=exploration_rights_1.community_owned,
            status=exploration_rights_1.status,
            viewable_if_private=exploration_rights_1.viewable_if_private,
            first_published_msec=exploration_rights_1.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_1.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT}
        ))

        audio_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
        incomplete_translation_language_codes = (
            audio_language_codes - set(['en']))
        self.exp_opportunity_summary_model_1 = (
            opportunity_models.ExplorationOpportunitySummaryModel(
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                topic_name='topic name',
                story_id=self.STORY_1_ID,
                story_title='story title',
                chapter_title='node title',
                content_count=2,
                incomplete_translation_language_codes=sorted(
                    list(incomplete_translation_language_codes)),
                translation_counts={'hi': 1},
                language_codes_needing_voice_artists=['en'],
                language_codes_with_assigned_voice_artists=[]
            )
        )
        self.exp_opportunity_summary_model_1.update_timestamps()

        self.put_multi([
            self.entity_translation_1, self.exp_opportunity_summary_model_1])

    def test_no_translations_are_deleted_in_case_of_no_invalid_translations(
        self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_translations_are_deleted(self) -> None:
        self.entity_translation_1.translations[
            'invalid_content'] = TRANSLATED_CONTENT_DICT
        self.exp_opportunity_summary_model_1.translation_counts['hi'] += 1

        self.put_multi([
            self.entity_translation_1, self.exp_opportunity_summary_model_1])

        errored_value = (
            '{'
            f'\'entity_id\': \'{self.exp_1.id}\', \'entity_version\': '
            f'{self.exp_1.version}, \'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', \'content_id\': '
            '\'invalid_content\'}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='DELETED TRANSLATIONS COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='UPDATED ENTITY TRANSLATION MODELS COUNT SUCCESS: 1'
            )
        ])

        updated_entity_translation_model = (
            translation_models.EntityTranslationsModel.get(
                self.entity_translation_1.id))
        self.assertNotIn(
            'invalid_content',
            updated_entity_translation_model.translations.keys()
        )

        updated_exp_opportunity_summary_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.exp_opportunity_summary_model_1.id))
        self.assertEqual(
            1,
            updated_exp_opportunity_summary_model.translation_counts['hi']
        )


class AuditDeleteTranslationsForInvalidContentIDsJobTests(
    job_test_utils.JobTestBase
):
    JOB_CLASS = (
        reject_invalid_suggestion_and_delete_invalid_translation_jobs
        .AuditDeleteTranslationsForInvalidContentIDsJob
    )
    EXP_1_ID = 'exp1'
    TOPIC_1_ID = 'topic_1_id'
    STORY_1_ID = 'story_1_id'

    def setUp(self) -> None:
        super().setUp()

        exploration_rights_1 = rights_domain.ActivityRights(
            self.EXP_1_ID, [feconf.SYSTEM_COMMITTER_ID],
            [], [], [])
        commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]
        exp_models.ExplorationRightsModel(
            id=exploration_rights_1.id,
            owner_ids=exploration_rights_1.owner_ids,
            editor_ids=exploration_rights_1.editor_ids,
            voice_artist_ids=exploration_rights_1.voice_artist_ids,
            viewer_ids=exploration_rights_1.viewer_ids,
            community_owned=exploration_rights_1.community_owned,
            status=exploration_rights_1.status,
            viewable_if_private=exploration_rights_1.viewable_if_private,
            first_published_msec=exploration_rights_1.first_published_msec,
        ).commit(
            feconf.SYSTEM_COMMITTER_ID, 'Created new exploration', commit_cmds)

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_1.commit(
            feconf.SYSTEM_COMMITTER_ID, 'Create exploration', [{
                'cmd': exp_domain.CMD_CREATE_NEW
        }])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT}
        ))

        audio_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
        incomplete_translation_language_codes = (
            audio_language_codes - set(['en']))
        self.exp_opportunity_summary_model_1 = (
            opportunity_models.ExplorationOpportunitySummaryModel(
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                topic_name='topic name',
                story_id=self.STORY_1_ID,
                story_title='story title',
                chapter_title='node title',
                content_count=2,
                incomplete_translation_language_codes=sorted(
                    list(incomplete_translation_language_codes)),
                translation_counts={'hi': 1},
                language_codes_needing_voice_artists=['en'],
                language_codes_with_assigned_voice_artists=[]
            )
        )
        self.exp_opportunity_summary_model_1.update_timestamps()

        self.put_multi([
            self.entity_translation_1, self.exp_opportunity_summary_model_1])

    def test_no_translations_are_reported_in_case_of_no_invalid_translations(
        self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_translations_are_reported(self) -> None:
        self.entity_translation_1.translations[
            'invalid_content'] = TRANSLATED_CONTENT_DICT
        self.exp_opportunity_summary_model_1.translation_counts['hi'] += 1

        self.put_multi([
            self.entity_translation_1, self.exp_opportunity_summary_model_1])

        errored_value = (
            '{'
            f'\'entity_id\': \'{self.exp_1.id}\', \'entity_version\': '
            f'{self.exp_1.version}, \'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', \'content_id\': '
            '\'invalid_content\'}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='TRANSLATIONS TO BE DELETED COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout=(
                    'ENTITY TRANSLATION MODELS TO BE UPDATED COUNT '
                    'SUCCESS: 1')
            )
        ])

        updated_entity_translation_model = (
            translation_models.EntityTranslationsModel.get(
                self.entity_translation_1.id))
        self.assertIn(
            'invalid_content',
            updated_entity_translation_model.translations.keys()
        )

        updated_exp_opportunity_summary_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                self.exp_opportunity_summary_model_1.id))
        self.assertEqual(
            2,
            updated_exp_opportunity_summary_model.translation_counts['hi']
        )

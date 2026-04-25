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

"""Unit tests for jobs.batch_jobs.synthesize_voiceover_by_language_accent_jobs."""

from __future__ import annotations

from core import constants, feconf
from core.domain import (
    exp_domain,
    exp_services,
    state_domain,
    story_domain,
    story_services,
    topic_domain,
    topic_services,
    voiceover_regeneration_services,
)
from core.jobs import job_options, job_test_utils
from core.jobs.batch_jobs import synthesize_voiceover_by_language_accent_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Optional, Type, Union

MYPY = False
if MYPY:
    from mypy_imports import translation_models, voiceover_models

(translation_models, voiceover_models) = models.Registry.import_models(
    [models.Names.TRANSLATION, models.Names.VOICEOVER]
)


class VoiceoverSynthesisByAccentBaseClass(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Base class for voiceover synthesis by accent job tests."""

    EDITOR_EMAIL_1 = 'editor1@example.com'
    EDITOR_EMAIL_2 = 'editor2@example.com'
    EDITOR_USERNAME_1 = 'editor1'
    EDITOR_USERNAME_2 = 'editor2'

    CURATED_EXPLORATION_ID_1 = 'exploration_id_1'
    CURATED_EXPLORATION_ID_2 = 'exploration_id_2'
    NON_CURATED_EXPLORATION_ID = 'exploration_id_3'

    TOPIC_ID_1 = 'topic_id_1'
    TOPIC_ID_2 = 'topic_id_2'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL_1, self.EDITOR_USERNAME_1)
        self.signup(self.EDITOR_EMAIL_2, self.EDITOR_USERNAME_2)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_curriculum_admins(
            [
                self.EDITOR_USERNAME_1,
                self.EDITOR_USERNAME_2,
                self.CURRICULUM_ADMIN_USERNAME,
            ]
        )

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.voiceover_dict_1: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 42.43,
        }
        self.voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 40,
        }

    def _create_data_for_testing(self) -> None:
        """This method creates three explorations — two curated and one
        non-curated. It adds Hindi translations to the first curated
        exploration and Portuguese translations to the second. Additionally,
        it adds voiceovers in Hindi, Portuguese, and English to selected
        content within the curated explorations.
        """

        # Creating and publishing two topics.
        topic_1 = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic1', 'abbrev', 'description', 'fragm'
        )
        topic_1.thumbnail_filename = 'thumbnail.svg'
        topic_1.thumbnail_bg_color = '#C6DCDA'
        topic_1.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic_1.next_subtopic_id = 2
        topic_1.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic_1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        story_1 = story_domain.Story.create_default_story(
            self.STORY_ID_1,
            'A story',
            'Description',
            self.TOPIC_ID_1,
            'story-two',
        )
        story_services.save_new_story(self.owner_id, story_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )

        topic_2 = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_2, 'topic2', 'abbrev-top', 'description', 'fragmem'
        )
        topic_2.thumbnail_filename = 'thumbnail.svg'
        topic_2.thumbnail_bg_color = '#C6DCDA'
        topic_2.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title subtopic',
                ['skill_id_1'],
                'image.svg',
                constants.constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url-sub',
            )
        ]
        topic_2.next_subtopic_id = 2
        topic_2.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic_2)
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)

        story_2 = story_domain.Story.create_default_story(
            self.STORY_ID_2,
            'The second story',
            'Description second',
            self.TOPIC_ID_2,
            'story-three',
        )
        story_services.save_new_story(self.owner_id, story_2)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_2, self.STORY_ID_2
        )

        topic_services.publish_story(
            self.TOPIC_ID_2, self.STORY_ID_2, self.admin_id
        )

        # Creating 2 curated explorations.
        exploration_1 = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )

        self.publish_exploration(self.owner_id, exploration_1.id)

        exp_services.update_exploration(
            self.owner_id,
            self.CURATED_EXPLORATION_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the first card of first exploration.</p>',
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End State',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>This is the last card of first exploration.</p>',
                        },
                    }
                ),
            ],
            'Changes content.',
        )

        story_services.update_story(
            self.owner_id,
            self.STORY_ID_1,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': self.CURATED_EXPLORATION_ID_1,
                    }
                ),
            ],
            'Changes.',
        )

        exploration_2 = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_2,
            self.owner_id,
            title='title2',
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_2.id)

        exp_services.update_exploration(
            self.owner_id,
            self.CURATED_EXPLORATION_ID_2,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the first card of second exploration.</p>',
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End State',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>This is the last card of second exploration.</p>',
                        },
                    }
                ),
            ],
            'Changes content.',
        )

        story_services.update_story(
            self.owner_id,
            self.STORY_ID_2,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': self.CURATED_EXPLORATION_ID_2,
                    }
                ),
            ],
            'Changes.',
        )

        # Create a non-curated exploration.
        exploration_3 = self.save_new_valid_exploration(
            self.NON_CURATED_EXPLORATION_ID,
            self.owner_id,
            title='title3',
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_3.id)

        # Adding Hindi and Portuguese translations to the first and second.
        translation_models.EntityTranslationsModel.create_new(
            'exploration',
            self.CURATED_EXPLORATION_ID_1,
            2,
            'hi',
            {
                'content_0': {
                    'content_value': '<p>यह प्रथम अन्वेषण का पहला कार्ड है.</p>',
                    'content_format': 'html',
                    'needs_update': False,
                },
                'content_3': {
                    'content_value': '<p>यह प्रथम अन्वेषण का अंतिम कार्ड है.</p>',
                    'content_format': 'html',
                    'needs_update': True,
                },
            },
        ).put()

        translation_models.EntityTranslationsModel.create_new(
            'exploration',
            self.CURATED_EXPLORATION_ID_2,
            2,
            'pt',
            {
                'content_0': {
                    'content_value': '<p>Esta é a primeira carta da segunda exploração.</p>',
                    'content_format': 'html',
                    'needs_update': False,
                },
                'content_3': {
                    'content_value': '<p>Esta é a segunda carta da segunda exploração.</p>',
                    'content_format': 'html',
                    'needs_update': True,
                },
            },
        ).put()

        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.CURATED_EXPLORATION_ID_1,
            2,
            'hi-IN',
            {
                'content_0': {
                    'manual': None,
                    'auto': self.voiceover_dict_2,
                }
            },
            {},
        ).put()

        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.CURATED_EXPLORATION_ID_2,
            2,
            'en-US',
            {
                'content_0': {
                    'manual': self.voiceover_dict_1,
                    'auto': self.voiceover_dict_2,
                }
            },
            {},
        ).put()

        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.CURATED_EXPLORATION_ID_2,
            2,
            'pt-BR',
            {
                'content_0': {
                    'manual': None,
                    'auto': self.voiceover_dict_2,
                }
            },
            {},
        ).put()

        voiceover_autogeneration_policy_model = (
            voiceover_models.VoiceoverAutogenerationPolicyModel(
                id=voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID
            )
        )
        voiceover_autogeneration_policy_model.language_codes_mapping = {
            'en': {'en-US': True, 'en-NG': False},
            'hi': {'hi-IN': True},
            'pt': {'pt-BR': True},
            'ar': {'ar-AE': True},
        }
        (
            voiceover_autogeneration_policy_model.autogenerated_voiceovers_are_enabled
        ) = True
        voiceover_autogeneration_policy_model.update_timestamps()
        voiceover_autogeneration_policy_model.put()

    def _set_language_accent_code(
        self, language_accent_code: Optional[str]
    ) -> None:
        """Sets the language accent code for the job.

        Args:
            language_accent_code: str. The language accent code to set for the job.
        """
        custom_options = self.pipeline.options.view_as(job_options.JobOptions)
        custom_options.language_accent_code = language_accent_code


class VoiceoverSynthesisByAccentJobRunTests(
    VoiceoverSynthesisByAccentBaseClass
):
    """Tests for VoiceoverSynthesisByAccentJob."""

    JOB_CLASS: Type[
        synthesize_voiceover_by_language_accent_jobs.VoiceoverSynthesisByAccentJob
    ] = (
        synthesize_voiceover_by_language_accent_jobs.VoiceoverSynthesisByAccentJob
    )

    def test_empty_storage(self) -> None:
        self._set_language_accent_code('en-US')
        self.assert_job_output_is_empty()

    def test_should_regenerate_voiceover_successfully(self) -> None:
        self._create_data_for_testing()
        self._set_language_accent_code('en-US')

        expected_output_1 = (
            'Exploration ID: exploration_id_1.\n'
            'EntityVoiceovers ID: exploration-exploration_id_1-2-en-US.\n'
            'Total content IDs processed: 4. Total characters processed: 101.\n'
        )

        expected_output_2 = (
            'Exploration ID: exploration_id_2.\n'
            'EntityVoiceovers ID: exploration-exploration_id_2-2-en-US.\n'
            'Total content IDs processed: 4. Total characters processed: 103.\n'
        )

        expected_output = [
            job_run_result.JobRunResult(stdout=expected_output_1, stderr=''),
            job_run_result.JobRunResult(stdout=expected_output_2, stderr=''),
        ]

        self.assert_job_output_is(expected_output)

    def test_should_not_generate_voiceover_for_which_contents_are_not_available(
        self,
    ) -> None:
        self._create_data_for_testing()
        self._set_language_accent_code('ar-AE')

        expected_output_1 = (
            'Exploration ID: exploration_id_1.\n'
            'No content found for language code: ar.'
        )

        expected_output_2 = (
            'Exploration ID: exploration_id_2.\n'
            'No content found for language code: ar.'
        )

        expected_output = [
            job_run_result.JobRunResult(stdout=expected_output_1, stderr=''),
            job_run_result.JobRunResult(stdout=expected_output_2, stderr=''),
        ]

        self.assert_job_output_is(expected_output)

    def test_should_not_generate_voiceover_when_language_accent_code_is_none(
        self,
    ) -> None:
        self._create_data_for_testing()
        self._set_language_accent_code(None)

        expected_output_1 = 'Not generating voiceovers for exploration ID: exploration_id_1 since language accent code is None.'

        expected_output_2 = 'Not generating voiceovers for exploration ID: exploration_id_2 since language accent code is None.'

        expected_output = [
            job_run_result.JobRunResult(stdout=expected_output_1, stderr=''),
            job_run_result.JobRunResult(stdout=expected_output_2, stderr=''),
        ]

        self.assert_job_output_is(expected_output)

    def test_should_handle_failures_during_voiceover_regeneration(self) -> None:
        def mock_synthesize_voiceover_for_html_string(
            _exploration_id: str,
            _content_html: str,
            _language_accent_code: str,
            _voiceover_filename: str,
            _oppia_project_id: Optional[str],
        ) -> List[Dict[str, Union[str, float]]]:
            raise Exception('Failed to generate voiceovers.')

        self._create_data_for_testing()
        self._set_language_accent_code('en-US')

        expected_output_1 = (
            'Exploration ID: exploration_id_1.\n'
            'EntityVoiceovers ID: exploration-exploration_id_1-2-en-US.\n'
            'Content IDs failed: [content_0, default_outcome_1, ca_placeholder_2, content_3]. Error message: Failed to generate voiceovers.\n'
            'Total content IDs processed: 4. Total characters processed: 0.\n'
        )
        expected_output_2 = (
            'Exploration ID: exploration_id_2.\n'
            'EntityVoiceovers ID: exploration-exploration_id_2-2-en-US.\n'
            'Content IDs failed: [content_0, default_outcome_1, ca_placeholder_2, content_3]. Error message: Failed to generate voiceovers.\n'
            'Total content IDs processed: 4. Total characters processed: 0.\n'
        )

        with self.swap(
            voiceover_regeneration_services,
            'synthesize_voiceover_for_html_string',
            mock_synthesize_voiceover_for_html_string,
        ):
            expected_output = [
                job_run_result.JobRunResult(
                    stdout=expected_output_1, stderr=''
                ),
                job_run_result.JobRunResult(
                    stdout=expected_output_2, stderr=''
                ),
            ]

            self.assert_job_output_is(expected_output)

    def test_should_handle_empty_strings_during_voiceover_regeneration(
        self,
    ) -> None:
        def mock_synthesize_voiceover_for_html_string(
            _exploration_id: str,
            _content_html: str,
            _language_accent_code: str,
            _voiceover_filename: str,
            _oppia_project_id: Optional[str],
        ) -> List[Dict[str, Union[str, float]]]:
            return []

        self._create_data_for_testing()
        self._set_language_accent_code('en-US')

        expected_output_1 = (
            'Exploration ID: exploration_id_1.\n'
            'EntityVoiceovers ID: exploration-exploration_id_1-2-en-US.\n'
            'Total content IDs processed: 4. Total characters processed: 0.\n'
        )

        expected_output_2 = (
            'Exploration ID: exploration_id_2.\n'
            'EntityVoiceovers ID: exploration-exploration_id_2-2-en-US.\n'
            'Total content IDs processed: 4. Total characters processed: 0.\n'
        )

        with self.swap(
            voiceover_regeneration_services,
            'synthesize_voiceover_for_html_string',
            mock_synthesize_voiceover_for_html_string,
        ):
            expected_output = [
                job_run_result.JobRunResult(
                    stdout=expected_output_1, stderr=''
                ),
                job_run_result.JobRunResult(
                    stdout=expected_output_2, stderr=''
                ),
            ]

            self.assert_job_output_is(expected_output)

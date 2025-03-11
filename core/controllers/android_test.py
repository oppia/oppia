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

"""Tests for the android handler."""

from __future__ import annotations

from core.constants import constants
from core.domain import classroom_config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_services
from core.domain import skill_services
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
    from mypy_imports import translation_models

secrets_services = models.Registry.import_secrets_services()

(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


class InitializeAndroidTestDataHandlerTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def test_initialize_in_production_raises_exception(self) -> None:
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new structures data in production.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/initialize_android_test_data',
                {},
                use_payload=False,
                csrf_token=None
            )

    def test_initialize_in_develop_passes(self) -> None:
        self.assertEqual(
            list(self.post_json(
                '/initialize_android_test_data',
                {},
                use_payload=False,
                csrf_token=None
            ).keys()),
            ['generated_topic_id']
        )

    def test_initialize_twice_regenerates_the_topic(self) -> None:
        response_1 = self.post_json(
            '/initialize_android_test_data',
            {},
            use_payload=False,
            csrf_token=None
        )
        response_2 = self.post_json(
            '/initialize_android_test_data',
            {},
            use_payload=False,
            csrf_token=None,
        )
        self.assertNotEqual(
            response_1['generated_topic_id'], response_2['generated_topic_id']
        )
        self.assertIsNone(topic_fetchers.get_topic_by_id(
            response_1['generated_topic_id'], strict=False
        ))
        self.assertIsNotNone(topic_fetchers.get_topic_by_id(
            response_2['generated_topic_id'], strict=False
        ))


class AndroidActivityHandlerTests(test_utils.GenericTestBase):
    """Tests for the AndroidActivityHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.secrets_swap = self.swap_to_always_return(
            secrets_services, 'get_secret', 'secret')

    def test_get_with_wrong_api_key_returns_error(self) -> None:
        secrets_swap = self.swap_to_always_return(
            secrets_services, 'get_secret', 'not_key'
        )
        with secrets_swap:
            self.get_json(
                '/android_data?activity_type=story&'
                'activities_data=[{"id": "id", "version": 1}]',
                headers={'X-ApiKey': 'secret'},
                expected_status_int=401
            )

    def test_get_non_existent_activity_returns_null_payload(self) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=story&'
                    'activities_data=[{"id": "story_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{'id': 'story_id', 'version': 1, 'payload': None}]
            )

    def test_get_exploration_returns_correct_json(self) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }]
            )

    def test_get_different_versions_of_exploration_returns_correct_json(
        self
    ) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        exp_services.update_exploration(
            'owner_id',
            'exp_id',
            [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'new objective'
                })
            ],
            'change objective'
        )
        new_exploration = exp_fetchers.get_exploration_by_id('exp_id')

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }]
            )
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 2}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 2,
                    'payload': new_exploration.to_dict()
                }]
            )

    def test_get_multiple_versions_at_a_time_returns_correct_json(self) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        exp_services.update_exploration(
            'owner_id',
            'exp_id',
            [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'new objective'
                })
            ],
            'change objective'
        )
        new_exploration = exp_fetchers.get_exploration_by_id('exp_id')

        with self.secrets_swap:
            # Try fetching two versions at once, in either order.
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 2}, '
                    '{"id": "exp_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 2,
                    'payload': new_exploration.to_dict()
                }, {
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }]
            )

            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1}, '
                    '{"id": "exp_id", "version": 2}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }, {
                    'id': 'exp_id',
                    'version': 2,
                    'payload': new_exploration.to_dict()
                }]
            )

    def test_get_with_invalid_versions_returns_correct_json(self) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')

        with self.secrets_swap:
            # Note that version 3 does not exist.
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 3}, '
                    '{"id": "exp_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 3,
                    'payload': None
                }, {
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }]
            )

            # For completeness, try the opposite order as well.
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1}, '
                    '{"id": "exp_id", "version": 3}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'exp_id',
                    'version': 1,
                    'payload': exploration.to_dict()
                }, {
                    'id': 'exp_id',
                    'version': 3,
                    'payload': None
                }]
            )

    def test_get_with_duplicates_is_rejected(self) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1}, '
                    '{"id": "exp_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Entries in activities_data should be unique'
            )

    def test_get_story_returns_correct_json(self) -> None:
        story = self.save_new_story('story_id', 'user_id', 'Title')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=story&'
                    'activities_data=[{"id": "story_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'story_id',
                    'version': 1,
                    'payload': story.to_dict()
                }]
            )

    def test_get_skill_returns_correct_json(self) -> None:
        skill = self.save_new_skill('skill_id', 'user_id', 'Description')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=skill&'
                    'activities_data=[{"id": "skill_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'skill_id',
                    'version': 1,
                    'payload': skill.to_dict()
                }]
            )

    def test_get_subtopic_returns_correct_json(self) -> None:
        subtopic = self.save_new_subtopic(1, 'user_id', 'topic_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=subtopic&'
                    'activities_data=[{"id": "topic_id-1", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'topic_id-1',
                    'version': 1,
                    'payload': subtopic.to_dict()
                }]
            )

    def test_get_classroom_returns_correct_json(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()

        classroom = self.save_new_valid_classroom(
            classroom_id=classroom_id, name='math'
        )
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=classroom&'
                    'activities_data=[{"id": "math"}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'math',
                    'payload': classroom.to_dict()
                }]
            )

    def test_get_classroom_with_version_returns_error(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()

        self.save_new_valid_classroom(
            classroom_id=classroom_id, name='math'
        )
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=classroom&'
                    'activities_data=[{"id": "math", "version": 2}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version cannot be specified for classroom'
            )

    def test_get_exploration_translation_returns_correct_json(self) -> None:
        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration', 'translation_id', 1, 'es', {
                    'content_id_123': {
                        'content_value': 'Hello world!',
                        'needs_update': False,
                        'content_format': 'html'
                    }
                }))
        translation_model.update_timestamps()
        translation_model.put()
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data=[{'
                    '    "id": "translation_id", '
                    '    "language_code": "es", '
                    '    "version": 1'
                    '}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'translation_id',
                    'language_code': 'es',
                    'version': 1,
                    'payload': {
                        'content_id_123': {
                            'content_value': 'Hello world!',
                            'needs_update': False,
                            'content_format': 'html'
                        }
                    }
                }]
            )

    def test_get_exploration_translation_with_zero_items_returns_correct_json(
        self
    ) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data=[]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                []
            )

    def test_get_topic_returns_correct_json(self) -> None:
        topic = self.save_new_topic('topic_id', 'user_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=learntopic&'
                    'activities_data=[{"id": "topic_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'topic_id',
                    'version': 1,
                    'payload': topic.to_dict()
                }]
            )

    def test_get_question_returns_correct_json(self) -> None:
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        question = self.save_new_question(
            question_id, 'owner_id',
            self._create_valid_question_data(
                'Test Question', content_id_generator), ['skill_1'],
            content_id_generator.next_content_id_index)

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=question&'
                    'activities_data=[{"id": "%s", "version": 1}]' 
                    % question_id,
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': question_id,
                    'version': 1,
                    'payload': question.to_dict()
                }]
            )

    def test_get_question_skill_link_returns_correct_json(self) -> None:
        # Create a question and link it to a skill.
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_question(
            question_id, 'owner_id',
            self._create_valid_question_data(
                'Test Question', content_id_generator),
            [skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            'owner_id', question_id, skill_id, 0.1
        )

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=question_skill_link&'
                    'activities_data=[{"id": "%s"}]&question_count=100&offset=0'
                    % skill_id,
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': skill_id,
                    'payload': {
                        'question_ids': [question_id],
                    }
                }]
            )

    def test_get_question_skill_link_with_version_fails(self) -> None:
        """Test that supplying a version in activity data causes an error."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=question_skill_link&'
                    'activities_data=[{"id": "skill_id", '
                    '"version": 1}]&question_count=100&offset=0',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version cannot be specified for question_skill_link'
            )

    def test_get_nonexistent_question_skill_link_returns_empty_list(
        self
    ) -> None:
        """Test that a nonexistent skill ID returns an empty question list."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=question_skill_link&'
                    'activities_data=[{"id": "nonexistent_skill_id"}]'
                    '&question_count=100&offset=0',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_skill_id',
                    'payload': {
                        'question_ids': []
                    }
                }]
            )

    def test_get_question_skill_link_multiple_skills_pagination(self) -> None:
        """Test pagination with multiple skills returns correct question ids."""
        # Create two skills.
        skill_id_1 = skill_services.get_new_skill_id()
        skill_id_2 = skill_services.get_new_skill_id()

        # Generate 3 questions for skill 1.
        skill_1_question_ids = []
        for i in range(3):
            question_id = question_services.get_new_question_id()
            skill_1_question_ids.append(question_id)
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id, 'owner_id',
                self._create_valid_question_data(
                    f'Skill 1 Question {i+1}', content_id_generator),
                [skill_id_1],
                content_id_generator.next_content_id_index
            )
            question_services.create_new_question_skill_link(
                'owner_id', question_id, skill_id_1, 0.1)

        # Generate 4 questions for skill 2.
        skill_2_question_ids = []
        for i in range(4):
            question_id = question_services.get_new_question_id()
            skill_2_question_ids.append(question_id)
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id, 'owner_id',
                self._create_valid_question_data(
                    f'Skill 2 Question {i+1}', content_id_generator),
                [skill_id_2],
                content_id_generator.next_content_id_index
            )
            question_services.create_new_question_skill_link(
                'owner_id', question_id, skill_id_2, 0.1)

        with self.secrets_swap:
            # First request: offset=0, question_count=2.
            response_1 = self.get_json(
                f'/android_data?activity_type=question_skill_link&'
                f'activities_data=[{{"id": "{skill_id_1}"}}, '
                f'{{"id": "{skill_id_2}"}}]&'
                'question_count=1&offset=0',
                headers={'X-ApiKey': 'secret'},
                expected_status_int=200
            )

            # Second request: offset=2, question_count=2.
            response_2 = self.get_json(
                f'/android_data?activity_type=question_skill_link&'
                f'activities_data=[{{"id": "{skill_id_1}"}}, '
                f'{{"id": "{skill_id_2}"}}]&'
                'question_count=2&offset=2',
                headers={'X-ApiKey': 'secret'},
                expected_status_int=200
            )

            # Third request: offset=4, question_count=2.
            response_3 = self.get_json(
                f'/android_data?activity_type=question_skill_link&'
                f'activities_data=[{{"id": "{skill_id_1}"}}, '
                f'{{"id": "{skill_id_2}"}}]&'
                'question_count=2&offset=4',
                headers={'X-ApiKey': 'secret'},
                expected_status_int=200
            )

            # Returns in the last updated order (skill 2, skill 1).
            # Skill 2 has 4 questions, skill 1 has 3 questions.
            # Question Count is the number of questions to return per skill.

            # Since offset=0 and question_count=2
            # The last two updated questions of skill 2 are returned.
            # But an empty list is returned for skill 1.
            # As more question are still there in last updated order of skill 2.
            self.assertEqual(response_1, [
                {
                    'id': skill_id_1,
                    'payload': {
                        'question_ids': []
                    }
                },
                {
                    'id': skill_id_2,
                    'payload': {
                        'question_ids': skill_2_question_ids[2:][::-1]
                    }
                }
            ])

            # Since offset=2 and question_count=2
            # The last two question for skill 2 are skipped.
            # The first two questions of skill 2 are returned.
            # The last 2 questions of skill 1 are returned.
            self.assertEqual(response_2, [
                {
                    'id': skill_id_1,
                    'payload': {
                        'question_ids': skill_1_question_ids[1:][::-1]
                    }
                },
                {
                    'id': skill_id_2,
                    'payload': {
                        'question_ids': skill_2_question_ids[:2][::-1]
                    }
                }
            ])

            # Since offset=4 and question_count=2
            # The 4 questions in skill_2 are skipped.
            # All the questions in skill_1 are returned.
            self.assertEqual(response_3, [
                {
                    'id': skill_id_1,
                    'payload': {
                        'question_ids': skill_1_question_ids[::-1]
                    }
                },
                {
                    'id': skill_id_2,
                    'payload': {
                        'question_ids': []
                    }
                }
            ])

    def test_get_nonexistent_topic_returns_null_payload(self) -> None:
        """Test requesting nonexistent topic returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=learntopic&'
                    'activities_data='
                    '[{"id": "nonexistent_topic_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_topic_id',
                    'version': 1,
                    'payload': None
                }]
            )

    def test_get_nonexistent_classroom_returns_null_payload(self) -> None:
        """Test requesting nonexistent classroom returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=classroom&'
                    'activities_data=[{"id": "nonexistent_classroom"}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_classroom',
                    'payload': None
                }]
            )

    def test_get_nonexistent_question_returns_null_payload(self) -> None:
        """Test requesting nonexistent question returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=question&'
                    'activities_data='
                    '[{"id": "nonexistent_question_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_question_id',
                    'version': 1,
                    'payload': None
                }]
            )

    def test_get_nonexistent_subtopic_returns_null_payload(self) -> None:
        """Test requesting nonexistent subtopic returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=subtopic&'
                    'activities_data=[{"id": "topic_id-999", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'topic_id-999',
                    'version': 1,
                    'payload': None
                }]
            )

    def test_get_nonexistent_skill_returns_null_payload(self) -> None:
        """Test requesting nonexistent skill returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=skill&'
                    'activities_data='
                    '[{"id": "nonexistent_skill_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_skill_id',
                    'version': 1,
                    'payload': None
                }]
            )

    def test_get_nonexistent_translation_returns_null_payload(self) -> None:
        """Test requesting nonexistent translation returns null payload."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data='
                    '[{"id": "nonexistent_id", "version": 1,'
                    '"language_code": "es"}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [{
                    'id': 'nonexistent_id',
                    'version': 1,
                    'language_code': 'es',
                    'payload': None
                }]
            )

    def test_multiple_different_activities_handling(self) -> None:
        """Test multiple different activities can be requested correctly."""
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        story = self.save_new_story('story_id', 'user_id', 'Title')

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&'
                    'activities_data=[{"id": "exp_id", "version": 1},' 
                    '{"id": "nonexistent_exp", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [
                    {'id': 'exp_id', 'version': 1,
                     'payload': exploration.to_dict()},
                    {'id': 'nonexistent_exp', 'version': 1, 'payload': None}
                ]
            )

            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=story&'
                    'activities_data='
                    '[{"id": "story_id", "version": 1},'
                    '{"id": "nonexistent_story", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [
                    {'id': 'story_id', 'version': 1,
                     'payload': story.to_dict()},
                    {'id': 'nonexistent_story', 'version': 1, 'payload': None}
                ]
            )

    def test_get_multiple_subtopics_at_once(self) -> None:
        """Test multiple subtopics can be requested at once."""
        subtopic1 = self.save_new_subtopic(1, 'user_id', 'topic_id')
        subtopic2 = self.save_new_subtopic(2, 'user_id', 'topic_id')

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=subtopic&'
                    'activities_data='
                    '[{"id": "topic_id-1", "version": 1},'
                    '{"id": "topic_id-2", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=200
                ),
                [
                    {'id': 'topic_id-1', 'version': 1,
                     'payload': subtopic1.to_dict()},
                    {'id': 'topic_id-2', 'version': 1,
                     'payload': subtopic2.to_dict()}
                ]
            )

    def test_get_exploration_translations_missing_language_code(self) -> None:
        """Test missing language code for translations returns an error."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data=[{"id": "translation_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version and language code must be specified for translation'
            )

    def test_get_exploration_translations_missing_version(self) -> None:
        """Test missing version for translations returns an error."""
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data='
                    '[{"id": "translation_id", "language_code": "es"}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version and language code must be specified for translation'
            )

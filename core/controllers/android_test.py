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
from core.domain import topic_fetchers
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

    def test_get_exploration_translation_without_lang_code_fails(self) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data=[{"id": "translation_id", "version": 1}]',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version and language code must be specified '
                'for translation'
            )

    def test_get_exploration_translation_without_version_fails(self) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exp_translations&'
                    'activities_data=['
                    '  {"id": "translation_id", "language_code": "es"}'
                    ']',
                    headers={'X-ApiKey': 'secret'},
                    expected_status_int=400
                )['error'],
                'Version and language code must be specified '
                'for translation'
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

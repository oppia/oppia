# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in core.domain.caching_services"""

from __future__ import annotations

import json

from core import feconf
from core.constants import constants
from core.domain import caching_domain
from core.domain import caching_services
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Optional, Union

memory_cache_services = models.Registry.import_cache_services()


class CachingServicesUnitTests(test_utils.GenericTestBase):
    """Tests for caching_services."""

    # A dictionary representation of an exploration that contains unicode
    # characters.
    exploration_dict_with_unicode_characters: exp_domain.ExplorationDict = {
        'tags': [],
        'title': '',
        'objective': '',
        'init_state_name': 'Introduction',
        'author_notes': '',
        'states_schema_version': 56,
        'param_specs': {},
        'param_changes': [],
        'id': 'h51Bu72rDIqO',
        'category': '',
        'auto_tts_enabled': True,
        'states': {
            'Introduction': {
                'card_is_checkpoint': True,
                'solicit_answer_details': False,
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'hint_5': {},
                        'feedback_4': {},
                        'content_0': {},
                        'ca_placeholder_3': {},
                        'default_outcome_1': {},
                        'rule_input_6': {}
                    }
                },
                'param_changes': [],
                'classifier_model_id': None,
                'content': {
                    'content_id': 'content_0',
                    'html': '<p>Unicode Characters 😍😍😍😍</p>'
                },
                'linked_skill_id': None,
                'inapplicable_skill_misconception_ids': [],
                'interaction': {
                    'hints': [{
                        'hint_content': {
                            'content_id': 'hint_5',
                            'html': '<p>This is a copyright character ©.</p>'
                        }
                    }],
                    'confirmed_unclassified_answers': [],
                    'solution': None,
                    'id': 'TextInput',
                    'customization_args': {
                        'rows': {
                            'value': 1
                        },
                        'placeholder': {
                            'value': {
                                'content_id': 'ca_placeholder_3',
                                'unicode_str': '😍😍😍😍'
                            }
                        },
                        'catchMisspellings': {
                            'value': False
                        }
                    },
                    'default_outcome': {
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'dest': 'Introduction',
                        'dest_if_really_stuck': None,
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'default_outcome_1',
                            'html': ''
                        },
                        'labelled_as_correct': False
                    },
                    'answer_groups': [{
                        'training_data': [],
                        'outcome': {
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'dest': 'Introduction',
                            'dest_if_really_stuck': None,
                            'missing_prerequisite_skill_id': None,
                            'feedback': {
                                'content_id': 'feedback_4',
                                'html': '<p>This is great! ®®</p>'
                            },
                            'labelled_as_correct': False
                        },
                        'rule_specs': [{
                            'rule_type': 'Contains',
                            'inputs': {
                                'x': {
                                    'contentId': 'rule_input_6',
                                    'normalizedStrSet': ['®®']
                                }
                            }
                        }],
                        'tagged_skill_misconception_id': None
                    }]
                }
            }
        },
        'next_content_id_index': 7,
        'edits_allowed': True,
        'language_code': 'en',
        'blurb': '',
        'version': 1
    }

    # The correct json encoded version of the above exploration containing
    # unicode characters that is set to the memory cache.
    json_encoded_string_representing_an_exploration = (
        '{"param_changes": [], "category": "", "auto_tts_enabled": true, '
        '"next_content_id_index": 7, "tags"'
        ': [], "states_schema_version": 56, "title": "", "param_specs": {}, "id'
        '": "h51Bu72rDIqO", "states": {"Introduction": {"param_changes": [], "c'
        'ard_is_checkpoint": true, "inapplicable_skill_misconception_ids": [], '
        '"interaction": {"solution": null, "answer_gr'
        'oups": [{"tagged_skill_misconception_id": null, "outcome": {"param_cha'
        'nges": [], "feedback": {"content_id": "feedback_4", "html": "<p>This i'
        's great! \\u00ae\\u00ae</p>"}, "dest": "Introduction", "dest_if_really'
        '_stuck": null, "refresher_exploration_id": null, "missing_prerequisite'
        '_skill_id": null, "labelled_as_correct": false}, "training_data": [], '
        '"rule_specs": [{"rule_type": "Contains", "inputs": {"x": {"normalizedS'
        'trSet": ["\\u00ae\\u00ae"], "contentId": "rule_input_6"}}}]}], "defaul'
        't_outcome": {"param_changes": [], "feedback": '
        '{"content_id": "default_outcome_1", "html": ""}, '
        '"dest": "Introduction", "dest_if_really_stuck":'
        ' null, "refresher_exploration_id": null, "missing_prerequisite_skill_i'
        'd": null, "labelled_as_correct": false}, "customization_args": {"rows"'
        ': {"value": 1}, "placeholder": {"value": {"unicode_str": "\\ud83d\\ude'
        '0d\\ud83d\\ude0d\\ud83d\\ude0d\\ud83d\\ude0d", "content_id": "ca_place'
        'holder_3"}}, "catchMisspellings": {"value": false}}, '
        '"confirmed_unclassified_answers": [], "id": "TextInput",'
        ' "hints": [{"hint_content": {"content_id": "hint_5", "html": "<p>This '
        'is a copyright character \\u00a9.</p>"}}]}, "linked_skill_id": null, "'
        'recorded_voiceovers": {"voiceovers_mapping": {"feedback_4": {}, "rule_'
        'input_6": {}, "content_0": {}, "hint_5": {}, "default_outcome_1": {}, '
        '"ca_placeholder_3": {}}}, "classifier_model_id": null, "content": '
        '{"content_id": "content_0", "html": "<p>Unicode Characters '
        '\\ud83d\\ude0d\\ud83d\\ude0d\\ud83d\\ude0d\\ud83d\\ude0d</p>"}, '
        '"solicit_answer_details": false}}, "version": 0, '
        '"edits_allowed": true, "l'
        'anguage_code": "en", "objective": "", "init_state_name": "Introduction'
        '", "blurb": "", "author_notes": ""}'
    )

    def test_retrieved_memory_profile_contains_correct_elements(self) -> None:
        memory_profile = caching_services.get_memory_cache_stats()
        self.assertIsInstance(memory_profile, caching_domain.MemoryCacheStats)
        self.assertIsNotNone(memory_profile.total_allocated_in_bytes)
        self.assertIsNotNone(memory_profile.peak_memory_usage_in_bytes)
        self.assertIsNotNone(memory_profile.total_number_of_keys_stored)

    def test_flush_cache_wipes_cache_clean(self) -> None:
        """Tests whether flushing the cache removes the elements in the
        cache.
        """
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']), key_value_mapping)

        self.assertIsNotNone(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]
            ).get(exploration_id))

        caching_services.flush_memory_caches()

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c']),
            {})
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

    def test_serialization_and_deserialization_returns_the_same_object(
        self
    ) -> None:
        deserialize = (
            caching_services.DESERIALIZATION_FUNCTIONS['exploration'])
        serialize = (
            caching_services.SERIALIZATION_FUNCTIONS['exploration']
        )
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        self.assertEqual(
            default_exploration.to_dict(),
            deserialize(serialize(default_exploration)).to_dict())

    def test_invalid_namespace_raises_error(self) -> None:
        invalid_namespace = 'invalid'

        # Here we use MyPy ignore because get_multi has namespace argument,
        # which can accept only keys of DESERIALIZATION_FUNCTIONS Dict and
        # 'invalid' is not one of them. So, we don't have any overload function
        # for 'invalid' key but still we are passing 'invalid' to function which
        # causes MyPy to throw an error. Thus to avoid error, we used ignore.
        with self.assertRaisesRegex(
            ValueError,
            'Invalid namespace: %s.' % invalid_namespace):
            caching_services.get_multi( # type: ignore[call-overload]
                invalid_namespace, None,
                ['a', 'b', 'c'])

        invalid_sub_namespace = 'sub:namespace'
        with self.assertRaisesRegex(
            ValueError,
            'Sub-namespace %s cannot contain \':\'.' % invalid_sub_namespace):
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                invalid_sub_namespace, ['a', 'b', 'c'])

    def test_get_multi_correctly_retrieves_cache_elements(self) -> None:
        """Testing that querying the cache for elements where either all of the
        ids exist or don't exist in the cache returns reasonable output.
        """
        # Key value mapping tests that strings, numbers, booleans, floats,
        # lists, and Nonetypes are all correctly set and fetched from the cache.
        key_value_mapping: Dict[
            str, Union[str, int, List[Optional[bool]], Dict[str, float]]
        ] = {
            'a': '1',
            'b': 2,
            'c': [True, None],
            'd': {
                'd.1': 1.2,
                'd.2': 30
            }
        }

        exploration_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c', 'd']),
            {})
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c', 'd']),
            key_value_mapping)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None, ['e', 'f']),
            {})

        exp_ids_to_explorations = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', [exploration_id])
        self.assertEqual(
            default_exploration.to_dict(),
            exp_ids_to_explorations[exploration_id].to_dict())

    def test_partial_fetches_returns_correct_elements(self) -> None:
        """Testing that querying the cache returns reasonable output for
        elements where only a subsection of the queried ids exist in the cache.
        """
        key_value_mapping = {'a': '1', 'c': '3'}
        exploration_id = 'id'
        nonexistent_exploration_id = 'id2'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c']),
            {})

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                []),
            {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT,
            None,
            key_value_mapping)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c']),
            {'a': '1', 'c': '3'})

        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            [exploration_id, nonexistent_exploration_id])

        self.assertEqual(
            default_exploration.to_dict(),
            result[exploration_id].to_dict())

        self.assertFalse(nonexistent_exploration_id in result)

    def test_queries_to_wrong_namespace_returns_none(self) -> None:
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                '0',
                [exploration_id]),
            {})

    def test_queries_to_wrong_sub_namespace_returns_none(self) -> None:
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '1',
                [exploration_id]), {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '1',
            {
                exploration_id: default_exploration
            })

        existent_result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '1',
            [exploration_id])

        self.assertEqual(
            existent_result[exploration_id].to_dict(),
            default_exploration.to_dict())

    def test_set_multi_returns_true_for_successful_insert_into_cache(
        self
    ) -> None:
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        cache_strings_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        self.assertTrue(cache_strings_response)

        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        cache_exploration_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })
        self.assertTrue(cache_exploration_response)

        cache_empty_list_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, {})
        self.assertTrue(cache_empty_list_response)

    def test_delete_multi_returns_true_when_all_ids_exist(self) -> None:
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', {
                exploration_id: default_exploration
            })

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None, []))

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']))

        self.assertGreater(
            len(
                caching_services.get_multi(
                    caching_services.CACHE_NAMESPACE_EXPLORATION,
                    '0',
                    [exploration_id]
                ),
            ),
            0
        )

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0', [exploration_id]))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

    def test_delete_multi_returns_false_when_not_all_ids_exist(self) -> None:
        """Tests that deleting keys that don't exist returns False."""
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'e', 'f']))

    def test_delete_multi_returns_false_when_namespace_incorrect(self) -> None:
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                None,
                ['a', 'b', 'c']))

    def test_delete_multi_returns_false_when_sub_namespace_incorrect(
        self
    ) -> None:
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                'invalid_sub_namespace', ['a', 'b', 'c']))

    def test_all_namespace_strings_are_valid(self) -> None:
        """Tests SERIALIZATION_FUNCTIONS and DESERIALIZATION FUNCTIONS does not
        contain any keys with the MEMCACHE_KEY_DELIMITER and that the namespaces
        in both dictionaries are identical.
        """
        for namespace in caching_services.SERIALIZATION_FUNCTIONS:
            self.assertIn(namespace, caching_services.DESERIALIZATION_FUNCTIONS)

        for namespace in caching_services.SERIALIZATION_FUNCTIONS:
            self.assertNotIn(caching_services.MEMCACHE_KEY_DELIMITER, namespace)

    def test_explorations_identically_cached_in_dev_and_test_environment(
        self
    ) -> None:
        """Test to make sure that caching in the test environment is in sync
        with caching in the main development server. More specifically, when an
        exploration is created with fields that contain unicode characters, the
        resulting string that is set to the memory cache on the development
        server should be the same as the string that is set to the testing cache
        on the testing server.
        """
        exploration_id = 'h51Bu72rDIqO'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        default_exploration = exp_domain.Exploration.from_dict(
            self.exploration_dict_with_unicode_characters)

        def mock_memory_cache_services_set_multi(
            id_value_mapping: Dict[str, bytes]
        ) -> None:
            # The json encoded string is the string that is set to the cache
            # when an exploration is created in the development server. This
            # mock asserts that for the same exploration, the string
            # representing the exploration set to the testing environment cache
            # is the same as the string set to the cache in the development
            # environment.
            for key, value in id_value_mapping.items():
                self.assertEqual(key, 'exploration:0:%s' % exploration_id)
                self.assertEqual(
                    json.loads(value),
                    json.loads(
                        self.json_encoded_string_representing_an_exploration))
        with self.swap(
            memory_cache_services, 'set_multi',
            mock_memory_cache_services_set_multi):
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                {
                    exploration_id: default_exploration
                })

    def test_unicode_characters_are_set_and_get_correctly_in_default_namespace(
        self
    ) -> None:
        """Test to make sure that default namespace values (ints, floats,
        strings, boolean, lists, and dicts) can be set to the cache without
        errors and retrieved from the cache without any alterations.
        """
        key_value_mapping = {
            'a': '%#$', 'b': '\t',
            'c': '😃😄'
        }
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c']),
            {})
        cache_strings_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        self.assertTrue(cache_strings_response)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                None,
                ['a', 'b', 'c']),
            {
                'a': '%#$', 'b': '\t',
                'c': '😃😄'
            })

    def test_explorations_with_unicode_characters_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default explorations initialized with
        unicode characters is set to the cache without errors and retrieved from
        the cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        exploration_id = 'h51Bu72rDIqO'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        default_exploration = exp_domain.Exploration.from_dict(
            self.exploration_dict_with_unicode_characters)

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        exp_ids_to_explorations = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', [exploration_id])

        self.assertEqual(
            default_exploration.to_dict(),
            exp_ids_to_explorations[exploration_id].to_dict())

    def test_collections_with_unicode_characters_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default collection initialized with unicode
        characters is set to the cache without errors and retrieved from the
        cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        collection_id = 'id 😍'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_COLLECTION,
                '0',
                [collection_id]),
            {})

        default_collection = (
            collection_domain.Collection.create_default_collection(
                collection_id))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_COLLECTION,
            '0',
            {
                collection_id: default_collection
            })

        collections = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_COLLECTION,
            '0', [collection_id])

        self.assertEqual(
            default_collection.to_dict(),
            collections[collection_id].to_dict())

    def test_skills_with_unicode_characters_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default skill initialized with unicode
        characters is set to the cache without errors and retrieved from the
        cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        skill_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_SKILL,
                '0',
                [skill_id]),
            {})

        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0],
                ['<p>[NOTE: Creator should fill this in]</p> 😍']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1],
                ['<p>[NOTE: Creator should fill this in]</p> 😍']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2],
                ['<p>[NOTE: Creator should fill this in]</p> 😍'])]

        default_skill = (
            skill_domain.Skill.create_default_skill(
                skill_id, 'Description 😍', rubrics))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_SKILL,
            '0',
            {
                skill_id: default_skill
            })

        skills = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_SKILL,
            '0', [skill_id])

        self.assertEqual(
            default_skill.to_dict(),
            skills[skill_id].to_dict())

    def test_topics_with_unicode_characters_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default topic initialized with unicode
        characters is set to the cache without errors and retrieved from the
        cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        topic_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_TOPIC,
                '0',
                [topic_id]),
            {})

        default_topic = (
            topic_domain.Topic.create_default_topic(
                topic_id, 'Name 😍', 'abbrev 😍',
                'description 😍', 'fragm 😍'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_TOPIC,
            '0',
            {
                topic_id: default_topic
            })

        topics = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_TOPIC,
            '0', [topic_id])

        self.assertEqual(
            default_topic.to_dict(),
            topics[topic_id].to_dict())

    def test_stories_with_unicode_characters_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default story initialized with unicode
        characters is set to the cache without errors and retrieved from the
        cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        story_id = 'id'
        topic_id = 'topic_id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_STORY,
                '0',
                [story_id]),
            {})

        default_story = (
            story_domain.Story.create_default_story(
                story_id, 'Title 😍',
                'Description 😍', topic_id,
                'title 😍'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_STORY,
            '0',
            {
                story_id: default_story
            })

        stories = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_STORY,
            '0', [story_id])

        self.assertEqual(
            default_story.to_dict(),
            stories[story_id].to_dict())

    def test_platform_parameters_with_unicode_are_set_and_get_correctly(
        self
    ) -> None:
        """Test to make sure that a default platform parameter initialized with
        unicode characters is set to the cache without errors and retrieved from
        the cache without any alterations (in an identical state to when it was
        set to the cache).
        """
        platform_parameter_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
                '0',
                [platform_parameter_id]),
            {})

        default_parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a 😍',
            'description': '😍😍😍😍',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Backend']]
                        }
                    ],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False
        })

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
            '0',
            {
                platform_parameter_id: default_parameter
            })

        platform_parameters = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
            '0', [platform_parameter_id])

        self.assertEqual(
            default_parameter.to_dict(),
            platform_parameters[platform_parameter_id].to_dict())

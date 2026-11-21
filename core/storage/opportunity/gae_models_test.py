# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.opportunity.gae_models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, opportunity_models

(base_models, opportunity_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.OPPORTUNITY]
)


class SkillOpportunityModelTest(test_utils.GenericTestBase):
    """Tests for the SkillOpportunityModel class."""

    def setUp(self) -> None:
        super().setUp()

        opportunity_models.SkillOpportunityModel(
            id='opportunity_id1',
            skill_description='A skill description',
            question_count=20,
        ).put()
        opportunity_models.SkillOpportunityModel(
            id='opportunity_id2',
            skill_description='A skill description',
            question_count=30,
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.get_export_policy(),
            expected_export_policy_dict,
        )

    def test_get_skill_opportunities(self) -> None:
        results, cursor, more = (
            opportunity_models.SkillOpportunityModel.get_skill_opportunities(
                5, None
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertEqual(results[1].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))

    def test_count_skill_opportunities(self) -> None:
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.count_skill_opportunities(),
            2,
        )

    def test_get_skill_opportunities_pagination(self) -> None:
        results, cursor, more = (
            opportunity_models.SkillOpportunityModel.get_skill_opportunities(
                1, None
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertTrue(more)
        self.assertTrue(isinstance(cursor, str))

        results, cursor, more = (
            opportunity_models.SkillOpportunityModel.get_skill_opportunities(
                1, cursor
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))


class TranslationOpportunityModelUnitTest(test_utils.GenericTestBase):
    """Tests for the TranslationOpportunityModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'incomplete_translation_language_codes': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE
            ),
            'translation_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.get_export_policy(),
            expected_export_policy,
        )

    def test_create_and_retrieve_model(self) -> None:
        model = opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp123',
            topic_ids=['topic1', 'topic2'],
            content_count=10,
            incomplete_translation_language_codes=['fr', 'de'],
            translation_counts={'fr': 5, 'de': 3},
        )
        model.put()

        retrieved = opportunity_models.TranslationOpportunityModel.get_by_id(
            'exploration.exp123'
        )
        assert retrieved is not None
        self.assertEqual(retrieved.entity_type, 'exploration')
        self.assertEqual(retrieved.entity_id, 'exp123')
        self.assertEqual(retrieved.topic_ids, ['topic1', 'topic2'])
        self.assertEqual(retrieved.content_count, 10)
        self.assertEqual(
            retrieved.incomplete_translation_language_codes, ['fr', 'de']
        )
        self.assertEqual(retrieved.translation_counts, {'fr': 5, 'de': 3})

    def test_validation_fails_for_invalid_entity_type(self) -> None:
        model = opportunity_models.TranslationOpportunityModel(
            id='invalid.123',
            entity_type='invalid_type',
            entity_id='123',
            topic_ids=[],
            content_count=5,
            incomplete_translation_language_codes=[],
            translation_counts={},
        )
        with self.assertRaisesRegex(
            Exception, 'Invalid entity_type: invalid_type'
        ):
            model.put()

    def test_validation_fails_for_negative_content_count(self) -> None:
        model = opportunity_models.TranslationOpportunityModel(
            id='exploration.badcontent',
            entity_type='exploration',
            entity_id='badcontent',
            topic_ids=[],
            content_count=-1,
            incomplete_translation_language_codes=[],
            translation_counts={},
        )
        with self.assertRaisesRegex(
            Exception, 'content_count cannot be negative'
        ):
            model.put()

    def test_validation_fails_for_invalid_translation_counts(self) -> None:
        model = opportunity_models.TranslationOpportunityModel(
            id='exploration.expbad',
            entity_type='exploration',
            entity_id='expbad',
            topic_ids=[],
            content_count=5,
            incomplete_translation_language_codes=[],
            translation_counts={'fr': -1},
        )
        with self.assertRaisesRegex(
            Exception, 'Invalid translation count for fr: -1'
        ):
            model.put()

    def test_validation_fails_for_invalid_language_code(self) -> None:
        model = opportunity_models.TranslationOpportunityModel(
            id='exploration.explangbad',
            entity_type='exploration',
            entity_id='explangbad',
            topic_ids=[],
            content_count=5,
            incomplete_translation_language_codes=[],
            translation_counts={'xyz': 2},
        )
        with self.assertRaisesRegex(Exception, 'Invalid language code: xyz'):
            model.put()

    def test_validation_fails_for_translation_count_exceeding_content(
        self,
    ) -> None:
        model = opportunity_models.TranslationOpportunityModel(
            id='exploration.expbad2',
            entity_type='exploration',
            entity_id='expbad2',
            topic_ids=[],
            content_count=3,
            incomplete_translation_language_codes=[],
            translation_counts={'fr': 5},
        )
        with self.assertRaisesRegex(
            Exception,
            r'Translation count for fr \(5\) exceeds content_count \(3\)',
        ):
            model.put()

    def test_get_by_entity_type_and_topic(self) -> None:
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            topic_ids=['topic1'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            topic_ids=['topic1', 'topic2'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='skill',
            entity_id='skill1',
            topic_ids=['topic2'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()

        # Test filter by entity_type, topic_id and language_code.
        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic1', 'hi', 10, None
            )
        )
        self.assertEqual(len(results), 2)
        assert results[0] is not None
        assert results[1] is not None
        self.assertEqual(results[0].entity_id, 'exp1')
        self.assertEqual(results[1].entity_id, 'exp2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))

        # Test filter by entity_type and language_code only.
        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', None, 'hi', 10, None
            )
        )
        self.assertEqual(len(results), 2)
        self.assertFalse(more)

        # Test filter by language_code only (entity_type=None).
        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                None, None, 'hi', 10, None
            )
        )
        self.assertEqual(len(results), 3)
        self.assertFalse(more)

        # Test filter by different topic_id.
        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic2', 'hi', 10, None
            )
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].entity_id, 'exp2')

        # Test filter by different language_code.
        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic1', 'en', 10, None
            )
        )
        self.assertEqual(len(results), 0)

    def test_count_by_entity_type_and_topic(self) -> None:
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            topic_ids=['topic1'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            topic_ids=['topic1', 'topic2'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='skill',
            entity_id='skill1',
            topic_ids=['topic2'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()

        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                'exploration', 'topic1', 'hi'
            ),
            2,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                'exploration', None, 'hi'
            ),
            2,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                'exploration', 'topic2', 'hi'
            ),
            1,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                'exploration', 'topic1', 'en'
            ),
            0,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                'skill', 'topic2', 'hi'
            ),
            1,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                None, 'topic2', 'hi'
            ),
            2,
        )
        self.assertEqual(
            opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
                None, None, 'hi'
            ),
            3,
        )

    def test_get_by_entity_type_and_topic_pagination(self) -> None:
        for i in range(5):
            opportunity_models.TranslationOpportunityModel.create_new(
                entity_type='exploration',
                entity_id='exp%s' % i,
                topic_ids=['topic1'],
                content_count=10,
                incomplete_translation_language_codes=['hi'],
                translation_counts={'hi': 5},
            ).put()

        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic1', 'hi', 2, None
            )
        )
        self.assertEqual(len(results), 2)
        self.assertTrue(more)
        self.assertIsNotNone(cursor)

        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic1', 'hi', 2, cursor
            )
        )
        self.assertEqual(len(results), 2)
        self.assertTrue(more)

        results, cursor, more = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
                'exploration', 'topic1', 'hi', 2, cursor
            )
        )
        self.assertEqual(len(results), 1)
        self.assertFalse(more)

    def test_get_by_entity_ids(self) -> None:
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            topic_ids=['topic1'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            topic_ids=['topic1'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()

        results = (
            opportunity_models.TranslationOpportunityModel.get_by_entity_ids(
                'exploration', ['exp1', 'exp2', 'exp3']
            )
        )
        self.assertEqual(len(results), 3)
        assert results[0] is not None
        assert results[1] is not None
        self.assertEqual(results[0].entity_id, 'exp1')
        self.assertEqual(results[1].entity_id, 'exp2')
        self.assertIsNone(results[2])

    def test_get_by_topic(self) -> None:
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp1',
            topic_ids=['topic1'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type='exploration',
            entity_id='exp2',
            topic_ids=['topic1', 'topic2'],
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
        ).put()

        results = opportunity_models.TranslationOpportunityModel.get_by_topic(
            'topic1'
        )
        self.assertEqual(len(results), 2)
        self.assertEqual({r.entity_id for r in results}, {'exp1', 'exp2'})

        results = opportunity_models.TranslationOpportunityModel.get_by_topic(
            'topic2'
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].entity_id, 'exp2')

        results = opportunity_models.TranslationOpportunityModel.get_by_topic(
            'non_existent_topic'
        )
        self.assertEqual(len(results), 0)

# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Tests for collection domain objects and methods defined on them."""

__author__ = 'Ben Henning'

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_services
from core.tests import test_utils
import feconf
import utils

# Dictionary-like data structures within sample YAML must be formatted
# alphabetically to match string equivalence with the YAML generation
# methods tested below.
#
# If evaluating differences in YAML, conversion to dict form via
# utils.dict_from_yaml can isolate differences quickly.

SAMPLE_YAML_CONTENT = (
"""linked_explorations:
  an_exploration_id:
    acquired_skills:
    - Skill1
    - Skill2
    prerequisite_skills: []
objective: An objective
schema_version: %d
""") % (feconf.CURRENT_COLLECTION_SCHEMA_VERSION)


class CollectionDomainUnitTests(test_utils.GenericTestBase):
    """Test the collection domain object."""

    def test_validation(self):
        """Test validation of collections."""
        self.save_new_valid_collection(
            'collection_id', 'user@example.com', title='Title',
            category='Category', objective='Objective',
            exploration_id='exp_id_0', end_state_name='End')
        collection = collection_services.get_collection_by_id('collection_id')

        # Begin with valid strict validation.
        collection.validate()

        # Validate title.
        collection.title = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected title to be a string'):
            collection.validate()
        collection.title = 'Title'

        # Validate category.
        collection.category = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected category to be a string'):
            collection.validate()
        collection.category = 'Category'

        # Validate objective.
        collection.objective = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected objective to be a string'):
            collection.validate()
        collection.objective = 'Category'

        # Validate schema_verison.
        collection.schema_version = 'some_schema_version'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected schema version to be an int'):
            collection.validate()
        collection.schema_version = 1

        # Validate linked_explorations.
        collection.linked_explorations = []
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected linked explorations to be a dict'):
            collection.validate()

        # Having no linked explorations is fine for non-strict validation.
        collection.linked_explorations = {}
        collection.validate(strict=False)

        # But it's not okay for strict validation.
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected to have at least 1 '
                'exploration with no prerequisite skills.'):
            collection.validate()

        # Having one exploration with prerequisite skills should also fail it.
        collection.add_exploration('exp_id_1')
        self.save_new_valid_exploration('exp_id_1', 'user@example.com',
            end_state_name='End')
        linked_exp1 = collection.linked_explorations['exp_id_1']
        linked_exp1.update_prerequisite_skills(['first'])
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected to have at least 1 '
                'exploration with no prerequisite skills.'):
            collection.validate()

        # Add another exploration, but make it impossible to reach exp_id_1.
        collection.add_exploration('exp_id_0')
        collection.add_exploration('exp_id_2')
        self.save_new_valid_exploration('exp_id_2', 'user@example.com',
            end_state_name='End')
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Some explorations are unreachable '
                'from the initial explorations'):
            collection.validate()

        # Connecting the two explorations should lead to clean validation.
        linked_exp2 = collection.linked_explorations['exp_id_2']
        linked_exp2.update_acquired_skills(['first'])
        collection.validate()

        # Validate loading explorations in LinkedExplorations' validate.
        collection.add_exploration('fake_exp_id')
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Error loading exploration: fake_exp_id'):
            collection.validate()
        collection.delete_exploration('fake_exp_id')

        # Verify explorations are validated with the collection.
        orig_get_exp_by_id = exp_services.get_exploration_by_id
        counters = {'exp_validate_counter': None}
        def _mock_get_exp_by_id(exp_id, strict=True, version=None):
            exp = orig_get_exp_by_id(exp_id, strict=strict, version=version)
            exp_validate_counter = test_utils.CallCounter(exp.validate)
            exp.validate = exp_validate_counter
            counters['exp_validate_counter'] = exp_validate_counter
            return exp

        with self.swap(
                exp_services, 'get_exploration_by_id', _mock_get_exp_by_id):
            collection.validate()
            self.assertEqual(counters['exp_validate_counter'].times_called, 1)

        # Validate LinkedExploration's prerequisite_skills
        linked_exp2.prerequisite_skills = {}
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected prerequisite_skills to be a list'):
            collection.validate()
        linked_exp2.prerequisite_skills = []

        linked_exp1.prerequisite_skills = ['first', 'first']
        linked_exp2.update_acquired_skills(['first'])
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'The prerequisite_skills list has duplicate entries'):
            collection.validate()
        linked_exp1.update_prerequisite_skills(['first'])

        # Validate LinkedExploration's acquired_skills
        linked_exp1.acquired_skills = {}
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected acquired_skills to be a list'):
            collection.validate()

        linked_exp1.acquired_skills = ['first', 'first']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'The acquired_skills list has duplicate entries'):
            collection.validate()

        # Ensure prerequisite_skills and acquired_skills do not overlap.
        linked_exp2.prerequisite_skills = ['first', 'second', 'third']
        linked_exp2.acquired_skills = ['zeroeth', 'second', 'third', 'fourth']
        linked_exp1.update_prerequisite_skills([])
        linked_exp1.update_acquired_skills(linked_exp2.prerequisite_skills)
        with self.assertRaisesRegexp(
                utils.ValidationError, 'There are some skills which are both '
                'required for this exploration and acquired after playing it: '
                '[second, third]'):
            collection.validate()

        # Restore a valid collection.
        linked_exp2.prerequisite_skills = []
        linked_exp2.acquired_skills = ['first']

        collection.validate()

    def test_objective_validation(self):
        """Test that objectives are validated only in 'strict' mode."""
        self.save_new_valid_collection(
            'collection_id', 'user@example.com', title='Title',
            category='Category', objective='Objective', end_state_name='End')
        collection = collection_services.get_collection_by_id('collection_id')

        collection.objective = ''
        collection.validate(strict=False)

        with self.assertRaisesRegexp(
                utils.ValidationError, 'objective must be specified'):
            collection.validate(strict=True)

        collection.objective = 'An objective'
        collection.validate(strict=True)

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = collection_domain.Collection.create_default_collection(
            'a', 'title', 'category')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = collection_domain.Collection.create_default_collection(
            'abcd', 'title', 'category')
        self.assertEqual(notdemo2.is_demo, False)

    def test_collection_export_import(self):
        """Test that to_dict and from_dict preserve all data within an
        collection.
        """
        self.save_new_valid_exploration('0', 'user@example.com',
            end_state_name='End')
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category')
        collection_dict = collection.to_dict()
        collection_from_dict = (
            collection_domain.Collection.create_collection_from_dict(
                collection_dict))
        self.assertEqual(collection_from_dict.to_dict(), collection_dict)

    def test_add_delete_exploration(self):
        """Test that add_exploration and delete_exploration fail in the correct
        situations.
        """
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category')
        self.assertEqual(len(collection.linked_explorations), 0)

        collection.add_exploration('test_exp')
        self.assertEqual(len(collection.linked_explorations), 1)

        with self.assertRaisesRegexp(
                ValueError,
                'Exploration is already part of this collection: test_exp'):
            collection.add_exploration('test_exp')

        collection.add_exploration('another_exp')
        self.assertEqual(len(collection.linked_explorations), 2)

        collection.delete_exploration('another_exp')
        self.assertEqual(len(collection.linked_explorations), 1)

        with self.assertRaisesRegexp(
                ValueError,
                'Exploration is not part of this collection: another_exp'):
            collection.delete_exploration('another_exp')

        collection.delete_exploration('test_exp')
        self.assertEqual(len(collection.linked_explorations), 0)

    def test_skills_property(self):
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category')

        self.assertEqual(collection.skills, [])

        collection.add_exploration('exp_id_0')
        collection.add_exploration('exp_id_1')
        collection.linked_explorations['exp_id_0'].update_acquired_skills(
            ['first'])
        collection.linked_explorations['exp_id_1'].update_prerequisite_skills(
            ['first'])
        collection.linked_explorations['exp_id_1'].update_acquired_skills([
            'second', 'third'])

        self.assertEqual(collection.skills, ['second', 'third', 'first'])

        # Skills should be unique, even if they are duplicate across multiple
        # acquired and prerequisite skill lists.
        collection.add_exploration('exp_id_2')
        collection.linked_explorations['exp_id_2'].update_acquired_skills(
            ['first', 'third'])
        self.assertEqual(collection.skills, ['second', 'third', 'first'])


class ExplorationGraphUnitTests(test_utils.GenericTestBase):
    """Test the skill graph structure within a collection."""

    def test_initial_explorations(self):
        """Any exploration without prerequisites should be an initial
        exploration.
        """
        collection = collection_domain.Collection.create_default_collection(
            'collection_id', 'A title', 'A category', 'An objective')

        # If there are no explorations in the collection, there can be no
        # initial explorations.
        self.assertEqual(collection.linked_explorations, {})
        self.assertEqual(collection.init_explorations, [])

        # A freshly added exploration will be an initial one.
        collection.add_exploration('exp_id_0')
        self.assertEqual(collection.init_exploration_ids, ['exp_id_0'])

        # Having prerequisites will make an exploration no longer initial.
        collection.add_exploration('exp_id_1')
        self.assertEqual(len(collection.linked_explorations), 2)
        collection.linked_explorations['exp_id_1'].update_prerequisite_skills(
            ['first'])
        self.assertEqual(collection.init_exploration_ids, ['exp_id_0'])

        # There may be multiple initial explorations.
        collection.add_exploration('exp_id_2')
        self.assertEqual(
            collection.init_exploration_ids, ['exp_id_2', 'exp_id_0'])

    def test_next_explorations(self):
        """Explorations should be recommended based on prerequisite and
        acquired skills.
        """
        collection = collection_domain.Collection.create_default_collection(
            'collection_id', 'A title', 'A category', 'An objective')

        # There should be no recommendations for an empty collection.
        self.assertEqual(collection.get_next_exploration_ids([]), [])

        # If a new exploration is added, the recommended exploration IDs should
        # be the same as the initial explorations.
        collection.add_exploration('exp_id_1')
        self.assertEqual(collection.get_next_exploration_ids([]), ['exp_id_1'])
        self.assertEqual(
            collection.init_exploration_ids,
            collection.get_next_exploration_ids([]))

        # Completing the only exploration of the collection should lead to no
        # recommended explorations thereafter. This test is done without any
        # prerequisite or acquired skill lists.
        self.assertEqual(collection.get_next_exploration_ids(['exp_id_1']), [])

        # If the only exploration in the collection has a prerequired skill,
        # there are no recommendations.
        linked_exp1 = collection.linked_explorations['exp_id_1']
        linked_exp1.update_prerequisite_skills(['first'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])

        # If another exploration has been added with a prerequisite that is the
        # same as an acquired skill of another exploration and the exploration
        # giving that skill is completed, then the first exploration should be
        # recommended.
        collection.add_exploration('exp_id_2')
        linked_exp2 = collection.linked_explorations['exp_id_2']
        linked_exp1.update_acquired_skills(['second'])
        linked_exp2.update_prerequisite_skills(['second'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])
        self.assertEqual(collection.get_next_exploration_ids(
            ['exp_id_1']), ['exp_id_2'])

        # If another exploration is added that has no prerequisites, the user
        # will be able to get to exp_id_1. exp_id_2 should not be recommended
        # unless exp_id_1 is thereafter completed.
        collection.add_exploration('exp_id_0')
        linked_exp0 = collection.linked_explorations['exp_id_0']
        linked_exp0.update_acquired_skills(['first'])
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_0'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0']), ['exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_1']),
            ['exp_id_2'])

        # There may be multiple branches of initial recommendations.
        collection.add_exploration('exp_id_3')
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_3', 'exp_id_0'])

        # There may also be multiple branches farther into recommendations.
        linked_exp3 = collection.linked_explorations['exp_id_3']
        linked_exp3.update_prerequisite_skills(['third'])
        linked_exp0.update_acquired_skills(['first', 'third'])
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_0'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0']),
            ['exp_id_3', 'exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_3']),
            ['exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_1']),
            ['exp_id_2', 'exp_id_3'])
        self.assertEqual(
            collection.get_next_exploration_ids(
                ['exp_id_0', 'exp_id_1', 'exp_id_2']), ['exp_id_3'])

        # If all explorations have been completed, none should be recommended.
        self.assertEqual(
            collection.get_next_exploration_ids(
                ['exp_id_0', 'exp_id_1', 'exp_id_2', 'exp_id_3']), [])


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of collections from YAML files."""

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        COLLECTION_ID = 'a_collection_id'
        EXPLORATION_ID = 'an_exploration_id'

        self.save_new_valid_exploration(EXPLORATION_ID, 'user@example.com',
            end_state_name='End')

        collection = collection_domain.Collection.create_default_collection(
            COLLECTION_ID, 'A title', 'A category', 'An objective')
        collection.add_exploration(EXPLORATION_ID)
        self.assertEqual(len(collection.linked_explorations), 1)

        linked_exp = collection.linked_explorations[EXPLORATION_ID]
        linked_exp.update_acquired_skills(['Skill1', 'Skill2'])

        collection.validate()

        yaml_content = collection.to_yaml()
        self.assertEqual(yaml_content, SAMPLE_YAML_CONTENT)

        collection2 = collection_domain.Collection.from_yaml(
            'collection2', 'Title', 'Category', yaml_content)
        self.assertEqual(len(collection2.linked_explorations), 1)
        yaml_content_2 = collection2.to_yaml()
        self.assertEqual(yaml_content_2, yaml_content)

        with self.assertRaises(Exception):
            collection_domain.Collection.from_yaml(
                'collection3', 'Title', 'Category')


class SchemaMigrationUnitTests(test_utils.GenericTestBase):
    """Test migration methods for yaml content."""

    YAML_CONTENT_V1 = (
"""linked_explorations:
  Exp1:
    acquired_skills:
    - Skill1
    - Skill2
    prerequisite_skills: []
objective: ''
schema_version: 1
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V1

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        self.save_new_valid_exploration('Exp1', 'user@example.com',
            end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', 'A title', 'A category', self.YAML_CONTENT_V1)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

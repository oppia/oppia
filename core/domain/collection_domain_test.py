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
"""category: A category
nodes:
- acquired_skills:
  - Skill0a
  - Skill0b
  exploration_id: an_exploration_id
  prerequisite_skills: []
objective: An objective
schema_version: %d
title: A title
""") % (feconf.CURRENT_COLLECTION_SCHEMA_VERSION)


class CollectionDomainUnitTests(test_utils.GenericTestBase):
    """Test the collection domain object."""

    COLLECTION_ID = 'collection_id'
    EXPLORATION_ID = 'exp_id_0'

    def setUp(self):
        super(CollectionDomainUnitTests, self).setUp()
        self.save_new_valid_collection(
            self.COLLECTION_ID, 'user@example.com', title='Title',
            category='Category', objective='Objective',
            exploration_id=self.EXPLORATION_ID)
        self.collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)

    def test_initial_validation(self):
        """Test validating a new, valid collection."""
        self.collection.validate()

    def test_title_validation(self):
        self.collection.title = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected title to be a string'):
            self.collection.validate()

    def test_category_validation(self):
        self.collection.category = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected category to be a string'):
            self.collection.validate()

    def test_objective_validation(self):
        self.collection.objective = ''
        with self.assertRaisesRegexp(
                utils.ValidationError, 'objective must be specified'):
            self.collection.validate()

        self.collection.objective = 0
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected objective to be a string'):
            self.collection.validate()

    def test_schema_version_validation(self):
        self.collection.schema_version = 'some_schema_version'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected schema version to be an int'):
            self.collection.validate()

        self.collection.schema_version = 100
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected schema version to be %s' %
                feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            self.collection.validate()

    def test_nodes_validation(self):
        self.collection.nodes = {}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected nodes to be a list'):
            self.collection.validate()

        self.collection.nodes = [
            collection_domain.CollectionNode.from_dict({
                'exploration_id': '0',
                'prerequisite_skills': [],
                'acquired_skills': ['skill0a']
            }),
            collection_domain.CollectionNode.from_dict({
                'exploration_id': '0',
                'prerequisite_skills': ['skill0a'],
                'acquired_skills': ['skill0b']
            })
        ]
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'There are explorations referenced in the collection more '
                'than once.'):
            self.collection.validate()

    def test_initial_explorations_validation(self):
        # Having no collection nodes is fine for non-strict validation.
        self.collection.nodes = []
        self.collection.validate(strict=False)

        # But it's not okay for strict validation.
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected to have at least 1 exploration in the collection.'):
            self.collection.validate()

        # If the collection has exactly one exploration and that exploration
        # has prerequisite skills, then the collection should fail validation.
        self.collection.add_node('exp_id_1')
        self.save_new_valid_exploration(
            'exp_id_1', 'user@example.com', end_state_name='End')
        collection_node1 = self.collection.get_node('exp_id_1')
        collection_node1.update_prerequisite_skills(['skill1a'])
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected to have at least 1 '
                'exploration with no prerequisite skills.'):
            self.collection.validate()

    def test_collection_completability_validation(self):
        # Add another exploration, but make it impossible to reach exp_id_1.
        self.collection.add_node('exp_id_1')
        collection_node1 = self.collection.get_node('exp_id_1')
        collection_node1.update_prerequisite_skills(['skill0a'])
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Some explorations are unreachable from the initial '
                'explorations'):
            self.collection.validate()

        # Connecting the two explorations should lead to clean validation.
        collection_node0 = self.collection.get_node('exp_id_0')
        collection_node0.update_acquired_skills(['skill0a'])
        self.collection.validate()

    def test_collection_node_exploration_id_validation(self):
        # Validate CollectionNode's exploration_id.
        collection_node0 = self.collection.get_node('exp_id_0')
        collection_node0.exploration_id = 2
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected exploration ID to be a string'):
            self.collection.validate()

    def test_collection_node_prerequisite_skills_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')

        collection_node0.prerequisite_skills = {}
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected prerequisite_skills to be a list'):
            self.collection.validate()

        collection_node0.prerequisite_skills = ['skill0a', 'skill0a']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'The prerequisite_skills list has duplicate entries'):
            self.collection.validate()

        collection_node0.prerequisite_skills = ['skill0a', 2]
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected all prerequisite skills to be strings'):
            self.collection.validate()

    def test_collection_node_acquired_skills_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')

        collection_node0.acquired_skills = {}
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected acquired_skills to be a list'):
            self.collection.validate()

        collection_node0.acquired_skills = ['skill0a', 'skill0a']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'The acquired_skills list has duplicate entries'):
            self.collection.validate()

        collection_node0.acquired_skills = ['skill0a', 2]
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected all acquired skills to be strings'):
            self.collection.validate()

    def test_collection_node_skills_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')

        # Ensure prerequisite_skills and acquired_skills do not overlap.
        collection_node0.prerequisite_skills = [
            'skill0a', 'skill0b', 'skill0c']
        collection_node0.acquired_skills = [
            'skill0z', 'skill0b', 'skill0c', 'skill0d']
        with self.assertRaisesRegexp(
                utils.ValidationError, 'There are some skills which are both '
                'required for exploration exp_id_0 and acquired after playing '
                'it: [skill0b, skill0c]'):
            self.collection.validate()

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category', 'objective')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = collection_domain.Collection.create_default_collection(
            'a', 'title', 'category', 'objective')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = collection_domain.Collection.create_default_collection(
            'abcd', 'title', 'category', 'objective')
        self.assertEqual(notdemo2.is_demo, False)

    def test_collection_export_import(self):
        """Test that to_dict and from_dict preserve all data within an
        collection.
        """
        self.save_new_valid_exploration(
            '0', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category', 'objective')
        collection_dict = collection.to_dict()
        collection_from_dict = collection_domain.Collection.from_dict(
            collection_dict)
        self.assertEqual(collection_from_dict.to_dict(), collection_dict)

    def test_add_delete_node(self):
        """Test that add_node and delete_node fail in the correct situations.
        """
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category', 'objective')
        self.assertEqual(len(collection.nodes), 0)

        collection.add_node('test_exp')
        self.assertEqual(len(collection.nodes), 1)

        with self.assertRaisesRegexp(
                ValueError,
                'Exploration is already part of this collection: test_exp'):
            collection.add_node('test_exp')

        collection.add_node('another_exp')
        self.assertEqual(len(collection.nodes), 2)

        collection.delete_node('another_exp')
        self.assertEqual(len(collection.nodes), 1)

        with self.assertRaisesRegexp(
                ValueError,
                'Exploration is not part of this collection: another_exp'):
            collection.delete_node('another_exp')

        collection.delete_node('test_exp')
        self.assertEqual(len(collection.nodes), 0)

    def test_skills_property(self):
        collection = collection_domain.Collection.create_default_collection(
            '0', 'title', 'category', 'objective')

        self.assertEqual(collection.skills, [])

        collection.add_node('exp_id_0')
        collection.add_node('exp_id_1')
        collection.get_node('exp_id_0').update_acquired_skills(
            ['skill0a'])
        collection.get_node('exp_id_1').update_prerequisite_skills(
            ['skill0a'])
        collection.get_node('exp_id_1').update_acquired_skills(
            ['skill1b', 'skill1c'])

        self.assertEqual(collection.skills, ['skill0a', 'skill1b', 'skill1c'])

        # Skills should be unique, even if they are duplicated across multiple
        # acquired and prerequisite skill lists.
        collection.add_node('exp_id_2')
        collection.get_node('exp_id_2').update_acquired_skills(
            ['skill0a', 'skill1c'])
        self.assertEqual(collection.skills, ['skill0a', 'skill1b', 'skill1c'])


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
        self.assertEqual(collection.nodes, [])
        self.assertEqual(collection.init_exploration_ids, [])

        # A freshly added exploration will be an initial one.
        collection.add_node('exp_id_0')
        self.assertEqual(collection.init_exploration_ids, ['exp_id_0'])

        # Having prerequisites will make an exploration no longer initial.
        collection.add_node('exp_id_1')
        self.assertEqual(len(collection.nodes), 2)
        collection.get_node('exp_id_1').update_prerequisite_skills(
            ['skill0a'])
        self.assertEqual(collection.init_exploration_ids, ['exp_id_0'])

        # There may be multiple initial explorations.
        collection.add_node('exp_id_2')
        self.assertEqual(
            collection.init_exploration_ids, ['exp_id_0', 'exp_id_2'])

    def test_next_explorations(self):
        """Explorations should be suggested based on prerequisite and
        acquired skills, as well as which explorations have already been played
        in the collection.
        """
        collection = collection_domain.Collection.create_default_collection(
            'collection_id', 'A title', 'A category', 'An objective')

        # There should be no next explorations for an empty collection.
        self.assertEqual(collection.get_next_exploration_ids([]), [])

        # If a new exploration is added, the next exploration IDs should be the
        # same as the initial explorations.
        collection.add_node('exp_id_1')
        self.assertEqual(collection.get_next_exploration_ids([]), ['exp_id_1'])
        self.assertEqual(
            collection.init_exploration_ids,
            collection.get_next_exploration_ids([]))

        # Completing the only exploration of the collection should lead to no
        # available explorations thereafter. This test is done without any
        # prerequisite or acquired skill lists.
        self.assertEqual(collection.get_next_exploration_ids(['exp_id_1']), [])

        # If the only exploration in the collection has a prerequisite skill,
        # there are no explorations left to do.
        collection_node1 = collection.get_node('exp_id_1')
        collection_node1.update_prerequisite_skills(['skill0a'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])

        # If another exploration has been added with a prerequisite that is the
        # same as an acquired skill of another exploration and the exploration
        # giving that skill is completed, then the first exploration should be
        # the next one to complete.
        collection.add_node('exp_id_2')
        collection_node2 = collection.get_node('exp_id_2')
        collection_node1.update_acquired_skills(['skill1b'])
        collection_node2.update_prerequisite_skills(['skill1b'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])
        self.assertEqual(collection.get_next_exploration_ids(
            ['exp_id_1']), ['exp_id_2'])

        # If another exploration is added that has no prerequisites, the
        # learner will be able to get to exp_id_1. exp_id_2 should not be
        # suggested to be completed unless exp_id_1 is thereafter completed.
        collection.add_node('exp_id_0')
        collection_node0 = collection.get_node('exp_id_0')
        collection_node0.update_acquired_skills(['skill0a'])
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_0'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0']), ['exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_1']),
            ['exp_id_2'])

        # There may be multiple branches of initial suggested explorations.
        collection.add_node('exp_id_3')
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_0', 'exp_id_3'])

        # There may also be multiple suggested explorations at other points,
        # depending on which explorations the learner has completed.
        collection_node3 = collection.get_node('exp_id_3')
        collection_node3.update_prerequisite_skills(['skill0c'])
        collection_node0.update_acquired_skills(['skill0a', 'skill0c'])
        self.assertEqual(
            collection.get_next_exploration_ids([]), ['exp_id_0'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0']),
            ['exp_id_1', 'exp_id_3'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_3']),
            ['exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids(['exp_id_0', 'exp_id_1']),
            ['exp_id_2', 'exp_id_3'])
        self.assertEqual(
            collection.get_next_exploration_ids(
                ['exp_id_0', 'exp_id_1', 'exp_id_2']), ['exp_id_3'])

        # If all explorations have been completed, none should be suggested.
        self.assertEqual(
            collection.get_next_exploration_ids(
                ['exp_id_0', 'exp_id_1', 'exp_id_2', 'exp_id_3']), [])


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of collections from YAML files."""

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        COLLECTION_ID = 'a_collection_id'
        EXPLORATION_ID = 'an_exploration_id'

        self.save_new_valid_exploration(
            EXPLORATION_ID, 'user@example.com', end_state_name='End')

        collection = collection_domain.Collection.create_default_collection(
            COLLECTION_ID, 'A title', 'A category', 'An objective')
        collection.add_node(EXPLORATION_ID)
        self.assertEqual(len(collection.nodes), 1)

        collection_node = collection.get_node(EXPLORATION_ID)
        collection_node.update_acquired_skills(['Skill0a', 'Skill0b'])

        collection.validate()

        yaml_content = collection.to_yaml()
        self.assertEqual(yaml_content, SAMPLE_YAML_CONTENT)

        collection2 = collection_domain.Collection.from_yaml(
            'collection2', yaml_content)
        self.assertEqual(len(collection2.nodes), 1)
        yaml_content_2 = collection2.to_yaml()
        self.assertEqual(yaml_content_2, yaml_content)

        # Should not be able to create a collection from no YAML content.
        with self.assertRaises(Exception):
            collection_domain.Collection.from_yaml('collection3')


class SchemaMigrationUnitTests(test_utils.GenericTestBase):
    """Test migration methods for yaml content."""

    YAML_CONTENT_V1 = (
"""category: A category
nodes:
- acquired_skills:
  - Skill1
  - Skill2
  exploration_id: Exp1
  prerequisite_skills: []
objective: ''
schema_version: 1
title: A title
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V1

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V1)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

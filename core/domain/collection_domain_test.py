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

from core.domain import collection_domain
from core.domain import collection_services
from core.tests import test_utils
import feconf
import utils

# Dictionary-like data structures within sample YAML must be formatted
# alphabetically to match string equivalence with the YAML generation
# methods tested below.
#
# If evaluating differences in YAML, conversion to dict form via
# utils.dict_from_yaml can isolate differences quickly.

SAMPLE_YAML_CONTENT = ("""category: A category
language_code: en
next_skill_index: 2
nodes:
- acquired_skill_ids:
  - skill0
  - skill1
  exploration_id: an_exploration_id
  prerequisite_skill_ids: []
objective: An objective
schema_version: %d
skills:
  skill0:
    name: Skill0a
    question_ids: []
  skill1:
    name: Skill0b
    question_ids: []
tags: []
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

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the collection passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.collection.validate()

    def test_initial_validation(self):
        """Test validating a new, valid collection."""
        self.collection.validate()

    def test_title_validation(self):
        self.collection.title = 0
        self._assert_validation_error('Expected title to be a string')

    def test_category_validation(self):
        self.collection.category = 0
        self._assert_validation_error('Expected category to be a string')

    def test_objective_validation(self):
        self.collection.objective = ''
        self._assert_validation_error('objective must be specified')

        self.collection.objective = 0
        self._assert_validation_error('Expected objective to be a string')

    def test_language_code_validation(self):
        self.collection.language_code = ''
        self._assert_validation_error('language must be specified')

        self.collection.language_code = 0
        self._assert_validation_error('Expected language code to be a string')

        # TODO(sll): Remove the next two lines once the App Engine search
        # service supports 3-letter language codes.
        self.collection.language_code = 'kab'
        self._assert_validation_error('it should have exactly 2 letters')

        self.collection.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_tags_validation(self):
        self.collection.tags = 'abc'
        self._assert_validation_error('Expected tags to be a list')

        self.collection.tags = [2, 3]
        self._assert_validation_error('Expected each tag to be a string')

        self.collection.tags = ['', 'tag']
        self._assert_validation_error('Tags should be non-empty')

        self.collection.tags = ['234']
        self._assert_validation_error(
            'Tags should only contain lowercase letters and spaces')

        self.collection.tags = ['   abc']
        self._assert_validation_error(
            'Tags should not start or end with whitespace')

        self.collection.tags = ['abc  def']
        self._assert_validation_error(
            'Adjacent whitespace in tags should be collapsed')

        self.collection.tags = ['abc', 'abc']
        self._assert_validation_error(
            'Expected tags to be unique, but found duplicates')

    def test_schema_version_validation(self):
        self.collection.schema_version = 'some_schema_version'
        self._assert_validation_error('Expected schema version to be an int')

        self.collection.schema_version = 100
        self._assert_validation_error(
            'Expected schema version to be %s' %
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    def test_nodes_validation(self):
        self.collection.nodes = {}
        self._assert_validation_error('Expected nodes to be a list')

        self.collection.nodes = [
            collection_domain.CollectionNode.from_dict({
                'exploration_id': '0',
                'prerequisite_skill_ids': [],
                'acquired_skill_ids': ['skill0a']
            }),
            collection_domain.CollectionNode.from_dict({
                'exploration_id': '0',
                'prerequisite_skill_ids': ['skill0a'],
                'acquired_skill_ids': ['skill0b']
            })
        ]

        self._assert_validation_error(
            'There are explorations referenced in the collection more than '
            'once.')

    def test_get_skill_id_from_index(self):
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected index to be an integer, received abc'):
            collection_domain.CollectionSkill.get_skill_id_from_index('abc')

        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected index to be nonnegative, received -1'):
            collection_domain.CollectionSkill.get_skill_id_from_index(-1)

        self.assertEqual(
            collection_domain.CollectionSkill.get_skill_id_from_index(123),
            'skill123')

    def test_next_skill_index(self):
        self.collection.next_skill_index = 'abc'
        self._assert_validation_error(
            'Expected next_skill_index to be an int, received abc')

        self.collection.next_skill_index = -1
        self._assert_validation_error(
            'Expected next_skill_index to be nonnegative, received -1')

    def test_skill_ids_validation(self):
        self.collection.skills = 'abc'
        self._assert_validation_error(
            'Expected skills to be a dict, received abc')

        self.collection.skills = {
            'a': collection_domain.CollectionSkill.from_dict('test_skill', {
                'name': 'test',
                'question_ids': []
            })}

        self._assert_validation_error(
            'Expected skill ID to begin with \'skill\', received a')

        self.collection.skills = {
            'abcdef': collection_domain.CollectionSkill.from_dict(
                'test_skill', {
                    'name': 'test',
                    'question_ids': []
                })}

        self._assert_validation_error(
            'Expected skill ID to begin with \'skill\', received abcdef')

        self.collection.skills = {
            'skilla': collection_domain.CollectionSkill.from_dict(
                'test_skill', {
                    'name': 'test',
                    'question_ids': []
                })}

        self._assert_validation_error(
            'Expected skill ID to end with a number, received skilla')

        self.collection.next_skill_index = 1
        self.collection.skills = {
            'skill1': collection_domain.CollectionSkill.from_dict(
                'test_skill', {
                    'name': 'test',
                    'question_ids': []
                })}

        self._assert_validation_error(
            'Expected skill ID number to be less than 1, received skill1')

    def test_skills_validation(self):
        self.collection.next_skill_index = 1
        self.collection.skills = {
            'skill0': collection_domain.CollectionSkill.from_dict(
                'skill0', {
                    'name': 123,
                    'question_ids': []
                })}

        self._assert_validation_error(
            'Expected skill name to be a string, received 123')

        self.collection.skills = {
            'skill0': collection_domain.CollectionSkill.from_dict(
                123, {
                    'name': 'test',
                    'question_ids': []
                })}

        self._assert_validation_error(
            'Expected skill ID to be a string, received 123')

        self.collection.skills = {
            'skill0': collection_domain.CollectionSkill.from_dict(
                'skill0', {
                    'name': 'test',
                    'question_ids': {}
                })}

        self._assert_validation_error(
            'Expected question IDs to be a list, received {}')

        self.collection.skills = {
            'skill0': collection_domain.CollectionSkill.from_dict(
                'skill0', {
                    'name': 'test',
                    'question_ids': ['question', 123]
                })}

        self._assert_validation_error(
            'Expected all question_ids to be strings, received 123')

        self.collection.skills = {
            'skill0': collection_domain.CollectionSkill.from_dict(
                'skill0', {
                    'name': 'test',
                    'question_ids': ['question', 'question']
                })}

        self._assert_validation_error(
            'The question_ids list has duplicate entries.')


    def test_initial_explorations_validation(self):
        # Having no collection nodes is fine for non-strict validation.
        self.collection.nodes = []
        self.collection.validate(strict=False)

        # But it's not okay for strict validation.
        self._assert_validation_error(
            'Expected to have at least 1 exploration in the collection.')

        # If the collection has exactly one exploration and that exploration
        # has prerequisite skills, then the collection should fail validation.
        self.collection.add_node('exp_id_1')
        self.collection.add_skill('Skill1')
        self.save_new_valid_exploration(
            'exp_id_1', 'user@example.com', end_state_name='End')
        collection_node1 = self.collection.get_node('exp_id_1')
        collection_node1.update_prerequisite_skill_ids(['skill0'])
        self._assert_validation_error(
            'Expected to have at least 1 exploration with no prerequisite '
            'skill ids.')

    def test_metadata_validation(self):
        self.collection.title = ''
        self.collection.objective = ''
        self.collection.category = ''
        self.collection.nodes = []
        self.collection.add_node('exp_id_1')

        # Having no title is fine for non-strict validation.
        self.collection.validate(strict=False)
        # But it's not okay for strict validation.
        self._assert_validation_error(
            'A title must be specified for the collection.')
        self.collection.title = 'A title'

        # Having no objective is fine for non-strict validation.
        self.collection.validate(strict=False)
        # But it's not okay for strict validation.
        self._assert_validation_error(
            'An objective must be specified for the collection.')
        self.collection.objective = 'An objective'

        # Having no category is fine for non-strict validation.
        self.collection.validate(strict=False)
        # But it's not okay for strict validation.
        self._assert_validation_error(
            'A category must be specified for the collection.')
        self.collection.category = 'A category'

        # Now the collection passes both strict and non-strict validation.
        self.collection.validate(strict=False)
        self.collection.validate(strict=True)

    def test_collection_completability_validation(self):
        # Add another exploration, but make it impossible to reach exp_id_1.
        self.collection.add_node('exp_id_1')
        self.collection.add_skill('Skill')
        collection_node1 = self.collection.get_node('exp_id_1')
        collection_node1.update_prerequisite_skill_ids(['skill0'])
        self._assert_validation_error(
            'Some explorations are unreachable from the initial explorations')

        # Connecting the two explorations should lead to clean validation.
        collection_node0 = self.collection.get_node('exp_id_0')
        collection_node0.update_acquired_skill_ids(['skill0'])
        self.collection.validate()

    def test_collection_node_exploration_id_validation(self):
        # Validate CollectionNode's exploration_id.
        collection_node0 = self.collection.get_node('exp_id_0')
        collection_node0.exploration_id = 2
        self._assert_validation_error('Expected exploration ID to be a string')

    def test_collection_node_prerequisite_skill_ids_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')
        self.collection.add_skill('Skill 0')

        collection_node0.prerequisite_skill_ids = {}
        self._assert_validation_error(
            'Expected prerequisite_skill_ids to be a list')

        collection_node0.prerequisite_skill_ids = ['skill0', 'skill0']
        self._assert_validation_error(
            'The prerequisite_skill_ids list has duplicate entries')

        collection_node0.prerequisite_skill_ids = ['skill0', 2]
        self._assert_validation_error(
            'Expected skill ID to be a string, received 2')

    def test_collection_node_acquired_skill_ids_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')
        self.collection.add_skill('Skill 0')

        collection_node0.acquired_skill_ids = {}
        self._assert_validation_error(
            'Expected acquired_skill_ids to be a list')

        collection_node0.acquired_skill_ids = ['skill0', 'skill0']
        self._assert_validation_error(
            'The acquired_skill_ids list has duplicate entries')

        collection_node0.acquired_skill_ids = ['skill0', 2]
        self._assert_validation_error(
            'Expected skill ID to be a string, received 2')

    def test_validate_collection_node_skills_are_not_repeated(self):
        collection_node0 = self.collection.get_node('exp_id_0')
        self.collection.add_skill('Skill 0')
        self.collection.add_skill('Skill 1')
        self.collection.add_skill('Skill 3')
        self.collection.add_skill('Skill 4')

        # Ensure prerequisite_skill_ids and acquired_skill_ids do not overlap.
        collection_node0.prerequisite_skill_ids = [
            'skill0', 'skill1', 'skill2']
        collection_node0.acquired_skill_ids = [
            'skill3', 'skill4', 'skill0', 'skill1']
        self._assert_validation_error(
            'There are some skills which are both required for exploration '
            'exp_id_0 and acquired after playing it: [skill0, skill1]')

    def test_validate_collection_node_skills_exist_in_skill_table(self):
        collection_node0 = self.collection.get_node('exp_id_0')
        collection_node0.acquired_skill_ids = ['skill0']

        self._assert_validation_error(
            'Skill with ID skill0 does not exist')

        self.collection.add_skill('Skill 0')
        self.collection.validate()

    def test_validate_all_skills_are_used_in_strict_validation(self):
        collection_node0 = self.collection.get_node('exp_id_0')
        self.collection.add_skill('Skill 0')
        self.collection.add_skill('Skill 1')
        collection_node0.acquired_skill_ids = ['skill0']

        # Passes non-strict validation.
        self.collection.validate(strict=False)

        # Fails strict validation
        self._assert_validation_error(
            'Skill with ID skill1 is not a prerequisite or acquired '
            'skill of any node.')

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = collection_domain.Collection.create_default_collection('0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = collection_domain.Collection.create_default_collection('a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = collection_domain.Collection.create_default_collection(
            'abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_collection_export_import(self):
        """Test that to_dict and from_dict preserve all data within an
        collection.
        """
        self.save_new_valid_exploration(
            '0', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.create_default_collection(
            '0', title='title', category='category', objective='objective')
        collection_dict = collection.to_dict()
        collection_from_dict = collection_domain.Collection.from_dict(
            collection_dict)
        self.assertEqual(collection_from_dict.to_dict(), collection_dict)

    def test_add_delete_node(self):
        """Test that add_node and delete_node fail in the correct situations.
        """
        collection = collection_domain.Collection.create_default_collection(
            '0')
        self.assertEqual(len(collection.nodes), 0)

        collection.add_node('test_exp')
        self.assertEqual(len(collection.nodes), 1)

        with self.assertRaisesRegexp(
            ValueError,
            'Exploration is already part of this collection: test_exp'
            ):
            collection.add_node('test_exp')

        collection.add_node('another_exp')
        self.assertEqual(len(collection.nodes), 2)

        collection.delete_node('another_exp')
        self.assertEqual(len(collection.nodes), 1)

        with self.assertRaisesRegexp(
            ValueError,
            'Exploration is not part of this collection: another_exp'
            ):
            collection.delete_node('another_exp')

        collection.delete_node('test_exp')
        self.assertEqual(len(collection.nodes), 0)

    def test_add_skill(self):
        """Test that add_skill correctly adds skills."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        self.assertEqual(collection.skills, {})

        # Add skills
        collection.add_skill('skillname1')
        self.assertEqual(collection.skills.keys(), ['skill0'])
        self.assertEqual(collection.skills['skill0'].name, 'skillname1')

        collection.add_skill('skillname2')
        self.assertEqual(sorted(collection.skills.keys()), ['skill0', 'skill1'])

    def test_update_skill(self):
        """Test that update_skill correctly updates skills."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        self.assertEqual(collection.skills, {})

        # Add a skill.
        collection.add_skill('skillname1')
        self.assertEqual(collection.skills.keys(), ['skill0'])
        self.assertEqual(collection.skills['skill0'].name, 'skillname1')

        # Update the skill name.
        collection.update_skill('skill0', 'new skill name1')
        self.assertEqual(collection.skills['skill0'].name, 'new skill name1')

        # Update the skill name with new skill name which already exists.
        collection.add_skill('skillname2')
        self.assertEqual(collection.skills['skill0'].name, 'new skill name1')
        self.assertEqual(collection.skills['skill1'].name, 'skillname2')
        with self.assertRaisesRegexp(ValueError,
                                     'Skill with name "%s" already exists.'
                                     % 'new skill name1'):
            collection.update_skill('skill1', 'new skill name1')

    def test_adding_duplicate_skill_raises_error(self):
        """Test that adding a duplicate skill name raises an error."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        collection.add_skill('skillname1')
        collection.add_skill('skillname2')

        # Names should be unique
        with self.assertRaisesRegexp(
            ValueError, 'Skill with name "skillname1" already exists.'):
            collection.add_skill('skillname1')

    def test_adding_after_deleting_skill_increments_skill_id(self):
        """Test that re-adding a deleted skill assigns a new skill id."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        collection.add_skill('skillname1')
        collection.add_skill('skillname2')

        # Delete a skill
        collection.delete_skill('skill1')
        self.assertEqual(collection.skills.keys(), ['skill0'])

        # Should raise error if ID is not found
        with self.assertRaisesRegexp(
            ValueError, 'Skill with ID "skill1" does not exist.'):
            collection.delete_skill('skill1')

        # New IDs should skip deleted IDs
        collection.add_skill('skillname3')
        self.assertEqual(sorted(collection.skills.keys()), ['skill0', 'skill2'])

    def test_delete_skill(self):
        """Test that deleting skills works."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        self.assertEqual(collection.skills, {})

        # Add prerequisite and acquired skills
        collection.add_skill('skillname1')
        self.assertEqual(collection.skills.keys(), ['skill0'])
        self.assertEqual(collection.skills['skill0'].name, 'skillname1')

        collection.add_skill('skillname2')
        self.assertEqual(sorted(collection.skills.keys()), ['skill0', 'skill1'])

        collection.add_node('exp_id_0')
        collection.add_node('exp_id_1')
        collection.get_node('exp_id_0').update_acquired_skill_ids(['skill0'])
        collection.get_node('exp_id_1').update_prerequisite_skill_ids(
            ['skill0'])

        # Check that prerequisite and acquired skill ids are updated when skill
        # is deleted.
        collection.delete_skill('skill0')
        self.assertEqual(collection.get_node('exp_id_0').acquired_skill_ids, [])
        self.assertEqual(
            collection.get_node('exp_id_1').prerequisite_skill_ids, [])

    def test_get_skill_id_from_skill_name(self):
        """Test to verify get_skill_id_from_skill_name works."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        self.assertEqual(collection.skills, {})

        collection.add_skill('skillname1')
        collection.add_skill('skillname2')
        skill_id = collection.get_skill_id_from_skill_name('skillname1')
        self.assertIn(skill_id, collection.skills)

        collection.delete_skill(skill_id)
        skill_id = collection.get_skill_id_from_skill_name('skillname1')
        self.assertEqual(skill_id, None)

    def test_add_question_id_to_skill(self):
        """Test to verify add_question_id_to_skill method."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        collection.add_skill('skillname')
        skill_id = collection.get_skill_id_from_skill_name('skillname')
        collection.add_question_id_to_skill(skill_id, 'question0')
        self.assertIn('question0', collection.skills[skill_id].question_ids)

        with self.assertRaises(Exception):
            collection.add_question_id_to_skill(skill_id, 'question0')

    def test_remove_question_id_from_skill(self):
        """Test to verify remove_question_id_from_skill method."""
        collection = collection_domain.Collection.create_default_collection(
            'exp_id')
        collection.add_skill('skillname')
        skill_id = collection.get_skill_id_from_skill_name('skillname')
        collection.add_question_id_to_skill(skill_id, 'question0')
        with self.assertRaises(Exception):
            collection.remove_question_id_from_skill(skill_id, 'random')
        collection.remove_question_id_from_skill(skill_id, 'question0')
        self.assertEqual(len(collection.skills[skill_id].question_ids), 0)

    def test_get_acquired_skill_ids_from_exploration_ids(self):
        """Test get_acquired_skill_ids_from_exploration_ids method."""
        collection = collection_domain.Collection.create_default_collection(
            'collection_id')
        collection.add_node('exp_id_0')
        collection.get_node('exp_id_0').update_acquired_skill_ids(
            ['skill0a'])
        self.assertIn(
            'skill0a',
            collection.get_acquired_skill_ids_from_exploration_ids(
                ['exp_id_0']))


class ExplorationGraphUnitTests(test_utils.GenericTestBase):
    """Test the skill graph structure within a collection."""

    def test_initial_explorations(self):
        """Any exploration without prerequisites should be an initial
        exploration.
        """
        collection = collection_domain.Collection.create_default_collection(
            'collection_id')

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
        collection.get_node('exp_id_1').update_prerequisite_skill_ids(
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
            'collection_id')

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
        collection_node1.update_prerequisite_skill_ids(['skill0a'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])

        # If another exploration has been added with a prerequisite that is the
        # same as an acquired skill of another exploration and the exploration
        # giving that skill is completed, then the first exploration should be
        # the next one to complete.
        collection.add_node('exp_id_2')
        collection_node2 = collection.get_node('exp_id_2')
        collection_node1.update_acquired_skill_ids(['skill1b'])
        collection_node2.update_prerequisite_skill_ids(['skill1b'])
        self.assertEqual(collection.get_next_exploration_ids([]), [])
        self.assertEqual(collection.get_next_exploration_ids(
            ['exp_id_1']), ['exp_id_2'])

        # If another exploration is added that has no prerequisites, the
        # learner will be able to get to exp_id_1. exp_id_2 should not be
        # suggested to be completed unless exp_id_1 is thereafter completed.
        collection.add_node('exp_id_0')
        collection_node0 = collection.get_node('exp_id_0')
        collection_node0.update_acquired_skill_ids(['skill0a'])
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
        collection_node3.update_prerequisite_skill_ids(['skill0c'])
        collection_node0.update_acquired_skill_ids(['skill0a', 'skill0c'])
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

    def test_next_explorations_in_sequence(self):
        collection = collection_domain.Collection.create_default_collection(
            'collection_id')
        exploration_id = 'exp_id_0'
        collection.add_node(exploration_id)

        # Completing the only exploration of the collection should lead to no
        # available explorations thereafter.
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence(exploration_id), [])

        # If the current exploration has no acquired skills, a list of all
        # explorations with no prerequisite skills should be returned.
        collection.add_node('exp_id_1')
        collection.add_node('exp_id_2')
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence(exploration_id),
            ['exp_id_1', 'exp_id_2'])

        # If only one exploration in the collection has a prerequisite skill
        # that is included in the user's learned skills, only that exploration
        # should be returned.
        collection_node0 = collection.get_node('exp_id_0')
        collection_node1 = collection.get_node('exp_id_1')

        collection_node0.update_acquired_skill_ids(['skill1a'])
        collection_node1.update_prerequisite_skill_ids(['skill1a'])
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence(exploration_id),
            ['exp_id_1'])

        # Given a chain of explorations in a collections where each
        # exploration's acquired skills are the following exploration's
        # prerequisite skills, each exploration should return the following
        # exploration as a recommendation.  The last exploration should
        # return an empty list.
        collection.add_node('exp_id_3')

        collection_node2 = collection.get_node('exp_id_2')
        collection_node3 = collection.get_node('exp_id_3')

        collection_node1.update_acquired_skill_ids(['skill2a'])
        collection_node2.update_acquired_skill_ids(['skill3a'])

        collection_node0.update_prerequisite_skill_ids([])
        collection_node2.update_prerequisite_skill_ids(['skill2a'])
        collection_node3.update_prerequisite_skill_ids(['skill3a'])

        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence('exp_id_0'),
            ['exp_id_1'])
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence('exp_id_1'),
            ['exp_id_2'])
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence('exp_id_2'),
            ['exp_id_3'])
        self.assertEqual(
            collection.get_next_exploration_ids_in_sequence('exp_id_3'),
            [])

    def test_nodes_are_in_playble_order(self):
        # Create collection.
        collection = collection_domain.Collection.create_default_collection(
            'collection_id')

        # There should be an empty node list in playable order for an empty
        # collection.
        self.assertEqual(collection.get_nodes_in_playable_order(), [])

        # Add nodes to collection.
        collection.add_node('exp_id_1')
        collection.add_node('exp_id_2')
        collection.add_node('exp_id_0')

        # Without updating prerequisite and acquired skills the
        # prerequisite and acquired skill_ids list is empty in each node, so
        # the playable order will be equal to the order in which they are
        # adeed.
        sorted_nodes = collection.get_nodes_in_playable_order()
        expected_explorations_list = ['exp_id_1', 'exp_id_2', 'exp_id_0']
        observed_explration_list = [
            node.exploration_id for node in sorted_nodes]

        self.assertEqual(expected_explorations_list, observed_explration_list)

        # Add skills to collection.
        collection.add_skill('skill0')
        collection.add_skill('skill1')
        collection.add_skill('skill2')

        # Updating 1st node's prerequisite and acquired skill_ids.
        collection_node0 = collection.get_node('exp_id_1')
        collection_node0.update_prerequisite_skill_ids(['skill0'])
        collection_node0.update_acquired_skill_ids(['skill1'])

        # The 1st node will be removed from the playable order as this node
        # is not acheivable i.e, there is no way to fullfil the prerequisite
        # of this node.
        sorted_nodes = collection.get_nodes_in_playable_order()
        expected_explorations_list = ['exp_id_2', 'exp_id_0']
        observed_explration_list = [
            node.exploration_id for node in sorted_nodes]

        self.assertEqual(expected_explorations_list, observed_explration_list)

        # Updating 3rd node's prerequisite and acquired skill_ids.
        collection_node2 = collection.get_node('exp_id_0')
        collection_node2.update_prerequisite_skill_ids([])
        collection_node2.update_acquired_skill_ids(['skill0'])

        # Now the 1st node's prerequisite skills can be acheived through the
        # 3rd node (exp_id_0 ---> exp_id_1).
        sorted_nodes = collection.get_nodes_in_playable_order()
        expected_explorations_list = ['exp_id_2', 'exp_id_0', 'exp_id_1']
        observed_explration_list = [
            node.exploration_id for node in sorted_nodes]
        self.assertEqual(observed_explration_list, expected_explorations_list)

        # Updating 2nd node's prerequisite and acquired skill_ids.
        collection_node1 = collection.get_node('exp_id_2')
        collection_node1.update_prerequisite_skill_ids(['skill1'])
        collection_node1.update_acquired_skill_ids(['skill2'])

        # Sorting nodes in linear and playable order.
        sorted_nodes = collection.get_nodes_in_playable_order()

        # Expected order of explorations.
        expected_explorations_list = ['exp_id_0', 'exp_id_1', 'exp_id_2']

        # Observed order of exploration.
        observed_explration_list = [
            node.exploration_id for node in sorted_nodes]

        # Validates the number of nodes present in collection after sorting.
        self.assertEqual(len(sorted_nodes), 3)

        # Checks the order of exploration.
        self.assertEqual(observed_explration_list, expected_explorations_list)

    def test_next_explorations_with_invalid_exploration_ids(self):
        collection = collection_domain.Collection.create_default_collection(
            'collection_id')
        collection.add_node('exp_id_1')

        # There should be one suggested exploration to complete by default.
        self.assertEqual(collection.get_next_exploration_ids([]), ['exp_id_1'])

        # If an invalid exploration ID is passed to get_next_exploration_ids(),
        # it should be ignored. This tests the situation where an exploration
        # is deleted from a collection after being completed by a user.
        self.assertEqual(
            collection.get_next_exploration_ids(['fake_exp_id']), ['exp_id_1'])


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of collections from YAML files."""

    COLLECTION_ID = 'a_collection_id'
    EXPLORATION_ID = 'an_exploration_id'

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        self.save_new_valid_exploration(
            self.EXPLORATION_ID, 'user@example.com', end_state_name='End')

        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID, title='A title', category='A category',
            objective='An objective')
        collection.add_node(self.EXPLORATION_ID)
        self.assertEqual(len(collection.nodes), 1)

        collection.add_skill('Skill0a')
        collection.add_skill('Skill0b')
        collection_node = collection.get_node(self.EXPLORATION_ID)
        collection_node.update_acquired_skill_ids(['skill0', 'skill1'])

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
            collection_domain.Collection.from_yaml('collection3', None)


class SchemaMigrationMethodsUnitTests(test_utils.GenericTestBase):
    """Tests the presence of appropriate schema migration methods in the
    Collection domain object class.
    """

    def test_correct_collection_contents_schema_conversion_methods_exist(self):
        """Test that the right collection_contents schema conversion methods
        exist.
        """
        current_collection_schema_version = (
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)
        for version_num in range(1, current_collection_schema_version):
            self.assertTrue(hasattr(
                collection_domain.Collection,
                '_convert_collection_contents_v%s_dict_to_v%s_dict' % (
                    version_num, version_num + 1)))

        self.assertFalse(hasattr(
            collection_domain.Collection,
            '_convert_collection_contents_v%s_dict_to_v%s_dict' % (
                current_collection_schema_version,
                current_collection_schema_version + 1)))

    def test_correct_collection_schema_conversion_methods_exist(self):
        """Test that the right collection schema conversion methods exist."""
        current_collection_schema_version = (
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

        for version_num in range(1, current_collection_schema_version):
            self.assertTrue(hasattr(
                collection_domain.Collection,
                '_convert_v%s_dict_to_v%s_dict' % (
                    version_num, version_num + 1)))

        self.assertFalse(hasattr(
            collection_domain.Collection,
            '_convert_v%s_dict_to_v%s_dict' % (
                current_collection_schema_version,
                current_collection_schema_version + 1)))


class SchemaMigrationUnitTests(test_utils.GenericTestBase):
    """Test migration methods for yaml content."""

    YAML_CONTENT_V1 = ("""category: A category
nodes:
- acquired_skills:
  - Skill1
  - Skill2
  exploration_id: Exp1
  prerequisite_skills: []
- acquired_skills: []
  exploration_id: Exp2
  prerequisite_skills:
  - Skill1
objective: ''
schema_version: 1
title: A title
""")
    YAML_CONTENT_V2 = ("""category: A category
language_code: en
nodes:
- acquired_skills:
  - Skill1
  - Skill2
  exploration_id: Exp1
  prerequisite_skills: []
- acquired_skills: []
  exploration_id: Exp2
  prerequisite_skills:
  - Skill1
objective: ''
schema_version: 2
tags: []
title: A title
""")
    YAML_CONTENT_V3 = ("""category: A category
language_code: en
nodes:
- acquired_skills:
  - Skill1
  - Skill2
  exploration_id: Exp1
  prerequisite_skills: []
- acquired_skills: []
  exploration_id: Exp2
  prerequisite_skills:
  - Skill1
objective: ''
schema_version: 2
tags: []
title: A title
""")
    YAML_CONTENT_V4 = ("""category: A category
language_code: en
next_skill_id: 2
nodes:
- acquired_skill_ids:
  - skill0
  - skill1
  exploration_id: Exp1
  prerequisite_skill_ids: []
- acquired_skill_ids: []
  exploration_id: Exp2
  prerequisite_skill_ids:
  - skill0
objective: ''
schema_version: 4
skills:
  skill0:
    name: Skill1
    question_ids: []
  skill1:
    name: Skill2
    question_ids: []
tags: []
title: A title
""")
    YAML_CONTENT_V5 = ("""category: A category
language_code: en
next_skill_index: 2
nodes:
- acquired_skill_ids:
  - skill0
  - skill1
  exploration_id: Exp1
  prerequisite_skill_ids: []
- acquired_skill_ids: []
  exploration_id: Exp2
  prerequisite_skill_ids:
  - skill0
objective: ''
schema_version: 5
skills:
  skill0:
    name: Skill1
    question_ids: []
  skill1:
    name: Skill2
    question_ids: []
tags: []
title: A title
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V5

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V1)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v2(self):
        """Test direct loading from a v2 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V2)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v3(self):
        """Test direct loading from a v3 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V3)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v4(self):
        """Test direct loading from a v4 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V4)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v5(self):
        """Test direct loading from a v5 yaml file."""
        self.save_new_valid_exploration(
            'Exp1', 'user@example.com', end_state_name='End')
        collection = collection_domain.Collection.from_yaml(
            'cid', self.YAML_CONTENT_V5)
        self.assertEqual(collection.to_yaml(), self._LATEST_YAML_CONTENT)

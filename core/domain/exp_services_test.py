# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import param_domain
from core.domain import stats_services
from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import feconf
import test_utils
import utils


class ExplorationServicesUnitTests(test_utils.GenericTestBase):
    """Test the exploration services module."""

    def setUp(self):
        """Loads the default widgets and creates dummy users."""
        super(ExplorationServicesUnitTests, self).setUp()

        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_all_explorations(self):
        """Test get_all_explorations()."""

        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id]
        )

        exploration2 = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'New title', 'A category',
                'New exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id, exploration2.id]
        )

    def test_get_public_explorations(self):
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertEqual(exp_services.get_public_explorations(), [])

        exploration.is_public = True
        exp_services.save_exploration(self.owner_id, exploration)
        self.assertEqual(
            [e.id for e in exp_services.get_public_explorations()],
            [exploration.id]
        )

    def test_get_viewable_explorations(self):
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exp_services.save_exploration(self.owner_id, exploration)

        def get_viewable_ids(user_id):
            return [
                e.id for e in exp_services.get_viewable_explorations(user_id)
            ]

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_viewable_ids(self.viewer_id), [])
        self.assertEqual(get_viewable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exp_services.save_exploration(self.owner_id, exploration)

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(
            get_viewable_ids(self.viewer_id), [exploration.id])
        self.assertEqual(get_viewable_ids(None), [exploration.id])

    def test_get_editable_explorations(self):
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exp_services.save_exploration(self.owner_id, exploration)

        def get_editable_ids(user_id):
            return [
                e.id for e in exp_services.get_editable_explorations(user_id)
            ]

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exp_services.save_exploration(self.owner_id, exploration)

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

    def test_count_explorations(self):
        """Test count_explorations()."""

        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id')
        self.assertEqual(exp_services.count_explorations(), 1)

        exp_services.create_new(
            self.owner_id, 'A new title', 'A category', 'A new exploration_id')
        self.assertEqual(exp_services.count_explorations(), 2)


class ExplorationParametersUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to exploration parameters."""

    def test_get_init_params(self):
        """Test the get_init_params() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'eid'))

        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exploration.param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        exploration.param_changes = [independent_pc, dependent_pc]
        exp_services.save_exploration('committer_id', exploration)

        new_params = exp_services.get_init_params('eid')
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})

        exploration.param_changes = [dependent_pc, independent_pc]
        exp_services.save_exploration('committer_id', exploration)

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        new_params = exp_services.get_init_params('eid')
        self.assertEqual(new_params, {'a': 'firstValue', 'b': ''})

    def test_update_with_state_params(self):
        """Test the update_with_state_params() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'eid'))

        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exploration.param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        state = exploration.init_state
        state.param_changes = [independent_pc, dependent_pc]
        exp_services.save_state('committer_id', 'eid', state)
        exp_services.save_exploration('committer_id', exploration)

        reader_params = {}
        new_params = exp_services.update_with_state_params(
            'eid', exploration.init_state_id, reader_params)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})
        self.assertEqual(reader_params, {})

        state.param_changes = [dependent_pc]
        exp_services.save_state('committer_id', 'eid', state)
        exp_services.save_exploration('committer_id', exploration)

        reader_params = {'a': 'secondValue'}
        new_params = exp_services.update_with_state_params(
            'eid', exploration.init_state_id, reader_params)
        self.assertEqual(new_params, {'a': 'secondValue', 'b': 'secondValue'})
        self.assertEqual(reader_params, {'a': 'secondValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        reader_params = {}
        new_params = exp_services.update_with_state_params(
            'eid', exploration.init_state_id, reader_params)
        self.assertEqual(new_params, {'b': ''})
        self.assertEqual(reader_params, {})


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_create_from_yaml(self):
        """Test the create_from_yaml() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category',
                'A different exploration_id'))
        exp_services.add_state(self.owner_id, exploration.id, 'New state')

        exploration = exp_services.get_exploration_by_id(
            'A different exploration_id')
        self.assertEqual(len(exploration.state_ids), 2)

        yaml_content = exp_services.export_to_yaml(exploration.id)

        exploration2 = exp_services.get_exploration_by_id(
            exp_services.create_from_yaml(
                yaml_content, self.owner_id, 'Title', 'Category'))
        self.assertEqual(len(exploration2.state_ids), 2)
        yaml_content_2 = exp_services.export_to_yaml(exploration2.id)
        self.assertEqual(yaml_content_2, yaml_content)

        self.assertEqual(exp_services.count_explorations(), 2)

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'No_initial_state_name', self.owner_id, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'Invalid\ninit_state_name:\nMore stuff',
                self.owner_id, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'State1:\n(\nInvalid yaml', self.owner_id, 'Title', 'category')

        # Check that no new exploration was created.
        self.assertEqual(exp_services.count_explorations(), 2)

    def test_creation_and_deletion_and_retrieval_of_explorations(self):
        """Test the create_new(), delete() and get() methods."""
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_services.get_exploration_by_id('fake_eid')

        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        retrieved_exploration = exp_services.get_exploration_by_id(
            'A exploration_id')
        self.assertEqual(exploration.id, retrieved_exploration.id)
        self.assertEqual(exploration.title, retrieved_exploration.title)

        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id('fake_exploration')

        exp_services.delete_exploration(self.owner_id, 'A exploration_id')
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id('A exploration_id')


class LoadingAndDeletionOfDemosTest(ExplorationServicesUnitTests):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.load_demos()
        self.assertEqual(
            exp_services.count_explorations(), len(feconf.DEMO_EXPLORATIONS))

        exp_services.delete_demos()
        self.assertEqual(exp_services.count_explorations(), 0)


class ExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations and states."""

    def test_export_to_yaml(self):
        """Test the export_to_yaml() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category',
                'A different exploration_id'))
        exp_services.add_state(self.owner_id, exploration.id, 'New state')
        yaml_content = exp_services.export_to_yaml(exploration.id)
        self.assertEqual(
            yaml_content,
"""default_skin: conversation_v1
param_changes: []
param_specs: {}
schema_version: 1
states:
- content: []
  name: (untitled state)
  param_changes: []
  widget:
    customization_args: {}
    handlers:
    - name: submit
      rule_specs:
      - definition:
          rule_type: default
        dest: (untitled state)
        feedback: []
        param_changes: []
    sticky: false
    widget_id: Continue
- content: []
  name: New state
  param_changes: []
  widget:
    customization_args: {}
    handlers:
    - name: submit
      rule_specs:
      - definition:
          rule_type: default
        dest: New state
        feedback: []
        param_changes: []
    sticky: false
    widget_id: Continue
""")

    def test_export_state_to_dict(self):
        """Test the export_state_to_dict() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category',
                'A different exploration_id'))
        exp_services.add_state(self.owner_id, exploration.id, 'New state')
        new_state = exp_services.get_state_by_name(exploration.id, 'New state')
        state_dict = exp_services.export_state_to_dict(
            exploration.id, new_state.id)

        expected_dict = {
            'id': new_state.id,
            'name': u'New state',
            'content': [],
            'param_changes': [],
            'widget': {
                'widget_id': u'Continue',
                'customization_args': {},
                'sticky': False,
                'handlers': [{
                    'name': u'submit',
                    'rule_specs': [{
                        'definition': {
                            u'rule_type': u'default'
                        },
                        'dest': new_state.id,
                        'feedback': [],
                        'param_changes': [],

                    }]
                }]
            },
        }
        self.assertEqual(expected_dict, state_dict)


class StateServicesUnitTests(ExplorationServicesUnitTests):
    """Test methods operating on states."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    SUBMIT_HANDLER = 'submit'

    def test_convert_state_name_to_id(self):
        """Test converting state names to ids."""
        eid = 'exp_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                'user_id', 'A title', 'A category', eid))

        sid = 'state_id'
        state_name = 'State 1'
        exp_services.add_state(
            'user_id', exploration.id, state_name, state_id=sid)

        self.assertEqual(
            exp_services.convert_state_name_to_id(eid, state_name), sid)

        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.convert_state_name_to_id(eid, 'fake_name')

        self.assertEqual(
            exp_services.convert_state_name_to_id(eid, feconf.END_DEST),
            feconf.END_DEST)

    def test_get_unresolved_answers(self):
        self.assertEquals(
            exp_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {})

        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            exp_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'a1': 1})

        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            exp_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'a1': 2})

        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', self.SUBMIT_HANDLER, ['a1'])
        self.assertEquals(
            exp_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {})

    def test_create_and_get_state(self):
        """Test creation and retrieval of states."""
        eid = 'A exploration_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                'fake@user.com', 'A title', 'A category', eid))

        id_1 = '123'
        name_1 = 'State 1'
        exp_services.add_state('fake@user.com', eid, name_1, state_id=id_1)
        state_1 = exp_services.get_state_by_name(eid, name_1)

        exploration = exp_services.get_exploration_by_id(eid)
        fetched_state_1 = exp_services.get_state_by_id(exploration.id, id_1)
        self.assertEqual(fetched_state_1.id, state_1.id)
        self.assertEqual(fetched_state_1.name, state_1.name)

        self.assertEqual(
            exp_services.get_state_by_name(eid, name_1).id, state_1.id)

        name_2 = 'fake name'
        self.assertIsNone(exp_services.get_state_by_name(
            eid, name_2, strict=False))
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2, strict=True)
        # The default behavior is to fail noisily.
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2)

    def test_delete_state(self):
        """Test deletion of states."""
        USER_ID = 'fake@user.com'
        EXP_ID = 'A exploration_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(USER_ID, 'A title', 'A category', EXP_ID))
        exp_services.add_state(USER_ID, EXP_ID, 'first state')
        exploration = exp_services.get_exploration_by_id(EXP_ID)

        with self.assertRaisesRegexp(
                ValueError, 'Cannot delete initial state'):
            exp_services.delete_state(
                USER_ID, EXP_ID, exploration.state_ids[0])

        exp_services.add_state(USER_ID, EXP_ID, 'second state')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exp_services.delete_state(USER_ID, EXP_ID, exploration.state_ids[1])

        with self.assertRaisesRegexp(ValueError, 'Invalid state id'):
            exp_services.delete_state(USER_ID, EXP_ID, 'fake state')

    def test_state_operations(self):
        """Test adding, updating and checking existence of states."""
        USER_ID = 'fake@user.com'
        EXP_ID = 'A exploration_id'

        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(USER_ID, 'A title', 'A category', EXP_ID))
        with self.assertRaisesRegexp(
                base_models.BaseModel.EntityNotFoundError, 'not found'):
            exp_services.get_state_by_id(EXP_ID, 'invalid_state_id')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        self.assertEqual(len(exploration.state_ids), 1)

        def rename_state(committer_id, exp_id, state_id, new_state_name):
            return exp_services.update_state(
                committer_id, exp_id, state_id, new_state_name,
                None, None, None, None, None, None)

        default_state = exp_services.get_state_by_id(
            exploration.id, exploration.state_ids[0])
        default_state_name = default_state.name
        rename_state(USER_ID, EXP_ID, default_state.id, 'Renamed state')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        self.assertEqual(len(exploration.state_ids), 1)
        self.assertEqual(exploration.states[0].name, 'Renamed state')

        # Add a new state.
        exp_services.add_state(USER_ID, EXP_ID, 'State 2')
        second_state = exp_services.get_state_by_name(EXP_ID, 'State 2')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        self.assertEqual(len(exploration.state_ids), 2)

        # It is OK to rename a state to itself.
        rename_state(USER_ID, EXP_ID, second_state.id, second_state.name)
        renamed_second_state = exp_services.get_state_by_id(
            EXP_ID, second_state.id)
        self.assertEqual(renamed_second_state.name, 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exp_services.add_state(USER_ID, EXP_ID, 'State 2')
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            rename_state(USER_ID, EXP_ID, second_state.id, 'Renamed state')

        # And it is not OK to rename a state to the END_DEST.
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid state name'):
            rename_state(USER_ID, EXP_ID, second_state.id, feconf.END_DEST)

        # The exploration now has exactly two states.
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        self.assertFalse(exploration.has_state_named(default_state_name))
        self.assertTrue(exploration.has_state_named('Renamed state'))
        self.assertTrue(exploration.has_state_named('State 2'))


class ExplorationSnapshotUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to exploration snapshots."""

    def test_get_exploration_snapshots_metadata(self):
        eid = 'exp_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new('user_id', 'A title', 'A category', eid))

        self.assertEqual(
            exp_services.get_exploration_snapshots_metadata(eid, 3), [])

        # Publish the exploration so that version snapshots start getting
        # recorded.
        exploration.is_public = True
        exp_services.save_exploration('committer_id_1', exploration)
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            eid, 3)
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'committer_id': 'committer_id_1',
            'commit_message': 'Exploration first published.',
            'version_number': 1,
        }, snapshots_metadata[0])

        # Using the old version of the exploration should raise an error.
        with self.assertRaisesRegexp(Exception, 'version 0, which is too old'):
            exp_services.save_exploration('committer_id_2', exploration)

        exploration = exp_services.get_exploration_by_id(eid)
        exploration.title = 'New title'
        exp_services.save_exploration('committer_id_2', exploration)
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            eid, 3)
        self.assertEqual(len(snapshots_metadata), 2)
        self.assertDictContainsSubset({
            'committer_id': 'committer_id_2',
            'commit_message': '',
            'version_number': 2,
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'committer_id': 'committer_id_1',
            'commit_message': 'Exploration first published.',
            'version_number': 1,
        }, snapshots_metadata[1])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

    def test_versioning_with_add_and_delete_states(self):
        eid = 'exp_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new('user_id', 'A title', 'A category', eid))

        # Publish the exploration so that version snapshots start getting
        # recorded.
        exploration.is_public = True
        exp_services.save_exploration('committer_id_1', exploration)
        commit_dict_1 = {
            'committer_id': 'committer_id_1',
            'commit_message': 'Exploration first published.',
            'version_number': 1,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            eid, 5)
        self.assertEqual(len(snapshots_metadata), 1)

        exp_services.add_state('committer_id_2', eid, 'New state')
        commit_dict_2 = {
            'committer_id': 'committer_id_2',
            'commit_message': '',
            'version_number': 2,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            eid, 5)
        self.assertEqual(len(snapshots_metadata), 2)
        self.assertDictContainsSubset(
            commit_dict_2, snapshots_metadata[0])
        self.assertDictContainsSubset(commit_dict_1, snapshots_metadata[1])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

        # Perform an invalid action: delete a state that does not exist. This
        # should not create a new version.
        with self.assertRaisesRegexp(ValueError, 'Invalid state id'):
            exp_services.delete_state(
                'bad_committer', eid, 'invalid_state_id')

        # Now delete the new state.
        new_state_id = exp_services.convert_state_name_to_id(eid, 'New state')
        exp_services.delete_state('committer_id_3', eid, new_state_id)
        commit_dict_3 = {
            'committer_id': 'committer_id_3',
            'commit_message': '',
            'version_number': 3,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            eid, 5)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[0])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        self.assertDictContainsSubset(commit_dict_1, snapshots_metadata[2])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])
        self.assertGreaterEqual(
            snapshots_metadata[1]['created_on'],
            snapshots_metadata[2]['created_on'])

        # The final exploration should have exactly one state.
        exploration = exp_services.get_exploration_by_id(eid)
        self.assertEqual(len(exploration.states), 1)

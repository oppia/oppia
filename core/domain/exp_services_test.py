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

import feconf
from core.domain import exp_services
from core.domain import stats_services
import test_utils


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
        exp_services.save_exploration(exploration)
        self.assertEqual(
            [e.id for e in exp_services.get_public_explorations()],
            [exploration.id]
        )

    def test_get_viewable_explorations(self):
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exp_services.save_exploration(exploration)

        def get_viewable_ids(user_id):
            return [
                e.id for e in exp_services.get_viewable_explorations(user_id)
            ]

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_viewable_ids(self.viewer_id), [])
        self.assertEqual(get_viewable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exp_services.save_exploration(exploration)

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(
            get_viewable_ids(self.viewer_id), [exploration.id])
        self.assertEqual(get_viewable_ids(None), [exploration.id])

    def test_get_editable_explorations(self):
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exp_services.save_exploration(exploration)

        def get_editable_ids(user_id):
            return [
                e.id for e in exp_services.get_editable_explorations(user_id)
            ]

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exp_services.save_exploration(exploration)

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


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_create_from_yaml(self):
        """Test the create_from_yaml() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category',
                'A different exploration_id'))
        exp_services.add_state(exploration.id, 'New state')

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

        exp_services.delete_exploration('A exploration_id')
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id('A exploration_id')

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.load_demos()
        self.assertEqual(exp_services.count_explorations(), 7)

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
        exp_services.add_state(exploration.id, 'New state')
        yaml_content = exp_services.export_to_yaml(exploration.id)
        self.assertEqual(yaml_content, """parameters: []
states:
- content: []
  name: '[untitled state]'
  param_changes: []
  widget:
    handlers:
    - name: submit
      rule_specs:
      - dest: '[untitled state]'
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params:
      buttonText: Continue
    sticky: false
    widget_id: Continue
- content: []
  name: New state
  param_changes: []
  widget:
    handlers:
    - name: submit
      rule_specs:
      - dest: New state
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params:
      buttonText: Continue
    sticky: false
    widget_id: Continue
""")

    def test_export_state_to_dict(self):
        """Test the export_state_to_dict() method."""
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.owner_id, 'A title', 'A category',
                'A different exploration_id'))
        exp_services.add_state(exploration.id, 'New state')
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
                'params': {
                  u'buttonText': u'Continue',
                },
                'sticky': False,
                'handlers': [{
                    'name': u'submit',
                    'rule_specs': [{
                        'name': u'Default',
                        'inputs': {},
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

    DEFAULT_RULESPEC_STR = 'Default()'
    SUBMIT_HANDLER = 'submit'

    def test_convert_state_name_to_id(self):
        """Test converting state names to ids."""
        eid = 'exp_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                'user_id', 'A title', 'A category', eid))

        sid = 'state_id'
        state_name = 'State 1'
        exp_services.add_state(exploration.id, state_name, state_id=sid)

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
        exp_services.add_state(eid, name_1, state_id=id_1)
        state_1 = exp_services.get_state_by_name(eid, name_1)

        exploration = exp_services.get_exploration_by_id(eid)
        fetched_state_1 = exp_services.get_state_by_id(exploration.id, id_1)
        self.assertEqual(fetched_state_1.id, state_1.id)
        self.assertEqual(fetched_state_1.name, state_1.name)

        self.assertEqual(
            exp_services.get_state_by_name(eid, name_1).id, state_1.id)

        name_2 = 'fake_name'
        self.assertIsNone(exp_services.get_state_by_name(
            eid, name_2, strict=False))
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2, strict=True)
        # The default behavior is to fail noisily.
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2)

    def test_delete_state(self):
        """Test deletion of states."""
        exploration_id = 'A exploration_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                'fake@user.com', 'A title', 'A category', exploration_id))
        exp_services.add_state(exploration_id, 'first_state')
        exploration = exp_services.get_exploration_by_id(exploration_id)

        with self.assertRaisesRegexp(
                ValueError, 'Cannot delete initial state'):
            exp_services.delete_state(exploration.id, exploration.state_ids[0])

        exp_services.add_state(exploration_id, 'second_state')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        exp_services.delete_state(exploration.id, exploration.state_ids[1])

        with self.assertRaisesRegexp(ValueError, 'Invalid state id'):
            exp_services.delete_state(exploration.id, 'fake_state')

    def test_state_operations(self):
        """Test adding, renaming and checking existence of states."""
        exploration_id = 'A exploration_id'

        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                'fake@user.com', 'A title', 'A category', exploration_id))
        with self.assertRaisesRegexp(ValueError, 'Invalid state id'):
            exp_services.get_state_by_id(exploration_id, 'invalid_state_id')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.assertEqual(len(exploration.state_ids), 1)

        default_state = exp_services.get_state_by_id(
            exploration.id, exploration.state_ids[0])
        default_state_name = default_state.name
        exp_services.rename_state(
            exploration_id, default_state.id, 'Renamed state')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.assertEqual(len(exploration.state_ids), 1)
        self.assertEqual(exploration.states[0].name, 'Renamed state')

        # Add a new state.
        exp_services.add_state(exploration_id, 'State 2')
        second_state = exp_services.get_state_by_name(
            exploration_id, 'State 2')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.assertEqual(len(exploration.state_ids), 2)

        # It is OK to rename a state to itself.
        exp_services.rename_state(
            exploration_id, second_state.id, second_state.name)
        renamed_second_state = exp_services.get_state_by_id(
            exploration_id, second_state.id)
        self.assertEqual(renamed_second_state.name, 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exp_services.add_state(exploration_id, 'State 2')
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exp_services.rename_state(
                exploration_id, second_state.id, 'Renamed state')

        # And it is not OK to rename a state to the END_DEST.
        with self.assertRaisesRegexp(ValueError, 'Invalid state name'):
            exp_services.rename_state(
                exploration_id, second_state.id, feconf.END_DEST)

        # The exploration now has exactly two states.
        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.assertFalse(exploration.has_state_named(default_state_name))
        self.assertTrue(exploration.has_state_named('Renamed state'))
        self.assertTrue(exploration.has_state_named('State 2'))

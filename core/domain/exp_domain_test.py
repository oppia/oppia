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

"""Tests for exploration domain objects and methods defined on them."""

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import param_domain
from core.tests import test_utils
import feconf
import utils


class ExplorationDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration domain object."""

    def test_validation(self):
        """Test validation of explorations."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', '', '')
        exploration.init_state_name = ''
        exploration.states = {}

        with self.assertRaisesRegexp(
                utils.ValidationError, 'between 1 and 50 characters'):
            exploration.validate()

        exploration.title = 'Hello #'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character #'):
            exploration.validate()

        exploration.title = 'Title'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'between 1 and 50 characters'):
            exploration.validate()

        exploration.category = 'Category'

        # Note: If '/' ever becomes a valid state name, ensure that the rule
        # editor frontend tenplate is fixed -- it currently uses '/' as a
        # sentinel for an invalid state name.
        bad_state = exp_domain.State.create_default_state('/')
        exploration.states = {'/': bad_state}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character / in a state name'):
            exploration.validate()

        new_state = exp_domain.State.create_default_state('ABC')
        new_state.update_interaction_id('TextInput')

        # The 'states' property must be a non-empty dict of states.
        exploration.states = {}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no states'):
            exploration.validate()
        exploration.states = {'A string #': new_state}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character # in a state name'):
            exploration.validate()
        exploration.states = {'A string _': new_state}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character _ in a state name'):
            exploration.validate()

        exploration.states = {'ABC': new_state}

        with self.assertRaisesRegexp(
                utils.ValidationError, 'has no initial state name'):
            exploration.validate()

        exploration.init_state_name = 'initname'

        with self.assertRaisesRegexp(
                utils.ValidationError,
                r'There is no state in \[\'ABC\'\] corresponding to '
                'the exploration\'s initial state name initname.'):
            exploration.validate()

        exploration.states = {exploration.init_state_name: new_state}

        with self.assertRaisesRegexp(
                utils.ValidationError, 'destination ABC is not a valid'):
            exploration.validate()

        exploration.states = {
            exploration.init_state_name: exp_domain.State.create_default_state(
                exploration.init_state_name)
        }
        exploration.states[exploration.init_state_name].update_interaction_id(
            'TextInput')

        exploration.validate()

        exploration.language_code = 'fake_code'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid language_code'):
            exploration.validate()
        exploration.language_code = 'English'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid language_code'):
            exploration.validate()
        exploration.language_code = 'en'
        exploration.validate()

        exploration.param_specs = 'A string'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'param_specs to be a dict'):
            exploration.validate()

        exploration.param_specs = {
            '@': param_domain.ParamSpec.from_dict({'obj_type': 'Int'})
        }
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Only parameter names with characters'):
            exploration.validate()

        exploration.param_specs = {
            'notAParamSpec': param_domain.ParamSpec.from_dict(
                {'obj_type': 'Int'})
        }
        exploration.validate()

    def test_objective_validation(self):
        """Test that objectives are validated only in 'strict' mode."""
        self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='Title', category='Category',
            objective='')
        exploration = exp_services.get_exploration_by_id('exp_id')
        exploration.validate()

        with self.assertRaisesRegexp(
                utils.ValidationError, 'objective must be specified'):
            exploration.validate(strict=True)

        exploration.objective = 'An objective'
        # Link the start state to the END state in order to make the
        # exploration valid.
        exploration.states[exploration.init_state_name].interaction.handlers[
            0].rule_specs[0].dest = feconf.END_DEST

        exploration.validate(strict=True)

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = exp_domain.Exploration.create_default_exploration(
            '0', 'title', 'category')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = exp_domain.Exploration.create_default_exploration(
            'a', 'title', 'category')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = exp_domain.Exploration.create_default_exploration(
            'abcd', 'title', 'category')
        self.assertEqual(notdemo2.is_demo, False)


class StateExportUnitTests(test_utils.GenericTestBase):
    """Test export of states."""

    def test_export_state_to_dict(self):
        """Test exporting a state to a dict."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'A different exploration_id', 'A title', 'A category')
        exploration.add_states(['New state'])

        state_dict = exploration.states['New state'].to_dict()
        expected_dict = {
            'content': [{
                'type': 'text',
                'value': u''
            }],
            'interaction': {
                'customization_args': {},
                'handlers': [{
                    'name': u'submit',
                    'rule_specs': [{
                        'definition': {
                            u'rule_type': u'default'
                        },
                        'dest': 'New state',
                        'feedback': [],
                        'param_changes': [],

                    }]
                }],
                'id': None,
            },
            'param_changes': [],
        }
        self.assertEqual(expected_dict, state_dict)


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    SAMPLE_YAML_CONTENT = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 4
skill_tags: []
states:
  %s:
    content:
    - type: text
      value: ''
    interaction:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: %s
          feedback: []
          param_changes: []
      id: null
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args: {}
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: New state
          feedback: []
          param_changes: []
      id: null
    param_changes: []
""") % (
    feconf.DEFAULT_INIT_STATE_NAME, feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME)

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        EXP_ID = 'An exploration_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'A title', 'A category')
        exploration.add_states(['New state'])
        self.assertEqual(len(exploration.states), 2)

        yaml_content = exploration.to_yaml()
        self.assertEqual(yaml_content, self.SAMPLE_YAML_CONTENT)

        exploration2 = exp_domain.Exploration.from_yaml(
            'exp2', 'Title', 'Category', yaml_content)
        self.assertEqual(len(exploration2.states), 2)
        yaml_content_2 = exploration2.to_yaml()
        self.assertEqual(yaml_content_2, yaml_content)

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml(
                'exp3', 'Title', 'Category', 'No_initial_state_name')

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml(
                'exp4', 'Title', 'Category',
                'Invalid\ninit_state_name:\nMore stuff')

        with self.assertRaises(Exception):
            exp_domain.Exploration.from_yaml(
                'exp4', 'Title', 'Category', 'State1:\n(\nInvalid yaml')


class SchemaMigrationUnitTests(test_utils.GenericTestBase):
    """Test migration methods for yaml content."""

    YAML_CONTENT_V1 = (
"""default_skin: conversation_v1
param_changes: []
param_specs: {}
schema_version: 1
states:
- content:
  - type: text
    value: ''
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
    widget_id: TextInput
- content:
  - type: text
    value: ''
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
    widget_id: TextInput
""")

    YAML_CONTENT_V2 = (
"""default_skin: conversation_v1
init_state_name: (untitled state)
param_changes: []
param_specs: {}
schema_version: 2
states:
  (untitled state):
    content:
    - type: text
      value: ''
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
      widget_id: TextInput
  New state:
    content:
    - type: text
      value: ''
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
      widget_id: TextInput
""")

    YAML_CONTENT_V3 = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 3
skill_tags: []
states:
  (untitled state):
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
  New state:
    content:
    - type: text
      value: ''
    param_changes: []
    widget:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: New state
          feedback: []
          param_changes: []
      sticky: false
      widget_id: TextInput
""")

    YAML_CONTENT_V4 = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 4
skill_tags: []
states:
  (untitled state):
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: (untitled state)
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
  New state:
    content:
    - type: text
      value: ''
    interaction:
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: New state
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V4

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V1)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v2(self):
        """Test direct loading from a v2 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V2)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v3(self):
        """Test direct loading from a v3 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V3)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v4(self):
        """Test direct loading from a v4 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V4)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)


class ConversionUnitTests(test_utils.GenericTestBase):
    """Test conversion methods."""

    def test_convert_exploration_to_player_dict(self):
        EXP_TITLE = 'A title'
        SECOND_STATE_NAME = 'first state'

        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', EXP_TITLE, 'A category')
        exploration.add_states([SECOND_STATE_NAME])

        def _get_default_state_dict(content_str, dest_name):
            return {
                'content': [{
                    'type': 'text',
                    'value': content_str,
                }],
                'interaction': {
                    'customization_args': {},
                    'handlers': [{
                        'name': 'submit',
                        'rule_specs': [{
                            'definition': {
                                'rule_type': 'default',
                            },
                            'dest': dest_name,
                            'feedback': [],
                            'param_changes': [],
                        }],
                    }],
                    'id': None,
                },
                'param_changes': [],
            }

        self.assertEqual(exploration.to_player_dict(), {
            'init_state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'title': EXP_TITLE,
            'states': {
                feconf.DEFAULT_INIT_STATE_NAME: _get_default_state_dict(
                    feconf.DEFAULT_INIT_STATE_CONTENT_STR,
                    feconf.DEFAULT_INIT_STATE_NAME),
                SECOND_STATE_NAME: _get_default_state_dict(
                    '', SECOND_STATE_NAME),
            },
            'param_changes': [],
            'param_specs': {},
        })


class StateOperationsUnitTests(test_utils.GenericTestBase):
    """Test methods operating on states."""

    def test_delete_state(self):
        """Test deletion of states."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', 'A title', 'A category')
        exploration.add_states(['first state'])

        with self.assertRaisesRegexp(
                ValueError, 'Cannot delete initial state'):
            exploration.delete_state(exploration.init_state_name)

        exploration.add_states(['second state'])
        exploration.delete_state('second state')

        with self.assertRaisesRegexp(ValueError, 'fake state does not exist'):
            exploration.delete_state('fake state')

    def test_state_operations(self):
        """Test adding, updating and checking existence of states."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', 'A title', 'A category')
        with self.assertRaises(KeyError):
            exploration.states['invalid_state_name']

        self.assertEqual(len(exploration.states), 1)

        default_state_name = exploration.init_state_name
        exploration.rename_state(default_state_name, 'Renamed state')
        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(exploration.init_state_name, 'Renamed state')

        # Add a new state.
        exploration.add_states(['State 2'])
        self.assertEqual(len(exploration.states), 2)

        # It is OK to rename a state to the same name.
        exploration.rename_state('State 2', 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.add_states(['State 2'])
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.rename_state('State 2', 'Renamed state')

        # And it is not OK to rename a state to the END_DEST.
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid state name'):
            exploration.rename_state('State 2', feconf.END_DEST)

        # The exploration now has exactly two states.
        self.assertNotIn(default_state_name, exploration.states)
        self.assertIn('Renamed state', exploration.states)
        self.assertIn('State 2', exploration.states)

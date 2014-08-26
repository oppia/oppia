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

        new_state = exp_domain.State.create_default_state('ABC')

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
                r'There is no state corresponding to .* initial state name.'):
            exploration.validate()

        exploration.states = {exploration.init_state_name: new_state}

        with self.assertRaisesRegexp(
                utils.ValidationError, 'destination ABC is not a valid'):
            exploration.validate()

        exploration.states = {
            exploration.init_state_name: exp_domain.State.create_default_state(
                exploration.init_state_name)
        }

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
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', 'Title', 'Category')
        exploration.validate()

        with self.assertRaisesRegexp(
                utils.ValidationError, 'objective must be specified'):
            exploration.validate(strict=True)

        exploration.objective = 'An objective'
        # Link the start state to the END state in order to make the
        # exploration valid.
        exploration.states[exploration.init_state_name].widget.handlers[
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
            'param_changes': [],
            'widget': {
                'widget_id': u'TextInput',
                'customization_args': {},
                'sticky': False,
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
                }]
            },
        }
        self.assertEqual(expected_dict, state_dict)


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    SAMPLE_YAML_CONTENT = (
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

    def test_load_from_v1(self):
        """Test direct loading from a v1 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V1)
        self.assertEqual(exploration.to_yaml(), self.YAML_CONTENT_V3)

    def test_load_from_v2(self):
        """Test direct loading from a v2 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V2)
        self.assertEqual(exploration.to_yaml(), self.YAML_CONTENT_V3)

    def test_load_from_v3(self):
        """Test direct loading from a v3 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V3)
        self.assertEqual(exploration.to_yaml(), self.YAML_CONTENT_V3)


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


class ExplorationParametersUnitTests(test_utils.GenericTestBase):
    """Test methods relating to exploration parameters."""

    def test_get_init_params(self):
        """Test the get_init_params() method."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', 'A title', 'A category')

        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exploration.param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        exploration.param_changes = [independent_pc, dependent_pc]

        new_params = exploration.get_init_params()
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})

        exploration.param_changes = [dependent_pc, independent_pc]

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        new_params = exploration.get_init_params()
        self.assertEqual(new_params, {'a': 'firstValue', 'b': ''})

    def test_update_with_state_params(self):
        """Test the update_with_state_params() method."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', 'A title', 'A category')

        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exploration.param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        exploration.init_state.param_changes = [independent_pc, dependent_pc]

        reader_params = {}
        new_params = exploration.update_with_state_params(
            exploration.init_state_name, reader_params)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})
        self.assertEqual(reader_params, {})

        exploration.init_state.param_changes = [dependent_pc]

        reader_params = {'a': 'secondValue'}
        new_params = exploration.update_with_state_params(
            exploration.init_state_name, reader_params)
        self.assertEqual(new_params, {'a': 'secondValue', 'b': 'secondValue'})
        self.assertEqual(reader_params, {'a': 'secondValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        reader_params = {}
        new_params = exploration.update_with_state_params(
            exploration.init_state_name, reader_params)
        self.assertEqual(new_params, {'b': ''})
        self.assertEqual(reader_params, {})

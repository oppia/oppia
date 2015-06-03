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

import os

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import param_domain
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
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
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
      triggers: []
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
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""") % (
    feconf.DEFAULT_INIT_STATE_NAME, feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME)

SAMPLE_YAML_CONTENT_WITH_GADGETS = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents:
    bottom: []
    left:
      - customization_args:
          characters:
            value: 2
          floors:
            value: 1
          title:
            value: The Test Gadget!
        gadget_id: TestGadget
        visible_in_states:
          - New state
          - Second state
    right: []
states:
  %s:
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
          dest: %s
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
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
      triggers: []
    param_changes: []
  Second state:
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
          dest: Second state
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""") % (
    feconf.DEFAULT_INIT_STATE_NAME, feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME)

TEST_GADGETS = {
    'TestGadget': {
        'dir': os.path.join(feconf.GADGETS_DIR, 'TestGadget')
    }
}


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

        init_state = exploration.states[exploration.init_state_name]
        init_state.interaction.triggers = ['element']
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected empty triggers list.'):
            exploration.validate()
        init_state.interaction.triggers = []
        exploration.validate()

    def test_tag_validation(self):
        """Test validation of exploration tags."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', 'Title', 'Category')
        exploration.objective = 'Objective'
        exploration.states[exploration.init_state_name].update_interaction_id(
            'EndExploration')
        exploration.validate()

        exploration.tags = 'this should be a list'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected \'tags\' to be a list'):
            exploration.validate()

        exploration.tags = [123]
        with self.assertRaisesRegexp(
                utils.ValidationError, 'to be a string'):
            exploration.validate()

        exploration.tags = ['abc', 123]
        with self.assertRaisesRegexp(
                utils.ValidationError, 'to be a string'):
            exploration.validate()

        exploration.tags = ['']
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Tags should be non-empty'):
            exploration.validate()

        exploration.tags = ['123']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'should only contain lowercase letters and spaces'):
            exploration.validate()

        exploration.tags = ['ABC']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'should only contain lowercase letters and spaces'):
            exploration.validate()

        exploration.tags = [' a b']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Tags should not start or end with whitespace'):
            exploration.validate()

        exploration.tags = ['a b ']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Tags should not start or end with whitespace'):
            exploration.validate()

        exploration.tags = ['a    b']
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Adjacent whitespace in tags should be collapsed'):
            exploration.validate()

        exploration.tags = ['abc', 'abc']
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Some tags duplicate each other'):
            exploration.validate()

        exploration.tags = ['computer science', 'analysis', 'a b c']
        exploration.validate()

    def test_exploration_skin_and_gadget_validation(self):
        """Test that Explorations including gadgets validate properly."""
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)

        invalid_gadget_instance = exp_domain.GadgetInstance('bad_ID', [], {})
        with self.assertRaisesRegexp(
                 utils.ValidationError,
                 'Unknown gadget with ID bad_ID is not in the registry.'):
            invalid_gadget_instance.validate()

        with self.swap(feconf, 'ALLOWED_GADGETS', TEST_GADGETS):
            gadget_instance = exploration.skin_instance.panel_contents_dict[
            'left'][0]

            # Force a GadgetInstance to require certain state names.
            gadget_instance.visible_in_states.extend(['DEF', 'GHI'])

            with self.assertRaisesRegexp(
                    utils.ValidationError,
                    'Exploration missing required states: DEF, GHI'):
                exploration.validate()

            def_state = exp_domain.State.create_default_state('DEF')
            def_state.update_interaction_id('TextInput')
            exploration.states['DEF'] = def_state
            with self.assertRaisesRegexp(
                    utils.ValidationError,
                    'Exploration missing required state: GHI'):
                exploration.validate()

            ghi_state = exp_domain.State.create_default_state('GHI')
            ghi_state.update_interaction_id('TextInput')
            exploration.states['GHI'] = ghi_state
            exploration.validate()

            gadget_instance.visible_in_states.extend(['GHI'])
            with self.assertRaisesRegexp(
                    utils.ValidationError,
                    'TestGadget specifies visibility repeatedly for state: GHI'):
                exploration.validate()

            # Remove duplicate state.
            gadget_instance.visible_in_states.pop()

            # Adding a panel that doesn't exist in the skin.
            exploration.skin_instance.panel_contents_dict[
                'non_existent_panel'] = []

            with self.assertRaisesRegexp(
                    utils.ValidationError,
                    'non_existent_panel panel not found in skin conversation_v1'):
                exploration.validate()

    def test_exploration_get_gadget_ids(self):
        """Test that Exploration.get_gadget_ids returns apt results."""
        exploration_without_gadgets = exp_domain.Exploration.from_yaml(
            'An Exploration ID', 'A title', 'Category', SAMPLE_YAML_CONTENT)
        self.assertEqual(exploration_without_gadgets.get_gadget_ids(), [])

        exploration_with_gadgets = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        self.assertEqual(
            exploration_with_gadgets.get_gadget_ids(), 
            ['TestGadget']
        )

        another_gadget = exp_domain.GadgetInstance('AnotherGadget', [], {})
        exploration_with_gadgets.skin_instance.panel_contents_dict[
            'right'].append(another_gadget)
        self.assertEqual(
            exploration_with_gadgets.get_gadget_ids(), 
            ['AnotherGadget', 'TestGadget']
        )

    def test_objective_validation(self):
        """Test that objectives are validated only in 'strict' mode."""
        self.save_new_valid_exploration(
            'exp_id', 'user@example.com', title='Title', category='Category',
            objective='', end_state_name='End')
        exploration = exp_services.get_exploration_by_id('exp_id')
        exploration.validate()

        with self.assertRaisesRegexp(
                utils.ValidationError, 'objective must be specified'):
            exploration.validate(strict=True)

        exploration.objective = 'An objective'

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

    def test_exploration_export_import(self):
        """Test that to_dict and from_dict preserve all data within an
        exploration.
        """
        demo = exp_domain.Exploration.create_default_exploration(
            '0', 'title', 'category')
        demo_dict = demo.to_dict()
        exp_from_dict = exp_domain.Exploration.create_exploration_from_dict(
            demo_dict)
        self.assertEqual(exp_from_dict.to_dict(), demo_dict)

    def test_interaction_with_none_id_is_not_terminal(self):
        """Test that an interaction with an id of None leads to is_terminal
        being false.
        """
        # Default exploration has a default interaction with an ID of None.
        demo = exp_domain.Exploration.create_default_exploration(
            '0', 'title', 'category')
        init_state = demo.states[feconf.DEFAULT_INIT_STATE_NAME]
        self.assertFalse(init_state.interaction.is_terminal)


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
                'triggers': [],
            },
            'param_changes': [],
        }
        self.assertEqual(expected_dict, state_dict)


class YamlCreationUnitTests(test_utils.GenericTestBase):
    """Test creation of explorations from YAML files."""

    def test_yaml_import_and_export(self):
        """Test the from_yaml() and to_yaml() methods."""
        EXP_ID = 'An exploration_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'A title', 'A category')
        exploration.add_states(['New state'])
        self.assertEqual(len(exploration.states), 2)

        yaml_content = exploration.to_yaml()
        self.assertEqual(yaml_content, SAMPLE_YAML_CONTENT)

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

    def test_yaml_import_and_export_without_gadgets(self):
        """Test from_yaml() and to_yaml() methods without gadgets."""

        EXP_ID = 'An exploration_id'
        exploration_without_gadgets = exp_domain.Exploration.from_yaml(
            EXP_ID, 'A title', 'Category', SAMPLE_YAML_CONTENT)
        yaml_content = exploration_without_gadgets.to_yaml()
        self.assertEqual(yaml_content, SAMPLE_YAML_CONTENT)


    def test_yaml_import_and_export_with_gadgets(self):
        """Test from_yaml() and to_yaml() methods including gadgets."""

        EXP_ID = 'An exploration_id'
        exploration_with_gadgets = exp_domain.Exploration.from_yaml(
            EXP_ID, 'A title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        generated_yaml = exploration_with_gadgets.to_yaml()

        generated_yaml_as_dict = utils.dict_from_yaml(generated_yaml)
        sample_yaml_as_dict = utils.dict_from_yaml(
            SAMPLE_YAML_CONTENT_WITH_GADGETS)
        self.assertEqual(generated_yaml_as_dict, sample_yaml_as_dict)

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
        dest: END
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
          dest: END
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
          dest: END
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
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
""")

    YAML_CONTENT_V5 = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 5
skin_customizations:
  panels_contents: {}
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
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
    param_changes: []
tags: []
""")

    YAML_CONTENT_V6 = (
"""author_notes: ''
blurb: ''
default_skin: conversation_v1
init_state_name: (untitled state)
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 6
skin_customizations:
  panels_contents: {}
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
      triggers: []
    param_changes: []
  END:
    content:
    - type: text
      value: Congratulations, you have finished!
    interaction:
      customization_args:
        recommendedExplorationIds:
          value: []
      handlers:
      - name: submit
        rule_specs:
        - definition:
            rule_type: default
          dest: END
          feedback: []
          param_changes: []
      id: EndExploration
      triggers: []
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
          dest: END
          feedback: []
          param_changes: []
      id: TextInput
      triggers: []
    param_changes: []
states_schema_version: 3
tags: []
""")

    _LATEST_YAML_CONTENT = YAML_CONTENT_V6

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

    def test_load_from_v5(self):
        """Test direct loading from a v5 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V5)
        self.assertEqual(exploration.to_yaml(), self._LATEST_YAML_CONTENT)

    def test_load_from_v6(self):
        """Test direct loading from a v6 yaml file."""
        exploration = exp_domain.Exploration.from_yaml(
            'eid', 'A title', 'A category', self.YAML_CONTENT_V6)
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
                    'triggers': [],
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
            'skin_customizations': feconf.DEFAULT_SKIN_CUSTOMIZATIONS,
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

        # And it is OK to rename a state to 'END' (old terminal pseudostate). It
        # is tested throughout this test because a lot of old behavior used to
        # be specific to states named 'END'. These tests validate that is no
        # longer the situation.
        exploration.rename_state('State 2', 'END')

        # Should successfully be able to name it back.
        exploration.rename_state('END', 'State 2')

        # The exploration now has exactly two states.
        self.assertNotIn(default_state_name, exploration.states)
        self.assertIn('Renamed state', exploration.states)
        self.assertIn('State 2', exploration.states)

        # Can successfully add 'END' state
        exploration.add_states(['END'])

        # Should fail to rename like any other state
        with self.assertRaisesRegexp(ValueError, 'Duplicate state name'):
            exploration.rename_state('State 2', 'END')

        # Ensure the other states are connected to END
        exploration.states['Renamed state'].interaction.handlers[
            0].rule_specs[0].dest = 'State 2'
        exploration.states['State 2'].interaction.handlers[
            0].rule_specs[0].dest = 'END'

        # Ensure the other states have interactions
        exploration.states['Renamed state'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')

        # Other miscellaneous requirements for validation
        exploration.objective = 'Objective'

        # The exploration should NOT be terminable even though it has a state
        # called 'END' and everything else is connected to it.
        with self.assertRaises(Exception):
            exploration.validate(strict=True)

        # Renaming the node to something other than 'END' and giving it an
        # EndExploration is enough to validate it
        exploration.rename_state('END', 'AnotherEnd')
        exploration.states['AnotherEnd'].update_interaction_id('EndExploration')
        exploration.validate(strict=True)

        # Name it back for final tests
        exploration.rename_state('AnotherEnd', 'END')

        # Should be able to successfully delete it
        exploration.delete_state('END')
        self.assertNotIn('END', exploration.states)


class SkinInstanceUnitTests(test_utils.GenericTestBase):
    """Test methods for SkinInstance."""

    _SAMPLE_SKIN_INSTANCE_DICT = {
        'skin_id': 'conversation_v1',
        'skin_customizations': {
            'panels_contents': {
                'bottom': [],
                'left': [
                    {
                        'customization_args': {
                            'characters': {'value': 2},
                            'floors': {'value': 1},
                            'title': {'value': 'The Test Gadget!'}},
                        'gadget_id': 'TestGadget',
                        'visible_in_states': ['New state', 'Second state']
                    }
                ],
                'right': []
            }
        }
    }

    def test_get_state_names_required_by_gadgets(self):
        """Test accurate computation of state_names_required_by_gadgets."""
        skin_instance = exp_domain.SkinInstance(
            'conversation_v1',
            self._SAMPLE_SKIN_INSTANCE_DICT['skin_customizations'])
        self.assertEqual(
            skin_instance.get_state_names_required_by_gadgets(),
            ['New state', 'Second state'])

    def test_conversion_of_skin_to_and_from_dict(self):
        """Tests conversion of SkinInstance to and from dict representations."""
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        skin_instance = exploration.skin_instance

        skin_instance_as_dict = skin_instance.to_dict()

        self.assertEqual(
            skin_instance_as_dict,
            self._SAMPLE_SKIN_INSTANCE_DICT)

        skin_instance_as_instance = exp_domain.SkinInstance.from_dict(
            skin_instance_as_dict)

        self.assertEqual(skin_instance_as_instance.skin_id, 'conversation_v1')
        self.assertEqual(
            sorted(skin_instance_as_instance.panel_contents_dict.keys()),
            ['bottom', 'left', 'right'])


class GadgetInstanceUnitTests(test_utils.GenericTestBase):
    """Tests methods instantiating and validating GadgetInstances."""

    def test_gadget_instantiation(self):
        """Test instantiation of GadgetInstances."""
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)

        # Assert left and bottom panels have 1 GadgetInstance. Right has 0.
        self.assertEqual(len(exploration.skin_instance.panel_contents_dict[
            'left']), 1)
        self.assertEqual(len(exploration.skin_instance.panel_contents_dict[
            'bottom']), 0)
        self.assertEqual(len(exploration.skin_instance.panel_contents_dict[
            'right']), 0)

    def test_gadget_instance_properties(self):
        """Test accurate representation of gadget properties."""
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        panel_contents_dict = exploration.skin_instance.panel_contents_dict

        with self.swap(feconf, 'ALLOWED_GADGETS', TEST_GADGETS):
            test_gadget_instance = panel_contents_dict['left'][0]

        self.assertEqual(test_gadget_instance.height, 50)
        self.assertEqual(test_gadget_instance.width, 60)
        self.assertEqual(
            test_gadget_instance.customization_args['title']['value'],
            'The Test Gadget!')
        self.assertIn('New state', test_gadget_instance.visible_in_states)

    def test_gadget_instance_validation(self):
        """Test validation of GadgetInstance."""
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        panel_contents_dict = exploration.skin_instance.panel_contents_dict

        with self.swap(feconf, 'ALLOWED_GADGETS', TEST_GADGETS):
            test_gadget_instance = panel_contents_dict['left'][0]

        # Validation against sample YAML should pass without error.
        exploration.validate()

        # Assert size exceeded error triggers when a gadget's size exceeds
        # a panel's capacity.
        with self.swap(
            test_gadget_instance.gadget,
            '_PIXEL_WIDTH_PER_CHARACTER',
            2300):

            with self.assertRaisesRegexp(
                    utils.ValidationError,
                    'Size exceeded: left panel width of 4600 exceeds limit of 100'):
                exploration.validate()

        # Assert internal validation against CustomizationArgSpecs.
        test_gadget_instance.customization_args['floors']['value'] = 5
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'TestGadgets are limited to 3 floors, found 5.'):
            test_gadget_instance.validate()
        test_gadget_instance.customization_args['floors']['value'] = 1

        # Assert that too many gadgets in a panel raise a ValidationError.
        panel_contents_dict['left'].append(test_gadget_instance)
        with self.assertRaisesRegexp(
                utils.ValidationError,
                "'left' panel expected at most 1 gadget, but 2 gadgets are visible in state 'New state'."):
            exploration.validate()

        # Assert that an error is raised when a gadget is not visible in any
        # states.
        test_gadget_instance.visible_in_states = []
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'TestGadget gadget not visible in any states.'):
            test_gadget_instance.validate()

    def test_conversion_of_gadget_instance_to_and_from_dict(self):
        """Test conversion of GadgetInstance to and from dict. """
        exploration = exp_domain.Exploration.from_yaml(
            'exp1', 'Title', 'Category', SAMPLE_YAML_CONTENT_WITH_GADGETS)
        panel_contents_dict = exploration.skin_instance.panel_contents_dict
        test_gadget_instance = panel_contents_dict['left'][0]

        test_gadget_as_dict = test_gadget_instance.to_dict()

        self.assertEqual(
            test_gadget_as_dict,
            {
                'gadget_id': 'TestGadget',
                'visible_in_states': ['New state', 'Second state'],
                'customization_args': {
                    'title': {
                        'value': 'The Test Gadget!'
                    },
                    'characters': {
                        'value': 2
                    },
                    'floors': {
                        'value': 1
                    }
                }
            }
        )

        test_gadget_as_instance = exp_domain.GadgetInstance.from_dict(
            test_gadget_as_dict)

        self.assertEqual(test_gadget_as_instance.width, 60)
        self.assertEqual(test_gadget_as_instance.height, 50)
        self.assertEqual(
            test_gadget_as_instance.customization_args['title']['value'],
            'The Test Gadget!'
        )

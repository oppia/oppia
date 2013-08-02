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
from oppia.domain import exp_domain
from oppia.domain import exp_services
import test_utils


class ExplorationServicesUnitTests(test_utils.AppEngineTestBase):
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

        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id]
        )

        exploration2 = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'New title', 'A category', 'New exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id, exploration2.id]
        )

    def test_get_public_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertEqual(exp_services.get_public_explorations(), [])

        exploration.is_public = True
        exploration.put()
        self.assertEqual(
            [e.id for e in exp_services.get_public_explorations()],
            [exploration.id]
        )

    def test_get_viewable_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        def get_viewable_ids(user_id):
            return [
                e.id for e in exp_services.get_viewable_explorations(user_id)
            ]

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_viewable_ids(self.viewer_id), [])
        self.assertEqual(get_viewable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(
            get_viewable_ids(self.viewer_id), [exploration.id])
        self.assertEqual(get_viewable_ids(None), [exploration.id])

    def test_get_editable_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        def get_editable_ids(user_id):
            return [
                e.id for e in exp_services.get_editable_explorations(user_id)
            ]

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

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
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category',
            'A different exploration_id'))
        exploration.add_state('New state')
        yaml_content = exp_services.export_to_yaml(exploration.id)

        exploration2 = exp_domain.Exploration.get(exp_services.create_from_yaml(
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
            exp_domain.Exploration.get('fake_eid')

        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        retrieved_exploration = exp_domain.Exploration.get('A exploration_id')
        self.assertEqual(exploration.id, retrieved_exploration.id)
        self.assertEqual(exploration.title, retrieved_exploration.title)

        exploration.delete()
        with self.assertRaises(Exception):
            exp_domain.Exploration.get('A exploration_id')

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
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category',
            'A different exploration_id'))
        exploration.add_state('New state')
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
    params: {}
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
    params: {}
    sticky: false
    widget_id: Continue
""")

    def test_export_state_to_dict(self):
        """Test the export_state_to_dict() method."""
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category',
            'A different exploration_id'))
        new_state = exploration.add_state('New state')
        state_dict = exp_services.export_state_to_dict(
            exploration.id, new_state.id)

        expected_dict = {
            'id': new_state.id,
            'name': u'New state',
            'content': [],
            'param_changes': [],
            'widget': {
                'widget_id': u'Continue',
                'params': {},
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

    def test_convert_state_name_to_id(self):
        """Test converting state names to ids."""
        eid = 'exp_id'
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            'user_id', 'A title', 'A category', eid))

        sid = 'state_id'
        state_name = 'State 1'
        exploration.add_state(state_name, state_id=sid)

        self.assertEqual(
            exp_services.convert_state_name_to_id(eid, state_name), sid)

        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.convert_state_name_to_id(eid, 'fake_name')

        self.assertEqual(
            exp_services.convert_state_name_to_id(eid, feconf.END_DEST),
            feconf.END_DEST)

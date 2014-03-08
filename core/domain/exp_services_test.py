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

__author__ = 'Sean Lip'

import datetime
import os
import StringIO
import zipfile

from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import param_domain
from core.domain import rights_manager
from core.domain import rule_domain
from core.domain import user_services
from core.platform import models
(base_models, exp_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration
])
import feconf
import test_utils
import utils


class ExplorationServicesUnitTests(test_utils.GenericTestBase):
    """Test the exploration services module."""

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ExplorationServicesUnitTests, self).setUp()

        self.EXP_ID = 'An exploration_id'

        self.OWNER_EMAIL = 'owner@example.com'
        self.EDITOR_EMAIL = 'editor@example.com'
        self.VIEWER_EMAIL = 'viewer@example.com'

        self.OWNER_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.VIEWER_ID = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.OWNER_NAME = 'owner'
        self.EDITOR_NAME = 'editor'
        self.VIEWER_NAME = 'viewer'

        user_services.get_or_create_user(self.OWNER_ID, self.OWNER_EMAIL)
        user_services.get_or_create_user(self.EDITOR_ID, self.EDITOR_EMAIL)
        user_services.get_or_create_user(self.VIEWER_ID, self.VIEWER_EMAIL)

        self.register_editor(self.OWNER_EMAIL, username=self.OWNER_NAME)
        self.register_editor(self.EDITOR_EMAIL, username=self.EDITOR_NAME)
        self.register_editor(self.VIEWER_EMAIL, username=self.VIEWER_NAME)

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'admin_emails', ['admin@example.com'])
        self.user_id_admin = self.get_user_id_from_email('admin@example.com')

    def save_new_default_exploration(self, exploration_id):
        """Saves a new default exploration written by self.OWNER_ID.

        Returns the exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, 'A title', 'A category')
        exp_services.save_new_exploration(self.OWNER_ID, exploration)
        return exploration

    def save_new_valid_exploration(self, exploration_id, owner_id):
        """Saves a new strictly-validated exploration.

        Returns the exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, 'A title', 'A category')
        exploration.states[exploration.init_state_name].widget.handlers[
            0].rule_specs[0].dest = feconf.END_DEST
        exp_services.save_new_exploration(owner_id, exploration)
        return exploration


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_non_private_explorations_summary_dict(self):
        self.save_new_default_exploration(self.EXP_ID)
        self.assertEqual(
            exp_services.get_non_private_explorations_summary_dict(), {})

        rights_manager.publish_exploration(self.OWNER_ID, self.EXP_ID)
        self.assertEqual(
            exp_services.get_non_private_explorations_summary_dict(), {
                self.EXP_ID: {
                    'title': 'A title',
                    'category': 'A category',
                    'rights': {
                        'owner_names': [self.OWNER_NAME],
                        'editor_names': [],
                        'viewer_names': [],
                        'community_owned': False,
                        'cloned_from': None,
                        'status': rights_manager.EXPLORATION_STATUS_PUBLIC
                    }
                }
            }
        )

        rights_manager.publicize_exploration(self.user_id_admin, self.EXP_ID)
        self.assertEqual(
            exp_services.get_non_private_explorations_summary_dict(), {
                self.EXP_ID: {
                    'title': 'A title',
                    'category': 'A category',
                    'rights': {
                        'owner_names': [self.OWNER_NAME],
                        'editor_names': [],
                        'viewer_names': [],
                        'community_owned': False,
                        'cloned_from': None,
                        'status': rights_manager.EXPLORATION_STATUS_PUBLICIZED
                    }
                }
            }
        )

    def test_get_explicit_viewer_explorations_summary_dict(self):
        self.save_new_default_exploration(self.EXP_ID)
        rights_manager.assign_role(
            self.OWNER_ID, self.EXP_ID, self.VIEWER_ID,
            rights_manager.ROLE_VIEWER)

        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.VIEWER_ID),
            {
                self.EXP_ID: {
                    'title': 'A title',
                    'category': 'A category',
                    'rights': {
                        'owner_names': [self.OWNER_NAME],
                        'editor_names': [],
                        'viewer_names': [self.VIEWER_NAME],
                        'community_owned': False,
                        'cloned_from': None,
                        'status': rights_manager.EXPLORATION_STATUS_PRIVATE
                    }
                }
            }
        )
        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.EDITOR_ID), {})
        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.OWNER_ID), {})

        # Set the exploration's status to published. This removes all viewer
        # ids.
        rights_manager.publish_exploration(self.OWNER_ID, self.EXP_ID)

        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.VIEWER_ID), {})
        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.EDITOR_ID), {})
        self.assertEqual(
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.OWNER_ID), {})

    def test_get_editable_explorations_summary_dict(self):
        self.save_new_default_exploration(self.EXP_ID)
        rights_manager.assign_role(
            self.OWNER_ID, self.EXP_ID, self.EDITOR_ID,
            rights_manager.ROLE_EDITOR)

        exp_dict = {
            'title': 'A title',
            'category': 'A category',
            'rights': {
                'owner_names': [self.OWNER_NAME],
                'editor_names': [self.EDITOR_NAME],
                'viewer_names': [],
                'community_owned': False,
                'cloned_from': None,
                'status': rights_manager.EXPLORATION_STATUS_PRIVATE
            }
        }

        self.assertEqual(
            exp_services.get_editable_explorations_summary_dict(self.OWNER_ID),
            {self.EXP_ID: exp_dict})
        self.assertEqual(
            exp_services.get_editable_explorations_summary_dict(
                self.EDITOR_ID),
            {self.EXP_ID: exp_dict})
        self.assertEqual(
            exp_services.get_editable_explorations_summary_dict(
                self.VIEWER_ID), {})

    def test_count_explorations(self):
        """Test count_explorations()."""

        self.assertEqual(exp_services.count_explorations(), 0)

        self.save_new_default_exploration(self.EXP_ID)
        self.assertEqual(exp_services.count_explorations(), 1)

        self.save_new_default_exploration('A new exploration id')
        self.assertEqual(exp_services.count_explorations(), 2)


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_retrieval_of_explorations(self):
        """Test the get_exploration_by_id_by_id() method."""
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_services.get_exploration_by_id('fake_eid')

        exploration = self.save_new_default_exploration(self.EXP_ID)
        retrieved_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.id, retrieved_exploration.id)
        self.assertEqual(exploration.title, retrieved_exploration.title)

        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id('fake_exploration')

    def test_soft_deletion_of_explorations(self):
        """Test that soft deletion of explorations works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_ID)

        exp_services.delete_exploration(self.OWNER_ID, self.EXP_ID)
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id(self.EXP_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            exp_services.get_owned_explorations_summary_dict(self.OWNER_ID),
            {})

        # But the models still exist in the backend.
        self.assertIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExplorationModel.get_all(
                include_deleted_entities=True)]
        )

    def test_hard_deletion_of_explorations(self):
        """Test that hard deletion of explorations works correctly."""
        self.save_new_default_exploration(self.EXP_ID)

        exp_services.delete_exploration(
            self.OWNER_ID, self.EXP_ID, force_deletion=True)
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id(self.EXP_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            exp_services.get_owned_explorations_summary_dict(self.OWNER_ID),
            {})

        # The exploration model has been purged from the backend.
        self.assertNotIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExplorationModel.get_all(
                include_deleted_entities=True)]
        )

    def test_clone_exploration(self):
        """Test cloning an exploration with assets."""
        exploration = self.save_new_default_exploration(self.EXP_ID)
        exploration.add_states(['New state'])
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration.id))
        fs.commit(self.OWNER_ID, 'abc.png', raw_image)

        new_eid = exp_services.clone_exploration(self.OWNER_ID, exploration.id)
        new_fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(new_eid))
        new_exploration = exp_services.get_exploration_by_id(new_eid)

        self.assertEqual(new_exploration.title, 'Copy of A title')
        self.assertEqual(new_exploration.category, 'A category')
        self.assertEqual(new_fs.get('abc.png'), raw_image)

    def test_create_new_exploration_error_cases(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, '', '')
        with self.assertRaisesRegexp(Exception, 'between 1 and 50 characters'):
            exp_services.save_new_exploration(self.OWNER_ID, exploration)

        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'title', '')
        with self.assertRaisesRegexp(Exception, 'between 1 and 50 characters'):
            exp_services.save_new_exploration(self.OWNER_ID, exploration)

    def test_save_and_retrieve_exploration(self):
        exploration = self.save_new_default_exploration(self.EXP_ID)
        exploration.param_specs = {
            'theParameter': param_domain.ParamSpec('Int')}
        exp_services._save_exploration('A user id', exploration, '', [])

        retrieved_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(retrieved_exploration.title, 'A title')
        self.assertEqual(retrieved_exploration.category, 'A category')
        self.assertEqual(len(retrieved_exploration.states), 1)
        self.assertEqual(len(retrieved_exploration.param_specs), 1)
        self.assertEqual(
            retrieved_exploration.param_specs.keys()[0], 'theParameter')


class LoadingAndDeletionOfDemosTest(ExplorationServicesUnitTests):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def test_loading_and_validation_and_deletion_of_demo_explorations(self):
        """Test loading, validation and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        self.assertGreaterEqual(
            len(feconf.DEMO_EXPLORATIONS), 1,
            msg='There must be at least one demo exploration.')

        for ind in range(len(feconf.DEMO_EXPLORATIONS)):
            start_time = datetime.datetime.utcnow()

            exp_id = str(ind)
            exp_services.load_demo(exp_id)
            exploration = exp_services.get_exploration_by_id(exp_id)
            warnings = exploration.validate(strict=True)
            if warnings:
                raise Exception(warnings)

            duration = datetime.datetime.utcnow() - start_time
            processing_time = duration.seconds + duration.microseconds / 1E6
            print 'Loaded and validated exploration %s (%.2f seconds)' % (
                exploration.title.encode('utf-8'), processing_time)

        self.assertEqual(
            exp_services.count_explorations(), len(feconf.DEMO_EXPLORATIONS))

        for ind in range(len(feconf.DEMO_EXPLORATIONS)):
            exp_services.delete_demo(str(ind))
        self.assertEqual(exp_services.count_explorations(), 0)


class ZipFileExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as zip files."""

    SAMPLE_YAML_CONTENT = (
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

    def test_export_to_zip_file(self):
        """Test the export_to_zip_file() method."""
        exploration = self.save_new_default_exploration(self.EXP_ID)
        exploration.add_states(['New state'])
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)

    def test_export_to_zip_file_with_assets(self):
        """Test exporting an exploration with assets to a zip file."""
        exploration = self.save_new_default_exploration(self.EXP_ID)
        exploration.add_states(['New state'])
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        fs.commit(self.OWNER_ID, 'abc.png', raw_image)

        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml', 'assets/abc.png'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)
        self.assertEqual(zf.open('assets/abc.png').read(), raw_image)


def _get_change_list(state_name, property_name, new_value):
    """Generates a change list for a single state change."""
    return [{
        'cmd': 'edit_state_property',
        'state_name': state_name,
        'property_name': property_name,
        'new_value': new_value
    }]


class UpdateStateTests(ExplorationServicesUnitTests):
    """Test updating a single state."""

    def setUp(self):
        super(UpdateStateTests, self).setUp()
        exploration = self.save_new_default_exploration(self.EXP_ID)

        self.init_state_name = exploration.init_state_name

        self.param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector',
            '$$hashKey': '018'
        }]

        self.widget_handlers = {
            'submit': [{
                'description': 'is equal to {{x|NonnegativeInt}}',
                'definition': {
                    'rule_type': 'atomic',
                    'name': 'Equals',
                    'inputs': {'x': 0},
                    'subject': 'answer'
                },
                'dest': self.init_state_name,
                'feedback': ['Try again'],
                '$$hashKey': '03L'
            }, {
                'description': feconf.DEFAULT_RULE_NAME,
                'definition': {
                    'rule_type': rule_domain.DEFAULT_RULE_TYPE
                },
                'dest': self.init_state_name,
                'feedback': ['Incorrect', '<b>Wrong answer</b>'],
                '$$hashKey': '059'
            }]}

    def test_update_param_changes(self):
        """Test updating of param_changes."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.param_specs = {'myParam': param_domain.ParamSpec('Int')}
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'param_changes', self.param_changes), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        param_changes = exploration.init_state.param_changes[0]
        self.assertEqual(param_changes._name, 'myParam')
        self.assertEqual(param_changes._generator_id, 'RandomSelector')
        self.assertEqual(
            param_changes._customization_args,
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_update_invalid_param_changes(self):
        """Check that updates cannot be made to non-existent parameters."""
        with self.assertRaisesRegexp(
                utils.ValidationError,
                r'The parameter myParam .* does not exist .*'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_invalid_generator(self):
        """Test for check that the generator_id in param_changes exists."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.param_specs = {'myParam': param_domain.ParamSpec('Int')}
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        self.param_changes[0]['generator_id'] = 'fake'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid generator id fake'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_widget_id(self):
        """Test updating of widget_id."""
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_id', 'MultipleChoiceInput'), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.init_state.widget.widget_id, 'MultipleChoiceInput')

    def test_update_widget_customization_args(self):
        """Test updating of widget_customization_args."""
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID,
            _get_change_list(
                self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name, 'widget_customization_args', {
                    'choices': {'value': ['Option A', 'Option B']}
                }),
            '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.init_state.widget.customization_args[
                'choices']['value'], ['Option A', 'Option B'])

    def test_update_widget_sticky(self):
        """Test updating of widget_sticky."""
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', False), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.init_state.widget.sticky, False)

        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', True), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.init_state.widget.sticky, True)

    def test_update_widget_sticky_type(self):
        """Test for error if widget_sticky is made non-Boolean."""
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'Expected widget sticky flag to be a boolean, received 3'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'widget_sticky', 3), '')

    def test_update_widget_handlers(self):
        """Test updating of widget_handlers."""

        # We create a second state to use as a rule destination
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.add_states(['State 2'])
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.widget_handlers['submit'][1]['dest'] = 'State 2'
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID,
            _get_change_list(
                self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name, 'widget_handlers', self.widget_handlers),
            '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        rule_specs = exploration.init_state.widget.handlers[0].rule_specs
        self.assertEqual(rule_specs[0].definition, {
            'rule_type': 'atomic',
            'name': 'Equals',
            'inputs': {'x': 0},
            'subject': 'answer'
        })
        self.assertEqual(rule_specs[0].feedback, ['Try again'])
        self.assertEqual(rule_specs[0].dest, self.init_state_name)
        self.assertEqual(rule_specs[1].dest, 'State 2')

    def test_update_state_invalid_state(self):
        """Test that rule destination states cannot be non-existant."""
        self.widget_handlers['submit'][0]['dest'] = 'INVALID'
        with self.assertRaisesRegexp(
                utils.ValidationError,
                'The destination INVALID is not a valid state'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_state_missing_keys(self):
        """Test that missing keys in widget_handlers produce an error."""
        del self.widget_handlers['submit'][0]['definition']['inputs']
        with self.assertRaisesRegexp(KeyError, 'inputs'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'NumericInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_state_extra_keys(self):
        """Test that extra keys in rule definitions are detected."""
        self.widget_handlers['submit'][0]['definition']['extra'] = 3
        with self.assertRaisesRegexp(
                utils.ValidationError, 'should conform to schema'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_state_extra_default_rule(self):
        """Test that rules other than the last cannot be default."""
        self.widget_handlers['submit'][0]['definition']['rule_type'] = (
            rule_domain.DEFAULT_RULE_TYPE)
        with self.assertRaisesRegexp(
                ValueError,
                'Invalid ruleset .*: rules other than the last one should '
                'not be default rules.'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_state_missing_default_rule(self):
        """Test that the last rule must be default."""
        self.widget_handlers['submit'][1]['definition']['rule_type'] = 'atomic'
        with self.assertRaisesRegexp(
                ValueError,
                'Invalid ruleset .* the last rule should be a default rule'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_state_variable_types(self):
        """Test that parameters in rules must have the correct type."""
        self.widget_handlers['submit'][0]['definition']['inputs']['x'] = 'abc'
        with self.assertRaisesRegexp(
                Exception,
                'abc has the wrong type. It should be a NonnegativeInt.'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'widget_id', 'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name, 'widget_handlers',
                    self.widget_handlers),
                '')

    def test_update_content(self):
        """Test updating of content."""
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'content', [{
                    'type': 'text',
                    'value': '<b>Test content</b>',
                    '$$hashKey': '014'
                }]),
            '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.init_state.content[0].type, 'text')
        self.assertEqual(
            exploration.init_state.content[0].value, '<b>Test content</b>')

    def test_update_content_missing_key(self):
        """Test that missing keys in content yield an error."""
        with self.assertRaisesRegexp(KeyError, 'type'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'content', [{
                        'value': '<b>Test content</b>',
                        '$$hashKey': '014'
                    }]),
                '')


class CommitMessageHandlingTests(ExplorationServicesUnitTests):
    """Test the handling of commit messages."""

    def setUp(self):
        super(CommitMessageHandlingTests, self).setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.OWNER_ID)
        self.init_state_name = exploration.init_state_name

    def test_record_commit_message(self):
        """Check published explorations record commit messages."""
        rights_manager.publish_exploration(self.OWNER_ID, self.EXP_ID)

        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', False), 'A message')

        self.assertEqual(
            exp_services.get_exploration_snapshots_metadata(
                self.EXP_ID, 1)[0]['commit_message'],
            'A message')

    def test_demand_commit_message(self):
        """Check published explorations demand commit messages"""
        rights_manager.publish_exploration(self.OWNER_ID, self.EXP_ID)

        with self.assertRaisesRegexp(
                ValueError, 'Exploration is public so expected a commit '
                            'message but received none.'):
            exp_services.update_exploration(
                self.OWNER_ID, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'widget_sticky', False), '')

    def test_unpublished_explorations_can_accept_commit_message(self):
        """Test unpublished explorations can accept optional commit messages"""

        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', False), 'A message')

        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', True), '')

        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, _get_change_list(
                self.init_state_name, 'widget_sticky', True), None)


class ExplorationSnapshotUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to exploration snapshots."""

    def test_get_exploration_snapshots_metadata(self):
        v1_exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.OWNER_ID)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 3)
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category',
            }],
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on', snapshots_metadata[0])

        # Publish the exploration. This does not affect the exploration version
        # history.
        rights_manager.publish_exploration(self.OWNER_ID, self.EXP_ID)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 3)
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on', snapshots_metadata[0])

        # Modify the exploration. This affects the exploration version history.
        change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'First title'
        }]
        exp_services.update_exploration(
            self.OWNER_ID, self.EXP_ID, change_list, 'Changed title.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 3)
        self.assertEqual(len(snapshots_metadata), 2)
        self.assertIn('created_on', snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.OWNER_ID,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[1])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

        # Using the old version of the exploration should raise an error.
        with self.assertRaisesRegexp(Exception, 'version 1, which is too old'):
            exp_services._save_exploration(
                'committer_id_2', v1_exploration, '', [])

        # Another person modifies the exploration.
        new_change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        }]
        exp_services.update_exploration(
            'committer_id_2', self.EXP_ID, new_change_list, 'Second commit.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 5)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset({
            'commit_cmds': new_change_list,
            'committer_id': 'committer_id_2',
            'commit_message': 'Second commit.',
            'commit_type': 'edit',
            'version_number': 3,
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.OWNER_ID,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[2])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

    def test_versioning_with_add_and_delete_states(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.OWNER_ID)

        exploration.title = 'First title'
        exp_services._save_exploration(
            self.OWNER_ID, exploration, 'Changed title.', [])
        commit_dict_2 = {
            'committer_id': self.OWNER_ID,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 5)
        self.assertEqual(len(snapshots_metadata), 2)

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.add_states(['New state'])
        exp_services._save_exploration(
            'committer_id_2', exploration, 'Added new state', [])

        commit_dict_3 = {
            'committer_id': 'committer_id_2',
            'commit_message': 'Added new state',
            'version_number': 3,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 5)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset(
            commit_dict_3, snapshots_metadata[0])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

        # Perform an invalid action: delete a state that does not exist. This
        # should not create a new version.
        with self.assertRaisesRegexp(ValueError, 'does not exist'):
            exploration.delete_state('invalid_state_name')

        # Now delete the new state.
        exploration.delete_state('New state')
        exp_services._save_exploration(
            'committer_id_3', exploration, 'Deleted state: New state', [])

        commit_dict_4 = {
            'committer_id': 'committer_id_3',
            'commit_message': 'Deleted state: New state',
            'version_number': 4,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 5)
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[0])
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[1])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[2])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])
        self.assertGreaterEqual(
            snapshots_metadata[1]['created_on'],
            snapshots_metadata[2]['created_on'])

        # The final exploration should have exactly one state.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(len(exploration.states), 1)

    def test_versioning_with_reverting(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.OWNER_ID)

        # In version 1, the title was 'A title'.
        # In version 2, the title becomes 'V2 title'.
        exploration.title = 'V2 title'
        exp_services._save_exploration(
            self.OWNER_ID, exploration, 'Changed title.', [])

        # In version 3, a new state is added.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.add_states(['New state'])
        exp_services._save_exploration(
            'committer_id_v3', exploration, 'Added new state', [])

        # It is not possible to revert from anything other than the most
        # current version.
        with self.assertRaisesRegexp(Exception, 'too old'):
            exp_services.revert_exploration(
                'committer_id_v4', self.EXP_ID, 2, 1)

        # Version 4 is a reversion to version 1.
        exp_services.revert_exploration('committer_id_v4', self.EXP_ID, 3, 1)
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(exploration.version, 4)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID, 5)

        commit_dict_4 = {
            'committer_id': 'committer_id_v4',
            'commit_message': 'Reverted exploration to version 1',
            'version_number': 4,
        }
        commit_dict_3 = {
            'committer_id': 'committer_id_v3',
            'commit_message': 'Added new state',
            'version_number': 3,
        }
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(
            commit_dict_4, snapshots_metadata[0])
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[1])
        self.assertGreaterEqual(
            snapshots_metadata[0]['created_on'],
            snapshots_metadata[1]['created_on'])

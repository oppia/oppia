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

"""Tests for the base interaction specification."""

import os
import re
import string
import struct

from core.domain import dependency_registry
from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import obj_services
from core.tests import test_utils
from extensions.interactions import base
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking the
# validity of interaction definitions.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store', '.swp']
# Expected dimensions for an interaction thumbnail PNG image.
INTERACTION_THUMBNAIL_WIDTH_PX = 178
INTERACTION_THUMBNAIL_HEIGHT_PX = 146
TEXT_INPUT_ID = 'TextInput'

_INTERACTION_CONFIG_SCHEMA = [
    ('name', basestring), ('display_mode', basestring),
    ('description', basestring), ('_customization_arg_specs', list),
    ('is_terminal', bool), ('needs_summary', bool),
    ('show_generic_submit_button', bool)]


class InteractionAnswerUnitTests(test_utils.GenericTestBase):
    """Test the answer object and type properties of an interaction object."""

    def test_rules_property(self):
        """Test that answer normalization behaves as expected."""
        interaction = base.BaseInteraction()
        interaction.answer_type = None
        interaction.normalize_answer('15')

        interaction.answer_type = 'NonnegativeInt'
        interaction.normalize_answer('15')

        with self.assertRaisesRegexp(Exception, 'not a valid object class'):
            interaction.answer_type = 'FakeObjType'
            interaction.normalize_answer('15')


class InteractionUnitTests(test_utils.GenericTestBase):
    """Test that the default interactions are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, input_string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9_]+$").match(input_string))

    def _validate_customization_arg_specs(self, customization_args):
        for ca_spec in customization_args:
            self.assertEqual(set(ca_spec.keys()), set([
                'name', 'description', 'schema', 'default_value']))

            self.assertTrue(isinstance(ca_spec['name'], basestring))
            self.assertTrue(self._is_alphanumeric_string(ca_spec['name']))
            self.assertTrue(isinstance(ca_spec['description'], basestring))
            self.assertGreater(len(ca_spec['description']), 0)

            schema_utils_test.validate_schema(ca_spec['schema'])
            self.assertEqual(
                ca_spec['default_value'],
                schema_utils.normalize_against_schema(
                    ca_spec['default_value'], ca_spec['schema']))

            if ca_spec['schema']['type'] == 'custom':
                obj_class = obj_services.Registry.get_object_class_by_type(
                    ca_spec['schema']['obj_type'])
                self.assertEqual(
                    ca_spec['default_value'],
                    obj_class.normalize(ca_spec['default_value']))

    def _validate_dependencies(self, dependency_ids):
        # Check that all dependency ids are valid.
        for dependency_id in dependency_ids:
            dependency_registry.Registry.get_dependency_html(dependency_id)

    def _validate_answer_visualization_specs(self, answer_visualization_specs):
        _ANSWER_VISUALIZATIONS_SPECS_SCHEMA = [
            ('id', basestring), ('options', dict),
            ('calculation_id', basestring),
            ('addressed_info_is_supported', bool)]
        _ANSWER_VISUALIZATION_KEYS = [
            item[0] for item in _ANSWER_VISUALIZATIONS_SPECS_SCHEMA]

        # Check that the keys and the types of their values are correct.
        for spec in answer_visualization_specs:
            self.assertItemsEqual(spec.keys(), _ANSWER_VISUALIZATION_KEYS)
            for key, item_type in _ANSWER_VISUALIZATIONS_SPECS_SCHEMA:
                self.assertTrue(isinstance(spec[key], item_type))
                if item_type == basestring:
                    self.assertTrue(spec[key])

    def _listdir_omit_ignored(self, directory):
        """List all files and directories within 'directory', omitting the ones
        whose name ends in one of the IGNORED_FILE_SUFFIXES.
        """
        names = os.listdir(directory)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [name for name in names if not name.endswith(suffix)]
        return names

    def _get_linear_interaction_ids(self):
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())
        return [
            interaction_id for interaction_id in all_interaction_ids
            if interaction_registry.Registry.get_interaction_by_id(
                interaction_id).is_linear]

    def test_interaction_properties(self):
        """Test the standard properties of interactions."""

        interaction = interaction_registry.Registry.get_interaction_by_id(
            TEXT_INPUT_ID)
        self.assertEqual(interaction.id, TEXT_INPUT_ID)
        self.assertEqual(interaction.name, 'Text Input')

        interaction_dict = interaction.to_dict()
        self.assertItemsEqual(interaction_dict.keys(), [
            'id', 'name', 'description', 'display_mode',
            'customization_arg_specs', 'is_trainable', 'is_terminal',
            'is_linear', 'rule_descriptions', 'instructions',
            'narrow_instructions', 'needs_summary',
            'default_outcome_heading', 'can_have_solution',
            'show_generic_submit_button'])
        self.assertEqual(interaction_dict['id'], TEXT_INPUT_ID)
        self.assertEqual(
            interaction_dict['customization_arg_specs'], [{
                'name': 'placeholder',
                'description': 'Placeholder text (optional)',
                'schema': {'type': 'unicode'},
                'default_value': '',
            }, {
                'name': 'rows',
                'description': 'Height (in rows)',
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least', 'min_value': 1
                    }, {
                        'id': 'is_at_most', 'max_value': 200
                    }]
                },
                'default_value': 1,
            }])

    def test_interaction_rules(self):
        def _check_num_interaction_rules(interaction_id, expected_num):
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            self.assertEqual(len(interaction.rules_dict), expected_num)

        _check_num_interaction_rules('MultipleChoiceInput', 1)
        _check_num_interaction_rules('NumericInput', 7)
        _check_num_interaction_rules('Continue', 0)
        with self.assertRaises(KeyError):
            _check_num_interaction_rules('FakeObjType', 0)

    def test_interaction_rule_descriptions_in_dict(self):
        interaction = interaction_registry.Registry.get_interaction_by_id(
            'NumericInput')
        self.assertEqual(interaction.to_dict()['rule_descriptions'], {
            'Equals': 'is equal to {{x|Real}}',
            'IsLessThan': 'is less than {{x|Real}}',
            'IsGreaterThan': 'is greater than {{x|Real}}',
            'IsLessThanOrEqualTo': 'is less than or equal to {{x|Real}}',
            'IsGreaterThanOrEqualTo': 'is greater than or equal to {{x|Real}}',
            'IsInclusivelyBetween': (
                'is between {{a|Real}} and {{b|Real}}, inclusive'),
            'IsWithinTolerance': 'is within {{tol|Real}} of {{x|Real}}'
        })

    def test_default_interactions_are_valid(self):
        """Test that the default interactions are valid."""

        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            # Check that the interaction id is valid.
            self.assertTrue(self._is_camel_cased(interaction_id))

            # Check that the interaction directory exists.
            interaction_dir = os.path.join(
                feconf.INTERACTIONS_DIR, interaction_id)
            self.assertTrue(os.path.isdir(interaction_dir))

            # The interaction directory should contain the following files:
            #  Required:
            #    * A python file called {InteractionName}.py.
            #    * An html file called {InteractionName}.html.
            #    * A directory name 'directives' containing JS and HTML files
            #      for directives
            #    * A directory named 'static' containing at least a .png file.
            #  Optional:
            #    * A JS file called protractor.js.
            interaction_dir_contents = (
                self._listdir_omit_ignored(interaction_dir))

            interaction_dir_optional_dirs_and_files_count = 0

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir, 'protractor.js')))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir,
                    '%sPredictionService.js' % interaction_id)))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir,
                    '%sPredictionServiceSpec.js' % interaction_id)))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                interaction_dir_optional_dirs_and_files_count + 4,
                len(interaction_dir_contents)
            )

            py_file = os.path.join(interaction_dir, '%s.py' % interaction_id)
            html_file = os.path.join(
                interaction_dir, '%s.html' % interaction_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))

            # Check that the directives subdirectory exists.
            directives_dir = os.path.join(
                interaction_dir, 'directives')
            self.assertTrue(os.path.isdir(directives_dir))

            # The directives directory should contain the following files:
            #  Required:
            #    * A JS file called {InteractionName}.js.
            #    * A JS file called {InteractionName}ValidationService.js.
            #    * A HTML file called
            #      {InteractionName}_interaction_directive.html.
            #    * A HTML file called
            #      {InteractionName}_response_directive.html.
            #    * A HTML file called
            #      {InteractionName}_short_response_directive.html.
            #  Optional:
            #    * A JS file called {InteractionName}ValidationServiceSpecs.js.
            #    * A JS file called {InteractionName}RulesServiceSpecs.js.

            snakecase_interaction_id = (
                utils.camelcase_to_snakecase(interaction_id))

            js_file = os.path.join(directives_dir, '%s.js' % interaction_id)
            validation_service_js_file = os.path.join(
                directives_dir, '%sValidationService.js' % interaction_id)
            interaction_directive_html = os.path.join(
                directives_dir,
                '%s_interaction_directive.html' % snakecase_interaction_id)
            response_directive_html = os.path.join(
                directives_dir,
                '%s_response_directive.html' % snakecase_interaction_id)
            short_response_directive_html = os.path.join(
                directives_dir,
                '%s_short_response_directive.html' % snakecase_interaction_id)

            self.assertTrue(os.path.isfile(js_file))
            self.assertTrue(os.path.isfile(validation_service_js_file))
            self.assertTrue(os.path.isfile(interaction_directive_html))
            self.assertTrue(os.path.isfile(response_directive_html))
            self.assertTrue(os.path.isfile(short_response_directive_html))

            # Check that the PNG thumbnail image has the correct dimensions.
            static_dir = os.path.join(interaction_dir, 'static')
            self.assertTrue(os.path.isdir(static_dir))
            png_file = os.path.join(
                interaction_dir, 'static', '%s.png' % interaction_id)

            self.assertTrue(os.path.isfile(png_file))
            with open(png_file, 'rb') as f:
                img_data = f.read()
                width, height = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(width), INTERACTION_THUMBNAIL_WIDTH_PX)
                self.assertEqual(int(height), INTERACTION_THUMBNAIL_HEIGHT_PX)

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            validation_service_js_file_content = utils.get_file_contents(
                validation_service_js_file)

            self.assertIn(
                'oppiaInteractive%s' % interaction_id, js_file_content)
            self.assertIn('oppiaResponse%s' % interaction_id, js_file_content)
            # Check that the html template includes js script for the
            # interaction.
            self.assertIn(
                '<script src="{{cache_slug}}/extensions/interactions/%s/'
                'directives/%s.js">'
                '</script>' % (interaction_id, interaction_id),
                html_file_content)
            self.assertIn(
                '<script src="{{cache_slug}}/extensions/interactions/%s/'
                'directives/%sValidationService.js"></script>' % (
                    interaction_id, interaction_id),
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)
            self.assertIn(
                '%sValidationService' % interaction_id,
                validation_service_js_file_content)
            self.assertNotIn('<script>', validation_service_js_file_content)
            self.assertNotIn('</script>', validation_service_js_file_content)

            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)

            # Check that the specified interaction id is the same as the class
            # name.
            self.assertTrue(interaction_id, interaction.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _INTERACTION_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(interaction, item), item_type))
                if item_type == basestring:
                    self.assertTrue(getattr(interaction, item))

            self.assertIn(interaction.display_mode, base.ALLOWED_DISPLAY_MODES)

            if interaction.is_linear or interaction.is_terminal:
                self.assertIsNone(interaction.answer_type)
            else:
                # Check that the answer_type corresponds to a valid object
                # class.
                obj_services.Registry.get_object_class_by_type(
                    interaction.answer_type)

            self._validate_customization_arg_specs(
                interaction._customization_arg_specs)  # pylint: disable=protected-access

            self._validate_dependencies(interaction.dependency_ids)

            answer_visualization_specs = (
                interaction.answer_visualization_specs)
            self._validate_answer_visualization_specs(
                answer_visualization_specs)

            answer_visualizations = interaction.answer_visualizations
            for ind, visualization in enumerate(answer_visualizations):
                self.assertEqual(
                    visualization.id, answer_visualization_specs[ind]['id'])
                self.assertEqual(
                    visualization.calculation_id,
                    answer_visualization_specs[ind]['calculation_id'])
                self.assertEqual(
                    visualization.options,
                    answer_visualization_specs[ind]['options'])

                # Check that the derived visualization is valid.
                visualization.validate()

            # Check that supplemental interactions have instructions, and
            # inline ones do not.
            if interaction.display_mode == base.DISPLAY_MODE_INLINE:
                self.assertIsNone(interaction.instructions)
                self.assertIsNone(interaction.narrow_instructions)
            else:
                self.assertTrue(
                    isinstance(interaction.instructions, basestring))
                self.assertIsNotNone(interaction.instructions)
                self.assertIsNotNone(interaction.narrow_instructions)

            # Check that terminal interactions are not linear.
            if interaction.is_terminal:
                self.assertFalse(interaction.is_linear)

            # Check that only linear interactions have a
            # default_outcome_heading property.
            if interaction.is_linear:
                self.assertTrue(
                    isinstance(interaction.default_outcome_heading, basestring)
                    and interaction.default_outcome_heading)
            else:
                self.assertIsNone(interaction.default_outcome_heading)

            # Check that interactions that can have solution cannot be linear.
            if interaction.can_have_solution:
                self.assertFalse(interaction.is_linear)

            default_object_values = obj_services.get_default_object_values()

            # Check that the rules for this interaction have object editor
            # templates and default values.
            for rule_name in interaction.rules_dict.keys():
                param_list = interaction.get_rule_param_list(rule_name)

                for (_, param_obj_cls) in param_list:
                    # TODO(sll): Get rid of these special cases.
                    if param_obj_cls.__name__ in [
                            'NonnegativeInt', 'ListOfCodeEvaluation',
                            'ListOfCoordTwoDim', 'ListOfGraph',
                            'SetOfNormalizedString']:
                        continue

                    # Check that the rule has a default value.
                    self.assertIn(
                        param_obj_cls.__name__, default_object_values)

    def test_trainable_interactions_have_more_than_just_a_classifier(self):
        """This ensures that trainable interactions cannot only have a soft
        rule, as that would break frontend functionality (users would not be
        able to create manual answer groups).
        """
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            if interaction.is_trainable:
                self.assertNotEqual(
                    len(interaction.rules_dict), 1,
                    'Expected trainable interaction to have more than just a '
                    'classifier: %s' % interaction_id)

    def test_linear_interactions(self):
        """Sanity-check for the number of linear interactions."""

        actual_linear_interaction_ids = self._get_linear_interaction_ids()
        self.assertEqual(len(actual_linear_interaction_ids), 1)

    def test_linear_interaction_ids_list_matches_linear_interactions(self):
        """Sanity-check the feconf constant which lists all linear interaction
        IDs.
        """
        actual_linear_interaction_ids = self._get_linear_interaction_ids()
        self.assertEqual(
            actual_linear_interaction_ids, feconf.LINEAR_INTERACTION_IDS)


class InteractionDemoExplorationUnitTests(test_utils.GenericTestBase):
    """Test that the interaction demo exploration covers all interactions."""

    _DEMO_EXPLORATION_ID = '16'

    def test_interactions_demo_exploration(self):
        exp_services.load_demo(self._DEMO_EXPLORATION_ID)
        exploration = exp_services.get_exploration_by_id(
            self._DEMO_EXPLORATION_ID)

        all_interaction_ids = set(
            interaction_registry.Registry.get_all_interaction_ids())
        observed_interaction_ids = set()

        for state in exploration.states.values():
            observed_interaction_ids.add(state.interaction.id)

        missing_interaction_ids = (
            all_interaction_ids - observed_interaction_ids)
        self.assertEqual(len(missing_interaction_ids), 0, (
            'Missing interaction IDs in demo exploration: %s' %
            missing_interaction_ids))

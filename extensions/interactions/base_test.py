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

from __future__ import annotations

import collections
import json
import os
import re
import string
import struct

from core import constants
from core import feconf
from core import schema_utils
from core import schema_utils_test
from core import utils
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import object_registry
from core.tests import test_utils
from extensions import domain
from extensions.interactions import base

from typing import Any, Dict, Final, List, Literal, Set, Tuple, Type

# File names ending in any of these suffixes will be ignored when checking the
# validity of interaction definitions.
IGNORED_FILE_SUFFIXES: Final = ['.pyc', '.DS_Store', '.swp']
# Expected dimensions for an interaction thumbnail PNG image.
INTERACTION_THUMBNAIL_WIDTH_PX: Final = 178
INTERACTION_THUMBNAIL_HEIGHT_PX: Final = 146
TEXT_INPUT_ID: Final = 'TextInput'
INTERACTIONS_THAT_USE_COMPONENTS: Final = [
    'AlgebraicExpressionInput',
    'Continue',
    'CodeRepl',
    'DragAndDropSortInput',
    'EndExploration',
    'FractionInput',
    'GraphInput',
    'ImageClickInput',
    'InteractiveMap',
    'ItemSelectionInput',
    'MathEquationInput',
    'MultipleChoiceInput',
    'MusicNotesInput',
    'NumericExpressionInput',
    'NumericInput',
    'NumberWithUnits',
    'PencilCodeEditor',
    'RatioExpressionInput',
    'SetInput',
    'TextInput',
]

_INTERACTION_CONFIG_SCHEMA: Final = [
    ('name', str),
    ('display_mode', str),
    ('description', str),
    ('_customization_arg_specs', list),
    ('is_terminal', bool), ('needs_summary', bool),
    ('show_generic_submit_button', bool)]


AnswerVisualizationsDictKeys = Literal[
    'id',
    'options',
    'calculation_id',
    'addressed_info_is_supported'
]


class InteractionAnswerUnitTests(test_utils.GenericTestBase):
    """Test the answer object and type properties of an interaction object."""

    def test_rules_property(self) -> None:
        """Test that answer normalization behaves as expected."""
        interaction = base.BaseInteraction()
        interaction.answer_type = None
        interaction.normalize_answer('15')

        interaction.answer_type = 'NonnegativeInt'
        interaction.normalize_answer('15')

        with self.assertRaisesRegex(Exception, 'not a valid object class'):
            interaction.answer_type = 'FakeObjType'
            interaction.normalize_answer('15')

    def test_get_rule_description_with_invalid_rule_name_raises_error(
        self
    ) -> None:
        interaction = interaction_registry.Registry.get_interaction_by_id(
            'CodeRepl')
        with self.assertRaisesRegex(
            Exception, 'Could not find rule with name invalid_rule_name'):
            interaction.get_rule_description('invalid_rule_name')

    def test_get_rule_param_type_with_invalid_rule_param_name_raises_error(
        self
    ) -> None:
        interaction = interaction_registry.Registry.get_interaction_by_id(
            'CodeRepl')
        with self.assertRaisesRegex(
            Exception,
            'Rule CodeEquals has no param called invalid_rule_param_name'):
            interaction.get_rule_param_type(
                'CodeEquals', 'invalid_rule_param_name')


class InteractionUnitTests(test_utils.GenericTestBase):
    """Test that the default interactions are valid."""

    def _is_camel_cased(self, name: str) -> bool:
        """Check whether a name is in CamelCase."""
        return bool(name and (name[0] in string.ascii_uppercase))

    def _is_alphanumeric_string(self, input_string: str) -> bool:
        """Check whether a string is alphanumeric."""
        return bool(re.compile('^[a-zA-Z0-9_]+$').match(input_string))

    # Here we use type Any because the schema has type Any included and this
    # is just a helper function which requires `schema` as an arguments.
    def _set_expect_invalid_default_value(
        self, schema: Dict[str, Any], value: bool = False
    ) -> None:
        """Helper function to set expect_invalid_default_value to avoid
        schema validations for the default value.

        Args:
            schema: Dict[str, Any]. The schema that needs to be validated.
            value: bool. The boolean value that needs to be set.
        """
        if 'validators' in schema:
            for validator in schema['validators']:
                validator['expect_invalid_default_value'] = value
        if 'items' in schema:
            if 'validators' in schema['items']:
                for item_validator in schema['items']['validators']:
                    item_validator['expect_invalid_default_value'] = value

    def _validate_customization_arg_specs(
        self, customization_args: List[domain.CustomizationArgSpec]
    ) -> None:
        """Validates the customization arg specs for the interaction.

        Args:
            customization_args: list(CustomizationArgSpec). The customization
                args for the interaction.
        """
        for ca_spec in customization_args:
            self.assertTrue(all(hasattr(ca_spec, attr) for attr in [
                'name', 'description', 'schema', 'default_value']))

            self.assertIsInstance(ca_spec.name, str)
            self.assertTrue(self._is_alphanumeric_string(ca_spec.name))
            self.assertIsInstance(ca_spec.description, str)
            self.assertGreater(len(ca_spec.description), 0)

            schema_utils_test.validate_schema(ca_spec.schema)
            self._set_expect_invalid_default_value(ca_spec.schema, True)
            self.assertEqual(
                ca_spec.default_value,
                schema_utils.normalize_against_schema(
                    ca_spec.default_value, ca_spec.schema))

            if ca_spec.schema['type'] == 'custom':
                obj_class = object_registry.Registry.get_object_class_by_type(
                    ca_spec.schema['obj_type'])
                self.assertEqual(
                    ca_spec.default_value,
                    obj_class.normalize(ca_spec.default_value))
            self._set_expect_invalid_default_value(ca_spec.schema, False)

    def _validate_answer_visualization_specs(
        self,
        answer_visualization_specs: List[base.AnswerVisualizationSpecsDict]
    ) -> None:
        """Validates all the answer_visualization_specs for the interaction.

        Args:
            answer_visualization_specs: list(dict(str, *)). The answer
                visualization specs to be validated.
        """
        # Here we use object because every in-built type is inherited from
        # object class.
        _answer_visualizations_specs_schema: List[
            Tuple[AnswerVisualizationsDictKeys, Type[object]]
        ] = [
            ('id', str),
            ('options', dict),
            ('calculation_id', str),
            ('addressed_info_is_supported', bool)
        ]
        _answer_visualization_keys = [
            item[0] for item in _answer_visualizations_specs_schema]

        # Check that the keys and the types of their values are correct.
        for spec in answer_visualization_specs:
            self.assertItemsEqual(list(spec.keys()), _answer_visualization_keys)
            for key, item_type in _answer_visualizations_specs_schema:
                self.assertIsInstance(spec[key], item_type)
                if item_type == str:
                    self.assertTrue(spec[key])

    def _listdir_omit_ignored(self, directory: str) -> List[str]:
        """List all files and directories within 'directory', omitting the ones
        whose name ends in one of the IGNORED_FILE_SUFFIXES.
        """
        names = os.listdir(directory)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [
                name for name in names
                if name != '__pycache__' and not name.endswith(suffix)
            ]
        return names

    def _get_linear_interaction_ids(self) -> List[str]:
        """Returns the ids of all linear interactions.

        Returns:
            list(str). The list of linear interaction ids.
        """
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())
        return [
            interaction_id for interaction_id in all_interaction_ids
            if interaction_registry.Registry.get_interaction_by_id(
                interaction_id).is_linear]

    def test_interaction_properties(self) -> None:
        """Test the standard properties of interactions."""

        interaction = interaction_registry.Registry.get_interaction_by_id(
            TEXT_INPUT_ID)
        self.assertEqual(interaction.id, TEXT_INPUT_ID)
        self.assertEqual(interaction.name, 'Text Input')

        interaction_dict = interaction.to_dict()
        self.assertItemsEqual(list(interaction_dict.keys()), [
            'id', 'name', 'description', 'display_mode',
            'customization_arg_specs', 'is_trainable', 'is_terminal',
            'is_linear', 'rule_descriptions', 'instructions',
            'narrow_instructions', 'needs_summary',
            'default_outcome_heading', 'can_have_solution',
            'show_generic_submit_button', 'answer_type'])
        self.assertEqual(interaction_dict['id'], TEXT_INPUT_ID)
        self.assertEqual(
            interaction_dict['customization_arg_specs'], [{
                'name': 'placeholder',
                'description': 'Placeholder text (optional)',
                'schema': {
                    'type': 'custom',
                    'obj_type': 'SubtitledUnicode'
                },
                'default_value': {
                    'content_id': None,
                    'unicode_str': ''
                },
            }, {
                'name': 'rows',
                'description': 'Height (in rows)',
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'expect_invalid_default_value': False,
                        'id': 'is_at_least', 'min_value': 1
                    }, {
                        'expect_invalid_default_value': False,
                        'id': 'is_at_most', 'max_value': 10
                    }]
                },
                'default_value': 1,
            }])

    def test_interaction_rules(self) -> None:
        """Tests the interaction rules."""
        def _check_num_interaction_rules(
            interaction_id: str, expected_num: int
        ) -> None:
            """Checks the number of rules in the interaction corresponding to
            the given interaction id.

            Args:
                interaction_id: str. The interaction id.
                expected_num: int. The expected number of rules for the
                    interaction.
            """
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            self.assertEqual(len(interaction.rules_dict), expected_num)

        _check_num_interaction_rules('MultipleChoiceInput', 1)
        _check_num_interaction_rules('NumericInput', 7)
        _check_num_interaction_rules('Continue', 0)
        with self.assertRaisesRegex(KeyError, '\'FakeObjType\''):
            _check_num_interaction_rules('FakeObjType', 0)

    def test_interaction_rule_descriptions_in_dict(self) -> None:
        """Tests the interaction rule descriptions in dict format."""
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

    def test_html_field_types_to_rule_specs_mapping_are_valid(self) -> None:
        """Test that the structure of the file html_field_types_to_rule_specs.
        json are valid. This test ensures that whenever any new type of
        interaction or rule type with HTML string is added, the file
        html_field_types_to_rule_specs.json should be updated accordingly.
        """
        # The file having the information about the assembly of the html in the
        # rule specs.
        html_field_types_to_rule_specs_dict = json.loads(
            constants.get_package_file_contents(
                'extensions',
                feconf.HTML_FIELD_TYPES_TO_RULE_SPECS_EXTENSIONS_MODULE_PATH))

        # The file having the templates for the structure of the rule specs.
        # Contents of the file html_field_types_to_rule_specs.json will be
        # verified against this file.
        rule_descriptions_dict = json.loads(
            constants.get_package_file_contents(
                'extensions', feconf.RULES_DESCRIPTIONS_EXTENSIONS_MODULE_PATH))

        # In the following part, we generate the html_field_types_to_rule_specs
        # dict based on the values in the rule_descriptions.json file.
        generated_html_field_types_dict: Dict[
            str, Dict[str, Dict[str, Dict[str, Dict[str, Set[str]]]]]
        ] = (
            collections.defaultdict(lambda: collections.defaultdict(
                lambda: collections.defaultdict(lambda: collections.defaultdict(
                    lambda: collections.defaultdict(set))))))

        # Verify that each html_type dict has a format key, which must be
        # unique. After verification we delete the key for comparison with
        # the generated html_field_types_to_rule_specs dict. We compare
        # everything except the format, because the format can't be generated
        # from the rule_descriptions.json file.
        for html_type, html_type_dict in (
                html_field_types_to_rule_specs_dict.items()):
            self.assertTrue('format' in html_type_dict)
            self.assertTrue(
                html_type_dict['format'] in
                feconf.ALLOWED_HTML_RULE_VARIABLE_FORMATS)
            del html_type_dict['format']

        for interaction_id, interaction_rules in (
                rule_descriptions_dict.items()):
            for rule_type, rule_description in interaction_rules.items():
                description = rule_description['description']
                # Extract the input variables and html_types from the rule
                # description.
                input_variables_with_html_type = (
                    re.findall(r'{{([a-z])\|([^}]*)}', description))
                input_variables: Set[str] = set()
                input_variables_to_html_type_mapping_dict = (
                    collections.defaultdict(set))
                for value in input_variables_with_html_type:
                    if 'Html' in value[1] and 'HtmlContentId' not in value[1]:
                        input_variables_to_html_type_mapping_dict[
                            value[1]].add(value[0])

                # We need to iterate through the html_types for each rule_type,
                # because only after visiting each rule_type the inner dict
                # structure for each html_type gets generated.
                for html_type, input_variables in (
                        input_variables_to_html_type_mapping_dict.items()):
                    html_type_dict = (
                        generated_html_field_types_dict[html_type])

                    # TODO(#9588): This generation (and the format of the
                    # html_field_types_dict) assumes that there is at most one
                    # interaction ID that uses a given HTML object type. If this
                    # changes in the future, the structure of the dict needs to
                    # be amended so that the each HTML object type can
                    # accommodate more than one interaction. Corresponding
                    # checks in state_domain.AnswerGroup
                    # get_all_html_content_strings() also needs to be updated.
                    if isinstance(html_type_dict['interactionId'], str):
                        # The above type check is required because,
                        # all the keys in the generated html type
                        # dict is initialized as defaultdict object.
                        # Below, we raise an exception if the existing
                        # interaction ID is overwritten by another
                        # interaction ID.
                        if (html_type_dict['interactionId'] !=
                                interaction_id):
                            raise Exception(
                                'Each html type should refer to only'
                                ' one interaction_id.')

                    html_type_dict['interactionId'] = interaction_id
                    html_type_dict['ruleTypes'][rule_type][
                        'htmlInputVariables'] = sorted(input_variables)

        self.assertEqual(
            html_field_types_to_rule_specs_dict,
            dict(generated_html_field_types_dict))

    def test_default_interactions_are_valid(self) -> None:
        """Test that the default interactions are valid."""

        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())
        for interaction_id in all_interaction_ids:

            # Check that the interaction id is valid.
            self.assertTrue(self._is_camel_cased(interaction_id))
            hyphenated_interaction_id = (
                utils.camelcase_to_hyphenated(interaction_id))

            # Check that the interaction directory exists.
            interaction_dir = os.path.join(
                feconf.INTERACTIONS_DIR, interaction_id)
            self.assertTrue(os.path.isdir(interaction_dir))

            # The interaction directory should contain the following files:
            #  Required:
            #    * A python file called {InteractionName}.py.
            #    * A python test file called {InteractionName}_test.py.
            #    * An __init__.py file used to import the Python file.
            #    * A TypeScript file called {InteractionName}.ts.
            #    * If migrated to Angular2+, a module.ts file called
            #       {InteractionName}-interactions.module.ts
            #    * A directory name 'directives' containing TS and HTML files
            #      for directives
            #    * A directory named 'static' containing at least a .png file.
            #  Optional:
            #    * A JS file called webdriverio.js.
            interaction_dir_contents = (
                self._listdir_omit_ignored(interaction_dir))

            interaction_dir_optional_dirs_and_files_count = 0

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir, 'webdriverio.js')))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir,
                    '%s-interactions.module.ts' % hyphenated_interaction_id)))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir,
                    '%s-prediction.service.ts' % hyphenated_interaction_id)))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir, '%s-prediction.service.spec.ts'
                    % hyphenated_interaction_id)))
                interaction_dir_optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                interaction_dir_optional_dirs_and_files_count + 6,
                len(interaction_dir_contents)
            )

            py_file = os.path.join(interaction_dir, '%s.py' % interaction_id)
            ts_file = os.path.join(
                interaction_dir, '%s.ts' % interaction_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(ts_file))

            # Check that __init__.py file exists.
            init_file = os.path.join(interaction_dir, '__init__.py')
            self.assertTrue(os.path.isfile(init_file))

            # Check that the directives subdirectory exists.
            directives_dir = os.path.join(
                interaction_dir, 'directives')
            self.assertTrue(os.path.isdir(directives_dir))

            # The directives directory should contain the following files:
            #  Required:
            #    * A TS file called
            #    oppia-interactive-{InteractionName}.directive.ts.
            #    * A TS file called OppiaResponse{InteractionName}.directive.ts.
            #    * A TS file called
            #    oppia-short-response-{InteractionName}.directive.ts.
            #    * A TS file called {InteractionName}-rules.service.ts.
            #    * A TS file called {InteractionName}-validation.service.ts.
            #    * A HTML file called
            #      {InteractionName}-interaction.directive.html.
            #    * A HTML file called
            #      {InteractionName}-response.directive.html.
            #    * A HTML file called
            #      {InteractionName}-short-response.directive.html.
            #  Optional:
            #    * A TS file called
            #      {InteractionName}-validation.service.specs.ts.
            #    * A TS file called {InteractionName}-rules.service.specs.ts.

            hyphenated_interaction_id = (
                utils.camelcase_to_hyphenated(interaction_id))
            if interaction_id in INTERACTIONS_THAT_USE_COMPONENTS:
                interaction_ts_file = os.path.join(
                    directives_dir, 'oppia-interactive-%s.component.ts' % (
                        hyphenated_interaction_id))
                response_ts_file = os.path.join(
                    directives_dir, 'oppia-response-%s.component.ts'
                    % hyphenated_interaction_id)
                short_response_ts_file = os.path.join(
                    directives_dir, 'oppia-short-response-%s.component.ts' % (
                        hyphenated_interaction_id))
                rules_service_ts_file = os.path.join(
                    directives_dir, '%s-rules.service.ts'
                    % hyphenated_interaction_id)
                validation_service_ts_file = os.path.join(
                    directives_dir, '%s-validation.service.ts'
                    % hyphenated_interaction_id)
                interaction_html = os.path.join(
                    directives_dir,
                    '%s-interaction.component.html' % hyphenated_interaction_id)
                response_html = os.path.join(
                    directives_dir,
                    '%s-response.component.html' % hyphenated_interaction_id)
                short_response_html = os.path.join(
                    directives_dir,
                    '%s-short-response.component.html' %
                    hyphenated_interaction_id)
            else:
                interaction_ts_file = os.path.join(
                    directives_dir, 'oppia-interactive-%s.directive.ts' % (
                        hyphenated_interaction_id))
                response_ts_file = os.path.join(
                    directives_dir, 'oppia-response-%s.directive.ts'
                    % hyphenated_interaction_id)
                short_response_ts_file = os.path.join(
                    directives_dir, 'oppia-short-response-%s.directive.ts' % (
                        hyphenated_interaction_id))
                rules_service_ts_file = os.path.join(
                    directives_dir, '%s-rules.service.ts'
                    % hyphenated_interaction_id)
                validation_service_ts_file = os.path.join(
                    directives_dir, '%s-validation.service.ts'
                    % hyphenated_interaction_id)
                interaction_html = os.path.join(
                    directives_dir,
                    '%s-interaction.directive.html' % hyphenated_interaction_id)
                response_html = os.path.join(
                    directives_dir,
                    '%s-response.directive.html' % hyphenated_interaction_id)
                short_response_html = os.path.join(
                    directives_dir,
                    '%s-short-response.directive.html' %
                    hyphenated_interaction_id)

            self.assertTrue(os.path.isfile(interaction_ts_file))
            self.assertTrue(os.path.isfile(response_ts_file))
            self.assertTrue(os.path.isfile(
                short_response_ts_file))
            self.assertTrue(os.path.isfile(interaction_html))
            self.assertTrue(os.path.isfile(response_html))
            self.assertTrue(os.path.isfile(short_response_html))
            self.assertTrue(os.path.isfile(rules_service_ts_file))
            self.assertTrue(os.path.isfile(validation_service_ts_file))

            # Check that the PNG thumbnail image has the correct dimensions.
            static_dir = os.path.join(interaction_dir, 'static')
            self.assertTrue(os.path.isdir(static_dir))
            png_file = os.path.join(
                interaction_dir, 'static', '%s.png' % interaction_id)
            self.assertTrue(os.path.isfile(png_file))
            with utils.open_file(png_file, 'rb', encoding=None) as f:
                img_data = f.read()
                width, height = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(width), INTERACTION_THUMBNAIL_WIDTH_PX)
                self.assertEqual(
                    int(height), INTERACTION_THUMBNAIL_HEIGHT_PX)

            interaction_ts_file_content = utils.get_file_contents(
                interaction_ts_file)
            response_ts_file_content = utils.get_file_contents(
                response_ts_file)
            short_response_ts_file_content = (
                utils.get_file_contents(short_response_ts_file))
            ts_file_content = utils.get_file_contents(ts_file)
            rules_service_ts_file_content = utils.get_file_contents(
                rules_service_ts_file)
            validation_service_ts_file_content = utils.get_file_contents(
                validation_service_ts_file)

            self.assertIn(
                'oppiaInteractive%s' % interaction_id,
                interaction_ts_file_content)
            self.assertIn(
                'oppiaResponse%s' % interaction_id,
                response_ts_file_content)
            self.assertIn(
                'oppiaShortResponse%s' % interaction_id,
                short_response_ts_file_content)
            self.assertIn(
                '%sRulesService' % (
                    interaction_id[0] + interaction_id[1:]),
                rules_service_ts_file_content)
            self.assertIn(
                '%sValidationService' % interaction_id,
                validation_service_ts_file_content)

            # Check that the html template includes js script for the
            # interaction.
            self.assertTrue(
                'oppia-interactive-%s.component.ts' %
                hyphenated_interaction_id in ts_file_content or (
                    'oppia-interactive-%s.directive.ts' %
                    hyphenated_interaction_id in ts_file_content))
            self.assertTrue(
                'oppia-response-%s.component.ts' %
                hyphenated_interaction_id in ts_file_content or (
                    'oppia-response-%s.directive.ts' %
                    hyphenated_interaction_id in ts_file_content))
            self.assertTrue(
                'oppia-short-response-%s.component.ts' %
                hyphenated_interaction_id in ts_file_content or (
                    'oppia-short-response-%s.directive.ts' %
                    hyphenated_interaction_id in ts_file_content))
            self.assertIn(
                '%s-rules.service.ts' % hyphenated_interaction_id,
                ts_file_content)
            self.assertIn(
                '%s-validation.service.ts' % hyphenated_interaction_id,
                ts_file_content)

            self.assertNotIn(
                '<script>', interaction_ts_file_content)
            self.assertNotIn(
                '</script>', interaction_ts_file_content)
            self.assertNotIn('<script>', response_ts_file_content)
            self.assertNotIn(
                '</script>', response_ts_file_content)
            self.assertNotIn(
                '<script>', short_response_ts_file_content)
            self.assertNotIn(
                '</script>', short_response_ts_file_content)
            self.assertNotIn('<script>', rules_service_ts_file_content)
            self.assertNotIn('</script>', rules_service_ts_file_content)
            self.assertNotIn('<script>', validation_service_ts_file_content)
            self.assertNotIn(
                '</script>', validation_service_ts_file_content)

            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)

            # Check that the specified interaction id is the same as the class
            # name.
            self.assertTrue(interaction_id, msg=interaction.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _INTERACTION_CONFIG_SCHEMA:
                self.assertIsInstance(getattr(interaction, item), item_type)
                if item_type == str:
                    self.assertTrue(getattr(interaction, item))

            self.assertIn(interaction.display_mode, base.ALLOWED_DISPLAY_MODES)

            if interaction.is_linear or interaction.is_terminal:
                self.assertIsNone(interaction.answer_type)
            else:
                # Check that the answer_type corresponds to a valid object
                # class.
                # Ruling out the possibility of None answer_type for mypy type
                # checking, because in the above 'if' clause we are already
                # checking for None answer_type.
                assert interaction.answer_type is not None
                object_registry.Registry.get_object_class_by_type(
                    interaction.answer_type)

            self._validate_customization_arg_specs(
                interaction.customization_arg_specs)

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
                self.assertIsInstance(interaction.instructions, str)
                self.assertIsNotNone(interaction.instructions)
                self.assertIsNotNone(interaction.narrow_instructions)

            # Check that terminal interactions are not linear.
            if interaction.is_terminal:
                self.assertFalse(interaction.is_linear)

            # Check that only linear interactions have a
            # default_outcome_heading property.
            if interaction.is_linear:
                self.assertTrue(
                    isinstance(interaction.default_outcome_heading, str)
                    and interaction.default_outcome_heading)
            else:
                self.assertIsNone(interaction.default_outcome_heading)

            # Check that interactions that can have solution cannot be linear.
            if interaction.can_have_solution:
                self.assertFalse(interaction.is_linear)

            default_object_values = object_registry.get_default_object_values()

            # Check that the rules for this interaction have object editor
            # templates and default values.
            for rule_name in list(interaction.rules_dict.keys()):
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

    def test_trainable_interactions_have_more_than_just_a_classifier(
        self
    ) -> None:
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
                    len(interaction.rules_dict), 1, msg=(
                        'Expected trainable interaction to have more '
                        'classifier: %s' % interaction_id))

    def test_linear_interactions(self) -> None:
        """Sanity-check for the number of linear interactions."""

        actual_linear_interaction_ids = self._get_linear_interaction_ids()
        self.assertEqual(len(actual_linear_interaction_ids), 1)

    def test_linear_interaction_ids_list_matches_linear_interactions(
        self
    ) -> None:
        """Sanity-check the feconf constant which lists all linear interaction
        IDs.
        """
        actual_linear_interaction_ids = self._get_linear_interaction_ids()
        self.assertEqual(
            actual_linear_interaction_ids, feconf.LINEAR_INTERACTION_IDS)


class InteractionDemoExplorationUnitTests(test_utils.GenericTestBase):
    """Test that the interaction demo exploration covers all interactions."""

    _DEMO_EXPLORATION_ID: Final = '16'

    def test_interactions_demo_exploration(self) -> None:
        exp_services.load_demo(self._DEMO_EXPLORATION_ID)
        exploration = exp_fetchers.get_exploration_by_id(
            self._DEMO_EXPLORATION_ID)

        all_interaction_ids = set(
            interaction_registry.Registry.get_all_interaction_ids())
        observed_interaction_ids = set()

        for state in exploration.states.values():
            observed_interaction_ids.add(state.interaction.id)

        missing_interaction_ids = (
            all_interaction_ids - observed_interaction_ids)
        self.assertEqual(len(missing_interaction_ids), 0, msg=(
            'Missing interaction IDs in demo exploration: %s' %
            missing_interaction_ids))

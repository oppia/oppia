# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Lint checks for Js and Ts files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import json
import os
import re
import subprocess
import sys
import time

import python_utils

from . import linter_utils
from .. import common

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')

ESPRIMA_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'esprima-%s' % common.ESPRIMA_VERSION)

sys.path.insert(1, ESPRIMA_PATH)

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position
import esprima  # isort:skip
from .. import build  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

FILES_EXCLUDED_FROM_ANY_TYPE_CHECK_PATH = os.path.join(
    CURR_DIR, 'scripts', 'linters', 'excluded_any_type_files.json')

FILES_EXCLUDED_FROM_ANY_TYPE_CHECK = json.load(python_utils.open_file(
    FILES_EXCLUDED_FROM_ANY_TYPE_CHECK_PATH, 'r'))


def _get_expression_from_node_if_one_exists(
        parsed_node, components_to_check):
    """This function first checks whether the parsed node represents
    the required angular component that needs to be derived by checking if
    its in the 'components_to_check' list. If yes, then it  will return the
    expression part of the node from which the component can be derived.
    If no, it will return None. It is done by filtering out
    'AssignmentExpression' (as it represents an assignment) and 'Identifier'
    (as it represents a static expression).

    Args:
        parsed_node: dict. Parsed node of the body of a JS file.
        components_to_check: list(str). List of angular components to check
            in a JS file. These include directives, factories, controllers,
            etc.

    Returns:
        expression: dict or None. Expression part of the node if the node
            represents a component else None.
    """
    if parsed_node.type != 'ExpressionStatement':
        return
    # Separate the expression part of the node which is the actual
    # content of the node.
    expression = parsed_node.expression
    # Check whether the expression belongs to a
    # 'CallExpression' which always contains a call
    # and not an 'AssignmentExpression'.
    # For example, func() is a CallExpression.
    if expression.type != 'CallExpression':
        return
    # Check whether the expression belongs to a 'MemberExpression' which
    # represents a computed expression or an Identifier which represents
    # a static expression.
    # For example, 'thing.func' is a MemberExpression where
    # 'thing' is the object of the MemberExpression and
    # 'func' is the property of the MemberExpression.
    # Another example of a MemberExpression within a CallExpression is
    # 'thing.func()' where 'thing.func' is the callee of the CallExpression.
    if expression.callee.type != 'MemberExpression':
        return
    # Get the component in the JS file.
    component = expression.callee.property.name
    if component not in components_to_check:
        return
    return expression


class JsTsLintChecksManager(python_utils.OBJECT):
    """Manages all the Js and Ts linting functions.

    Attributes:
        all_filepaths: list(str). The list of filepaths to be linted.
        js_filepaths: list(str): The list of js filepaths to be linted.
        ts_filepaths: list(str): The list of ts filepaths to be linted.
        parsed_js_and_ts_files: dict. Contains the content of JS files, after
            validating and parsing the files.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(self, js_files, ts_files, verbose_mode_enabled):
        """Constructs a JsTsLintChecksManager object.

        Args:
            js_files: list(str). The list of js filepaths to be linted.
            ts_files: list(str). The list of ts filepaths to be linted.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']

        self.js_files = js_files
        self.ts_files = ts_files
        self.verbose_mode_enabled = verbose_mode_enabled
        self.parsed_js_and_ts_files = []
        self.parsed_expressions_in_files = []

    @property
    def js_filepaths(self):
        """Return all js filepaths."""
        return self.js_files

    @property
    def ts_filepaths(self):
        """Return all ts filepaths."""
        return self.ts_files

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.js_filepaths + self.ts_filepaths

    def _validate_and_parse_js_and_ts_files(self):
        """This function validates JavaScript and Typescript files and
        returns the parsed contents as a Python dictionary.

        Returns:
            dict. contains the contents of js and ts files after
            validating and parsing the files.
        """

        # Select JS files which need to be checked.
        files_to_check = self.all_filepaths
        parsed_js_and_ts_files = dict()
        if not files_to_check:
            return parsed_js_and_ts_files
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Validating and parsing JS and TS files ...')
        for filepath in files_to_check:
            if self.verbose_mode_enabled:
                python_utils.PRINT(
                    'Validating and parsing %s file ...' % filepath)
            file_content = FILE_CACHE.read(filepath)

            try:
                # Use esprima to parse a JS or TS file.
                parsed_js_and_ts_files[filepath] = esprima.parseScript(
                    file_content, comment=True)
            except Exception:
                if filepath.endswith('.js'):
                    raise
                # Compile typescript file which has syntax invalid for JS file.
                with linter_utils.temp_dir(prefix='tmpcompiledjs',
                                           parent=os.getcwd()) as temp_dir:
                    compiled_js_filepath = self._compile_ts_file(
                        filepath, temp_dir)
                    file_content = FILE_CACHE.read(compiled_js_filepath)
                    parsed_js_and_ts_files[filepath] = esprima.parseScript(
                        file_content)

        return parsed_js_and_ts_files

    def _get_expressions_from_parsed_script(self):
        """This function returns the expressions in the script parsed using
        js and ts files.

        Returns:
            dict. contains the expressions in the script parsed using js
            and ts files.
        """

        parsed_expressions_in_files = collections.defaultdict(dict)
        components_to_check = ['controller', 'directive', 'factory', 'filter']

        for filepath, parsed_script in self.parsed_js_and_ts_files.items():
            parsed_expressions_in_files[filepath] = collections.defaultdict(
                list)
            parsed_nodes = parsed_script.body
            for parsed_node in parsed_nodes:
                for component in components_to_check:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, [component])
                    parsed_expressions_in_files[filepath][component].append(
                        expression)

        return parsed_expressions_in_files

    def _compile_ts_file(self, filepath, dir_path):
        """Compiles a typescript file and returns the path for compiled
        js file.
        """
        cmd = (
            './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
            '-lib %s -noImplicitUseStrict %s -skipLibCheck '
            '%s -target %s -typeRoots %s %s typings/*') % (
                dir_path, 'true', 'es2017,dom', 'true',
                'true', 'es5', './node_modules/@types', filepath)
        subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)
        compiled_js_filepath = os.path.join(
            dir_path, os.path.basename(filepath).replace('.ts', '.js'))
        return compiled_js_filepath

    def _check_any_type(self):
        """Checks if the type of any variable is declared as 'any'
        in TypeScript files.
        """

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting any type check')
            python_utils.PRINT('----------------------------------------')

        # This pattern is used to match cases like ': any'.
        any_type_pattern = r':\ *any'

        # This pattern is used to match cases where the previous line ended
        # with a ':', so we know this line begins with a type.
        starts_with_any_pattern = r'^\ *any'

        with linter_utils.redirect_stdout(sys.stdout):
            failed = False

            for file_path in self.all_filepaths:
                if file_path in FILES_EXCLUDED_FROM_ANY_TYPE_CHECK:
                    continue

                file_content = FILE_CACHE.read(file_path)
                starts_with_type = False

                for line_number, line in enumerate(file_content.split('\n')):
                    if starts_with_type and re.findall(
                            starts_with_any_pattern, line):
                        failed = True
                        python_utils.PRINT(
                            '%s --> ANY type found in this file. Line no.'
                            ' %s' % (file_path, line_number + 1))
                        python_utils.PRINT('')

                    if re.findall(any_type_pattern, line):
                        failed = True
                        python_utils.PRINT(
                            '%s --> ANY type found in this file. Line no.'
                            ' %s' % (file_path, line_number + 1))
                        python_utils.PRINT('')

                    if line:
                        starts_with_type = line[len(line) - 1] == ':'

            if failed:
                summary_message = (
                    '%s ANY type check failed' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s ANY type check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))

            python_utils.PRINT(summary_message)
            python_utils.PRINT('')

        return [summary_message]

    def _check_extra_js_files(self):
        """Checks if the changes made include extra js files in core
        or extensions folder which are not specified in
        build.JS_FILEPATHS_NOT_TO_BUILD.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting extra js files check')
            python_utils.PRINT('----------------------------------------')

        summary_messages = []
        failed = False
        stdout = sys.stdout
        with linter_utils.redirect_stdout(stdout):
            js_files_to_check = self.js_filepaths

            for filepath in js_files_to_check:
                if filepath.startswith(('core/templates', 'extensions')) and (
                        filepath not in build.JS_FILEPATHS_NOT_TO_BUILD) and (
                            not filepath.endswith('protractor.js')):
                    python_utils.PRINT(
                        '%s  --> Found extra .js file\n' % filepath)
                    failed = True

            if failed:
                err_msg = (
                    'If you want the above files to be present as js files, '
                    'add them to the list JS_FILEPATHS_NOT_TO_BUILD in '
                    'build.py. Otherwise, rename them to .ts\n')
                python_utils.PRINT(err_msg)

            if failed:
                summary_message = (
                    '%s Extra JS files check failed, see '
                    'message above on resolution steps.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Extra JS files check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
            summary_messages.append(summary_message)
            python_utils.PRINT(summary_message)
            python_utils.PRINT('')
        return summary_messages

    def _check_js_and_ts_component_name_and_count(self):
        """This function ensures that all JS/TS files have exactly
        one component and and that the name of the component
        matches the filename.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting js component name and count check')
            python_utils.PRINT('----------------------------------------')
        # Select JS files which need to be checked.
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            filepath.endswith('App.ts')]
        failed = False
        summary_messages = []
        components_to_check = ['controller', 'directive', 'factory', 'filter']
        stdout = sys.stdout
        for filepath in files_to_check:
            component_num = 0
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with linter_utils.redirect_stdout(stdout):
                for component in components_to_check:
                    if component_num > 1:
                        break
                    for expression in parsed_expressions[component]:
                        if not expression:
                            continue
                        component_num += 1
                        # Check if the number of components in each file exceeds
                        # one.
                        if component_num > 1:
                            python_utils.PRINT(
                                '%s -> Please ensure that there is exactly one '
                                'component in the file.' % (filepath))
                            failed = True
                            break

        with linter_utils.redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s JS and TS Component name and count check failed, '
                    'see messages above for duplicate names.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s JS and TS Component name and count check passed' %
                    (linter_utils.SUCCESS_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
        return summary_messages

    def _check_directive_scope(self):
        """This function checks that all directives have an explicit
        scope: {} and it should not be scope: true.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting directive scope check')
            python_utils.PRINT('----------------------------------------')
        # Select JS and TS files which need to be checked.
        files_to_check = self.all_filepaths
        failed = False
        summary_messages = []
        components_to_check = ['directive']

        stdout = sys.stdout
        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with linter_utils.redirect_stdout(stdout):
                # Parse the body of the content as nodes.
                for component in components_to_check:
                    for expression in parsed_expressions[component]:
                        if not expression:
                            continue
                        # Separate the arguments of the expression.
                        arguments = expression.arguments
                        # The first argument of the expression is the
                        # name of the directive.
                        if arguments[0].type == 'Literal':
                            directive_name = python_utils.UNICODE(
                                arguments[0].value)
                        arguments = arguments[1:]
                        for argument in arguments:
                            # Check the type of an argument.
                            if argument.type != 'ArrayExpression':
                                continue
                            # Separate out the elements for the argument.
                            elements = argument.elements
                            for element in elements:
                                # Check the type of an element.
                                if element.type != 'FunctionExpression':
                                    continue
                                # Separate out the body of the element.
                                body = element.body
                                if body.type != 'BlockStatement':
                                    continue
                                # Further separate the body elements from the
                                # body.
                                body_elements = body.body
                                for body_element in body_elements:
                                    # Check if the body element is a return
                                    # statement.
                                    body_element_type_is_not_return = (
                                        body_element.type != 'ReturnStatement')
                                    arg_type = (
                                        body_element.argument and
                                        body_element.argument.type)
                                    body_element_arg_type_is_not_object = (
                                        arg_type != 'ObjectExpression')
                                    if (body_element_arg_type_is_not_object or
                                            body_element_type_is_not_return):
                                        continue
                                    # Separate the properties of the return
                                    # node.
                                    return_node_properties = (
                                        body_element.argument.properties)
                                    # Loop over all the properties of the return
                                    # node to find out the scope key.
                                    for return_node_property in (
                                            return_node_properties):
                                        # Check whether the property is scope.
                                        property_key_is_an_identifier = (
                                            return_node_property.key.type == (
                                                'Identifier'))
                                        property_key_name_is_scope = (
                                            return_node_property.key.name == (
                                                'scope'))
                                        if (
                                                property_key_is_an_identifier
                                                and (
                                                    property_key_name_is_scope
                                                    )):
                                            # Separate the scope value and
                                            # check if it is an Object
                                            # Expression. If it is not, then
                                            # check for scope: true and report
                                            # the error message.
                                            scope_value = (
                                                return_node_property.value)
                                            if (
                                                    scope_value.type == (
                                                        'Literal')
                                                    and (
                                                        scope_value.value)):
                                                failed = True
                                                python_utils.PRINT(
                                                    'Please ensure that %s '
                                                    'directive in %s file '
                                                    'does not have scope set '
                                                    'to true.' %
                                                    (directive_name, filepath))
                                                python_utils.PRINT('')
                                            elif scope_value.type != (
                                                    'ObjectExpression'):
                                                # Check whether the directive
                                                # has scope: {} else report
                                                # the error message.
                                                failed = True
                                                python_utils.PRINT(
                                                    'Please ensure that %s '
                                                    'directive in %s file has '
                                                    'a scope: {}.' % (
                                                        directive_name, filepath
                                                        ))
                                                python_utils.PRINT('')

        with linter_utils.redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s Directive scope check failed, '
                    'see messages above for suggested fixes.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s Directive scope check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
        return summary_messages

    def _check_sorted_dependencies(self):
        """This function checks that the dependencies which are
        imported in the controllers/directives/factories in JS
        files are in following pattern: dollar imports, regular
        imports, and constant imports, all in sorted order.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting sorted dependencies check')
            python_utils.PRINT('----------------------------------------')
        files_to_check = self.all_filepaths
        components_to_check = ['controller', 'directive', 'factory']
        failed = False
        summary_messages = []

        stdout = sys.stdout
        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
            with linter_utils.redirect_stdout(stdout):
                for component in components_to_check:
                    for expression in parsed_expressions[component]:
                        if not expression:
                            continue
                        # Separate the arguments of the expression.
                        arguments = expression.arguments
                        if arguments[0].type == 'Literal':
                            property_value = python_utils.UNICODE(
                                arguments[0].value)
                        arguments = arguments[1:]
                        for argument in arguments:
                            if argument.type != 'ArrayExpression':
                                continue
                            literal_args = []
                            function_args = []
                            dollar_imports = []
                            regular_imports = []
                            constant_imports = []
                            elements = argument.elements
                            for element in elements:
                                if element.type == 'Literal':
                                    literal_args.append(
                                        python_utils.UNICODE(
                                            element.value))
                                elif element.type == 'FunctionExpression':
                                    func_args = element.params
                                    for func_arg in func_args:
                                        function_args.append(
                                            python_utils.UNICODE(func_arg.name))
                            for arg in function_args:
                                if arg.startswith('$'):
                                    dollar_imports.append(arg)
                                elif re.search('[a-z]', arg):
                                    regular_imports.append(arg)
                                else:
                                    constant_imports.append(arg)
                            dollar_imports.sort()
                            regular_imports.sort()
                            constant_imports.sort()
                            sorted_imports = (
                                dollar_imports + regular_imports + (
                                    constant_imports))
                            if sorted_imports != function_args:
                                failed = True
                                python_utils.PRINT(
                                    'Please ensure that in %s in file %s, the '
                                    'injected dependencies should be in the '
                                    'following manner: dollar imports, regular '
                                    'imports and constant imports, all in '
                                    'sorted order.'
                                    % (property_value, filepath))
                            if sorted_imports != literal_args:
                                failed = True
                                python_utils.PRINT(
                                    'Please ensure that in %s in file %s, the '
                                    'stringfied dependencies should be in the '
                                    'following manner: dollar imports, regular '
                                    'imports and constant imports, all in '
                                    'sorted order.'
                                    % (property_value, filepath))
        with linter_utils.redirect_stdout(stdout):
            if failed:
                summary_message = (
                    '%s Sorted dependencies check failed, fix files that '
                    'that don\'t have sorted dependencies mentioned above.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Sorted dependencies check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))

        summary_messages.append(summary_message)
        python_utils.PRINT('')
        python_utils.PRINT(summary_message)
        if self.verbose_mode_enabled:
            python_utils.PRINT('----------------------------------------')
        return summary_messages

    def _match_line_breaks_in_controller_dependencies(self):
        """This function checks whether the line breaks between the dependencies
        listed in the controller of a directive or service exactly match those
        between the arguments of the controller function.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT(
                'Starting controller dependency line break check')
            python_utils.PRINT('----------------------------------------')
        files_to_check = self.all_filepaths
        failed = False
        summary_messages = []

        # For RegExp explanation, please see https://regex101.com/r/T85GWZ/2/.
        pattern_to_match = (
            r'controller.* \[(?P<stringfied_dependencies>[\S\s]*?)' +
            r'function\((?P<function_parameters>[\S\s]*?)\)')
        stdout = sys.stdout
        with linter_utils.redirect_stdout(stdout):
            for filepath in files_to_check:
                file_content = FILE_CACHE.read(filepath)
                matched_patterns = re.findall(pattern_to_match, file_content)
                for matched_pattern in matched_patterns:
                    stringfied_dependencies, function_parameters = (
                        matched_pattern)
                    stringfied_dependencies = (
                        stringfied_dependencies.strip().replace(
                            '\'', '').replace(' ', ''))[:-1]
                    function_parameters = (
                        function_parameters.strip().replace(' ', ''))
                    if stringfied_dependencies != function_parameters:
                        failed = True
                        python_utils.PRINT(
                            'Please ensure that in file %s the line breaks '
                            'pattern between the dependencies mentioned as '
                            'strings:\n[%s]\nand the dependencies mentioned '
                            'as function parameters: \n(%s)\nfor the '
                            'corresponding controller should '
                            'exactly match.' % (
                                filepath, stringfied_dependencies,
                                function_parameters))
                        python_utils.PRINT('')

            if failed:
                summary_message = (
                    '%s Controller dependency line break check failed, '
                    'see messages above for the affected files.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s Controller dependency line break check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')
        return summary_messages

    def _check_constants_declaration(self):
        """Checks the declaration of constants in the TS files to ensure that
        the constants are not declared in files other than *.constants.ajs.ts
        and that the constants are declared only single time. This also checks
        that the constants are declared in both *.constants.ajs.ts (for
        AngularJS) and in *.constants.ts (for Angular 8).
        """

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting constants declaration check')
            python_utils.PRINT('----------------------------------------')

        summary_messages = []
        failed = False
        stdout = sys.stdout

        with linter_utils.redirect_stdout(stdout):
            ts_files_to_check = self.ts_filepaths
            constants_to_source_filepaths_dict = {}
            angularjs_source_filepaths_to_constants_dict = {}
            for filepath in ts_files_to_check:
                # The following block extracts the corresponding Angularjs
                # constants file for the Angular constants file. This is
                # required since the check cannot proceed if the AngularJS
                # constants file is not provided before the Angular constants
                # file.
                if filepath.endswith('.constants.ts'):
                    filename_without_extension = filepath[:-3]
                    corresponding_angularjs_filepath = (
                        filename_without_extension + '.ajs.ts')
                    with linter_utils.temp_dir(parent=os.getcwd()) as temp_dir:
                        if os.path.isfile(corresponding_angularjs_filepath):
                            compiled_js_filepath = self._compile_ts_file(
                                corresponding_angularjs_filepath, temp_dir)
                            file_content = FILE_CACHE.read(
                                compiled_js_filepath).decode('utf-8')

                            parsed_script = esprima.parseScript(file_content)
                            parsed_nodes = parsed_script.body
                            angularjs_constants_list = []
                            components_to_check = ['constant']
                            for parsed_node in parsed_nodes:
                                expression = (
                                    _get_expression_from_node_if_one_exists(
                                        parsed_node, components_to_check))
                                if not expression:
                                    continue
                                else:
                                    # The following block populates a set to
                                    # store constants for the Angular-AngularJS
                                    # constants file consistency check.
                                    angularjs_constants_name = (
                                        expression.arguments[0].value)
                                    angularjs_constants_value = (
                                        expression.arguments[1].property.name)
                                    if angularjs_constants_value != (
                                            angularjs_constants_name):
                                        failed = True
                                        python_utils.PRINT(
                                            '%s --> Please ensure that the '
                                            'constant %s is initialized '
                                            'from the value from the '
                                            'corresponding Angular constants'
                                            ' file (the *.constants.ts '
                                            'file). Please create one in the'
                                            ' Angular constants file if it '
                                            'does not exist there.' % (
                                                filepath,
                                                angularjs_constants_name))
                                    angularjs_constants_list.append(
                                        angularjs_constants_name)
                            angularjs_constants_set = set(
                                angularjs_constants_list)
                            if len(angularjs_constants_set) != len(
                                    angularjs_constants_list):
                                failed = True
                                python_utils.PRINT(
                                    '%s --> Duplicate constant declaration '
                                    'found.' % (
                                        corresponding_angularjs_filepath))
                            angularjs_source_filepaths_to_constants_dict[
                                corresponding_angularjs_filepath] = (
                                    angularjs_constants_set)
                        else:
                            failed = True
                            python_utils.PRINT(
                                '%s --> Corresponding AngularJS constants '
                                'file not found.' % filepath)

                # Check that the constants are declared only in a
                # *.constants.ajs.ts file.
                if not filepath.endswith('.constants.ajs.ts'):
                    for line_num, line in enumerate(FILE_CACHE.readlines(
                            filepath)):
                        if 'oppia.constant(' in line:
                            failed = True
                            python_utils.PRINT(
                                '%s --> Constant declaration found at line '
                                '%s. Please declare the constants in a '
                                'separate constants file.' % (
                                    filepath, line_num))

                # Check if the constant has multiple declarations which is
                # prohibited.
                parsed_script = self.parsed_js_and_ts_files[filepath]
                parsed_nodes = parsed_script.body
                components_to_check = ['constant']
                angular_constants_list = []
                for parsed_node in parsed_nodes:
                    expression = _get_expression_from_node_if_one_exists(
                        parsed_node, components_to_check)
                    if not expression:
                        continue
                    else:
                        constant_name = expression.arguments[0].raw
                        if constant_name in constants_to_source_filepaths_dict:
                            failed = True
                            python_utils.PRINT(
                                '%s --> The constant %s is already declared '
                                'in %s. Please import the file where the '
                                'constant is declared or rename the constant'
                                '.' % (
                                    filepath, constant_name,
                                    constants_to_source_filepaths_dict[
                                        constant_name]))
                        else:
                            constants_to_source_filepaths_dict[
                                constant_name] = filepath

                # Checks that the *.constants.ts and the corresponding
                # *.constants.ajs.ts file are in sync.
                if filepath.endswith('.constants.ts'):
                    angular_constants_nodes = (
                        parsed_nodes[1].declarations[0].init.callee.body.body)
                    for angular_constant_node in angular_constants_nodes:
                        if not angular_constant_node.expression:
                            continue
                        angular_constant_name = (
                            angular_constant_node.expression.left.property.name)
                        angular_constants_list.append(angular_constant_name)

                    angular_constants_set = set(angular_constants_list)
                    if len(angular_constants_set) != len(
                            angular_constants_list):
                        failed = True
                        python_utils.PRINT(
                            '%s --> Duplicate constant declaration found.'
                            % filepath)
                    if corresponding_angularjs_filepath in (
                            angularjs_source_filepaths_to_constants_dict):
                        angular_minus_angularjs_constants = (
                            angular_constants_set.difference(
                                angularjs_source_filepaths_to_constants_dict[
                                    corresponding_angularjs_filepath]))
                        for constant in angular_minus_angularjs_constants:
                            failed = True
                            python_utils.PRINT(
                                '%s --> The constant %s is not declared '
                                'in the corresponding angularjs '
                                'constants file.' % (filepath, constant))

            if failed:
                summary_message = (
                    '%s Constants declaration check failed, '
                    'see messages above for constants with errors.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Constants declaration check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
            summary_messages.append(summary_message)
            python_utils.PRINT(summary_message)

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no JavaScript or Typescript files to lint.')
            return []

        self.parsed_js_and_ts_files = self._validate_and_parse_js_and_ts_files()
        self.parsed_expressions_in_files = (
            self._get_expressions_from_parsed_script())

        any_type_messages = self._check_any_type()
        extra_js_files_messages = self._check_extra_js_files()
        js_and_ts_component_messages = (
            self._check_js_and_ts_component_name_and_count())
        directive_scope_messages = self._check_directive_scope()
        sorted_dependencies_messages = self._check_sorted_dependencies()
        controller_dependency_messages = (
            self._match_line_breaks_in_controller_dependencies())

        all_messages = (
            any_type_messages + extra_js_files_messages +
            js_and_ts_component_messages + directive_scope_messages +
            sorted_dependencies_messages + controller_dependency_messages)
        return all_messages


class ThirdPartyJsTsLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions.

    Attributes:
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a ThirdPartyJsTsLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(ThirdPartyJsTsLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    def _lint_js_and_ts_files(self):
        """Prints a list of lint errors in the given list of JavaScript files.

        Returns:
            summary_messages: list(str). Summary of lint check.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        eslint_path = os.path.join(
            'node_modules', 'eslint', 'bin', 'eslint.js')
        if not os.path.exists(eslint_path):
            python_utils.PRINT('')
            python_utils.PRINT(
                'ERROR    Please run start.sh first to install node-eslint ')
            python_utils.PRINT(
                '         and its dependencies.')
            sys.exit(1)

        files_to_lint = self.all_filepaths
        start_time = time.time()
        num_files_with_errors = 0
        summary_messages = []

        num_js_and_ts_files = len(files_to_lint)
        python_utils.PRINT('Total js and ts files: ', num_js_and_ts_files)
        eslint_cmd_args = [node_path, eslint_path, '--quiet']
        result_list = []
        python_utils.PRINT('Linting JS and TS files.')
        for _, filepath in enumerate(files_to_lint):
            if self.verbose_mode_enabled:
                python_utils.PRINT('Linting: ', filepath)
            proc_args = eslint_cmd_args + [filepath]
            proc = subprocess.Popen(
                proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
            linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
            linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
            if linter_stderr:
                python_utils.PRINT('LINTER FAILED')
                python_utils.PRINT(linter_stderr)
                sys.exit(1)

            if linter_stdout:
                num_files_with_errors += 1
                result_list.append(linter_stdout)

        if num_files_with_errors:
            for error in result_list:
                python_utils.PRINT(error)
                summary_messages.append(error)
            summary_message = (
                '%s %s JavaScript and Typescript files' % (
                    linter_utils.FAILED_MESSAGE_PREFIX, num_files_with_errors))
        else:
            summary_message = (
                '%s %s JavaScript and Typescript files linted (%.1f secs)' % (
                    linter_utils.SUCCESS_MESSAGE_PREFIX, num_js_and_ts_files,
                    time.time() - start_time))
        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)

        python_utils.PRINT('Js and Ts linting finished.')

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no JavaScript or Typescript files to lint.')
            return []

        return self._lint_js_and_ts_files()


def get_linters(js_filepaths, ts_filepaths, verbose_mode_enabled=False):
    """Creates JsTsLintChecksManager and ThirdPartyJsTsLintChecksManager
        objects and return them.

    Args:
        js_filepaths: list(str). A list of js filepaths to lint.
        ts_filepaths: list(str). A list of ts filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(JsTsLintChecksManager, ThirdPartyJsTsLintChecksManager. A 2-tuple
        of custom and third_party linter objects.
    """
    js_ts_file_paths = js_filepaths + ts_filepaths

    custom_linter = JsTsLintChecksManager(
        js_filepaths, ts_filepaths, verbose_mode_enabled)

    third_party_linter = ThirdPartyJsTsLintChecksManager(
        js_ts_file_paths, verbose_mode_enabled)

    return custom_linter, third_party_linter

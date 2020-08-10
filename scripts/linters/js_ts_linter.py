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
import shutil
import subprocess
import sys

import python_utils

from .. import build
from .. import common
from .. import concurrent_task_utils

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')

ESPRIMA_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'esprima-%s' % common.ESPRIMA_VERSION)

sys.path.insert(1, ESPRIMA_PATH)

import esprima  # isort:skip pylint: disable=wrong-import-order, wrong-import-position

COMPILED_TYPESCRIPT_TMP_PATH = 'tmpcompiledjs/'

TS_IGNORE_EXCEPTIONS_FILEPATH = os.path.join(
    CURR_DIR, 'scripts', 'linters', 'ts_ignore_exceptions.json')

TS_IGNORE_EXCEPTIONS = json.load(python_utils.open_file(
    TS_IGNORE_EXCEPTIONS_FILEPATH, 'r'))


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


def compile_all_ts_files():
    """Compiles all project typescript files into
    COMPILED_TYPESCRIPT_TMP_PATH. Previously, we only compiled
    the TS files that were needed, but when a relative import was used, the
    linter would crash with a FileNotFound exception before being able to
    run. For more details, please see issue #9458.
    """
    cmd = ('./node_modules/typescript/bin/tsc -p %s -outDir %s') % (
        './tsconfig.json', COMPILED_TYPESCRIPT_TMP_PATH)
    subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)


class JsTsLintChecksManager(python_utils.OBJECT):
    """Manages all the Js and Ts linting functions."""

    def __init__(self, js_files, ts_files, file_cache):
        """Constructs a JsTsLintChecksManager object.

        Args:
            js_files: list(str). The list of js filepaths to be linted.
            ts_files: list(str). The list of ts filepaths to be linted.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']

        self.js_files = js_files
        self.ts_files = ts_files
        self.file_cache = file_cache
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
            dict. A dict which has key as filepath and value as contents of js
            and ts files after validating and parsing the files.
        """

        # Select JS files which need to be checked.
        files_to_check = self.all_filepaths
        parsed_js_and_ts_files = dict()
        concurrent_task_utils.log('Validating and parsing JS and TS files ...')
        for filepath in files_to_check:
            file_content = self.file_cache.read(filepath)

            try:
                # Use esprima to parse a JS or TS file.
                parsed_js_and_ts_files[filepath] = esprima.parseScript(
                    file_content, comment=True)
            except Exception:
                if filepath.endswith('.js'):
                    raise
                # Compile typescript file which has syntax invalid for JS file.
                compiled_js_filepath = self._get_compiled_ts_filepath(filepath)

                file_content = self.file_cache.read(compiled_js_filepath)
                parsed_js_and_ts_files[filepath] = esprima.parseScript(
                    file_content)

        return parsed_js_and_ts_files

    def _get_expressions_from_parsed_script(self):
        """This function returns the expressions in the script parsed using
        js and ts files.

        Returns:
            dict. A dict which has key as filepath and value as the expressions
            in the script parsed using js and ts files.
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

    def _get_compiled_ts_filepath(self, filepath):
        """Returns the path for compiled ts file.

        Args:
            filepath: str. Filepath of ts file.

        Returns:
            str. Filepath of compiled ts file.
        """
        compiled_js_filepath = os.path.join(
            os.getcwd(),
            COMPILED_TYPESCRIPT_TMP_PATH,
            os.path.relpath(filepath).replace('.ts', '.js'))
        return compiled_js_filepath

    def _check_http_requests(self):
        """Checks if the http requests are made only by
        backend-api.service.ts.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        http_client_pattern = r':\n? *HttpClient'

        excluded_files = [
            'core/templates/services/request-interceptor.service.spec.ts'
        ]

        error_messages = []
        name = 'HTTP request'

        failed = False

        for file_path in self.all_filepaths:
            if file_path in excluded_files:
                continue

            if file_path.endswith('backend-api.service.ts'):
                continue

            file_content = self.file_cache.read(file_path)

            if re.findall(http_client_pattern, file_content):
                failed = True
                error_message = (
                    '%s --> An instance of HttpClient is found in this '
                    'file. You are not allowed to create http requests '
                    'from files that are not backend api services.' % (
                        file_path))
                error_messages.append(error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_ts_ignore(self):
        """Checks if ts ignore is used.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Ts ignore'
        error_messages = []

        ts_ignore_pattern = r'@ts-ignore'
        comment_pattern = r'^ *// '
        comment_with_ts_error_pattern = r'^ *// This throws'
        failed = False

        for file_path in self.all_filepaths:
            file_content = self.file_cache.read(file_path)
            previous_line_has_ts_ignore = False
            previous_line_has_comment = False
            previous_line_has_comment_with_ts_error = False

            for line_number, line in enumerate(file_content.split('\n')):
                if previous_line_has_ts_ignore:
                    if file_path in TS_IGNORE_EXCEPTIONS:
                        line_contents = TS_IGNORE_EXCEPTIONS[file_path]
                        this_line_is_exception = False

                        for line_content in line_contents:
                            if line.find(line_content) != -1:
                                this_line_is_exception = True
                                break

                        if this_line_is_exception:
                            previous_line_has_ts_ignore = False
                            continue

                    failed = True
                    previous_line_has_ts_ignore = False
                    error_message = (
                        '%s --> @ts-ignore found at line %s. '
                        'Please add this exception in %s.' % (
                            file_path, line_number,
                            TS_IGNORE_EXCEPTIONS_FILEPATH))
                    error_messages.append(error_message)

                previous_line_has_ts_ignore = bool(
                    re.findall(ts_ignore_pattern, line))

                if (
                        previous_line_has_ts_ignore and
                        not previous_line_has_comment_with_ts_error):
                    failed = True
                    error_message = (
                        '%s --> Please add a comment above the @ts-ignore '
                        'explaining the @ts-ignore at line %s. The format '
                        'of comment should be -> This throws "...". This '
                        'needs to be suppressed because ...' % (
                            file_path, line_number + 1))
                    error_messages.append(error_message)

                previous_line_has_comment = bool(
                    re.findall(comment_pattern, line))

                previous_line_has_comment_with_ts_error = (
                    bool(
                        re.findall(
                            comment_with_ts_error_pattern, line))
                    or (
                        previous_line_has_comment_with_ts_error and
                        previous_line_has_comment))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_ts_expect_error(self):
        """Checks if ts expect error is used in non spec file.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Ts expect error'
        error_messages = []

        ts_expect_error_pattern = r'@ts-expect-error'
        comment_pattern = r'^ *// '
        comment_with_ts_error_pattern = r'^ *// This throws'

        failed = False
        previous_line_has_comment = False
        previous_line_has_comment_with_ts_error = False

        for file_path in self.all_filepaths:
            file_content = self.file_cache.read(file_path)
            for line_number, line in enumerate(file_content.split('\n')):
                if re.findall(ts_expect_error_pattern, line):
                    if not (
                            file_path.endswith('.spec.ts') or
                            file_path.endswith('Spec.ts')):
                        failed = True
                        error_message = (
                            '%s --> @ts-expect-error found at line %s. '
                            'It can be used only in spec files.' % (
                                file_path, line_number + 1))
                        error_messages.append(error_message)

                    if not previous_line_has_comment_with_ts_error:
                        failed = True
                        error_message = (
                            '%s --> Please add a comment above the '
                            '@ts-expect-error explaining the '
                            '@ts-expect-error at line %s. The format '
                            'of comment should be -> This throws "...". '
                            'This needs to be suppressed because ...' % (
                                file_path, line_number + 1))
                        error_messages.append(error_message)

                previous_line_has_comment = bool(
                    re.findall(comment_pattern, line))

                previous_line_has_comment_with_ts_error = (
                    bool(
                        re.findall(
                            comment_with_ts_error_pattern, line))
                    or (
                        previous_line_has_comment_with_ts_error and
                        previous_line_has_comment))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_extra_js_files(self):
        """Checks if the changes made include extra js files in core
        or extensions folder which are not specified in
        build.JS_FILEPATHS_NOT_TO_BUILD.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Extra JS files'
        error_messages = []
        failed = False
        js_files_to_check = self.js_filepaths

        for filepath in js_files_to_check:
            if filepath.startswith(('core/templates', 'extensions')) and (
                    filepath not in build.JS_FILEPATHS_NOT_TO_BUILD) and (
                        not filepath.endswith('protractor.js')):
                error_message = (
                    '%s  --> Found extra .js file\n' % filepath)
                error_messages.append(error_message)
                failed = True

        if failed:
            err_msg = (
                'If you want the above files to be present as js files, '
                'add them to the list JS_FILEPATHS_NOT_TO_BUILD in '
                'build.py. Otherwise, rename them to .ts\n')
            error_messages.append(err_msg)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_js_and_ts_component_name_and_count(self):
        """This function ensures that all JS/TS files have exactly
        one component and and that the name of the component
        matches the filename.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        # Select JS files which need to be checked.
        name = 'JS and TS component name and count'
        files_to_check = [
            filepath for filepath in self.all_filepaths if not
            filepath.endswith('App.ts')]
        failed = False
        error_messages = []
        components_to_check = ['controller', 'directive', 'factory', 'filter']
        for filepath in files_to_check:
            component_num = 0
            parsed_expressions = self.parsed_expressions_in_files[filepath]
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
                        error_message = (
                            '%s -> Please ensure that there is exactly one '
                            'component in the file.' % (filepath))
                        failed = True
                        error_messages.append(error_message)
                        break

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_directive_scope(self):
        """This function checks that all directives have an explicit
        scope: {} and it should not be scope: true.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        # Select JS and TS files which need to be checked.
        name = 'Directive scope'
        files_to_check = self.all_filepaths
        failed = False
        error_messages = []
        components_to_check = ['directive']

        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
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
                            # Further separate the body elements from the
                            # body.
                            body_elements = body.body
                            for body_element in body_elements:
                                # Check if the body element is a return
                                # statement.
                                body_element_type_is_not_return = (
                                    body_element.type != 'ReturnStatement')
                                if body_element_type_is_not_return:
                                    continue
                                arg_type = (
                                    body_element.argument and
                                    body_element.argument.type)
                                body_element_arg_type_is_not_object = (
                                    arg_type != 'ObjectExpression')
                                if body_element_arg_type_is_not_object:
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
                                            error_message = (
                                                'Please ensure that %s '
                                                'directive in %s file '
                                                'does not have scope set '
                                                'to true.' %
                                                (directive_name, filepath))
                                            error_messages.append(
                                                error_message)
                                        elif scope_value.type != (
                                                'ObjectExpression'):
                                            # Check whether the directive
                                            # has scope: {} else report
                                            # the error message.
                                            failed = True
                                            error_message = (
                                                'Please ensure that %s '
                                                'directive in %s file has '
                                                'a scope: {}.' % (
                                                    directive_name, filepath
                                                    ))
                                            error_messages.append(
                                                error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_sorted_dependencies(self):
        """This function checks that the dependencies which are
        imported in the controllers/directives/factories in JS
        files are in following pattern: dollar imports, regular
        imports, and constant imports, all in sorted order.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Sorted dependencies'
        files_to_check = self.all_filepaths
        components_to_check = ['controller', 'directive', 'factory']
        failed = False
        error_messages = []

        for filepath in files_to_check:
            parsed_expressions = self.parsed_expressions_in_files[filepath]
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
                            error_message = (
                                'Please ensure that in %s in file %s, the '
                                'injected dependencies should be in the '
                                'following manner: dollar imports, regular '
                                'imports and constant imports, all in '
                                'sorted order.'
                                % (property_value, filepath))
                            error_messages.append(error_message)
                        if sorted_imports != literal_args:
                            failed = True
                            error_message = (
                                'Please ensure that in %s in file %s, the '
                                'stringfied dependencies should be in the '
                                'following manner: dollar imports, regular '
                                'imports and constant imports, all in '
                                'sorted order.'
                                % (property_value, filepath))
                            error_messages.append(error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _match_line_breaks_in_controller_dependencies(self):
        """This function checks whether the line breaks between the dependencies
        listed in the controller of a directive or service exactly match those
        between the arguments of the controller function.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Controller dependency line break'
        files_to_check = self.all_filepaths
        failed = False
        error_messages = []

        # For RegExp explanation, please see https://regex101.com/r/T85GWZ/2/.
        pattern_to_match = (
            r'controller.* \[(?P<stringfied_dependencies>[\S\s]*?)' +
            r'function\((?P<function_parameters>[\S\s]*?)\)')

        for filepath in files_to_check:
            file_content = self.file_cache.read(filepath)
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
                    error_messages.append(
                        'Please ensure that in file %s the line breaks '
                        'pattern between the dependencies mentioned as '
                        'strings:\n[%s]\nand the dependencies mentioned '
                        'as function parameters: \n(%s)\nfor the '
                        'corresponding controller should '
                        'exactly match.' % (
                            filepath, stringfied_dependencies,
                            function_parameters))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_constants_declaration(self):
        """Checks the declaration of constants in the TS files to ensure that
        the constants are not declared in files other than *.constants.ajs.ts
        and that the constants are declared only single time. This also checks
        that the constants are declared in both *.constants.ajs.ts (for
        AngularJS) and in *.constants.ts (for Angular 8).

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Constants declaration'
        error_messages = []
        failed = False

        ts_files_to_check = self.ts_filepaths
        constants_to_source_filepaths_dict = {}
        angularjs_source_filepaths_to_constants_dict = {}
        for filepath in ts_files_to_check:
            # The following block extracts the corresponding Angularjs
            # constants file for the Angular constants file. This is
            # required since the check cannot proceed if the AngularJS
            # constants file is not provided before the Angular constants
            # file.
            is_corresponding_angularjs_filepath = False
            if filepath.endswith('.constants.ts'):
                filename_without_extension = filepath[:-3]
                corresponding_angularjs_filepath = (
                    filename_without_extension + '.ajs.ts')

                is_corresponding_angularjs_filepath = (
                    os.path.isfile(corresponding_angularjs_filepath))
                if is_corresponding_angularjs_filepath:
                    compiled_js_filepath = self._get_compiled_ts_filepath(
                        corresponding_angularjs_filepath)
                    file_content = self.file_cache.read(
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
                                expression.arguments[1])
                            # Check if const is declared outside the
                            # class.
                            if angularjs_constants_value.property:
                                angularjs_constants_value = (
                                    angularjs_constants_value.property.name)
                            else:
                                angularjs_constants_value = (
                                    angularjs_constants_value.name)
                            if angularjs_constants_value != (
                                    angularjs_constants_name):
                                failed = True
                                error_messages.append(
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
                        error_messages.append(
                            '%s --> Duplicate constant declaration '
                            'found.' % (
                                corresponding_angularjs_filepath))
                    angularjs_source_filepaths_to_constants_dict[
                        corresponding_angularjs_filepath] = (
                            angularjs_constants_set)

            # Check that the constants are declared only in a
            # *.constants.ajs.ts file.
            if not filepath.endswith(
                    ('.constants.ajs.ts', '.constants.ts')):
                for line_num, line in enumerate(self.file_cache.readlines(
                        filepath)):
                    if 'angular.module(\'oppia\').constant(' in line:
                        failed = True
                        error_message = (
                            '%s --> Constant declaration found at line '
                            '%s. Please declare the constants in a '
                            'separate constants file.' % (
                                filepath, line_num))
                        error_messages.append(error_message)

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
                        error_message = (
                            '%s --> The constant %s is already declared '
                            'in %s. Please import the file where the '
                            'constant is declared or rename the constant'
                            '.' % (
                                filepath, constant_name,
                                constants_to_source_filepaths_dict[
                                    constant_name]))
                        error_messages.append(error_message)
                    else:
                        constants_to_source_filepaths_dict[
                            constant_name] = filepath

            # Checks that the *.constants.ts and the corresponding
            # *.constants.ajs.ts file are in sync.
            if filepath.endswith('.constants.ts') and (
                    is_corresponding_angularjs_filepath):
                # Ignore if file contains only type definitions for
                # constants.
                for node in parsed_nodes:
                    if 'declarations' in node.keys():
                        try:
                            angular_constants_nodes = (
                                node.declarations[0].init.callee.body.body)
                        except Exception:
                            continue
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
                    error_message = (
                        '%s --> Duplicate constant declaration found.'
                        % filepath)
                    error_messages.append(error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_comments(self):
        """This function ensures that comments follow correct style. Below are
        some formats of correct comment style:
        1. A comment can end with the following symbols: ('.', '?', ';', ',',
        '{', '^', ')', '}', '>'). Example: // Is this is comment?
        2. If a line contain any of the following words or phrases('@ts-ignore',
        '--params', 'eslint-disable', 'eslint-enable', 'http://', 'https://')
        in the comment.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
        """
        name = 'Comments'
        error_messages = []
        files_to_check = self.all_filepaths
        allowed_terminating_punctuations = [
            '.', '?', ';', ',', '{', '^', ')', '}', '>']

        # We allow comments to not have a terminating punctuation if any of the
        # below phrases appears at the beginning of the comment.
        # Example: // eslint-disable max-len
        # This comment will be excluded from this check.
        allowed_start_phrases = [
            '@ts-expect-error', '@ts-ignore', '--params', 'eslint-disable',
            'eslint-enable']

        # We allow comments to not have a terminating punctuation if any of the
        # below phrases appears in the last word of a comment.
        # Example: // Ref: https://some.link.com
        # This comment will be excluded from this check.
        allowed_end_phrases = ['http://', 'https://']

        failed = False
        for filepath in files_to_check:
            file_content = self.file_cache.readlines(filepath)
            file_length = len(file_content)
            for line_num in python_utils.RANGE(file_length):
                line = file_content[line_num].strip()
                next_line = ''
                previous_line = ''
                if line_num + 1 < file_length:
                    next_line = file_content[line_num + 1].strip()

                # Exclude comment line containing heading.
                # Example: // ---- Heading ----
                # These types of comments will be excluded from this check.
                if (
                        line.startswith('//') and line.endswith('-')
                        and not (
                            next_line.startswith('//') and
                            previous_line.startswith('//'))):
                    continue

                if line.startswith('//') and not next_line.startswith('//'):
                    # Check if any of the allowed starting phrase is present
                    # in comment and exclude that line from check.
                    allowed_start_phrase_present = any(
                        line.split()[1].startswith(word) for word in
                        allowed_start_phrases)

                    if allowed_start_phrase_present:
                        continue

                    # Check if any of the allowed ending phrase is present
                    # in comment and exclude that line from check. Used 'in'
                    # instead of 'startswith' because we have some comments
                    # with urls inside the quotes.
                    # Example: 'https://oppia.org'
                    allowed_end_phrase_present = any(
                        word in line.split()[-1] for word in
                        allowed_end_phrases)

                    if allowed_end_phrase_present:
                        continue

                    # Check that the comment ends with the proper
                    # punctuation.
                    last_char_is_invalid = line[-1] not in (
                        allowed_terminating_punctuations)
                    if last_char_is_invalid:
                        failed = True
                        error_message = (
                            '%s --> Line %s: Invalid punctuation used at '
                            'the end of the comment.' % (
                                filepath, line_num + 1))
                        error_messages.append(error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects to be used for
            linter status retrieval.
        """

        if not self.all_filepaths:
            concurrent_task_utils.log('')
            concurrent_task_utils.log(
                'There are no JavaScript or Typescript files to lint.')
            return []

        # Clear temp compiled typescipt files from the previous runs.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        # Compiles all typescipt files into COMPILED_TYPESCRIPT_TMP_PATH.
        compile_all_ts_files()

        self.parsed_js_and_ts_files = self._validate_and_parse_js_and_ts_files()
        self.parsed_expressions_in_files = (
            self._get_expressions_from_parsed_script())

        linter_stdout = []

        linter_stdout.append(self._check_extra_js_files())
        linter_stdout.append(self._check_http_requests())
        linter_stdout.append(self._check_js_and_ts_component_name_and_count())
        linter_stdout.append(self._check_directive_scope())
        linter_stdout.append(self._check_sorted_dependencies())
        linter_stdout.append(
            self._match_line_breaks_in_controller_dependencies())
        linter_stdout.append(self._check_constants_declaration())
        linter_stdout.append(self._check_comments())
        linter_stdout.append(self._check_ts_ignore())
        linter_stdout.append(self._check_ts_expect_error())

        # Clear temp compiled typescipt files.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        return linter_stdout


class ThirdPartyJsTsLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions."""

    def __init__(self, files_to_lint):
        """Constructs a ThirdPartyJsTsLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super(ThirdPartyJsTsLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(eslint_output):
        """Remove extra bits from eslint messages.

        Args:
            eslint_output: str. Output returned by the eslint linter.

        Returns:
            str. A string with the trimmed messages.
        """
        trimmed_error_messages = []
        # Extract the message from list and split the message by newline
        # so that we can use them and remove last four lines from the end.
        # Becuase last two lines are empty strings and third one have a message
        # with number of errors.
        # Example: \u2716 2 problems (2 errors, 0 warnings)
        # 1 error and 0 warnings potentially fixable with the `--fix` option.
        eslint_output_lines = eslint_output.split('\n')
        newlines_present = eslint_output_lines[-1] == '' and (
            eslint_output_lines[-2] == '')
        fix_option_present = eslint_output_lines[-3].endswith('`--fix` option.')
        unicode_x_present = eslint_output_lines[-4].startswith('\u2716')

        if (newlines_present and fix_option_present and unicode_x_present):
            eslint_output_lines = eslint_output_lines[:-4]

        for line in eslint_output_lines:
            # ESlint messages start with line numbers and then a
            # "x" and a message-id in the end. We are matching
            # if the line contains line number because every message start with
            # num:num where num is of type int and we are matching it with regex
            # and if that is True then we are replacing "error" with empty
            # string('') which is at the index 1 and message-id from the end.
            if re.search(r'^\d+:\d+', line.lstrip()):
                # Replacing message-id with an empty string('').
                line = re.sub(r'(\w+-*)+$', '', line)
                error_string = re.search(r'error', line).group(0)
                error_message = line.replace(error_string, '', 1)
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def _lint_js_and_ts_files(self):
        """Prints a list of lint errors in the given list of JavaScript files.

        Returns:
            TaskResult. An TaskResult object to retrieve the status of a
            lint check.
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
        num_files_with_errors = 0
        error_messages = []
        full_messages = []
        failed = False
        name = 'ESLint'

        eslint_cmd_args = [node_path, eslint_path, '--quiet']
        result_list = []
        for _, filepath in enumerate(files_to_lint):
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
            failed = True
            for result in result_list:
                full_messages.append(result)
                error_messages.append(
                    self._get_trimmed_error_output(result))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, full_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects to be used for
            linter status retrieval.
        """
        if not self.all_filepaths:
            concurrent_task_utils.log('')
            concurrent_task_utils.log(
                'There are no JavaScript or Typescript files to lint.')
            return []

        return [self._lint_js_and_ts_files()]


def get_linters(js_filepaths, ts_filepaths, file_cache):
    """Creates JsTsLintChecksManager and ThirdPartyJsTsLintChecksManager
        objects and return them.

    Args:
        js_filepaths: list(str). A list of js filepaths to lint.
        ts_filepaths: list(str). A list of ts filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(JsTsLintChecksManager, ThirdPartyJsTsLintChecksManager. A 2-tuple
        of custom and third_party linter objects.
    """
    js_ts_file_paths = js_filepaths + ts_filepaths

    custom_linter = JsTsLintChecksManager(
        js_filepaths, ts_filepaths, file_cache)

    third_party_linter = ThirdPartyJsTsLintChecksManager(js_ts_file_paths)

    return custom_linter, third_party_linter

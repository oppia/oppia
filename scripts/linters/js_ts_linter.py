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

from __future__ import annotations

import collections
import os
import re
import shutil
import subprocess

import esprima

from typing import Dict, Final, List, Tuple, Union

from .. import common
from .. import concurrent_task_utils

MYPY = False
if MYPY:  # pragma: no cover
    from scripts.linters import pre_commit_linter

ParsedExpressionsType = Dict[str, Dict[str, List[esprima.nodes.Node]]]

COMPILED_TYPESCRIPT_TMP_PATH: Final = 'tmpcompiledjs/'

# The INJECTABLES_TO_IGNORE contains a list of services that are not supposed
# to be included in angular-services.index.ts. These services are not required
# for our application to run but are only present to aid tests or belong to a
# class of legacy services that will soon be removed from the codebase.
# NOTE TO DEVELOPERS: Don't add any more files to this list. If you have any
# questions, please talk to @srijanreddy98.
INJECTABLES_TO_IGNORE: Final = [
    # This file is required for the js-ts-linter-test.
    'MockIgnoredService',
    # We don't want this service to be present in the index.
    'UpgradedServices',
    # Route guards cannot be made injectables until migration is complete.
    'CanAccessSplashPageGuard',
]


def _parse_js_or_ts_file(
    filepath: str, file_content: str, comment: bool = False
) -> Union[esprima.nodes.Module, esprima.nodes.Script]:
    """Runs the correct function to parse the given file's source code.

    With ES2015 and later, a JavaScript program can be either a script or a
    module. It is a very important distinction, since a parser such as Esprima
    needs to know the type of the source to be able to analyze its syntax
    correctly. This is achieved by choosing the parseScript function to parse a
    script and the parseModule function to parse a module.

    https://esprima.readthedocs.io/en/latest/syntactic-analysis.html#distinguishing-a-script-and-a-module

    Args:
        filepath: str. Path of the source file.
        file_content: str. Code to compile.
        comment: bool. Whether to collect comments while parsing the js or ts
            files.

    Returns:
        Union[Script, Module]. Parsed contents produced by esprima.
    """
    parse_function = (
        esprima.parseScript if filepath.endswith('.js') else
        esprima.parseModule)
    return parse_function(file_content, comment=comment)


def _get_expression_from_node_if_one_exists(
    parsed_node: esprima.nodes.Node, possible_component_names: List[str]
) -> esprima.nodes.Node:
    """This function first checks whether the parsed node represents
    the required angular component that needs to be derived by checking if
    it's in the 'possible_component_names' list. If yes, then it will return
    the expression part of the node from which the component can be derived.
    If no, it will return None. It is done by filtering out
    'AssignmentExpression' (as it represents an assignment) and 'Identifier'
    (as it represents a static expression).

    Args:
        parsed_node: Node. Parsed node of the body of a JS file.
        possible_component_names: list(str). List of angular components to check
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
    if component not in possible_component_names:
        return
    return expression


def compile_all_ts_files() -> None:
    """Compiles all project typescript files into
    COMPILED_TYPESCRIPT_TMP_PATH. Previously, we only compiled
    the TS files that were needed, but when a relative import was used, the
    linter would crash with a FileNotFound exception before being able to
    run. For more details, please see issue #9458.
    """
    cmd = ('./node_modules/typescript/bin/tsc -p %s -outDir %s') % (
        './tsconfig.json', COMPILED_TYPESCRIPT_TMP_PATH)
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)

    _, encoded_stderr = proc.communicate()
    stderr = encoded_stderr.decode('utf-8')

    if stderr:
        raise Exception(stderr)


class JsTsLintChecksManager:
    """Manages all the Js and Ts linting functions."""

    def __init__(
        self,
        js_files: List[str],
        ts_files: List[str],
        file_cache: pre_commit_linter.FileCache
    ) -> None:
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
        self.parsed_js_and_ts_files: Dict[str, esprima.nodes.Module] = {}
        self.parsed_expressions_in_files: ParsedExpressionsType = {}

    @property
    def js_filepaths(self) -> List[str]:
        """Return all js filepaths."""
        return self.js_files

    @property
    def ts_filepaths(self) -> List[str]:
        """Return all ts filepaths."""
        return self.ts_files

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.js_filepaths + self.ts_filepaths

    def _validate_and_parse_js_and_ts_files(
        self
    ) -> Dict[str, Union[esprima.nodes.Module, esprima.nodes.Script]]:
        """This function validates JavaScript and Typescript files and
        returns the parsed contents as a Python dictionary.

        Returns:
            dict. A dict which has key as filepath and value as contents of js
            and ts files after validating and parsing the files.

        Raises:
            Exception. The filepath ends with '.js'.
        """

        # Select JS files which need to be checked.
        files_to_check = self.all_filepaths
        parsed_js_and_ts_files = {}
        concurrent_task_utils.log('Validating and parsing JS and TS files ...')
        for filepath in files_to_check:
            file_content = self.file_cache.read(filepath)  # type: ignore[no-untyped-call]

            try:
                # Use esprima to parse a JS or TS file.
                parsed_js_and_ts_files[filepath] = _parse_js_or_ts_file(
                    filepath, file_content, comment=True)
            except Exception:
                if filepath.endswith('.js'):
                    raise
                # Compile typescript file which has syntax invalid for JS file.
                compiled_js_filepath = self._get_compiled_ts_filepath(filepath)

                file_content = self.file_cache.read(compiled_js_filepath)  # type: ignore[no-untyped-call]
                parsed_js_and_ts_files[filepath] = _parse_js_or_ts_file(
                    filepath, file_content)

        return parsed_js_and_ts_files

    def _get_expressions_from_parsed_script(self) -> ParsedExpressionsType:
        """This function returns the expressions in the script parsed using
        js and ts files.

        Returns:
            dict. A dict which has key as filepath and value as the expressions
            in the script parsed using js and ts files.
        """

        parsed_expressions_in_files: (
            ParsedExpressionsType
        ) = collections.defaultdict(dict)
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

    def _get_compiled_ts_filepath(self, filepath: str) -> str:
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

    def _check_constants_declaration(self) -> concurrent_task_utils.TaskResult:
        """Checks the declaration of constants in the TS files to ensure that
        the constants are not declared in files other than *.constants.ajs.ts
        and that the constants are declared only single time. This also checks
        that the constants are declared in both *.constants.ajs.ts (for
        AngularJS) and in *.constants.ts (for Angular 8).

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        name = 'Constants declaration'
        error_messages = []
        failed = False

        ts_files_to_check = self.ts_filepaths
        constants_to_source_filepaths_dict: Dict[str, str] = {}
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
                    file_content = self.file_cache.read(compiled_js_filepath)  # type: ignore[no-untyped-call]

                    parsed_script = (
                        _parse_js_or_ts_file(filepath, file_content))
                    parsed_nodes = parsed_script.body
                    angularjs_constants_list = []
                    components_to_check = ['constant']
                    for parsed_node in parsed_nodes:
                        expression = (
                            _get_expression_from_node_if_one_exists(
                                parsed_node, components_to_check))
                        if not expression:
                            continue

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

            # Check if the constant has multiple declarations which is
            # prohibited.
            parsed_script = self.parsed_js_and_ts_files[filepath]
            parsed_nodes = parsed_script.body
            components_to_check = ['constant']
            for parsed_node in parsed_nodes:
                expression = _get_expression_from_node_if_one_exists(
                    parsed_node, components_to_check)
                if not expression:
                    continue

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

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def _check_angular_services_index(self) -> concurrent_task_utils.TaskResult:
        """Finds all @Injectable classes and makes sure that they are added to
            Oppia root and Angular Services Index.

        Returns:
            TaskResult. TaskResult having all the messages returned by the
            lint checks.
        """
        name = 'Angular Services Index file'
        error_messages: List[str] = []
        injectable_pattern = '%s%s' % (
            'Injectable\\({\\n*\\s*providedIn: \'root\'\\n*}\\)\\n',
            'export class ([A-Za-z0-9]*)')
        angular_services_index_path = (
            './core/templates/services/angular-services.index.ts')
        angular_services_index = self.file_cache.read(  # type: ignore[no-untyped-call]
            angular_services_index_path)
        error_messages = []
        failed = False
        for file_path in self.ts_files:
            file_content = self.file_cache.read(file_path)  # type: ignore[no-untyped-call]
            class_names = re.findall(injectable_pattern, file_content)
            for class_name in class_names:
                if class_name in INJECTABLES_TO_IGNORE:
                    continue
                import_statement_regex = 'import {[\\s*\\w+,]*%s' % class_name
                if not re.search(
                        import_statement_regex, angular_services_index):
                    error_message = (
                        'Please import %s to Angular Services Index file in %s'
                        'from %s'
                        % (class_name, angular_services_index_path, file_path))
                    error_messages.append(error_message)
                    failed = True

                service_name_type_pair_regex = (
                    '\\[\'%s\',\\n*\\s*%s\\]' % (class_name, class_name))
                service_name_type_pair = (
                    '[\'%s\', %s]' % (class_name, class_name))

                if not re.search(
                        service_name_type_pair_regex, angular_services_index):
                    error_message = (
                        'Please add the pair %s to the angularServices in %s'
                        % (service_name_type_pair, angular_services_index_path)
                    )
                    error_messages.append(error_message)
                    failed = True
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """

        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'JS TS lint', False, [],
                    ['There are no JavaScript or Typescript files to lint.'])]

        # Clear temp compiled typescipt files from the previous runs.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        # Compiles all typescipt files into COMPILED_TYPESCRIPT_TMP_PATH.
        compile_all_ts_files()

        self.parsed_js_and_ts_files = self._validate_and_parse_js_and_ts_files()
        self.parsed_expressions_in_files = (
            self._get_expressions_from_parsed_script())

        linter_stdout = []

        linter_stdout.append(self._check_constants_declaration())
        linter_stdout.append(self._check_angular_services_index())

        # Clear temp compiled typescipt files.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        return linter_stdout


class ThirdPartyJsTsLintChecksManager:
    """Manages all the third party Python linting functions."""

    def __init__(self, files_to_lint: List[str]) -> None:
        """Constructs a ThirdPartyJsTsLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super().__init__()
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(eslint_output: str) -> str:
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
                searched_error_string = re.search(r'error', line)
                # If the regex '^\d+:\d+' is matched then the output line of
                # es-lint is an error message, and in the error message, 'error'
                # keyword is always present. So, 'searched_error_string' is
                # never going to be None here.
                assert searched_error_string is not None
                error_string = searched_error_string.group(0)
                error_message = line.replace(error_string, '', 1)
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def _lint_js_and_ts_files(self) -> concurrent_task_utils.TaskResult:
        """Prints a list of lint errors in the given list of JavaScript files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.

        Raises:
            Exception. The start.py file not executed.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        eslint_path = os.path.join(
            'node_modules', 'eslint', 'bin', 'eslint.js')
        if not os.path.exists(eslint_path):
            raise Exception(
                'ERROR    Please run start.py first to install node-eslint '
                'and its dependencies.')

        files_to_lint = self.all_filepaths
        error_messages = []
        full_error_messages = []
        failed = False
        name = 'ESLint'

        eslint_cmd_args = [node_path, eslint_path, '--quiet']
        proc_args = eslint_cmd_args + files_to_lint
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        # Standard and error output is in bytes, we need to decode the line to
        # print it.
        linter_stdout = encoded_linter_stdout.decode('utf-8')
        linter_stderr = encoded_linter_stderr.decode('utf-8')
        if linter_stderr:
            raise Exception(linter_stderr)

        if linter_stdout:
            failed = True
            full_error_messages.append(linter_stdout)
            error_messages.append(self._get_trimmed_error_output(linter_stdout))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, full_error_messages)

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'JS TS lint', False, [],
                    ['There are no JavaScript or Typescript files to lint.'])]

        return [self._lint_js_and_ts_files()]


def get_linters(
    js_filepaths: List[str],
    ts_filepaths: List[str],
    file_cache: pre_commit_linter.FileCache
) -> Tuple[JsTsLintChecksManager, ThirdPartyJsTsLintChecksManager]:
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

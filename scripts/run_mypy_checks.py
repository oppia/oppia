# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""MyPy test runner script."""

from __future__ import annotations

import argparse
import os
import site
import subprocess
import sys

from scripts import common
from scripts import install_third_party_libs

# List of directories whose files won't be type-annotated ever.
EXCLUDED_DIRECTORIES = [
    'proto_files/',
    'scripts/linters/test_files/',
    'third_party/',
    'venv/'
]

# List of files who should be type-annotated but are not.
NOT_FULLY_COVERED_FILES = [
    'core/controllers/',
    'core/domain/collection_services.py',
    'core/domain/collection_services_test.py',
    'core/domain/draft_upgrade_services.py',
    'core/domain/draft_upgrade_services_test.py',
    'core/domain/event_services.py',
    'core/domain/event_services_test.py',
    'core/domain/exp_domain.py',
    'core/domain/exp_domain_test.py',
    'core/domain/exp_services.py',
    'core/domain/exp_services_test.py',
    'core/domain/feedback_services.py',
    'core/domain/feedback_services_test.py',
    'core/domain/html_validation_service.py',
    'core/domain/html_validation_service_test.py',
    'core/domain/learner_progress_services.py',
    'core/domain/learner_progress_services_test.py',
    'core/domain/object_registry.py',
    'core/domain/object_registry_test.py',
    'core/domain/opportunity_services.py',
    'core/domain/opportunity_services_test.py',
    'core/domain/question_services.py',
    'core/domain/question_services_test.py',
    'core/domain/rights_manager.py',
    'core/domain/rights_manager_test.py',
    'core/domain/skill_domain.py',
    'core/domain/skill_domain_test.py',
    'core/domain/skill_services.py',
    'core/domain/skill_services_test.py',
    'core/domain/state_domain.py',
    'core/domain/state_domain_test.py',
    'core/domain/stats_services.py',
    'core/domain/stats_services_test.py',
    'core/domain/topic_services.py',
    'core/domain/topic_services_test.py',
    'core/domain/wipeout_service.py',
    'core/domain/wipeout_service_test.py',
    'core/platform_feature_list.py',
    'core/platform_feature_list_test.py',
    'core/storage/storage_models_test.py',
    'core/tests/build_sources/extensions/CodeRepl.py',
    'core/tests/build_sources/extensions/DragAndDropSortInput.py',
    'core/tests/build_sources/extensions/base.py',
    'core/tests/build_sources/extensions/base_test.py',
    'core/tests/build_sources/extensions/models_test.py',
    'core/tests/data/failing_tests.py',
    'core/tests/data/image_constants.py',
    'core/tests/data/unicode_and_str_handler.py',
    'core/tests/gae_suite.py',
    'core/tests/gae_suite_test.py',
    'core/tests/load_tests/feedback_thread_summaries_test.py',
    'core/tests/test_utils.py',
    'core/tests/test_utils_test.py',
    'core/jobs/batch_jobs',
    'extensions/',
    'scripts/check_if_pr_is_low_risk.py',
    'scripts/check_if_pr_is_low_risk_test.py',
    'scripts/concurrent_task_utils.py',
    'scripts/concurrent_task_utils_test.py',
    'scripts/docstrings_checker.py',
    'scripts/docstrings_checker_test.py',
    'scripts/extend_index_yaml.py',
    'scripts/extend_index_yaml_test.py',
    'scripts/flake_checker.py',
    'scripts/flake_checker_test.py',
    'scripts/install_python_prod_dependencies.py',
    'scripts/install_python_prod_dependencies_test.py',
    'scripts/install_third_party_libs.py',
    'scripts/install_third_party_libs_test.py',
    'scripts/install_third_party.py',
    'scripts/install_third_party_test.py',
    'scripts/pre_commit_hook.py',
    'scripts/pre_commit_hook_test.py',
    'scripts/pre_push_hook.py',
    'scripts/pre_push_hook_test.py',
    'scripts/run_backend_tests.py',
    'scripts/run_e2e_tests.py',
    'scripts/run_e2e_tests_test.py',
    'scripts/run_lighthouse_tests.py',
    'scripts/run_mypy_checks.py',
    'scripts/run_mypy_checks_test.py',
    'scripts/run_portserver.py',
    'scripts/run_presubmit_checks.py',
    'scripts/script_import_test.py',
    'scripts/servers.py',
    'scripts/servers_test.py',
    'scripts/setup.py',
    'scripts/setup_test.py',
    'scripts/linters/',
    'scripts/release_scripts/'
]


CONFIG_FILE_PATH = os.path.join('.', 'mypy.ini')
MYPY_REQUIREMENTS_FILE_PATH = os.path.join('.', 'mypy_requirements.txt')
MYPY_TOOLS_DIR = os.path.join(os.getcwd(), 'third_party', 'python3_libs')
PYTHON3_CMD = 'python3'

_PATHS_TO_INSERT = [MYPY_TOOLS_DIR, ]

_PARSER = argparse.ArgumentParser(
    description='Python type checking using mypy script.'
)

_PARSER.add_argument(
    '--skip-install',
    help='If passed, skips installing dependencies.'
    ' By default, they are installed.',
    action='store_true')

_PARSER.add_argument(
    '--install-globally',
    help='optional; if specified, installs mypy and its requirements globally.'
    ' By default, they are installed to %s' % MYPY_TOOLS_DIR,
    action='store_true')

_PARSER.add_argument(
    '--files',
    help='Files to type-check',
    action='store',
    nargs='+'
)


def install_third_party_libraries(skip_install: bool) -> None:
    """Run the installation script.

    Args:
        skip_install: bool. Whether to skip running the installation script.
    """
    if not skip_install:
        install_third_party_libs.main()


def get_mypy_cmd(files, mypy_exec_path, using_global_mypy):
    """Return the appropriate command to be run.

    Args:
        files: list(list(str)). List having first element as list of string.
        mypy_exec_path: str. Path of mypy executable.
        using_global_mypy: bool. Whether generated command should run using
            global mypy.

    Returns:
        list(str). List of command line arguments.
    """
    if using_global_mypy:
        mypy_cmd = 'mypy'
    else:
        mypy_cmd = mypy_exec_path
    if files:
        cmd = [mypy_cmd, '--config-file', CONFIG_FILE_PATH] + files
    else:
        excluded_files_regex = (
            '|'.join(NOT_FULLY_COVERED_FILES + EXCLUDED_DIRECTORIES))
        cmd = [
            mypy_cmd, '--exclude', excluded_files_regex,
            '--config-file', CONFIG_FILE_PATH, '.'
        ]
    return cmd


def install_mypy_prerequisites(install_globally):
    """Install mypy and type stubs from mypy_requirements.txt.

    Args:
        install_globally: bool. Whether mypy and its requirements are to be
            installed globally.

    Returns:
        tuple(int, str). The return code from installing prerequisites and the
        path of the mypy executable.
    """
    # TODO(#13398): Change MyPy installation after Python3 migration. Now, we
    # install packages globally for CI. In CI, pip installation is not in a way
    # we expect.
    if install_globally:
        cmd = [
            PYTHON3_CMD, '-m', 'pip', 'install', '-r',
            MYPY_REQUIREMENTS_FILE_PATH
        ]
    else:
        cmd = [
            PYTHON3_CMD, '-m', 'pip', 'install', '-r',
            MYPY_REQUIREMENTS_FILE_PATH, '--target', MYPY_TOOLS_DIR,
            '--upgrade'
        ]
    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output = process.communicate()
    if b'can\'t combine user with prefix' in output[1]:
        uextention_text = ['--user', '--prefix=', '--system']
        new_process = subprocess.Popen(
            cmd + uextention_text, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        new_process.communicate()
        _PATHS_TO_INSERT.append(os.path.join(site.USER_BASE, 'bin'))
        mypy_exec_path = os.path.join(site.USER_BASE, 'bin', 'mypy')
        return (new_process.returncode, mypy_exec_path)
    else:
        _PATHS_TO_INSERT.append(os.path.join(MYPY_TOOLS_DIR, 'bin'))
        mypy_exec_path = os.path.join(MYPY_TOOLS_DIR, 'bin', 'mypy')
        return (process.returncode, mypy_exec_path)


def main(args=None):
    """Runs the MyPy type checks."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    install_third_party_libraries(parsed_args.skip_install)
    common.fix_third_party_imports()

    print('Installing Mypy and stubs for third party libraries.')
    return_code, mypy_exec_path = install_mypy_prerequisites(
        parsed_args.install_globally)
    if return_code != 0:
        print('Cannot install Mypy and stubs for third party libraries.')
        sys.exit(1)

    print('Installed Mypy and stubs for third party libraries.')

    print('Starting Mypy type checks.')
    cmd = get_mypy_cmd(
        parsed_args.files, mypy_exec_path, parsed_args.install_globally)

    env = os.environ.copy()
    for path in _PATHS_TO_INSERT:
        env['PATH'] = '%s%s' % (path, os.pathsep) + env['PATH']
    env['PYTHONPATH'] = MYPY_TOOLS_DIR

    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    stdout, stderr = process.communicate()
    # Standard and error output is in bytes, we need to decode the line to
    # print it.
    print(stdout.decode('utf-8'))
    print(stderr.decode('utf-8'))
    if process.returncode == 0:
        print('Mypy type checks successful.')
    else:
        print(
            'Mypy type checks unsuccessful. Please fix the errors. '
            'For more information, visit: '
            'https://github.com/oppia/oppia/wiki/Backend-Type-Annotations')
        sys.exit(2)
    return process.returncode


if __name__ == '__main__': # pragma: no cover
    main()

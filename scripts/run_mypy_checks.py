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

from core import python_utils
from scripts import common
from scripts import install_third_party_libs

# List of directories whose files won't be type-annotated ever.
EXCLUDED_DIRECTORIES = [
    'proto_files/',
    'scripts/linters/test_files/',
    'third_party/',
]

# List of files who should be type-annotated but are not.
NOT_FULLY_COVERED_FILES = [
    'core/controllers/',
    'core/domain/action_registry.py',
    'core/domain/action_registry_test.py',
    'core/domain/activity_jobs_one_off.py',
    'core/domain/activity_jobs_one_off_test.py',
    'core/domain/activity_services.py',
    'core/domain/activity_services_test.py',
    'core/domain/activity_validators.py',
    'core/domain/activity_validators_test.py',
    'core/domain/app_feedback_report_validators.py',
    'core/domain/app_feedback_report_validators_test.py',
    'core/domain/audit_validators.py',
    'core/domain/audit_validators_test.py',
    'core/domain/auth_domain.py',
    'core/domain/auth_domain_test.py',
    'core/domain/auth_jobs_one_off.py',
    'core/domain/auth_jobs_one_off_test.py',
    'core/domain/auth_services.py',
    'core/domain/auth_services_test.py',
    'core/domain/auth_validators.py',
    'core/domain/auth_validators_test.py',
    'core/domain/base_model_validators.py',
    'core/domain/base_model_validators_test.py',
    'core/domain/beam_job_validators.py',
    'core/domain/beam_job_validators_test.py',
    'core/domain/blog_domain.py',
    'core/domain/blog_domain_test.py',
    'core/domain/blog_services.py',
    'core/domain/blog_services_test.py',
    'core/domain/blog_validators.py',
    'core/domain/blog_validators_test.py',
    'core/domain/caching_domain.py',
    'core/domain/caching_services.py',
    'core/domain/caching_services_test.py',
    'core/domain/calculation_registry.py',
    'core/domain/calculation_registry_test.py',
    'core/domain/change_domain.py',
    'core/domain/classifier_domain.py',
    'core/domain/classifier_domain_test.py',
    'core/domain/classifier_services.py',
    'core/domain/classifier_services_test.py',
    'core/domain/classifier_validators.py',
    'core/domain/classifier_validators_test.py',
    'core/domain/classroom_domain.py',
    'core/domain/classroom_services.py',
    'core/domain/classroom_services_test.py',
    'core/domain/collection_domain.py',
    'core/domain/collection_domain_test.py',
    'core/domain/collection_jobs_one_off.py',
    'core/domain/collection_jobs_one_off_test.py',
    'core/domain/collection_services.py',
    'core/domain/collection_services_test.py',
    'core/domain/collection_validators.py',
    'core/domain/collection_validators_test.py',
    'core/domain/config_domain.py',
    'core/domain/config_domain_test.py',
    'core/domain/config_services.py',
    'core/domain/config_services_test.py',
    'core/domain/config_validators.py',
    'core/domain/config_validators_test.py',
    'core/domain/cron_services.py',
    'core/domain/customization_args_util.py',
    'core/domain/customization_args_util_test.py',
    'core/domain/draft_upgrade_services.py',
    'core/domain/draft_upgrade_services_test.py',
    'core/domain/email_jobs_one_off.py',
    'core/domain/email_jobs_one_off_test.py',
    'core/domain/email_manager.py',
    'core/domain/email_manager_test.py',
    'core/domain/email_services.py',
    'core/domain/email_services_test.py',
    'core/domain/email_subscription_services.py',
    'core/domain/email_subscription_services_test.py',
    'core/domain/email_validators.py',
    'core/domain/email_validators_test.py',
    'core/domain/event_services.py',
    'core/domain/event_services_test.py',
    'core/domain/exp_domain.py',
    'core/domain/exp_domain_test.py',
    'core/domain/exp_fetchers.py',
    'core/domain/exp_fetchers_test.py',
    'core/domain/exp_jobs_one_off.py',
    'core/domain/exp_jobs_one_off_test.py',
    'core/domain/exp_services.py',
    'core/domain/exp_services_test.py',
    'core/domain/exploration_validators.py',
    'core/domain/exploration_validators_test.py',
    'core/domain/expression_parser.py',
    'core/domain/expression_parser_test.py',
    'core/domain/feedback_domain.py',
    'core/domain/feedback_domain_test.py',
    'core/domain/feedback_jobs_one_off.py',
    'core/domain/feedback_jobs_one_off_test.py',
    'core/domain/feedback_services.py',
    'core/domain/feedback_services_test.py',
    'core/domain/feedback_validators.py',
    'core/domain/feedback_validators_test.py',
    'core/domain/fs_domain.py',
    'core/domain/fs_domain_test.py',
    'core/domain/fs_services.py',
    'core/domain/fs_services_test.py',
    'core/domain/html_cleaner.py',
    'core/domain/html_cleaner_test.py',
    'core/domain/html_validation_service.py',
    'core/domain/html_validation_service_test.py',
    'core/domain/image_services.py',
    'core/domain/image_services_test.py',
    'core/domain/image_validation_services.py',
    'core/domain/image_validation_services_test.py',
    'core/domain/improvements_domain.py',
    'core/domain/improvements_domain_test.py',
    'core/domain/improvements_services.py',
    'core/domain/improvements_services_test.py',
    'core/domain/improvements_validators.py',
    'core/domain/improvements_validators_test.py',
    'core/domain/interaction_jobs_one_off.py',
    'core/domain/interaction_jobs_one_off_test.py',
    'core/domain/interaction_registry.py',
    'core/domain/interaction_registry_test.py',
    'core/domain/job_validators.py',
    'core/domain/job_validators_test.py',
    'core/domain/learner_goals_services.py',
    'core/domain/learner_goals_services_test.py',
    'core/domain/learner_playlist_services.py',
    'core/domain/learner_playlist_services_test.py',
    'core/domain/learner_progress_services.py',
    'core/domain/learner_progress_services_test.py',
    'core/domain/moderator_services.py',
    'core/domain/moderator_services_test.py',
    'core/domain/object_registry.py',
    'core/domain/object_registry_test.py',
    'core/domain/opportunity_domain.py',
    'core/domain/opportunity_domain_test.py',
    'core/domain/opportunity_jobs_one_off.py',
    'core/domain/opportunity_jobs_one_off_test.py',
    'core/domain/opportunity_services.py',
    'core/domain/opportunity_services_test.py',
    'core/domain/opportunity_validators.py',
    'core/domain/opportunity_validators_test.py',
    'core/domain/param_domain.py',
    'core/domain/param_domain_test.py',
    'core/domain/platform_feature_services.py',
    'core/domain/platform_feature_services_test.py',
    'core/domain/platform_parameter_domain.py',
    'core/domain/platform_parameter_domain_test.py',
    'core/domain/platform_parameter_list.py',
    'core/domain/platform_parameter_list_test.py',
    'core/domain/platform_parameter_registry.py',
    'core/domain/platform_parameter_registry_test.py',
    'core/domain/playthrough_issue_registry.py',
    'core/domain/playthrough_issue_registry_test.py',
    'core/domain/prod_validation_jobs_one_off.py',
    'core/domain/question_domain.py',
    'core/domain/question_domain_test.py',
    'core/domain/question_fetchers.py',
    'core/domain/question_fetchers_test.py',
    'core/domain/question_jobs_one_off.py',
    'core/domain/question_jobs_one_off_test.py',
    'core/domain/question_services.py',
    'core/domain/question_services_test.py',
    'core/domain/question_validators.py',
    'core/domain/question_validators_test.py',
    'core/domain/rating_services.py',
    'core/domain/rating_services_test.py',
    'core/domain/recommendations_jobs_one_off.py',
    'core/domain/recommendations_jobs_one_off_test.py',
    'core/domain/recommendations_services.py',
    'core/domain/recommendations_services_test.py',
    'core/domain/recommendations_validators.py',
    'core/domain/recommendations_validators_test.py',
    'core/domain/rights_domain.py',
    'core/domain/rights_domain_test.py',
    'core/domain/rights_manager.py',
    'core/domain/rights_manager_test.py',
    'core/domain/role_services.py',
    'core/domain/role_services_test.py',
    'core/domain/rte_component_registry.py',
    'core/domain/rte_component_registry_test.py',
    'core/domain/rules_registry.py',
    'core/domain/rules_registry_test.py',
    'core/domain/search_services.py',
    'core/domain/search_services_test.py',
    'core/domain/skill_domain.py',
    'core/domain/skill_domain_test.py',
    'core/domain/skill_fetchers.py',
    'core/domain/skill_fetchers_test.py',
    'core/domain/skill_jobs_one_off.py',
    'core/domain/skill_jobs_one_off_test.py',
    'core/domain/skill_services.py',
    'core/domain/skill_services_test.py',
    'core/domain/skill_validators.py',
    'core/domain/skill_validators_test.py',
    'core/domain/state_domain.py',
    'core/domain/state_domain_test.py',
    'core/domain/statistics_validators.py',
    'core/domain/statistics_validators_test.py',
    'core/domain/stats_domain.py',
    'core/domain/stats_domain_test.py',
    'core/domain/stats_jobs_continuous.py',
    'core/domain/stats_jobs_continuous_test.py',
    'core/domain/stats_jobs_one_off.py',
    'core/domain/stats_jobs_one_off_test.py',
    'core/domain/stats_services.py',
    'core/domain/stats_services_test.py',
    'core/domain/storage_model_audit_jobs_test.py',
    'core/domain/story_domain.py',
    'core/domain/story_domain_test.py',
    'core/domain/story_fetchers.py',
    'core/domain/story_fetchers_test.py',
    'core/domain/story_jobs_one_off.py',
    'core/domain/story_jobs_one_off_test.py',
    'core/domain/story_services.py',
    'core/domain/story_services_test.py',
    'core/domain/story_validators.py',
    'core/domain/story_validators_test.py',
    'core/domain/subscription_services.py',
    'core/domain/subscription_services_test.py',
    'core/domain/subtopic_page_domain.py',
    'core/domain/subtopic_page_domain_test.py',
    'core/domain/subtopic_page_services.py',
    'core/domain/subtopic_page_services_test.py',
    'core/domain/subtopic_validators.py',
    'core/domain/subtopic_validators_test.py',
    'core/domain/suggestion_jobs_one_off.py',
    'core/domain/suggestion_jobs_one_off_test.py',
    'core/domain/suggestion_registry.py',
    'core/domain/suggestion_registry_test.py',
    'core/domain/suggestion_services.py',
    'core/domain/suggestion_services_test.py',
    'core/domain/suggestion_validators.py',
    'core/domain/suggestion_validators_test.py',
    'core/domain/summary_services.py',
    'core/domain/summary_services_test.py',
    'core/domain/takeout_domain.py',
    'core/domain/takeout_service.py',
    'core/domain/takeout_service_test.py',
    'core/domain/taskqueue_services.py',
    'core/domain/taskqueue_services_test.py',
    'core/domain/topic_domain.py',
    'core/domain/topic_domain_test.py',
    'core/domain/topic_fetchers.py',
    'core/domain/topic_fetchers_test.py',
    'core/domain/topic_jobs_one_off.py',
    'core/domain/topic_jobs_one_off_test.py',
    'core/domain/topic_services.py',
    'core/domain/topic_services_test.py',
    'core/domain/topic_validators.py',
    'core/domain/topic_validators_test.py',
    'core/domain/translatable_object_registry.py',
    'core/domain/translatable_object_registry_test.py',
    'core/domain/translation_domain.py',
    'core/domain/translation_domain_test.py',
    'core/domain/translation_fetchers.py',
    'core/domain/translation_fetchers_test.py',
    'core/domain/translation_services.py',
    'core/domain/translation_services_test.py',
    'core/domain/translation_validators.py',
    'core/domain/translation_validators_test.py',
    'core/domain/user_domain.py',
    'core/domain/user_domain_test.py',
    'core/domain/user_jobs_one_off.py',
    'core/domain/user_jobs_one_off_test.py',
    'core/domain/user_query_domain.py',
    'core/domain/user_query_domain_test.py',
    'core/domain/user_query_jobs_one_off.py',
    'core/domain/user_query_jobs_one_off_test.py',
    'core/domain/user_query_services.py',
    'core/domain/user_query_services_test.py',
    'core/domain/user_services.py',
    'core/domain/user_services_test.py',
    'core/domain/user_validators.py',
    'core/domain/user_validators_test.py',
    'core/domain/value_generators_domain.py',
    'core/domain/value_generators_domain_test.py',
    'core/domain/visualization_registry.py',
    'core/domain/visualization_registry_test.py',
    'core/domain/voiceover_services.py',
    'core/domain/voiceover_services_test.py',
    'core/domain/wipeout_domain.py',
    'core/domain/wipeout_domain_test.py',
    'core/domain/wipeout_jobs_one_off.py',
    'core/domain/wipeout_jobs_one_off_test.py',
    'core/domain/wipeout_service.py',
    'core/domain/wipeout_service_test.py',
    'core/platform/storage/cloud_storage_emulator.py',
    'core/platform/storage/cloud_storage_emulator_test.py',
    'core/platform_feature_list.py',
    'core/platform_feature_list_test.py',
    'core/storage/beam_job/gae_models.py',
    'core/storage/beam_job/gae_models_test.py',
    'core/storage/blog/gae_models.py',
    'core/storage/blog/gae_models_test.py',
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
    'core/jobs',
    'core/python_utils.py',
    'core/python_utils_test.py',
    'extensions/',
    'scripts/'
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

    python_utils.PRINT('Installing Mypy and stubs for third party libraries.')
    return_code, mypy_exec_path = install_mypy_prerequisites(
        parsed_args.install_globally)
    if return_code != 0:
        python_utils.PRINT(
            'Cannot install Mypy and stubs for third party libraries.')
        sys.exit(1)

    python_utils.PRINT(
        'Installed Mypy and stubs for third party libraries.')

    python_utils.PRINT('Starting Mypy type checks.')
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
    python_utils.PRINT(stdout.decode('utf-8'))
    python_utils.PRINT(stderr.decode('utf-8'))
    if process.returncode == 0:
        python_utils.PRINT('Mypy type checks successful.')
    else:
        python_utils.PRINT(
            'Mypy type checks unsuccessful. Please fix the errors. '
            'For more information, visit: '
            'https://github.com/oppia/oppia/wiki/Backend-Type-Annotations')
        sys.exit(2)
    return process.returncode


if __name__ == '__main__': # pragma: no cover
    main()

# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Checks and outputs which test suites to run in the CI."""

from __future__ import annotations

import argparse
import json
import os
import subprocess

from scripts import generate_root_files_mapping

from typing import Final, List, Optional, Sequence, Set, TypedDict

_PARSER: Final = argparse.ArgumentParser(
    description="""
Checks and outputs which test suites to run in the CI. 
""")

_PARSER.add_argument(
    '--github_head_ref', type=str, required=True,
)

_PARSER.add_argument(
    '--github_base_ref', type=str, required=True,
)

_PARSER.add_argument(
    '--output_all_test_suites',
    action='store_true',
)


class LighthousePageDict(TypedDict):
    """A dictionary representing a Lighthouse page."""

    name: str
    url: str
    page_module: str


class GenericTestSuiteDict(TypedDict):
    """A dictionary representing a generic test suite."""

    name: str
    module: str
    environment: str


class LighthouseTestSuiteDict(GenericTestSuiteDict):
    """A dictionary representing a Lighthouse test suite."""

    pages_to_run: List[str]


class TestSuitesByTypeDict(TypedDict):
    """A dictionary representing all of the test suites of each test type."""

    e2e: List[GenericTestSuiteDict]
    acceptance: List[GenericTestSuiteDict]
    lighthouse_performance: List[LighthouseTestSuiteDict]
    lighthouse_accessibility: List[LighthouseTestSuiteDict]


class CITestSuitesDict(TypedDict):
    """A dictionary representing the test suites of a test type in the CI."""

    suites: Sequence[GenericTestSuiteDict]
    count: int


class CITestSuitesToRunDict(TypedDict):
    """A dictionary representing the test suites to run in the CI."""

    e2e: CITestSuitesDict
    acceptance: CITestSuitesDict
    lighthouse_performance: CITestSuitesDict
    lighthouse_accessibility: CITestSuitesDict


class RootFilesConfigDict(TypedDict):
    """A dictionary representing the root files configuration."""

    run_no_tests_root_files: List[str]
    run_all_tests_root_files: List[str]


GITHUB_OUTPUT_TEST_SUITES_TO_RUN: Final = 'TEST_SUITES_TO_RUN'
ROOT_FILES_MAPPING_FILE_PATH: Final = 'root-files-mapping.json'
ROOT_FILES_CONFIG_FILE_PATH: Final = os.path.join(
    'core', 'tests', 'root-files-config.json')
LIGHTHOUSE_PAGES_CONFIG_FILE_PATH: Final = os.path.join(
    'core', 'tests', 'lighthouse-pages.json')
CI_TEST_SUITE_CONFIGS_DIRECTORY: Final = os.path.join(
    'core', 'tests', 'ci-test-suite-configs')
DEFAULT_SUITE = 'suites'
DOCKER_SUITE = 'docker_suites'
TEST_MODULES_MAPPING_DIRECTORY: Final = os.path.join(
    'core', 'tests', 'test-modules-mappings')

LIGHTHOUSE_PAGES_PER_SHARD: Final = 17
LIGHTHOUSE_ACCESSIBILITY_MODULE: Final = '.lighthouserc-accessibility.js'
LIGHTHOUSE_PERFORMANCE_MODULE: Final = '.lighthouserc-performance.js'


def create_ci_test_suites_dict(
    suites: Optional[Sequence[GenericTestSuiteDict]] = None
) -> CITestSuitesDict:
    """Creates a CITestSuitesDict with the given parameters.

    Args:
        suites: list(dict) | None. The test suites of a test type in the CI.

    Returns:
        dict. The CITestSuitesDict with the given parameters.
    """
    return {
        'suites': suites or [],
        'count': suites and len(suites) or 0
    }


def create_ci_test_suites_to_run_dict(
    e2e: Optional[CITestSuitesDict] = None,
    acceptance: Optional[CITestSuitesDict] = None,
    lighthouse_performance: Optional[CITestSuitesDict] = None,
    lighthouse_accessibility: Optional[CITestSuitesDict] = None
) -> CITestSuitesToRunDict:
    """Creates a CITestSuitesToRunDict with the given parameters.

    Args:
        e2e: dict | None. The e2e test suites to run in the CI.
        acceptance: dict | None. The acceptance test suites to run in the CI.
        lighthouse_performance: dict | None. The lighthouse performance test
            suites to run in the CI.
        lighthouse_accessibility: dict | None. The lighthouse accessibility
            test suites to run in the CI.

    Returns:
        dict. The CITestSuitesToRunDict with the given parameters.
    """
    return {
        'e2e': e2e or
            create_ci_test_suites_dict(),
        'acceptance': acceptance or 
            create_ci_test_suites_dict(),
        'lighthouse_performance': lighthouse_performance or
            create_ci_test_suites_dict(),
        'lighthouse_accessibility': lighthouse_accessibility or
            create_ci_test_suites_dict()
    }


def get_git_diff_name_status_files(
    left: str, right: str
) -> List[str]:
    """Returns the list of files that have been modified between two commits.

    Args:
        left: str. The left commit.
        right: str. The right commit.

    Returns:
        list(str). The list of files that have been modified.

    Raises:
        ValueError. If there is an error with the git command.
    """
    git_cmd = ['git', 'diff', '--name-status']
    git_cmd.extend([left, right])
    git_cmd.append('--')

    task = subprocess.Popen(
        git_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    if not err:
        file_list = []
        for line in out.splitlines():
            file_list.append(line[1:].decode('utf-8').strip())
        return file_list
    else:
        raise ValueError(err)


def does_files_include_python(files: List[str]) -> bool:
    """Returns whether the list of files includes Python files.

    Args:
        files: list(str). The list of files to check.

    Returns:
        bool. Whether the list of files includes Python files.
    """
    for file in files:
        if file.endswith('.py'):
            return True
    return False


def get_root_files_config() -> RootFilesConfigDict:
    """Gets the root files configuration.

    Returns:
        dict. The root files configuration.
    """
    with open(ROOT_FILES_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
        return {
            'run_no_tests_root_files': config['RUN_NO_TESTS_ROOT_FILES'],
            'run_all_tests_root_files': config['RUN_ALL_TESTS_ROOT_FILES']
        }


def output_variable_to_github_workflow(
    output_variable: str,
    output_value: str
) -> None:
    """Outputs a variable to the GitHub workflow.

    Args:
        output_variable: str. The name of the output variable.
        output_value: str. The value of the output variable.
    """
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as o:
        print(f'{output_variable}={output_value}', file=o)


def split_tests_by_docker(
        test_suites: CITestSuitesDict
) -> dict[str, CITestSuitesDict]:
    """Splits the test suites into Docker and Python environments.

    Args:
        test_suites: list(dict). The test suites to split.

    Returns:
        tuple(list(dict), list(dict)). The test suites split into Docker and
        Python environments.
    """
    docker_test_suites = []
    python_test_suites = []
    for test_suite in test_suites.get('suites', []):
        print(test_suite)
        if test_suite.get('environment', 'python') == 'docker':
            docker_test_suites.append(test_suite)
        else:
            python_test_suites.append(test_suite)
    return {
        'docker': create_ci_test_suites_dict(docker_test_suites),
        'python': create_ci_test_suites_dict(python_test_suites)
    }


def output_test_suites_to_run_to_github_workflow(
    test_suites_to_run: CITestSuitesToRunDict
) -> None:
    """Formats the test suites to run and converts it to JSON
    for GitHub output.

    Args:
        test_suites_to_run: dict. The test suites to run.
    """
    test_suites_to_run_output = {
        'e2e': test_suites_to_run['e2e'],
        'acceptance': split_tests_by_docker(
            test_suites_to_run['acceptance']
        ),
        'lighthouse_performance':
            test_suites_to_run['lighthouse_performance'],
        'lighthouse_accessibility':
            test_suites_to_run['lighthouse_accessibility'],
    }
    print(
        'Test Suites to Run: ',
        json.dumps(test_suites_to_run_output, indent=4)
    )
    output_variable_to_github_workflow(
        GITHUB_OUTPUT_TEST_SUITES_TO_RUN,
        json.dumps(test_suites_to_run_output)
    )


def get_test_suites_from_config(
    test_suites_config_file_path: str
) -> List[GenericTestSuiteDict]:
    """Gets the test suites from a configuration file.

    Args:
        test_suites_config_file_path: str. The path to the test suites
            configuration file.

    Returns:
        list(dict). The test suites from the configuration file.
    """
    with open(test_suites_config_file_path, 'r', encoding='utf-8') as f:
        test_suites = json.load(f)
        suites: List[GenericTestSuiteDict] = test_suites[DEFAULT_SUITE]
        if DOCKER_SUITE in test_suites.keys():
            docker_suites = test_suites[DOCKER_SUITE]
            for docker_suite in docker_suites:
                docker_suite['environment'] = 'docker'
            suites.extend(docker_suites)
        return suites


def get_lighthouse_pages_from_config() -> List[LighthousePageDict]:
    """Gets the Lighthouse pages from the config file.

    Returns:
        list(dict). The list of Lighthouse pages.
    """
    lighthouse_pages: List[LighthousePageDict] = []
    with open(LIGHTHOUSE_PAGES_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
        for name, page in json.load(f).items():
            lighthouse_pages.append({
                'name': name,
                'url': page['url'],
                'page_module': page['page_module']
            })

    return lighthouse_pages


def partition_lighthouse_pages_into_test_suites(
    lighthouse_module: str,
    lighthouse_pages: List[LighthousePageDict]
) -> List[LighthouseTestSuiteDict]:
    """Partitions the Lighthouse pages into test suites.

    Args:
        lighthouse_module: str. The Lighthouse module.
        lighthouse_pages: list(dict). The list of Lighthouse pages.

    Returns:
        list(dict). The test suites to run.
    """
    lighthouse_test_suites: List[LighthouseTestSuiteDict] = []
    current_lighthouse_test_suite: LighthouseTestSuiteDict | None = None
    for i, page in enumerate(lighthouse_pages):
        if i % LIGHTHOUSE_PAGES_PER_SHARD == 0:
            if current_lighthouse_test_suite:
                lighthouse_test_suites.append(current_lighthouse_test_suite)
            current_lighthouse_test_suite = {
                'name': '%s' % (
                    str(i // LIGHTHOUSE_PAGES_PER_SHARD + 1)
                ),
                'module': lighthouse_module,
                'environment': 'python',
                'pages_to_run': []
            }
        assert current_lighthouse_test_suite is not None
        current_lighthouse_test_suite['pages_to_run'].append(
            page['name'])
    if current_lighthouse_test_suite:
        lighthouse_test_suites.append(current_lighthouse_test_suite)
    return lighthouse_test_suites


def get_all_test_suites_by_type() -> TestSuitesByTypeDict:
    """Gets the test suites configurations for each test type.

    Returns:
        dict. The test suites configurations for each test type.
    """

    e2e_test_suites = get_test_suites_from_config(
        os.path.join(
            CI_TEST_SUITE_CONFIGS_DIRECTORY,
            'e2e.json'
        )
    )
    acceptance_test_suites = get_test_suites_from_config(
        os.path.join(
            CI_TEST_SUITE_CONFIGS_DIRECTORY,
            'acceptance.json'
        )
    )

    lighthouse_accessibility_test_suites = (
        partition_lighthouse_pages_into_test_suites(
            LIGHTHOUSE_ACCESSIBILITY_MODULE,
            get_lighthouse_pages_from_config()
        )
    )
    lighthouse_performance_test_suites = (
        partition_lighthouse_pages_into_test_suites(
            LIGHTHOUSE_PERFORMANCE_MODULE,
            get_lighthouse_pages_from_config()
        )
    )

    return {
        'e2e': e2e_test_suites,
        'acceptance': acceptance_test_suites,
        'lighthouse_accessibility':
            lighthouse_accessibility_test_suites,
        'lighthouse_performance':
            lighthouse_performance_test_suites
    }


def output_all_test_suites_to_run_to_github_workflow() -> None:
    """Outputs all test suites to run to the GitHub workflow."""
    all_test_suites_by_type = get_all_test_suites_by_type()
    test_suites_to_run = create_ci_test_suites_to_run_dict(
        e2e=create_ci_test_suites_dict(
            all_test_suites_by_type['e2e']
        ),
        acceptance=create_ci_test_suites_dict(
            all_test_suites_by_type['acceptance']
        ),
        lighthouse_performance=create_ci_test_suites_dict(
            all_test_suites_by_type['lighthouse_performance']
        ),
        lighthouse_accessibility=create_ci_test_suites_dict(
            all_test_suites_by_type['lighthouse_accessibility']
        )
    )
    output_test_suites_to_run_to_github_workflow(test_suites_to_run)


def get_test_suite_by_name_from_list(
    test_suites: Sequence[GenericTestSuiteDict],
    test_suite_name: str
) -> GenericTestSuiteDict | None:
    """Gets a test suite by name from a list of test suites.

    Args:
        test_suites: list(dict). The list of test suites.
        test_suite_name: str. The name of the test suite.

    Returns:
        dict | None. The test suite with the given name or None if
        it does not exist.
    """
    return next(
        (
            test_suite for test_suite in test_suites
            if test_suite['name'] == test_suite_name
        ),
        None
    )


def get_test_suites_to_module_mapping_from_file(
    root_directory: str,
    file_path: str,
    test_suites: Sequence[GenericTestSuiteDict],
    main_directory: str,
) -> dict[str, List[str]]:
    """Gets the test suites to module mapping from a file.

    Args:
        root_directory: str. The root directory.
        file_path: str. The file path of the test config file.
        main_directory: str. The main test type directory.
        test_suites: list(dict). The list of test suites.

    Returns:
        dict. The test suites to module mapping.
    """
    test_suites_to_modules_mapping = {}
    full_path = os.path.join(root_directory, file_path)
    with open(full_path, 'r', encoding='utf-8') as f:
        modules = f.read().splitlines()
        file_path_relative_to_main_directory = os.path.relpath(
            full_path, main_directory)
        file_path_without_extension = os.path.splitext(
            file_path_relative_to_main_directory)[0]
        test_suite = get_test_suite_by_name_from_list(
            test_suites, file_path_without_extension)
        if test_suite is not None:
            test_suites_to_modules_mapping[test_suite['name']] = modules

    return test_suites_to_modules_mapping


def get_test_suites_to_module_mapping_from_directory(
    module_mapping_directory: str,
    test_suites: Sequence[GenericTestSuiteDict],
    main_directory: Optional[str] = None
) -> dict[str, List[str]]:
    """Gets the test suites to module mapping from a directory.

    Args:
        module_mapping_directory: str. The directory to get the
            test suites to module mapping from.
        test_suites: list(dict). The list of test suites.
        main_directory: str | None. The main test type directory.
            Defaults to None.

    Returns:
        dict. The test suites to module mapping.
    """
    if main_directory is None:
        main_directory = module_mapping_directory
    test_suites_to_modules_mapping: dict[str, List[str]] = {}
    for root, directories, files in os.walk(module_mapping_directory):
        for file in files:
            test_suites_to_modules_mapping.update(
                get_test_suites_to_module_mapping_from_file(
                    root, file, test_suites, main_directory
                )
            )
        for directory in directories:
            sub_directory_path = os.path.join(root, directory)
            test_suites_to_modules_mapping.update(
                get_test_suites_to_module_mapping_from_directory(
                    sub_directory_path, test_suites, main_directory
                )
            )

    return test_suites_to_modules_mapping


def extend_test_suites_without_duplicates(
    test_suites: List[GenericTestSuiteDict],
    test_suites_to_extend: List[GenericTestSuiteDict]
) -> List[GenericTestSuiteDict]:
    """Extends a list of test suites without duplicates.

    Args:
        test_suites: list(dict). The list of test suites to extend.
        test_suites_to_extend: list(dict). The list of test suites to
            extend with.

    Returns:
        list(dict). The list of test suites extended without duplicates.
    """
    for test_suite in test_suites_to_extend:
        if test_suite not in test_suites:
            test_suites.append(test_suite)
    return test_suites


def get_test_suites_affected_by_root_file(
    root_file: str,
    test_suites_to_module_mapping: dict[str, List[str]],
    test_suites: Sequence[GenericTestSuiteDict]
) -> List[GenericTestSuiteDict]:
    """Gets the test suites affected by a root file.

    Args:
        root_file: str. The root file.
        test_suites_to_module_mapping: dict. The test suites to module mapping
            for the test type.
        test_suites: list(dict). The list of test suites.

    Returns:
        list(dict). The test suites affected by the root file.
    """
    test_suites_affected: List[GenericTestSuiteDict] = []
    for test_suite in test_suites:
        if test_suite['name'] not in test_suites_to_module_mapping:
            test_suites_affected.append(test_suite)
    for (
        test_suite_name,
        test_suite_modules
    ) in test_suites_to_module_mapping.items():
        test_suite_by_name = get_test_suite_by_name_from_list(
            test_suites, test_suite_name
        )
        if (
            test_suite_by_name is not None and (
                root_file in test_suite_modules or
                root_file == test_suite_by_name['module']
            )
        ):
            test_suites_affected.append(test_suite_by_name)

    return extend_test_suites_without_duplicates(
        [],
        test_suites_affected
    )


def get_affected_lighthouse_pages(
    modified_root_files: Set[str],
    lighthouse_module: str
) -> List[LighthousePageDict]:
    """Gets the affected Lighthouse pages by a list of modified root files.

    Args:
        modified_root_files: set(str). The set of modified root files.
        lighthouse_module: str. The Lighthouse module.

    Returns:
        list(dict). The affected Lighthouse pages sorted by name.
    """
    lighthouse_pages = get_lighthouse_pages_from_config()
    # If the Lighthouse module is in the modified root files, then all
    # Lighthouse pages should be run.
    if lighthouse_module in modified_root_files:
        return lighthouse_pages
    affected_lighthouse_pages: List[LighthousePageDict] = []
    for modified_root_file in modified_root_files:
        for lighthouse_page in lighthouse_pages:
            if modified_root_file == lighthouse_page['page_module']:
                affected_lighthouse_pages.append(lighthouse_page)

    return sorted(affected_lighthouse_pages, key=lambda x: x['name'])


def get_ci_test_suites_to_run(
    modified_files: List[str],
    root_files_mapping: dict[str, List[str]]
) -> CITestSuitesToRunDict | None:
    """Gets the test suites to run in the CI.

    Args:
        modified_files: list(str). The list of modified files.
        root_files_mapping: dict. The root files mapping.

    Returns:
        dict | None. The test suites to run in the CI or None if all test
        suites should be run.
    """
    modified_root_files: Set[str] = set()
    for file in modified_files:
        # If the file is not in the root files mapping, then all test suites
        # should be run. This is the case for files that are not scraped by
        # the root files mapping script (e.g. files like package.json).
        if file not in root_files_mapping:
            return None
        modified_root_files.update(root_files_mapping[file])

    root_files_config = get_root_files_config()
    if modified_root_files.intersection(
        root_files_config['run_all_tests_root_files']
    ):
        return None

    all_test_suites_by_type = get_all_test_suites_by_type()

    acceptance_test_suites_to_module_mapping = (
        get_test_suites_to_module_mapping_from_directory(
            os.path.join(
                TEST_MODULES_MAPPING_DIRECTORY,
                'acceptance'
            ),
            all_test_suites_by_type['acceptance']
        )
    )

    acceptance_test_suites: List[GenericTestSuiteDict] = []

    for root_file in modified_root_files:
        acceptance_test_suites = extend_test_suites_without_duplicates(
            acceptance_test_suites,
            get_test_suites_affected_by_root_file(
                root_file,
                acceptance_test_suites_to_module_mapping,
                all_test_suites_by_type['acceptance']
            )
        )

    lighthouse_accessibility_test_suites = (
        partition_lighthouse_pages_into_test_suites(
            LIGHTHOUSE_ACCESSIBILITY_MODULE,
            get_affected_lighthouse_pages(
                modified_root_files,
                LIGHTHOUSE_ACCESSIBILITY_MODULE
            )
        )
    )

    lighthouse_performance_test_suites = (
        partition_lighthouse_pages_into_test_suites(
            LIGHTHOUSE_PERFORMANCE_MODULE,
            get_affected_lighthouse_pages(
                modified_root_files,
                LIGHTHOUSE_PERFORMANCE_MODULE
            )
        )
    )

    return create_ci_test_suites_to_run_dict(
        e2e=create_ci_test_suites_dict(all_test_suites_by_type['e2e']),
        acceptance=create_ci_test_suites_dict(
            acceptance_test_suites
        ),
        lighthouse_accessibility=create_ci_test_suites_dict(
            lighthouse_accessibility_test_suites
        ),
        lighthouse_performance=create_ci_test_suites_dict(
            lighthouse_performance_test_suites
        )
    )


def main(args: Optional[list[str]] = None) -> None:
    """Checks and outputs the test suites to run in the CI."""
    parsed_args = _PARSER.parse_args(args)

    generate_root_files_mapping.main()
    if parsed_args.output_all_test_suites:
        output_all_test_suites_to_run_to_github_workflow()
        return

    changed_files = get_git_diff_name_status_files(
        parsed_args.github_base_ref, parsed_args.github_head_ref)

    print('Changed files:', changed_files)

    if does_files_include_python(changed_files):
        output_all_test_suites_to_run_to_github_workflow()
        return

    with open(ROOT_FILES_MAPPING_FILE_PATH, 'r', encoding='utf-8') as f:
        root_files_mapping = json.load(f)
        ci_test_suites_to_run = get_ci_test_suites_to_run(
            changed_files, root_files_mapping)

        if ci_test_suites_to_run is None:
            output_all_test_suites_to_run_to_github_workflow()
            return

        output_test_suites_to_run_to_github_workflow(ci_test_suites_to_run)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_e2e_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()

# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for scripts/check_ci_test_suites_to_run.py."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile

from core.tests import test_utils
from scripts import check_ci_test_suites_to_run
from scripts import generate_root_files_mapping
from typing import List, Sequence


LIGHTHOUSE_PAGES_CONFIG = {
    'splash': {
        'url': 'http://localhost:8181/',
        'page_module': 'splash-page.module.ts'
    },
    'about': {
        'url': 'http://localhost:8181/about',
        'page_module': 'about-page.module.ts'
    },
    'terms': {
        'url': 'http://localhost:8181/terms',
        'page_module': 'terms-page.module.ts'
    },
    'privacy-policy': {
        'url': 'http://localhost:8181/privacy-policy',
        'page_module': 'privacy-page.module.ts'
    },
    'exploration-player': {
        'url': 'http://localhost:8181/explore/{{topic_id}}',
        'page_module': 'exploration-player-page.module.ts'
    },
    'exploration-editor': {
        'url': 'http://localhost:8181/create/{{topic_id}}',
        'page_module': 'exploration-editor-page.module.ts'
    },
    'blog-admin': {
        'url': 'http://localhost:8181/admin/blog',
        'page_module': 'blog-admin-page.module.ts'
    },
    'blog-editor': {
        'url': 'http://localhost:8181/admin/blog',
        'page_module': 'blog-editor-page.module.ts'
    },
    'community': {
        'url': 'http://localhost:8181/community',
        'page_module': 'community-page.module.ts'
    },
    'login': {
        'url': 'http://localhost:8181/login',
        'page_module': 'login-page.module.ts'
    },
    'contact': {
        'url': 'http://localhost:8181/contact',
        'page_module': 'contact-page.module.ts'
    },
    'donate': {
        'url': 'http://localhost:8181/donate',
        'page_module': 'donate-page.module.ts'
    },
    'get-started': {
        'url': 'http://localhost:8181/get-started',
        'page_module': 'get-started-page.module.ts'
    },
    'teach': {
        'url': 'http://localhost:8181/teach',
        'page_module': 'teach-page.module.ts'
    },
    'thanks': {
        'url': 'http://localhost:8181/thanks',
        'page_module': 'thanks-page.module.ts'
    },
    'volunteer': {
        'url': 'http://localhost:8181/volunteer',
        'page_module': 'volunteer-page.module.ts'
    },
    'contributor-dashboard': {
        'url': 'http://localhost:8181/contributor-dashboard',
        'page_module': 'contributor-dashboard-page.module.ts'
    },
    'learner-dashboard': {
        'url': 'http://localhost:8181/learner-dashboard',
        'page_module': 'learner-dashboard-page.module.ts'
    },
    'email-dashboard': {
        'url': 'http://localhost:8181/email-dashboard',
        'page_module': 'email-dashboard-page.module.ts'
    }
}

LIGHTHOUSE_PAGES_FOR_SUITES = {
    '1': [
        'splash',
        'about',
        'terms',
        'privacy-policy',
        'exploration-player',
        'exploration-editor',
        'blog-admin',
        'blog-editor',
        'community',
        'login',
        'contact',
        'donate',
        'get-started',
        'teach',
        'thanks',
        'volunteer',
        'contributor-dashboard',
    ],
    '2': [
        'learner-dashboard',
        'email-dashboard'
    ]
}

LIGHTHOUSE_PAGES: List[check_ci_test_suites_to_run.LighthousePageDict] = [
    {
        'name': name,
        'url': page['url'],
        'page_module': page['page_module']
    } for name, page in LIGHTHOUSE_PAGES_CONFIG.items()
]


class CheckCITestSuitesToRunTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()

        self.maxDiff = None
        self.tempdir = tempfile.TemporaryDirectory()
        root_files_mapping_file = os.path.join(
            self.tempdir.name, 'root-files-mapping.json')
        with open(root_files_mapping_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'README.md': ['README.md'],
                'assets/README.md': ['assets/README.md'],
                'CODEOWNERS': ['CODEOWNERS'],
                'src/main.ts': ['src/main.ts'],
                'splash-banner.component.html': ['splash-page.module.ts'],
                'about-component.ts': ['about-page.module.ts'],
                'terms.component.html': ['terms-page.module.ts'],
                'privacy-policy.component.ts': ['privacy-page.module.ts'],
                'exploration-player.component.html': [
                    'exploration-player-page.module.ts'
                ],
                'exploration-player-banners.component.html': [
                    'exploration-player-page.module.ts'
                ],
                'exploration-player/view-exploration.spec.ts': [
                    'exploration-player/view-exploration.spec.ts'
                ],
                '.lighthouserc-performance.js': [
                    '.lighthouserc-performance.js'
                ],
            }))
        root_files_config_file = os.path.join(
            self.tempdir.name, 'root-files-config.json')
        with open(root_files_config_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'RUN_NO_TESTS_ROOT_FILES': [
                    'README.md',
                    'assets/README.md',
                    'CODEOWNERS'
                ],
                'RUN_ALL_TESTS_ROOT_FILES': [
                    'src/main.ts' 
                ]
            }))
        lighthouse_pages_config_file = os.path.join(
            self.tempdir.name, 'lighthouse-pages.json')
        with open(lighthouse_pages_config_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps(LIGHTHOUSE_PAGES_CONFIG))
        ci_test_suite_configs_directory = os.path.join(
            self.tempdir.name, 'ci-test-suite-configs')
        os.mkdir(ci_test_suite_configs_directory)
        with open(
            os.path.join(ci_test_suite_configs_directory, 'acceptance.json'),
            'w',
            encoding='utf-8'
        ) as f:
            f.write(json.dumps({
                'suites': [
                    {
                        'name': 'blog-admin/assign-roles',
                        'module': 'blog-admin/assign-roles.spec.ts'
                    },
                    {
                        'name': 'blog-editor/publish',
                        'module': 'blog-editor/publish.spec.ts'
                    }
                ],
                'docker_suites': [
                    {
                        'name': 'exploration-player/view-exploration',
                        'module': 'exploration-player/view-exploration.spec.ts'
                    }
                ]
            }))
        with open(
            os.path.join(ci_test_suite_configs_directory, 'e2e.json'),
            'w',
            encoding='utf-8'
        ) as f:
            f.write(json.dumps({
                'suites': [
                    {
                        'name': 'accessibility',
                        'module': 'accessibility.js'
                    },
                    {
                        'name': 'additionalEditorFeatures',
                        'module': 'additionalEditorFeatures.js'
                    },
                    {
                        'name': 'additionalEditorFeaturesModals',
                        'module': 'additionalEditorFeaturesModals.js'
                    }
                ]
            }))
        test_modules_mapping_directory = os.path.join(
            self.tempdir.name, 'test-modules-mapping')
        os.mkdir(test_modules_mapping_directory)
        acceptance_test_modules_mapping_directory = os.path.join(
            test_modules_mapping_directory, 'acceptance')
        os.mkdir(acceptance_test_modules_mapping_directory)
        os.mkdir(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'blog-admin'
            )
        )
        with open(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'blog-admin/assign-roles.txt'
            ),
            'w',
            encoding='utf-8'
        ) as f:
            f.write('blog-admin-page.module.ts')
        with open(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'blog-admin/delete-blog-post.txt'
            ),
            'w',
            encoding='utf-8'
        ) as f:
            f.write('blog-admin-page.module.ts')
        os.mkdir(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'blog-editor'
            )
        )
        with open(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'blog-editor/publish.txt'
            ),
            'w',
            encoding='utf-8'
        ) as f:
            f.write(
                'blog-admin-page.module.ts\n'
                'blog-dashboard-page.module.ts'
            )
        os.mkdir(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'exploration-player'
            )
        )
        with open(
            os.path.join(
                acceptance_test_modules_mapping_directory,
                'exploration-player/view-exploration.txt'
            ),
            'w',
            encoding='utf-8'
        ) as f:
            f.write('exploration-player-page.module.ts')

        self.root_files_mapping_file_path_swap = self.swap(
            check_ci_test_suites_to_run, 'ROOT_FILES_MAPPING_FILE_PATH',
            root_files_mapping_file)
        self.root_files_config_file_path_swap = self.swap(
            check_ci_test_suites_to_run, 'ROOT_FILES_CONFIG_FILE_PATH',
            root_files_config_file)
        self.lighthouse_pages_config_file_path_swap = self.swap(
            check_ci_test_suites_to_run, 'LIGHTHOUSE_PAGES_CONFIG_FILE_PATH',
            lighthouse_pages_config_file)
        self.ci_test_suite_configs_directory_swap = self.swap(
            check_ci_test_suites_to_run, 'CI_TEST_SUITE_CONFIGS_DIRECTORY',
            ci_test_suite_configs_directory)
        self.test_modules_mapping_directory_swap = self.swap(
            check_ci_test_suites_to_run, 'TEST_MODULES_MAPPING_DIRECTORY',
            test_modules_mapping_directory)
        self.github_output_file_path = os.path.join(
            self.tempdir.name, 'github-output.json')
        os.environ['GITHUB_OUTPUT'] = self.github_output_file_path

        def mock_generate_root_files_mapping() -> None:
            """Mocks the main function of generate_root_files_mapping script."""
            pass

        self.generate_root_files_mapping_swap = self.swap(
            generate_root_files_mapping, 'main',
            mock_generate_root_files_mapping)

        self.all_test_suites = {
            'acceptance': {
                'docker': {
                    'count': 1, 
                    'suites': [
                        {
                            'name': 'exploration-player/view-exploration',
                            'module': 
                                'exploration-player/view-exploration.spec.ts',
                            'environment': 'docker'
                        }
                    ]},
                'python': {
                    'count': 2,
                    'suites': [
                        {
                            'name': 'blog-admin/assign-roles',
                            'module': 'blog-admin/assign-roles.spec.ts'
                        },
                        {
                            'name': 'blog-editor/publish',
                            'module': 'blog-editor/publish.spec.ts'
                        }
                    ],
                }
            },
            'e2e': {
                'suites': [
                    {
                        'name': 'accessibility',
                        'module': 'accessibility.js'
                    },
                    {
                        'name': 'additionalEditorFeatures',
                        'module': 'additionalEditorFeatures.js'
                    },
                    {
                        'name': 'additionalEditorFeaturesModals',
                        'module': 'additionalEditorFeaturesModals.js'
                    }
                ],
                'count': 3
            },
            'lighthouse_accessibility': {
                'suites': [
                    {
                        'name': '1',
                        'module': '.lighthouserc-accessibility.js',
                        'environment': 'python',
                        'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['1']
                    },
                    {
                        'name': '2',
                        'module': '.lighthouserc-accessibility.js',
                        'environment': 'python',
                        'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['2']
                    }
                ],
                'count': 2
            },
            'lighthouse_performance': {
                'suites': [
                    {
                        'name': '1',
                        'module': '.lighthouserc-performance.js',
                        'environment': 'python',
                        'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['1']
                    },
                    {
                        'name': '2',
                        'module': '.lighthouserc-performance.js',
                        'environment': 'python',
                        'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['2']
                    }
                ],
                'count': 2
            }
        }

    def tearDown(self) -> None:
        super().tearDown()
        self.tempdir.cleanup()

    def test_extend_test_suites_without_duplicates(self) -> None:
        test_suites: List[check_ci_test_suites_to_run.GenericTestSuiteDict] = [
            {'name': 'suite1', 'module': 'module1', 'environment': 'python'},
            {'name': 'suite2', 'module': 'module2', 'environment': 'python'},
            {'name': 'suite3', 'module': 'module3', 'environment': 'python'}
        ]
        test_suites_to_add: List[
            check_ci_test_suites_to_run.GenericTestSuiteDict
        ] = [
            {'name': 'suite2', 'module': 'module2', 'environment': 'python'},
            {'name': 'suite3', 'module': 'module3', 'environment': 'python'},
            {'name': 'suite4', 'module': 'module4', 'environment': 'python'}
        ]
        extended_test_suites = (
            check_ci_test_suites_to_run.extend_test_suites_without_duplicates(
                test_suites, test_suites_to_add
            )
        )
        self.assertEqual(
            extended_test_suites,
            [
                {
                    'name': 'suite1', 
                    'module': 'module1', 
                    'environment': 'python'
                },
                {
                    'name': 'suite2', 
                    'module': 'module2', 
                    'environment': 'python'
                },
                {
                    'name': 'suite3', 
                    'module': 'module3', 
                    'environment': 'python'
                },
                {
                    'name': 'suite4', 
                    'module': 'module4', 
                    'environment': 'python'
                }
            ]
        )

    def get_test_suites_to_run_from_github_output(
        self
    ) -> Sequence[check_ci_test_suites_to_run.GenericTestSuiteDict]:
        """Get the test suites to run from the GitHub output file."""
        with open(self.github_output_file_path, 'r', encoding='utf-8') as f:
            test_suites_json = f.read().split('=')[1]
            test_suites: Sequence[
                check_ci_test_suites_to_run.GenericTestSuiteDict
            ] = json.loads(test_suites_json)
            print(test_suites)
            return test_suites

    def test_get_git_diff_name_status_files_without_error(self) -> None:
        class MockSubprocessPopen:
            """Mocks the subprocess.Popen class."""

            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:
                """Mocks the communicate method of subprocess.Popen class."""
                return (
                    b'M core/components/oppia-angular-root.component.html\n'
                    b'M core/constants.py\n'
                    b'A core/utils.py\n'
                    b'R core/templates/pages/Base.ts\n',
                    b''
                )

        def mock_popen(
            cmd_tokens: List[str], stdout: int, stderr: int # pylint: disable=unused-argument
        ) -> MockSubprocessPopen:
            return MockSubprocessPopen()

        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)

        with swap_popen:
            git_diff_name_status_files = (
                check_ci_test_suites_to_run.get_git_diff_name_status_files(
                    'left', 'right')
            )
            self.assertEqual(
                git_diff_name_status_files,
                [
                    'core/components/oppia-angular-root.component.html',
                    'core/constants.py',
                    'core/utils.py',
                    'core/templates/pages/Base.ts'
                ]
            )

    def test_get_git_diff_name_status_files_with_error(self) -> None:
        class MockSubprocessPopen:
            """Mocks an error in the subprocess.Popen class."""

            returncode = 1
            def communicate(self) -> tuple[bytes, bytes]:
                """Mocks the communicate method of subprocess.Popen class."""
                return (
                    b'',
                    b'fatal: not a valid git branch\n'
                )

        def mock_popen(
            cmd_tokens: List[str], stdout: int, stderr: int # pylint: disable=unused-argument
        ) -> MockSubprocessPopen:
            return MockSubprocessPopen()

        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)

        with swap_popen:
            with self.assertRaisesRegex(
                ValueError, 'fatal: not a valid git branch'
            ):
                check_ci_test_suites_to_run.get_git_diff_name_status_files(
                    'left', 'right')

    def test_does_files_include_python(self) -> None:
        self.assertTrue(
            check_ci_test_suites_to_run.does_files_include_python(
                ['core/components/oppia-angular-root.component.html',
                 'core/constants.py',
                 'core/utils.py',
                 'core/templates/pages/Base.ts']
            )
        )
        self.assertFalse(
            check_ci_test_suites_to_run.does_files_include_python(
                ['core/components/oppia-angular-root.component.html',
                 'core/templates/pages/Base.ts']
            )
        )

    def test_split_tests_by_docker(self) -> None:
        suites_to_split: check_ci_test_suites_to_run.CITestSuitesDict = {
            'count': 3,
            'suites': [
                {
                    'name': 'suite1',
                    'module': 'module1',
                    'environment': 'python'
                },
                {
                    'name': 'suite2',
                    'module': 'module2',
                    'environment': 'python'
                },
                {
                    'name': 'suite3',
                    'module': 'module3',
                    'environment': 'docker'
                }
            ]
        }

        self.assertEqual(
            check_ci_test_suites_to_run.split_tests_by_docker(suites_to_split),
            {
                'docker': {
                    'count': 1,
                    'suites': [
                        {
                            'name': 'suite3',
                            'module': 'module3',
                            'environment': 'docker'
                        }
                    ]
                },
                'python': {
                    'count': 2,
                    'suites': [
                        {
                            'name': 'suite1',
                            'module': 'module1',
                            'environment': 'python'
                        },
                        {
                            'name': 'suite2',
                            'module': 'module2',
                            'environment': 'python'
                        }
                    ]
                }
            }
        )

    def test_get_lighthouse_pages_from_config(self) -> None:
        with self.lighthouse_pages_config_file_path_swap:
            self.assertEqual(
                check_ci_test_suites_to_run.get_lighthouse_pages_from_config(),
                LIGHTHOUSE_PAGES
            )

    def test_partition_lighthouse_pages_into_test_suites_one_shard_output(
        self
    ) -> None:
        lighthouse_pages: List[
            check_ci_test_suites_to_run.LighthousePageDict
        ] = [
            {
                'name': 'splash',
                'url': 'http://localhost:8181/',
                'page_module': 'splash-page.module.ts'
            },
            {
                'name': 'about',
                'url': 'http://localhost:8181/about',
                'page_module': 'about-page.module.ts'
            },
            {
                'name': 'terms',
                'url': 'http://localhost:8181/terms',
                'page_module': 'terms-page.module.ts'
            },
            {
                'name': 'privacy-policy',
                'url': 'http://localhost:8181/privacy-policy',
                'page_module': 'privacy-page.module.ts'
            },
            {
                'name': 'exploration-player',
                'url': 'http://localhost:8181/explore/{{topic_id}}',
                'page_module': 'exploration-player-page.module.ts'
            }
        ]

        self.assertEqual(
            check_ci_test_suites_to_run
                .partition_lighthouse_pages_into_test_suites(
                    'performance.js',
                    lighthouse_pages
                ),
            [
                {
                    'name': '1',
                    'module': 'performance.js',
                    'environment': 'python',
                    'pages_to_run': [
                        'splash',
                        'about',
                        'terms',
                        'privacy-policy',
                        'exploration-player'
                    ]
                }
            ]
        )

    def test_partition_lighthouse_pages_into_test_suites_multiple_shards_output(
        self
    ) -> None:
        self.assertEqual(
            check_ci_test_suites_to_run
                .partition_lighthouse_pages_into_test_suites(
                    'performance.js',
                    LIGHTHOUSE_PAGES
                ),
            [
                {
                    'name': '1',
                    'module': 'performance.js',
                    'environment': 'python',
                    'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['1']
                },
                {
                    'name': '2',
                    'module': 'performance.js',
                    'environment': 'python',
                    'pages_to_run': LIGHTHOUSE_PAGES_FOR_SUITES['2']
                }
            ]
        )

    def test_check_ci_test_suites_to_run_with_output_all_suites(self) -> None:
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    check_ci_test_suites_to_run.main(
                        [
                            '--github_base_ref', 'base',
                            '--github_head_ref', 'head',
                            '--output_all_test_suites'
                        ]
                    )
                    self.assertEqual(
                        self.get_test_suites_to_run_from_github_output(),
                        self.all_test_suites
                    )

    def test_check_ci_test_suites_to_run_with_python_file(self) -> None:
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: ['core/constants.py', 'core/utils.py']
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(), # pylint: disable=line-too-long
                            self.all_test_suites
                        )

    def test_check_ci_test_suites_to_run_with_file_not_in_root_file_mapping(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: ['package.json']
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(), # pylint: disable=line-too-long
                            self.all_test_suites
                        )

    def test_check_ci_test_suites_to_run_with_no_tests_corresponding_to_changed_files(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: [
                            'README.md',
                            'assets/README.md',
                            'CODEOWNERS'
                        ]
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(), # pylint: disable=line-too-long
                            {
                                'e2e': self.all_test_suites['e2e'],
                                'acceptance': {
                                    'docker': {'count': 0, 'suites': []},
                                    'python': {'count': 0, 'suites': []}
                                },
                                'lighthouse_accessibility': {
                                    'suites': [],
                                    'count': 0
                                },
                                'lighthouse_performance': {
                                    'suites': [],
                                    'count': 0
                                }
                            }
                        )

    def test_check_ci_test_suites_to_run_with_run_all_tests_root_file(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: ['src/main.ts']
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(),
                            self.all_test_suites
                        )

    def test_check_ci_test_suites_to_run_with_partial_root_file_changes(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: [
                            'splash-banner.component.html',
                            'about-component.ts',
                            'terms.component.html',
                            'exploration-player.component.html',
                            'exploration-player-banners.component.html'
                        ]
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(),
                            {
                                'e2e': self.all_test_suites['e2e'],
                                'acceptance': {
                                    'docker': {
                                        'count': 1,
                                        'suites': [
                                            {
                                                'name': 'exploration-player/view-exploration', # pylint: disable=line-too-long
                                                'module': 'exploration-player/view-exploration.spec.ts', # pylint: disable=line-too-long
                                                'environment': 'docker'
                                            }
                                        ]
                                    },
                                    'python': {'count': 0, 'suites': []},
                                },
                                'lighthouse_performance': {
                                    'suites': [
                                        {
                                            'name': '1',
                                            'module': '.lighthouserc-performance.js', # pylint: disable=line-too-long
                                            'environment': 'python',
                                            'pages_to_run': [
                                                'about',
                                                'exploration-player',
                                                'splash',
                                                'terms'
                                            ]
                                        }
                                    ],
                                    'count': 1
                                },
                                'lighthouse_accessibility': {
                                    'suites': [
                                        {
                                            'name': '1',
                                            'module': '.lighthouserc-accessibility.js', # pylint: disable=line-too-long
                                            'environment': 'python',
                                            'pages_to_run': [
                                                'about',
                                                'exploration-player',
                                                'splash',
                                                'terms'
                                            ]
                                        }
                                    ],
                                    'count': 1
                                }
                            }
                        )

    def test_check_ci_test_suites_to_run_with_changed_test_module(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: [
                            'exploration-player/view-exploration.spec.ts'
                        ]
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(),
                            {
                                'e2e': self.all_test_suites['e2e'],
                                'acceptance': {
                                    'docker': {
                                        'suites': [
                                            {
                                                'name': 'exploration-player/view-exploration', # pylint: disable=line-too-long
                                                'module': 'exploration-player/view-exploration.spec.ts', # pylint: disable=line-too-long
                                                'environment': 'docker'
                                            }
                                        ],
                                        'count': 1
                                    },
                                    'python': {'count': 0, 'suites': []}
                                },
                                'lighthouse_accessibility': {
                                    'suites': [],
                                    'count': 0
                                },
                                'lighthouse_performance': {
                                    'suites': [],
                                    'count': 0
                                }
                            }
                        )

    def test_check_ci_test_suites_to_run_with_changed_lighthouse_modules(self) -> None: # pylint: disable=line-too-long
        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: [
                            '.lighthouserc-performance.js'
                        ]
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(),
                            {
                                'e2e': self.all_test_suites['e2e'],
                                'acceptance': {
                                    'docker': {
                                        'suites': [],
                                        'count': 0
                                    },
                                    'python': {
                                        'suites': [],
                                        'count': 0
                                    }
                                },
                                'lighthouse_accessibility': {
                                    'suites': [],
                                    'count': 0
                                },
                                'lighthouse_performance': {
                                    'suites': [
                                        {
                                            'name': '1',
                                            'module':
                                                '.lighthouserc-performance.js',
                                            'environment': 'python',
                                            'pages_to_run':
                                                LIGHTHOUSE_PAGES_FOR_SUITES['1']
                                        },
                                        {
                                            'name': '2',
                                            'module':
                                                '.lighthouserc-performance.js',
                                            'environment': 'python',
                                            'pages_to_run':
                                                LIGHTHOUSE_PAGES_FOR_SUITES['2']
                                        }
                                    ],
                                    'count': 2
                                }
                            }
                        )

    def test_check_ci_test_suites_to_run_with_missing_test_suite_to_module_mapping(self) -> None: # pylint: disable=line-too-long
        acceptance_config_file_path = os.path.join(
            self.tempdir.name,
            'ci-test-suite-configs',
            'acceptance.json'
        )
        with open(
            acceptance_config_file_path,
            'r',
            encoding='utf-8'
        ) as f:
            acceptance_config = json.load(f)
            acceptance_config['suites'].append({
                'name': 'blog-admin/create-blog-post',
                'module': 'blog-admin/create-blog-post.spec.ts'
            })

        with open(
            acceptance_config_file_path,
            'w+',
             encoding='utf-8'
        ) as f:
            f.write(json.dumps(acceptance_config))

        with self.root_files_mapping_file_path_swap, self.lighthouse_pages_config_file_path_swap: # pylint: disable=line-too-long
            with self.ci_test_suite_configs_directory_swap, self.test_modules_mapping_directory_swap: # pylint: disable=line-too-long
                with self.root_files_config_file_path_swap, self.generate_root_files_mapping_swap: # pylint: disable=line-too-long
                    with self.swap(
                        check_ci_test_suites_to_run,
                        'get_git_diff_name_status_files',
                        lambda *args: [
                            'README.md'
                        ]
                    ):
                        check_ci_test_suites_to_run.main(
                            [
                                '--github_base_ref', 'base',
                                '--github_head_ref', 'head'
                            ]
                        )
                        self.assertEqual(
                            self.get_test_suites_to_run_from_github_output(),
                            {
                                'e2e': self.all_test_suites['e2e'],
                                'acceptance': {
                                    'docker': {'count': 0, 'suites': []},
                                    'python': {
                                        'suites': [
                                            {
                                                'name': 'blog-admin/create-blog-post', # pylint: disable=line-too-long
                                                'module': 'blog-admin/create-blog-post.spec.ts' # pylint: disable=line-too-long
                                            }
                                        ],
                                        'count': 1
                                    }
                                },
                                'lighthouse_accessibility': {
                                    'suites': [],
                                    'count': 0
                                },
                                'lighthouse_performance': {
                                    'suites': [],
                                    'count': 0
                                }
                            }
                        )

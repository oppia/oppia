# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/run_lighthouse_tests.py."""

from __future__ import annotations

import builtins
import json
import os
import subprocess
import sys

from core import feconf
from core.constants import constants
from core.tests import test_utils
from scripts import build
from scripts import common
from scripts import run_lighthouse_tests
from scripts import servers

GOOGLE_APP_ENGINE_PORT = 8181
LIGHTHOUSE_MODE_PERFORMANCE = 'performance'
LIGHTHOUSE_MODE_ACCESSIBILITY = 'accessibility'
LIGHTHOUSE_CONFIG_FILENAMES = {
    LIGHTHOUSE_MODE_PERFORMANCE: '.lighthouserc-performance.js',
    LIGHTHOUSE_MODE_ACCESSIBILITY: '.lighthouserc-accessibility.js'
}


class MockCompiler:
    def wait(self) -> None: # pylint: disable=missing-docstring
        pass


class MockCompilerContextManager():
    def __init__(self) -> None:
        pass

    def __enter__(self) -> MockCompiler:
        return MockCompiler()

    def __exit__(self, *unused_args: str) -> None:
        pass


class RunLighthouseTestsTests(test_utils.GenericTestBase):
    """Unit tests for scripts/run_lighthouse_tests.py."""

    def setUp(self) -> None:
        super().setUp()
        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        self.swap_sys_exit = self.swap(sys, 'exit', lambda _: None)
        puppeteer_path = (
            os.path.join('core', 'tests', 'puppeteer', 'lighthouse_setup.js'))
        self.puppeteer_bash_command = [common.NODE_BIN_PATH, puppeteer_path]
        lhci_path = os.path.join(
            'node_modules', '@lhci', 'cli', 'src', 'cli.js')
        self.lighthouse_check_bash_command = [
            common.NODE_BIN_PATH, lhci_path, 'autorun',
            '--config=%s' % (
                LIGHTHOUSE_CONFIG_FILENAMES[LIGHTHOUSE_MODE_PERFORMANCE]),
            '--max-old-space-size=4096'
        ]
        # Arguments to record in lighthouse_setup.js.
        self.extra_args = [
            '-record',
            os.path.join(os.getcwd(), '..', 'lhci-puppeteer-video', 'video.mp4')
        ]

        def mock_context_manager() -> MockCompilerContextManager:
            return MockCompilerContextManager()
        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        self.swap_ng_build = self.swap(
            servers, 'managed_ng_build', mock_context_manager)
        self.swap_webpack_compiler = self.swap(
            servers, 'managed_webpack_compiler', mock_context_manager)
        self.swap_redis_server = self.swap(
            servers, 'managed_redis_server', mock_context_manager)
        self.swap_elasticsearch_dev_server = self.swap(
            servers, 'managed_elasticsearch_dev_server', mock_context_manager)
        self.swap_firebase_auth_emulator = self.swap(
            servers, 'managed_firebase_auth_emulator', mock_context_manager)
        self.swap_cloud_datastore_emulator = self.swap(
            servers, 'managed_cloud_datastore_emulator', mock_context_manager)
        self.swap_dev_appserver = self.swap_with_checks(
            servers, 'managed_dev_appserver',
            lambda *unused_args, **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[{
                'port': GOOGLE_APP_ENGINE_PORT,
                'log_level': 'critical',
                'skip_sdk_update_check': True,
                'env': env
            }])
        with open('dummy-lighthouse-pages.json', 'w', encoding='utf-8') as f:
            f.write(
                json.dumps({
                    'splash': {
                        'url': 'http://localhost:8181/'
                    },
                    'about': {
                        'url': 'http://localhost:8181/about'
                    },
                    'contact': {
                        'url': 'http://localhost:8181/contact'
                    }
                })
            )
        self.lighthouse_pages_json_filepath_swap = self.swap(
            run_lighthouse_tests, 'LIGHTHOUSE_PAGES_JSON_FILEPATH',
            'dummy-lighthouse-pages.json')
        self.oppia_is_dockerized_swap = self.swap(
            feconf, 'OPPIA_IS_DOCKERIZED', False)

    def tearDown(self) -> None:
        super().tearDown()
        os.remove('dummy-lighthouse-pages.json')

    def test_inject_entities_into_url_with_valid_entity(self) -> None:
        entities = {'topic_id': '4'}
        url = 'http://localhost:8181/topic_editor/{{topic_id}}'
        expected_injected_url = 'http://localhost:8181/topic_editor/4'
        self.assertEqual(
            run_lighthouse_tests.inject_entities_into_url(url, entities),
            expected_injected_url)

    def test_inject_entities_into_url_with_invalid_entity(self) -> None:
        entities = {'topic_id': '4'}
        url = 'http://localhost:8181/topic_editor/{{skill_id}}'
        with self.assertRaisesRegex(
            ValueError, 'Entity skill_id not found in entities.'
        ):
            run_lighthouse_tests.inject_entities_into_url(url, entities)

    def test_get_lighthouse_pages_config(self) -> None:
        with self.lighthouse_pages_json_filepath_swap:
            pages_config = run_lighthouse_tests.get_lighthouse_pages_config()
            self.assertEqual(
                pages_config,
                {
                    'splash': 'http://localhost:8181/',
                    'about': 'http://localhost:8181/about',
                    'contact': 'http://localhost:8181/contact'
                }
            )

    def test_run_lighthouse_puppeteer_script_successfully(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'https://oppia.org/create/4\n' +
                    b'https://oppia.org/topic_editor/4\n' +
                    b'https://oppia.org/story_editor/4\n' +
                    b'https://oppia.org/skill_editor/4\n',
                    b'Task output.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.puppeteer_bash_command,),))

        with self.print_swap, swap_popen:
            run_lighthouse_tests.run_lighthouse_puppeteer_script()

        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)

    def test_run_lighthouse_puppeteer_script_failed(self) -> None:
        class MockTask:
            returncode = 1
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'https://oppia.org/create/4\n' +
                    b'https://oppia.org/topic_editor/4\n' +
                    b'https://oppia.org/story_editor/4\n' +
                    b'https://oppia.org/skill_editor/4\n',
                    b'ABC error.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.puppeteer_bash_command,),))

        with self.print_swap, self.swap_sys_exit, swap_popen:
            run_lighthouse_tests.run_lighthouse_puppeteer_script()

        self.assertIn('Return code: 1', self.print_arr)
        self.assertIn('ABC error.', self.print_arr)
        self.assertIn(
            'Puppeteer script failed. More details can be found above.',
            self.print_arr)

    def test_puppeteer_script_succeeds_when_recording_succeeds(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'https://oppia.org/create/4\n' +
                    b'https://oppia.org/topic_editor/4\n' +
                    b'https://oppia.org/story_editor/4\n' +
                    b'https://oppia.org/skill_editor/4\n',
                    b'Task output.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_isfile = self.swap(os.path, 'isfile', lambda _: True)
        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.puppeteer_bash_command + self.extra_args,),))

        with self.print_swap, swap_popen, swap_isfile:
            run_lighthouse_tests.run_lighthouse_puppeteer_script(record=True)

        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)
        self.assertIn(
            'Starting LHCI Puppeteer script with recording.', self.print_arr)
        self.assertIn(
            'Resulting puppeteer video saved at %s' % self.extra_args[1],
            self.print_arr)

    def test_puppeteer_script_fails_when_recording_succeeds(self) -> None:
        class MockTask:
            returncode = 1
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'https://oppia.org/create/4\n' +
                    b'https://oppia.org/topic_editor/4\n' +
                    b'https://oppia.org/story_editor/4\n' +
                    b'https://oppia.org/skill_editor/4\n',
                    b'ABC error.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_isfile = self.swap(os.path, 'isfile', lambda _: True)
        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.puppeteer_bash_command + self.extra_args,),))

        with self.print_swap, self.swap_sys_exit, swap_popen, swap_isfile:
            run_lighthouse_tests.run_lighthouse_puppeteer_script(record=True)

        self.assertIn('Return code: 1', self.print_arr)
        self.assertIn('ABC error.', self.print_arr)
        self.assertIn(
            'Puppeteer script failed. More details can be found above.',
            self.print_arr)
        self.assertIn(
            'Resulting puppeteer video saved at %s' % self.extra_args[1],
            self.print_arr)

    def test_run_webpack_compilation_successfully(self) -> None:
        swap_isdir = self.swap_with_checks(
            os.path, 'isdir', lambda _: True, expected_kwargs=[])

        with self.print_swap, self.swap_webpack_compiler, swap_isdir:
            run_lighthouse_tests.run_webpack_compilation()

        self.assertNotIn(
            'Failed to complete webpack compilation, exiting...',
            self.print_arr)

    def test_run_webpack_compilation_failed(self) -> None:
        swap_isdir = self.swap_with_checks(
            os.path, 'isdir', lambda _: False, expected_kwargs=[])

        with self.print_swap, self.swap_webpack_compiler, swap_isdir:
            with self.swap_sys_exit:
                run_lighthouse_tests.run_webpack_compilation()

        self.assertIn(
            'Failed to complete webpack compilation, exiting...',
            self.print_arr)

    def test_subprocess_error_results_in_failed_webpack_compilation(
        self
    ) -> None:
        class MockFailedCompiler:
            def wait(self) -> None: # pylint: disable=missing-docstring
                raise subprocess.CalledProcessError(
                    returncode=1, cmd='', output='Subprocess execution failed.')

        class MockFailedCompilerContextManager:
            def __init__(self) -> None:
                pass

            def __enter__(self) -> MockFailedCompiler:
                return MockFailedCompiler()

            def __exit__(self, *unused_args: str) -> None:
                pass

        def mock_failed_context_manager() -> MockFailedCompilerContextManager:
            return MockFailedCompilerContextManager()
        self.swap_webpack_compiler = self.swap_with_checks(
            servers, 'managed_webpack_compiler', mock_failed_context_manager,
            expected_args=(), expected_kwargs=[])
        swap_isdir = self.swap_with_checks(
            os.path, 'isdir', lambda _: False, expected_kwargs=[])

        with self.print_swap, self.swap_webpack_compiler, swap_isdir:
            with self.swap_sys_exit:
                run_lighthouse_tests.run_webpack_compilation()

        self.assertIn('Subprocess execution failed.', self.print_arr)

    def test_run_lighthouse_checks_succesfully(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.lighthouse_check_bash_command,),))

        os.environ['ALL_LIGHTHOUSE_URLS'] = (
            'http://localhost:8181/,'
            'http://localhost:8181/about,'
            'http://localhost:8181/contact'
        )
        os.environ['LIGHTHOUSE_URLS_TO_RUN'] = (
            'http://localhost:8181/,'
            'http://localhost:8181/about'
        )
        with self.print_swap, swap_popen:
            run_lighthouse_tests.run_lighthouse_checks(
                LIGHTHOUSE_MODE_PERFORMANCE)

        self.assertIn(
            '\033[1m2 out of 3 lighthouse checks run, see '
            'https://github.com/oppia/oppia/wiki/Partial-CI-Tests-Structure '
            'for more information.\033[0m',
            self.print_arr
        )
        self.assertIn(
            'Lighthouse checks completed successfully.', self.print_arr)

    def test_run_lighthouse_checks_failed(self) -> None:
        class MockTask:
            returncode = 1
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task failed.',
                    b'ABC error.')

        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.lighthouse_check_bash_command,),))

        with self.print_swap, self.swap_sys_exit, swap_popen:
            run_lighthouse_tests.run_lighthouse_checks(
                LIGHTHOUSE_MODE_PERFORMANCE)

        self.assertIn('Return code: 1', self.print_arr)
        self.assertIn('ABC error.', self.print_arr)
        self.assertIn(
            'Lighthouse checks failed. More details can be found above.',
            self.print_arr)

    def test_run_lighthouse_tests_in_accessibility_mode(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')
        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None, expected_args=[('accessibility',)])
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)
        swap_build = self.swap_with_checks(
            build, 'main', lambda args: None,
            expected_kwargs=[{'args': []}])
        swap_emulator_mode = self.swap(constants, 'EMULATOR_MODE', False)

        with swap_popen, self.swap_webpack_compiler, swap_isdir, swap_build:
            with self.swap_elasticsearch_dev_server, self.swap_dev_appserver:
                with self.swap_ng_build, swap_emulator_mode, self.print_swap:
                    with self.swap_redis_server, swap_run_lighthouse_tests:
                        with self.lighthouse_pages_json_filepath_swap:
                            with self.oppia_is_dockerized_swap:
                                run_lighthouse_tests.main(
                                    args=['--mode', 'accessibility'])
                                expected_all_lighthouse_urls = ','.join([
                                    'http://localhost:8181/',
                                    'http://localhost:8181/about',
                                    'http://localhost:8181/contact'
                                ])
                                self.assertEqual(
                                    os.environ['ALL_LIGHTHOUSE_URLS'],
                                    expected_all_lighthouse_urls)

        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)

    def test_run_lighthouse_tests_in_performance_mode(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')

        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None, expected_args=[('performance',)])
        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)
        swap_build = self.swap_with_checks(
            build, 'main', lambda args: None,
            expected_kwargs=[{'args': ['--prod_env']}])

        with self.print_swap, self.swap_webpack_compiler, swap_isdir:
            with self.swap_elasticsearch_dev_server, self.swap_dev_appserver:
                with self.swap_redis_server, self.swap_cloud_datastore_emulator:
                    with self.swap_firebase_auth_emulator, swap_build:
                        with swap_popen, swap_run_lighthouse_tests:
                            with self.lighthouse_pages_json_filepath_swap:
                                with self.oppia_is_dockerized_swap:
                                    run_lighthouse_tests.main(
                                        args=['--mode', 'performance'])
                                    expected_all_lighthouse_urls = ','.join([
                                        'http://localhost:8181/',
                                        'http://localhost:8181/about',
                                        'http://localhost:8181/contact'
                                    ])
                                    self.assertEqual(
                                        os.environ['ALL_LIGHTHOUSE_URLS'],
                                        expected_all_lighthouse_urls)

        self.assertIn('Building files in production mode.', self.print_arr)
        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)

    def test_run_lighthouse_tests_with_specific_pages(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')

        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None, expected_args=[('performance',)])
        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)
        swap_build = self.swap_with_checks(
            build, 'main', lambda args: None,
            expected_kwargs=[{'args': ['--prod_env']}])

        with self.print_swap, self.swap_webpack_compiler, swap_isdir:
            with self.swap_elasticsearch_dev_server, self.swap_dev_appserver:
                with self.swap_redis_server, self.swap_cloud_datastore_emulator:
                    with self.swap_firebase_auth_emulator, swap_build:
                        with swap_popen, swap_run_lighthouse_tests:
                            with self.lighthouse_pages_json_filepath_swap:
                                with self.oppia_is_dockerized_swap:
                                    run_lighthouse_tests.main(
                                        args=['--mode', 'performance',
                                            '--pages', 'splash, about'])
                                    expected_all_lighthouse_urls = ','.join([
                                        'http://localhost:8181/',
                                        'http://localhost:8181/about',
                                        'http://localhost:8181/contact'
                                    ])
                                    expected_lighthouse_urls_to_run = ','.join([
                                        'http://localhost:8181/',
                                        'http://localhost:8181/about'
                                    ])
                                    self.assertEqual(
                                        os.environ['ALL_LIGHTHOUSE_URLS'],
                                        expected_all_lighthouse_urls)
                                    self.assertEqual(
                                        os.environ['LIGHTHOUSE_URLS_TO_RUN'],
                                        expected_lighthouse_urls_to_run)

        self.assertIn('Building files in production mode.', self.print_arr)
        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)

    def test_run_lighthouse_tests_skipping_webpack_build_in_performance_mode(
        self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')
        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None,
            expected_args=[('performance',)])
        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)
        swap_build = self.swap_with_checks(
                    build, 'main', lambda args: None,
                    expected_kwargs=[{'args': []}])
        swap_emulator_mode = self.swap(constants, 'EMULATOR_MODE', False)
        with swap_popen, self.swap_webpack_compiler, swap_isdir, swap_build:
            with self.swap_elasticsearch_dev_server, self.swap_dev_appserver:
                with self.swap_ng_build, swap_emulator_mode, self.print_swap:
                    with self.swap_redis_server, swap_run_lighthouse_tests:
                        with self.oppia_is_dockerized_swap:
                            with self.lighthouse_pages_json_filepath_swap:
                                run_lighthouse_tests.main(
                                    args=['--mode', 'performance',
                                        '--skip_build',
                                        '--pages', 'splash'])

        self.assertIn(
            'Building files in production mode skipping webpack build.',
            self.print_arr)
        self.assertIn(
            'Puppeteer script completed successfully.', self.print_arr)

    def test_main_function_calls_puppeteer_record(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'Task output',
                    b'No error.')
        def mock_run_puppeteer_script(*unused_args: str) -> dict[str, str]:
            return {
                'exploration_id': '4',
            }
        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        # Set up pseudo-chrome path env variable.
        for path in common.CHROME_PATHS:
            if os.path.isfile(path):
                env['CHROME_BIN'] = path
                break
        swap_dev_appserver = self.swap_with_checks(
            servers, 'managed_dev_appserver',
            lambda *unused_args, **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[{
                'port': GOOGLE_APP_ENGINE_PORT,
                'log_level': 'critical',
                'skip_sdk_update_check': True,
                'env': env
            }])
        swap_run_puppeteer_script = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_puppeteer_script',
            mock_run_puppeteer_script,
            expected_args=((True,),))
        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None, expected_args=[('performance',)])
        def mock_popen(*unused_args: str, **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()
        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)
        swap_build = self.swap_with_checks(
            build, 'main', lambda args: None,
            expected_kwargs=[{'args': []}])
        swap_emulator_mode = self.swap(constants, 'EMULATOR_MODE', False)
        swap_popen = self.swap(
            subprocess, 'Popen', mock_popen)
        swap_isdir = self.swap(
            os.path, 'isdir', lambda _: True)

        with swap_popen, self.swap_webpack_compiler, swap_isdir, swap_build:
            with self.swap_elasticsearch_dev_server, swap_dev_appserver:
                with self.swap_ng_build, swap_emulator_mode, self.print_swap:
                    with self.swap_redis_server, swap_run_lighthouse_tests:
                        with swap_run_puppeteer_script:
                            with self.oppia_is_dockerized_swap:
                                with self.lighthouse_pages_json_filepath_swap:
                                    run_lighthouse_tests.main(
                                        args=[
                                            '--mode', 'performance',
                                            '--skip_build',
                                            '--record_screen'])

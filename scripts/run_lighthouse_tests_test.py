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
import os
import subprocess
import sys

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
    LIGHTHOUSE_MODE_PERFORMANCE: {
        '1': '.lighthouserc-1.js',
        '2': '.lighthouserc-2.js'
    },
    LIGHTHOUSE_MODE_ACCESSIBILITY: {
        '1': '.lighthouserc-accessibility-1.js',
        '2': '.lighthouserc-accessibility-2.js'
    }
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
                LIGHTHOUSE_CONFIG_FILENAMES[LIGHTHOUSE_MODE_PERFORMANCE]['1']),
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

        with self.print_swap, swap_popen:
            run_lighthouse_tests.run_lighthouse_checks(
                LIGHTHOUSE_MODE_PERFORMANCE, '1')

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
                LIGHTHOUSE_MODE_PERFORMANCE, '1')

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
            lambda *unused_args: None, expected_args=(('accessibility', '1'),))
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
                        run_lighthouse_tests.main(
                            args=['--mode', 'accessibility', '--shard', '1'])

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
            lambda *unused_args: None, expected_args=(('performance', '1'),))
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
                            run_lighthouse_tests.main(
                                args=['--mode', 'performance', '--shard', '1'])

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
            expected_args=(('performance', '1'),))
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
                        run_lighthouse_tests.main(
                            args=['--mode', 'performance',
                                '--shard', '1', '--skip_build'])

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
            lambda _: None,
            expected_args=((True,),))
        swap_run_lighthouse_tests = self.swap_with_checks(
            run_lighthouse_tests, 'run_lighthouse_checks',
            lambda *unused_args: None, expected_args=(('performance', '1'),))
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
                            run_lighthouse_tests.main(
                                args=[
                                    '--mode', 'performance', '--skip_build',
                                    '--shard', '1', '--record_screen'])

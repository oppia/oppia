# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/run_e2e_tests.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import atexit
import contextlib
import functools
import os
import re
import signal
import subprocess
import sys
import time

from core.tests import test_utils
import python_utils

from scripts import build
from scripts import common
from scripts import install_chrome_on_travis
from scripts import install_third_party_libs
from scripts import run_e2e_tests


CHROME_DRIVER_VERSION = '77.0.3865.40'


class MockProcessClass(python_utils.OBJECT):

    def __init__(self, clean_shutdown=True):
        """Create a mock process object.

        Attributes:
            poll_count: int. The number of times poll() has been called.
            signals_received: list(int). List of received signals (as
                ints) in order of receipt.
            kill_count: int. Number of times kill() has been called.
            poll_return: bool. The return value for poll().
            clean_shutdown: bool. Whether to shut down when signal.SIGINT
                signal is received.

        Args:
            clean_shutdown: bool. Whether to shut down when SIGINT received.
        """
        self.poll_count = 0
        self.signals_received = []
        self.kill_count = 0
        self.poll_return = True
        self.clean_shutdown = clean_shutdown

    def kill(self):
        """Increment kill_count.

        Mocks the process being killed.
        """
        self.kill_count += 1

    def poll(self):
        """Increment poll_count.

        Mocks checking whether the process is still alive.

        Returns:
            bool. The value of self.poll_return, which mocks whether the
            process is still alive.
        """
        self.poll_count += 1
        return self.poll_return

    def send_signal(self, signal_number):
        """Append signal to self.signals_received.

        Mocks receiving a process signal. If a SIGINT signal is received
        (e.g. from ctrl-C) and self.clean_shutdown is True, then we set
        self.poll_return to False to mimic the process shutting down.

        Args:
            signal_number: int. The number of the received signal.
        """
        self.signals_received.append(signal_number)
        if signal_number == signal.SIGINT and self.clean_shutdown:
            self.poll_return = False


class RunE2ETestsTests(test_utils.GenericTestBase):
    """Test the run_e2e_tests methods."""

    def setUp(self):
        super(RunE2ETestsTests, self).setUp()
        def mock_print(unused_msg):
            return

        def mock_run_cmd(unused_commands):
            pass

        def mock_check_call(unused_commands):
            pass

        # pylint: disable=unused-argument
        def mock_build_main(args):
            pass

        def mock_popen(args, env, shell):
            return
        # pylint: enable=unused-argument

        def mock_remove(unused_path):
            pass

        def mock_inplace_replace(
                unused_filename, unused_pattern, unused_replace):
            return

        self.popen_swap = functools.partial(
            self.swap_with_checks, subprocess, 'Popen', mock_popen)
        self.inplace_replace_swap = functools.partial(
            self.swap_with_checks, common, 'inplace_replace_file',
            mock_inplace_replace)
        self.mock_run_cmd = mock_run_cmd
        self.mock_check_call = mock_check_call
        self.mock_build_main = mock_build_main
        self.mock_remove = mock_remove
        self.print_swap = functools.partial(
            self.swap_with_checks, python_utils, 'PRINT', mock_print)

        self.mock_node_bin_path = 'node'
        self.node_bin_path_swap = self.swap(
            common, 'NODE_BIN_PATH', self.mock_node_bin_path)

        self.mock_webpack_bin_path = 'webpack'
        self.webpack_bin_path_swap = self.swap(
            run_e2e_tests, 'WEBPACK_BIN_PATH', self.mock_webpack_bin_path)

        self.mock_constant_file_path = 'constant.ts'
        self.constant_file_path_swap = self.swap(
            run_e2e_tests, 'CONSTANT_FILE_PATH', self.mock_constant_file_path)

    def test_check_screenhost_when_not_exist(self):
        def mock_isdir(unused_path):
            return False

        exist_swap = self.swap_with_checks(
            os.path, 'isdir', mock_isdir,
            expected_args=[(os.path.join(os.pardir, 'protractor-screenshots'),)]
        )
        print_swap = self.print_swap(called=False)
        with print_swap, exist_swap:
            run_e2e_tests.ensure_screenshots_dir_is_removed()

    def test_check_screenhost_when_exist(self):
        screenshot_dir = os.path.join(os.pardir, 'protractor-screenshots')
        def mock_isdir(unused_path):
            return True

        def mock_rmdir(unused_path):
            return True

        exist_swap = self.swap_with_checks(
            os.path, 'isdir', mock_isdir, expected_args=[(screenshot_dir,)])
        rmdir_swap = self.swap_with_checks(
            os, 'rmdir', mock_rmdir, expected_args=[(screenshot_dir,)])
        expected_output = (
            'Note: If ADD_SCREENSHOT_REPORTER is set to true in'
            'core/tests/protractor.conf.js, you can view screenshots'
            'of the failed tests in ../protractor-screenshots/')

        print_swap = self.print_swap(expected_args=[(expected_output,)])
        with print_swap, exist_swap, rmdir_swap:
            run_e2e_tests.ensure_screenshots_dir_is_removed()

    def test_cleanup_when_no_subprocess(self):

        def mock_kill_process_based_on_regex(unused_regex):
            return

        def mock_is_windows_os():
            return False

        def mock_set_constants_to_default():
            return

        subprocess_swap = self.swap(run_e2e_tests, 'SUBPROCESSES', [])

        google_app_engine_path = '%s/' % (
            common.GOOGLE_APP_ENGINE_HOME)
        webdriver_download_path = '%s/selenium' % (
            run_e2e_tests.WEBDRIVER_HOME_PATH)
        process_pattern = [
            ('.*%s.*' % re.escape(google_app_engine_path),),
            ('.*%s.*' % re.escape(webdriver_download_path),)
        ]

        swap_kill_process = self.swap_with_checks(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex,
            expected_args=process_pattern)
        swap_is_windows = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows_os)
        swap_set_constants_to_default = self.swap_with_checks(
            build, 'set_constants_to_default', mock_set_constants_to_default)
        with swap_kill_process, subprocess_swap, swap_is_windows:
            with swap_set_constants_to_default:
                run_e2e_tests.cleanup()

    def test_cleanup_when_subprocesses_exist(self):

        def mock_kill_process_based_on_regex(unused_regex):
            mock_kill_process_based_on_regex.called_times += 1
            return True
        mock_kill_process_based_on_regex.called_times = 0

        def mock_set_constants_to_default():
            return

        mock_processes = [MockProcessClass(), MockProcessClass()]
        subprocess_swap = self.swap(
            run_e2e_tests, 'SUBPROCESSES', mock_processes)
        swap_kill_process = self.swap_with_checks(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex)
        swap_set_constants_to_default = self.swap_with_checks(
            build, 'set_constants_to_default', mock_set_constants_to_default)
        with subprocess_swap, swap_kill_process, swap_set_constants_to_default:
            run_e2e_tests.cleanup()
        self.assertEqual(
            mock_kill_process_based_on_regex.called_times, len(mock_processes))

    def test_cleanup_on_windows(self):

        def mock_is_windows_os():
            return True

        def mock_set_constants_to_default():
            return

        subprocess_swap = self.swap(run_e2e_tests, 'SUBPROCESSES', [])

        google_app_engine_path = '%s/' % (
            common.GOOGLE_APP_ENGINE_HOME)
        webdriver_download_path = '%s/selenium' % (
            run_e2e_tests.WEBDRIVER_HOME_PATH)
        process_pattern = [
            ('.*%s.*' % re.escape(google_app_engine_path),),
            ('.*%s.*' % re.escape(webdriver_download_path),)
        ]
        expected_pattern = process_pattern[:]
        expected_pattern[1] = ('.*%s.*' % re.escape(
            os.path.abspath(webdriver_download_path)),)
        def mock_kill_process_based_on_regex(unused_regex):
            return

        swap_kill_process = self.swap_with_checks(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex,
            expected_args=expected_pattern)
        swap_is_windows = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows_os)
        swap_set_constants_to_default = self.swap_with_checks(
            build, 'set_constants_to_default', mock_set_constants_to_default)
        with swap_kill_process, subprocess_swap, swap_is_windows:
            with swap_set_constants_to_default:
                run_e2e_tests.cleanup()

    def test_is_oppia_server_already_running_when_ports_closed(self):
        def mock_is_port_open(unused_port):
            return False

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open)
        with is_port_open_swap:
            result = run_e2e_tests.is_oppia_server_already_running()
            self.assertFalse(result)

    def test_is_oppia_server_already_running_when_one_of_the_ports_is_open(
            self):
        running_port = run_e2e_tests.GOOGLE_APP_ENGINE_PORT
        def mock_is_port_open(port):
            if port == running_port:
                return True
            return False

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open)
        with is_port_open_swap:
            result = run_e2e_tests.is_oppia_server_already_running()
            self.assertTrue(result)

    def test_wait_for_port_to_be_open_when_port_successfully_opened(self):
        def mock_is_port_open(unused_port):
            mock_is_port_open.wait_time += 1
            if mock_is_port_open.wait_time > 10:
                return True
            return False
        mock_is_port_open.wait_time = 0

        def mock_sleep(unused_time):
            mock_sleep.called_times += 1
            return
        mock_sleep.called_times = 0

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open)
        sleep_swap = self.swap_with_checks(time, 'sleep', mock_sleep)

        with is_port_open_swap, sleep_swap:
            run_e2e_tests.wait_for_port_to_be_open(1)
        self.assertEqual(mock_is_port_open.wait_time, 11)
        self.assertEqual(mock_sleep.called_times, 10)

    def test_wait_for_port_to_be_open_when_port_failed_to_open(self):
        def mock_is_port_open(unused_port):
            return False

        def mock_sleep(unused_time):
            mock_sleep.sleep_time += 1

        def mock_exit(unused_exit_code):
            return

        mock_sleep.sleep_time = 0

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        sleep_swap = self.swap_with_checks(time, 'sleep', mock_sleep)
        exit_swap = self.swap_with_checks(sys, 'exit', mock_exit)
        with is_port_open_swap, sleep_swap, exit_swap:
            run_e2e_tests.wait_for_port_to_be_open(1)
        self.assertEqual(
            mock_sleep.sleep_time,
            run_e2e_tests.MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS)

    def test_run_webpack_compilation_success(self):
        def mock_isdir(unused_dirname):
            mock_isdir.run_times += 1
            if mock_isdir.run_times > 3:
                return True
            return False
        mock_isdir.run_times = 0

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']

        isdir_swap = self.swap_with_checks(os.path, 'isdir', mock_isdir)
        # The webpack compilation processes will be called 4 times as mock_isdir
        # will return true after 4 calls.
        check_call_swap = self.swap_with_checks(
            subprocess, 'check_call', self.mock_check_call,
            expected_args=[(expected_commands,)] * 4)
        with self.node_bin_path_swap, self.webpack_bin_path_swap, (
            check_call_swap):
            with isdir_swap:
                run_e2e_tests.run_webpack_compilation()

    def test_get_chrome_driver_version(self):
        def mock_popen(unused_arg):
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def read(self):
                    """Return required method."""
                    return '77.0.3865'
            return Ret()

        popen_swap = self.swap(os, 'popen', mock_popen)
        def mock_url_open(unused_arg):
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def read(self):
                    """Return required method."""
                    return CHROME_DRIVER_VERSION
            return Ret()

        url_open_swap = self.swap(python_utils, 'url_open', mock_url_open)
        with popen_swap, url_open_swap:
            version = run_e2e_tests.get_chrome_driver_version()
            self.assertEqual(version, CHROME_DRIVER_VERSION)

    def test_run_webpack_compilation_failed(self):
        def mock_isdir(unused_port):
            return False

        def mock_exit(unused_exit_code):
            return

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']
        # The webpack compilation processes will be called five times.
        check_call_swap = self.swap_with_checks(
            subprocess, 'check_call', self.mock_check_call,
            expected_args=[(expected_commands,)] * 5)

        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(1,)])
        with self.node_bin_path_swap, self.webpack_bin_path_swap:
            with check_call_swap, isdir_swap, exit_swap:
                run_e2e_tests.run_webpack_compilation()

    def test_run_webdriver_manager(self):
        expected_commands = [
            common.NODE_BIN_PATH, run_e2e_tests.WEBDRIVER_MANAGER_BIN_PATH,
            'start', '--detach']

        def mock_popen(unused_command):
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''
            return Ret()

        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[
                (expected_commands,)], expected_kwargs=[{}])
        with popen_swap:
            run_e2e_tests.run_webdriver_manager(['start', '--detach'])

    def test_setup_and_install_dependencies_without_skip(self):

        def mock_install_third_party_libs_main():
            return

        install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)

        with install_swap:
            run_e2e_tests.setup_and_install_dependencies(False)

    def test_setup_and_install_dependencies_on_travis(self):

        def mock_install_third_party_libs_main():
            return

        def mock_install_chrome_main(args):  # pylint: disable=unused-argument
            return

        def mock_getenv(unused_variable_name):
            return True

        install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)
        install_chrome_swap = self.swap_with_checks(
            install_chrome_on_travis, 'main', mock_install_chrome_main,
            expected_kwargs=[{'args': []}])
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('TRAVIS',)])

        with install_swap, install_chrome_swap:
            with getenv_swap:
                run_e2e_tests.setup_and_install_dependencies(False)

    def test_setup_and_install_dependencies_with_skip(self):

        def mock_install_third_party_libs_main(unused_args):
            return

        install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main, called=False)

        with install_swap:
            run_e2e_tests.setup_and_install_dependencies(True)

    def test_build_js_files_in_dev_mode_with_hash_file_exists(self):
        def mock_isdir(unused_path):
            return True

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']

        isdir_swap = self.swap_with_checks(os.path, 'isdir', mock_isdir)
        check_call_swap = self.swap_with_checks(
            subprocess, 'check_call', self.mock_check_call,
            expected_args=[(expected_commands,)])
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs=[{'args': []}])
        print_swap = self.print_swap(called=False)
        with print_swap, self.constant_file_path_swap, check_call_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with build_main_swap, isdir_swap:
                    run_e2e_tests.build_js_files(True)

    def test_build_js_files_in_dev_mode_with_exception_raised(self):

        def mock_check_call(commands):
            raise subprocess.CalledProcessError(
                returncode=2, cmd=commands, output='ERROR')

        def mock_exit(unused_code):
            pass

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']

        check_call_swap = self.swap_with_checks(
            subprocess, 'check_call', mock_check_call,
            expected_args=[(expected_commands,)])
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs=[{'args': []}])
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(2,)])
        print_swap = self.print_swap(expected_args=[('ERROR',)])
        with print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with check_call_swap, exit_swap, build_main_swap:
                    run_e2e_tests.build_js_files(True)

    def test_build_js_files_in_prod_mode(self):
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd, called=False)

        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main,
            expected_kwargs=[{'args': ['--prod_env']}])

        with self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with run_cmd_swap, build_main_swap:
                    run_e2e_tests.build_js_files(False)

    def test_build_js_files_in_prod_mode_with_deparallelize_terser(self):
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd, called=False)

        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main,
            expected_kwargs=[{'args': [
                '--prod_env', '--deparallelize_terser']}])

        with self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with build_main_swap, run_cmd_swap:
                    run_e2e_tests.build_js_files(
                        False, deparallelize_terser=True)

    def test_tweak_webdriver_manager_on_x64_machine(self):

        def mock_is_windows():
            return True
        def mock_inplace_replace(
                unused_filepath, unused_regex_pattern, unused_replace):
            return
        def mock_undo_tweak():
            return

        expected_replace = 'this.osArch = "x64";'
        inplace_replace_swap = self.swap_with_checks(
            common, 'inplace_replace_file', mock_inplace_replace,
            expected_args=[
                (
                    run_e2e_tests.CHROME_PROVIDER_FILE_PATH,
                    run_e2e_tests.PATTERN_FOR_REPLACE_WEBDRIVER_CODE,
                    expected_replace),
                (
                    run_e2e_tests.GECKO_PROVIDER_FILE_PATH,
                    run_e2e_tests.PATTERN_FOR_REPLACE_WEBDRIVER_CODE,
                    expected_replace)
            ])
        def mock_is_x64():
            return True

        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)
        is_windows_swap = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows)
        undo_swap = self.swap_with_checks(
            run_e2e_tests, 'undo_webdriver_tweak', mock_undo_tweak)

        with inplace_replace_swap, architecture_swap, is_windows_swap:
            with undo_swap:
                with run_e2e_tests.tweak_webdriver_manager():
                    pass

    def test_tweak_webdriver_manager_on_x86_windows(self):
        def mock_is_windows():
            return True
        def mock_inplace_replace(
                unused_filepath, unused_regex_pattern, unused_replace):
            return
        def mock_undo_tweak():
            return

        expected_replace = 'this.osArch = "x86";'
        inplace_replace_swap = self.swap_with_checks(
            common, 'inplace_replace_file', mock_inplace_replace,
            expected_args=[
                (
                    run_e2e_tests.CHROME_PROVIDER_FILE_PATH,
                    run_e2e_tests.PATTERN_FOR_REPLACE_WEBDRIVER_CODE,
                    expected_replace),
                (
                    run_e2e_tests.GECKO_PROVIDER_FILE_PATH,
                    run_e2e_tests.PATTERN_FOR_REPLACE_WEBDRIVER_CODE,
                    expected_replace)
            ])
        def mock_is_x64():
            return False

        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)
        is_windows_swap = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows)
        undo_swap = self.swap_with_checks(
            run_e2e_tests, 'undo_webdriver_tweak', mock_undo_tweak)

        with inplace_replace_swap, architecture_swap, is_windows_swap:
            with undo_swap:
                with run_e2e_tests.tweak_webdriver_manager():
                    pass

    def test_undo_webdriver_tweak(self):
        files_to_check = [
            run_e2e_tests.CHROME_PROVIDER_BAK_FILE_PATH,
            run_e2e_tests.GECKO_PROVIDER_BAK_FILE_PATH]

        files_to_remove = [
            run_e2e_tests.CHROME_PROVIDER_FILE_PATH,
            run_e2e_tests.GECKO_PROVIDER_FILE_PATH
        ]
        files_to_rename = files_to_check[:]

        def mock_isfile(unused_path):
            return True

        def mock_rename(unused_origin, unused_new):
            return

        def mock_remove(unused_path):
            return

        isfile_swap = self.swap_with_checks(
            os.path, 'isfile', mock_isfile, expected_args=[
                (filepath,) for filepath in files_to_check
            ])
        rename_swap = self.swap_with_checks(
            os, 'rename', mock_rename, expected_args=[
                (filepath, filepath.replace('.bak', '')) for
                filepath in files_to_rename
            ])
        remove_swap = self.swap_with_checks(
            os, 'remove', mock_remove, expected_args=[
                (filepath,) for filepath in files_to_remove
            ])
        with isfile_swap, rename_swap, remove_swap:
            run_e2e_tests.undo_webdriver_tweak()

    def test_start_webdriver_manager(self):
        @contextlib.contextmanager
        def mock_tweak_webdriver():
            yield

        def mock_run_webdriver_manager(unused_commands):
            return

        tweak_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_webdriver_manager', mock_tweak_webdriver)

        expected_commands = [
            (['update', '--versions.chrome',
              CHROME_DRIVER_VERSION],),
            (['start', '--versions.chrome',
              CHROME_DRIVER_VERSION, '--detach', '--quiet'],)
        ]

        run_swap = self.swap_with_checks(
            run_e2e_tests, 'run_webdriver_manager', mock_run_webdriver_manager,
            expected_args=expected_commands)
        with tweak_swap, run_swap:
            run_e2e_tests.start_webdriver_manager(
                CHROME_DRIVER_VERSION)

    def test_get_parameter_for_one_sharding_instance(self):
        result = run_e2e_tests.get_parameter_for_sharding(1)
        self.assertEqual([], result)

    def test_get_parameter_for_three_sharding_instances(self):
        result = run_e2e_tests.get_parameter_for_sharding(3)
        self.assertEqual(
            ['--capabilities.shardTestFiles=True',
             '--capabilities.maxInstances=3'], result)

    def test_get_parameter_for_negative_sharding_instances(self):
        with self.assertRaises(ValueError):
            run_e2e_tests.get_parameter_for_sharding(-3)

    def test_get_parameter_for_dev_mode(self):
        result = run_e2e_tests.get_parameter_for_dev_mode(True)
        self.assertEqual(result, '--params.devMode=True')

    def test_get_parameter_for_prod_mode(self):
        result = run_e2e_tests.get_parameter_for_dev_mode(False)
        self.assertEqual(result, '--params.devMode=False')

    def test_get_parameter_for_suite(self):
        result = run_e2e_tests.get_parameter_for_suite('Full')
        self.assertEqual(result, ['--suite', 'Full'])

    def test_get_e2e_test_parameters(self):
        result = run_e2e_tests.get_e2e_test_parameters(3, 'Full', False)
        self.assertEqual(
            result, [
                run_e2e_tests.PROTRACTOR_CONFIG_FILE_PATH,
                '--capabilities.shardTestFiles=True',
                '--capabilities.maxInstances=3',
                '--suite', 'Full', '--params.devMode=False'
            ]
        )

    def test_start_google_app_engine_server_in_dev_mode(self):

        expected_command = (
            '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
            '--clear_datastore=yes --dev_appserver_log_level=critical '
            '--log_level=critical --skip_sdk_update_check=true %s' % (
                common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
                run_e2e_tests.GOOGLE_APP_ENGINE_PORT,
                'app_dev.yaml'))
        popen_swap = self.popen_swap(
            expected_args=[(expected_command,)],
            expected_kwargs=[{
                'env': {
                    'PORTSERVER_ADDRESS':
                        run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                },
                'shell': True,
            }])
        with popen_swap:
            run_e2e_tests.start_google_app_engine_server(True, 'critical')

    def test_start_google_app_engine_server_in_prod_mode(self):

        expected_command = (
            '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
            '--clear_datastore=yes --dev_appserver_log_level=critical '
            '--log_level=critical --skip_sdk_update_check=true %s' % (
                common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
                run_e2e_tests.GOOGLE_APP_ENGINE_PORT,
                'app.yaml'))
        popen_swap = self.popen_swap(
            expected_args=[(expected_command,)],
            expected_kwargs=[{
                'env': {
                    'PORTSERVER_ADDRESS':
                        run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                },
                'shell': True,
            }])
        with popen_swap:
            run_e2e_tests.start_google_app_engine_server(False, 'critical')

    def test_start_tests_when_other_instances_not_stopped(self):
        def mock_exit(unused_exit_code):
            raise Exception('sys.exit(1)')
        def mock_is_oppia_server_already_running(*unused_args):
            return True

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'is_oppia_server_already_running',
            mock_is_oppia_server_already_running)
        exit_swap = self.swap(sys, 'exit', mock_exit)
        with check_swap, exit_swap:
            with self.assertRaisesRegexp(Exception, r'sys\.exit\(1\)'):
                run_e2e_tests.main(args=[])

    def test_start_tests_when_no_other_instance_running(self):

        mock_process = MockProcessClass()

        def mock_is_oppia_server_already_running(*unused_args):
            return False

        def mock_setup_and_install_dependencies(unused_arg):
            return

        def mock_register(unused_func, unused_arg=None):
            return

        def mock_cleanup():
            return

        def mock_build_js_files(unused_arg, deparallelize_terser=False): # pylint: disable=unused-argument
            return

        def mock_start_webdriver_manager(unused_arg):
            return

        def mock_start_google_app_engine_server(unused_arg, unused_log_level):
            return

        def mock_wait_for_port_to_be_open(unused_port):
            return

        def mock_ensure_screenshots_dir_is_removed():
            return

        def mock_get_e2e_test_parameters(
                unused_sharding_instances, unused_suite, unused_dev_mode):
            return ['commands']

        def mock_popen(unused_commands):
            def mock_communicate():
                return
            result = mock_process
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result

        def mock_exit(unused_code):
            return

        def mock_get_chrome_driver_version():
            return CHROME_DRIVER_VERSION

        get_chrome_driver_version_swap = self.swap(
            run_e2e_tests, 'get_chrome_driver_version',
            mock_get_chrome_driver_version)

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'is_oppia_server_already_running',
            mock_is_oppia_server_already_running)

        setup_and_install_swap = self.swap_with_checks(
            run_e2e_tests, 'setup_and_install_dependencies',
            mock_setup_and_install_dependencies, expected_args=[(False,)])

        register_swap = self.swap_with_checks(
            atexit, 'register', mock_register, expected_args=[
                (mock_cleanup,),
                (run_e2e_tests.cleanup_portserver, mock_process),
            ])

        cleanup_swap = self.swap(run_e2e_tests, 'cleanup', mock_cleanup)
        build_swap = self.swap_with_checks(
            run_e2e_tests, 'build_js_files', mock_build_js_files,
            expected_args=[(True,)])
        start_webdriver_swap = self.swap_with_checks(
            run_e2e_tests, 'start_webdriver_manager',
            mock_start_webdriver_manager,
            expected_args=[(CHROME_DRIVER_VERSION,)])
        start_google_app_engine_server_swap = self.swap_with_checks(
            run_e2e_tests, 'start_google_app_engine_server',
            mock_start_google_app_engine_server,
            expected_args=[(True, 'critical')])
        wait_swap = self.swap_with_checks(
            run_e2e_tests, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open,
            expected_args=[
                (run_e2e_tests.WEB_DRIVER_PORT,),
                (run_e2e_tests.GOOGLE_APP_ENGINE_PORT,)])
        ensure_screenshots_dir_is_removed_swap = self.swap_with_checks(
            run_e2e_tests, 'ensure_screenshots_dir_is_removed',
            mock_ensure_screenshots_dir_is_removed)
        get_parameters_swap = self.swap_with_checks(
            run_e2e_tests, 'get_e2e_test_parameters',
            mock_get_e2e_test_parameters, expected_args=[(3, 'full', True)])
        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[
                ([
                    'python', '-m',
                    'scripts.run_portserver',
                    '--portserver_unix_socket_address',
                    run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                ],),
                ([
                    common.NODE_BIN_PATH,
                    '--unhandled-rejections=strict',
                    run_e2e_tests.PROTRACTOR_BIN_PATH,
                    'commands',
                ],),
            ],
        )
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(0,)])
        with check_swap, setup_and_install_swap, register_swap, cleanup_swap:
            with build_swap, start_webdriver_swap:
                with start_google_app_engine_server_swap:
                    with wait_swap, ensure_screenshots_dir_is_removed_swap:
                        with get_parameters_swap, popen_swap, exit_swap:
                            with get_chrome_driver_version_swap:
                                run_e2e_tests.main(args=[])

    def test_start_tests_skip_build(self):

        mock_process = MockProcessClass()

        def mock_is_oppia_server_already_running(*unused_args):
            return False

        def mock_setup_and_install_dependencies(unused_arg):
            return

        def mock_register(unused_func, unused_arg=None):
            return

        def mock_cleanup():
            return

        def mock_modify_constants(prod_env, maintenance_mode=False):  # pylint: disable=unused-argument
            return

        def mock_start_webdriver_manager(unused_arg):
            return

        def mock_start_google_app_engine_server(unused_arg, unused_log_level):
            return

        def mock_wait_for_port_to_be_open(unused_port):
            return

        def mock_ensure_screenshots_dir_is_removed():
            return

        def mock_get_e2e_test_parameters(
                unused_sharding_instances, unused_suite, unused_dev_mode):
            return ['commands']

        def mock_popen(unused_commands):
            def mock_communicate():
                return
            result = mock_process
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result

        def mock_exit(unused_code):
            return

        def mock_get_chrome_driver_version():
            return CHROME_DRIVER_VERSION

        get_chrome_driver_version_swap = self.swap(
            run_e2e_tests, 'get_chrome_driver_version',
            mock_get_chrome_driver_version)

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'is_oppia_server_already_running',
            mock_is_oppia_server_already_running)
        setup_and_install_swap = self.swap_with_checks(
            run_e2e_tests, 'setup_and_install_dependencies',
            mock_setup_and_install_dependencies, expected_args=[(True,)])
        register_swap = self.swap_with_checks(
            atexit, 'register', mock_register, expected_args=[
                (mock_cleanup,),
                (run_e2e_tests.cleanup_portserver, mock_process),
            ])
        cleanup_swap = self.swap(run_e2e_tests, 'cleanup', mock_cleanup)
        modify_constants_swap = self.swap_with_checks(
            build, 'modify_constants', mock_modify_constants,
            expected_kwargs=[{'prod_env': False}])
        start_webdriver_swap = self.swap_with_checks(
            run_e2e_tests, 'start_webdriver_manager',
            mock_start_webdriver_manager,
            expected_args=[(CHROME_DRIVER_VERSION,)])
        start_google_app_engine_server_swap = self.swap_with_checks(
            run_e2e_tests, 'start_google_app_engine_server',
            mock_start_google_app_engine_server,
            expected_args=[(True, 'critical')])
        wait_swap = self.swap_with_checks(
            run_e2e_tests, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open,
            expected_args=[
                (run_e2e_tests.WEB_DRIVER_PORT,),
                (run_e2e_tests.GOOGLE_APP_ENGINE_PORT,)])
        ensure_screenshots_dir_is_removed_swap = self.swap_with_checks(
            run_e2e_tests, 'ensure_screenshots_dir_is_removed',
            mock_ensure_screenshots_dir_is_removed)
        get_parameters_swap = self.swap_with_checks(
            run_e2e_tests, 'get_e2e_test_parameters',
            mock_get_e2e_test_parameters, expected_args=[(3, 'full', True)])
        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[
                ([
                    'python', '-m',
                    'scripts.run_portserver',
                    '--portserver_unix_socket_address',
                    run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                ],),
                ([
                    common.NODE_BIN_PATH,
                    '--unhandled-rejections=strict',
                    run_e2e_tests.PROTRACTOR_BIN_PATH,
                    'commands'
                ],),
            ],
        )
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(0,)])
        with check_swap, setup_and_install_swap, register_swap, cleanup_swap:
            with modify_constants_swap, start_webdriver_swap:
                with start_google_app_engine_server_swap:
                    with wait_swap, ensure_screenshots_dir_is_removed_swap:
                        with get_parameters_swap, popen_swap, exit_swap:
                            with get_chrome_driver_version_swap:
                                run_e2e_tests.main(
                                    args=['--skip-install', '--skip-build'])

    def test_chrome_not_found_failure(self):

        def mock_popen(unused_commands, stdout):
            self.assertEqual(stdout, -1)
            raise OSError('google-chrome not found')

        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[([
                'google-chrome', '--version'],)])
        expected_message = (
            'Failed to execute "google-chrome --version" command. This is '
            'used to determine the chromedriver version to use. Please set '
            'the chromedriver version manually using --chrome_driver_version '
            'flag. To determine the chromedriver version to be used, please '
            'follow the instructions mentioned in the following URL:\n'
            'https://chromedriver.chromium.org/downloads/version-selection')

        with popen_swap, self.assertRaisesRegexp(Exception, expected_message):
            run_e2e_tests.get_chrome_driver_version()

    def test_start_tests_in_debug_mode(self):

        mock_process = MockProcessClass()

        def mock_is_oppia_server_already_running(*unused_args):
            return False

        def mock_setup_and_install_dependencies(unused_arg):
            return

        def mock_register(unused_func, unused_arg=None):
            return

        def mock_cleanup():
            return

        def mock_build_js_files(unused_arg, deparallelize_terser=False): # pylint: disable=unused-argument
            return

        def mock_start_webdriver_manager(unused_arg):
            return

        def mock_start_google_app_engine_server(unused_arg, unused_log_level):
            return

        def mock_wait_for_port_to_be_open(unused_port):
            return

        def mock_ensure_screenshots_dir_is_removed():
            return

        def mock_get_e2e_test_parameters(
                unused_sharding_instances, unused_suite, unused_dev_mode):
            return ['commands']

        def mock_popen(unused_commands):
            def mock_communicate():
                return
            result = mock_process
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result

        def mock_exit(unused_code):
            return

        def mock_get_chrome_driver_version():
            return CHROME_DRIVER_VERSION

        get_chrome_driver_version_swap = self.swap(
            run_e2e_tests, 'get_chrome_driver_version',
            mock_get_chrome_driver_version)

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'is_oppia_server_already_running',
            mock_is_oppia_server_already_running)

        setup_and_install_swap = self.swap_with_checks(
            run_e2e_tests, 'setup_and_install_dependencies',
            mock_setup_and_install_dependencies, expected_args=[(False,)])

        register_swap = self.swap_with_checks(
            atexit, 'register', mock_register, expected_args=[
                (mock_cleanup,),
                (run_e2e_tests.cleanup_portserver, mock_process),
            ])

        cleanup_swap = self.swap(run_e2e_tests, 'cleanup', mock_cleanup)
        build_swap = self.swap_with_checks(
            run_e2e_tests, 'build_js_files', mock_build_js_files,
            expected_args=[(True,)])
        start_webdriver_swap = self.swap_with_checks(
            run_e2e_tests, 'start_webdriver_manager',
            mock_start_webdriver_manager,
            expected_args=[(CHROME_DRIVER_VERSION,)])
        start_google_app_engine_server_swap = self.swap_with_checks(
            run_e2e_tests, 'start_google_app_engine_server',
            mock_start_google_app_engine_server,
            expected_args=[(True, 'critical')])
        wait_swap = self.swap_with_checks(
            run_e2e_tests, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open,
            expected_args=[
                (run_e2e_tests.WEB_DRIVER_PORT,),
                (run_e2e_tests.GOOGLE_APP_ENGINE_PORT,)])
        ensure_screenshots_dir_is_removed_swap = self.swap_with_checks(
            run_e2e_tests, 'ensure_screenshots_dir_is_removed',
            mock_ensure_screenshots_dir_is_removed)
        get_parameters_swap = self.swap_with_checks(
            run_e2e_tests, 'get_e2e_test_parameters',
            mock_get_e2e_test_parameters, expected_args=[(3, 'full', True)])
        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[
                ([
                    'python', '-m',
                    'scripts.run_portserver',
                    '--portserver_unix_socket_address',
                    run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                ],),
                ([
                    common.NODE_BIN_PATH,
                    '--inspect-brk',
                    '--unhandled-rejections=strict',
                    run_e2e_tests.PROTRACTOR_BIN_PATH,
                    'commands',
                ],),
            ],
        )
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(0,)])
        with check_swap, setup_and_install_swap, register_swap, cleanup_swap:
            with build_swap, start_webdriver_swap:
                with start_google_app_engine_server_swap:
                    with wait_swap, ensure_screenshots_dir_is_removed_swap:
                        with get_parameters_swap, popen_swap, exit_swap:
                            with get_chrome_driver_version_swap:
                                run_e2e_tests.main(args=['--debug_mode'])

    def test_start_tests_in_with_chromedriver_flag(self):

        mock_process = MockProcessClass()

        def mock_is_oppia_server_already_running(*unused_args):
            return False

        def mock_setup_and_install_dependencies(unused_arg):
            return

        def mock_register(unused_func, unused_arg=None):
            return

        def mock_cleanup():
            return

        def mock_build_js_files(unused_arg, deparallelize_terser=False): # pylint: disable=unused-argument
            return

        def mock_start_webdriver_manager(unused_arg):
            return

        def mock_start_google_app_engine_server(unused_arg, unused_log_level):
            return

        def mock_wait_for_port_to_be_open(unused_port):
            return

        def mock_ensure_screenshots_dir_is_removed():
            return

        def mock_get_e2e_test_parameters(
                unused_sharding_instances, unused_suite, unused_dev_mode):
            return ['commands']

        def mock_popen(unused_commands):
            def mock_communicate():
                return
            result = mock_process
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result

        def mock_exit(unused_code):
            return

        def mock_get_chrome_driver_version():
            return CHROME_DRIVER_VERSION

        get_chrome_driver_version_swap = self.swap(
            run_e2e_tests, 'get_chrome_driver_version',
            mock_get_chrome_driver_version)

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'is_oppia_server_already_running',
            mock_is_oppia_server_already_running)

        setup_and_install_swap = self.swap_with_checks(
            run_e2e_tests, 'setup_and_install_dependencies',
            mock_setup_and_install_dependencies, expected_args=[(False,)])

        register_swap = self.swap_with_checks(
            atexit, 'register', mock_register, expected_args=[
                (mock_cleanup,),
                (run_e2e_tests.cleanup_portserver, mock_process),
            ])

        cleanup_swap = self.swap(run_e2e_tests, 'cleanup', mock_cleanup)
        build_swap = self.swap_with_checks(
            run_e2e_tests, 'build_js_files', mock_build_js_files,
            expected_args=[(True,)])
        start_webdriver_swap = self.swap_with_checks(
            run_e2e_tests, 'start_webdriver_manager',
            mock_start_webdriver_manager,
            expected_args=[(CHROME_DRIVER_VERSION,)])
        start_google_app_engine_server_swap = self.swap_with_checks(
            run_e2e_tests, 'start_google_app_engine_server',
            mock_start_google_app_engine_server,
            expected_args=[(True, 'critical')])
        wait_swap = self.swap_with_checks(
            run_e2e_tests, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open,
            expected_args=[
                (run_e2e_tests.WEB_DRIVER_PORT,),
                (run_e2e_tests.GOOGLE_APP_ENGINE_PORT,)])
        ensure_screenshots_dir_is_removed_swap = self.swap_with_checks(
            run_e2e_tests, 'ensure_screenshots_dir_is_removed',
            mock_ensure_screenshots_dir_is_removed)
        get_parameters_swap = self.swap_with_checks(
            run_e2e_tests, 'get_e2e_test_parameters',
            mock_get_e2e_test_parameters, expected_args=[(3, 'full', True)])
        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=[
                ([
                    'python', '-m',
                    'scripts.run_portserver',
                    '--portserver_unix_socket_address',
                    run_e2e_tests.PORTSERVER_SOCKET_FILEPATH,
                ],),
                ([
                    common.NODE_BIN_PATH,
                    '--unhandled-rejections=strict',
                    run_e2e_tests.PROTRACTOR_BIN_PATH,
                    'commands',
                ],),
            ],
        )
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(0,)])
        with check_swap, setup_and_install_swap, register_swap, cleanup_swap:
            with build_swap, start_webdriver_swap:
                with start_google_app_engine_server_swap:
                    with wait_swap, ensure_screenshots_dir_is_removed_swap:
                        with get_parameters_swap, popen_swap, exit_swap:
                            with get_chrome_driver_version_swap:
                                run_e2e_tests.main(
                                    args=[
                                        '--chrome_driver_version',
                                        CHROME_DRIVER_VERSION])

    def test_update_community_dashboard_status_with_dashboard_enabled(self):
        swap_inplace_replace = self.inplace_replace_swap(expected_args=[(
            run_e2e_tests.FECONF_FILE_PATH,
            'COMMUNITY_DASHBOARD_ENABLED = .*',
            'COMMUNITY_DASHBOARD_ENABLED = True'
        )])

        with swap_inplace_replace:
            run_e2e_tests.update_community_dashboard_status_in_feconf_file(
                run_e2e_tests.FECONF_FILE_PATH, True)

    def test_update_community_dashboard_status_with_dashboard_disabled(self):
        swap_inplace_replace = self.inplace_replace_swap(expected_args=[(
            run_e2e_tests.FECONF_FILE_PATH,
            'COMMUNITY_DASHBOARD_ENABLED = .*',
            'COMMUNITY_DASHBOARD_ENABLED = False'
        )])
        with swap_inplace_replace:
            run_e2e_tests.update_community_dashboard_status_in_feconf_file(
                run_e2e_tests.FECONF_FILE_PATH, False)

    def test_cleanup_portserver_when_server_shuts_down_cleanly(self):
        process = MockProcessClass(clean_shutdown=True)
        run_e2e_tests.cleanup_portserver(process)
        self.assertEqual(process.kill_count, 0)
        # Server gets polled twice. Once to break out of wait loop and
        # again to check that the process shut down and does not need to
        # be killed.
        self.assertEqual(process.poll_count, 2)
        self.assertEqual(process.signals_received, [signal.SIGINT])

    def test_cleanup_portserver_when_server_shutdown_fails(self):
        process = MockProcessClass(clean_shutdown=False)
        run_e2e_tests.cleanup_portserver(process)
        self.assertEqual(process.kill_count, 1)
        # Server gets polled 11 times. 1 for each second of the wait
        # loop and again to see that the process did not shut down and
        # therefore needs to be killed.
        self.assertEqual(
            process.poll_count,
            run_e2e_tests.KILL_PORTSERVER_TIMEOUT_SECS + 1
        )
        self.assertEqual(process.signals_received, [signal.SIGINT])

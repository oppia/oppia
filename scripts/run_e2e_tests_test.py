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
import functools
import os
import re
import subprocess
import sys
import time

from core.tests import test_utils
import python_utils

from scripts import build
from scripts import common
from scripts import install_third_party_libs
from scripts import run_e2e_tests
from scripts import setup
from scripts import setup_gae


class MockProcessClass(python_utils.OBJECT):
    def __init__(self):
        pass

    kill_count = 0

    # pylint: disable=missing-docstring
    def kill(self):
        MockProcessClass.kill_count += 1
    # pylint: enable=missing-docstring


class RunE2ETestsTests(test_utils.GenericTestBase):
    """Test the run_e2e_tests methods."""

    def setUp(self):
        super(RunE2ETestsTests, self).setUp()
        def mock_print(unused_msg):
            return

        def mock_run_cmd(unused_commands):
            pass
        # pylint: disable=unused-argument
        def mock_build_main(args):
            pass

        def mock_popen(args, shell):
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
            expected_args=(os.path.join(os.pardir, 'protractor-screenshots'),))
        print_swap = self.print_swap(called=False)
        with print_swap, exist_swap:
            run_e2e_tests.check_screenshot()

    def test_check_screenhost_when_exist(self):
        screenshot_dir = os.path.join(os.pardir, 'protractor-screenshots')
        def mock_isdir(unused_path):
            return True

        def mock_rmdir(unused_path):
            return True

        exist_swap = self.swap_with_checks(
            os.path, 'isdir', mock_isdir, expected_args=(screenshot_dir,))
        rmdir_swap = self.swap_with_checks(
            os, 'rmdir', mock_rmdir, expected_args=(screenshot_dir,))
        expected_output = """
Note: If ADD_SCREENSHOT_REPORTER is set to true in
core/tests/protractor.conf.js, you can view screenshots
of the failed tests in ../protractor-screenshots/
"""
        print_swap = self.print_swap(expected_args=(expected_output,))
        with print_swap, exist_swap, rmdir_swap:
            run_e2e_tests.check_screenshot()

    def test_cleanup_when_no_subprocess(self):
        def mock_is_windows_os():
            return False

        subprocess_swap = self.swap(run_e2e_tests, 'SUBPROCESSES', [])


        dev_appserver_path = '%s/dev_appserver.py' % (
            common.GOOGLE_APP_ENGINE_HOME)
        webdriver_download_path = '%s/downloads' % (
            run_e2e_tests.WEBDRIVER_HOME_PATH)
        process_pattern = [
            ('.*%s.*' % re.escape(dev_appserver_path),),
            ('.*%s.*' % re.escape(webdriver_download_path),)
        ]
        def mock_kill_process_based_on_regex(unused_regex):
            return

        swap_kill_process = self.swap_with_checks(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex,
            expected_args=process_pattern)
        swap_is_windows = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows_os)
        with swap_kill_process, subprocess_swap, swap_is_windows:
            run_e2e_tests.cleanup()

    def test_cleanup_when_subprocesses_exist(self):

        def mock_kill_process_based_on_regex(unused_regex):
            return True

        mock_processes = [MockProcessClass(), MockProcessClass()]
        subprocess_swap = self.swap(
            run_e2e_tests, 'SUBPROCESSES', mock_processes)
        swap_kill_process = self.swap_with_checks(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex, called_times=len(mock_processes))
        with subprocess_swap, swap_kill_process:
            run_e2e_tests.cleanup()

    def test_cleanup_on_windows(self):
        def mock_is_windows_os():
            return True

        subprocess_swap = self.swap(run_e2e_tests, 'SUBPROCESSES', [])

        dev_appserver_path = '%s/dev_appserver.py' % (
            common.GOOGLE_APP_ENGINE_HOME)
        webdriver_download_path = '%s/downloads' % (
            run_e2e_tests.WEBDRIVER_HOME_PATH)
        process_pattern = [
            ('.*%s.*' % re.escape(dev_appserver_path),),
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
        with swap_kill_process, subprocess_swap, swap_is_windows:
            run_e2e_tests.cleanup()

    def test_check_running_instances_when_ports_closed(self):
        expected_ports = [1, 2, 3]
        def mock_is_port_open(unused_port):
            return False

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open,
            expected_args=[(port,) for port in expected_ports],
            called_times=3)
        with is_port_open_swap:
            result = run_e2e_tests.check_running_instance(*expected_ports)
            self.assertFalse(result)

    def test_check_running_instances_when_one_of_the_ports_is_open(self):
        running_port = 2
        expected_ports = [1, running_port, 3]
        def mock_is_port_open(port):
            if port == running_port:
                return True
            return False

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open,
            expected_args=[(1,), (2,)],
            called_times=2)
        with is_port_open_swap:
            result = run_e2e_tests.check_running_instance(*expected_ports)
            self.assertTrue(result)

    def test_wait_for_port_when_port_successfully_opened(self):
        def mock_is_port_open(unused_port):
            mock_is_port_open.wait_time += 1
            if mock_is_port_open.wait_time > 10:
                return True
            return False
        mock_is_port_open.wait_time = 0

        def mock_sleep(unused_time):
            return

        is_port_open_swap = self.swap_with_checks(
            common, 'is_port_open', mock_is_port_open, called_times=11)
        sleep_swap = self.swap_with_checks(
            time, 'sleep', mock_sleep, called_times=10)

        with is_port_open_swap, sleep_swap:
            run_e2e_tests.wait_for_port(1)

    def test_wait_for_port_when_port_failed_to_open(self):
        def mock_is_port_open(unused_port):
            return False

        def mock_sleep(unused_time):
            mock_sleep.sleep_time += 1

        def mock_exit(unused_exit_code):
            return

        mock_sleep.sleep_time = 0

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        sleep_swap = self.swap_with_checks(
            time, 'sleep', mock_sleep,
            called_times=run_e2e_tests.WAIT_PORT_TIMEOUT)
        exit_swap = self.swap_with_checks(sys, 'exit', mock_exit)
        with is_port_open_swap, sleep_swap, exit_swap:
            run_e2e_tests.wait_for_port(1)

    def test_tweak_constant_file_in_dev_mode_without_change_file(self):
        constant_file = 'constant.js'
        inplace_replace_swap = self.inplace_replace_swap(expected_args=(
            constant_file, '"DEV_MODE": .*', '"DEV_MODE": true'
        ))
        with inplace_replace_swap:
            run_e2e_tests.tweak_constant_file(constant_file, True)

    def test_tweak_constant_file_in_prod_mode(self):
        constant_file = 'constant.js'
        inplace_replace_swap = self.inplace_replace_swap(expected_args=(
            constant_file, '"DEV_MODE": .*', '"DEV_MODE": false'
        ))
        with inplace_replace_swap:
            run_e2e_tests.tweak_constant_file(constant_file, False)

    def test_run_webdriver_manager(self):
        expected_commands = [
            common.NODE_BIN_PATH, run_e2e_tests.WEBDRIVER_MANAGER_BIN_PATH,
            'start', '--detach']

        stdout = 'stdout'
        def mock_run_cmd(unused_commands):
            return stdout

        mock_run_cmd.called = False
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd, expected_args=(expected_commands,))
        print_swap = self.print_swap(expected_args=(stdout,))
        with print_swap, run_cmd_swap:
            run_e2e_tests.run_webdriver_manager(['start', '--detach'])

    def test_setup_and_install_dependencies_without_skip(self):
        # pylint: disable=unused-argument
        def mock_setup_main(args):
            return

        def mock_install_third_party_libs_main(args):
            return

        def mock_setup_gae_main(args):
            return
        # pylint: enable=unused-argument

        setup_swap = self.swap_with_checks(
            setup, 'main', mock_setup_main, expected_kwargs={'args': []})
        setup_gae_swap = self.swap_with_checks(
            setup_gae, 'main', mock_setup_gae_main, expected_kwargs={'args': []}
            )
        install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main, expected_kwargs={'args': []})

        with setup_swap, setup_gae_swap, install_swap:
            run_e2e_tests.setup_and_install_dependencies(False)

    def test_setup_and_install_dependencies_with_skip(self):
        # pylint: disable=unused-argument
        def mock_setup_main(args):
            return

        def mock_install_third_party_libs_main(args):
            return

        def mock_setup_gae_main(args):
            return
        # pylint: enable=unused-argument

        setup_swap = self.swap_with_checks(
            setup, 'main', mock_setup_main, expected_kwargs={'args': []})
        setup_gae_swap = self.swap_with_checks(
            setup_gae, 'main', mock_setup_gae_main, expected_kwargs={'args': []}
            )
        install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main, called=False)

        with setup_swap, setup_gae_swap, install_swap:
            run_e2e_tests.setup_and_install_dependencies(True)

    def test_tweak_feconf_file_with_dashboard_enabled(self):
        swap_inplace_replace = self.inplace_replace_swap(expected_args=(
            run_e2e_tests.FECONF_FILE_PATH,
            'COMMUNITY_DASHBOARD_ENABLED = .*',
            'COMMUNITY_DASHBOARD_ENABLED = True'
        ))

        with swap_inplace_replace:
            run_e2e_tests.tweak_feconf_file(
                run_e2e_tests.FECONF_FILE_PATH, True)

    def test_tweak_feconf_file_with_dashboard_disabled(self):
        swap_inplace_replace = self.inplace_replace_swap(expected_args=(
            run_e2e_tests.FECONF_FILE_PATH,
            'COMMUNITY_DASHBOARD_ENABLED = .*',
            'COMMUNITY_DASHBOARD_ENABLED = False'
        ))
        with swap_inplace_replace:
            run_e2e_tests.tweak_feconf_file(
                run_e2e_tests.FECONF_FILE_PATH, False)

    def test_build_js_files_in_dev_mode_with_hash_file_exists(self):

        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            pass

        def mock_is_file(unused_path):
            return True

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']

        is_file_swap = self.swap_with_checks(
            os.path, 'isfile', mock_is_file,
            expected_args=(run_e2e_tests.HASHES_FILE_PATH,))

        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=(self.mock_constant_file_path, True))
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd,
            expected_args=(expected_commands,))
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs={'args': []})
        print_swap = self.print_swap(called=False)
        with print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap, build_main_swap:
                    with is_file_swap:
                        run_e2e_tests.build_js_files(True)

    def test_build_js_files_in_dev_mode_with_hash_file_not_exist(self):
        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            pass

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']
        mock_hash_file_path = 'NOT_A_FILE.json'

        hash_file_path_swap = self.swap(
            run_e2e_tests, 'HASHES_FILE_PATH', mock_hash_file_path)
        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=(self.mock_constant_file_path, True))
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd,
            expected_args=(expected_commands,))
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs={'args': []})
        print_swap = self.print_swap(called=False)
        with print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap, build_main_swap:
                    with hash_file_path_swap:
                        run_e2e_tests.build_js_files(True)
        with open(mock_hash_file_path) as f:
            content = f.readlines()
        os.remove(mock_hash_file_path)
        self.assertEqual(content, ['{}'])

    def test_build_js_files_in_dev_mode_with_exception_raised(self):

        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            pass

        def mock_is_file(unused_path):
            return True

        def mock_run_cmd(commands):
            raise subprocess.CalledProcessError(
                returncode=2, cmd=commands, output='ERROR')

        def mock_exit(unused_code):
            pass

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']

        is_file_swap = self.swap_with_checks(
            os.path, 'isfile', mock_is_file,
            expected_args=(run_e2e_tests.HASHES_FILE_PATH,))

        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=(self.mock_constant_file_path, True))
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd, expected_args=(expected_commands,),
            expected_exception=subprocess.CalledProcessError)
        # The mock exit will not actually exit the program, so the
        # build_js_files function will continue and build.main will still be
        # executed. But in actual case, this function will not be executed.
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs={'args': []})
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=(2,))
        print_swap = self.print_swap(expected_args=('ERROR',))
        with print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap:
                    with is_file_swap, exit_swap, build_main_swap:
                        run_e2e_tests.build_js_files(True)

    def test_build_js_files_in_prod_mode(self):

        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            pass

        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=(self.mock_constant_file_path, False))

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd, called=False)

        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main,
            expected_kwargs={'args': ['--prod_env']})

        with self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap, build_main_swap:
                    run_e2e_tests.build_js_files(False)

    def test_tweak_webdriver_manager_on_x64_machine(self):
        expected_replace = 'this.osArch = "x64";'
        def mock_inplace_replace(
                unused_filepath, unused_regex_pattern, unused_replace):
            return

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
            ], called_times=2)
        def mock_is_x64():
            return True

        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)

        with inplace_replace_swap, architecture_swap:
            run_e2e_tests.tweak_webdriver_manager()

    def test_tweak_webdriver_manager_on_x86_machine(self):
        def mock_inplace_replace(
                unused_filepath, unused_regex_pattern, unused_replace):
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
            ], called_times=2)
        def mock_is_x64():
            return False

        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)

        with inplace_replace_swap, architecture_swap:
            run_e2e_tests.tweak_webdriver_manager()

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
            ], called_times=2)
        rename_swap = self.swap_with_checks(
            os, 'rename', mock_rename, expected_args=[
                (filepath, filepath.replace('.bak', '')) for
                filepath in files_to_rename
            ], called_times=2)
        remove_swap = self.swap_with_checks(
            os, 'remove', mock_remove, expected_args=[
                (filepath,) for filepath in files_to_remove
            ], called_times=2)
        with isfile_swap, rename_swap, remove_swap:
            run_e2e_tests.undo_webdriver_tweak()

    def test_start_webdriver_manager_on_windows(self):
        def mock_tweak_webdriver():
            return

        def mock_undo_tweak():
            return

        def mock_run_webdriver_manager(unused_commands):
            return

        def mock_is_windows():
            return True
        tweak_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_webdriver_manager', mock_tweak_webdriver)
        undo_swap = self.swap_with_checks(
            run_e2e_tests, 'undo_webdriver_tweak', mock_undo_tweak)

        expected_commands = [
            (['update', '--versions.chrome',
              run_e2e_tests.CHROME_DRIVER_VERSION],),
            (['start', '--versions.chrome',
              run_e2e_tests.CHROME_DRIVER_VERSION, '--detach', '--quiet'],)
        ]

        run_swap = self.swap_with_checks(
            run_e2e_tests, 'run_webdriver_manager', mock_run_webdriver_manager,
            expected_args=expected_commands, called_times=2)

        is_windows_swap = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows)
        with tweak_swap, undo_swap, run_swap, is_windows_swap:
            run_e2e_tests.start_webdriver_manager()

    def test_start_webdriver_manager_on_machine_other_than_windows(self):
        def mock_tweak_webdriver():
            return

        def mock_undo_tweak():
            return

        def mock_run_webdriver_manager(unused_commands):
            return

        def mock_is_windows():
            return False
        tweak_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_webdriver_manager', mock_tweak_webdriver,
            called=False)
        undo_swap = self.swap_with_checks(
            run_e2e_tests, 'undo_webdriver_tweak', mock_undo_tweak,
            called=False)

        expected_commands = [
            (['update', '--versions.chrome',
              run_e2e_tests.CHROME_DRIVER_VERSION],),
            (['start', '--versions.chrome',
              run_e2e_tests.CHROME_DRIVER_VERSION, '--detach', '--quiet'],)
        ]

        run_swap = self.swap_with_checks(
            run_e2e_tests, 'run_webdriver_manager', mock_run_webdriver_manager,
            expected_args=expected_commands, called_times=2)

        is_windows_swap = self.swap_with_checks(
            common, 'is_windows_os', mock_is_windows)
        with tweak_swap, undo_swap, run_swap, is_windows_swap:
            run_e2e_tests.start_webdriver_manager()

    def test_get_parameter_for_config_file_with_browserstack(self):
        result = run_e2e_tests.get_parameter_for_config_file(True)
        self.assertEqual(run_e2e_tests.BROWSER_STACK_CONFIG_FILE_PATH, result)

    def test_get_parameter_for_config_file_without_browserstack(self):
        result = run_e2e_tests.get_parameter_for_config_file(False)
        self.assertEqual(run_e2e_tests.PROTRACTOR_CONFIG_FILE_PATH, result)

    def test_get_parameter_for_one_sharding_instance(self):
        result = run_e2e_tests.get_parameter_for_sharding(True, 1)
        self.assertEqual([], result)

    def test_get_parameter_for_three_sharding_instances(self):
        result = run_e2e_tests.get_parameter_for_sharding(True, '3')
        self.assertEqual(
            ['--capabilities.shardTestFiles=True',
             '--capabilities.maxInstances=3'], result)

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
        result = run_e2e_tests.get_e2e_test_parameters(
            True, True, 3, 'Full', False)
        self.assertEqual(
            result, [
                run_e2e_tests.BROWSER_STACK_CONFIG_FILE_PATH,
                '--capabilities.shardTestFiles=True',
                '--capabilities.maxInstances=3',
                '--suite', 'Full', '--params.devMode=False'
            ]
        )

    def test_start_google_engine_in_dev_mode(self):

        expected_command = (
            '%s %s/dev_appserver.py  --host 0.0.0.0 --port %s '
            '--clear_datastore=yes --dev_appserver_log_level=critical '
            '--log_level=critical --skip_sdk_update_check=true %s' % (
                common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
                run_e2e_tests.GOOGLE_APP_ENGINE_PORT,
                'app_dev.yaml'))
        popen_swap = self.popen_swap(
            expected_args=(expected_command,),
            expected_kwargs={'shell': True})
        with popen_swap:
            run_e2e_tests.start_google_engine(True)

    def test_start_google_engine_in_prod_mode(self):

        expected_command = (
            '%s %s/dev_appserver.py  --host 0.0.0.0 --port %s '
            '--clear_datastore=yes --dev_appserver_log_level=critical '
            '--log_level=critical --skip_sdk_update_check=true %s' % (
                common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
                run_e2e_tests.GOOGLE_APP_ENGINE_PORT,
                'app.yaml'))
        popen_swap = self.popen_swap(
            expected_args=(expected_command,),
            expected_kwargs={'shell': True})
        with popen_swap:
            run_e2e_tests.start_google_engine(False)

    def test_start_tests_when_other_instances_not_stopped(self):
        def mock_exit(unused_exit_code):
            raise Exception('sys.exit(1)')
        def mock_check_running_instance(*unused_args):
            return True

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'check_running_instance',
            mock_check_running_instance,
            expected_args=(8181, 9001))
        exit_swap = self.swap(sys, 'exit', mock_exit)
        with check_swap, exit_swap:
            with self.assertRaisesRegexp(Exception, r'sys\.exit\(1\)'):
                run_e2e_tests.main(args=[])

    def test_start_tests_when_no_other_instance_running(self):

        def mock_check_running_instance(*unused_args):
            return False

        def mock_setup_and_install_dependencies(unused_arg):
            return

        def mock_register(unused_func):
            return

        def mock_cleanup():
            return

        def mock_build_js_files(unused_arg):
            return

        def mock_start_webdriver_manager():
            return

        def mock_start_google_engine(unused_arg):
            return

        def mock_wait_for_port(unused_port):
            return

        def mock_check_screenshot():
            return

        def mock_get_e2e_test_parameters(
                unused_browser_stack, unused_sharding,
                unused_sharding_instances, unused_suite, unused_dev_mode):
            return ['commands']

        def mock_popen(unused_commands):
            def mock_communicate():
                return
            result = MockProcessClass()
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result

        def mock_exit(unused_code):
            return

        check_swap = self.swap_with_checks(
            run_e2e_tests, 'check_running_instance',
            mock_check_running_instance,
            expected_args=(8181, 9001))

        setup_and_install_swap = self.swap_with_checks(
            run_e2e_tests, 'setup_and_install_dependencies',
            mock_setup_and_install_dependencies, expected_args=(False,))

        register_swap = self.swap_with_checks(
            atexit, 'register', mock_register, expected_args=(mock_cleanup,))

        cleanup_swap = self.swap(run_e2e_tests, 'cleanup', mock_cleanup)
        build_swap = self.swap_with_checks(
            run_e2e_tests, 'build_js_files', mock_build_js_files,
            expected_args=(True,))
        start_webdriver_swap = self.swap_with_checks(
            run_e2e_tests, 'start_webdriver_manager',
            mock_start_webdriver_manager)
        start_google_engine_swap = self.swap_with_checks(
            run_e2e_tests, 'start_google_engine', mock_start_google_engine,
            expected_args=(True,))
        wait_swap = self.swap_with_checks(
            run_e2e_tests, 'wait_for_port', mock_wait_for_port,
            expected_args=[
                (run_e2e_tests.WEB_DRIVER_PORT,),
                (run_e2e_tests.GOOGLE_APP_ENGINE_PORT,)], called_times=2)
        check_screenshot_swap = self.swap_with_checks(
            run_e2e_tests, 'check_screenshot', mock_check_screenshot)
        get_parameters_swap = self.swap_with_checks(
            run_e2e_tests, 'get_e2e_test_parameters',
            mock_get_e2e_test_parameters, expected_args=(
                False, True, 3, 'full', True))
        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen, expected_args=([
                common.NODE_BIN_PATH, run_e2e_tests.PROTRACTOR_BIN_PATH,
                'commands'],))
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=(0,))
        with check_swap, setup_and_install_swap, register_swap, cleanup_swap:
            with build_swap, start_webdriver_swap, start_google_engine_swap:
                with wait_swap, check_screenshot_swap, get_parameters_swap:
                    with popen_swap, exit_swap:
                        run_e2e_tests.main(args=[])


from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import fileinput
import os
import sys
import subprocess
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

class RunE2ETestsTests(test_utils.TestBase):
    def setUp(self):
        def mock_print(msg):
            self.print_arr.append(msg)

        def mock_run_cmd(unused_commands):
            mock_run_cmd.called = True

        def mock_build_main(args):
            mock_build_main.called = True

        def mock_remove(unused_path):
            mock_remove.called = True


        self.mock_run_cmd = mock_run_cmd
        self.mock_build_main = mock_build_main
        self.mock_remove = mock_remove
        self.print_arr = []
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

        self.mock_node_bin_path = 'node'
        self.node_bin_path_swap = self.swap(common, 'NODE_BIN_PATH', self.mock_node_bin_path)

        self.mock_webpack_bin_path = 'webpack'
        self.webpack_bin_path_swap = self.swap(run_e2e_tests, 'WEBPACK_BIN_PATH', self.mock_webpack_bin_path)

        self.mock_constant_file_path = 'constant.ts'
        self.constant_file_path_swap = self.swap(run_e2e_tests, 'CONSTANT_FILE_PATH', self.mock_constant_file_path)

    def test_check_screenhost_when_not_exist(self):
        def mock_isdir(path):
            self.assertEqual(
                path, os.path.join(os.pardir, 'protractor-screenshots'))
            return False
        exist_swap = self.swap(os.path, 'isdir', mock_isdir)
        with self.print_swap, exist_swap:
            run_e2e_tests.check_screenshot()
        self.assertEqual(self.print_arr, [])

    def test_check_screenhost_when_exist(self):
        screenshot_dir = os.path.join(os.pardir, 'protractor-screenshots')
        def mock_isdir(path):
            self.assertEqual(path, screenshot_dir)
            return True

        def mock_rmdir(path):
            self.assertEqual(path, path)
            mock_rmdir.called = True
            return True
        mock_rmdir.called = False

        exist_swap = self.swap(os.path, 'isdir', mock_isdir)
        rmdir_swap = self.swap(os, 'rmdir', mock_rmdir)
        with self.print_swap, exist_swap, rmdir_swap:
            run_e2e_tests.check_screenshot()

        self.assertTrue(mock_rmdir.called)
        expected = ["""
Note: If ADD_SCREENSHOT_REPORTER is set to true in
core/tests/protractor.conf.js, you can view screenshots
of the failed tests in ../protractor-screenshots/
"""]
        self.assertEqual(self.print_arr, expected)

    def test_cleanup_when_no_subprocess(self):
        subprocess_swap = self.swap(run_e2e_tests, 'SUBPROCESSES', [])

        process_pattern = [
            r'.*[Dd]ev_appserver\.py --host 0\.0\.0\.0 --port 9001.*',
            '.*chromedriver_%s.*' % run_e2e_tests.CHROME_DRIVER_VERSION
        ]

        def mock_kill_process_based_on_regex(regex):
            self.assertIn(regex.pattern, process_pattern)
            process_pattern.remove(regex.pattern)

        swap_kill_process = self.swap(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex)
        with swap_kill_process, subprocess_swap:
            run_e2e_tests.cleanup()
        self.assertEqual(process_pattern, [])

    def test_cleanup_when_subprocesses_exist(self):

        def mock_kill_process_based_on_regex(unused_regex):
            return True

        mock_processes = [MockProcessClass(), MockProcessClass()]
        subprocess_swap = self.swap(
            run_e2e_tests, 'SUBPROCESSES', mock_processes)
        swap_kill_process = self.swap(
            common, 'kill_processes_based_on_regex',
            mock_kill_process_based_on_regex)
        with subprocess_swap, swap_kill_process:
            run_e2e_tests.cleanup()

        self.assertEqual(MockProcessClass.kill_count, len(mock_processes))

    def test_check_running_instances_when_ports_closed(self):
        expected_ports = [1, 2, 3]
        def mock_is_port_open(port):
            self.assertIn(port, expected_ports)
            expected_ports.remove(port)
            return False

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        with is_port_open_swap:
            result = run_e2e_tests.check_running_instance(*expected_ports)
            self.assertFalse(result)
        self.assertEqual(expected_ports, [])

    def test_check_running_instances_when_one_of_the_ports_is_open(self):
        running_port = 2
        expected_ports = [1, running_port, 3]
        def mock_is_port_open(port):
            self.assertIn(port, expected_ports)
            expected_ports.remove(port)
            if port == running_port:
                return True
            return False

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        with is_port_open_swap:
            result = run_e2e_tests.check_running_instance(*expected_ports)
            self.assertTrue(result)
        self.assertEqual(expected_ports, [3])

    def test_wait_for_port_when_port_successfully_opened(self):
        def mock_is_port_open(unused_port):
            mock_is_port_open.wait_time += 1
            if mock_is_port_open.wait_time > 10:
                return True
            return False
        mock_is_port_open.wait_time = 0

        def mock_sleep(unused_time):
            mock_sleep.sleep_time += 1
        mock_sleep.sleep_time = 0

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        sleep_swap = self.swap(time, 'sleep', mock_sleep)

        with is_port_open_swap, sleep_swap:
            run_e2e_tests.wait_for_port(1)
        self.assertEqual(mock_sleep.sleep_time, 10)
        self.assertEqual(mock_is_port_open.wait_time, 11)

    def test_wait_for_port_when_port_failed_to_open(self):
        def mock_is_port_open(unused_port):
            return False

        def mock_sleep(unused_time):
            mock_sleep.sleep_time += 1

        def mock_exit(unused_exit_code):
            mock_exit.called = True

        mock_exit.called = False
        mock_sleep.sleep_time = 0

        is_port_open_swap = self.swap(common, 'is_port_open', mock_is_port_open)
        sleep_swap = self.swap(time, 'sleep', mock_sleep)
        exit_swap = self.swap(sys, 'exit', mock_exit)
        with is_port_open_swap, sleep_swap, exit_swap:
            run_e2e_tests.wait_for_port(1)
        self.assertEqual(mock_sleep.sleep_time, run_e2e_tests.WAIT_PORT_TIMEOUT)
        self.assertTrue(mock_exit.called)

    def test_tweak_constant_file_in_dev_mode_without_change_file(self):
        constant_file = 'constant.js'
        origin_lines = [
            '"RANDMON1" : "randomValue1"',
            '"312RANDOM" : "ValueRanDom2"',
            '"DEV_MODE": true',
            '"RAN213DOM" : "raNdoVaLue3"'
        ]
        expected_lines = origin_lines[:]
        # pylint: disable=unused-argument
        def mock_input(files, inplace, backup):
            self.assertEqual(len(files), 1)
            self.assertEqual(constant_file, files[0])
            return origin_lines
        # pylint: enable=unused-argument
        input_swap = self.swap(fileinput, 'input', mock_input)
        with self.print_swap, input_swap:
            run_e2e_tests.tweak_constant_file(constant_file, True)
        self.assertEqual(self.print_arr, expected_lines)

    def test_tweak_constant_file_in_dev_mode_with_file_changed(self):
        constant_file = 'constant.js'
        origin_lines = [
            '"RANDMON1" : "randomValue1"',
            '"312RANDOM" : "ValueRanDom2"',
            '"DEV_MODE": false',
            '"RAN213DOM" : "raNdoVaLue3"'
        ]
        expected_lines = origin_lines[:]
        expected_lines[2] = '"DEV_MODE": true'
        # pylint: disable=unused-argument
        def mock_input(files, inplace, backup):
            self.assertEqual(len(files), 1)
            self.assertEqual(constant_file, files[0])
            return origin_lines
        # pylint: enable=unused-argument
        input_swap = self.swap(fileinput, 'input', mock_input)
        with self.print_swap, input_swap:
            run_e2e_tests.tweak_constant_file(constant_file, True)
        self.assertEqual(self.print_arr, expected_lines)

    def test_tweak_constant_file_not_in_dev_mode_without_change_file(self):
        constant_file = 'constant.js'
        origin_lines = [
            '"RANDMON1" : "randomValue1"',
            '"312RANDOM" : "ValueRanDom2"',
            '"DEV_MODE": false',
            '"RAN213DOM" : "raNdoVaLue3"'
        ]
        expected_lines = origin_lines[:]
        # pylint: disable=unused-argument
        def mock_input(files, inplace, backup):
            self.assertEqual(len(files), 1)
            self.assertEqual(constant_file, files[0])
            return origin_lines
        # pylint: enable=unused-argument
        input_swap = self.swap(fileinput, 'input', mock_input)
        with self.print_swap, input_swap:
            run_e2e_tests.tweak_constant_file(constant_file, False)
        self.assertEqual(self.print_arr, expected_lines)

    def test_tweak_constant_file_not_in_dev_mode_with_file_changed(self):
        constant_file = 'constant.js'
        origin_lines = [
            '"RANDMON1" : "randomValue1"',
            '"312RANDOM" : "ValueRanDom2"',
            '"DEV_MODE": true',
            '"RAN213DOM" : "raNdoVaLue3"'
        ]
        expected_lines = origin_lines[:]
        expected_lines[2] = '"DEV_MODE": false'
        # pylint: disable=unused-argument
        def mock_input(files, inplace, backup):
            self.assertEqual(len(files), 1)
            self.assertEqual(constant_file, files[0])
            return origin_lines
        # pylint: enable=unused-argument
        input_swap = self.swap(fileinput, 'input', mock_input)
        with self.print_swap, input_swap:
            run_e2e_tests.tweak_constant_file(constant_file, False)
        self.assertEqual(self.print_arr, expected_lines)

    def test_run_webdriver_manager(self):
        mock_webdriver_path = 'webdriver-manager'
        expected_commands = [
            self.mock_node_bin_path, mock_webdriver_path, 'start', '--detach']

        stdout = 'stdout'
        def mock_run_cmd(commands):
            self.assertEqual(commands, expected_commands)
            mock_run_cmd.called = True
            return stdout

        mock_run_cmd.called = False
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        webdriver_path_swap = self.swap(
            run_e2e_tests, 'WEBDRIVER_MANAGER_BIN_PATH', mock_webdriver_path)
        with self.print_swap, run_cmd_swap, self.node_bin_path_swap, webdriver_path_swap:
            run_e2e_tests.run_webdriver_manager(['start', '--detach'])

        self.assertTrue(mock_run_cmd.called)
        self.assertEqual(self.print_arr, [stdout])

    def test_setup_and_install_dependencies(self):
        def mock_setup_main(args):
            self.assertEqual(args, [])
            mock_setup_main.called = True

        def mock_install_third_party_libs_main(args):
            self.assertEqual(args, [])
            mock_install_third_party_libs_main.called = True

        def mock_setup_gae_main(args):
            self.assertEqual(args, [])
            mock_setup_gae_main.called = True

        mock_setup_gae_main.called = False
        mock_setup_main.called = False
        mock_install_third_party_libs_main.called = False

        setup_swap = self.swap(setup, 'main', mock_setup_main)
        setup_gae_swap = self.swap(setup_gae, 'main', mock_setup_gae_main)
        install_swap = self.swap(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)

        with setup_swap, setup_gae_swap, install_swap:
            run_e2e_tests.setup_and_install_dependencies()

        self.assertTrue(all(
            [mock_install_third_party_libs_main.called,
             mock_setup_gae_main.called,
             mock_setup_main.called]))

    def test_build_js_files_in_dev_mode(self):

        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            mock_tweak_constant_file.called = True

        expected_commands = [
            self.mock_node_bin_path, self.mock_webpack_bin_path, '--config',
            'webpack.dev.config.ts']


        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=[self.mock_constant_file_path, True])
        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd,
            expected_args=[expected_commands])
        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main, expected_kwargs={'args': []})
        remove_swap = self.swap_with_checks(
            os, 'remove', self.mock_remove,
            expected_args=['%s.bak' % self.mock_constant_file_path])
        with self.print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap, build_main_swap:
                    with remove_swap:
                        run_e2e_tests.build_js_files(True)

    def test_build_js_files_in_prod_mode(self):

        def mock_tweak_constant_file(unused_filename, unused_dev_mode):
            mock_tweak_constant_file.called = True

        tweak_constant_file_swap = self.swap_with_checks(
            run_e2e_tests, 'tweak_constant_file', mock_tweak_constant_file,
            expected_args=[self.mock_constant_file_path, False])

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', self.mock_run_cmd, called=False)

        build_main_swap = self.swap_with_checks(
            build, 'main', self.mock_build_main,
            expected_kwargs={'args': ['--prod_env']})

        remove_swap = self.swap_with_checks(
            os, 'remove', self.mock_remove,
            expected_args=['%s.bak' % self.mock_constant_file_path])

        with self.print_swap, self.constant_file_path_swap:
            with self.node_bin_path_swap, self.webpack_bin_path_swap:
                with tweak_constant_file_swap, run_cmd_swap, build_main_swap:
                    with remove_swap:
                        run_e2e_tests.build_js_files(False)

    def test_tweak_webdriver_manager_on_x64_machine(self):
        replace_args = []
        def mock_inplace_replace(file, regex_pattern, replace):
            replace_args.append([file, regex_pattern, replace])
            mock_inplace_replace.called += 1
        mock_inplace_replace.called = 0
        inplace_replace_swap = self.swap(
            common, 'inplace_replace_file', mock_inplace_replace)
        def mock_is_x64():
            mock_is_x64.called = True
            return True
        mock_regex = 'regex_pattern'
        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)
        regex_pattern_swap = self.swap(
            run_e2e_tests, 'PATTERN_FOR_REPLACE_WEBDRIVER_CODE', mock_regex)
        expected_replace = 'this.osArch = "x64";'
        with inplace_replace_swap, architecture_swap, regex_pattern_swap:
            run_e2e_tests.tweak_webdriver_manager()
        self.assertEqual([
            [run_e2e_tests.CHROME_PROVIDER_FILE_PATH, mock_regex,
            expected_replace],
            [run_e2e_tests.GECKO_PROVIDER_FILE_PATH, mock_regex,
            expected_replace]], replace_args)
        self.assertEqual(mock_inplace_replace.called, 2)

    def test_tweak_webdriver_manager_on_x86_machine(self):
        replace_args = []
        def mock_inplace_replace(file, regex_pattern, replace):
            replace_args.append([file, regex_pattern, replace])
            mock_inplace_replace.called += 1
        mock_inplace_replace.called = 0
        inplace_replace_swap = self.swap(
            common, 'inplace_replace_file', mock_inplace_replace)
        def mock_is_x64():
            mock_is_x64.called = True
            return False
        mock_regex = 'regex_pattern'
        architecture_swap = self.swap_with_checks(
            common, 'is_x64_architecture', mock_is_x64)
        regex_pattern_swap = self.swap(
            run_e2e_tests, 'PATTERN_FOR_REPLACE_WEBDRIVER_CODE', mock_regex)
        expected_replace = 'this.osArch = "x86";'
        with inplace_replace_swap, architecture_swap, regex_pattern_swap:
            run_e2e_tests.tweak_webdriver_manager()
        self.assertEqual([
            [run_e2e_tests.CHROME_PROVIDER_FILE_PATH, mock_regex,
             expected_replace],
            [run_e2e_tests.GECKO_PROVIDER_FILE_PATH, mock_regex,
             expected_replace]], replace_args)
        self.assertEqual(mock_inplace_replace.called, 2)

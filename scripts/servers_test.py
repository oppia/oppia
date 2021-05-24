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

"""Unit tests for scripts/servers.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import contextlib
import logging
import os
import re
import shutil
import signal
import subprocess
import sys
import threading
import time

from core.tests import test_utils
import python_utils
from scripts import common
from scripts import scripts_test_utils
from scripts import servers

import mock
import psutil


class ManagedProcessTests(test_utils.TestBase):

    # Helper class for improving the readability of tests.
    POPEN_CALL = (
        collections.namedtuple('POPEN_CALL', ['program_args', 'kwargs']))

    def setUp(self):
        super(ManagedProcessTests, self).setUp()
        self.exit_stack = python_utils.ExitStack()

    def tearDown(self):
        try:
            self.exit_stack.close()
        finally:
            super(ManagedProcessTests, self).tearDown()

    @contextlib.contextmanager
    def swap_popen(self, unresponsive=False, num_children=0, outputs=()):
        """Returns values for inspecting and mocking calls to psutil.Popen.

        Args:
            unresponsive: bool. Whether the processes created by the mock will
                stall when asked to terminate.
            num_children: int. The number of child processes the process created
                by the mock should create. Children inherit the same termination
                behavior.
            outputs: list(str). The outputs of the mock process.

        Returns:
            Context manager. A context manager in which calls to psutil.Popen()
            create a simple program that waits and then exits.

        Yields:
            list(POPEN_CALL). A list with the most up-to-date arguments passed
            to psutil.Popen from within the context manager returned.
        """
        popen_calls = []

        def mock_popen(program_args, **kwargs):
            """Mock of psutil.Popen that creates processes using os.fork().

            The processes created will always terminate within ~1 minute.

            Args:
                program_args: list(*). Unused program arguments that would
                    otherwise be passed to Popen.
                **kwargs: dict(str: *). Keyword arguments passed to Popen.

            Returns:
                PopenStub. The return value of psutil.Popen.
            """
            popen_calls.append(self.POPEN_CALL(program_args, kwargs))

            pid = 1
            stdout = ''.join('%s\n' % o for o in outputs)
            child_procs = [
                scripts_test_utils.PopenStub(pid=i, unresponsive=unresponsive)
                for i in python_utils.RANGE(pid + 1, pid + 1 + num_children)
            ]
            return scripts_test_utils.PopenStub(
                pid=pid, stdout=stdout, unresponsive=unresponsive,
                child_procs=child_procs)

        with self.swap(psutil, 'Popen', mock_popen):
            yield popen_calls

    @contextlib.contextmanager
    def swap_managed_cloud_datastore_emulator_io_operations(
            self, data_dir_exists):
        """Safely swaps IO operations used by managed_cloud_datastore_emulator.

        Args:
            data_dir_exists: bool. Return value of os.path.exists(DATA_DIR).

        Yields:
            tuple(CallCounter, CallCounter). CallCounter instances for rmtree
            and makedirs.
        """
        old_exists = os.path.exists
        old_rmtree = shutil.rmtree
        old_makedirs = os.makedirs

        is_data_dir = lambda p: p == common.CLOUD_DATASTORE_EMULATOR_DATA_DIR

        new_exists = (
            lambda p: data_dir_exists if is_data_dir(p) else old_exists(p))
        new_rmtree = test_utils.CallCounter(
            lambda p, **kw: None if is_data_dir(p) else old_rmtree(p, **kw))
        new_makedirs = test_utils.CallCounter(
            lambda p, **kw: None if is_data_dir(p) else old_makedirs(p, **kw))

        with python_utils.ExitStack() as exit_stack:
            exit_stack.enter_context(self.swap(os.path, 'exists', new_exists))
            exit_stack.enter_context(self.swap(shutil, 'rmtree', new_rmtree))
            exit_stack.enter_context(self.swap(os, 'makedirs', new_makedirs))
            yield new_rmtree, new_makedirs

    def assert_proc_was_managed_as_expected(
            self, logs, pid,
            manager_should_have_sent_terminate_signal=True,
            manager_should_have_sent_kill_signal=False):
        """Asserts that the process ended as expected.

        Args:
            logs: list(str). The logs emitted during the process's lifetime.
            pid: int. The process ID to inspect.
            manager_should_have_sent_terminate_signal: bool. Whether the manager
                should have sent a terminate signal to the process.
            manager_should_have_sent_kill_signal: bool. Whether the manager
                should have sent a kill signal to the process.
        """
        proc_pattern = r'[A-Za-z ]+\((name="[A-Za-z]+", )?pid=%d\)' % (pid,)

        expected_patterns = []
        if manager_should_have_sent_terminate_signal:
            expected_patterns.append(r'Terminating %s\.\.\.' % proc_pattern)
        if manager_should_have_sent_kill_signal:
            expected_patterns.append(r'Forced to kill %s!' % proc_pattern)
        else:
            expected_patterns.append(r'%s has already ended\.' % proc_pattern)

        logs_with_pid = [msg for msg in logs if re.search(proc_pattern, msg)]
        if expected_patterns and not logs_with_pid:
            self.fail(msg='%r has no match in logs=%r' % (proc_pattern, logs))

        self.assert_matches_regexps(logs_with_pid, expected_patterns)

    def test_does_not_raise_when_psutil_not_in_path(self):
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(sys, 'path', []))

        # Entering the context should not raise.
        self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))

    def test_concats_command_args_when_shell_is_true(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a', 1], shell=True, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_passes_command_args_as_list_of_strings_when_shell_is_false(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a', 1], shell=False, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_filters_empty_strings_from_command_args_when_shell_is_true(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['', 'a', '', 1], shell=True, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_filters_empty_strings_from_command_args_when_shell_is_false(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['', 'a', '', 1], shell=False, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_reports_killed_processes_as_warnings(self):
        self.exit_stack.enter_context(self.swap_popen(
            unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=True,
            manager_should_have_sent_kill_signal=True)

    def test_terminates_child_processes(self):
        self.exit_stack.enter_context(self.swap_popen(num_children=3))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        pids = [c.pid for c in proc.children()] + [proc.pid]
        self.exit_stack.close()

        self.assertEqual(len(set(pids)), 4)
        for pid in pids:
            self.assert_proc_was_managed_as_expected(logs, pid)

    def test_kills_child_processes(self):
        self.exit_stack.enter_context(self.swap_popen(
            num_children=3, unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        pids = [c.pid for c in proc.children()] + [proc.pid]
        self.exit_stack.close()

        self.assertEqual(len(set(pids)), 4)
        for pid in pids:
            self.assert_proc_was_managed_as_expected(
                logs, pid,
                manager_should_have_sent_terminate_signal=True,
                manager_should_have_sent_kill_signal=True)

    def test_respects_processes_that_are_killed_early(self):
        self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        time.sleep(1)
        proc.kill()
        proc.wait()
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=False)

    def test_respects_processes_that_are_killed_after_delay(self):
        self.exit_stack.enter_context(self.swap_popen(
            unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))

        def _kill_after_delay():
            """Kills the targeted process after a short delay."""
            time.sleep(5)
            proc.kill()

        assassin_thread = threading.Thread(target=_kill_after_delay)
        assassin_thread.start()

        self.exit_stack.close()

        assassin_thread.join()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=True,
            manager_should_have_sent_kill_signal=False)

    def test_does_not_raise_when_exit_fails(self):
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_raise(
            psutil, 'wait_procs', error=Exception('uh-oh')))
        logs = self.exit_stack.enter_context(self.capture_logging(
            min_level=logging.ERROR))

        self.exit_stack.enter_context(servers.managed_process(['a', 'bc']))
        # Should not raise.
        self.exit_stack.close()

        self.assert_matches_regexps(logs, [
            r'Failed to stop Process\(pid=1\) gracefully!\n'
            r'Traceback \(most recent call last\):\n'
            r'.*'
            r'Exception: uh-oh',
        ])

    def test_managed_firebase_emulator(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_firebase_auth_emulator())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('firebase', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_cloud_datastore_emulator(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(
            servers.managed_cloud_datastore_emulator())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn(
            'beta emulators datastore start', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_cloud_datastore_emulator_creates_missing_data_dir(self):
        self.exit_stack.enter_context(self.swap_popen())

        rmtree_counter, makedirs_counter = self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(False))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(
            servers.managed_cloud_datastore_emulator())
        self.exit_stack.close()

        self.assertEqual(rmtree_counter.times_called, 0)
        self.assertEqual(makedirs_counter.times_called, 1)

    def test_managed_cloud_datastore_emulator_clears_data_dir(self):
        self.exit_stack.enter_context(self.swap_popen())

        rmtree_counter, makedirs_counter = self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_cloud_datastore_emulator(
            clear_datastore=True))
        self.exit_stack.close()

        self.assertEqual(rmtree_counter.times_called, 1)
        self.assertEqual(makedirs_counter.times_called, 1)

    def test_managed_cloud_datastore_emulator_acknowledges_data_dir(self):
        self.exit_stack.enter_context(self.swap_popen())

        rmtree_counter, makedirs_counter = self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_cloud_datastore_emulator(
            clear_datastore=False))
        self.exit_stack.close()

        self.assertEqual(rmtree_counter.times_called, 0)
        self.assertEqual(makedirs_counter.times_called, 0)

    def test_managed_dev_appserver(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_dev_appserver(
            'app.yaml', env=None))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('dev_appserver.py', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True, 'env': None})

    def test_managed_elasticsearch_dev_server(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(
            servers.managed_elasticsearch_dev_server())
        self.exit_stack.close()

        self.assertEqual(
            popen_calls[0].program_args,
            '%s/bin/elasticsearch -q' % common.ES_PATH)
        self.assertEqual(popen_calls[0].kwargs, {
            'shell': True,
            'env': {'ES_PATH_CONF': common.ES_PATH_CONFIG_DIR},
        })

    def test_start_server_removes_elasticsearch_data(self):
        check_function_calls = {
            'shutil_rmtree_is_called': False
        }

        old_os_path_exists = os.path.exists

        def mock_os_remove_files(file_path): # pylint: disable=unused-argument
            check_function_calls['shutil_rmtree_is_called'] = True

        def mock_os_path_exists(file_path): # pylint: disable=unused-argument
            if file_path == common.ES_PATH_DATA_DIR:
                return True
            return old_os_path_exists(file_path)

        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            subprocess, 'call', value=scripts_test_utils.PopenStub()))
        self.exit_stack.enter_context(self.swap(
            shutil, 'rmtree', mock_os_remove_files))
        self.exit_stack.enter_context(self.swap(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(
            servers.managed_elasticsearch_dev_server())
        self.exit_stack.close()

        self.assertTrue(check_function_calls['shutil_rmtree_is_called'])

    def test_managed_redis_server_throws_exception_when_on_windows_os(self):
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'is_windows_os', value=True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.assertRaisesRegexp(
            Exception,
            'The redis command line interface is not installed because '
            'your machine is on the Windows operating system. The redis '
            'server cannot start.',
            lambda: self.exit_stack.enter_context(
                servers.managed_redis_server()))

    def test_managed_redis_server(self):
        original_os_remove = os.remove
        original_os_path_exists = os.path.exists

        @test_utils.CallCounter
        def mock_os_remove(path):
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_remove(path)

        def mock_os_path_exists(path):
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_path_exists(path)

        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))
        self.exit_stack.enter_context(self.swap_with_checks(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_with_checks(
            os, 'remove', mock_os_remove, called=False))

        self.exit_stack.enter_context(servers.managed_redis_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s' % (common.REDIS_SERVER_PATH, common.REDIS_CONF_PATH))
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_redis_server_deletes_redis_dump_when_it_exists(self):
        original_os_remove = os.remove
        original_os_path_exists = os.path.exists

        @test_utils.CallCounter
        def mock_os_remove(path):
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_remove(path)

        def mock_os_path_exists(path):
            if path == common.REDIS_DUMP_PATH:
                return True
            original_os_path_exists(path)

        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))
        self.exit_stack.enter_context(self.swap_with_checks(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_with_checks(
            os, 'remove', mock_os_remove))

        self.exit_stack.enter_context(servers.managed_redis_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s' % (common.REDIS_SERVER_PATH, common.REDIS_CONF_PATH))
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})
        self.assertEqual(mock_os_remove.times_called, 1)

    def test_managed_web_browser_on_linux_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=[]))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNotNone(managed_web_browser)
        self.exit_stack.enter_context(managed_web_browser)

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args, ['xdg-open', 'http://localhost:123/'])

    def test_managed_web_browser_on_virtualbox_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=['VBOX-123']))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNone(managed_web_browser)

        self.assertEqual(len(popen_calls), 0)

    def test_managed_web_browser_on_mac_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Darwin'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=[]))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNotNone(managed_web_browser)
        self.exit_stack.enter_context(managed_web_browser)

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args, ['open', 'http://localhost:123/'])

    def test_managed_web_browser_on_windows_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Windows'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=[]))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNone(managed_web_browser)

        self.assertEqual(len(popen_calls), 0)

    def test_managed_portserver(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(popen_calls[0].program_args, [
            'python', '-m', 'scripts.run_portserver',
            '--portserver_unix_socket_address',
            common.PORTSERVER_SOCKET_FILEPATH,
        ])
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 0)
        self.assertEqual(proc.kill_count, 0)

    def test_managed_portserver_when_signals_are_rejected(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        proc.reject_signal = True
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(popen_calls[0].program_args, [
            'python', '-m', 'scripts.run_portserver',
            '--portserver_unix_socket_address',
            common.PORTSERVER_SOCKET_FILEPATH,
        ])
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 1)
        self.assertEqual(proc.kill_count, 0)

    def test_managed_portserver_when_unresponsive(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        proc.unresponsive = True
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(popen_calls[0].program_args, [
            'python', '-m', 'scripts.run_portserver',
            '--portserver_unix_socket_address',
            common.PORTSERVER_SOCKET_FILEPATH,
        ])
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 1)
        self.assertEqual(proc.kill_count, 1)

    def test_managed_webpack_compiler_in_watch_mode_when_build_succeeds(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['abc', 'Built at: 123', 'def']))
        str_io = python_utils.string_io()
        self.exit_stack.enter_context(python_utils.redirect_stdout(str_io))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_webpack_compiler(
            watch_mode=True))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(len(popen_calls), 1)
        self.assertIn('--color', popen_calls[0].program_args)
        self.assertIn('--watch', popen_calls[0].program_args)
        self.assertIn('--progress', popen_calls[0].program_args)
        self.assert_matches_regexps(str_io.getvalue().strip().split('\n'), [
            'Starting new Webpack Compiler',
            'abc',
            'Built at: 123',
            'def',
            'Stopping Webpack Compiler',
        ])

    def test_managed_webpack_compiler_in_watch_mode_raises_when_not_built(self):
        # NOTE: The 'Built at: ' message is never printed.
        self.exit_stack.enter_context(self.swap_popen(outputs=['abc', 'def']))
        str_io = python_utils.string_io()
        self.exit_stack.enter_context(python_utils.redirect_stdout(str_io))

        self.assertRaisesRegexp(
            IOError, 'First build never completed',
            lambda: self.exit_stack.enter_context(
                servers.managed_webpack_compiler(watch_mode=True)))
        self.assert_matches_regexps(str_io.getvalue().strip().split('\n'), [
            'Starting new Webpack Compiler',
            'abc',
            'def',
            'Stopping Webpack Compiler',
        ])

    def test_managed_webpack_compiler_uses_explicit_config_path(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            config_path='config.json'))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config config.json' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH))

    def test_managed_webpack_compiler_uses_prod_source_maps_config(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=True, use_source_maps=True))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_PROD_SOURCE_MAPS_CONFIG))

    def test_managed_webpack_compiler_uses_prod_config(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=True, use_source_maps=False))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_PROD_CONFIG))

    def test_managed_webpack_compiler_uses_dev_source_maps_config(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=False, use_source_maps=True))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_DEV_SOURCE_MAPS_CONFIG))

    def test_managed_webpack_compiler_uses_dev_config(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=False, use_source_maps=False))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_DEV_CONFIG))

    def test_managed_webpack_compiler_with_max_old_space_size(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=['Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            max_old_space_size=2056))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('--max-old-space-size=2056', popen_calls[0].program_args)

    def test_managed_webdriver_with_explicit_chrome_version(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_with_checks(
            subprocess, 'check_call', lambda _: None, expected_args=[
                (
                    [common.NODE_BIN_PATH,
                     common.WEBDRIVER_MANAGER_BIN_PATH, 'update',
                     '--versions.chrome', '123'],
                ),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None,
            expected_args=[(4444,)]))

        self.exit_stack.enter_context(
            servers.managed_webdriver_server(chrome_version='123'))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s start --versions.chrome 123 --quiet --standalone' % (
                common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH))

    def test_managed_webdriver_on_mac_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Darwin'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            subprocess, 'check_call'))
        self.exit_stack.enter_context(self.swap_with_checks(
            subprocess, 'check_output', lambda _: '4.5.6.78', expected_args=[
                (
                    ['/Applications/Google Chrome.app/Contents/MacOS'
                     '/Google Chrome',
                     '--version'],
                ),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            python_utils, 'url_open', lambda _: mock.Mock(read=lambda: '4.5.6'),
            expected_args=[
                (
                    'https://chromedriver.storage.googleapis.com'
                    '/LATEST_RELEASE_4.5.6',
                ),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None,
            expected_args=[(4444,)]))

        self.exit_stack.enter_context(servers.managed_webdriver_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s start --versions.chrome 4.5.6 --quiet --standalone' % (
                common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH))

    def test_managed_webdriver_on_non_mac_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            subprocess, 'check_call'))
        self.exit_stack.enter_context(self.swap_with_checks(
            subprocess, 'check_output', lambda _: '1.2.3.45', expected_args=[
                (['google-chrome', '--version'],),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            python_utils, 'url_open', lambda _: mock.Mock(read=lambda: '1.2.3'),
            expected_args=[
                (
                    'https://chromedriver.storage.googleapis.com'
                    '/LATEST_RELEASE_1.2.3',
                ),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None,
            expected_args=[(4444,)]))

        self.exit_stack.enter_context(servers.managed_webdriver_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s start --versions.chrome 1.2.3 --quiet --standalone' % (
                common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH))

    def test_managed_webdriver_fails_to_get_chrome_version(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_raise(
            subprocess, 'check_output', error=OSError))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None, called=False))

        expected_regexp = 'Failed to execute "google-chrome --version" command'
        with self.assertRaisesRegexp(Exception, expected_regexp):
            self.exit_stack.enter_context(servers.managed_webdriver_server())

        self.assertEqual(len(popen_calls), 0)

    def test_managed_webdriver_on_window_os(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Windows'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            subprocess, 'check_call'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            subprocess, 'check_output', value='1.2.3.45'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            python_utils, 'url_open', value=mock.Mock(read=lambda: '1.2.3')))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'is_x64_architecture', value=True))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'inplace_replace_file_context',
            lambda *_: python_utils.nullcontext(), expected_args=[
                (
                    common.CHROME_PROVIDER_FILE_PATH,
                    r'this\.osArch\ \=\ os\.arch\(\)\;',
                    'this.osArch = "x64";',
                ),
                (
                    common.GECKO_PROVIDER_FILE_PATH,
                    r'this\.osArch\ \=\ os\.arch\(\)\;',
                    'this.osArch = "x64";',
                ),
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None,
            expected_args=[(4444,)]))

        self.exit_stack.enter_context(servers.managed_webdriver_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s start --versions.chrome 1.2.3 --quiet --standalone' % (
                common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH))

    def test_managed_protractor_with_invalid_sharding_instances(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        with self.assertRaisesRegexp(ValueError, 'should be larger than 0'):
            self.exit_stack.enter_context(
                servers.managed_protractor_server(sharding_instances=0))

        with self.assertRaisesRegexp(ValueError, 'should be larger than 0'):
            self.exit_stack.enter_context(
                servers.managed_protractor_server(sharding_instances=-1))

        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 0)

    def test_managed_protractor(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        self.exit_stack.enter_context(servers.managed_protractor_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})
        program_args = popen_calls[0].program_args
        self.assertIn(
            '%s --unhandled-rejections=strict %s %s' % (
                common.NODE_BIN_PATH, common.PROTRACTOR_BIN_PATH,
                common.PROTRACTOR_CONFIG_FILE_PATH),
            program_args)
        self.assertNotIn('--inspect-brk', program_args)
        self.assertIn('--params.devMode=True', program_args)
        self.assertIn('--suite full', program_args)

    def test_managed_protractor_with_explicit_args(self):
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        self.exit_stack.enter_context(servers.managed_protractor_server(
            suite_name='abc', sharding_instances=3, debug_mode=True,
            dev_mode=False, stdout=subprocess.PIPE))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].kwargs, {'shell': True, 'stdout': subprocess.PIPE})
        program_args = popen_calls[0].program_args
        # From debug_mode=True.
        self.assertIn('--inspect-brk', program_args)
        # From sharding_instances=3.
        self.assertIn('--capabilities.shardTestFiles=True', program_args)
        self.assertIn('--capabilities.maxInstances=3', program_args)
        # From dev_mode=True.
        self.assertIn('--params.devMode=False', program_args)
        # From suite='full'.
        self.assertIn('--suite abc', program_args)

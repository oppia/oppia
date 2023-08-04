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

from __future__ import annotations

import collections
import contextlib
import io
import logging
import os
import re
import shutil
import signal
import ssl
import subprocess
import sys
import threading
import time
from urllib import request as urlrequest

from core import utils
from core.tests import test_utils
from scripts import common
from scripts import scripts_test_utils
from scripts import servers

import psutil
from typing import Callable, Iterator, List, Optional, Sequence, Tuple


class ManagedProcessTests(test_utils.TestBase):

    # Helper class for improving the readability of tests.
    POPEN_CALL = (
        collections.namedtuple('POPEN_CALL', ['program_args', 'kwargs']))

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    @contextlib.contextmanager
    def swap_popen(
        self,
        unresponsive: bool = False,
        num_children: int = 0,
        outputs: Sequence[bytes] = ()
    ) -> Iterator[List[POPEN_CALL]]:
        """Returns values for inspecting and mocking calls to psutil.Popen.

        Args:
            unresponsive: bool. Whether the processes created by the mock will
                stall when asked to terminate.
            num_children: int. The number of child processes the process created
                by the mock should create. Children inherit the same termination
                behavior.
            outputs: list(bytes). The outputs of the mock process.

        Returns:
            Context manager. A context manager in which calls to psutil.Popen()
            create a simple program that waits and then exits.

        Yields:
            list(POPEN_CALL). A list with the most up-to-date arguments passed
            to psutil.Popen from within the context manager returned.
        """
        popen_calls = []

        def mock_popen(
            program_args: List[str], **kwargs: str
        ) -> scripts_test_utils.PopenStub:
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
            stdout = b''.join(b'%b\n' % o for o in outputs)
            child_procs = [
                scripts_test_utils.PopenStub(pid=i, unresponsive=unresponsive)
                for i in range(pid + 1, pid + 1 + num_children)
            ]
            return scripts_test_utils.PopenStub(
                pid=pid, stdout=stdout, unresponsive=unresponsive,
                child_procs=child_procs
            )

        with self.swap(psutil, 'Popen', mock_popen):
            yield popen_calls

    @contextlib.contextmanager
    def swap_managed_cloud_datastore_emulator_io_operations(
        self, data_dir_exists: bool
    ) -> Iterator[Tuple[test_utils.CallCounter, test_utils.CallCounter]]:
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

        is_data_dir: Callable[[str], bool] = (
            lambda p: p == common.CLOUD_DATASTORE_EMULATOR_DATA_DIR
        )

        new_exists = (
            lambda p: data_dir_exists if is_data_dir(p) else old_exists(p))
        new_rmtree = test_utils.CallCounter(
            lambda p, **kw: None if is_data_dir(p) else old_rmtree(p, **kw))
        new_makedirs = test_utils.CallCounter(
            lambda p, **kw: None if is_data_dir(p) else old_makedirs(p, **kw))

        with contextlib.ExitStack() as exit_stack:
            exit_stack.enter_context(self.swap(os.path, 'exists', new_exists))
            exit_stack.enter_context(self.swap(shutil, 'rmtree', new_rmtree))
            exit_stack.enter_context(self.swap(os, 'makedirs', new_makedirs))
            yield new_rmtree, new_makedirs

    def assert_proc_was_managed_as_expected(
        self,
        logs: List[str],
        pid: int,
        manager_should_have_sent_terminate_signal: bool = True,
        manager_should_have_sent_kill_signal: bool = False
    ) -> None:
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

    def test_does_not_raise_when_psutil_not_in_path(self) -> None:
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(sys, 'path', []))

        # Entering the context should not raise.
        self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))

    def test_concats_command_args_when_shell_is_true(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a', 1], timeout_secs=10, shell=True))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_passes_command_args_as_list_of_strings_when_shell_is_false(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a', 1], shell=False, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_filters_empty_strings_from_command_args_when_shell_is_true(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['', 'a', '', 1], timeout_secs=10, shell=True))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_filters_empty_strings_from_command_args_when_shell_is_false(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['', 'a', '', 1], shell=False, timeout_secs=10))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_killing_process_raises_exception(self) -> None:
        self.exit_stack.enter_context(self.swap_popen(
            unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        with self.assertRaisesRegex(
                Exception,
                'Process .* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=True,
            manager_should_have_sent_kill_signal=True)

    def test_killing_process_raises_no_exception_if_disabled(self) -> None:
        self.exit_stack.enter_context(self.swap_popen(
            unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10, raise_on_nonzero_exit=False))
        # Should not raise an exception.
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=True,
            manager_should_have_sent_kill_signal=True)

    def test_terminates_child_processes(self) -> None:
        self.exit_stack.enter_context(self.swap_popen(num_children=3))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        pids = [c.pid for c in proc.children()] + [proc.pid]
        self.exit_stack.close()

        self.assertEqual(len(set(pids)), 4)
        for pid in pids:
            self.assert_proc_was_managed_as_expected(logs, pid)

    def test_kills_child_processes(self) -> None:
        self.exit_stack.enter_context(self.swap_popen(
            num_children=3, unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        pids = [c.pid for c in proc.children()] + [proc.pid]
        with self.assertRaisesRegex(
                Exception, 'Process .* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assertEqual(len(set(pids)), 4)
        for pid in pids:
            self.assert_proc_was_managed_as_expected(
                logs, pid,
                manager_should_have_sent_terminate_signal=True,
                manager_should_have_sent_kill_signal=True)

    def test_respects_processes_that_are_killed_early(self) -> None:
        self.exit_stack.enter_context(self.swap_popen())
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))
        time.sleep(1)
        proc.kill()
        proc.wait()
        with self.assertRaisesRegex(
                Exception, 'Process .* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(
            logs, proc.pid,
            manager_should_have_sent_terminate_signal=False)

    def test_respects_processes_that_are_killed_after_delay(self) -> None:
        self.exit_stack.enter_context(self.swap_popen(
            unresponsive=True))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_process(
            ['a'], timeout_secs=10))

        def _kill_after_delay() -> None:
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

    def test_raise_when_process_errors(self) -> None:
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_raise(
            psutil, 'wait_procs', error=Exception('uh-oh')))
        logs = self.exit_stack.enter_context(self.capture_logging(
            min_level=logging.ERROR))

        self.exit_stack.enter_context(servers.managed_process(['a', 'bc']))
        with self.assertRaisesRegex(
                Exception, 'Process .* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assert_matches_regexps(logs, [
            r'Failed to stop Process\(pid=1\) gracefully!\n'
            r'Traceback \(most recent call last\):\n'
            r'.*'
            r'Exception: uh-oh',
        ])

    def test_managed_firebase_emulator(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_firebase_auth_emulator())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('firebase', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_cloud_datastore_emulator(self) -> None:
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
        self.assertNotIn('--no-store-on-disk', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_cloud_datastore_emulator_creates_missing_data_dir(
        self
    ) -> None:
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

    def test_managed_cloud_datastore_emulator_clears_data_dir(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        rmtree_counter, makedirs_counter = self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_cloud_datastore_emulator(
            clear_datastore=True))
        self.exit_stack.close()

        self.assertIn('--no-store-on-disk', popen_calls[0].program_args)

        self.assertEqual(rmtree_counter.times_called, 1)
        self.assertEqual(makedirs_counter.times_called, 1)

    def test_managed_cloud_datastore_emulator_acknowledges_data_dir(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        rmtree_counter, makedirs_counter = self.exit_stack.enter_context(
            self.swap_managed_cloud_datastore_emulator_io_operations(True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_cloud_datastore_emulator(
            clear_datastore=False))
        self.exit_stack.close()

        self.assertNotIn('--no-store-on-disk', popen_calls[0].program_args)

        self.assertEqual(rmtree_counter.times_called, 0)
        self.assertEqual(makedirs_counter.times_called, 0)

    def test_managed_dev_appserver(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        self.exit_stack.enter_context(servers.managed_dev_appserver(
            'app.yaml', env=None))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('dev_appserver.py', popen_calls[0].program_args)
        self.assertEqual(list(popen_calls[0].kwargs.keys()), ['shell', 'env'])

    def test_managed_elasticsearch_dev_server(self) -> None:
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
            'env': {
                'ES_JAVA_OPTS': '-Xms100m -Xmx500m',
                'ES_PATH_CONF': common.ES_PATH_CONFIG_DIR
            },
        })

    def test_start_server_removes_elasticsearch_data(self) -> None:
        check_function_calls = {
            'shutil_rmtree_is_called': False
        }

        old_os_path_exists = os.path.exists

        def mock_os_remove_files(file_path: str) -> None: # pylint: disable=unused-argument
            check_function_calls['shutil_rmtree_is_called'] = True

        def mock_os_path_exists(file_path: str) -> bool: # pylint: disable=unused-argument
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

    def test_managed_redis_server_throws_exception_when_on_windows_os(
        self
    ) -> None:
        self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'is_windows_os', value=True))
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))

        with self.assertRaisesRegex(
            Exception,
            'The redis command line interface is not installed because '
            'your machine is on the Windows operating system. The redis '
            'server cannot start.'
        ):
            self.exit_stack.enter_context(servers.managed_redis_server())

    def test_managed_redis_server(self) -> None:
        original_os_remove = os.remove
        original_os_path_exists = os.path.exists

        @test_utils.CallCounter
        def mock_os_remove(path: str) -> None:
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_remove(path)

        def mock_os_path_exists(path: str) -> None:
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_path_exists(path)

        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))
        self.exit_stack.enter_context(self.swap_with_checks(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_with_checks(
            subprocess,
            'check_call',
            lambda _: 0,
            expected_args=[([common.REDIS_CLI_PATH, 'shutdown', 'nosave'],)]
        ))
        self.exit_stack.enter_context(self.swap_with_checks(
            os, 'remove', mock_os_remove, called=False))

        self.exit_stack.enter_context(servers.managed_redis_server())

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s' % (common.REDIS_SERVER_PATH, common.REDIS_CONF_PATH))
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

        self.exit_stack.close()

    def test_managed_redis_server_deletes_redis_dump_when_it_exists(
        self
    ) -> None:
        original_os_remove = os.remove
        original_os_path_exists = os.path.exists

        @test_utils.CallCounter
        def mock_os_remove(path: str) -> None:
            if path == common.REDIS_DUMP_PATH:
                return
            original_os_remove(path)

        def mock_os_path_exists(path: str) -> Optional[bool]:
            if path == common.REDIS_DUMP_PATH:
                return True
            original_os_path_exists(path)
            return None

        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_to_always_return(
            common, 'wait_for_port_to_be_in_use'))
        self.exit_stack.enter_context(self.swap_with_checks(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_with_checks(
            os, 'remove', mock_os_remove))
        self.exit_stack.enter_context(self.swap_with_checks(
            subprocess,
            'check_call',
            lambda _: 0,
            expected_args=[([common.REDIS_CLI_PATH, 'shutdown', 'nosave'],)]
        ))

        self.exit_stack.enter_context(servers.managed_redis_server())
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s' % (common.REDIS_SERVER_PATH, common.REDIS_CONF_PATH))
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})
        self.assertEqual(mock_os_remove.times_called, 1)

    def test_managed_web_browser_on_linux_os(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=[]))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNotNone(managed_web_browser)

        assert managed_web_browser is not None
        self.exit_stack.enter_context(managed_web_browser)

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args, ['xdg-open', 'http://localhost:123/'])

    def test_managed_web_browser_on_mac_os(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Darwin'))
        self.exit_stack.enter_context(self.swap_to_always_return(
            os, 'listdir', value=[]))

        managed_web_browser = servers.create_managed_web_browser(123)
        self.assertIsNotNone(managed_web_browser)
        assert managed_web_browser is not None
        self.exit_stack.enter_context(managed_web_browser)

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args, ['open', 'http://localhost:123/'])

    def test_managed_web_browser_on_windows_os(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Windows'))

        with self.assertRaisesRegex(
            Exception,
            'Unable to identify the Operating System and therefore, unable to '
            'launch the web browser.'
            ):
            self.exit_stack.enter_context(
                servers.create_managed_web_browser(123))

        self.assertEqual(len(popen_calls), 0)

    def test_managed_web_browser_for_exception(self) -> None:
        web_browser_error = 'Mock Exception while launching web browser.'
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        mock_create_managed_web_browser = self.swap_to_always_raise(
                    servers, 'create_managed_web_browser',
                    Exception(web_browser_error))

        with mock_create_managed_web_browser:
            with self.assertRaisesRegex(
                Exception,
                web_browser_error
            ):
                self.exit_stack.enter_context(
                    servers.create_managed_web_browser(123))

        self.assertEqual(len(popen_calls), 0)

    def test_managed_portserver(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        with self.assertRaisesRegex(
                Exception,
                'Process Portserver.* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            'python -m scripts.run_portserver '
            '--portserver_unix_socket_address %s' % (
                common.PORTSERVER_SOCKET_FILEPATH),
        )
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 0)
        self.assertEqual(proc.kill_count, 0)

    def test_managed_portserver_removes_existing_socket(self) -> None:
        original_os_remove = os.remove
        original_os_path_exists = os.path.exists

        @test_utils.CallCounter
        def mock_os_remove(path: str) -> None:
            if path == common.PORTSERVER_SOCKET_FILEPATH:
                return
            original_os_remove(path)

        def mock_os_path_exists(path: str) -> Optional[bool]:
            if path == common.PORTSERVER_SOCKET_FILEPATH:
                return True
            original_os_path_exists(path)
            return None

        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap_with_checks(
            os.path, 'exists', mock_os_path_exists))
        self.exit_stack.enter_context(self.swap_with_checks(
            os, 'remove', mock_os_remove))

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        with self.assertRaisesRegex(
                Exception,
                'Process Portserver.* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            'python -m scripts.run_portserver '
            '--portserver_unix_socket_address %s' % (
                common.PORTSERVER_SOCKET_FILEPATH),
        )
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(mock_os_remove.times_called, 1)

    def test_managed_portserver_when_signals_are_rejected(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        proc.reject_signal = True
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            'python -m scripts.run_portserver '
            '--portserver_unix_socket_address %s' % (
                common.PORTSERVER_SOCKET_FILEPATH),
        )
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 1)
        self.assertEqual(proc.kill_count, 0)

    def test_managed_portserver_when_unresponsive(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        proc = self.exit_stack.enter_context(servers.managed_portserver())
        proc.unresponsive = True
        with self.assertRaisesRegex(
                Exception,
                'Process Portserver.* exited unexpectedly with exit code 1'):
            self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            'python -m scripts.run_portserver '
            '--portserver_unix_socket_address %s' % (
                common.PORTSERVER_SOCKET_FILEPATH),
        )
        self.assertEqual(proc.signals_received, [signal.SIGINT])
        self.assertEqual(proc.terminate_count, 1)
        self.assertEqual(proc.kill_count, 1)

    def test_managed_ng_build_in_watch_mode_when_build_succeeds(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'abc', b'Build at: 123', b'def']))
        str_io = io.StringIO()
        self.exit_stack.enter_context(contextlib.redirect_stdout(str_io))
        logs = self.exit_stack.enter_context(self.capture_logging())

        proc = self.exit_stack.enter_context(servers.managed_ng_build(
            watch_mode=True))
        self.exit_stack.close()

        self.assert_proc_was_managed_as_expected(logs, proc.pid)
        self.assertEqual(len(popen_calls), 1)
        self.assertIn('--watch', popen_calls[0].program_args)
        self.assert_matches_regexps(str_io.getvalue().strip().split('\n'), [
            'Starting new Angular Compiler',
            'abc',
            'Build at: 123',
            'def',
            'Stopping Angular Compiler',
        ])

    def test_managed_ng_build_in_watch_mode_raises_when_not_built(self) -> None:
        # NOTE: The 'Build at: ' message is never printed.
        self.exit_stack.enter_context(self.swap_popen(outputs=[b'abc', b'def']))
        str_io = io.StringIO()
        self.exit_stack.enter_context(contextlib.redirect_stdout(str_io))

        with self.assertRaisesRegex(
            IOError, 'First build never completed'
        ):
            self.exit_stack.enter_context(
                servers.managed_ng_build(watch_mode=True)
            )
        self.assert_matches_regexps(str_io.getvalue().strip().split('\n'), [
            'Starting new Angular Compiler',
            'abc',
            'def',
            'Stopping Angular Compiler',
        ])

    def test_managed_ng_build_uses_prod_config(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Build at: 123']))

        self.exit_stack.enter_context(servers.managed_ng_build(
            use_prod_env=True))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args, '%s build --prod' % common.NG_BIN_PATH
        )

    def test_managed_webpack_compiler_in_watch_mode_when_build_succeeds(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'abc', b'Built at: 123', b'def']))
        str_io = io.StringIO()
        self.exit_stack.enter_context(contextlib.redirect_stdout(str_io))
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

    def test_managed_webpack_compiler_in_watch_mode_raises_when_not_built(
        self
    ) -> None:
        # NOTE: The 'Built at: ' message is never printed.
        self.exit_stack.enter_context(self.swap_popen(outputs=[b'abc', b'def']))
        str_io = io.StringIO()
        self.exit_stack.enter_context(contextlib.redirect_stdout(str_io))

        with self.assertRaisesRegex(
            IOError, 'First build never completed'
        ):
            self.exit_stack.enter_context(
                servers.managed_webpack_compiler(watch_mode=True)
            )
        self.assert_matches_regexps(str_io.getvalue().strip().split('\n'), [
            'Starting new Webpack Compiler',
            'abc',
            'def',
            'Stopping Webpack Compiler',
        ])

    def test_managed_webpack_compiler_uses_explicit_config_path(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            config_path='config.json'))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config config.json' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH))

    def test_managed_webpack_compiler_uses_prod_source_maps_config(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=True, use_source_maps=True))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_PROD_SOURCE_MAPS_CONFIG))

    def test_managed_webpack_compiler_uses_prod_config(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=True, use_source_maps=False))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_PROD_CONFIG))

    def test_managed_webpack_compiler_uses_dev_source_maps_config(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=False, use_source_maps=True))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_DEV_SOURCE_MAPS_CONFIG))

    def test_managed_webpack_compiler_uses_dev_config(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            use_prod_env=False, use_source_maps=False))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].program_args,
            '%s %s --config %s' % (
                common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH,
                common.WEBPACK_DEV_CONFIG))

    def test_managed_webpack_compiler_with_max_old_space_size(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen(
            outputs=[b'Built at: 123']))

        self.exit_stack.enter_context(servers.managed_webpack_compiler(
            max_old_space_size=2056))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('--max-old-space-size=2056', popen_calls[0].program_args)

    def test_managed_webdriverio_server_fails_to_get_chrome_version(
        self
    ) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        self.exit_stack.enter_context(self.swap(common, 'OS_NAME', 'Linux'))
        self.exit_stack.enter_context(self.swap_to_always_raise(
            subprocess, 'check_output', error=OSError))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'wait_for_port_to_be_in_use', lambda _: None, called=False))

        expected_regexp = 'Failed to execute "google-chrome --version" command'
        with self.assertRaisesRegex(Exception, expected_regexp):
            self.exit_stack.enter_context(servers.managed_webdriverio_server())

        self.assertEqual(len(popen_calls), 0)

    def test_managed_webdriverio_with_invalid_sharding_instances(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        with self.assertRaisesRegex(ValueError, 'should be larger than 0'):
            self.exit_stack.enter_context(
                servers.managed_webdriverio_server(sharding_instances=0))

        with self.assertRaisesRegex(ValueError, 'should be larger than 0'):
            self.exit_stack.enter_context(
                servers.managed_webdriverio_server(sharding_instances=-1))

        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 0)

    def test_managed_webdriverio(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        self.exit_stack.enter_context(
            servers.managed_webdriverio_server(chrome_version='104.0.5112.79'))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].kwargs,
            {'shell': True, 'stdout': subprocess.PIPE}
        )
        program_args = popen_calls[0].program_args
        self.assertIn(
            '%s --unhandled-rejections=strict %s %s --suite full %s' % (
                common.NPX_BIN_PATH, common.NODEMODULES_WDIO_BIN_PATH,
                common.WEBDRIVERIO_CONFIG_FILE_PATH, '104.0.5112.79'),
            program_args)
        self.assertNotIn('DEBUG=true', program_args)
        self.assertIn('--suite full', program_args)
        self.assertIn('--params.devMode=True', program_args)

    def test_managed_webdriverio_mobile(
        self
    ) -> None:
        attempts = []

        def mock_urlopen(
            url: str, context: ssl.SSLContext
        ) -> io.BufferedIOBase:
            attempts.append(url)
            self.assertLessEqual(len(attempts), 1)
            self.assertTrue(
                url.startswith(
                    'https://chromedriver.storage.googleapis.com/LATEST_RELEASE'
                    ))
            self.assertIsNotNone(context)
            return io.BytesIO(b'content')

        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)
        with urlopen_swap:
            with servers.managed_webdriverio_server(mobile=True):
                self.assertEqual(os.getenv('MOBILE'), 'true')

    def test_managed_webdriverio_with_explicit_args(
        self
    ) -> None:
        attempts = []

        def mock_urlopen(
            url: str, context: ssl.SSLContext
        ) -> io.BufferedIOBase:
            attempts.append(url)
            self.assertLessEqual(len(attempts), 1)
            self.assertTrue(
                url.startswith(
                    'https://chromedriver.storage.googleapis.com/LATEST_RELEASE'
                    ))
            self.assertIsNotNone(context)
            return io.BytesIO(b'content')

        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        popen_calls = self.exit_stack.enter_context(self.swap_popen())

        with urlopen_swap:
            self.exit_stack.enter_context(servers.managed_webdriverio_server(
                suite_name='abc', sharding_instances=3, debug_mode=True,
                dev_mode=False, stdout=subprocess.PIPE))
            self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].kwargs, {'shell': True, 'stdout': subprocess.PIPE})
        program_args = popen_calls[0].program_args
        # From debug_mode=True.
        self.assertIn('DEBUG=true', program_args)
        # From sharding_instances=3.
        self.assertIn('--capabilities[0].maxInstances=3', program_args)
        # From dev_mode=True.
        self.assertIn('--params.devMode=False', program_args)
        # From suite='full'.
        self.assertIn('--suite abc', program_args)

    def test_managed_acceptance_test_server_with_explicit_args(self) -> None:
        popen_calls = self.exit_stack.enter_context(self.swap_popen())
        test_file_path = 'blog-admin-tests/assign-roles-to-users-and-change-tag-properties.spec.js' # pylint: disable=line-too-long

        self.exit_stack.enter_context(servers.managed_acceptance_tests_server(
            suite_name=test_file_path,
            stdout=subprocess.PIPE))
        self.exit_stack.close()

        self.assertEqual(len(popen_calls), 1)
        self.assertEqual(
            popen_calls[0].kwargs, {'shell': True, 'stdout': subprocess.PIPE})
        program_args = popen_calls[0].program_args
        self.assertIn(test_file_path, program_args)

    def test_managed_acceptance_test_server_with_invalid_suite(self) -> None:
        suite_name = 'invalid_suite'

        expected_regexp = 'Invalid suite name: %s' % suite_name
        with self.assertRaisesRegex(Exception, expected_regexp):
            self.exit_stack.enter_context(
                servers.managed_acceptance_tests_server(
                    suite_name=suite_name,
                    stdout=subprocess.PIPE))


class GetChromedriverVersionTests(test_utils.TestBase):

    def test_chrome_before_115_queries_api(self) -> None:
        def mock_check_output(_: List[str]) -> bytes:
            return b'Google Chrome 72.0.3626.123\n'
        def mock_url_open(_: str) -> io.BytesIO:
            return io.BytesIO(b'72.0.3626.69')
        expected_url = (
            'https://chromedriver.storage.googleapis.com/'
            'LATEST_RELEASE_72.0.3626')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        url_open_swap = self.swap_with_checks(
            utils, 'url_open', mock_url_open, expected_args=[(expected_url,)])

        with check_output_swap, url_open_swap:
            self.assertEqual(
                servers.get_chromedriver_version(),
                '72.0.3626.69',
            )

    def test_chrome_115_and_later_returns_chrome_version(self) -> None:
        def mock_check_output(_: List[str]) -> bytes:
            return b'Google Chrome 115.0.3626.123\n'
        def mock_url_open(_: str) -> None:
            raise AssertionError('url_open should not be called.')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        url_open_swap = self.swap(utils, 'url_open', mock_url_open)

        with check_output_swap, url_open_swap:
            self.assertEqual(
                servers.get_chromedriver_version(),
                '115.0.3626.123',
            )

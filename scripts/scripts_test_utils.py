# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Common utilities for test classes."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import signal

import python_utils

import psutil


class PopenStub(python_utils.OBJECT):
    """Stubs the API of psutil.Popen() to make unit tests less expensive.

    Attributes:
        pid: int. The ID of the process.
        stdout: str. The text written to standard output by the process.
        stderr: str. The text written to error output by the process.
        poll_count: int. The number of times poll() has been called.
        signals_received: list(int). List of received signals (as ints) in order
            of receipt.
        terminate_count: int. Number of times terminate() has been called.
        kill_count: int. Number of times kill() has been called.
        alive: bool. Whether the process should be considered to be alive.
        accept_signal: bool. Whether to raise OSError in send_signal().
        accept_terminate: bool. Whether to raise OSError in terminate().
        accept_kill: bool. Whether to raise OSError in kill().
        clean_shutdown: bool. Whether the process will end normally.
        returncode: int. The return code of the process.
    """

    def __init__(
            self, pid=1, name='process', stdout='', stderr='',
            accept_signal=True, accept_terminate=True, accept_kill=True,
            clean_shutdown=True, return_code=0, child_procs=None):
        """Initializes a new PopenStub instance.

        Args:
            pid: int. The ID of the process.
            name: str. The name of the process.
            stdout: str. The text written to standard output by the process.
            stderr: str. The text written to error output by the process.
            return_code: int. The return code of the process.
            accept_signal: bool. Whether to raise OSError in send_signal().
            accept_terminate: bool. Whether to raise OSError in terminate().
            accept_kill: bool. Whether to raise OSError in kill().
            clean_shutdown: bool. Whether the process will end normally.
            child_procs: list(PopenStub)|None. Processes "owned" by the stub, or
                None if there aren't any.
        """
        self.pid = pid
        self.stdout = python_utils.string_io(buffer_value=stdout)
        self.stderr = python_utils.string_io(buffer_value=stderr)
        self.poll_count = 0
        self.signals_received = []
        self.terminate_count = 0
        self.kill_count = 0
        self.alive = True
        self.accept_signal = accept_signal
        self.accept_terminate = accept_terminate
        self.accept_kill = accept_kill
        self.clean_shutdown = clean_shutdown

        self._name = name
        self._child_procs = tuple(child_procs) if child_procs else ()
        self._return_code = return_code

    @property
    def returncode(self):
        """Returns the return code of the process.

        Returns:
            int. The return code of the process.
        """
        return self._return_code

    @returncode.setter
    def returncode(self, return_code):
        """Assigns a return code to the process.

        Args:
            return_code: int. The return code to assign to the process.
        """
        self._return_code = return_code

    def name(self):
        """Returns the name of the process.

        Returns:
            str. The name of the process.
        """
        return self._name

    def children(self, recursive=False):
        """Returns the children spawned by this process.

        Args:
            recursive: bool. Whether to also return non-direct decendants from
                self (i.e. children of children).

        Returns:
            list(PopenStub). A list of the child processes.
        """
        children = []
        for child in self._child_procs:
            children.append(child)
            if recursive:
                children.extend(child.children(recursive=True))
        return children

    def terminate(self):
        """Increment terminate_count.

        Mocks the process being terminated.
        """
        self.terminate_count += 1
        if not self.accept_terminate:
            raise OSError()
        if not self.clean_shutdown:
            return
        self._exit(return_code=1)

    def kill(self):
        """Increment kill_count.

        NOTE: kill() does not respect self.clean_shutdown.

        Mocks the process being killed.
        """
        self.kill_count += 1
        if not self.accept_kill:
            raise OSError()
        self._exit(return_code=1)

    def is_running(self):
        """Returns whether the process is running.

        Returns:
            bool. The value of self.alive, which mocks whether the process is
            still alive.
        """
        return self.alive

    def poll(self):
        """Increment poll_count.

        Mocks checking whether the process is still alive.

        Returns:
            int|None. The return code of the process if it has ended, otherwise
            None.
        """
        self.poll_count += 1
        return None if self.alive else self._return_code

    def send_signal(self, signal_number):
        """Append signal to self.signals_received.

        Mocks receiving a process signal. If a SIGINT signal is received (e.g.
        from ctrl-C) and self.clean_shutdown is True, then we call self._exit().

        Args:
            signal_number: int. The number of the received signal.
        """
        self.signals_received.append(signal_number)
        if not self.accept_signal:
            raise OSError()
        if signal_number == signal.SIGINT and self.clean_shutdown:
            self._exit(return_code=1)

    def wait(self, timeout=None): # pylint: disable=unused-argument
        """Wait for the process completion.

        Mocks the process waiting for completion before it continues execution.
        No time is actually spent waiting, however, since the lifetime of the
        program is completely defined by the initialization params.

        Args:
            timeout: int|None. Time to wait before raising an exception, or None
                to wait indefinitely.
        """
        if not self.alive:
            return

        if self.clean_shutdown:
            self._exit()
        elif timeout is not None:
            raise psutil.TimeoutExpired(timeout)
        else:
            raise Exception('PopenStub has entered an infinite loop')

    def communicate(self, input=None): # pylint: disable=unused-argument, redefined-builtin
        """Mocks an interaction with the process.

        Args:
            input: str|None. Unused because the process isn't real.

        Returns:
            tuple(str, str). The stdout and stderr of the process, respectively.
        """
        if not self.alive:
            return self.stdout.getvalue(), self.stderr.getvalue()

        if self.clean_shutdown:
            self._exit()
            return self.stdout.getvalue(), self.stderr.getvalue()
        else:
            raise Exception('PopenStub has entered an infinite loop')

    def _exit(self, return_code=None):
        """Simulates the end of the process.

        Args:
            return_code: int|None. The return code of the program. If None, the
                return code assigned at initialization is used instead.
        """
        self.alive = False
        if return_code is not None:
            self._return_code = return_code

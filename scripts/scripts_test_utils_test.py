# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for test_utils, mainly for the FunctionWrapper."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import signal

from core.tests import test_utils
from scripts import scripts_test_utils

import psutil


class PopenStubTests(test_utils.TestBase):

    def test_default_attributes(self):
        popen = scripts_test_utils.PopenStub()

        self.assertEqual(popen.pid, 1)
        self.assertEqual(popen.stdout.getvalue(), '')
        self.assertEqual(popen.stderr.getvalue(), '')
        self.assertEqual(popen.poll_count, 0)
        self.assertEqual(popen.signals_received, [])
        self.assertEqual(popen.terminate_count, 0)
        self.assertEqual(popen.kill_count, 0)
        self.assertTrue(popen.alive)
        self.assertFalse(popen.reject_signal)
        self.assertFalse(popen.reject_terminate)
        self.assertFalse(popen.reject_kill)
        self.assertFalse(popen.unresponsive)
        self.assertEqual(popen.returncode, 0)
        self.assertEqual(popen.name(), 'process')
        self.assertEqual(popen.children(), [])

    def test_explicit_attributes(self):
        child = scripts_test_utils.PopenStub()
        popen = scripts_test_utils.PopenStub(
            pid=123, name='foo', stdout='abc', stderr='def',
            reject_signal=True, reject_terminate=True, reject_kill=True,
            unresponsive=True, return_code=1, child_procs=[child])

        self.assertEqual(popen.pid, 123)
        self.assertEqual(popen.stdout.getvalue(), 'abc')
        self.assertEqual(popen.stderr.getvalue(), 'def')
        self.assertEqual(popen.poll_count, 0)
        self.assertEqual(popen.signals_received, [])
        self.assertEqual(popen.terminate_count, 0)
        self.assertEqual(popen.kill_count, 0)
        self.assertTrue(popen.alive)
        self.assertTrue(popen.reject_signal)
        self.assertTrue(popen.reject_terminate)
        self.assertTrue(popen.reject_kill)
        self.assertTrue(popen.unresponsive)
        self.assertEqual(popen.returncode, 1)
        self.assertEqual(popen.children(), [child])
        self.assertEqual(popen.name(), 'foo')

    def test_reassign_returncode(self):
        popen = scripts_test_utils.PopenStub(return_code=1)
        self.assertEqual(popen.returncode, 1)

        popen.returncode = 2
        self.assertEqual(popen.returncode, 2)

    def test_children(self):
        grandchild = scripts_test_utils.PopenStub()
        child = scripts_test_utils.PopenStub(child_procs=[grandchild])
        popen = scripts_test_utils.PopenStub(child_procs=[child])

        self.assertEqual(popen.children(), [child])
        self.assertEqual(popen.children(recursive=True), [child, grandchild])

    def test_terminate(self):
        popen = scripts_test_utils.PopenStub()

        self.assertEqual(popen.terminate_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.terminate()

        self.assertEqual(popen.terminate_count, 1)
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 1)

    def test_reject_terminate(self):
        popen = scripts_test_utils.PopenStub(reject_terminate=True)

        self.assertEqual(popen.terminate_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        with self.assertRaisesRegexp(OSError, 'rejected'):
            popen.terminate()

        self.assertEqual(popen.terminate_count, 1)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_kill(self):
        popen = scripts_test_utils.PopenStub()

        self.assertEqual(popen.kill_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.kill()

        self.assertEqual(popen.kill_count, 1)
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 1)

    def test_reject_kill(self):
        popen = scripts_test_utils.PopenStub(reject_kill=True)

        self.assertEqual(popen.kill_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        with self.assertRaisesRegexp(OSError, 'rejected'):
            popen.kill()

        self.assertEqual(popen.kill_count, 1)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_send_signal(self):
        popen = scripts_test_utils.PopenStub()

        self.assertEqual(popen.signals_received, [])
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.send_signal(signal.SIGINT)

        self.assertEqual(popen.signals_received, [signal.SIGINT])
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 1)

    def test_reject_signal(self):
        popen = scripts_test_utils.PopenStub(reject_signal=True)

        self.assertEqual(popen.signals_received, [])
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        with self.assertRaisesRegexp(OSError, 'rejected'):
            popen.send_signal(signal.SIGINT)

        self.assertEqual(popen.signals_received, [signal.SIGINT])
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_poll(self):
        popen = scripts_test_utils.PopenStub()
        self.assertEqual(popen.poll_count, 0)

        self.assertIsNone(popen.poll())
        self.assertEqual(popen.poll_count, 1)

        popen.terminate()

        self.assertEqual(popen.poll(), 1)
        self.assertEqual(popen.poll_count, 2)

    def test_wait(self):
        popen = scripts_test_utils.PopenStub()

        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.wait()

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.wait()

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_wait_with_timeout(self):
        popen = scripts_test_utils.PopenStub()

        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.wait(timeout=10)

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.wait(timeout=10)

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_communicate(self):
        popen = scripts_test_utils.PopenStub(stdout='abc', stderr='def')

        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        self.assertEqual(popen.communicate(), ('abc', 'def'))

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        self.assertEqual(popen.communicate(), ('abc', 'def'))

        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_communicate_with_input(self):
        popen = scripts_test_utils.PopenStub(stdout='abc', stderr='def')

        self.assertEqual(popen.stdin.getvalue(), '')
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        self.assertEqual(popen.communicate(input='ghi'), ('abc', 'def'))

        self.assertEqual(popen.stdin.getvalue(), 'ghi')
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        self.assertEqual(popen.communicate(input='ghi'), ('abc', 'def'))

        self.assertEqual(popen.stdin.getvalue(), 'ghi')
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_terminate_on_unresponsive_popen_does_nothing(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        self.assertEqual(popen.terminate_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.terminate()

        self.assertEqual(popen.terminate_count, 1)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_kill_on_unresponsive_popen_ends_process(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        self.assertEqual(popen.kill_count, 0)
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.kill()

        self.assertEqual(popen.kill_count, 1)
        self.assertFalse(popen.is_running())
        self.assertEqual(popen.returncode, 1)

    def test_send_signal_on_unresponsive_popen_does_nothing(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        self.assertEqual(popen.signals_received, [])
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

        popen.send_signal(signal.SIGINT)

        self.assertEqual(popen.signals_received, [signal.SIGINT])
        self.assertTrue(popen.is_running())
        self.assertEqual(popen.returncode, 0)

    def test_wait_on_unresponsive_popen_raises_runtime_error(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        with self.assertRaisesRegexp(RuntimeError, 'entered an infinite loop'):
            popen.wait()

    def test_wait_with_timeout_on_unresponive_popen_raises_timeout_error(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        with self.assertRaisesRegexp(psutil.TimeoutExpired, '10'):
            popen.wait(timeout=10)

    def test_communicate_on_unresponsive_popen_raises_runtime_error(self):
        popen = scripts_test_utils.PopenStub(unresponsive=True)
        self.assertTrue(popen.unresponsive)

        with self.assertRaisesRegexp(RuntimeError, 'entered an infinite loop'):
            popen.communicate()

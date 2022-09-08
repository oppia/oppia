# coding: utf-8
#
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

"""Unit tests for scripts/run_portserver.py"""

from __future__ import annotations

import logging
import os
import socket

from core import utils
from core.tests import test_utils
from scripts import run_portserver

from typing import Any

class CloudTransactionServicesTests(test_utils.GenericTestBase):
    """Unit tests for scripts/run_portserver.py"""

    def setUp(self) -> None:
        super().setUp()
        self.terminal_logs: list[Any] = []
        def mock_logging(*msgs: Any) -> None:
            all_messages = [*msgs]
            for msg in all_messages:
                self.terminal_logs.append(msg)
        self.swap_log = self.swap(logging, 'info', mock_logging)

    def test_get_process_start_time_handles_IOError(self) -> None:
        def mock_open(*unused_args, **unused_kwargs) -> None:
            raise IOError('File not found.')
        pid = 12345

        swap_open = self.swap_with_checks(
            utils, 'open_file', mock_open,
            expected_args=(('/proc/{}/stat'.format(pid), 'r'),))

        with swap_open:
            returned_time = run_portserver.get_process_start_time(pid)
        self.assertEqual(returned_time, 0)

    def test_get_process_start_time(self) -> None:
        with open('dummy_file.txt', 'w', encoding='utf-8') as f:
            f.write('A B C D E F G H I J K L M N O P Q R S T U 11 V')

        dummy_file_object = open('dummy_file.txt', 'r', encoding='utf-8')
        pid = 12345

        swap_open = self.swap_with_checks(
            utils, 'open_file',
            lambda *unused_args, **unused_kwargs: dummy_file_object,
            expected_args=(('/proc/{}/stat'.format(pid), 'r'),))

        with swap_open:
            returned_time = run_portserver.get_process_start_time(pid)
        self.assertEqual(returned_time, 11)

        dummy_file_object.close()
        os.remove('dummy_file.txt')

    def test_get_process_command_line_handles_IOError(self) -> None:
        def mock_open(*unused_args, **unused_kwargs) -> None:
            raise IOError('File not found.')
        pid = 12345

        swap_open = self.swap_with_checks(
            utils, 'open_file', mock_open,
            expected_args=(('/proc/{}/cmdline'.format(pid), 'r'),))

        with swap_open:
            returned_text = run_portserver.get_process_command_line(pid)
        self.assertEqual(returned_text, '')

    def test_get_process_command_line(self) -> None:
        with open('dummy_file.txt', 'w', encoding='utf-8') as f:
            f.write('')

        dummy_file_object = open('dummy_file.txt', 'r', encoding='utf-8')
        expected_text = dummy_file_object.read()
        pid = 12345

        swap_open = self.swap_with_checks(
            utils, 'open_file',
            lambda *unused_args, **unused_kwargs: dummy_file_object,
            expected_args=(('/proc/{}/cmdline'.format(pid), 'r'),))

        with swap_open:
            returned_text = run_portserver.get_process_command_line(pid)
        self.assertEqual(returned_text, expected_text)

        dummy_file_object.close()
        os.remove('dummy_file.txt')
    
    def test_sock_bind_handles_error_while_creating_socket(self) -> None:
        port = 8181
        def mock_socket(*unused_args) -> None:
            raise socket.error('Some error occurred.')
        swap_socket = self.swap(socket, 'socket', mock_socket)
        with swap_socket:
            returned_port = run_portserver.sock_bind(
                port, socket.SOCK_STREAM, socket.IPPROTO_TCP)
        
        self.assertIsNone(returned_port)
    
    def test_socket_gets_bind_to_a_port(self) -> None:
        port = 8181
        class MockSocket:
            def setsockopt(*unused_args) -> None:
                pass
            def bind(self, info: Any) -> None:
                if(info[1] != port):
                    raise Exception('Invalid call\n%s != %s' % (info[1], port))
                pass
            def listen(self, time: int) -> None:
                pass
            def getsockname(self) -> list(Any):
                return ['Address', port]
            def close(self) -> None:
                pass
            
        swap_socket = self.swap(socket, 'socket', lambda *unused_args: MockSocket())
        with swap_socket:
            returned_port = run_portserver.sock_bind(
                port, socket.SOCK_STREAM, socket.IPPROTO_TCP)
        
        self.assertEqual(returned_port, port)
        
    def test_sock_bind_handles_error_while_getting_port_name(self) -> None:
        port = 8181
        class MockSocket:
            def setsockopt(*unused_args) -> None:
                pass
            def bind(self, info: Any) -> None:
                if(info[1] != port):
                    raise Exception('Invalid call\n%s != %s' % (info[1], port))
                pass
            def listen(self, time: int) -> None:
                pass
            def getsockname(self) -> None:
                raise socket.error('Some error occurred.')
            def close(self) -> None:
                pass
            
        swap_socket = self.swap(socket, 'socket', lambda *unused_args: MockSocket())
        with swap_socket:
            returned_port = run_portserver.sock_bind(
                port, socket.SOCK_DGRAM, socket.IPPROTO_TCP)
        
        self.assertIsNone(returned_port)
    
    def test_is_port_free(self) -> None:
        swap_sock_bind = self.swap(
            run_portserver, 'sock_bind', lambda *unused_args: True)
        
        with swap_sock_bind:
            result = run_portserver.is_port_free(8181)
        
        self.assertTrue(result)
    
    def test_should_allocate_port(self) -> None:
        pid = 12345
        swap_os_kill = self.swap_with_checks(
            os, 'kill', lambda *unused_args: None, expected_args=((pid, 0),))
        with swap_os_kill:
            result = run_portserver.should_allocate_port(pid)
        
        self.assertTrue(result)
    
    def test_should_allocate_port_handles_invalid_pid(self) -> None:
        pid = 0
        with self.swap_log:
            result = run_portserver.should_allocate_port(pid)
        
        self.assertFalse(result)
        self.assertIn(
            'Not allocating a port to invalid pid', self.terminal_logs)
    
    def test_should_allocate_port_handles_init_pid(self) -> None:
        pid = 1
        with self.swap_log:
            result = run_portserver.should_allocate_port(pid)
        
        self.assertFalse(result)
        self.assertIn(
            'Not allocating a port to init.', self.terminal_logs)
    
    def test_should_allocate_port_handles_OSError(self) -> None:
        pid = 12345
        def mock_kill(*unused_args) -> None:
            raise OSError('Some XYZ error occurred.')
        swap_os_kill = self.swap_with_checks(
            os, 'kill', mock_kill, expected_args=((pid, 0),))
        with swap_os_kill, self.swap_log:
            result = run_portserver.should_allocate_port(pid)
        
        self.assertFalse(result)
        self.assertIn(
            'Not allocating a port to a non-existent process',
            self.terminal_logs)

    def test_port_pool_handles_invalid_port_request(self) -> None:
        port = -1
        port_pool = run_portserver._PortPool()
        error_msg = r'Port must be in the \[1, 65535\] range, not -1.'
        with self.assertRaisesRegex(ValueError, error_msg):
            port_pool.add_port_to_free_pool(port)
    
    def test_port_pool_handles_empty_port_queue(self) -> None:
        port_pool = run_portserver._PortPool()
        error_msg = 'No ports being managed.'
        with self.assertRaisesRegex(RuntimeError, error_msg):
            port_pool.get_port_for_process(12345)

    def test_get_port_for_process_successfully(self) -> None:
        port = 8181
        swap_get_process_start_time = self.swap(
            run_portserver, 'get_process_start_time', lambda _: 0)
        swap_is_port_free = self.swap(
            run_portserver, 'is_port_free', lambda _: True)
        
        port_pool = run_portserver._PortPool()
        port_pool.add_port_to_free_pool(port)
        self.assertEqual(port_pool.num_ports(), 1)
        with swap_get_process_start_time, swap_is_port_free:
            returned_port = port_pool.get_port_for_process(12345)
        
        self.assertEqual(returned_port, port)
    
    def test_get_port_for_process_looks_for_free_port(self) -> None:
        port1 = 8181
        port2 = 8182
        swap_get_process_start_time = self.swap(
            run_portserver, 'get_process_start_time', lambda _: 1)
        swap_is_port_free = self.swap(
            run_portserver, 'is_port_free', lambda _: True)
        
        port_pool = run_portserver._PortPool()
        port_pool.add_port_to_free_pool(port1)
        port_pool.add_port_to_free_pool(port2)
        port = port_pool._port_queue.pop()
        port.start_time = 1
        port_pool._port_queue.append(port)
        self.assertEqual(port_pool.num_ports(), 2)
        with swap_get_process_start_time, swap_is_port_free:
            returned_port = port_pool.get_port_for_process(12345)
        
        self.assertEqual(returned_port, port1)
    
    def test_get_port_for_process_handles_no_free_port(self) -> None:
        port = 8181
        swap_get_process_start_time = self.swap(
            run_portserver, 'get_process_start_time', lambda _: 0)
        swap_is_port_free = self.swap(
            run_portserver, 'is_port_free', lambda _: False)
        
        port_pool = run_portserver._PortPool()
        port_pool.add_port_to_free_pool(port)
        self.assertEqual(port_pool.num_ports(), 1)
        with swap_get_process_start_time, swap_is_port_free, self.swap_log:
            returned_port = port_pool.get_port_for_process(12345)
        
        self.assertEqual(returned_port, 0)
        self.assertIn('All ports in use.', self.terminal_logs)
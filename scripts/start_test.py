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

"""Unit tests for scripts/start.py."""

from __future__ import annotations

from core.tests import test_utils
from scripts import build
from scripts import common
from scripts import extend_index_yaml
from scripts import install_third_party_libs
from scripts import servers
from typing import Any

PORT_NUMBER_FOR_GAE_SERVER = 8181


class MockCompiler:
    def wait(self) -> None: # pylint: disable=missing-docstring
        pass


class MockCompilerContextManager():
    def __init__(self) -> None:
        pass

    def __enter__(self) -> MockCompiler:
        return MockCompiler()

    def __exit__(self, *unused_args: Any) -> None:
        pass


class SetupTests(test_utils.GenericTestBase):
    """Unit tests for scripts/start.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        def mock_context_manager() -> MockCompilerContextManager:
            return MockCompilerContextManager()
        self.swap_print = self.swap(
            common, 'print_each_string_after_two_new_lines', mock_print)
        self.swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', lambda: None)
        self.swap_extend_index_yaml = self.swap(
            extend_index_yaml, 'main', lambda: None)
        self.swap_webpack_compiler = self.swap(
            servers, 'managed_webpack_compiler',
            lambda **unused_kwargs: MockCompilerContextManager())
        self.swap_redis_server = self.swap(
            servers, 'managed_redis_server', mock_context_manager)
        self.swap_elasticsearch_dev_server = self.swap(
            servers, 'managed_elasticsearch_dev_server', mock_context_manager)
        self.swap_firebase_auth_emulator = self.swap(
            servers, 'managed_firebase_auth_emulator',
            lambda **unused_kwargs: MockCompilerContextManager())
        self.swap_cloud_datastore_emulator = self.swap(
            servers, 'managed_cloud_datastore_emulator',
            lambda **unused_kwargs: MockCompilerContextManager())
        self.swap_dev_appserver = self.swap(
            servers, 'managed_dev_appserver',
            lambda *unused_args, **unused_kwargs: MockCompilerContextManager())
        self.swap_create_server = self.swap(
            servers, 'create_managed_web_browser',
            lambda _: MockCompilerContextManager())

    def test_start_servers_successfully(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build, 'main', lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}])
        with self.swap_cloud_datastore_emulator, self.swap_webpack_compiler:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_build:
                        with self.swap_create_server, self.swap_print:
                            start.main(args=[])

        self.assertIn(
            ['INFORMATION',
            'Local development server is ready! Opening a default web '
            'browser window pointing to it: '
            'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER],
            self.print_arr)

    def test_start_servers_successfully_in_production_mode(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build, 'main', lambda **unused_kwargs: None,
            expected_kwargs=[{'args': ['--prod_env']}])
        with self.swap_cloud_datastore_emulator, self.swap_webpack_compiler:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_build:
                        with self.swap_create_server, self.swap_print:
                            start.main(args=['--prod_env'])

        self.assertIn(
            ['INFORMATION',
            'Local development server is ready! Opening a default web '
            'browser window pointing to it: '
            'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER],
            self.print_arr)

    def test_start_servers_successfully_in_maintenance_mode(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build, 'main', lambda **unused_kwargs: None,
            expected_kwargs=[{
                'args': ['--maintenance_mode', '--source_maps']
            }])
        with self.swap_cloud_datastore_emulator, self.swap_webpack_compiler:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_build:
                        with self.swap_create_server, self.swap_print:
                            start.main(
                                args=['--maintenance_mode', '--source_maps'])

        self.assertIn(
            ['INFORMATION',
            'Local development server is ready! Opening a default web '
            'browser window pointing to it: '
            'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER],
            self.print_arr)

    def test_could_not_start_new_server_when_port_is_in_use(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build, 'main', lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}])
        swap_check_port_in_use = self.swap_with_checks(
            common, 'is_port_in_use', lambda _: True,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),))
        with self.swap_cloud_datastore_emulator, self.swap_webpack_compiler:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, self.swap_create_server:
                        with self.swap_print, swap_build:
                            with swap_check_port_in_use:
                                start.main(args=['--no_browser'])

        self.assertIn([
            'WARNING',
            'Could not start new server. There is already an existing server '
            'running at port %s.' % PORT_NUMBER_FOR_GAE_SERVER],
            self.print_arr)

        self.assertIn([
            'INFORMATION',
            'Local development server is ready! You can access it by '
            'navigating to http://localhost:%s/ in a web '
            'browser.' % PORT_NUMBER_FOR_GAE_SERVER],
            self.print_arr)

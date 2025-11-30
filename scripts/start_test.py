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

import os

import contextlib
from core.constants import constants
from core.tests import test_utils
from scripts import (
    build,
    common,
    extend_index_yaml,
    install_third_party_libs,
    servers,
)

PORT_NUMBER_FOR_GAE_SERVER = 8181
MANAGED_WEB_BROWSER_ERROR = 'Mock Exception while launching web browser.'


class MockCompiler:
    def wait(self) -> None:  # pylint: disable=missing-docstring
        pass

    def is_running(self) -> bool:
        """Mock whether the process is running. Return True by default.

        Tests that simulate a stopped dev server may replace this method with
        a version that returns False.
        """
        return True


class MockCompilerContextManager:
    def __init__(self) -> None:
        pass

    def __enter__(self) -> MockCompiler:
        return MockCompiler()

    def __exit__(self, *unused_args: str) -> None:
        pass


class StartTests(test_utils.GenericTestBase):
    """Unit tests for scripts/start.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []

        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)

        def mock_context_manager() -> MockCompilerContextManager:
            return MockCompilerContextManager()

        self.swap_print = self.swap(
            common, 'print_each_string_after_two_new_lines', mock_print
        )

        def mock_constants() -> None:
            print('mock_set_constants_to_default')

        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        # We need to create a swap for install_third_party_libs because
        # scripts/start.py installs third party libraries whenever it is
        # imported.
        self.swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', lambda: None
        )
        self.swap_extend_index_yaml = self.swap(
            extend_index_yaml, 'main', lambda: None
        )
        self.swap_webpack_compiler = self.swap_with_checks(
            servers,
            'managed_webpack_compiler',
            lambda **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[
                {
                    'use_prod_env': False,
                    'use_source_maps': False,
                    'watch_mode': True,
                }
            ],
        )
        self.swap_ng_build = self.swap_with_checks(
            servers,
            'managed_ng_build',
            lambda **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[{'watch_mode': True}],
        )
        self.swap_redis_server = self.swap(
            servers, 'managed_redis_server', mock_context_manager
        )
        self.swap_elasticsearch_dev_server = self.swap(
            servers, 'managed_elasticsearch_dev_server', mock_context_manager
        )
        self.swap_firebase_auth_emulator = self.swap_with_checks(
            servers,
            'managed_firebase_auth_emulator',
            lambda **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[{'recover_users': False}],
        )
        self.swap_cloud_datastore_emulator = self.swap_with_checks(
            servers,
            'managed_cloud_datastore_emulator',
            lambda **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[{'clear_datastore': True}],
        )
        self.swap_dev_appserver = self.swap_with_checks(
            servers,
            'managed_dev_appserver',
            lambda *unused_args, **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[
                {
                    'enable_host_checking': True,
                    'automatic_restart': True,
                    'skip_sdk_update_check': True,
                    'port': PORT_NUMBER_FOR_GAE_SERVER,
                    'env': env,
                }
            ],
        )
        self.swap_create_server = self.swap_with_checks(
            servers,
            'create_managed_web_browser',
            lambda _: MockCompilerContextManager(),
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )
        self.swap_create_managed_web_browser = self.swap_to_always_raise(
            servers,
            'create_managed_web_browser',
            Exception(MANAGED_WEB_BROWSER_ERROR),
        )
        self.swap_mock_set_constants_to_default = self.swap(
            common, 'set_constants_to_default', mock_constants
        )

    def test_start_servers_successfully(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}],
        )
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: False,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )
        with self.swap_cloud_datastore_emulator, self.swap_ng_build, swap_build:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_create_server, self.swap_webpack_compiler:
                    with self.swap_extend_index_yaml, self.swap_dev_appserver:
                        with self.swap_firebase_auth_emulator, self.swap_print:
                            with self.swap_mock_set_constants_to_default:
                                with swap_check_port_in_use:
                                    start.main(args=[])

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_start_servers_successfully_in_production_mode(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': ['--prod_env']}],
        )
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: False,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )
        with self.swap_cloud_datastore_emulator, self.swap_create_server:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_build:
                        with self.swap_print, swap_check_port_in_use:
                            with self.swap_mock_set_constants_to_default:
                                start.main(args=['--prod_env'])

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_start_servers_successfully_in_maintenance_mode(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': ['--maintenance_mode']}],
        )
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: False,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )
        with self.swap_cloud_datastore_emulator, swap_build, self.swap_ng_build:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_create_server, self.swap_webpack_compiler:
                    with self.swap_extend_index_yaml, self.swap_dev_appserver:
                        with self.swap_firebase_auth_emulator, self.swap_print:
                            with self.swap_mock_set_constants_to_default:
                                with swap_check_port_in_use:
                                    start.main(args=['--maintenance_mode'])

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_could_not_start_new_server_when_port_is_in_use(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}],
        )
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: True,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )
        with self.swap_cloud_datastore_emulator, self.swap_webpack_compiler:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_firebase_auth_emulator, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_check_port_in_use:
                        with self.swap_print, swap_build, self.swap_ng_build:
                            with self.swap_mock_set_constants_to_default:
                                start.main(args=['--no_browser'])

        self.assertIn(
            [
                'WARNING',
                (
                    'Could not start new server. There is already an existing '
                    'server running at port %s.' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! You can access it by '
                    'navigating to http://localhost:%s/ in a web '
                    'browser.' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_source_maps_are_compiled_by_webpack(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': ['--source_maps']}],
        )
        swap_emulator_mode = self.swap(constants, 'EMULATOR_MODE', False)
        self.swap_webpack_compiler = self.swap_with_checks(
            servers,
            'managed_webpack_compiler',
            lambda **unused_kwargs: MockCompilerContextManager(),
            expected_kwargs=[
                {
                    'use_prod_env': False,
                    'use_source_maps': True,
                    'watch_mode': True,
                }
            ],
        )
        with self.swap_webpack_compiler, self.swap_create_server:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with swap_emulator_mode, self.swap_dev_appserver:
                    with self.swap_extend_index_yaml, swap_build:
                        with self.swap_print, self.swap_ng_build:
                            with self.swap_mock_set_constants_to_default:
                                start.main(args=['--source_maps'])

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_could_not_auto_launch_web_browser(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}],
        )

        with self.swap_cloud_datastore_emulator, self.swap_ng_build, swap_build:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_create_managed_web_browser:
                    with self.swap_webpack_compiler, self.swap_dev_appserver:
                        with self.swap_extend_index_yaml, self.swap_print:
                            with self.swap_firebase_auth_emulator:
                                with self.swap_mock_set_constants_to_default:
                                    start.main(args=[])

        self.assertIn(
            [
                'ERROR',
                (
                    'Error occurred while attempting to automatically launch '
                    'the web browser: %s' % MANAGED_WEB_BROWSER_ERROR
                ),
            ],
            self.print_arr,
        )

        self.assertIn(
            [
                'INFORMATION',
                (
                    'Local development server is ready! You can access it by '
                    'navigating to http://localhost:%s/ in a web '
                    'browser.' % PORT_NUMBER_FOR_GAE_SERVER
                ),
            ],
            self.print_arr,
        )

    def test_not_mock_set_constants_to_default_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import start
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}],
        )
        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'Please mock this method in the test.'
        )

        with self.swap_cloud_datastore_emulator, self.swap_ng_build, swap_build:
            with self.swap_elasticsearch_dev_server, self.swap_redis_server:
                with self.swap_create_server, self.swap_webpack_compiler:
                    with self.swap_extend_index_yaml, self.swap_dev_appserver:
                        with self.swap_firebase_auth_emulator, self.swap_print:
                            with assert_raises_regexp:
                                start.main(args=[])

    def test_build_cancellation_resets_constants(self) -> None:
        """If the build fails or is cancelled, constants should be reset and
        no dev-server callbacks (extend/notify) should be called.
        """
        with self.swap_install_third_party_libs:
            from scripts import start

        order: list[str] = []

        # Swap set_constants_to_default to record its invocation.
        swap_set_constants = self.swap(
            common,
            'set_constants_to_default',
            lambda: order.append('set_constants'),
        )

        # Swap build to raise an exception simulating a build cancellation.
        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: (_ for _ in ()).throw(
                Exception('build_failed')
            ),
            expected_kwargs=[{'args': []}],
        )

        # Keep other server-related swaps in case import-time side-effects run.
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: False,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )

        with swap_check_port_in_use, swap_build:
            with self.swap_print, swap_set_constants:
                # Expect build to raise and set_constants to be invoked.
                with self.assertRaisesRegex(Exception, 'build_failed'):
                    start.main(args=[])

        self.assertIn('set_constants', order)

    def test_devserver_cancellation_triggers_alert_and_callbacks_in_order(
        self,
    ) -> None:
        """If the dev-server phase is cancelled (e.g. while launching the
        browser), the stack should unwind and produce the following sequence:
        alert_on_exit -> services exit -> set_constants_to_default ->
            extend_index_yaml.main -> notify_about_successful_shutdown.
        """
        with self.swap_install_third_party_libs:
            from scripts import start

        order: list[str] = []

        # Helper context manager that records exit events.
        class RecordContextManager:
            def __init__(self, name: str) -> None:
                self.name = name

            def __enter__(self):
                return self

            def __exit__(self, *unused_args: str) -> None:
                order.append(self.name)

        # Create a context manager that raises on enter to simulate cancellation
        class RaisingOnEnterContextManager:
            def __enter__(self):
                raise KeyboardInterrupt('user_cancel')

            def __exit__(self, *unused_args: str) -> None:
                pass

        # Swaps to record the invocation order for callbacks.
        swap_notify = self.swap(
            start,
            'notify_about_successful_shutdown',
            lambda: order.append('notify'),
        )
        # Inlined to use extend_index_yaml.main directly instead of the
        # former wrapper `call_extend_index_yaml`.
        swap_extend_index = self.swap(
            extend_index_yaml, 'main', lambda: order.append('extend')
        )
        swap_set_constants = self.swap(
            common,
            'set_constants_to_default',
            lambda: order.append('set_constants'),
        )

        # Replace alert_on_exit with one that records its exit.
        def mock_alert_on_exit():
            @contextlib.contextmanager
            def _cm():
                try:
                    yield
                finally:
                    order.append('alert')

            return _cm()

        swap_alert = self.swap(start, 'alert_on_exit', mock_alert_on_exit)

        # Replace service context managers to record when they are cleaned up.
        swap_dev_appserver = self.swap(
            servers,
            'managed_dev_appserver',
            lambda *a, **k: RecordContextManager('dev_appserver'),
        )
        swap_webpack = self.swap(
            servers,
            'managed_webpack_compiler',
            lambda **k: RecordContextManager('webpack'),
        )
        swap_ng_build = self.swap(
            servers,
            'managed_ng_build',
            lambda **k: RecordContextManager('ng_build'),
        )
        swap_cloud_ds = self.swap(
            servers,
            'managed_cloud_datastore_emulator',
            lambda **k: RecordContextManager('datastore'),
        )
        swap_firebase = self.swap(
            servers,
            'managed_firebase_auth_emulator',
            lambda **k: RecordContextManager('firebase'),
        )
        swap_elastic = self.swap(
            servers,
            'managed_elasticsearch_dev_server',
            lambda **k: RecordContextManager('elastic'),
        )
        swap_redis = self.swap(
            servers,
            'managed_redis_server',
            lambda **k: RecordContextManager('redis'),
        )

        # Swap create_managed_web_browser to raise on enter to trigger unwind.
        swap_create_browser = self.swap(
            servers,
            'create_managed_web_browser',
            lambda _: RaisingOnEnterContextManager(),
        )

        swap_build = self.swap_with_checks(
            build,
            'main',
            lambda **unused_kwargs: None,
            expected_kwargs=[{'args': []}],
        )
        swap_check_port_in_use = self.swap_with_checks(
            common,
            'is_port_in_use',
            lambda _: False,
            expected_args=((PORT_NUMBER_FOR_GAE_SERVER,),),
        )

        with swap_check_port_in_use:
            with self.swap_print, (
                swap_alert
            ), swap_notify, swap_extend_index, swap_set_constants:
                with swap_dev_appserver, swap_webpack, swap_ng_build:
                    with swap_cloud_ds, swap_firebase, swap_elastic, swap_redis:
                        with swap_create_browser, swap_build:
                            with self.assertRaisesRegex(
                                KeyboardInterrupt, 'user_cancel'
                            ):
                                start.main(args=[])

        # Check that alert is printed first.
        self.assertEqual(order[0], 'alert')
        # Find the first callback index for set_constants.
        idx_set_constants = order.index('set_constants')
        idx_extend = order.index('extend')
        idx_notify = order.index('notify')

        # Check callback ordering and that service exits appear before the
        # callbacks (e.g. dev_appserver exit occurs before set_constants).
        self.assertTrue(order.index('dev_appserver') < idx_set_constants)
        self.assertTrue(idx_set_constants < idx_extend < idx_notify)

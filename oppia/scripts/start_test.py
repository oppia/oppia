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

import argparse
import unittest
from unittest import mock

from scripts import start

from typing import List


class GetBuildArgsTests(unittest.TestCase):
    """Tests for get_build_args function."""

    def test_get_build_args_no_flags_returns_empty_list(self) -> None:
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=False, source_maps=False
        )
        self.assertEqual(start.get_build_args(parsed_args), [])

    def test_get_build_args_prod_env_flag_returns_prod_env(self) -> None:
        parsed_args = argparse.Namespace(
            prod_env=True, maintenance_mode=False, source_maps=False
        )
        self.assertEqual(start.get_build_args(parsed_args), ['--prod_env'])

    def test_get_build_args_maintenance_mode_flag_returns_maintenance_mode(
        self,
    ) -> None:
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=True, source_maps=False
        )
        self.assertEqual(
            start.get_build_args(parsed_args), ['--maintenance_mode']
        )

    def test_get_build_args_source_maps_flag_returns_source_maps(self) -> None:
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=False, source_maps=True
        )
        self.assertEqual(start.get_build_args(parsed_args), ['--source_maps'])

    def test_get_build_args_all_flags_returns_all(self) -> None:
        parsed_args = argparse.Namespace(
            prod_env=True, maintenance_mode=True, source_maps=True
        )
        self.assertEqual(
            start.get_build_args(parsed_args),
            ['--prod_env', '--maintenance_mode', '--source_maps'],
        )


class MakeDevAppserverEnvTests(unittest.TestCase):
    """Tests for make_dev_appserver_env function."""

    @mock.patch.dict('os.environ', {'TEST': 'value'})
    def test_returns_app_yaml_when_prod_env_true(self) -> None:
        parsed_args = argparse.Namespace(prod_env=True)
        env, app_yaml_path = start.make_dev_appserver_env(parsed_args)
        self.assertEqual(app_yaml_path, 'app.yaml')
        self.assertEqual(env['PIP_NO_DEPS'], 'True')

    @mock.patch.dict('os.environ', {'TEST': 'value'})
    def test_returns_app_dev_yaml_when_prod_env_false(self) -> None:
        parsed_args = argparse.Namespace(prod_env=False)
        env, app_yaml_path = start.make_dev_appserver_env(parsed_args)
        self.assertEqual(app_yaml_path, 'app_dev.yaml')
        self.assertEqual(env['PIP_NO_DEPS'], 'True')


class AttemptLaunchBrowserTests(unittest.TestCase):
    """Tests for attempt_launch_browser function."""

    def setUp(self) -> None:
        self.parsed_args_no_browser = argparse.Namespace(no_browser=True)
        self.parsed_args_with_browser = argparse.Namespace(no_browser=False)
        self.dev_appserver = mock.Mock()
        self.dev_appserver.is_running.return_value = True
        # This function takes a context manager as its argument and adds it to
        # the exit stack. When the ExitStack exits, it calls the context
        # manager's `__exit__` method. We mock this so that we can confirm that
        # it only gets called if the browser successfully launches.
        self.enter_context_fn = mock.Mock()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_browser_launch_success_prints_opening_message(
        self, mock_create_browser: mock.Mock, mock_print: mock.Mock
    ) -> None:
        start.attempt_launch_browser(self.enter_context_fn)
        self.enter_context_fn.assert_called_once_with(
            mock_create_browser.return_value
        )
        mock_print.assert_called_with(
            [
                'INFORMATION',
                'Local development server is ready! Opening a default web '
                'browser window pointing to it: http://localhost:8181/',
            ]
        )

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.sleep')
    @mock.patch('scripts.start.time.time')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_retries_until_successful_browser_launch(
        self,
        mock_create_browser: mock.Mock,
        mock_time: mock.Mock,
        mock_sleep: mock.Mock,
        _: mock.Mock,
    ) -> None:
        # This test simulates attempt_launch_browser() trying to start the
        # browser, failing, retrying after BROWSER_RETRY_INTERVAL_SECS, and
        # succeeding on the second attempt.
        mock_time.side_effect = [
            0,
            start.BROWSER_RETRY_INTERVAL_SECS,
        ]
        mock_create_browser.side_effect = [
            Exception('fail'),
            mock_create_browser.return_value,
        ]

        start.attempt_launch_browser(
            self.enter_context_fn,
        )

        self.assertEqual(mock_sleep.call_count, 1)
        # Called twice: fails, then succeeds.
        self.assertEqual(mock_create_browser.call_count, 2)
        self.enter_context_fn.assert_called_once_with(
            mock_create_browser.return_value
        )

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_success_when_devserver_is_running(
        self, mock_create_browser: mock.Mock, mock_print: mock.Mock
    ) -> None:
        # This test verifies that attempt_launch_browser successfully launches
        # the browser when the dev server is running.
        dev_appserver = mock.Mock()
        dev_appserver.is_running.return_value = True
        # Since this mock is actually used, we need to set up its context
        # manager methods.
        mock_create_browser.return_value.__enter__.return_value = None
        mock_create_browser.return_value.__exit__.return_value = None

        start.attempt_launch_browser(
            self.enter_context_fn,
        )

        self.enter_context_fn.assert_called_once_with(
            mock_create_browser.return_value
        )
        mock_print.assert_called_with(
            [
                'INFORMATION',
                'Local development server is ready! Opening a default web '
                'browser window pointing to it: http://localhost:8181/',
            ]
        )

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.sleep')
    @mock.patch('scripts.start.time.time')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_reports_error_and_fallback_on_timeout(
        self,
        mock_create_browser: mock.Mock,
        mock_time: mock.Mock,
        _: mock.Mock,
        mock_print: mock.Mock,
    ) -> None:
        # This test verifies that attempt_launch_browser reports an error and
        # prints a fallback message when browser launch fails repeatedly.
        mock_time.side_effect = [
            0,
            start.BROWSER_RETRY_INTERVAL_SECS,
            start.BROWSER_LAUNCH_TIMEOUT_SECS
            + start.BROWSER_RETRY_INTERVAL_SECS,
        ]
        self.dev_appserver.is_running.return_value = True
        mock_create_browser.side_effect = Exception('BROWSER FAIL')

        start.attempt_launch_browser(
            self.enter_context_fn,
        )

        mock_print.assert_any_call(
            [
                'ERROR',
                'Error occurred while attempting to automatically launch '
                'the web browser: BROWSER FAIL',
            ]
        )
        mock_print.assert_any_call(start.SERVER_READY_MESSAGE)
        self.enter_context_fn.assert_not_called()


class MainTests(unittest.TestCase):
    """Tests for main function."""

    def setUp(self) -> None:
        # Set up patches for all external dependencies to isolate the main()
        # function for unit testing.
        self.patcher_common_is_port_in_use = mock.patch(
            'scripts.start.common.is_port_in_use'
        )
        self.mock_is_port_in_use = self.patcher_common_is_port_in_use.start()
        self.mock_is_port_in_use.return_value = False

        self.patcher_install = mock.patch(
            'scripts.start.install_third_party_libs.main'
        )
        self.mock_install = self.patcher_install.start()

        self.patcher_build = mock.patch('scripts.start.build.main')
        self.mock_build = self.patcher_build.start()

        self.patcher_servers_managed_redis = mock.patch(
            'scripts.start.servers.managed_redis_server'
        )
        self.mock_redis = self.patcher_servers_managed_redis.start()

        self.patcher_servers_managed_es = mock.patch(
            'scripts.start.servers.managed_elasticsearch_dev_server'
        )
        self.mock_es = self.patcher_servers_managed_es.start()

        self.patcher_servers_managed_dev_appserver = mock.patch(
            'scripts.start.servers.managed_dev_appserver'
        )
        self.mock_dev_appserver = (
            self.patcher_servers_managed_dev_appserver.start()
        )

        self.patcher_common_write_hashes = mock.patch(
            'scripts.start.common.write_hashes_json_file'
        )
        self.mock_write_hashes = self.patcher_common_write_hashes.start()

        self.patcher_servers_managed_ng_build = mock.patch(
            'scripts.start.servers.managed_ng_build'
        )
        self.mock_ng_build = self.patcher_servers_managed_ng_build.start()

        self.patcher_servers_managed_webpack = mock.patch(
            'scripts.start.servers.managed_webpack_compiler'
        )
        self.mock_webpack = self.patcher_servers_managed_webpack.start()

        self.patcher_servers_managed_firebase = mock.patch(
            'scripts.start.servers.managed_firebase_auth_emulator'
        )
        self.mock_firebase = self.patcher_servers_managed_firebase.start()

        self.patcher_servers_managed_datastore = mock.patch(
            'scripts.start.servers.managed_cloud_datastore_emulator'
        )
        self.mock_datastore = self.patcher_servers_managed_datastore.start()

        self.patcher_extend_index = mock.patch(
            'scripts.start.extend_index_yaml.main'
        )
        self.mock_extend_index = self.patcher_extend_index.start()

        self.patcher_time_sleep = mock.patch('scripts.start.time.sleep')
        self.mock_time_sleep = self.patcher_time_sleep.start()

        self.patcher_servers_create_browser = mock.patch(
            'scripts.start.servers.create_managed_web_browser'
        )
        self.mock_create_browser = self.patcher_servers_create_browser.start()
        self.mock_create_browser.return_value.__enter__.return_value = None
        self.mock_create_browser.return_value.__exit__.return_value = None

        self.patcher_common_set_constants = mock.patch(
            'scripts.start.common.set_constants_to_default'
        )
        self.mock_set_constants = self.patcher_common_set_constants.start()

        self.patcher_attempt_launch = mock.patch(
            'scripts.start.attempt_launch_browser'
        )
        self.mock_attempt_launch = self.patcher_attempt_launch.start()

        self.dev_appserver_mock = mock.Mock()
        self.dev_appserver_mock.wait = mock.Mock()
        self.dev_appserver_mock.is_running = mock.Mock(return_value=True)
        self.mock_dev_appserver.return_value.__enter__.return_value = (
            self.dev_appserver_mock
        )
        self.mock_dev_appserver.return_value.__exit__.return_value = None

        # Mock context managers to avoid starting real services.
        for cm in [
            self.mock_redis,
            self.mock_es,
            self.mock_ng_build,
            self.mock_webpack,
            self.mock_firebase,
            self.mock_datastore,
        ]:
            cm.return_value.__enter__.return_value = None
            cm.return_value.__exit__.return_value = None

    def tearDown(self) -> None:
        # Stop all patches to clean up after each test.
        self.patcher_common_is_port_in_use.stop()
        self.patcher_install.stop()
        self.patcher_build.stop()
        self.patcher_servers_managed_redis.stop()
        self.patcher_servers_managed_es.stop()
        self.patcher_servers_managed_dev_appserver.stop()
        self.patcher_common_write_hashes.stop()
        self.patcher_servers_managed_ng_build.stop()
        self.patcher_servers_managed_webpack.stop()
        self.patcher_servers_managed_firebase.stop()
        self.patcher_servers_managed_datastore.stop()
        self.patcher_extend_index.stop()
        self.patcher_common_set_constants.stop()
        self.patcher_attempt_launch.stop()
        self.patcher_time_sleep.stop()
        self.patcher_servers_create_browser.stop()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    def test_main_exits_and_prints_error_if_ports_in_use(
        self, mock_print: mock.Mock
    ) -> None:
        required_ports = [
            (8181, 'GAE dev appserver'),
            (8000, 'GAE dev appserver admin port'),
            (6379, 'Redis server'),
            (9200, 'ElasticSearch server'),
            (9099, 'Firebase auth emulator'),
            (8089, 'Cloud Datastore emulator'),
        ]

        # Mock get_ports_in_use to return all ports as in use.
        with mock.patch(
            'scripts.start.common.get_ports_in_use',
            return_value=[p for p, _ in required_ports],
        ):
            with self.assertRaises(SystemExit) as cm:
                start.main(['--no_browser'])
            self.assertEqual(cm.exception.code, 1)
            mock_print.assert_called_with(
                [
                    'ERROR',
                    'Could not start new server. The following ports are already in use and need to be available: 8181 (GAE dev appserver), 8000 (GAE dev appserver admin port), 6379 (Redis server), 9200 (ElasticSearch server), 9099 (Firebase auth emulator), 8089 (Cloud Datastore emulator)',
                ]
            )

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_successful_startup_with_no_install(
        self, mock_attempt_launch: mock.Mock
    ) -> None:
        start.main(['--no_browser', '--skip_install'])
        self.mock_install.assert_not_called()
        self.mock_build.assert_called_once_with(args=[])
        mock_attempt_launch.assert_not_called()
        self.dev_appserver_mock.wait.assert_called_once()

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_successful_startup_with_install(
        self, mock_attempt_launch: mock.Mock
    ) -> None:
        start.main(['--no_browser'])
        self.mock_install.assert_called_once()
        self.mock_build.assert_called_once_with(args=[])
        mock_attempt_launch.assert_not_called()
        self.dev_appserver_mock.wait.assert_called_once()

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_build_failure_resets_constants(self, _: mock.Mock) -> None:
        self.mock_build.side_effect = Exception('build failed')
        with self.assertRaises(Exception):
            start.main(['--no_browser', '--skip_install'])
        self.mock_set_constants.assert_called_once()

    def test_main_correctly_passes_build_flags_to_build_script(self) -> None:
        start.main(['--prod_env', '--no_browser', '--skip_install'])
        self.mock_build.assert_called_once_with(args=['--prod_env'])

        self.mock_build.reset_mock()
        start.main(['--maintenance_mode', '--no_browser', '--skip_install'])
        self.mock_build.assert_called_once_with(args=['--maintenance_mode'])

    def test_main_correctly_passes_save_datastore_flags_to_emulators(
        self,
    ) -> None:
        start.main(['--save_datastore', '--no_browser', '--skip_install'])
        self.mock_firebase.assert_called_once_with(recover_users=True)
        self.mock_datastore.assert_called_once_with(clear_datastore=False)

    def test_main_correctly_passes_flags_to_dev_appserver(self) -> None:
        start.main(
            [
                '--disable_host_checking',
                '--no_auto_restart',
                '--no_browser',
                '--skip_install',
            ]
        )
        self.mock_dev_appserver.assert_called_once_with(
            'app_dev.yaml',
            enable_host_checking=False,
            automatic_restart=False,
            skip_sdk_update_check=True,
            port=8181,
            env=mock.ANY,
        )

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    def test_final_port_check_warns_if_ports_still_in_use_after_exit(
        self, mock_print: mock.Mock
    ) -> None:
        self.dev_appserver_mock.wait.side_effect = KeyboardInterrupt

        call_count = 0

        def mock_get_ports(ports: List[int]) -> List[int]:
            nonlocal call_count
            call_count += 1
            return ports if call_count == 2 else []

        with mock.patch(
            'scripts.common.get_ports_in_use',
            side_effect=mock_get_ports,
        ):
            with self.assertRaises(KeyboardInterrupt):
                start.main(['--no_browser', '--skip_install'])

        mock_print.assert_called_with(
            [
                'WARNING',
                (
                    'The following ports are still in use after exiting: '
                    '8181 (GAE dev appserver), '
                    '8000 (GAE dev appserver admin port), '
                    '6379 (Redis server), '
                    '9200 (ElasticSearch server), '
                    '9099 (Firebase auth emulator), '
                    '8089 (Cloud Datastore emulator)'
                ),
            ]
        )

    @mock.patch('scripts.start._alert_on_exit')
    @mock.patch('scripts.start.extend_index_yaml.main')
    @mock.patch('scripts.start.common.set_constants_to_default')
    @mock.patch('scripts.start._notify_about_successful_shutdown')
    def test_exitstack_callbacks_and_alert_order_on_cancel(
        self,
        mock_notify: mock.Mock,
        mock_set_constants: mock.Mock,
        mock_extend: mock.Mock,
        mock_alert: mock.Mock,
    ) -> None:
        # This test verifies the order of ExitStack callbacks during unwinding:
        # alert first, then set_constants, extend, notify.
        order: List[str] = []

        alert_cm = mock.Mock()
        alert_cm.__enter__ = mock.Mock(
            side_effect=lambda *args, **kwargs: order.append('alert')
        )
        alert_cm.__exit__ = mock.Mock(return_value=None)
        mock_alert.return_value = alert_cm
        mock_set_constants.side_effect = lambda: order.append('set_constants')
        mock_extend.side_effect = lambda: order.append('extend')
        mock_notify.side_effect = lambda: order.append('notify')

        self.dev_appserver_mock.wait.side_effect = KeyboardInterrupt
        with self.assertRaises(KeyboardInterrupt):
            start.main(['--no_browser', '--skip_install'])
        self.assertEqual(order, ['alert', 'set_constants', 'extend', 'notify'])

    def test_main_calls_attempt_launch_browser_when_no_browser_flag_not_set(
        self,
    ) -> None:
        """Test that main calls attempt_launch_browser when --no-browser is not
        set.
        """
        start.main(['--skip_install'])
        self.mock_attempt_launch.assert_called_once()

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

import argparse
import unittest
from unittest import mock

from scripts import start


class GetBuildArgsTests(unittest.TestCase):
    """Tests for get_build_args function."""

    def test_get_build_args_no_flags_returns_empty_list(self):
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=False, source_maps=False
        )
        self.assertEqual(start.get_build_args(parsed_args), [])

    def test_get_build_args_prod_env_flag_returns_prod_env(self):
        parsed_args = argparse.Namespace(
            prod_env=True, maintenance_mode=False, source_maps=False
        )
        self.assertEqual(start.get_build_args(parsed_args), ['--prod_env'])

    def test_get_build_args_maintenance_mode_flag_returns_maintenance_mode(
        self,
    ):
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=True, source_maps=False
        )
        self.assertEqual(
            start.get_build_args(parsed_args), ['--maintenance_mode']
        )

    def test_get_build_args_source_maps_flag_returns_source_maps(self):
        parsed_args = argparse.Namespace(
            prod_env=False, maintenance_mode=False, source_maps=True
        )
        self.assertEqual(start.get_build_args(parsed_args), ['--source_maps'])

    def test_get_build_args_all_flags_returns_all(self):
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
    def test_make_dev_appserver_env_prod_env_true_returns_app_yaml(self):
        parsed_args = argparse.Namespace(prod_env=True)
        env, app_yaml_path = start.make_dev_appserver_env(parsed_args)
        self.assertEqual(app_yaml_path, 'app.yaml')
        self.assertIn('PIP_NO_DEPS', env)
        self.assertEqual(env['PIP_NO_DEPS'], 'True')

    @mock.patch.dict('os.environ', {'TEST': 'value'})
    def test_make_dev_appserver_env_prod_env_false_returns_app_dev_yaml(self):
        parsed_args = argparse.Namespace(prod_env=False)
        env, app_yaml_path = start.make_dev_appserver_env(parsed_args)
        self.assertEqual(app_yaml_path, 'app_dev.yaml')
        self.assertIn('PIP_NO_DEPS', env)
        self.assertEqual(env['PIP_NO_DEPS'], 'True')


class AttemptLaunchBrowserTests(unittest.TestCase):
    """Tests for attempt_launch_browser function."""

    def setUp(self):
        # Set up mock arguments and dev_appserver for browser launch tests.
        self.parsed_args_no_browser = argparse.Namespace(no_browser=True)
        self.parsed_args_with_browser = argparse.Namespace(no_browser=False)
        self.dev_appserver = mock.Mock()
        self.dev_appserver.is_running.return_value = True
        self.enter_context_fn = mock.Mock()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    def test_attempt_launch_browser_no_browser_flag_prints_info_message(
        self, mock_print
    ):
        # This test verifies that attempt_launch_browser prints an info message and does not launch the browser when no_browser is True.
        start.attempt_launch_browser(
            self.parsed_args_no_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )
        mock_print.assert_called_once_with(
            [
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:8181/ in a web browser.',
            ]
        )
        self.enter_context_fn.assert_not_called()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_browser_launch_success_prints_opening_message(
        self, mock_create_browser, mock_print
    ):
        # This test verifies that attempt_launch_browser successfully launches
        # the browser and prints an opening message when the server is running.
        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
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
    def test_attempt_launch_browser_browser_launch_retry_until_success(
        self, mock_create_browser, mock_time, mock_sleep, mock_print
    ):
        # This test verifies that attempt_launch_browser retries browser launch on failure and succeeds on the second attempt.
        mock_time.side_effect = [
            0,
            0.5,
            1.0,
        ]  # Simulate time progression for retry logic.
        mock_create_browser.side_effect = [
            Exception('fail'),
            None,
        ]  # Fail first, succeed second.

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )

        self.assertEqual(mock_sleep.call_count, 1)
        self.assertEqual(
            mock_create_browser.call_count, 2
        )  # Called twice: fail, then success.
        self.enter_context_fn.assert_called_once_with(None)

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.sleep')
    @mock.patch('scripts.start.time.time')
    def test_attempt_launch_browser_gives_up_if_devserver_never_runs_prints_info_message(
        self, mock_time, mock_sleep, mock_print
    ):
        # This test verifies that attempt_launch_browser times out and prints an info message if the dev server never runs.
        mock_time.side_effect = [
            0,
            0.5,
            10.5,
        ]  # Simulate timeout after 10 seconds.
        self.dev_appserver.is_running.return_value = False

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )

        mock_print.assert_any_call(
            [
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:8181/ in a web browser.',
            ]
        )
        self.enter_context_fn.assert_not_called()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.sleep')
    @mock.patch('scripts.start.time.time')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_reports_error_and_fallback_on_timeout(
        self, mock_create_browser, mock_time, mock_sleep, mock_print
    ):
        # This test verifies that attempt_launch_browser reports an error and prints a fallback message when browser launch fails repeatedly and times out.
        mock_time.side_effect = [0, 0.5, 10.5]  # Simulate timeout.
        self.dev_appserver.is_running.return_value = True
        mock_create_browser.side_effect = Exception('browser fail')

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )

        mock_print.assert_any_call(
            [
                'ERROR',
                'Error occurred while attempting to automatically launch '
                'the web browser: browser fail',
            ]
        )
        mock_print.assert_any_call(
            [
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:8181/ in a web browser.',
            ]
        )
        self.enter_context_fn.assert_not_called()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.time')
    def test_attempt_launch_browser_gives_up_immediately_if_devserver_not_running(
        self, mock_time, mock_print
    ):
        # This test verifies that attempt_launch_browser gives up immediately and prints an info message if the dev server is not running and the timeout is reached without attempting browser launch.
        mock_time.side_effect = [0, 10]  # start_time = 0, check = 10 - 0 >= 10
        self.dev_appserver.is_running.return_value = False

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )

        mock_print.assert_called_once_with(
            [
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:8181/ in a web browser.',
            ]
        )
        self.enter_context_fn.assert_not_called()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.time.sleep')
    @mock.patch('scripts.start.time.time')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_reports_error_on_timeout_when_devserver_not_running(
        self, mock_create_browser, mock_time, mock_sleep, mock_print
    ):
        # This test verifies that attempt_launch_browser reports an error and prints a fallback message when the dev server is not running, browser launch fails, and timeout occurs.
        mock_time.side_effect = [
            0,
            0.5,
            10,
        ]  # start_time = 0, after sleep = 0.5, after second sleep = 10
        mock_create_browser.side_effect = Exception('browser fail')
        self.dev_appserver.is_running.return_value = False

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            self.dev_appserver,
        )

        print("Calls:", len(mock_print.call_args_list))
        mock_print.assert_any_call(
            [
                'ERROR',
                'Error occurred while attempting to automatically launch '
                'the web browser: browser fail',
            ]
        )
        mock_print.assert_any_call(
            [
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:8181/ in a web browser.',
            ]
        )
        self.enter_context_fn.assert_not_called()

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.servers.create_managed_web_browser')
    def test_attempt_launch_browser_success_when_devserver_has_no_is_running_attr(
        self, mock_create_browser, mock_print
    ):
        # This test verifies that attempt_launch_browser successfully launches the browser when the dev server does not have the is_running attribute.
        dev_appserver = object()  # No is_running attribute
        mock_create_browser.return_value.__enter__.return_value = None
        mock_create_browser.return_value.__exit__.return_value = None

        start.attempt_launch_browser(
            self.parsed_args_with_browser,
            self.enter_context_fn,
            dev_appserver,
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


class MainTests(unittest.TestCase):
    """Tests for main function."""

    def setUp(self):
        # Set up patches for all external dependencies to isolate the main function for unit testing.
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

    def tearDown(self):
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
    def test_main_exits_if_ports_in_use_prints_error(self, mock_print):
        # This test verifies that main exits with SystemExit and prints an error when required ports are in use.
        self.mock_is_port_in_use.return_value = True
        with self.assertRaises(SystemExit) as cm:
            start.main(['--no_browser'])
        self.assertEqual(cm.exception.code, 1)
        mock_print.assert_called_with(
            [
                'ERROR',
                (
                    'Could not start new server. The following ports are '
                    'already in use and need to be available: 8181 (GAE dev '
                    'appserver), 8000 (GAE dev appserver admin port), 6379 '
                    '(Redis server), 9200 (ElasticSearch server), 9099 '
                    '(Firebase auth emulator), 8089 (Cloud Datastore emulator)'
                ),
            ]
        )

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_successful_startup_with_no_browser(self, mock_attempt_launch):
        # This test verifies that main completes successfully with no_browser flag, skipping installation and calling build and browser attempt.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(['--no_browser', '--skip-install'])
        self.mock_install.assert_not_called()
        self.mock_build.assert_called_once_with(args=[])
        mock_attempt_launch.assert_called_once()
        self.dev_appserver_mock.wait.assert_called_once()

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_successful_startup_with_install(self, mock_attempt_launch):
        # This test verifies that main completes successfully with no_browser flag, running installation and calling build and browser attempt.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(['--no_browser'])
        self.mock_install.assert_called_once()
        self.mock_build.assert_called_once_with(args=[])
        mock_attempt_launch.assert_called_once()
        self.dev_appserver_mock.wait.assert_called_once()

    @mock.patch('scripts.start.attempt_launch_browser')
    def test_main_build_failure_resets_constants(self, mock_attempt_launch):
        # This test verifies that main resets constants when build fails and re-raises the exception.
        self.mock_build.side_effect = Exception('build failed')
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            with self.assertRaises(Exception):
                start.main(['--no_browser', '--skip-install'])
        self.mock_set_constants.assert_called_once()

    def test_main_serves_production_and_maintenance_build_flags(self):
        # This test verifies that main passes the correct build flags to build.main based on command-line arguments.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(['--prod_env', '--no_browser', '--skip-install'])
        self.mock_build.assert_called_once_with(args=['--prod_env'])

        self.mock_build.reset_mock()
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(['--maintenance_mode', '--no_browser', '--skip-install'])
        self.mock_build.assert_called_once_with(args=['--maintenance_mode'])

    def test_save_datastore_flags_are_propagated(self):
        # This test verifies that main propagates the save_datastore flag to emulator contexts when EMULATOR_MODE is enabled.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': True}):
            start.main(['--save_datastore', '--no_browser', '--skip-install'])
        self.mock_firebase.assert_called_once_with(recover_users=True)
        self.mock_datastore.assert_called_once_with(clear_datastore=False)

    def test_disable_host_checking_and_no_auto_restart_applied(self):
        # This test verifies that main applies disable_host_checking and no_auto_restart flags to the dev appserver.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(
                [
                    '--disable_host_checking',
                    '--no_auto_restart',
                    '--no_browser',
                    '--skip-install',
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

    @mock.patch.object(start.common, 'print_each_string_after_two_new_lines')
    @mock.patch('scripts.start.attempt_launch_browser')
    def test_start_servers_successfully_prints_opening_message(
        self, mock_attempt_launch, mock_print
    ):
        # This test verifies that main prints an opening message when starting servers without no_browser flag.
        mock_attempt_launch.side_effect = lambda *args, **kwargs: mock_print(
            [
                'INFORMATION',
                'Local development server is ready! Opening a default web '
                'browser window pointing to it: http://localhost:8181/',
            ]
        )
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            start.main(['--skip-install'])
        mock_print.assert_called_with(
            [
                'INFORMATION',
                'Local development server is ready! Opening a default web '
                'browser window pointing to it: http://localhost:8181/',
            ]
        )

    @mock.patch('scripts.start.common.print_each_string_after_two_new_lines')
    def test_final_port_check_warns_if_ports_still_in_use_after_exit(
        self, mock_print
    ):
        # This test verifies that main warns about ports still in use after the server stack unwinds due to an exception.
        self.dev_appserver_mock.wait.side_effect = KeyboardInterrupt
        port_calls = []
        original_is_port_in_use = start.common.is_port_in_use

        def mock_is_port_in_use(port):
            port_calls.append(port)
            if len(port_calls) <= 5:  # Initial checks return False.
                return False
            else:  # Final checks return True.
                return True

        with mock.patch(
            'scripts.start.common.is_port_in_use',
            side_effect=mock_is_port_in_use,
        ):
            with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
                with self.assertRaises(KeyboardInterrupt):
                    start.main(['--no_browser', '--skip-install'])
        mock_print.assert_called_with(
            [
                'WARNING',
                (
                    'The following ports are still in use after exiting: '
                    '8000 (GAE dev appserver admin port), 6379 (Redis server), '
                    '9200 (ElasticSearch server)'
                ),
            ]
        )

    @mock.patch('scripts.start._alert_on_exit')
    @mock.patch('scripts.start.extend_index_yaml.main')
    @mock.patch('scripts.start.common.set_constants_to_default')
    @mock.patch('scripts.start._notify_about_successful_shutdown')
    def test_exitstack_callbacks_and_alert_order_on_cancel(
        self, mock_notify, mock_set_constants, mock_extend, mock_alert
    ):
        # This test verifies the order of ExitStack callbacks during unwinding: alert first, then set_constants, extend, notify.
        order = []
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

        with mock.patch.dict(start.constants, {'EMULATOR_MODE': False}):
            with self.assertRaises(KeyboardInterrupt):
                start.main(['--no_browser', '--skip-install'])
        self.assertEqual(order, ['alert', 'set_constants', 'extend', 'notify'])

    def test_main_when_emulator_mode_is_enabled_uses_emulators(self):
        # This test verifies that main starts emulator contexts when EMULATOR_MODE is enabled.
        with mock.patch.dict(start.constants, {'EMULATOR_MODE': True}):
            start.main(['--no_browser', '--skip-install'])
        self.mock_firebase.assert_called_once_with(recover_users=False)
        self.mock_datastore.assert_called_once_with(clear_datastore=True)


if __name__ == '__main__':
    unittest.main()

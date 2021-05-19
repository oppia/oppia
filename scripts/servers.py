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

"""Utility functions for managing server processes required by Oppia."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib
import logging
import os
import re
import shutil
import signal
import subprocess
import sys
import threading

import feconf
import python_utils
from scripts import common


@contextlib.contextmanager
def managed_process(
        command_args, human_readable_name='Process', shell=False,
        timeout_secs=60, **popen_kwargs):
    """Context manager for starting and stopping a process gracefully.

    Args:
        command_args: list(int|str). A sequence of program arguments, where the
            program to execute is the first item. Ints are allowed in order to
            accomodate e.g. port numbers.
        human_readable_name: str. The human-readable name of the process. Used
            by the function's logging logic to improve readability.
        shell: bool. Whether the command should be run inside of its own shell.
            WARNING: Executing shell commands that incorporate unsanitized input
            from an untrusted source makes a program vulnerable to
            [shell injection](https://w.wiki/_Ac2), a serious security flaw
            which can result in arbitrary command execution. For this reason,
            the use of `shell=True` is **strongly discouraged** in cases where
            the command string is constructed from external input.
        timeout_secs: int. The time allotted for the managed process and its
            descendants to terminate themselves. After the timeout, any
            remaining processes will be killed abruptly.
        **popen_kwargs: dict(str: *). Same kwargs as `subprocess.Popen`.

    Yields:
        psutil.Process. The process managed by the context manager.
    """
    # TODO(#11549): Move this to top of the file.
    if common.PSUTIL_DIR not in sys.path:
        sys.path.insert(1, common.PSUTIL_DIR)
    import psutil

    get_proc_info = lambda p: (
        '%s(name="%s", pid=%d)' % (human_readable_name, p.name(), p.pid)
        if p.is_running() else '%s(pid=%d)' % (human_readable_name, p.pid))

    stripped_args = (('%s' % arg).strip() for arg in command_args)
    non_empty_args = (s for s in stripped_args if s)

    command = ' '.join(non_empty_args) if shell else list(non_empty_args)
    human_readable_command = command if shell else ' '.join(command)
    python_utils.PRINT(
        'Starting new %s: %s' % (human_readable_name, human_readable_command))
    popen_proc = psutil.Popen(command, shell=shell, **popen_kwargs)

    try:
        yield popen_proc
    finally:
        python_utils.PRINT('Stopping %s...' % get_proc_info(popen_proc))
        procs_still_alive = [popen_proc]
        try:
            if popen_proc.is_running():
                # Children must be terminated before the parent, otherwise they
                # may become zombie processes.
                procs_still_alive = (
                    popen_proc.children(recursive=True) + [popen_proc])

            procs_to_kill = []
            for proc in procs_still_alive:
                if proc.is_running():
                    logging.info('Terminating %s...' % get_proc_info(proc))
                    proc.terminate()
                    procs_to_kill.append(proc)
                else:
                    logging.info('%s has already ended.' % get_proc_info(proc))

            procs_gone, procs_still_alive = (
                psutil.wait_procs(procs_to_kill, timeout=timeout_secs))
            for proc in procs_still_alive:
                logging.warn('Forced to kill %s!' % get_proc_info(proc))
                proc.kill()
            for proc in procs_gone:
                logging.info('%s has already ended.' % get_proc_info(proc))
        except Exception:
            # NOTE: Raising an exception while exiting a context manager is bad
            # practice, so we log and suppress exceptions instead.
            logging.exception(
                'Failed to stop %s gracefully!' % get_proc_info(popen_proc))


@contextlib.contextmanager
def managed_dev_appserver(
        app_yaml_path, env=None, log_level='info',
        host='0.0.0.0', port=8080, admin_host='0.0.0.0', admin_port=8000,
        clear_datastore=False, enable_console=False, enable_host_checking=True,
        automatic_restart=True, skip_sdk_update_check=False):
    """Returns a context manager to start up and shut down a GAE dev appserver.

    Args:
        app_yaml_path: str. Path to the app.yaml file which defines the
            structure of the server.
        env: dict(str: str) or None. Defines the environment variables for the
            new process.
        log_level: str. The lowest log level generated by the application code
            and the development server. Expected values are: debug, info,
            warning, error, critical.
        host: str. The host name to which the app server should bind.
        port: int. The lowest port to which application modules should bind.
        admin_host: str. The host name to which the admin server should bind.
        admin_port: int. The port to which the admin server should bind.
        clear_datastore: bool. Whether to clear the datastore on startup.
        enable_console: bool. Whether to enable interactive console in admin
            view.
        enable_host_checking: bool. Whether to enforce HTTP Host checking for
            application modules, API server, and admin server. Host checking
            protects against DNS rebinding attacks, so only disable after
            understanding the security implications.
        automatic_restart: bool. Whether to restart instances automatically when
            files relevant to their module are changed.
        skip_sdk_update_check: bool. Whether to skip checking for SDK updates.
            If false, uses .appcfg_nag to decide.

    Yields:
        psutil.Process. The dev_appserver process.
    """
    dev_appserver_args = [
        common.CURRENT_PYTHON_BIN,
        common.DEV_APPSERVER_PATH,
        '--host', host,
        '--port', port,
        '--admin_host', admin_host,
        '--admin_port', admin_port,
        '--clear_datastore', 'true' if clear_datastore else 'false',
        '--enable_console', 'true' if enable_console else 'false',
        '--enable_host_checking', 'true' if enable_host_checking else 'false',
        '--automatic_restart', 'true' if automatic_restart else 'false',
        '--skip_sdk_update_check', 'true' if skip_sdk_update_check else 'false',
        '--log_level', log_level,
        '--dev_appserver_log_level', log_level,
        app_yaml_path
    ]
    # OK to use shell=True here because we are not passing anything that came
    # from an untrusted user, only other callers of the script, so there's no
    # risk of shell-injection attacks.
    proc_context = managed_process(
        dev_appserver_args, human_readable_name='GAE Development Server',
        shell=True, env=env)
    with proc_context as proc:
        common.wait_for_port_to_be_in_use(port)
        yield proc


@contextlib.contextmanager
def managed_firebase_auth_emulator(recover_users=False):
    """Returns a context manager to manage the Firebase auth emulator.

    Args:
        recover_users: bool. Whether to recover users created by the previous
            instance of the Firebase auth emulator.

    Yields:
        psutil.Process. The Firebase emulator process.
    """
    emulator_args = [
        common.FIREBASE_PATH, 'emulators:start', '--only', 'auth',
        '--project', feconf.OPPIA_PROJECT_ID,
        '--config', feconf.FIREBASE_EMULATOR_CONFIG_PATH,
    ]

    emulator_args.extend(
        ['--import', common.FIREBASE_EMULATOR_CACHE_DIR, '--export-on-exit']
        if recover_users else
        ['--export-on-exit', common.FIREBASE_EMULATOR_CACHE_DIR])

    # OK to use shell=True here because we are passing string literals and
    # constants, so there is no risk of a shell-injection attack.
    proc_context = managed_process(
        emulator_args, human_readable_name='Firebase Emulator', shell=True)
    with proc_context as proc:
        common.wait_for_port_to_be_in_use(feconf.FIREBASE_EMULATOR_PORT)
        yield proc


@contextlib.contextmanager
def managed_elasticsearch_dev_server():
    """Returns a context manager for ElasticSearch server for running tests
    in development mode and running a local dev server. This is only required
    in a development environment.

    Yields:
        psutil.Process. The ElasticSearch server process.
    """
    # Clear previous data stored in the local cluster.
    if os.path.exists(common.ES_PATH_DATA_DIR):
        shutil.rmtree(common.ES_PATH_DATA_DIR)

    # -q is the quiet flag.
    es_args = ['%s/bin/elasticsearch' % common.ES_PATH, '-q']
    # Override the default path to ElasticSearch config files.
    es_env = {'ES_PATH_CONF': common.ES_PATH_CONFIG_DIR}
    # OK to use shell=True here because we are passing string literals and
    # constants, so there is no risk of a shell-injection attack.
    proc_context = managed_process(
        es_args, human_readable_name='ElasticSearch Server', env=es_env,
        shell=True)
    with proc_context as proc:
        common.wait_for_port_to_be_in_use(feconf.ES_LOCALHOST_PORT)
        yield proc


@contextlib.contextmanager
def managed_cloud_datastore_emulator(clear_datastore=False):
    """Returns a context manager for the Cloud Datastore emulator.

    Args:
        clear_datastore: bool. Whether to delete the datastore's config and data
            before starting the emulator.

    Yields:
        psutil.Process. The emulator process.
    """
    emulator_hostport = '%s:%d' % (
        feconf.CLOUD_DATASTORE_EMULATOR_HOST,
        feconf.CLOUD_DATASTORE_EMULATOR_PORT)
    emulator_args = [
        common.GCLOUD_PATH, 'beta', 'emulators', 'datastore', 'start',
        '--project', feconf.OPPIA_PROJECT_ID,
        '--data-dir', common.CLOUD_DATASTORE_EMULATOR_DATA_DIR,
        '--host-port', emulator_hostport,
        '--no-store-on-disk', '--consistency=1.0', '--quiet',
    ]

    with python_utils.ExitStack() as stack:
        data_dir_exists = os.path.exists(
            common.CLOUD_DATASTORE_EMULATOR_DATA_DIR)
        if clear_datastore and data_dir_exists:
            # Replace it with an empty directory.
            shutil.rmtree(common.CLOUD_DATASTORE_EMULATOR_DATA_DIR)
            os.makedirs(common.CLOUD_DATASTORE_EMULATOR_DATA_DIR)
        elif not data_dir_exists:
            os.makedirs(common.CLOUD_DATASTORE_EMULATOR_DATA_DIR)

        # OK to use shell=True here because we are passing string literals and
        # constants, so there is no risk of a shell-injection attack.
        proc = stack.enter_context(managed_process(
            emulator_args, human_readable_name='Cloud Datastore Emulator',
            shell=True))

        common.wait_for_port_to_be_in_use(feconf.CLOUD_DATASTORE_EMULATOR_PORT)

        # Environment variables required to communicate with the emulator.
        stack.enter_context(common.swap_env(
            'DATASTORE_DATASET', feconf.OPPIA_PROJECT_ID))
        stack.enter_context(common.swap_env(
            'DATASTORE_EMULATOR_HOST', emulator_hostport))
        stack.enter_context(common.swap_env(
            'DATASTORE_EMULATOR_HOST_PATH', '%s/datastore' % emulator_hostport))
        stack.enter_context(common.swap_env(
            'DATASTORE_HOST', 'http://%s' % emulator_hostport))
        stack.enter_context(common.swap_env(
            'DATASTORE_PROJECT_ID', feconf.OPPIA_PROJECT_ID))
        stack.enter_context(common.swap_env(
            'DATASTORE_USE_PROJECT_ID_AS_APP_ID', 'true'))

        yield proc


@contextlib.contextmanager
def managed_redis_server():
    """Run the redis server within a context manager that ends it gracefully."""
    if common.is_windows_os():
        raise Exception(
            'The redis command line interface is not installed because your '
            'machine is on the Windows operating system. The redis server '
            'cannot start.')

    # Check if a redis dump file currently exists. This file contains residual
    # data from a previous run of the redis server. If it exists, removes the
    # dump file so that the redis server starts with a clean slate.
    if os.path.exists(common.REDIS_DUMP_PATH):
        os.remove(common.REDIS_DUMP_PATH)

    # OK to use shell=True here because we are passing string literals and
    # constants, so there is no risk of a shell-injection attack.
    proc_context = managed_process(
        [common.REDIS_SERVER_PATH, common.REDIS_CONF_PATH],
        human_readable_name='Redis Server', shell=True)
    with proc_context as proc:
        common.wait_for_port_to_be_in_use(feconf.REDISPORT)
        yield proc


def create_managed_web_browser(port):
    """Returns a context manager for a web browser targeting the given port on
    localhost. If a web browser cannot be opened on the current system by Oppia,
    then returns None instead.

    Args:
        port: int. The port number to open in the web browser.

    Returns:
        context manager|None. The context manager to a web browser window, or
        None if the current operating system does not support web browsers.
    """
    url = 'http://localhost:%s/' % port
    human_readable_name = 'Web Browser'
    if common.is_linux_os():
        if any(re.match('.*VBOX.*', d) for d in os.listdir('/dev/disk/by-id/')):
            return None
        else:
            return managed_process(
                ['xdg-open', url], human_readable_name=human_readable_name)
    elif common.is_mac_os():
        return managed_process(
            ['open', url], human_readable_name=human_readable_name)
    else:
        return None


@contextlib.contextmanager
def managed_webpack_compiler(
        config_path=None, use_prod_env=False, use_source_maps=False,
        watch_mode=False, max_old_space_size=None):
    """Returns context manager to start/stop the webpack compiler gracefully.

    Args:
        config_path: str|None. Path to an explicit webpack config, or None to
            determine it from the other args.
        use_prod_env: bool. Whether to compile for use in production. Only
            respected if config_path is None.
        use_source_maps: bool. Whether to compile with source maps. Only
            respected if config_path is None.
        watch_mode: bool. Run the compiler in watch mode, which rebuilds on file
            change.
        max_old_space_size: int|None. Sets the max memory size of the compiler's
            "old memory" section. As memory consumption approaches the limit,
            the compiler will spend more time on garbage collection in an effort
            to free unused memory.

    Yields:
        psutil.Process. The Webpack compiler process.
    """
    if config_path is not None:
        pass
    elif use_prod_env:
        config_path = (
            common.WEBPACK_PROD_SOURCE_MAPS_CONFIG if use_source_maps else
            common.WEBPACK_PROD_CONFIG)
    else:
        config_path = (
            common.WEBPACK_DEV_SOURCE_MAPS_CONFIG if use_source_maps else
            common.WEBPACK_DEV_CONFIG)

    compiler_args = [
        common.NODE_BIN_PATH, common.WEBPACK_BIN_PATH, '--config', config_path,
    ]
    if max_old_space_size:
        # NOTE: --max-old-space-size is a flag for Node.js, not the Webpack
        # compiler, so we insert it immediately after NODE_BIN_PATH.
        compiler_args.insert(1, '--max-old-space-size=%d' % max_old_space_size)
    if watch_mode:
        compiler_args.extend(['--color', '--watch', '--progress'])

    with python_utils.ExitStack() as exit_stack:
        # OK to use shell=True here because we are passing string literals and
        # constants, so there is no risk of a shell-injection attack.
        proc = exit_stack.enter_context(managed_process(
            compiler_args, human_readable_name='Webpack Compiler', shell=True,
            # Capture compiler's output to detect when builds have completed.
            stdout=subprocess.PIPE))

        if watch_mode:
            # Iterate until an empty string is printed, which signals the end of
            # the process.
            for line in iter(proc.stdout.readline, ''):
                sys.stdout.write(line)
                # Message printed when a compilation has succeeded. We break
                # after the first one to ensure the site is ready to be visited.
                if 'Built at: ' in line:
                    break
            else:
                # If the code never ran `break`, raise an error because a build
                # hasn't finished successfully.
                raise IOError('First build never completed')

        def print_proc_output():
            """Prints the proc's output until it is exhausted."""
            # Iterate until an empty string is printed, which signals the end of
            # the output.
            for line in iter(proc.stdout.readline, ''):
                sys.stdout.write(line)

        # Start a thread to print the rest of the compiler's output to stdout.
        printer_thread = threading.Thread(target=print_proc_output)
        printer_thread.start()
        exit_stack.callback(printer_thread.join)

        yield proc


@contextlib.contextmanager
def managed_portserver():
    """Returns context manager to start/stop the portserver gracefully.

    The portserver listens at PORTSERVER_SOCKET_FILEPATH and allocates free
    ports to clients. This prevents race conditions when two clients request
    ports in quick succession. The local Google App Engine server that we use to
    serve the development version of Oppia uses python_portpicker, which is
    compatible with the portserver this function starts, to request ports.

    By "compatible" we mean that python_portpicker requests a port by sending a
    request consisting of the PID of the requesting process and expects a
    response consisting of the allocated port number. This is the interface
    provided by this portserver.

    Yields:
        psutil.Popen. The Popen subprocess object.
    """
    # TODO(#11549): Move this to top of the file.
    if common.PSUTIL_DIR not in sys.path:
        # Our unit tests already configure sys.path correctly, but the
        # standalone scripts do not. Because of this, the following line cannot
        # be covered. This is fine since we want to cleanup this code anyway in
        # #11549.
        sys.path.insert(1, common.PSUTIL_DIR) # pragma: nocover
    import psutil

    portserver_args = [
        'python', '-m', 'scripts.run_portserver',
        '--portserver_unix_socket_address', common.PORTSERVER_SOCKET_FILEPATH,
    ]
    # OK to use shell=True here because we are passing string literals and
    # constants, so there is no risk of a shell-injection attack.
    proc_context = (
        managed_process(portserver_args, human_readable_name='Portserver'))
    with proc_context as proc:
        try:
            yield proc
        finally:
            # Before exiting the proc_context, try to end the process with
            # SIGINT. The portserver is configured to shut down cleanly upon
            # receiving this signal.
            try:
                proc.send_signal(signal.SIGINT)
            except OSError:
                # Raises when the process has already shutdown, in which case we
                # can just return immediately.
                pass
            else:
                # Otherwise, give the portserver 10 seconds to shut down after
                # sending CTRL-C (SIGINT).
                try:
                    proc.wait(timeout=10)
                except psutil.TimeoutExpired:
                    # If the server fails to shut down, allow proc_context to
                    # end it by calling terminate() and/or kill().
                    pass


@contextlib.contextmanager
def managed_webdriver_server(chrome_version=None):
    """Returns context manager to start/stop the Webdriver server gracefully.

    This context manager updates Google Chrome before starting the server.

    Args:
        chrome_version: str|None. The version of Google Chrome to run the tests
            on. If None, then the currently-installed version of Google Chrome
            is used instead.

    Yields:
        psutil.Process. The Webdriver process.
    """
    if chrome_version is None:
        # Although there are spaces between Google and Chrome in the path, we
        # don't need to escape them for Popen (as opposed to on the terminal, in
        # which case we would need to escape them for the command to run).
        chrome_command = (
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            if common.is_mac_os() else 'google-chrome')
        try:
            output = subprocess.check_output([chrome_command, '--version'])
        except OSError:
            # For the error message on macOS, we need to add the backslashes in.
            # This is because it is likely that a user will try to run the
            # command on their terminal and, as mentioned above, the macOS
            # chrome version command has spaces in the path which need to be
            # escaped for successful terminal use.
            raise Exception(
                'Failed to execute "%s --version" command. This is used to '
                'determine the chromedriver version to use. Please set the '
                'chromedriver version manually using --chrome_driver_version '
                'flag. To determine the chromedriver version to be used, '
                'please follow the instructions mentioned in the following '
                'URL:\n'
                'https://chromedriver.chromium.org/downloads/version-selection'
                % chrome_command.replace(' ', r'\ '))

        installed_version_parts = ''.join(re.findall(r'[0-9\.]', output))
        installed_version = '.'.join(installed_version_parts.split('.')[:-1])
        response = python_utils.url_open(
            'https://chromedriver.storage.googleapis.com/LATEST_RELEASE_%s' % (
                installed_version))
        chrome_version = response.read()

    python_utils.PRINT('\n\nCHROME VERSION: %s' % chrome_version)
    subprocess.check_call([
        common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH, 'update',
        '--versions.chrome', chrome_version,
    ])

    with python_utils.ExitStack() as exit_stack:
        if common.is_windows_os():
            # NOTE: webdriver-manager (version 13.0.0) uses `os.arch()` to
            # determine the architecture of the operating system, however, this
            # function can only be used to determine the architecture of the
            # machine that compiled `node`. In the case of Windows, we are using
            # the portable version, which was compiled on `ia32` machine so that
            # is the value returned by this `os.arch` function. Unfortunately,
            # webdriver-manager seems to assume that Windows wouldn't run on the
            # ia32 architecture, so its help function used to determine download
            # link returns null for this, which means that the application has
            # no idea about where to download the correct version.
            #
            # https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L16
            # https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/geckodriver.ts#L21
            # https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L167
            # https://github.com/nodejs/node/issues/17036
            regex_pattern = re.escape('this.osArch = os.arch();')
            arch = 'x64' if common.is_x64_architecture() else 'x86'
            replacement_string = 'this.osArch = "%s";' % arch
            exit_stack.enter_context(common.inplace_replace_file_context(
                common.CHROME_PROVIDER_FILE_PATH, regex_pattern,
                replacement_string))
            exit_stack.enter_context(common.inplace_replace_file_context(
                common.GECKO_PROVIDER_FILE_PATH, regex_pattern,
                replacement_string))

        # OK to use shell=True here because we are passing string literals and
        # constants, so there is no risk of a shell-injection attack.
        proc = exit_stack.enter_context(managed_process([
            common.NODE_BIN_PATH, common.WEBDRIVER_MANAGER_BIN_PATH, 'start',
            '--versions.chrome', chrome_version, '--quiet', '--standalone',
        ], human_readable_name='Webdriver manager', shell=True))

        common.wait_for_port_to_be_in_use(4444)

        yield proc


@contextlib.contextmanager
def managed_protractor_server(
        suite_name='full', dev_mode=True, debug_mode=False,
        sharding_instances=1, **kwargs):
    """Returns context manager to start/stop the Protractor server gracefully.

    Args:
        suite_name: str. The suite name whose tests should be run. If the value
            is `full`, all tests will run.
        dev_mode: bool. Whether the test is running on dev_mode.
        debug_mode: bool. Whether to run the protractor tests in debugging mode.
            Read the following instructions to learn how to run e2e tests in
            debugging mode:
            https://www.protractortest.org/#/debugging#disabled-control-flow.
        sharding_instances: int. How many sharding instances to be running.
        **kwargs: dict(str: *). Keyword arguments passed to psutil.Popen.

    Yields:
        psutil.Process. The protractor process.
    """
    if sharding_instances <= 0:
        raise ValueError('Sharding instance should be larger than 0')

    protractor_args = [
        common.NODE_BIN_PATH,
        # This flag ensures tests fail if the `waitFor()` calls time out.
        '--unhandled-rejections=strict',
        common.PROTRACTOR_BIN_PATH, common.PROTRACTOR_CONFIG_FILE_PATH,
        '--params.devMode=%s' % dev_mode,
        '--suite', suite_name,
    ]

    if debug_mode:
        # NOTE: This is a flag for Node.js, not Protractor, so we insert it
        # immediately after NODE_BIN_PATH.
        protractor_args.insert(1, '--inspect-brk')

    if sharding_instances > 1:
        protractor_args.extend([
            '--capabilities.shardTestFiles=True',
            '--capabilities.maxInstances=%d' % sharding_instances,
        ])

    # OK to use shell=True here because we are passing string literals and
    # constants, so there is no risk of a shell-injection attack.
    managed_protractor_proc = managed_process(
        protractor_args, human_readable_name='Protractor Server', shell=True,
        **kwargs)
    with managed_protractor_proc as proc:
        yield proc

# Copyright 2020 The Oppia Authors. All Rights Reserved.
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
"""This script performs lighthouse checks and creates lighthouse reports.
Any callers must pass in a flag, either --accessibility or --performance.
"""

from __future__ import annotations

import argparse
import contextlib
import os
import subprocess
import sys

from typing import Final, List, Optional

# TODO(#15567): This can be removed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from scripts import common  # isort:skip pylint: disable=wrong-import-position

from core.constants import constants  # isort:skip
from scripts import build  # isort:skip
from scripts import servers  # isort:skip

LIGHTHOUSE_MODE_PERFORMANCE: Final = 'performance'
LIGHTHOUSE_MODE_ACCESSIBILITY: Final = 'accessibility'
SERVER_MODE_PROD: Final = 'dev'
SERVER_MODE_DEV: Final = 'prod'
GOOGLE_APP_ENGINE_PORT: Final = 8181
LIGHTHOUSE_CONFIG_FILENAMES: Final = {
    LIGHTHOUSE_MODE_PERFORMANCE: {
        '1': '.lighthouserc-1.js',
        '2': '.lighthouserc-2.js'
    },
    LIGHTHOUSE_MODE_ACCESSIBILITY: {
        '1': '.lighthouserc-accessibility-1.js',
        '2': '.lighthouserc-accessibility-2.js'
    }
}
APP_YAML_FILENAMES: Final = {
    SERVER_MODE_PROD: 'app.yaml',
    SERVER_MODE_DEV: 'app_dev.yaml'
}

_PARSER: Final = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.run_lighthouse_tests
Note that the root folder MUST be named 'oppia'.
""")

_PARSER.add_argument(
    '--mode', help='Sets the mode for the lighthouse tests',
    required=True,
    choices=['accessibility', 'performance'])

_PARSER.add_argument(
    '--shard', help='Sets the shard for the lighthouse tests',
    required=True, choices=['1', '2'])

_PARSER.add_argument(
    '--skip_build', help='Sets whether to skip webpack build',
    action='store_true')

_PARSER.add_argument(
    '--record_screen', help='Sets whether LHCI Puppeteer script is recorded',
    action='store_true')


def run_lighthouse_puppeteer_script(record: bool = False) -> None:
    """Runs puppeteer script to collect dynamic urls.

    Args:
        record: bool. Set to True to record the LHCI puppeteer script
            via puppeteer-screen-recorder and False to not. Note that
            puppeteer-screen-recorder must be separately installed to record.
    """
    puppeteer_path = (
        os.path.join('core', 'tests', 'puppeteer', 'lighthouse_setup.js'))
    bash_command = [common.NODE_BIN_PATH, puppeteer_path]
    if record:
        # Add arguments to lighthouse_setup that enable video recording.
        bash_command.append('-record')
        dir_path = os.path.join(os.getcwd(), '..', 'lhci-puppeteer-video')
        if not os.path.exists(dir_path):
            os.mkdir(dir_path)
        video_path = os.path.join(dir_path, 'video.mp4')
        bash_command.append(video_path)
        print('Starting LHCI Puppeteer script with recording.')
        print('Video Path:' + video_path)

    process = subprocess.Popen(
        bash_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        print(stdout)
        for line in stdout.split(b'\n'):
            # Standard output is in bytes, we need to decode the line to
            # print it.
            export_url(line.decode('utf-8'))
        print('Puppeteer script completed successfully.')
        if record:
            print('Resulting puppeteer video saved at %s' % video_path)
    else:
        print('Return code: %s' % process.returncode)
        print('OUTPUT:')
        # Standard output is in bytes, we need to decode the line to
        # print it.
        print(stdout.decode('utf-8'))
        print('ERROR:')
        # Error output is in bytes, we need to decode the line to
        # print it.
        print(stderr.decode('utf-8'))
        print('Puppeteer script failed. More details can be found above.')
        if record:
            print('Resulting puppeteer video saved at %s' % video_path)
        sys.exit(1)


def run_webpack_compilation() -> None:
    """Runs webpack compilation."""
    max_tries = 5
    webpack_bundles_dir_name = 'webpack_bundles'
    for _ in range(max_tries):
        try:
            with servers.managed_webpack_compiler() as proc:
                proc.wait()
        except subprocess.CalledProcessError as error:
            print(error.output)
            sys.exit(error.returncode)
        if os.path.isdir(webpack_bundles_dir_name):
            break
    if not os.path.isdir(webpack_bundles_dir_name):
        print('Failed to complete webpack compilation, exiting...')
        sys.exit(1)


def export_url(line: str) -> None:
    """Exports the entity ID in the given line to an environment variable, if
    the line is a URL.

    Args:
        line: str. The line to parse and extract the entity ID from. If no
            recognizable URL is present, nothing is exported to the
            environment.
    """
    url_parts = line.split('/')
    print('Parsing and exporting entity ID in line: %s' % line)
    if 'create' in line:
        os.environ['exploration_id'] = url_parts[4]
    elif 'topic_editor' in line:
        os.environ['topic_id'] = url_parts[4]
    elif 'story_editor' in line:
        os.environ['story_id'] = url_parts[4]
    elif 'skill_editor' in line:
        os.environ['skill_id'] = url_parts[4]


def run_lighthouse_checks(lighthouse_mode: str, shard: str) -> None:
    """Runs the Lighthouse checks through the Lighthouse config.

    Args:
        lighthouse_mode: str. Represents whether the lighthouse checks are in
            accessibility mode or performance mode.
        shard: str. Specifies which shard of the tests should be run.
    """
    lhci_path = os.path.join('node_modules', '@lhci', 'cli', 'src', 'cli.js')
    # The max-old-space-size is a quick fix for node running out of heap memory
    # when executing the performance tests: https://stackoverflow.com/a/59572966
    bash_command = [
        common.NODE_BIN_PATH, lhci_path, 'autorun',
        '--config=%s' % LIGHTHOUSE_CONFIG_FILENAMES[lighthouse_mode][shard],
        '--max-old-space-size=4096'
    ]

    process = subprocess.Popen(
        bash_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        print('Lighthouse checks completed successfully.')
    else:
        print('Return code: %s' % process.returncode)
        print('OUTPUT:')
        # Standard output is in bytes, we need to decode the line to
        # print it.
        print(stdout.decode('utf-8'))
        print('ERROR:')
        # Error output is in bytes, we need to decode the line to
        # print it.
        print(stderr.decode('utf-8'))
        print('Lighthouse checks failed. More details can be found above.')
        sys.exit(1)


def main(args: Optional[List[str]] = None) -> None:
    """Runs lighthouse checks and deletes reports."""
    parsed_args = _PARSER.parse_args(args=args)

    # Verify if Chrome is installed.
    common.setup_chrome_bin_env_variable()

    if parsed_args.mode == LIGHTHOUSE_MODE_ACCESSIBILITY:
        lighthouse_mode = LIGHTHOUSE_MODE_ACCESSIBILITY
        server_mode = SERVER_MODE_DEV
    else:
        lighthouse_mode = LIGHTHOUSE_MODE_PERFORMANCE
        server_mode = SERVER_MODE_PROD
    if lighthouse_mode == LIGHTHOUSE_MODE_PERFORMANCE:
        if not parsed_args.skip_build:
            # Builds webpack.
            print('Building files in production mode.')
            build.main(args=['--prod_env'])
        else:
            # Skip webpack build if skip_build flag is passed.
            print('Building files in production mode skipping webpack build.')
            build.main(args=[])
            common.run_ng_compilation()
            run_webpack_compilation()
    else:
        # Accessibility mode skip webpack build.
        build.main(args=[])
        common.run_ng_compilation()
        run_webpack_compilation()

    with contextlib.ExitStack() as stack:
        stack.enter_context(servers.managed_redis_server())
        stack.enter_context(servers.managed_elasticsearch_dev_server())

        if constants.EMULATOR_MODE:
            stack.enter_context(servers.managed_firebase_auth_emulator())
            stack.enter_context(servers.managed_cloud_datastore_emulator())

        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        stack.enter_context(servers.managed_dev_appserver(
            APP_YAML_FILENAMES[server_mode],
            port=GOOGLE_APP_ENGINE_PORT,
            log_level='critical',
            skip_sdk_update_check=True,
            env=env))

        run_lighthouse_puppeteer_script(parsed_args.record_screen)
        run_lighthouse_checks(lighthouse_mode, parsed_args.shard)


if __name__ == '__main__': # pragma: no cover
    main()

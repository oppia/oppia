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
import json
import os
import re
import subprocess
import sys

from core import feconf
from core.constants import constants
from scripts import build
from scripts import common
from scripts import servers
from typing import Final, List, Optional

LIGHTHOUSE_MODE_PERFORMANCE: Final = 'performance'
LIGHTHOUSE_MODE_ACCESSIBILITY: Final = 'accessibility'
SERVER_MODE_PROD: Final = 'dev'
SERVER_MODE_DEV: Final = 'prod'
GOOGLE_APP_ENGINE_PORT: Final = 8181
LIGHTHOUSE_CONFIG_FILENAMES: Final = {
    LIGHTHOUSE_MODE_PERFORMANCE: '.lighthouserc-performance.js',
    LIGHTHOUSE_MODE_ACCESSIBILITY: '.lighthouserc-accessibility.js'
}
APP_YAML_FILENAMES: Final = {
    SERVER_MODE_PROD: 'app.yaml',
    SERVER_MODE_DEV: 'app_dev.yaml'
}
LIGHTHOUSE_PAGES_JSON_FILEPATH = os.path.join(
    'core', 'tests', 'lighthouse-pages.json')

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
    '--pages', help='Sets the pages to run the lighthouse tests on')

_PARSER.add_argument(
    '--skip_build', help='Sets whether to skip webpack build',
    action='store_true')

_PARSER.add_argument(
    '--record_screen', help='Sets whether LHCI Puppeteer script is recorded',
    action='store_true')


def run_lighthouse_puppeteer_script(record: bool = False) -> dict[str, str]:
    """Runs puppeteer script to collect dynamic urls.

    Args:
        record: bool. Set to True to record the LHCI puppeteer script
            via puppeteer-screen-recorder and False to not. Note that
            puppeteer-screen-recorder must be separately installed to record.

    Returns:
        dict(str, str). The entities and their IDs that were collected.
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
        # The entities are collected from the standard output of the
        # puppeteer script. Each entity is a dictionary with the entity
        # name as the key and the entity ID as the value. An entity
        # represents a database object like an exploration, topic, story,
        # or skill. The entity ID is the unique identifier for the entity
        # that will be used to inject into the URLs for the Lighthouse checks.
        entities: dict[str, str] = {}
        for line in stdout.split(b'\n'):
            # Standard output is in bytes, we need to decode the line to
            # print it.
            entity = get_entity(line.decode('utf-8'))
            if entity is not None:
                entity_name, entity_id = entity
                entities[entity_name] = entity_id
        print('Puppeteer script completed successfully.')
        if record:
            print('Resulting puppeteer video saved at %s' % video_path)
        return entities
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


def get_entity(line: str) -> tuple[str, str] | None:
    """Gets the entity in the given line if the line is a URL.

    Args:
        line: str. The line to parse and extract the entity name and ID from. 
            If no recognizable URL is present, nothing is returned.

    Returns:
        tuple(str, str) | None. The entity name and ID if the line is a URL.
    """
    url_parts = line.split('/')
    print('Parsing entity ID in line: %s' % line)
    if 'create' in line:
        return 'exploration_id', url_parts[4]
    elif 'topic_editor' in line:
        return 'topic_id', url_parts[4]
    elif 'story_editor' in line:
        return 'story_id', url_parts[4]
    elif 'skill_editor' in line:
        return 'skill_id', url_parts[4]

    return None


def run_lighthouse_checks(lighthouse_mode: str) -> None:
    """Runs the Lighthouse checks through the Lighthouse config.

    Args:
        lighthouse_mode: str. Represents whether the lighthouse checks are in
            accessibility mode or performance mode.
    """
    lhci_path = os.path.join('node_modules', '@lhci', 'cli', 'src', 'cli.js')
    # The max-old-space-size is a quick fix for node running out of heap memory
    # when executing the performance tests: https://stackoverflow.com/a/59572966
    bash_command = [
        common.NODE_BIN_PATH, lhci_path, 'autorun',
        '--config=%s' % LIGHTHOUSE_CONFIG_FILENAMES[lighthouse_mode],
        '--max-old-space-size=4096'
    ]

    process = subprocess.Popen(
        bash_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()

    print('OUTPUT:')
    # Standard output is in bytes, we need to decode the line to
    # print it.
    print(stdout.decode('utf-8'))
    if process.returncode == 0:
        pages_count = len(os.environ['LIGHTHOUSE_URLS_TO_RUN'].split(','))
        all_pages_count = len(os.environ['ALL_LIGHTHOUSE_URLS'].split(','))
        print(
            '\033[1m%s out of %s lighthouse checks run, see '
            'https://github.com/oppia/oppia/wiki/Partial-CI-Tests-Structure '
            'for more information.\033[0m' % (pages_count, all_pages_count)
        )
        print('Lighthouse checks completed successfully.')
    else:
        print('Return code: %s' % process.returncode)
        print('ERROR:')
        # Error output is in bytes, we need to decode the line to
        # print it.
        print(stderr.decode('utf-8'))
        print('Lighthouse checks failed. More details can be found above.')
        sys.exit(1)


def get_lighthouse_pages_config() -> dict[str, str]:
    """Gets the lighthouse pages and their URLs from the config.

    Returns:
        dict(str, str). The lighthouse page names and their URLs.
    """
    pages: dict[str, str] = {}
    with open(LIGHTHOUSE_PAGES_JSON_FILEPATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
        for page in config:
            pages[page] = config[page]['url']

    return pages


def inject_entities_into_url(url: str, entities: dict[str, str]) -> str:
    """Injects any entity IDs that a URL needs into the URL.

    Args:
        url: str. The URL to inject entity IDs into.
        entities: dict(str, str). The possible entities to inject into the URL.

    Returns:
        str. The URL with the entity ID injected into it.

    Raises:
        ValueError. The entity referenced in the URL is not found in the 
            entities.
    """
    entity_matcher = r'\{\{(.*?)\}\}'
    injected_url = url
    for match in re.findall(entity_matcher, url):
        entity_name = match
        if entity_name not in entities:
            raise ValueError('Entity %s not found in entities.' % entity_name)
        injected_url = url.replace(
            '{{%s}}' % entity_name, entities[entity_name])
    return injected_url


def get_lighthouse_urls_to_run(
    pages: List[str],
    entities: dict[str, str],
    pages_config: dict[str, str]
) -> List[str]:
    """Gets the URLs to run Lighthouse checks on.

    Args:
        pages: list(str). The pages to run the Lighthouse checks on.
        entities: dict(str, str). The available entities to inject 
            into the URLs.
        pages_config: dict(str, str). The configuration for the pages.

    Returns:
        list(str). The URLs to run the Lighthouse checks on.
    """
    lighthouse_urls_to_run: List[str] = []
    for page in pages:
        url = pages_config[page]
        lighthouse_urls_to_run.append(inject_entities_into_url(url, entities))
    return lighthouse_urls_to_run


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
    if not feconf.OPPIA_IS_DOCKERIZED:
        if lighthouse_mode == LIGHTHOUSE_MODE_PERFORMANCE:
            if not parsed_args.skip_build:
                # Builds webpack.
                print('Building files in production mode.')
                build.main(args=['--prod_env'])
            else:
                # Skip webpack build if skip_build flag is passed.
                print(
                    'Building files in production mode skipping webpack build.')
                build.main(args=[])
                common.run_ng_compilation()
                run_webpack_compilation()
        else:
            # Accessibility mode skip webpack build.
            build.main(args=[])
            common.run_ng_compilation()
            run_webpack_compilation()

    with contextlib.ExitStack() as stack:
        if not feconf.OPPIA_IS_DOCKERIZED:
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

        entities = run_lighthouse_puppeteer_script(parsed_args.record_screen)
        pages_config: dict[str, str] = get_lighthouse_pages_config()
        os.environ['ALL_LIGHTHOUSE_URLS'] = ','.join(
            get_lighthouse_urls_to_run(
                list(pages_config.keys()),
                entities,
                pages_config
            )
        )
        if parsed_args.pages:
            os.environ['LIGHTHOUSE_URLS_TO_RUN'] = ','.join(
                get_lighthouse_urls_to_run(
                    [page.strip() for page in parsed_args.pages.split(',')],
                    entities,
                    pages_config
                )
            )

        run_lighthouse_checks(lighthouse_mode)


if __name__ == '__main__': # pragma: no cover
    main()

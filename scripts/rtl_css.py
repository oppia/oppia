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

"""Utility methods for generating rtl css for existing css files.

NOTE: Before running this script, 'rtlcss' should be installed on the local
system. It can be installed by running 'npm install -g rtlcss'.
"""

from __future__ import annotations

import argparse
import os
import subprocess

from core import utils

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.rtl_css
Note that the root folder MUST be named 'oppia'.
""")

_PARSER.add_argument(
    '--mode', help='Sets the mode for the rtl css script',
    required=True, choices=['validate', 'generate'])

css_files_list = [
    'core/templates/pages/learner-dashboard-page/home-tab.component.css',
    'core/templates/pages/learner-dashboard-page/goals-tab.component.css',
    'core/templates/pages/about-page/about-page.component.css',
    'core/templates/pages/splash-page/splash-page.component.css',
    'core/templates/base-components/base-content.component.css',
    'core/templates/pages/library-page/library-page.component.css',
    'core/templates/pages/topic-viewer-page/practice-tab/'
    'practice-tab.component.css',
    'core/templates/pages/classroom-page/classroom-page.component.css',
    'core/templates/pages/topic-viewer-page/subtopics-list/'
    'subtopics-list.component.css',
    'core/templates/pages/story-viewer-page/story-viewer-page.component.css',
    'core/templates/pages/topic-viewer-page/topic-viewer-page.component.css',
    'core/templates/components/summary-tile/story-summary-tile.component.css',
    'core/templates/pages/subtopic-viewer-page/'
    'subtopic-viewer-page.component.css',
    'core/templates/pages/learner-dashboard-page/'
    'community-lessons-tab.component.css',
    'core/templates/pages/story-viewer-page/'
    'story-viewer-page-root.component.css',
    'core/templates/pages/learner-dashboard-page/'
    'learner-dashboard-page.component.css',
    'core/templates/pages/topic-viewer-page/stories-list/'
    'topic-viewer-stories-list.component.css',
    'core/templates/pages/library-page/search-bar/search-bar.component.css',
    'core/templates/components/button-directives/'
    'hint-and-solution-buttons.component.css',
    'core/templates/components/common-layout-directives/common-elements/'
    'attribution-guide.component.css',
    'core/templates/components/common-layout-directives/navigation-bars/'
    'top-navigation-bar.component.css',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'tutor-card.component.css',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'supplemental-card.component.css',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'input-response-pair.component.css',
    'core/templates/pages/exploration-player-page/learner-experience/'
    'conversation-skin.component.css',
    'core/templates/pages/exploration-player-page/layout-directives/'
    'progress-nav.component.css',
    'core/templates/pages/exploration-player-page/layout-directives/'
    'exploration-footer.component.css'
]


def start_subprocess_for_result_with_input(cmd, css):
    """Starts subprocess with stdin and returns (stdout, stderr)."""
    task = subprocess.Popen(
        cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    # A pylint error is thrown here sporadically in Github Actions on unexpected
    # keyword argument 'input'. This could be related to another pylint error
    # W0622 - Redefining built-in 'input', which was encountered when testing
    # this function. Since, 'input' is the correct parameter here and it is
    # expected, this error is ignored.
    out, err = task.communicate(input=css) # pylint: disable=unexpected-keyword-arg
    return out, err


def start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def main(args=None):
    """Main method for generating and validating rtl css files."""
    parsed_args = _PARSER.parse_args(args=args)
    rtlcss_path = os.path.join(
        'node_modules', 'rtlcss', 'bin', 'rtlcss.js')
    if not os.path.exists(rtlcss_path):
        raise Exception(
            'ERROR    Please run start.py first to install rtlcss '
            'and its dependencies.')

    if parsed_args.mode == 'generate':
        for file_path in css_files_list:
            _, err = start_subprocess_for_result([rtlcss_path, file_path])
            if err:
                raise Exception(err)
        print('All RTL CSS files generated!')

    elif parsed_args.mode == 'validate':
        invalid_files = []
        for file_path in css_files_list:
            css_file = utils.open_file(file_path, 'rb', encoding=None)
            out, err = start_subprocess_for_result_with_input(
                [rtlcss_path, '-'], css_file.read())
            out = out.replace(b'\n', b'')

            rtl_file_path = file_path[:-4] + '.rtl' + file_path[-4:]
            rtl_css_content = utils.open_file(
                rtl_file_path, 'rb', encoding=None).read()
            rtl_css_content = rtl_css_content.replace(b'\n', b'')
            if out != rtl_css_content:
                invalid_files.append(file_path)

        if invalid_files:
            raise Exception(
                'Invalid RTL CSS for the following files: %s'
                '. Please run \'python -m scripts.rtl_css --mode generate\' '
                'to autogenerate the corresponding files.' % invalid_files)
        print('All RTL CSS files validated!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when generate_rtl_css.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()

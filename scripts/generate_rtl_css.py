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

import subprocess

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
    'core/templates/pages/library-page/search-bar/search-bar.component.css'
]


def start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def main():
    """Main method for generating rtl css files."""
    for file_path in css_files_list:
        _, err = start_subprocess_for_result(['rtlcss', file_path])
        if err:
            raise ValueError(err)
    print('All RTL CSS files generated!')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when generate_rtl_css.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()

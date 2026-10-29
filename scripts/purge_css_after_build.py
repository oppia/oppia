# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Purge unused CSS from built stylesheets."""

from __future__ import annotations

import glob
import os
import subprocess


def main() -> None:
    """Run purgecss on built CSS files."""
    build_dir = 'build'
    if not os.path.exists(build_dir):
        return

    # Get all HTML/TS/JS files in build to scan
    content_files = []
    for pattern in [
        os.path.join(build_dir, '**', '*.html'),
        os.path.join(build_dir, '**', '*.js'),
    ]:
        content_files.extend(glob.glob(pattern, recursive=True))

    css_files = []
    for pattern in [
        os.path.join(build_dir, 'vendor-styles.*.css'),
        os.path.join(build_dir, 'styles.*.css'),
    ]:
        css_files.extend(glob.glob(pattern))

    if not css_files or not content_files:
        return

    for css_file in css_files:
        try:
            result = subprocess.run(
                [
                    'npx',
                    'purgecss',
                    '--css',
                    css_file,
                    '--content',
                    *content_files,
                    '--output',
                    css_file,
                    '--safelist',
                    'html',
                    'body',
                    'mat-',
                    'cdk-',
                    'ngx-',
                    'oppia-',
                    'navbar',
                    'modal',
                    'dropdown',
                    'tooltip',
                    'popover',
                    'fade',
                    'show',
                    'active',
                    'open',
                    'collaps',
                    'ng-',
                    'fa-',
                    'fas',
                    'far',
                    'fab',
                    'material-icons',
                ],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                print(
                    f'PurgeCSS failed for {css_file}: {result.stderr.decode()}'
                )
        except Exception as e:
            print(f'Error running purgecss on {css_file}: {e}')


if __name__ == '__main__':
    main()

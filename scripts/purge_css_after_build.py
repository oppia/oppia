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
import json
import os
import shutil
import subprocess
import tempfile

# PurgeCSS 4/5 requires a newer Node than the version pinned for CI. Version
# 3 is the last release that works with the Node 16 toolchain used by builds.
PURGE_CSS_PACKAGE = 'purgecss@3.1.3'

# Selectors that are assembled at runtime or supplied by Angular Material.
# PurgeCSS only sees literal class names in the built HTML/JS, so these need
# to be preserved explicitly.
SAFELIST = [
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
]


def main() -> None:
    """Run purgecss on built CSS files."""
    build_dir = 'build'
    if not os.path.exists(build_dir):
        return

    content_patterns = [
        os.path.join(build_dir, '**', '*.html'),
        os.path.join(build_dir, '**', '*.js'),
    ]

    css_files = []
    for pattern in [
        os.path.join(build_dir, 'vendor-styles.*.css'),
        os.path.join(build_dir, 'styles.*.css'),
    ]:
        css_files.extend(glob.glob(pattern))

    if not css_files:
        return

    # The CLI takes the content globs as arguments; writing them to a config
    # file avoids hitting the OS argument-length limit for large builds.
    with tempfile.TemporaryDirectory() as temp_dir:
        config_filepath = os.path.join(temp_dir, 'purgecss.config.json')
        output_dir = os.path.join(temp_dir, 'out')
        os.makedirs(output_dir)
        config = {
            'content': [os.path.abspath(p) for p in content_patterns],
            'css': [os.path.abspath(css_file) for css_file in css_files],
            'output': output_dir,
            'safelist': SAFELIST,
        }
        with open(config_filepath, 'w', encoding='utf-8') as config_file:
            json.dump(config, config_file)

        try:
            result = subprocess.run(
                [
                    'npx',
                    '--yes',
                    PURGE_CSS_PACKAGE,
                    '--config',
                    os.path.relpath(config_filepath, os.getcwd()),
                ],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                print(
                    'PurgeCSS failed: %s'
                    % result.stderr.decode(errors='replace')
                )
                return
        except Exception as e:
            print('Error running purgecss: %s' % e)
            return

        for css_file in css_files:
            purged_file = os.path.join(output_dir, os.path.basename(css_file))
            if os.path.exists(purged_file):
                shutil.copyfile(purged_file, css_file)


if __name__ == '__main__':
    main()

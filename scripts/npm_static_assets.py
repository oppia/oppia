# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Configuration for npm packages that need to be copied as static assets.

This module defines npm packages that are NOT bundled via webpack and instead
are copied verbatim into third_party/static/. These assets are referenced
directly by legacy CSS/HTML and cannot be tree-shaken or bundled.

This replaces the previous dependencies.json configuration for these specific
libraries that have been migrated to package.json but still require explicit
static-asset handling.
"""

from __future__ import annotations

import os

from typing import List, TypedDict


class NpmStaticAssetConfig(TypedDict, total=False):
    """Type definition for npm static asset configuration.

    Attributes:
        name: Human-readable name of the library (for error messages).
        css_paths: List of CSS file paths to bundle into third_party.css.
        fonts_dir: Optional directory containing font files to copy.
    """

    name: str
    css_paths: List[str]
    fonts_dir: str


# Configuration for npm packages that need static-asset handling.
# Add new entries here when migrating libraries from dependencies.json.
NPM_STATIC_ASSET_CONFIGS: List[NpmStaticAssetConfig] = [
    {
        'name': 'Bootstrap',
        'css_paths': [
            os.path.join(
                'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.css'
            ),
        ],
    },
    {
        'name': 'FontAwesome',
        'css_paths': [
            os.path.join(
                'node_modules',
                '@fortawesome',
                'fontawesome-free',
                'css',
                'fontawesome.min.css',
            ),
            os.path.join(
                'node_modules',
                '@fortawesome',
                'fontawesome-free',
                'css',
                'brands.min.css',
            ),
            os.path.join(
                'node_modules',
                '@fortawesome',
                'fontawesome-free',
                'css',
                'regular.min.css',
            ),
            os.path.join(
                'node_modules',
                '@fortawesome',
                'fontawesome-free',
                'css',
                'solid.min.css',
            ),
        ],
        'fonts_dir': os.path.join(
            'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts'
        ),
    },
]

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

"""Unit tests for npm_static_assets.py."""

from __future__ import annotations

import os

from core.tests import test_utils

from . import npm_static_assets


class NpmStaticAssetsTests(test_utils.GenericTestBase):
    """Tests for NPM static asset configuration."""

    def test_npm_static_asset_configs_structure(self) -> None:
        """Test that NPM_STATIC_ASSET_CONFIGS has the correct structure."""
        configs = npm_static_assets.NPM_STATIC_ASSET_CONFIGS

        self.assertIsInstance(configs, list)
        self.assertGreater(len(configs), 0)

        for config in configs:
            self.assertIn('name', config)
            self.assertIsInstance(config['name'], str)
            self.assertIn('css_paths', config)
            self.assertIsInstance(config['css_paths'], list)

            for css_path in config['css_paths']:
                self.assertIsInstance(css_path, str)
                self.assertTrue(
                    os.path.isabs(css_path)
                    or css_path.startswith('node_modules')
                )

            if 'fonts_dir' in config:
                self.assertIsInstance(config['fonts_dir'], str)

    def test_bootstrap_configuration(self) -> None:
        """Test that Bootstrap is configured correctly."""
        configs = npm_static_assets.NPM_STATIC_ASSET_CONFIGS
        bootstrap_config = next(
            (c for c in configs if c['name'] == 'Bootstrap'), None
        )

        self.assertIsNotNone(bootstrap_config)
        self.assertIn('css_paths', bootstrap_config)
        self.assertGreater(len(bootstrap_config['css_paths']), 0)

        # Bootstrap CSS path should contain 'bootstrap'
        css_path = bootstrap_config['css_paths'][0]
        self.assertIn('bootstrap', css_path.lower())

    def test_fontawesome_configuration(self) -> None:
        """Test that FontAwesome is configured correctly."""
        configs = npm_static_assets.NPM_STATIC_ASSET_CONFIGS
        fa_config = next(
            (c for c in configs if c['name'] == 'FontAwesome'), None
        )

        self.assertIsNotNone(fa_config)
        self.assertIn('css_paths', fa_config)
        self.assertGreater(len(fa_config['css_paths']), 0)
        self.assertIn('fonts_dir', fa_config)

        # FontAwesome should have multiple CSS files
        self.assertGreaterEqual(len(fa_config['css_paths']), 4)

        # Verify expected CSS files are present
        css_files = [os.path.basename(p) for p in fa_config['css_paths']]
        expected_files = [
            'fontawesome.min.css',
            'brands.min.css',
            'regular.min.css',
            'solid.min.css',
        ]
        for expected_file in expected_files:
            self.assertIn(expected_file, css_files)

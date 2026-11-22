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

"""Helpers for painting Angular page markup before the Angular bundle loads."""

from __future__ import annotations

import functools
import os
import re

from typing import Dict

# These templates are the source of truth for the components rendered by
# LiteAppModule. Reading them here keeps the prerendered markup in sync with
# the Angular components instead of creating a second copy of the content.
_TEMPLATE_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'templates', 'pages'
)

_PRERENDER_CONFIGS: Dict[str, Dict[str, str]] = {
    '/terms': {
        'root_component': 'oppia-terms-page-root',
        'root_template': 'terms-page/terms-page-root.component.html',
        'page_template': 'terms-page/terms-page.component.html',
    },
    '/maintenance': {
        'root_component': 'oppia-maintenance-page-root',
        'root_template': 'maintenance-page/maintenance-page-root.component.html',
        'page_template': 'maintenance-page/maintenance-page.component.html',
    },
}

# Angular-only attributes do not describe rendered content. They are removed
# so the prerendered markup is plain HTML that the browser can paint.
_ANGULAR_ATTRIBUTE_PATTERNS = (
    re.compile(r'\s+#[A-Za-z0-9_-]+'),
    re.compile(r'\s+\(click\)="[^"]*"'),
)


@functools.lru_cache(maxsize=len(_PRERENDER_CONFIGS))
def _get_prerendered_markup(path: str) -> str:
    """Returns sanitized Angular template markup for one route."""
    config = _PRERENDER_CONFIGS[path]
    fragments = []
    for template_key in ('root_template', 'page_template'):
        template_path = os.path.join(_TEMPLATE_DIR, config[template_key])
        with open(template_path, 'r', encoding='utf-8') as template_file:
            fragments.append(template_file.read().strip())

    markup = ''.join(fragments)
    for pattern in _ANGULAR_ATTRIBUTE_PATTERNS:
        markup = pattern.sub('', markup)

    root_component = config['root_component']
    return f'<{root_component}>{markup}</{root_component}>'


def get_prerendered_markup(pathname: str) -> str:
    """Returns prerendered markup for the target paths, otherwise an empty string.

    Args:
        pathname: str. The path portion of the current request URL.

    Returns:
        str. Plain HTML to paint before Angular boots, or an empty string.
    """
    normalized_path = pathname.rstrip('/') or '/'
    if normalized_path not in _PRERENDER_CONFIGS:
        return ''
    return _get_prerendered_markup(normalized_path)

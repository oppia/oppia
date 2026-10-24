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

"""Configurable, path-aware checks for frontend filenames."""

from __future__ import annotations

import dataclasses
import json
import os
import re

from typing import Final, Mapping, Optional, Pattern, Sequence, Tuple, cast

from .. import concurrent_task_utils


@dataclasses.dataclass(frozen=True)
class FilenamePattern:
    """An allowed basename, optionally restricted to a full relative path.

    Both expressions use fullmatch(), so a special-case pattern cannot
    accidentally accept a matching substring elsewhere in a filename or path.
    """

    name: str
    filename_regex: Pattern[str]
    path_regex: Optional[Pattern[str]] = None

    def matches(self, filepath: str) -> bool:
        """Return whether a normalized relative filepath matches the pattern.

        Args:
            filepath: str. A repository-relative path using forward slashes.

        Returns:
            bool. Whether both the basename and any path restriction match.
        """
        return bool(
            self.filename_regex.fullmatch(filepath.rsplit('/', 1)[-1])
        ) and (
            self.path_regex is None or bool(self.path_regex.fullmatch(filepath))
        )


@dataclasses.dataclass(frozen=True)
class FilenameRule:
    """A naming policy for selected directories and file extensions.

    Directory prefixes end in '/' to avoid matching similarly named folders,
    and extensions use lowercase (for example, '.ts').
    Patterns within a rule are alternatives. If multiple rules apply to a
    filepath, that filepath must satisfy every applicable rule.
    """

    name: str
    directory_prefixes: Tuple[str, ...]
    extensions: Tuple[str, ...]
    patterns: Tuple[FilenamePattern, ...]
    description: str


KEBAB_CASE_REGEX: Final = r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*'
FRONTEND_DIRECTORIES: Final = ('core/templates/', 'extensions/')
TYPESCRIPT_ROLES: Final = (
    'component',
    'constants',
    'controller',
    'directive',
    'factory',
    'filter',
    'guard',
    'import',
    'initializer',
    'model',
    'module',
    'pipe',
    'service',
)

# These are infrastructure entry points, not examples of a general naming
# convention. Keep their permission scoped to their exact existing paths.
INFRASTRUCTURE_TYPESCRIPT_PATHS: Final = (
    'core/templates/Polyfills.ts',
    'core/templates/app-events/app-events.ts',
    'core/templates/combined-tests.spec.ts',
    'core/templates/mathjaxConfig.ts',
    'core/templates/oppia-platform-stats.ts',
    'core/templates/pages/common-imports.ts',
    'core/templates/pages/oppia-root/app-error-handler.ts',
    'core/templates/pages/oppia-root/index.ts',
    'extensions/interactions/answer-defs.ts',
    'extensions/interactions/customization-args-defs.ts',
    'extensions/interactions/interactionsQuestionsRequires.ts',
    'extensions/interactions/interactionsRequires.ts',
    'extensions/interactions/rule-input-defs.ts',
    'extensions/interactions/tag-to-interaction-mapping.ts',
    'extensions/rich_text_components/richTextComponentsRequires.ts',
    'extensions/value_generators/valueGeneratorsRequires.ts',
    'extensions/visualizations/visualizationsRequires.ts',
)

TYPESCRIPT_PATTERNS: Final = tuple(
    FilenamePattern(
        name='%s files' % role,
        filename_regex=re.compile(
            r'%s\.%s(?:\.spec)?\.ts' % (KEBAB_CASE_REGEX, re.escape(role))
        ),
    )
    for role in TYPESCRIPT_ROLES
) + (
    FilenamePattern(
        name='Routing modules',
        filename_regex=re.compile(
            r'%s\.routing\.module(?:\.spec)?\.ts' % KEBAB_CASE_REGEX
        ),
    ),
    FilenamePattern(
        name='Integration specs',
        filename_regex=re.compile(
            r'%s\.integration\.spec\.ts' % KEBAB_CASE_REGEX
        ),
    ),
    FilenamePattern(
        name='Type declarations',
        filename_regex=re.compile(r'%s\.d\.ts' % KEBAB_CASE_REGEX),
    ),
    FilenamePattern(
        name='Interaction entry points',
        filename_regex=re.compile(r'[A-Z][a-zA-Z0-9]*\.ts'),
        path_regex=re.compile(
            r'extensions/interactions/(?P<interaction>[A-Z][a-zA-Z0-9]*)/'
            r'(?P=interaction)\.ts'
        ),
    ),
    FilenamePattern(
        name='Utility files',
        filename_regex=re.compile(r'%s(?:\.spec)?\.ts' % KEBAB_CASE_REGEX),
        path_regex=re.compile(r'core/templates/utility/[^/]+\.ts'),
    ),
    FilenamePattern(
        name='Schema validators and test helpers',
        filename_regex=re.compile(
            r'(?:schema-validators|unit-test-utils)(?:\.spec)?\.ts'
        ),
        path_regex=re.compile(
            r'core/templates/(?:components/forms/validators/schema-validators'
            r'|tests/unit-test-utils)(?:\.spec)?\.ts'
        ),
    ),
    FilenamePattern(
        name='Translation infrastructure',
        filename_regex=re.compile(
            r'(?:missing-translation-custom-handler|translate-custom-parser)'
            r'(?:\.spec)?\.ts'
        ),
        path_regex=re.compile(r'core/templates/i18n/[^/]+\.ts'),
    ),
    FilenamePattern(
        name='CodeMirror declaration',
        filename_regex=re.compile(r'diff_match_patch\.d\.ts'),
        path_regex=re.compile(
            r'core/templates/components/code-mirror/diff_match_patch\.d\.ts'
        ),
    ),
    FilenamePattern(
        name='Infrastructure entry points',
        filename_regex=re.compile(r'[^/]+\.ts'),
        path_regex=re.compile(
            '|'.join(
                re.escape(path) for path in INFRASTRUCTURE_TYPESCRIPT_PATHS
            )
        ),
    ),
)

FILENAME_RULES: Final = (
    FilenameRule(
        name='TypeScript filenames',
        directory_prefixes=FRONTEND_DIRECTORIES,
        extensions=('.ts',),
        patterns=TYPESCRIPT_PATTERNS,
        description=(
            'Use a kebab-case feature name and a configured role suffix, such as '
            'lesson-card.component.ts or lesson-card.component.spec.ts, '
            'or a documented path-specific pattern.'
        ),
    ),
    FilenameRule(
        name='HTML filenames',
        directory_prefixes=FRONTEND_DIRECTORIES,
        extensions=('.html',),
        patterns=(
            FilenamePattern(
                name='Frontend templates',
                filename_regex=re.compile(
                    r'%s\.(?:component|directive|template|mainpage)\.html'
                    % KEBAB_CASE_REGEX
                ),
            ),
            FilenamePattern(
                name='Shared library templates',
                filename_regex=re.compile(
                    r'(?:footer_js|header_css|header_js)_libs\.html'
                ),
                path_regex=re.compile(r'core/templates/pages/[^/]+\.html'),
            ),
            FilenamePattern(
                name='Form test fixture',
                filename_regex=re.compile(
                    r'form_entry_point_modal_directive\.html'
                ),
                path_regex=re.compile(
                    r'core/templates/tests/form_entry_point_modal_directive\.html'
                ),
            ),
            FilenamePattern(
                name='Value generator templates',
                filename_regex=re.compile(
                    r'[A-Z][a-zA-Z0-9]*\.component\.html'
                ),
                path_regex=re.compile(
                    r'extensions/value_generators/templates/[^/]+\.component\.html'
                ),
            ),
        ),
        description=(
            'Use a kebab-case feature name followed by .component.html, '
            '.directive.html, .template.html or .mainpage.html, '
            'or a documented path-specific pattern.'
        ),
    ),
    FilenameRule(
        name='CSS filenames',
        directory_prefixes=FRONTEND_DIRECTORIES,
        extensions=('.css',),
        patterns=(
            FilenamePattern(
                name='Component and directive styles',
                filename_regex=re.compile(
                    r'%s\.(?:component|directive)\.css' % KEBAB_CASE_REGEX
                ),
            ),
            FilenamePattern(
                name='Global styles',
                filename_regex=re.compile(r'%s\.css' % KEBAB_CASE_REGEX),
                path_regex=re.compile(r'core/templates/css/[^/]+\.css'),
            ),
            FilenamePattern(
                name='Interaction static styles',
                filename_regex=re.compile(
                    r'[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.css'
                ),
                path_regex=re.compile(
                    r'extensions/interactions/[^/]+/static/[^/]+\.css'
                ),
            ),
        ),
        description=(
            'Use a kebab-case feature name followed by .component.css or '
            '.directive.css, or a documented path-specific pattern.'
        ),
    ),
)

LEGACY_FILENAMES_PATH: Final = os.path.join(
    os.path.dirname(__file__), 'filename_linter_allowlist.json'
)


def check_filenames(
    filepaths: Sequence[str],
    rules: Sequence[FilenameRule] = FILENAME_RULES,
    legacy_filenames: Optional[Mapping[str, str]] = None,
    repository_root: Optional[str] = None,
) -> concurrent_task_utils.TaskResult:
    """Validate filenames using the supplied rules and exact legacy paths.

    This function only inspects paths; it does not read application source,
    discover files, infer their contents, or change filenames. Unrecognized
    names in a configured scope fail instead of being silently skipped.

    Args:
        filepaths: sequence(str). Relative or absolute paths to check.
        rules: sequence(FilenameRule). Configured naming policies.
        legacy_filenames: Mapping|None. Exact relative legacy paths
            and their reasons. None loads the checked-in legacy list.
        repository_root: str|None. Base for relative paths. Defaults to the
            current working directory, as required by the lint runner.

    Returns:
        TaskResult. The filename validation result with deterministic errors.
    """
    root = os.path.abspath(repository_root or os.getcwd())
    if legacy_filenames is None:
        with open(LEGACY_FILENAMES_PATH, 'r', encoding='utf-8') as legacy_file:
            # Here we use cast because JSON loading does not retain the mapping
            # type; configuration tests verify the checked-in paths and reasons.
            legacy_filenames = cast(Mapping[str, str], json.load(legacy_file))

    # Normalize without lowercasing: casing mistakes must remain detectable.
    normalized_paths = sorted(
        {
            os.path.relpath(
                os.path.join(root, filepath.replace('\\', '/')), root
            ).replace('\\', '/')
            for filepath in filepaths
        }
    )
    errors = []
    for filepath in normalized_paths:
        for rule in rules:
            # Select extensions case-insensitively so '.TS' cannot bypass a
            # '.ts' rule. Patterns still see the unchanged filename casing.
            if not filepath.startswith(
                rule.directory_prefixes
            ) or not filepath.lower().endswith(rule.extensions):
                continue
            if any(pattern.matches(filepath) for pattern in rule.patterns):
                continue
            if filepath in legacy_filenames:
                continue
            errors.append(
                '%s --> %s: %s See scripts/linters/README.md.'
                % (filepath, rule.name, rule.description)
            )

    return concurrent_task_utils.TaskResult(
        'Filename conventions', bool(errors), errors, errors
    )

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

"""Tests for the configurable filename linter and its checked-in policies."""

from __future__ import annotations

import dataclasses
import json
import os
import re
import subprocess

from core.tests import test_utils

from typing import List, Tuple

from . import filename_linter


class FilenameLinterTests(test_utils.LinterTestBase):
    """Tests for matching, scope boundaries, and configurable policies."""

    def test_standard_typescript_roles_and_specs(self) -> None:
        paths = [
            'core/templates/example/lesson-card.%s%s.ts' % (role, spec)
            for role in filename_linter.TYPESCRIPT_ROLES
            for spec in ('', '.spec')
        ]
        paths += [
            'extensions/interactions/Example/example.component.ts',
            'core/templates/pages/oppia-root/routing/app.routing.module.ts',
            'core/templates/pages/oppia-root/routing/app.routing.module.spec.ts',
            'core/templates/tests/schema-editors.integration.spec.ts',
            'core/templates/utility/helper-definitions.d.ts',
            'core/templates/services/api-v2.service.ts',
            'core/templates/pages/shared/is-logged-in.guard.ts',
            'core/templates/pages/admin-page/admin-auth.guard.ts',
        ]
        result = filename_linter.check_filenames(paths, legacy_filenames={})
        self.assertFalse(result.failed)
        self.assertEqual(result.messages, [])
        self.assertEqual(
            result.get_report(), ['SUCCESS  Filename conventions check passed']
        )

    def test_invalid_typescript_names(self) -> None:
        names = [
            'LessonCard.component.ts',
            'lesson_card.component.ts',
            'lesson card.component.ts',
            'lesson--card.component.ts',
            '-lesson.component.ts',
            'lesson-.component.ts',
            '1lesson.component.ts',
            'lesson.component.ts.backup.ts',
            'lesson.services.ts',
            'lesson-service.ts',
            'lesson-module.ts',
            'lesson.comonent.spec.ts',
            'lesson.comopnent.spec.ts',
            'lesson.component-auth.guard.ts',
            'lesson.spec.component.ts',
            'lesson.component.spec.spec.ts',
            'lesson.component.extra.ts',
            'lesson.unknown.ts',
            'lesson.ts',
            '.component.ts',
            'lesson.component.TS',
            'lesson.component.ts\n',
        ]
        paths = ['core/templates/example/%s' % name for name in names]
        # The newline example is not a .ts extension and is checked below
        # directly against the pattern, rather than pretending it is in scope.
        result = filename_linter.check_filenames(
            paths[:-1], legacy_filenames={}
        )
        self.assertTrue(result.failed)
        self.assertEqual(len(result.messages), len(names) - 1)
        for path in paths[:-1]:
            with self.subTest(path=path):
                self.assertTrue(
                    any(
                        message.startswith('%s --> ' % path)
                        for message in result.messages
                    )
                )
        self.assertFalse(
            filename_linter.TYPESCRIPT_PATTERNS[0].matches(paths[-1])
        )

    def test_html_and_css_names(self) -> None:
        valid_paths = [
            'core/templates/example/lesson.component.html',
            'core/templates/example/lesson.directive.html',
            'core/templates/example/lesson.template.html',
            'core/templates/example/lesson.mainpage.html',
            'core/templates/example/lesson.component.css',
            'extensions/visualizations/chart.directive.css',
        ]
        self.assertFalse(
            filename_linter.check_filenames(
                valid_paths, legacy_filenames={}
            ).failed
        )
        invalid_paths = [
            'core/templates/example/Lesson.component.html',
            'core/templates/example/lesson_component.html',
            'core/templates/example/lesson.html',
            'core/templates/example/Lesson.component.css',
            'core/templates/example/lesson-component.css',
            'core/templates/example/lesson.css',
            'core/templates/example/lesson.component.html.extra.html',
            'core/templates/example/lesson.component.HTML',
            'core/templates/example/lesson.component.CSS',
        ]
        result = filename_linter.check_filenames(
            invalid_paths, legacy_filenames={}
        )
        self.assertTrue(result.failed)
        self.assertEqual(len(result.messages), len(invalid_paths))

    def test_scoped_special_patterns(self) -> None:
        paths = list(filename_linter.INFRASTRUCTURE_TYPESCRIPT_PATHS) + [
            'extensions/interactions/Continue/Continue.ts',
            'extensions/interactions/NewInteraction/NewInteraction.ts',
            'core/templates/utility/forms.ts',
            'core/templates/utility/string-utility.spec.ts',
            'core/templates/components/forms/validators/schema-validators.ts',
            'core/templates/components/forms/validators/schema-validators.spec.ts',
            'core/templates/tests/unit-test-utils.ts',
            'core/templates/tests/unit-test-utils.spec.ts',
            'core/templates/i18n/missing-translation-custom-handler.ts',
            'core/templates/i18n/missing-translation-custom-handler.spec.ts',
            'core/templates/i18n/translate-custom-parser.ts',
            'core/templates/i18n/translate-custom-parser.spec.ts',
            'core/templates/components/code-mirror/diff_match_patch.d.ts',
            'core/templates/pages/footer_js_libs.html',
            'core/templates/pages/header_js_libs.html',
            'core/templates/pages/header_css_libs.html',
            'core/templates/tests/form_entry_point_modal_directive.html',
            'extensions/value_generators/templates/Copier.component.html',
            'core/templates/css/oppia.css',
            'core/templates/css/shepherd-overrides.css',
            'extensions/interactions/CodeRepl/static/code_repl.css',
        ]
        result = filename_linter.check_filenames(paths, legacy_filenames={})
        self.assertFalse(result.failed)

    def test_special_patterns_do_not_leak_into_other_paths(self) -> None:
        paths = [
            'core/templates/services/Polyfills.ts',
            'core/templates/services/Continue.ts',
            'extensions/interactions/Continue/Other.ts',
            'extensions/interactions/Continue/nested/Continue.ts',
            'extensions/interactions/continue/continue.ts',
            'core/templates/utility/nested/helper.ts',
            'core/templates/services/forms.ts',
            'core/templates/tests/schema-validators.ts',
            'core/templates/components/forms/validators/unit-test-utils.ts',
            'core/templates/services/translate-custom-parser.ts',
            'core/templates/utility/diff_match_patch.d.ts',
            'core/templates/example/header_css_libs.html',
            'core/templates/example/form_entry_point_modal_directive.html',
            'core/templates/example/Copier.component.html',
            'core/templates/components/oppia.css',
            'core/templates/css/nested/global.css',
            'extensions/interactions/CodeRepl/nested/static/code_repl.css',
            'extensions/interactions/CodeRepl/static/code-Repl.css',
        ]
        result = filename_linter.check_filenames(paths, legacy_filenames={})
        self.assertTrue(result.failed)
        self.assertEqual(len(result.messages), len(paths))

    def test_asset_filenames(self) -> None:
        valid_paths = [
            'assets/example.constants.ts',
            'assets/example.constants.spec.ts',
            'assets/templates/example.template.html',
            'assets/styles/example.component.css',
        ]
        self.assertFalse(
            filename_linter.check_filenames(
                valid_paths, legacy_filenames={}
            ).failed
        )
        invalid_paths = [
            'assets/Bad_Name.constants.ts',
            'assets/Bad_Name.constants.spec.ts',
            'assets/templates/Bad_Name.template.html',
            'assets/styles/Bad_Name.component.css',
            'assets/example.constants.TS',
            'assets/templates/example.template.HTML',
            'assets/styles/example.component.CSS',
        ]
        result = filename_linter.check_filenames(invalid_paths)
        self.assertTrue(result.failed)
        self.assertEqual(len(result.messages), len(invalid_paths))

    def test_legacy_asset_exception_is_exact(self) -> None:
        legacy_path = 'assets/rich_text_components_definitions.ts'
        self.assertTrue(
            filename_linter.check_filenames(
                [legacy_path], legacy_filenames={}
            ).failed
        )
        self.assertFalse(filename_linter.check_filenames([legacy_path]).failed)
        result = filename_linter.check_filenames(
            [
                'assets/new_rich_text_components_definitions.ts',
                'assets/nested/rich_text_components_definitions.ts',
            ]
        )
        self.assertTrue(result.failed)
        self.assertEqual(len(result.messages), 2)

    def test_out_of_scope_paths_and_extensions(self) -> None:
        paths = [
            'assets-other/Bad_Name.component.ts',
            'assets/Bad_Name.json',
            'assets/Bad_Name.png',
            'src/main.ts',
            'scripts/Bad_Name.py',
            'core/tests/Bad_Name.ts',
            'core/templates-other/Bad_Name.component.ts',
            'extensions-other/Bad_Name.component.ts',
            'core/templates/Bad_Name.js',
            'core/templates/Bad_Name.png',
            '../core/templates/Bad_Name.ts',
        ]
        result = filename_linter.check_filenames(paths, legacy_filenames={})
        self.assertFalse(result.failed)

    def test_paths_are_normalized_deduplicated_and_sorted(self) -> None:
        first_path = 'core/templates/example/BadA.service.ts'
        last_path = 'core/templates/example/BadZ.service.ts'
        result = filename_linter.check_filenames(
            [
                last_path,
                first_path,
                './%s' % first_path,
                os.path.join(os.getcwd(), first_path),
                first_path.replace('/', '\\'),
                'core/templates/example/../example/BadA.service.ts',
            ],
            legacy_filenames={},
        )
        self.assertEqual(len(result.messages), 2)
        self.assertTrue(result.messages[0].startswith(first_path))
        self.assertTrue(result.messages[1].startswith(last_path))

    def test_explicit_repository_root(self) -> None:
        result = filename_linter.check_filenames(
            ['/project/core/templates/BadName.service.ts'],
            legacy_filenames={},
            repository_root='/project',
        )
        self.assertEqual(len(result.messages), 1)
        self.assertTrue(
            result.messages[0].startswith('core/templates/BadName.service.ts')
        )

    def test_empty_files_and_empty_rules(self) -> None:
        self.assertFalse(
            filename_linter.check_filenames([], legacy_filenames={}).failed
        )
        self.assertFalse(
            filename_linter.check_filenames(
                ['core/templates/BadName.ts'], rules=(), legacy_filenames={}
            ).failed
        )

    def test_only_exact_legacy_paths_are_accepted(self) -> None:
        old_path = 'core/templates/services/OldName.service.ts'
        new_path = 'core/templates/services/NewName.service.ts'
        legacy_paths = {old_path: 'Existing violation tracked in #27577.'}
        result = filename_linter.check_filenames(
            [old_path, new_path], legacy_filenames=legacy_paths
        )
        self.assertEqual(len(result.messages), 1)
        self.assertTrue(result.messages[0].startswith(new_path))
        self.assertTrue(
            filename_linter.check_filenames(
                [new_path],
                legacy_filenames={'core/templates/services/*': 'Not a glob.'},
            ).failed
        )

    def test_new_pattern_can_be_registered_without_engine_changes(self) -> None:
        new_path = 'core/templates/services/example.resolver.ts'
        self.assertTrue(
            filename_linter.check_filenames(
                [new_path], legacy_filenames={}
            ).failed
        )
        rule = filename_linter.FILENAME_RULES[0]
        expanded_rule = dataclasses.replace(
            rule,
            patterns=rule.patterns
            + (
                filename_linter.FilenamePattern(
                    name='Resolver files',
                    filename_regex=re.compile(
                        r'%s\.resolver(?:\.spec)?\.ts'
                        % filename_linter.KEBAB_CASE_REGEX
                    ),
                ),
            ),
        )
        self.assertFalse(
            filename_linter.check_filenames(
                [new_path, '%s.spec.ts' % new_path[:-3]],
                rules=(expanded_rule,),
                legacy_filenames={},
            ).failed
        )
        self.assertTrue(
            filename_linter.check_filenames(
                ['core/templates/services/Example.resolver.ts'],
                rules=(expanded_rule,),
                legacy_filenames={},
            ).failed
        )

    def test_new_scope_and_extension_can_be_registered(self) -> None:
        rule = filename_linter.FilenameRule(
            name='Example config names',
            directory_prefixes=('configuration/',),
            extensions=('.json',),
            patterns=(
                filename_linter.FilenamePattern(
                    name='Kebab-case config',
                    filename_regex=re.compile(
                        r'%s\.json' % filename_linter.KEBAB_CASE_REGEX
                    ),
                ),
            ),
            description='Use a kebab-case .json filename.',
        )
        result = filename_linter.check_filenames(
            [
                'configuration/valid-name.json',
                'configuration/BadName.json',
                'configuration-other/BadName.json',
            ],
            rules=(rule,),
            legacy_filenames={},
        )
        self.assertEqual(len(result.messages), 1)
        self.assertIn('configuration/BadName.json', result.messages[0])
        self.assertIn(rule.description, result.messages[0])

    def test_overlapping_rules_are_cumulative(self) -> None:
        general_rule = filename_linter.FILENAME_RULES[0]
        narrow_rule = dataclasses.replace(
            general_rule,
            name='Service-only directory',
            directory_prefixes=('core/templates/services/',),
            patterns=(general_rule.patterns[-1],),
            description='Only infrastructure entry points are accepted here.',
        )
        result = filename_linter.check_filenames(
            ['core/templates/services/valid-name.service.ts'],
            rules=(general_rule, narrow_rule),
            legacy_filenames={},
        )
        self.assertEqual(len(result.messages), 1)
        self.assertIn(narrow_rule.name, result.messages[0])

    def test_errors_are_actionable(self) -> None:
        path = 'core/templates/services/BadName.service.ts'
        result = filename_linter.check_filenames([path], legacy_filenames={})
        self.assertTrue(result.failed)
        self.assertEqual(result.trimmed_messages, result.messages)
        self.assertEqual(
            result.messages,
            [
                '%s --> TypeScript filenames: %s '
                'See https://github.com/oppia/oppia/wiki/'
                'The-File-Naming-Convention-and-Directory-Structure.'
                % (path, filename_linter.FILENAME_RULES[0].description)
            ],
        )


class FilenameConfigurationTests(test_utils.LinterTestBase):
    """Tests keeping the checked-in policy and migration list consistent."""

    def test_rule_configuration(self) -> None:
        names = [rule.name for rule in filename_linter.FILENAME_RULES]
        self.assertEqual(len(names), len(set(names)))
        for rule in filename_linter.FILENAME_RULES:
            with self.subTest(rule=rule.name):
                self.assertTrue(rule.description)
                self.assertTrue(rule.directory_prefixes)
                self.assertTrue(rule.extensions)
                self.assertTrue(rule.patterns)
                self.assertTrue(
                    all(
                        prefix.endswith('/')
                        for prefix in rule.directory_prefixes
                    )
                )
                self.assertTrue(
                    all(
                        extension.startswith('.')
                        and extension == extension.lower()
                        for extension in rule.extensions
                    )
                )
                pattern_names = [pattern.name for pattern in rule.patterns]
                self.assertEqual(len(pattern_names), len(set(pattern_names)))

    def test_legacy_list_integrity(self) -> None:
        with open(
            filename_linter.LEGACY_FILENAMES_PATH, encoding='utf-8'
        ) as legacy_file:
            entries: List[Tuple[str, str]] = json.load(
                legacy_file, object_pairs_hook=list
            )
        paths = [path for path, _ in entries]
        self.assertEqual(paths, sorted(set(paths)))
        for path, reason in entries:
            with self.subTest(path=path):
                self.assertTrue(
                    os.path.isfile(path), 'Remove deleted legacy paths.'
                )
                self.assertNotIn('\\', path)
                self.assertEqual(
                    os.path.normpath(path).replace('\\', '/'), path
                )
                self.assertFalse(os.path.isabs(path))
                self.assertFalse(any(char in path for char in '*?[]'))
                self.assertTrue(reason.strip())
                self.assertIn('#27577', reason)
                self.assertTrue(
                    filename_linter.check_filenames(
                        [path], legacy_filenames={}
                    ).failed,
                    'Remove entries that are now valid or outside the scope.',
                )
                self.assertFalse(filename_linter.check_filenames([path]).failed)

    def test_all_tracked_filenames_pass(self) -> None:
        # Git provides a complete inventory without walking dependency folders
        # or silently including local generated files. NUL separators preserve
        # paths containing whitespace.
        paths = (
            subprocess.check_output(['git', 'ls-files', '-z'])
            .decode('utf-8')
            .split('\0')
        )
        result = filename_linter.check_filenames(
            [path for path in paths if path]
        )
        self.assertFalse(result.failed, '\n'.join(result.messages))

    def test_infrastructure_paths_still_exist(self) -> None:
        for path in filename_linter.INFRASTRUCTURE_TYPESCRIPT_PATHS:
            with self.subTest(path=path):
                self.assertTrue(
                    os.path.isfile(path),
                    'Remove stale infrastructure patterns.',
                )

# coding: utf-8
#
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

"""Unit tests for scripts/linters/python_linter.py."""

from __future__ import annotations

import multiprocessing
import os
import pathlib
import tempfile

from core.tests import test_utils

from . import python_linter, run_lint_checks

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
VALID_PY_JOBS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid_job_imports.py')
INVALID_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_import_order.py'
)
INVALID_PYTHON3_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_python_three.py'
)
INVALID_DOCSTRING_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_docstring.py'
)

INVALID_PYCODESTYLE_CONTENT = """from __future__ import annotations

class FakeClass:
    \"\"\"Fake docstring for valid syntax purposes.\"\"\"

    def __init__(self, fake_arg):
        self.fake_arg = fake_arg

    def fake_method(self, name):
        \"\"\"This doesn't do anything.

        Args:
            name: str. Means nothing.

        Yields:
            tuple(str, str).
        \"\"\"
        yield (name, name)"""

NAME_SPACE = multiprocessing.Manager().Namespace()
NAME_SPACE.files = run_lint_checks.FileCache()
FILE_CACHE = NAME_SPACE.files


class PythonLintChecksManagerTests(test_utils.LinterTestBase):
    """Test for python linter."""

    def test_unsorted_import_order(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_IMPORT_FILEPATH]
        ).check_import_order()
        self.assert_same_list_elements(
            ['FAILED  Import order check failed'], lint_task_report.get_report()
        )
        self.assertEqual('Import order', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_sorted_import_order(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]
        ).check_import_order()
        self.assertEqual(
            ['SUCCESS  Import order check passed'],
            lint_task_report.get_report(),
        )
        self.assertEqual('Import order', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_python_package_with_init_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            package = pathlib.Path(temp_dir, 'package')
            package.mkdir()
            python_file = package / 'module.py'
            init_file = package / '__init__.py'
            python_file.touch()
            init_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file), str(init_file)]
                    ).check_missing_init_files()
                )

        self.assertFalse(lint_task_report.failed)
        self.assertEqual(
            ['SUCCESS  Missing __init__.py check passed'],
            lint_task_report.get_report(),
        )

    def test_python_package_without_init_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            package = pathlib.Path(temp_dir, 'package')
            package.mkdir()
            python_file = package / 'module.py'
            python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)
        self.assertEqual(
            [
                'Folder "package" is missing an __init__.py file required '
                'for Python packaging.',
                'FAILED  Missing __init__.py check failed',
            ],
            lint_task_report.get_report(),
        )

    def test_nested_python_package_without_init_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = pathlib.Path(temp_dir, 'parent')
            parent.mkdir()
            parent_file = parent / 'parent.py'
            parent_file.touch()
            (parent / '__init__.py').touch()
            child_dir = parent / 'child'
            child_dir.mkdir()
            child_file = child_dir / 'module.py'
            child_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(parent_file), str(child_file)]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)
        self.assertEqual(
            [
                'Folder "%s" is missing an __init__.py file required '
                'for Python packaging.' % os.path.join('parent', 'child')
            ],
            lint_task_report.trimmed_messages,
        )

    def test_intermediate_package_without_python_files_needs_init(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            core = pathlib.Path(temp_dir, 'core')
            parent = core / 'parent'
            child = parent / 'child'
            child.mkdir(parents=True)
            (core / '__init__.py').touch()
            (child / '__init__.py').touch()
            python_file = child / 'module.py'
            python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)
        self.assertEqual(
            [
                'Folder "%s" is missing an __init__.py file required '
                'for Python packaging.' % os.path.join('core', 'parent')
            ],
            lint_task_report.trimmed_messages,
        )

    def test_all_missing_ancestor_init_files_are_reported(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = pathlib.Path(temp_dir, 'parent')
            child = parent / 'child'
            child.mkdir(parents=True)
            python_file = child / 'module.py'
            python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)
        self.assertEqual(
            [
                'Folder "%s" is missing an __init__.py file required '
                'for Python packaging.' % directory
                for directory in ('parent', os.path.join('parent', 'child'))
            ],
            lint_task_report.trimmed_messages,
        )

    def test_nested_packages_with_all_init_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = pathlib.Path(temp_dir, 'parent')
            child = parent / 'child'
            child.mkdir(parents=True)
            (parent / '__init__.py').touch()
            (child / '__init__.py').touch()
            python_file = child / 'module.py'
            python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertFalse(lint_task_report.failed)
        self.assertEqual([], lint_task_report.trimmed_messages)

    def test_checkout_root_does_not_need_init(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            python_file = pathlib.Path(temp_dir, 'module.py')
            python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertFalse(lint_task_report.failed)
        self.assertEqual([], lint_task_report.trimmed_messages)

    def test_files_outside_checkout_root_are_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = pathlib.Path(temp_dir, 'repo')
            sibling = pathlib.Path(temp_dir, 'repo-other')
            repo_root.mkdir()
            sibling.mkdir()
            outside_file = sibling / 'module.py'
            outside_file.touch()
            parent_file = pathlib.Path(temp_dir, 'module.py')
            parent_file.touch()

            with self.swap(os, 'getcwd', lambda: str(repo_root)):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(outside_file), str(parent_file)]
                    ).check_missing_init_files()
                )

        self.assertFalse(lint_task_report.failed)
        self.assertEqual([], lint_task_report.trimmed_messages)

    def test_missing_init_files_reported_once_in_sorted_order(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            first_dir = pathlib.Path(temp_dir, 'a')
            last_dir = pathlib.Path(temp_dir, 'z')
            first_dir.mkdir()
            last_dir.mkdir()
            first_file = first_dir / 'module.py'
            last_file = last_dir / 'module.py'
            another_file = last_dir / 'module_test.py'
            child = last_dir / 'child'
            child.mkdir()
            (child / '__init__.py').touch()
            child_file = child / 'module.py'
            for python_file in (
                first_file,
                last_file,
                another_file,
                child_file,
            ):
                python_file.touch()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [
                            str(last_file),
                            str(child_file),
                            str(another_file),
                            str(first_file),
                            os.path.relpath(last_file),
                        ]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)
        self.assertEqual(
            [
                'Folder "%s" is missing an __init__.py file required '
                'for Python packaging.' % directory
                for directory in ('a', 'z')
            ],
            lint_task_report.trimmed_messages,
        )

    def test_directory_named_init_is_not_an_init_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            package = pathlib.Path(temp_dir, 'package')
            package.mkdir()
            python_file = package / 'module.py'
            python_file.touch()
            (package / '__init__.py').mkdir()

            with self.swap(os, 'getcwd', lambda: temp_dir):
                lint_task_report = (
                    python_linter.ThirdPartyPythonLintChecksManager(
                        [str(python_file)]
                    ).check_missing_init_files()
                )

        self.assertTrue(lint_task_report.failed)

    def test_package_initialization_with_no_files(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            []
        ).check_missing_init_files()

        self.assertFalse(lint_task_report.failed)
        self.assertEqual([], lint_task_report.trimmed_messages)

    def test_valid_job_imports(self) -> None:
        batch_jobs_dir: str = os.path.join(
            os.getcwd(), 'core', 'jobs', 'batch_jobs'
        )
        lint_task_report = python_linter.check_jobs_imports(
            batch_jobs_dir, VALID_PY_JOBS_FILEPATH
        )
        self.assertEqual(
            'SUCCESS  Check jobs imports in jobs registry check passed',
            lint_task_report.get_report()[-1],
        )
        self.assertEqual(
            'Check jobs imports in jobs registry', lint_task_report.name
        )
        self.assertFalse(lint_task_report.failed)

    def test_invalid_job_imports(self) -> None:
        batch_jobs_dir: str = os.path.join(
            os.getcwd(), 'core', 'jobs', 'batch_jobs'
        )
        lint_task_report = python_linter.check_jobs_imports(
            batch_jobs_dir, INVALID_IMPORT_FILEPATH
        )
        self.assertEqual(
            'FAILED  Check jobs imports in jobs registry check failed',
            lint_task_report.get_report()[-1],
        )
        self.assertEqual(
            'Check jobs imports in jobs registry', lint_task_report.name
        )
        self.assertTrue(lint_task_report.failed)

    def test_valid_file_with_pylint(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]
        ).lint_py_files()
        self.assertEqual(
            ['SUCCESS  Pylint check passed'], lint_task_report.get_report()
        )
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_invalid_file_with_pylint_error(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_DOCSTRING_FILEPATH]
        ).lint_py_files()
        self.assert_same_list_elements(
            ['W9025: Period is not used at the end of the docstring.'],
            lint_task_report.trimmed_messages,
        )
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_trimmed_error_output(self) -> None:
        lint_message = (
            '************* Module oppia.scripts.linters.test_files.invalid_'
            'docstring\n\n\n'
            'W: 27, 0: Period is not used at the end of the docstring. '
            '(no-period-used)\n\n\n\n'
            '---------------------------------------------------'
            '---------------\n\n'
            'Your code has been rated at 8.75/10 (previous run: 8.75/10, +0.00)'
            '\n\n\n'
        )
        trimmed_messages = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_DOCSTRING_FILEPATH]
        ).get_trimmed_error_output(lint_message)
        self.assertEqual(
            trimmed_messages,
            '************* Module oppia.scripts.linters.test_files.'
            'invalid_docstring\n\n\nW: 27, 0: Period is not used at '
            'the end of the docstring. \n',
        )

    def test_third_party_linter_with_no_files(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            []
        ).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no Python files to lint.'],
            lint_task_report[0].get_report(),
        )
        self.assertEqual('Python lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def get_third_party_python_lint_checks_manager_obj(
        self, file: str
    ) -> python_linter.ThirdPartyPythonLintChecksManager:
        """Returns a ThirdPartyPythonLintChecksManager for a temporary Python file.
        This helper method writes the provided string `file` into a temporary
        `.py` file and uses it to initialize a ThirdPartyPythonLintChecksManager.
        A temporary file is used because Black automatically modifies newline
        formatting at the end of real files, which can interfere with testing.

        Args:
            file: str. The Python source code to be written to a temporary file.

        Returns:
            ThirdPartyPythonLintChecksManager. A linter object initialized with
            the temporary file.
        """
        temp_file = tempfile.NamedTemporaryFile(
            mode='w+', suffix='.py', delete=False
        )
        temp_file.write(file)
        temp_file.close()

        linter = python_linter.ThirdPartyPythonLintChecksManager(
            [temp_file.name]
        )
        self.addCleanup(temp_file.close)

        return linter

    def test_third_party_perform_all_lint_checks(self) -> None:
        with tempfile.TemporaryDirectory(dir=os.getcwd()) as temp_dir:
            python_file = pathlib.Path(temp_dir, 'module.py')
            python_file.write_text(
                INVALID_PYCODESTYLE_CONTENT, encoding='utf-8'
            )
            lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
                [str(python_file)]
            ).perform_all_lint_checks()

        self.assertTrue(isinstance(lint_task_report, list))
        missing_init_reports = [
            report
            for report in lint_task_report
            if report.name == 'Missing __init__.py'
        ]
        self.assertEqual(len(missing_init_reports), 1)
        self.assertTrue(missing_init_reports[0].failed)

    def test_pycodestyle_with_error_message(self) -> None:
        # We use a temporary file here instead of a real one because
        # the Black formatter auto-fixes newlines at the end of files.
        lint_task_report = self.get_third_party_python_lint_checks_manager_obj(
            INVALID_PYCODESTYLE_CONTENT
        ).lint_py_files()
        print(lint_task_report.trimmed_messages)
        self.assert_same_list_elements(
            ['3:1: E302 expected 2 blank lines, found 1'],
            lint_task_report.trimmed_messages,
        )
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party_linter = python_linter.get_linters(
            [VALID_PY_FILEPATH]
        )
        self.assertIsNone(custom_linter)
        self.assertIsInstance(
            third_party_linter, python_linter.ThirdPartyPythonLintChecksManager
        )

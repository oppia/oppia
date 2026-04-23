# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for scripts.pip_install_cache."""

from __future__ import annotations

import json
import os
import tempfile
import unittest

from scripts import pip_install_cache


class HashFileContentsTests(unittest.TestCase):
    """Tests for _hash_file_contents."""

    def test_returns_hex_string_of_expected_length(self) -> None:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b'hello world')
            tmp_path = tmp.name
        try:
            result = pip_install_cache._hash_file_contents(tmp_path)
            # SHA-256 hex digest is always 64 characters.
            self.assertEqual(len(result), 64)
            self.assertRegex(result, r'^[0-9a-f]{64}$')
        finally:
            os.unlink(tmp_path)

    def test_same_content_produces_same_hash(self) -> None:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b'oppia requirements')
            tmp_path = tmp.name
        try:
            hash1 = pip_install_cache._hash_file_contents(tmp_path)
            hash2 = pip_install_cache._hash_file_contents(tmp_path)
            self.assertEqual(hash1, hash2)
        finally:
            os.unlink(tmp_path)

    def test_different_content_produces_different_hash(self) -> None:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_a:
            tmp_a.write(b'content A')
            path_a = tmp_a.name
        with tempfile.NamedTemporaryFile(delete=False) as tmp_b:
            tmp_b.write(b'content B')
            path_b = tmp_b.name
        try:
            self.assertNotEqual(
                pip_install_cache._hash_file_contents(path_a),
                pip_install_cache._hash_file_contents(path_b),
            )
        finally:
            os.unlink(path_a)
            os.unlink(path_b)

    def test_raises_on_missing_file(self) -> None:
        with self.assertRaises(OSError):
            pip_install_cache._hash_file_contents('/nonexistent/path/file.txt')


class ComputeRequirementsHashTests(unittest.TestCase):
    """Tests for compute_requirements_hash."""

    def _make_temp_file(self, content: bytes) -> str:
        """Helper that writes content to a temp file and returns its path."""
        tmp = tempfile.NamedTemporaryFile(delete=False)
        tmp.write(content)
        tmp.close()
        return tmp.name

    def tearDown(self) -> None:
        super().tearDown()

    def test_returns_64_char_hex_string(self) -> None:
        path_a = self._make_temp_file(b'prod deps')
        path_b = self._make_temp_file(b'dev deps')
        try:
            result = pip_install_cache.compute_requirements_hash(path_a, path_b)
            self.assertEqual(len(result), 64)
        finally:
            os.unlink(path_a)
            os.unlink(path_b)

    def test_same_files_produce_same_hash(self) -> None:
        path_a = self._make_temp_file(b'prod deps')
        path_b = self._make_temp_file(b'dev deps')
        try:
            hash1 = pip_install_cache.compute_requirements_hash(path_a, path_b)
            hash2 = pip_install_cache.compute_requirements_hash(path_a, path_b)
            self.assertEqual(hash1, hash2)
        finally:
            os.unlink(path_a)
            os.unlink(path_b)

    def test_changing_prod_file_changes_hash(self) -> None:
        path_a = self._make_temp_file(b'prod deps original')
        path_b = self._make_temp_file(b'dev deps')
        path_a_modified = self._make_temp_file(b'prod deps MODIFIED')
        try:
            original = pip_install_cache.compute_requirements_hash(
                path_a, path_b
            )
            modified = pip_install_cache.compute_requirements_hash(
                path_a_modified, path_b
            )
            self.assertNotEqual(original, modified)
        finally:
            os.unlink(path_a)
            os.unlink(path_b)
            os.unlink(path_a_modified)

    def test_changing_dev_file_changes_hash(self) -> None:
        path_a = self._make_temp_file(b'prod deps')
        path_b = self._make_temp_file(b'dev deps original')
        path_b_modified = self._make_temp_file(b'dev deps MODIFIED')
        try:
            original = pip_install_cache.compute_requirements_hash(
                path_a, path_b
            )
            modified = pip_install_cache.compute_requirements_hash(
                path_a, path_b_modified
            )
            self.assertNotEqual(original, modified)
        finally:
            os.unlink(path_a)
            os.unlink(path_b)
            os.unlink(path_b_modified)

    def test_raises_when_requirements_file_missing(self) -> None:
        path_a = self._make_temp_file(b'prod deps')
        try:
            with self.assertRaises(OSError):
                pip_install_cache.compute_requirements_hash(
                    path_a, '/nonexistent/requirements_dev.in'
                )
        finally:
            os.unlink(path_a)


class LoadStoredHashTests(unittest.TestCase):
    """Tests for load_stored_hash."""

    def test_returns_none_when_file_does_not_exist(self) -> None:
        result = pip_install_cache.load_stored_hash(
            '/nonexistent/checksums.json'
        )
        self.assertIsNone(result)

    def test_returns_hash_from_valid_file(self) -> None:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as tmp:
            json.dump({'requirements_hash': 'abc123'}, tmp)
            tmp_path = tmp.name
        try:
            result = pip_install_cache.load_stored_hash(tmp_path)
            self.assertEqual(result, 'abc123')
        finally:
            os.unlink(tmp_path)

    def test_returns_none_when_key_missing(self) -> None:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as tmp:
            json.dump({'other_key': 'value'}, tmp)
            tmp_path = tmp.name
        try:
            result = pip_install_cache.load_stored_hash(tmp_path)
            self.assertIsNone(result)
        finally:
            os.unlink(tmp_path)

    def test_returns_none_for_malformed_json(self) -> None:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as tmp:
            tmp.write('this is not json {{{')
            tmp_path = tmp.name
        try:
            result = pip_install_cache.load_stored_hash(tmp_path)
            self.assertIsNone(result)
        finally:
            os.unlink(tmp_path)

    def test_returns_none_when_hash_value_is_not_string(self) -> None:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as tmp:
            json.dump({'requirements_hash': 12345}, tmp)
            tmp_path = tmp.name
        try:
            result = pip_install_cache.load_stored_hash(tmp_path)
            self.assertIsNone(result)
        finally:
            os.unlink(tmp_path)


class SaveHashTests(unittest.TestCase):
    """Tests for save_hash."""

    def test_creates_file_with_correct_contents(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, 'checksums.json')
            pip_install_cache.save_hash('deadbeef', path)
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.assertEqual(data['requirements_hash'], 'deadbeef')

    def test_overwrites_existing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, 'checksums.json')
            pip_install_cache.save_hash('first_hash', path)
            pip_install_cache.save_hash('second_hash', path)
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.assertEqual(data['requirements_hash'], 'second_hash')

    def test_roundtrip_with_load_stored_hash(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, 'checksums.json')
            pip_install_cache.save_hash('roundtrip_hash', path)
            result = pip_install_cache.load_stored_hash(path)
            self.assertEqual(result, 'roundtrip_hash')


class InstallationIsCurrentTests(unittest.TestCase):
    """Tests for installation_is_current."""

    def _make_temp_file(self, content: bytes) -> str:
        tmp = tempfile.NamedTemporaryFile(delete=False)
        tmp.write(content)
        tmp.close()
        return tmp.name

    def test_returns_false_when_no_checksums_file(self) -> None:
        path_a = self._make_temp_file(b'prod')
        path_b = self._make_temp_file(b'dev')
        try:
            result = pip_install_cache.installation_is_current(
                path_a, path_b, '/nonexistent/checksums.json'
            )
            self.assertFalse(result)
        finally:
            os.unlink(path_a)
            os.unlink(path_b)

    def test_returns_true_when_hash_matches(self) -> None:
        path_a = self._make_temp_file(b'prod')
        path_b = self._make_temp_file(b'dev')
        with tempfile.TemporaryDirectory() as tmpdir:
            checksums_path = os.path.join(tmpdir, 'checksums.json')
            current_hash = pip_install_cache.compute_requirements_hash(
                path_a, path_b
            )
            pip_install_cache.save_hash(current_hash, checksums_path)
            result = pip_install_cache.installation_is_current(
                path_a, path_b, checksums_path
            )
            self.assertTrue(result)
        os.unlink(path_a)
        os.unlink(path_b)

    def test_returns_false_when_hash_does_not_match(self) -> None:
        path_a = self._make_temp_file(b'prod')
        path_b = self._make_temp_file(b'dev')
        with tempfile.TemporaryDirectory() as tmpdir:
            checksums_path = os.path.join(tmpdir, 'checksums.json')
            pip_install_cache.save_hash('stale_hash_value', checksums_path)
            result = pip_install_cache.installation_is_current(
                path_a, path_b, checksums_path
            )
            self.assertFalse(result)
        os.unlink(path_a)
        os.unlink(path_b)

    def test_returns_false_when_requirements_file_missing(self) -> None:
        path_a = self._make_temp_file(b'prod')
        with tempfile.TemporaryDirectory() as tmpdir:
            checksums_path = os.path.join(tmpdir, 'checksums.json')
            pip_install_cache.save_hash('some_hash', checksums_path)
            result = pip_install_cache.installation_is_current(
                path_a, '/nonexistent/requirements_dev.in', checksums_path
            )
            self.assertFalse(result)
        os.unlink(path_a)

    def test_returns_false_after_requirements_file_changes(self) -> None:
        path_a = self._make_temp_file(b'prod original')
        path_b = self._make_temp_file(b'dev')
        with tempfile.TemporaryDirectory() as tmpdir:
            checksums_path = os.path.join(tmpdir, 'checksums.json')
            # Save hash for original content.
            original_hash = pip_install_cache.compute_requirements_hash(
                path_a, path_b
            )
            pip_install_cache.save_hash(original_hash, checksums_path)
            # Simulate a requirements change.
            with open(path_a, 'wb') as f:
                f.write(b'prod MODIFIED')
            result = pip_install_cache.installation_is_current(
                path_a, path_b, checksums_path
            )
            self.assertFalse(result)
        os.unlink(path_a)
        os.unlink(path_b)


if __name__ == '__main__':
    unittest.main()

# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/extend_index_yaml.py."""

from __future__ import annotations

import os
import tempfile

from core.tests import test_utils

from . import extend_index_yaml

INDEX_YAML_TEST_DIR = os.path.join('core', 'tests', 'data', '')

MOCK_INDEX_YAML_PATH = os.path.join(
    INDEX_YAML_TEST_DIR, 'index.yaml')
MOCK_WEB_INF_INDEX_YAML_PATH = os.path.join(
    INDEX_YAML_TEST_DIR, 'web-inf-index.yaml')


class ExtendIndexYamlTest(test_utils.GenericTestBase):
    """Class for testing the extend_index_yaml script."""

    def test_extend_index_yaml_with_changes(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc
"""
        web_inf_index_yaml = """indexes:

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        expected_index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, expected_index_yaml)
        
        index_yaml_file.close()
        web_inf_index_yaml_file.close()

    def test_extend_index_yaml_without_changes(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc
"""
        web_inf_index_yaml = """indexes:

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc
"""

        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, index_yaml)

        index_yaml_file.close()
        web_inf_index_yaml_file.close()

    def test_extend_index_yaml_with_empty_web_inf_ind_yaml(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc
"""
        web_inf_index_yaml = """indexes:

"""

        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, index_yaml)

        index_yaml_file.close()
        web_inf_index_yaml_file.close()

    def test_extend_index_yaml_with_same_kind(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time
"""
        web_inf_index_yaml = """indexes:

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        expected_index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""

        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, expected_index_yaml)

        index_yaml_file.close()
        web_inf_index_yaml_file.close()

    def test_extend_index_yaml_with_same_kind_in_web_inf(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc
"""
        web_inf_index_yaml = """indexes:


- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        expected_index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""

        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, expected_index_yaml)

        index_yaml_file.close()
        web_inf_index_yaml_file.close()

    def test_extend_index_yaml_with_same_kind_in_web_inf(self):
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: story__ids
  - name: last_updated
    direction: desc
"""
        web_inf_index_yaml = """indexes:

- kind: BlogPostRightsModel
  properties:
  - name: editor_ids
  - name: blog_post_is_published
  - name: story__ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        expected_index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: story__ids
  - name: last_updated
    direction: desc

- kind: ClassifierTrainingJobModel
  properties:
  - name: task
  - name: status
  - name: next_scheduled_check_time

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""

        index_yaml_file = tempfile.NamedTemporaryFile()
        web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        with self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            index_yaml_file.name):
            with self.swap(
                extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
                web_inf_index_yaml_file.name):
                with open(index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(index_yaml)
                with open(
                    web_inf_index_yaml_file.name, 'w', encoding='utf-8') as f:
                    f.write(web_inf_index_yaml)
                extend_index_yaml.main()
                with open(index_yaml_file.name, 'r', encoding='utf-8') as f:
                    actual_index_yaml = f.read()
                self.assertEqual(actual_index_yaml, expected_index_yaml)

        index_yaml_file.close()
        web_inf_index_yaml_file.close()

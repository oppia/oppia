# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import tempfile

from core.tests import test_utils

from . import extend_index_yaml


class ExtendIndexYamlTest(test_utils.GenericTestBase):
    """Class for testing the extend_index_yaml script."""

    def setUp(self) -> None:
        super().setUp()
        self.index_yaml_file = tempfile.NamedTemporaryFile()
        self.web_inf_index_yaml_file = tempfile.NamedTemporaryFile()
        self.index_yaml_file_name = self.index_yaml_file.name
        self.web_inf_index_yaml_file_name = self.web_inf_index_yaml_file.name
        self.index_yaml_swap = self.swap(
            extend_index_yaml, 'INDEX_YAML_PATH',
            self.index_yaml_file.name)
        self.web_inf_index_yaml_swap = self.swap(
            extend_index_yaml, 'WEB_INF_INDEX_YAML_PATH',
            self.web_inf_index_yaml_file.name)
        self.open_index_yaml_r = open(
            self.index_yaml_file.name, 'r', encoding='utf-8')
        self.open_index_yaml_w = open(
            self.index_yaml_file.name, 'w', encoding='utf-8')
        self.open_web_inf_index_yaml = open(
            self.web_inf_index_yaml_file.name, 'a', encoding='utf-8')

    def _run_test_for_extend_index_yaml(
        self, index_yaml: str, web_inf_index_yaml: str, expected_index_yaml: str
    ) -> None:
        """Run tests for extend_index_yaml script."""
        with self.index_yaml_swap, self.web_inf_index_yaml_swap:
            with self.open_index_yaml_w as f:
                f.write(index_yaml)
            with self.open_web_inf_index_yaml as f:
                f.write(web_inf_index_yaml)
            extend_index_yaml.main()
            with self.open_index_yaml_r as f:
                actual_index_yaml = f.read()
            self.assertEqual(actual_index_yaml, expected_index_yaml)

    def tearDown(self) -> None:
        super().tearDown()
        self.index_yaml_file.close()
        self.web_inf_index_yaml_file.close()

    def test_extend_index_yaml_with_changes(self) -> None:
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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, expected_index_yaml)

    def test_extend_index_yaml_without_changes(self) -> None:
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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, index_yaml)

    def test_extend_index_yaml_with_empty_web_inf_ind_yaml(self) -> None:
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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, index_yaml)

    def test_extend_index_yaml_with_same_kind(self) -> None:
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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, expected_index_yaml)

    def test_extend_index_yaml_with_same_kind_in_web_inf(self) -> None:
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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, expected_index_yaml)

    def test_extend_index_yaml_with_same_kind_different_order(self) -> None:
        index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: BlogPostRightsModel
  properties:
  - name: blog_post_is_published
  - name: editor_ids
  - name: story_ids
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
  - name: story_ids
  - name: last_updated
    direction: desc

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

        self._run_test_for_extend_index_yaml(
            index_yaml, web_inf_index_yaml, expected_index_yaml)

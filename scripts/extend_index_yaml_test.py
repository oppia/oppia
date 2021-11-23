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

import unittest
from unittest import mock

from . import extend_index_yaml


class ExtendIndexYamlTest(unittest.TestCase):
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

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time
"""
        web_inf_index_yaml = """indexes:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

- kind: ClassifierTrainingJobModel
  properties:
  - name: status
  - name: next_scheduled_check_time

- kind: CollectionRightsSnapshotMetadataModel
  properties:
  - name: committer_id
  - name: commit_message
  - name: commit_type
"""
        expected_result = """indexes:

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

- kind: CollectionRightsSnapshotMetadataModel
  properties:
  - name: committer_id
  - name: commit_message
  - name: commit_type
"""
        with mock.patch('builtins.open', mock.mock_open()) as mock_open_file:
            mock_open_file.return_value.__enter__.side_effect = [
                index_yaml,
                web_inf_index_yaml,
            ]
            extend_index_yaml.main()

            mock_open_file.assert_called_with(
                extend_index_yaml.INDEX_YAML_PATH, 'w', encoding='utf-8'
            )
            mock_open_file().write.assert_called_with(expected_result)

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

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by
"""
        expected_result = index_yaml
        with mock.patch('builtins.open', mock.mock_open()) as mock_open_file:
            mock_open_file.return_value.__enter__.side_effect = [
                index_yaml,
                web_inf_index_yaml,
            ]
            extend_index_yaml.main()

            mock_open_file.assert_called_with(
                extend_index_yaml.INDEX_YAML_PATH, 'w', encoding='utf-8'
            )
            mock_open_file().write.assert_called_with(expected_result)

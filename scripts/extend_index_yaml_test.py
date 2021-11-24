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

    def test_extend_index_yaml_with_multi_indexes(self):
        # This is a case which is probably not possible, but considering
        # that there can be multiple different indexes for kind.
        index_yaml = """indexes1:

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

indexes2:

- kind: UserContributionProficiencyModel
  properties:
  - name: realtime_layer
  - name: created_on

"""
        web_inf_index_yaml = """indexes1:

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

indexes2:

- kind: UserStatsRealtimeModel
  properties:
  - name: realtime_layer
  - name: created_on

- kind: _AE_Pipeline_Record
  properties:
  - name: is_root_pipeline
  - name: start_time
    direction: desc

"""
        expected_result = """indexes1:

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

indexes2:

- kind: UserContributionProficiencyModel
  properties:
  - name: realtime_layer
  - name: created_on

- kind: UserStatsRealtimeModel
  properties:
  - name: realtime_layer
  - name: created_on

- kind: _AE_Pipeline_Record
  properties:
  - name: is_root_pipeline
  - name: start_time
    direction: desc
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

    def test_missing_key_in_index_yaml_with_multi_index(self):
        index_yaml = """indexes1:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by
"""
        web_inf_index_yaml = """indexes1:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

indexes2:

- kind: UserStatsRealtimeModel
  properties:
  - name: realtime_layer
  - name: created_on
"""
        expected_result = """indexes1:

- kind: AppFeedbackReportModel
  properties:
  - name: created_on
  - name: scrubbed_by

indexes2:

- kind: UserStatsRealtimeModel
  properties:
  - name: realtime_layer
  - name: created_on
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

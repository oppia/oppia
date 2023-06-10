# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for populating story node."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_node_jobs

from typing import Type


class PopulateStoryNodeJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_node_jobs.PopulateStoryNodeJob
    ] = story_node_jobs.PopulateStoryNodeJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

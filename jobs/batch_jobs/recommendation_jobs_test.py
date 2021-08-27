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

"""Unit tests for jobs.batch_jobs.recommendation_jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs import job_test_utils
from jobs.batch_jobs import recommendation_jobs
from jobs.types import job_run_result


class ExplorationRecommendationsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = recommendation_jobs.ExplorationRecommendationsJob

    def test_empty_storage(self):
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='0 recommendations computed'),
        ])

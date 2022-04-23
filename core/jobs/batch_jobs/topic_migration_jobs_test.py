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

"""Unit tests for jobs.batch_jobs.topic_migration_jobs."""

from __future__ import annotations

import copy
import datetime

from core import feconf
from core.domain import caching_services
from core.domain topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import topic_models

(topic_model, topic_summary_model) = models.Registry.import_models([
    models.NAMES.Topic, models.NAMES.TopicSummaryModel])


class MigrateTopicJobTests(job_test_utils.JobTestBase):
    """TODO
    """

    def setUp(self) -> None:
        # TODO.

    def test_empty_storage(self) -> None:
        # TODO.

    def test_unmigrated_topic_with_unmigrated_prop_is_migrated(self) -> None:
        # TODO.

    def test_topic_summary_of_unmigrated_topic_is_updated(self) -> None:
        # TODO.

    def test_broken_cache_is_reported(self) -> None:
        # TODO.

    def test_broken_topic_is_not_migrated(self) -> None:
        # TODO.

    def test_migrated_topic_is_not_migrated(self) -> None:
        # TODO.

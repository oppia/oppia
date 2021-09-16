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

"""Unit tests for jobs.batch_jobs.oppurtunity_jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants

from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.batch_jobs import opportunity_jobs
from jobs.types import job_run_result

from typing import Dict, List, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import story_models
    from mypy_imports import topic_models

(
    exp_models, opportunity_models,
    topic_models, story_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity,
    models.NAMES.topic, models.NAMES.story
])
datastore_services = models.Registry.import_datastore_services()


class ExplorationOpportunitySummaryModelRegenerationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = opportunity_jobs.ExplorationOpportunitySummaryModelRegenerationJob

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    TOPIC_1_ID = 'topic_1_id'
    STORY_1_ID = 'story_1_id'
    LANG_1 = 'lang_1'

    def setUp(self):
        super(
            ExplorationOpportunitySummaryModelRegenerationJobTests, self
        ).setUp()
        topic_model = self.create_model(  # type: ignore[no-untyped-call]
            topic_models.TopicModel,
            id=self.TOPIC_1_ID,
            name='title',
            canonical_name='title',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic',
            canonical_story_references=[{
                'story_id': self.STORY_1_ID,
                'story_is_published': False
            }]
        )
        topic_model.update_timestamps()

        story_model = self.create_model(  # type: ignore[no-untyped-call]
            story_models.StoryModel,
            id=self.STORY_1_ID,
            title='title',
            language_code='cs',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_1_ID,
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.EXP_1_ID,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note'
        )
        story_model.update_timestamps()

        exp_model = self.create_model(  # type: ignore[no-untyped-call]
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            init_state_name='state',
            states_schema_version=48
        )
        exp_model.update_timestamps()
        datastore_services.put_multi([exp_model, story_model, topic_model])

    def test_regeneration_job_returns_the_initial_opportunity(self):
        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS')
        ])

        opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(self.EXP_1_ID))
        self.assertIsNotNone(opportunity_model)

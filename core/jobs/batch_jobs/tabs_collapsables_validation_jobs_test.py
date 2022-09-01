# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for jobs.batch_jobs.tabs_collapsables_validation_jobs"""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import tabs_collapsables_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(exp_models, opportunity_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.opportunity])


class TabsCollapsablesValidationJobTest(job_test_utils.JobTestBase):
    """Tests for TabsCollapsablesValidationJob"""

    JOB_CLASS = (
      tabs_collapsables_validation_jobs.TabsCollapsablesValidationJob
    )

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'

    EXP_1_STATE_1 = state_domain.State.create_default_state(
        'EXP_1_STATE_1', is_initial_state=False).to_dict()
    EXP_1_STATE_1['content']['html'] = (
        '<p><oppia-noninteractive-image filepath-with-value=\"'
        '&amp;quot;s7Image.png&amp;quot;\">'
        '</oppia-noninteractive-image>'
        '<oppia-noninteractive-collapsible content-with-value='
        '\"&amp;quot;&amp;lt;p&amp;gt;Content.&amp;lt;/p&amp;'
        'gt;&amp;lt;oppia-noninteractive-image '
        'filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;'
        's7CollapsibleImage.png&amp;amp;amp;quot;\\&amp;quot;'
        '&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;'
        '&amp;quot;\"></oppia-noninteractive-collapsible>'
        '<oppia-noninteractive-tabs tab_contents-with-value=\"'
        '[{&amp;quot;title&amp;quot;:&amp;quot;Title1&amp;'
        'quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p'
        '&amp;gt;Content1&amp;lt;/p&amp;gt;&amp;quot;},'
        '{&amp;quot;title&amp;quot;:&amp;quot;Title2&amp;quot;'
        ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;'
        'gt;Content2&amp;lt;/p&amp;gt;&amp;lt;'
        'oppia-noninteractive-image filepath-with-value=\\'
        '&amp;quot;&amp;amp;amp;quot;s7TabImage.png&amp;amp;'
        'amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/'
        'oppia-noninteractive-image&amp;gt;&amp;quot;}]\">'
        '</oppia-noninteractive-tabs></p>'
    )

    TODAY_DATE = datetime.datetime.utcnow()
    YEAR_AGO_DATE = str((TODAY_DATE - datetime.timedelta(weeks=52)).date())

    def setUp(self) -> None:
        super().setUp()

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
              'EXP_1_STATE_1': self.EXP_1_STATE_1
            }
        )

        self.opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_1,
            topic_id='topic_id',
            topic_name='a_topic name',
            story_id='story_id',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_tabs_and_collapsibles(self) -> None:
        self.put_multi(
          [self.exp_1, self.opportunity_model_1]
        )
        self.assert_job_output_is([
          
        ])

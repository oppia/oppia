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
        '<p><oppia-noninteractive-image filepath-with-value=\''
        '&amp;quot;s7Image.png&amp;quot;\'>'
        '</oppia-noninteractive-image>'
        '<oppia-noninteractive-collapsible content-with-value='
        '\'&quot;&lt;p&gt;Content&lt;/p&gt;&lt;oppia-noninteractive-image '
        'alt-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; '
        'caption-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; '
        'filepath-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot;&gt;'
        '&lt;/oppia-noninteractive-image&gt;&lt;oppia-noninteractive-image'
        '&gt;&lt;/oppia-noninteractive-image&gt;&lt;p&gt;&amp;nbsp;&lt;/p'
        '&gt;&lt;p&gt;&lt;oppia-noninteractive-link text-with-value=\\&quot;'
        '&amp;amp;quot;&amp;amp;quot;\\&quot; url-with-value=\\&quot;&amp;amp;'
        'quot;&amp;amp;quot;\\&quot;&gt;&lt;/oppia-noninteractive-link&gt;'
        '&lt;oppia-noninteractive-link&gt;&lt;/oppia-noninteractive-link'
        '&gt;&lt;/p&gt;&lt;p&gt;&amp;nbsp;&lt;/p&gt;&lt;p&gt;&lt;'
        'oppia-noninteractive-math math_content-with-value=\\&quot;'
        '{&amp;amp;quot;raw_latex&amp;amp;quot;:&amp;amp;quot;&amp;amp;'
        'quot;,&amp;amp;quot;svg_filename&amp;amp;quot;:&amp;amp;quot;'
        '&amp;amp;quot;}\\&quot;&gt;&lt;/oppia-noninteractive-math&gt;'
        '&lt;oppia-noninteractive-math math_content-with-value=\\&quot;'
        '{&amp;amp;quot;svg_filename&amp;amp;quot;:&amp;amp;quot;abc.png'
        '&amp;amp;quot;}\\&quot;&gt;&lt;/oppia-noninteractive-math&gt;&lt;'
        'oppia-noninteractive-math&gt;&lt;/oppia-noninteractive-math&gt;'
        '&lt;oppia-noninteractive-math math_content-with-value=&#39;&#39;'
        '&gt;&lt;/oppia-noninteractive-math&gt;&lt;/p&gt;&lt;p&gt;&amp;'
        'nbsp;&lt;/p&gt;&lt;p&gt;&lt;oppia-noninteractive-skillreview '
        'skill_id-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; '
        'text-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot;&gt;&lt;'
        '/oppia-noninteractive-skillreview&gt;&lt;oppia-noninteractive-'
        'skillreview&gt;&lt;/oppia-noninteractive-skillreview&gt;&lt;/p&gt;'
        '&lt;oppia-noninteractive-video autoplay-with-value=\\&quot;&amp;amp;'
        'quot;&amp;amp;quot;\\&quot; end-with-value=\\&quot;&amp;amp;quot;&amp;'
        'amp;quot;\\&quot; start-with-value=\\&quot;&amp;amp;quot;&amp;amp;'
        'quot;\\&quot; video_id-with-value=\\&quot;&amp;amp;quot;&amp;amp;'
        'quot;\\&quot;&gt;&lt;/oppia-noninteractive-video&gt;&lt;'
        'oppia-noninteractive-video&gt;&lt;/oppia-noninteractive-video'
        '&gt;&quot;\' heading-with-value=\'&amp;quot;Sample Header'
        '&amp;quot;\'></oppia-noninteractive-collapsible>'
        '<oppia-noninteractive-tabs tab_contents-with-value=\''
        '[{&quot;title&quot;: &quot;Title1&quot;, &quot;content&quot;: '
        '&quot;&lt;p&gt;Content1&lt;/p&gt;&quot;}, {&quot;title&quot;: '
        '&quot;Title2&quot;, &quot;content&quot;: &quot;&lt;p&gt;'
        'Content&lt;/p&gt;&lt;oppia-noninteractive-image alt-with-value='
        '\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; caption-with-value='
        '\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; filepath-with-value='
        '\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot;&gt;&lt;'
        '/oppia-noninteractive-image&gt;&lt;oppia-noninteractive-image&gt;'
        '&lt;/oppia-noninteractive-image&gt;&lt;p&gt;&amp;nbsp;&lt;/p&gt;'
        '&lt;p&gt;&lt;oppia-noninteractive-link text-with-value=\\&quot;'
        '&amp;amp;quot;&amp;amp;quot;\\&quot; url-with-value=\\&quot;&amp;'
        'amp;quot;&amp;amp;quot;\\&quot;&gt;&lt;/oppia-noninteractive-link'
        '&gt;&lt;oppia-noninteractive-link&gt;&lt;/oppia-noninteractive-link'
        '&gt;&lt;/p&gt;&lt;p&gt;&amp;nbsp;&lt;/p&gt;&lt;p&gt;&lt;'
        'oppia-noninteractive-math math_content-with-value=\\&quot;'
        '{&amp;amp;quot;raw_latex&amp;amp;quot;:&amp;amp;quot;&amp;amp;quot;'
        ',&amp;amp;quot;svg_filename&amp;amp;quot;:&amp;amp;quot;&amp;amp;'
        'quot;}\\&quot;&gt;&lt;/oppia-noninteractive-math&gt;&lt;'
        'oppia-noninteractive-math&gt;&lt;/oppia-noninteractive-math&gt;&lt;'
        'oppia-noninteractive-math math_content-with-value=&#39;&#39;&gt;&lt;'
        '/oppia-noninteractive-math&gt;&lt;/p&gt;&lt;p&gt;&amp;nbsp;&lt;/p&gt;'
        '&lt;p&gt;&lt;oppia-noninteractive-skillreview skill_id-with-value='
        '\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; text-with-value=\\&quot;'
        '&amp;amp;quot;&amp;amp;quot;\\&quot;&gt;&lt;'
        '/oppia-noninteractive-skillreview&gt;&lt;'
        'oppia-noninteractive-skillreview&gt;&lt;'
        '/oppia-noninteractive-skillreview&gt;&lt;/p&gt;&lt;'
        'oppia-noninteractive-video autoplay-with-value=\\&quot;&amp;amp;quot;'
        '&amp;amp;quot;\\&quot; end-with-value=\\&quot;&amp;amp;quot;&amp;'
        'amp;quot;\\&quot; start-with-value=\\&quot;&amp;amp;quot;&amp;amp;qu'
        'ot;\\&quot; video_id-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;'
        '\\&quot;&gt;&lt;/oppia-noninteractive-video&gt;&lt;'
        'oppia-noninteractive-video&gt;&lt;'
        '/oppia-noninteractive-video&gt;&quot;}]\'>'
        '</oppia-noninteractive-tabs></p>'
        '<oppia-noninteractive-collapsible content-with-value=\'\' '
        'heading-with-value=\'\'></oppia-noninteractive-collapsible>'
        '<oppia-noninteractive-collapsible></oppia-noninteractive-collapsible>'
        '<oppia-noninteractive-tabs tab_contents-with-value=\'\'>'
        '</oppia-noninteractive-tabs><oppia-noninteractive-tabs>'
        '</oppia-noninteractive-tabs>'
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
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 1, created on {self.YEAR_AGO_DATE} and '
            f'the invalid tabs values are [{{\'state_name\': \'EXP_1_STATE_1\','
            f' \'errored_values\': [\'video id empty\', \'text attr empty in '
            f'skillreview tag\', \'filepath attr not exists\', \'raw lattex '
            f'attr empty\', \'alt attr is empty\', \'filepath attr is empty\', '
            f'\'svg_filename attr not exists\', \'text attr not in skillreview '
            f'tag\', \'end value invalid\', \'caption attr not exists\', '
            f'\'svg_filename attr empty\', \'start value invalid\', \'text '
            f'attr empty in link tag\', \'math content attr is empty\', '
            f'\'raw lattex attr not exists\', \'No content attr in tabs\', '
            f'\'No video id\', \'alt attr not exists\', \'No url attr in link '
            f'tag\', \'autoplay attr not exists\', \'math content attr not '
            f'exists\', \'No text attr in link tag\', \'autoplay '
            f'value invalid\']}}]'
          ),

          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 1, created on {self.YEAR_AGO_DATE} and '
            f'the invalid collapsibles values are [{{\'state_name\': '
            f'\'EXP_1_STATE_1\', \'errored_values\': [\'video id empty\', '
            f'\'text attr empty in skillreview tag\', \'filepath attr not '
            f'exists\', \'raw lattex attr empty\', \'alt attr is empty\', '
            f'\'filepath attr is empty\', \'svg_filename attr not exists\', '
            f'\'text attr not in skillreview tag\', \'end value invalid\', '
            f'\'caption attr not exists\', \'svg_filename attr empty\', '
            f'\'start value invalid\', \'No content attr in collapsible '
            f'tag\', \'text attr empty in link tag\', \'math content attr '
            f'is empty\', \'raw lattex attr not exists\', \'No video id\', '
            f'\'alt attr not exists\', \'No heading attr in collapsible '
            f'tag\', \'No url attr in link tag\', \'autoplay attr not '
            f'exists\', \'math content attr not exists\', \'No text attr '
            f'in link tag\', \'autoplay value invalid\']}}]'
          )
        ])

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
    [models.Names.EXPLORATION, models.Names.OPPORTUNITY])


class TabsCollapsablesValidationJobTest(job_test_utils.JobTestBase):
    """Tests for TabsCollapsablesValidationJob"""

    JOB_CLASS = (
      tabs_collapsables_validation_jobs.TabsCollapsablesValidationJob
    )

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'

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

    EXP_2_STATE_1 = state_domain.State.create_default_state(
        'EXP_2_STATE_1', is_initial_state=False).to_dict()
    EXP_2_STATE_1['content']['html'] = (
      '<oppia-noninteractive-tabs tab_contents-with-value=\'[]\'>'
      '</oppia-noninteractive-tabs><oppia-noninteractive-collapsible '
      'content-with-value=\'&amp;quot;&amp;quot;\' heading-with-value='
      '\'&amp;quot;&amp;quot;\'></oppia-noninteractive-collapsible>'
      '<oppia-noninteractive-collapsible content-with-value=\'&quot;&lt;'
      'p&gt;Content&lt;/p&gt;&lt;oppia-noninteractive-image '
      'alt-with-value=\\&quot;&amp;amp;quot;dssddsdssdsd&amp;amp;quot;'
      '\\&quot; caption-with-value=\\&quot;&amp;amp;quot;aaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&amp;amp;quot;\\&quot; '
      'filepath-with-value=\\&quot;&amp;amp;quot;img.svg&amp;amp;quot;'
      '\\&quot;&gt;&lt;/oppia-noninteractive-image&gt;&lt;oppia-noninteractive-'
      'image alt-with-value=\\&quot;&amp;amp;quot;ds&amp;amp;quot;\\&quot; '
      'caption-with-value=\\&quot;&amp;amp;quot;sdds&amp;amp;quot;\\&quot; '
      'filepath-with-value=\\&quot;&amp;amp;quot;img.svg&amp;amp;quot;'
      '\\&quot;&gt;&lt;/oppia-noninteractive-image&gt;&lt;p&gt;&amp;nbsp;'
      '&lt;/p&gt;&lt;p&gt;&lt;oppia-noninteractive-link text-with-value'
      '=\\&quot;&amp;amp;quot;link&amp;amp;quot;\\&quot; url-with-value'
      '=\\&quot;&amp;amp;quot;https://www.example.com&amp;amp;quot;\\&quot;'
      '&gt;&lt;/oppia-noninteractive-link&gt;&lt;/p&gt;&lt;p&gt;&amp;nbsp;'
      '&lt;/p&gt;&lt;p&gt;&lt;oppia-noninteractive-math math_content-with-'
      'value=\\&quot;{&amp;amp;quot;raw_latex&amp;amp;quot;:&amp;'
      'amp;quot;\\\\frac{x}{y}&amp;amp;quot;,&amp;amp;quot;svg_filename&amp;'
      'amp;quot;:&amp;amp;quot;mathImg.svg&amp;amp;quot;}\\&quot;&gt;&lt;'
      '/oppia-noninteractive-math&gt;&lt;oppia-noninteractive-math '
      'math_content-with-value=\\&quot;{&amp;amp;quot;raw_latex&amp;amp;quot;:'
      '&amp;amp;quot;\\\\frac{x}{y}&amp;amp;quot;,&amp;amp;quot;'
      'svg_filename&amp;amp;quot;:&amp;amp;quot;mathImg.png&amp;amp;quot;'
      '}\\&quot;&gt;&lt;/oppia-noninteractive-math&gt;&lt;/p&gt;&lt;p&gt;&amp;'
      'nbsp;&lt;/p&gt;&lt;p&gt;&lt;oppia-noninteractive-skillreview '
      'skill_id-with-value=\\&quot;&amp;amp;quot;&amp;amp;quot;\\&quot; '
      'text-with-value=\\&quot;&amp;amp;quot;concept card&amp;amp;quot;\\&quot;'
      '&gt;&lt;/oppia-noninteractive-skillreview&gt;&lt;oppia-noninteractive-'
      'skillreview skill_id-with-value=\\&quot;&amp;amp;quot;skill_id&amp;amp;'
      'quot;\\&quot; text-with-value=\\&quot;&amp;amp;quot;concept card&amp;amp'
      ';quot;\\&quot;&gt;&lt;/oppia-noninteractive-skillreview&gt;&lt;/p&gt;&lt'
      ';oppia-noninteractive-video autoplay-with-value=\\&quot;&amp;amp;quot;'
      '&amp;amp;quot;\\&quot; end-with-value=\\&quot;&amp;amp;quot;2&amp;amp;'
      'quot;\\&quot; start-with-value=\\&quot;&amp;amp;quot;10&amp;amp;'
      'quot;\\&quot; video_id-with-value=\\&quot;&amp;amp;quot;Ntcw0H0hwPU&amp;'
      'amp;quot;\\&quot;&gt;&lt;/oppia-noninteractive-video&gt;&lt;'
      'oppia-noninteractive-video autoplay-with-value=\\&quot;&amp;amp;quot;'
      'false&amp;amp;quot;\\&quot; end-with-value=\\&quot;&amp;amp;quot;0&amp;'
      'amp;quot;\\&quot; start-with-value=\\&quot;&amp;amp;quot;2&amp;amp;'
      'quot;\\&quot; video_id-with-value=\\&quot;&amp;amp;quot;Ntcw0H0hwPU&amp;'
      'amp;quot;\\&quot;&gt;&lt;/oppia-noninteractive-video&gt;&lt;'
      'oppia-noninteractive-video autoplay-with-value=\\&quot;&amp;amp;quot;'
      'No&amp;amp;quot;\\&quot; end-with-value=\\&quot;&amp;amp;quot;&amp;amp;'
      'quot;\\&quot; start-with-value=\\&quot;&amp;amp;quot;&amp;amp;'
      'quot;\\&quot; video_id-with-value=\\&quot;&amp;amp;quot;Ntcw0H0hwPU&amp;'
      'amp;quot;\\&quot;&gt;&lt;/oppia-noninteractive-video&gt;&lt;'
      'oppia-noninteractive-tabs&gt;&lt;/oppia-noninteractive-tabs&gt;&lt;'
      'oppia-noninteractive-collapsible&gt;&lt;/oppia-noninteractive-'
      'collapsible&gt;&quot;\'></oppia-noninteractive-collapsible>'
    )

    EXP_3_STATE_1 = state_domain.State.create_default_state(
        'EXP_3_STATE_1', is_initial_state=False).to_dict()
    EXP_3_STATE_1['content']['html'] = (
      '<p>Content</p><oppia-noninteractive-image alt-with-value=\'&amp;quot;'
      'dssddsdssdsd&amp;quot;\' caption-with-value=\'&amp;quot;sdds&amp;'
      'quot;\' filepath-with-value=\'&amp;quot;img.svg&amp;quot;\'>'
      '</oppia-noninteractive-image><oppia-noninteractive-link '
      'text-with-value=\'&amp;quot;link&amp;quot;\' url-with-value='
      '\'&amp;quot;https://www.example.com&amp;quot;\'>'
      '</oppia-noninteractive-link>'
    )

    EXP_3_STATE_2 = state_domain.State.create_default_state(
        'EXP_3_STATE_2', is_initial_state=False).to_dict()
    EXP_3_STATE_2['content']['html'] = (
      '<p>Content</p><oppia-noninteractive-image alt-with-value=\'&amp;quot;'
      'dssddsdssdsd&amp;quot;\' caption-with-value=\'&amp;quot;sdds&amp;quot;'
      '\' filepath-with-value=\'&amp;quot;img.svg&amp;quot;\'>'
      '</oppia-noninteractive-image>'
    )

    EXP_4_STATE_1 = state_domain.State.create_default_state(
        'EXP_4_STATE_1', is_initial_state=False).to_dict()
    EXP_4_STATE_1['content']['html'] = (
      '<p>Content</p><oppia-noninteractive-image alt-with-value=\'&amp;quot;'
      'ds&amp;quot;\' caption-with-value=\'&amp;quot;sdds&amp;quot;'
      '\' filepath-with-value=\'&amp;quot;img.png&amp;quot;\'>'
      '</oppia-noninteractive-image>'
      '<p>Content</p><oppia-noninteractive-image caption-with-value'
      '=\'&amp;quot;sdds&amp;quot;\'></oppia-noninteractive-image>'
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

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='title2',
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
              'EXP_2_STATE_1': self.EXP_2_STATE_1
            }
        )

        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='title3',
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
              'EXP_3_STATE_1': self.EXP_3_STATE_1,
              'EXP_3_STATE_2': self.EXP_3_STATE_2
            }
        )

        self.exp_4 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_4,
            title='title4',
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
              'EXP_4_STATE_1': self.EXP_4_STATE_1
            }
        )

        self.opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_3,
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

        self.opportunity_model_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_2,
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

        self.opportunity_model_3 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_4,
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

        self.mock_function_for_exp_fetcher()

        self.mock_convert_to_model_pair()

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_curated_image_tag(self) -> None:
        self.put_multi([self.exp_4, self.opportunity_model_3])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED IMAGE RTE TAG ALT '
            'VALUES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED IMAGE RTE TAG '
            'FILEPATH VALUES SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 4, created on {self.YEAR_AGO_DATE} and '
            f'the invalid curated RTE image filepath values '
            f'are [\'EXP_4_STATE_1\']'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 4, created on {self.YEAR_AGO_DATE} and '
            f'the invalid curated RTE image alt values are [\'EXP_4_STATE_1\']'
          )
        ])

    def test_run_with_restricted_tags_for_curated(self) -> None:
        self.put_multi([self.exp_3, self.opportunity_model_1])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID CURATED RTE TAG SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 3, created on {self.YEAR_AGO_DATE} and '
            f'the invalid curated RTE values are [{{\'state_name\': '
            f'\'EXP_3_STATE_1\', \'state_with_errored_values\': '
            f'[<oppia-noninteractive-link text-with-value=\"&amp;quot;'
            f'link&amp;quot;\" url-with-value=\"&amp;quot;https://www.'
            f'example.com&amp;quot;\"></oppia-noninteractive-link>]}}]'
          )
        ])

    def test_tabs_and_collapsibles_1(self) -> None:
        self.put_multi([self.exp_2])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 2, created on {self.YEAR_AGO_DATE} '
            f'and the invalid collapsibles values are [{{\'state_name\': '
            f'\'EXP_2_STATE_1\', \'errored_values\': [\'Nested collapsables\''
            f', \'Nested tabs\', \'No heading attr in collapsible tag\', '
            f'\'alt attr length is less than 5\', \'autoplay value invalid\''
            f', \'caption attr length is greater than 500\', \'collapsible '
            f'content empty\', \'collapsible heading empty\', \'skill_id attr '
            f'empty in skillreview tag\', \'start value greater than end '
            f'value\', \'svg_filename attr does not have svg extension\']}}]'
          ),
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 2, created on {self.YEAR_AGO_DATE} '
            f'and the invalid tabs values are [{{\'state_name\': '
            f'\'EXP_2_STATE_1\', \'errored_values\': [\'No tabs\']}}]'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID COLLAPSIBLES TAG SUCCESS: 1'
          ),
          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID TABS TAG SUCCESS: 1'
          )
        ])

    def test_tabs_and_collapsibles(self) -> None:
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 1, created on {self.YEAR_AGO_DATE} '
            f'and the invalid collapsibles values are [{{\'state_name\': '
            f'\'EXP_1_STATE_1\', \'errored_values\': [\'No content attr in '
            f'collapsible tag\', \'No heading attr in collapsible tag\', '
            f'\'No text attr in link tag\', \'No url attr in link tag\', '
            f'\'No video id\', \'alt attr is empty\', \'alt attr length is '
            f'less than 5\', \'alt attr not exists\', \'autoplay attr not '
            f'exists\', \'autoplay value invalid\', \'caption attr not '
            f'exists\', \'end value invalid\', \'filepath attr is empty\', '
            f'\'filepath attr not exists\', \'math content attr is empty\', '
            f'\'math content attr not exists\', \'raw lattex attr empty\', '
            f'\'raw lattex attr not exists\', \'skill_id attr empty in '
            f'skillreview tag\', \'skill_id attr not in skillreview tag\', '
            f'\'start value invalid\', \'svg_filename attr does not '
            f'have svg extension\', \'svg_filename attr empty\', '
            f'\'svg_filename attr not exists\', \'text attr empty in link '
            f'tag\', \'text attr empty in skillreview tag\', \'text attr '
            f'not in skillreview tag\', \'video id empty\']}}]'
          ),

          job_run_result.JobRunResult.as_stderr(
            f'The id of the exp is 1, created on {self.YEAR_AGO_DATE} '
            f'and the invalid tabs values are [{{\'state_name\': '
            f'\'EXP_1_STATE_1\', \'errored_values\': [\'No content attr in '
            f'tabs\', \'No text attr in link tag\', \'No url attr in link '
            f'tag\', \'No video id\', \'alt attr is empty\', \'alt attr '
            f'length is less than 5\', \'alt attr not exists\', \'autoplay '
            f'attr not exists\', \'autoplay value invalid\', \'caption attr '
            f'not exists\', \'end value invalid\', \'filepath attr is '
            f'empty\', \'filepath attr not exists\', \'math content attr is '
            f'empty\', \'math content attr not exists\', \'raw lattex attr '
            f'empty\', \'raw lattex attr not exists\', \'skill_id attr empty '
            f'in skillreview tag\', \'skill_id attr not in skillreview tag\', '
            f'\'start value invalid\', \'svg_filename attr empty\', '
            f'\'svg_filename attr not exists\', \'text attr empty in link '
            f'tag\', \'text attr empty in skillreview tag\', \'text attr not '
            f'in skillreview tag\', \'video id empty\']}}]'
          ),

          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID TABS TAG SUCCESS: 1'
          ),

          job_run_result.JobRunResult.as_stdout(
            'NUMBER OF EXPS WITH INVALID COLLAPSIBLES TAG SUCCESS: 1'
          ),
        ])

    def mock_function_for_exp_fetcher(self) -> None:
        temp_tuple = ('invalid_model', 'invalid_opportunity_model')
        model = (
          tabs_collapsables_validation_jobs.TabsCollapsablesValidationJob.
          get_exploration_from_models(temp_tuple)
        )

        self.assertEqual(
          model, None
        )

        model = (
          tabs_collapsables_validation_jobs.TabsCollapsablesValidationJob.
          get_exploration_from_models('invalid_model')
        )

        self.assertEqual(
          model, None
        )

    def mock_convert_to_model_pair(self) -> None:
        temp_tuple = (
          [self.exp_1, self.exp_2],
          [self.opportunity_model_1, self.opportunity_model_2]
        )
        model = (
            tabs_collapsables_validation_jobs.TabsCollapsablesValidationJob.
            convert_into_model_pair(temp_tuple)
        )

        self.assertEqual(
          model, (None, None)
        )

# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.story_validation_jobs."""

from __future__ import annotations

import copy
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

# (story_models, ) = models.Registry.import_models([models.NAMES.story])
(story_models, topic_models) = models.Registry.import_models([
    models.NAMES.story, models.NAMES.topic
])


class GetNumberOfStoryNotesExceedsMaxLengthJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = story_validation_jobs.GetNumberOfStoryNotesExceedsMaxLengthJob

    STORY_ID_1 = 'id_1'
    STORY_ID_2 = 'id_2'
    STORY_ID_3 = 'id_3'
    DUMMY_NOTES = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestibulum volutpat pretium libero. Cras id dui. Aenean ut eros et nisl sagittis vestibulum. Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. Sed lectus. Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Maecenas malesuada. Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Phasellus consectetuer vestibulum elit. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc. Vestibulum fringilla pede sit amet augue. In turpis. Pellentesque posuere. Praesent turpis. Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc, eu sollicitudin urna dolor sagittis lacus. Donec elit libero, sodales nec, volutpat a, suscipit non, turpis. Nullam sagittis. Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Ut varius tincidunt libero. Phasellus dolor. Maecenas vestibulum mollis diam. Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In dui magna, posuere eget, vestibulum et, tempor auctor, justo. In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Proin sapien ipsum, porta a, auctor quis, euismod ut, mi. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut non enim eleifend felis pretium feugiat. Vivamus quis mi. Phasellus a est. Phasellus magna. In hac habitasse platea dictumst. Curabitur at lacus ac velit ornare lobortis. Curabitur a felis in nunc fringilla tristique. Morbi mattis ullamcorper velit. Phasellus gravida semper nisi. Nullam vel sem. Pellentesque libero tortor, tincidunt et, tincidunt eget, semper nec, quam. Sed hendrerit. Morbi ac felis. Nunc egestas, augue at pellentesque laoreet, felis eros vehicula leo, at malesuada velit leo quis pede. Donec interdum, metus et hendrerit aliquet, dolor diam sagittis ligula, eget egestas libero turpis vel mi. Nunc nulla. Fusce risus nisl, viverra et, tempor et, pretium in, sapien. Donec venenatis vulputate lorem. Morbi nec metus. Phasellus blandit leo ut odio. Maecenas ullamcorper, dui et placerat feugiat, eros pede varius nisi, condimentum viverra felis nunc et lorem. Sed magna purus, fermentum eu, tincidunt eu, varius ut, felis. In auctor lobortis lacus. Quisque libero metus, condimentum nec, tempor a, commodo mollis, magna. Vestibulum ullamcorper mauris at ligula'
    def setUp(self):
        super().setUp()

        # This is an invalid model with story notes length greater than 5000.
        self.story_1 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_1,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes=self.DUMMY_NOTES,
            description='description',
            story_contents=copy.deepcopy({
                'nodes': [{
                    'id': 'node_1111',
                    'title': 'title',
                    'description': 'description',
                    'thumbnail_filename': 'thumbnail_filename.svg',
                    'thumbnail_bg_color': '#F8BF74',
                    'thumbnail_size_in_bytes': None,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': 'outline',
                    'outline_is_finalized': True,
                    'exploration_id': 'exp_id'
                }],
                'initial_node_id': 'node_1111',
                'next_node_id': 'node_2222'
            }),
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment'
            # story_models.StoryModel,
            # id=self.STORY_ID_1,
            # title='title_1',
            # thumbnail_filename='name1.png',
            # thumbnail_bg_color='#000',
            # thumbnail_size_in_bytes=20,
            # description='description_1',
            # notes=self.DUMMY_NOTES,
            # story_contents={
            #     'nodes': [{
            #         'outline': ('<p>Value</p>'),
            #         'exploration_id': None,
            #         'destination_node_ids': [],
            #         'outline_is_finalized': False,
            #         'acquired_skill_ids': [],
            #         'id': 'node_1',
            #         'title': 'Chapter 1',
            #         'description': '',
            #         'prerequisite_skill_ids': [],
            #         'thumbnail_filename': 'image.svg',
            #         'thumbnail_bg_color': None,
            #         'thumbnail_size_in_bytes': 21131,
            #     }],
            #     'initial_node_id': 'node_1',
            #     'next_node_id': 'node_2',
            # },
            # story_contents_schema_version=1,
            # language_code='en',
            # corresponding_topic_id=1,
            # created_on='date',
            # last_updated='date',
            # version=1,
            # url_fragment='url_1',
            # meta_tag_content='story meta content'
        )

        # This is valid model with story notes length greater than 5000.
        self.story_2 = self.create_model(
            story_models.StoryModel,
            id=self.STORY_ID_2,
            story_contents_schema_version=4,
            title='title',
            language_code='cs',
            notes='notes',
            description='description',
            story_contents=copy.deepcopy({
                'nodes': [{
                    'id': 'node_1111',
                    'title': 'title',
                    'description': 'description',
                    'thumbnail_filename': 'thumbnail_filename.svg',
                    'thumbnail_bg_color': '#F8BF74',
                    'thumbnail_size_in_bytes': None,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': 'outline',
                    'outline_is_finalized': True,
                    'exploration_id': 'exp_id'
                }],
                'initial_node_id': 'node_1111',
                'next_node_id': 'node_2222'
            }),
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment'
        )

        # This is an invalid model with story notes length greater than 5000.
        # self.story_3 = self.create_model(
        #     story_models.StoryModel,
        #     id=self.STORY_ID_3,
        #     title='title_3',
        #     thumbnail_filename='name3.png',
        #     thumbnail_bg_color='#ffffff',
        #     thumbnail_size_in_bytes=20,
        #     description='description_3',
        #     notes=self.DUMMY_NOTES+'extra content for testing',
        #     story_contents={
        #         'nodes': [{
        #             'outline': ('<p>Value</p>'),
        #             'exploration_id': None,
        #             'destination_node_ids': [],
        #             'outline_is_finalized': False,
        #             'acquired_skill_ids': [],
        #             'id': 'node_1',
        #             'title': 'Chapter 1',
        #             'description': '',
        #             'prerequisite_skill_ids': [],
        #             'thumbnail_filename': 'image.svg',
        #             'thumbnail_bg_color': None,
        #             'thumbnail_size_in_bytes': 21131,
        #         }],
        #         'initial_node_id': 'node_1',
        #         'next_node_id': 'node_2',
        #     },
        #     story_contents_schema_version=3,
        #     language_code='en',
        #     corresponding_topic_id=3,
        #     version=3,
        #     url_fragment='url_3',
        #     meta_tag_content='story meta content'
        # )

    # def test_run_with_no_models(self) -> None:
    #     self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.story_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('STORY SUCCESS: 1')
        ])

    # def test_run_with_single_invalid_model(self) -> None:
    #     self.put_multi([self.story_1])
    #     self.assert_job_output_is([
    #         job_run_result.JobRunResult.as_stdout('STORY SUCCESS: 1'),
    #         job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
    #         job_run_result.JobRunResult.as_stderr(
    #             f'The id of story is {self.STORY_ID_1} and its actual '
    #             + f'len is {len(self.story_1.notes)}'),
    #     ])

    # def test_run_with_mixed_models(self) -> None:
    #     self.put_multi([self.story_1, self.story_2, self.story_3])
    #     self.assert_job_output_is([
    #         job_run_result.JobRunResult.as_stdout('STORY SUCCESS: 3'),
    #         job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
    #         job_run_result.JobRunResult.as_stderr(
    #             f'The id of story is {self.STORY_ID_1} and its actual '
    #             + f'len is {len(self.story_1.notes)}'),
    #         job_run_result.JobRunResult.as_stderr(
    #             f'The id of story is {self.EXPLORATION_ID_3} and its actual '
    #             + f'len is {len(self.story_3.notes)}'),
    #     ])

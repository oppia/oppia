"""Unit tests for jobs.batch_jobs.topic_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import topic_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.domain import topic_domain

import datetime

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


class ValidateTopicModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[topic_validation_jobs.ValidateTopicModelsJob] = topic_validation_jobs.ValidateTopicModelsJob

    TOPIC_ID: Final = 'topic_id'
    story_id_1: Final = 'story_id_1'
    story_id_2: Final = 'story_id_2'
    story_id_3: Final = 'story_id_3'

    def setUp(self) -> None:
        super().setUp()
        self.CANONICAL_NAME = 'canonical_name'
        self.LANGUAGE_CODE = 'en'
        self.NAME = 'name'
        self.NEXT_SUBTOPIC_ID = 1
        self.PAGE_TITLE_FRAGMENT_FOR_WEB = 'page_title_fragment_for_web'
        self.STORY_REFERENCE_SCHEMA_VERSION = 1
        self.SUBTOPIC_SCHEMA_VERSION = 1
        self.URL_FRAGMENT = 'url_fragment'

    def create_topic_model(self, id, **kwargs):
        default_kwargs = {
            'canonical_name': self.CANONICAL_NAME,
            'language_code': self.LANGUAGE_CODE,
            'name': self.NAME,
            'next_subtopic_id': self.NEXT_SUBTOPIC_ID,
            'page_title_fragment_for_web': self.PAGE_TITLE_FRAGMENT_FOR_WEB,
            'story_reference_schema_version': self.STORY_REFERENCE_SCHEMA_VERSION,
            'subtopic_schema_version': self.SUBTOPIC_SCHEMA_VERSION,
            'url_fragment': self.URL_FRAGMENT,
        }
        default_kwargs.update(kwargs)
        topic_model = self.create_model(topic_models.TopicModel, id=id, **default_kwargs)
        topic_model.update_timestamps()
#         topic_model.put()

        first_topic_rights_model = self.create_model(
            topic_models.TopicRightsModel,
            id=id,
            topic_is_published=False
        )
        first_topic_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        topic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_topic_model_without_summary_model(self) -> None:
           # Create a topic model without a corresponding summary model
           self.create_topic_model(self.TOPIC_ID)

           # Run the job and assert expected output

           self.assert_job_output_is([
           job_run_result.JobRunResult(
                      stdout='',
                      stderr='Invalid TopicModel with id: %s' % self.TOPIC_ID
           ),
           job_run_result.JobRunResult(
                      stdout='CountInvalidTopicModels SUCCESS: 1',
                      stderr=''
           )
           ])

    def test_topic_model_with_summary_model(self) -> None:
        topic_summary_model = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_ID,
            canonical_name=self.CANONICAL_NAME,
            name=self.NAME,
            language_code=self.LANGUAGE_CODE,
            url_fragment=self.URL_FRAGMENT,
            description='dummy description',
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={
                self.story_id_1: [],
                self.story_id_2: [],
                self.story_id_3: []
            },
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow()
        )

        topic_summary_model.update_timestamps()
        self.put_multi([topic_summary_model])
        self.create_topic_model(self.TOPIC_ID)

        self.assert_job_output_is([
        job_run_result.JobRunResult(
            stdout='CountValidTopicModels SUCCESS: 1'
        )
    ])

    def test_multiple_topic_models_with_and_without_summary_models(self) -> None:
        self.create_topic_model(self.TOPIC_ID + '_1')
        self.create_topic_model(self.TOPIC_ID + '_2')
        topic_summary_model_2 = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_ID + '_2',
            canonical_name=self.CANONICAL_NAME,
            name=self.NAME,
            language_code=self.LANGUAGE_CODE,
            url_fragment=self.URL_FRAGMENT,
            description='dummy description',
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={
                self.story_id_1: [],
                self.story_id_2: [],
                self.story_id_3: []
            },
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow()
        )
        topic_summary_model_2.update_timestamps()
        self.create_topic_model(self.TOPIC_ID + '_3')
        topic_summary_model_3 = self.create_model(
            topic_models.TopicSummaryModel,
            id=self.TOPIC_ID + '_3',
            canonical_name=self.CANONICAL_NAME,
            name=self.NAME,
            language_code=self.LANGUAGE_CODE,
            url_fragment=self.URL_FRAGMENT,
            description='dummy description',
            canonical_story_count=0,
            additional_story_count=0,
            total_skill_count=0,
            total_published_node_count=0,
            uncategorized_skill_count=0,
            subtopic_count=0,
            version=1,
            published_story_exploration_mapping={
                self.story_id_1: [],
                self.story_id_2: [],
                self.story_id_3: []
            },
            topic_model_last_updated=datetime.datetime.utcnow(),
            topic_model_created_on=datetime.datetime.utcnow()
        )
        topic_summary_model_3.update_timestamps()
        self.put_multi([topic_summary_model_2, topic_summary_model_3])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='Invalid TopicModel with id: %s' % (self.TOPIC_ID + '_1')
            ),
            job_run_result.JobRunResult(
                stdout='CountInvalidTopicModels SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='CountValidTopicModels SUCCESS: 2'
            )
        ])

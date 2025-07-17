# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for populating the study guide models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import subtopic_page_services
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import subtopic_models
    from mypy_imports import topic_models

(topic_models, subtopic_models) = models.Registry.import_models([
    models.Names.TOPIC, models.Names.SUBTOPIC])
datastore_services = models.Registry.import_datastore_services()


class PopulateStudyGuidesJob(base_jobs.JobBase):
    """Job that populates study guides from subtopic page models."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _create_study_guide_model(
        data_tuple: Tuple[
            str,
            Tuple[
                subtopic_models.SubtopicPageModel,
                topic_models.TopicModel
            ]
        ]
    ) -> result.Result[
        Tuple[
            str,
            Tuple[
                subtopic_models.StudyGuideModel,
                subtopic_models.StudyGuideCommitLogEntryModel
            ]
        ],
     Tuple[str, Exception]
    ]:
        """Creates a study guide model and commit log entry from
            a subtopic page model and topic model.

        Args:
            data_tuple: tuple(SubtopicPageModel, TopicModel). Tuple
                containing subtopic_page_id and tuple of
                (SubtopicPageModel, TopicModel).

        Returns:
            Result((str, (StudyGuideModel, StudyGuideCommitLogEntryModel)),
            (str, Exception)). Result containing tuple which consist of
            subtopic page ID and either tuple of study guide model and
            commit log entry model or Exception. Models are returned when
            the creation was successful and Exception is returned
            otherwise.
        """
        subtopic_page_id, (subtopic_page_model, topic_model) = data_tuple

        try:
            with datastore_services.get_ndb_context():
                subtopic_page = (
                    subtopic_page_services
                    .get_subtopic_page_from_model
                )(subtopic_page_model)
                topic = topic_fetchers.get_topic_from_model(topic_model)

            subtopic_page.validate()

            # Get subtopic_id from subtopic_page_id.
            subtopic_id = subtopic_page.get_subtopic_id_from_subtopic_page_id()

            # Get subtopic title from the topic.
            subtopic_title = topic.subtopics[
                topic.get_subtopic_index(subtopic_id)
            ].title

            # Create sections list with heading and content.
            sections = [
                {
                    'heading': {
                        'content_id': 'section_heading_0',
                        'unicode_str': subtopic_title
                    },
                    'content': {
                        'content_id': 'section_content_1',
                        'html': subtopic_page.page_contents.subtitled_html.html
                    }
                }
            ]

        except Exception as e:
            logging.exception(e)
            return result.Err((subtopic_page_id, e))

        with datastore_services.get_ndb_context():
            study_guide_model = subtopic_models.StudyGuideModel(
                id=subtopic_page_id,
                topic_id=subtopic_page.topic_id,
                sections=sections,
                sections_schema_version=1,
                language_code=subtopic_page.language_code,
                next_content_id_index=2,
                version=1
            )

            # Create commit log entry model.
            commit_cmds = [
                {
                    'cmd': 'create_new',
                    'topic_id': subtopic_page.topic_id,
                    'subtopic_id': subtopic_id
                }
            ]

            study_guide_commit_log_entry_model = (
                subtopic_models
                .StudyGuideCommitLogEntryModel
            )(
                id='studyguide-%s-1' % subtopic_page_id,
                study_guide_id=subtopic_page_id,
                user_id=feconf.MIGRATION_BOT_USER_ID,
                commit_type='create',
                commit_message='created new study guide',
                commit_cmds=commit_cmds,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False,
                version=1
            )

        study_guide_model.update_timestamps()
        study_guide_commit_log_entry_model.update_timestamps()

        return result.Ok(
            (
                subtopic_page_id,
                (
                    study_guide_model,
                    study_guide_commit_log_entry_model
                )
            )
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the study guide
        population.

        Returns:
            PCollection. A PCollection of results from the
            study guide population.
        """
        all_subtopic_page_models = (
            self.pipeline
            | 'Get all subtopic page models' >> (
                ndb_io.GetModels(subtopic_models.SubtopicPageModel.get_all()))
            | 'Add subtopic page keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        all_topic_models = (
            self.pipeline
            | 'Get all topic models' >> (
                ndb_io.GetModels(topic_models.TopicModel.get_all()))
            | 'Add topic keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        # Join subtopic pages with their corresponding topics.
        subtopic_pages_with_topic_keys = (
            all_subtopic_page_models
            | 'Re-key subtopic pages by topic_id' >> beam.Map(
                lambda kv: (kv[1].topic_id, (kv[0], kv[1])))
        )

        joined_data = (
            {
                'subtopic_pages': subtopic_pages_with_topic_keys,
                'topics': all_topic_models
            }
            | 'Join subtopic pages with topics' >> beam.CoGroupByKey()
            | 'Flatten joined data' >> beam.FlatMap(
                lambda kv: [
                    (subtopic_page_id, (subtopic_page_model, topic_model))
                    for (
                        subtopic_page_id,
                        subtopic_page_model
                    ) in kv[1]['subtopic_pages']
                    for topic_model in kv[1]['topics']
                ]
            )
        )

        study_guide_models = (
            joined_data
            | 'Create study guide models' >> beam.Map(
                self._create_study_guide_model)
        )

        created_study_guide_results = (
            study_guide_models
            | 'Generate results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'STUDY GUIDES PROCESSED'))
        )

        study_guide_models_to_put = (
            study_guide_models
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
            | 'Get rid of ID and flatten models' >> beam.FlatMap( # pylint: disable=no-value-for-parameter
                # Extract both models from tuple.
                lambda kv: [kv[1][0], kv[1][1]])
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                study_guide_models_to_put
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return created_study_guide_results


class AuditPopulateStudyGuidesJob(PopulateStudyGuidesJob):
    """Job that audits PopulateStudyGuidesJob."""

    DATASTORE_UPDATES_ALLOWED = False

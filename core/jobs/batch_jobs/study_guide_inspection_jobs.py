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

"""Audit job for the study guide models. Checks if the study guide models have all their corresponding models
(StudyGuideCommitLogEntryModel, StudyGuideSnapshotMetadataModel, StudyGuideSnapshotContentModel).
"""

from __future__ import annotations

import logging

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services, subtopic_models

(subtopic_models,) = models.Registry.import_models([models.Names.SUBTOPIC])
datastore_services = models.Registry.import_datastore_services()


class AuditStudyGuideModelsJob(base_jobs.JobBase):
    """Job that audits study guide models for data integrity.
    
    Checks that each study guide model has corresponding:
    - StudyGuideSnapshotContentModel
    - StudyGuideSnapshotMetadataModel
    - StudyGuideCommitLogEntryModel
    """

    @staticmethod
    def _audit_study_guide_model(
        study_guide_model: subtopic_models.StudyGuideModel
    ) -> result.Result[
        Tuple[str, str],
        Tuple[str, List[str]]
    ]:
        """Audits a study guide model for missing related models.

        Args:
            study_guide_model: StudyGuideModel. The study guide model to audit.

        Returns:
            Result((str, str), (str, List[str])). Result containing tuple of
            study guide ID and status message if OK, or tuple of study guide ID
            and list of missing model errors if Err.
        """
        study_guide_id = study_guide_model.id
        model_version = study_guide_model.version
        missing_models = []

        try:
            with datastore_services.get_ndb_context():
                for version in range(1, model_version + 1):
                    # Check for snapshot content model.
                    snapshot_content_id = '%s-%d' % (study_guide_id, version)
                    snapshot_content_model = (
                        subtopic_models.StudyGuideSnapshotContentModel.get_by_id(
                            snapshot_content_id
                        )
                    )
                    if snapshot_content_model is None:
                        missing_models.append(
                            'StudyGuideSnapshotContentModel with id: %s' % 
                            snapshot_content_id
                        )

                    # Check for snapshot metadata model.
                    snapshot_metadata_id = '%s-%d' % (study_guide_id, version)
                    snapshot_metadata_model = (
                        subtopic_models.StudyGuideSnapshotMetadataModel.get_by_id(
                            snapshot_metadata_id
                        )
                    )
                    if snapshot_metadata_model is None:
                        missing_models.append(
                            'StudyGuideSnapshotMetadataModel with id: %s' % 
                            snapshot_metadata_id
                        )

                    # Check for commit log entry model.
                    commit_log_id = 'studyguide-%s-%d' % (study_guide_id, version)
                    commit_log_model = (
                        subtopic_models.StudyGuideCommitLogEntryModel.get_by_id(
                            commit_log_id
                        )
                    )
                    if commit_log_model is None:
                        missing_models.append(
                            'StudyGuideCommitLogEntryModel with id: %s' % 
                            commit_log_id
                        )

        except Exception as e:
            logging.exception(
                'Error auditing study guide %s: %s' % (study_guide_id, e)
            )
            return result.Err((
                study_guide_id,
                ['Exception during audit: %s' % str(e)]
            ))

        if missing_models:
            return result.Err((study_guide_id, missing_models))

        return result.Ok((
            study_guide_id,
            'Study guide has all required models'
        ))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit results for study guide models.

        Returns:
            PCollection. A PCollection of audit results.
        """
        all_study_guide_models = (
            self.pipeline
            | 'Get all study guide models' >> (
                ndb_io.GetModels(subtopic_models.StudyGuideModel.get_all()))
        )

        audit_results = (
            all_study_guide_models
            | 'Audit study guide models' >> beam.Map(
                self._audit_study_guide_model)
        )

        # Separate successful audits from failures.
        successful_audits = (
            audit_results
            | 'Filter successful audits' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Report successful audits' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'STUDY GUIDES PASSED AUDIT'))
        )

        failed_audits = (
            audit_results
            | 'Filter failed audits' >> beam.Filter(
                lambda result_item: result_item.is_err())
            | 'Unwrap errors' >> beam.Map(
                lambda result_item: result_item.unwrap_err())
            | 'Format error messages' >> beam.Map(
                lambda err_tuple: job_run_result.JobRunResult.as_stderr(
                    'Study guide %s is missing models: %s' % (
                        err_tuple[0],
                        ', '.join(err_tuple[1])
                    )
                )
            )
        )

        return (
            (successful_audits, failed_audits)
            | 'Combine results' >> beam.Flatten()
        )
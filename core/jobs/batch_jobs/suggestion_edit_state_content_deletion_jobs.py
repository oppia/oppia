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

"""Deletion Jobs for edit state content suggestion models"""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models, ) = models.Registry.import_models([
    models.Names.SUGGESTION])


class DeleteDeprecatedSuggestionEditStateContentModelsJob(base_jobs.JobBase):
    """Job that deletes edit state content suggestion models as these are
    deprecated.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        suggestion_edit_state_content_model_to_delete = (
            self.pipeline
            | 'Get all general suggestion models' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all())
            | 'Filter edit state content suggestion' >> (
                beam.Filter(
                    lambda model: ((
                        model.suggestion_type == (
                            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)) and (
                                model.target_type == (
                                    feconf.ENTITY_TYPE_EXPLORATION)))
                ))
        )

        suggestion_edit_state_content_model_to_delete_result = (
            suggestion_edit_state_content_model_to_delete
            | 'Count edit state content suggestion to be deleted' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EDIT STATE CONTENT SUGGESTION'))
        )

        unused_models_deletion = (
            (
                suggestion_edit_state_content_model_to_delete
            )
            | 'Extract keys' >> beam.Map(lambda model: model.key)
            | 'Delete models' >> ndb_io.DeleteModels()
        )
        
        return (
            (
                suggestion_edit_state_content_model_to_delete_result,
            )
            | 'Merge results' >> beam.Flatten()
        )

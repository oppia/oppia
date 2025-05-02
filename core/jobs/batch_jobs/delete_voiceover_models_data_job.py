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

"""Jobs used for deleting instances of VoiceArtistMetadataModel and
ExplorationVoiceArtistsLinkModel.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


class DeleteInstanceofExplorationVoiceArtistsLinkModelJob(
    base_jobs.JobBase):
    """Jobs deletes the instances of ExplorationVoiceArtistsLinkModel."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration IDs which are
        deleted from the exploration voice artist link model.

        Returns:
            PCollection. A PCollection of results for the exploration IDs which
            are deleted from the exploration voice artist link model.
        """
        models_to_be_deleted = (
            self.pipeline
            | 'Get all exploration voice artist link models' >>
                ndb_io.GetModels(
                    voiceover_models.ExplorationVoiceArtistsLinkModel.get_all()
                )
        )

        deleted_models_report_pcollection = (
            models_to_be_deleted
            | 'Report deleted model IDs' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Deleted ExplorationVoiceArtistsLinkModel: %s' % model.id)
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_delete_result = (
                models_to_be_deleted
                | beam.Map(lambda model: model.key)
                | 'Deleting models' >> ndb_io.DeleteModels()
            )

        return deleted_models_report_pcollection


class DeleteInstanceOfVoiceArtistMetadataModelJob(base_jobs.JobBase):
    """Jobs deletes the instances of VoiceArtistMetadataModel."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration IDs which are
        deleted from the voice artist metadata models.

        Returns:
            PCollection. A PCollection of results for the exploration IDs which
            are deleted from the voice artist metadata models.
        """
        models_to_be_deleted = (
            self.pipeline
            | 'Get all voice artist metadata models' >>
                ndb_io.GetModels(
                    voiceover_models.VoiceArtistMetadataModel.get_all()
                )
        )

        deleted_models_report_pcollection = (
            models_to_be_deleted
            | 'Report deleted model IDs' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Deleted VoiceArtistMetadataModel: %s' % model.id)
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_delete_result = (
                models_to_be_deleted
                | beam.Map(lambda model: model.key)
                | 'Deleting models' >> ndb_io.DeleteModels()
            )

        return deleted_models_report_pcollection

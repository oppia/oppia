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

"""Jobs used for deleting instances of EntityVoiceoversModel and
ExplorationVoiceArtistsLinkModel.
"""

from __future__ import annotations

import logging

from core.domain import opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


class DeleteNonCuratedInstanceofExplorationVoiceArtistsLinkModelJob(
    base_jobs.JobBase):
    """Jobs deletes the instances of ExplorationVoiceArtistsLinkModel's which
    corresponds to non-curated explorations.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def is_exploration_curated(exploration_id: str) -> Optional[bool]:
        """Checks whether the provided exploration ID is curated or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration is curated
            or not.
        """
        try:
            with datastore_services.get_ndb_context():
                return (
                    opportunity_services.
                    is_exploration_available_for_contribution(exploration_id)
                )
        except Exception:
            logging.exception(
                'Not able to check whether exploration is curated or not'
                ' for exploration ID %s.' % exploration_id)
            return False

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
            | 'Filter non-curated model instances' >> beam.Filter(
                lambda model: not self.is_exploration_curated(model.id))
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


class AuditExplorationVoiceArtistsLinkModelJob(
    DeleteNonCuratedInstanceofExplorationVoiceArtistsLinkModelJob):
    """ Jobs used for auditing the instances of ExplorationVoiceArtistsLinkModel
    which corresponds to non-curated explorations.
    """

    DATASTORE_UPDATES_ALLOWED = False


class DeleteNonCuratedInstanceofEntityVoiceoversModelJob(
    base_jobs.JobBase):
    """Jobs deletes the instances of EntityVoiceoversModel's which
    corresponds to non-curated explorations.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def is_exploration_curated(exploration_id: str) -> Optional[bool]:
        """Checks whether the provided exploration ID is curated or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration is curated
            or not.
        """
        try:
            with datastore_services.get_ndb_context():
                return (
                    opportunity_services.
                    is_exploration_available_for_contribution(exploration_id)
                )
        except Exception:
            logging.exception(
                'Not able to check whether exploration is curated or not'
                ' for exploration ID %s.' % exploration_id)
            return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration IDs which are
        deleted from the entity voiceover models.

        Returns:
            PCollection. A PCollection of results for the exploration IDs which
            are deleted from the entity voiceover models.
        """
        models_to_be_deleted = (
            self.pipeline
            | 'Get all entity voiceover models' >>
                ndb_io.GetModels(
                    voiceover_models.EntityVoiceoversModel.get_all()
                )
            | 'Filter non-curated model instances' >> beam.Filter(
                lambda model: not self.is_exploration_curated(model.entity_id))
        )

        deleted_models_report_pcollection = (
            models_to_be_deleted
            | 'Report deleted model IDs' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Deleted EntityVoiceoversModel: %s' % model.id)
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_delete_result = (
                models_to_be_deleted
                | beam.Map(lambda model: model.key)
                | 'Deleting models' >> ndb_io.DeleteModels()
            )

        return deleted_models_report_pcollection


class AuditEntityVoiceoversModelJob(
    DeleteNonCuratedInstanceofEntityVoiceoversModelJob):
    """ Jobs used for auditing the instances of EntityVoiceoversModel
    which corresponds to non-curated explorations.
    """

    DATASTORE_UPDATES_ALLOWED = False

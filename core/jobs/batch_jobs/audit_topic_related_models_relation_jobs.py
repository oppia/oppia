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

"""Audit jobs that validate relations of Topic models, Topic Rights models,
Topic Summary models in the datastore."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs import job_utils
from core.jobs.io import ndb_io
from core.jobs.types import base_validation_errors
from core.jobs.types import model_property
from core.platform import models

import apache_beam as beam

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([
    models.Names.TOPIC])


class ValidateTopicModelsJob(base_jobs.JobBase):
    """Job that validates Topic models and their associated models."""

    def run(self) -> beam.PCollection[base_validation_errors.BaseAuditError]:
        """Returns a PCollection of audit errors aggregated from all
        Topic models.

        Returns:
            PCollection. A PCollection of audit errors discovered during the
            validation.
        """
        topic_models_pcoll = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(
                    include_deleted=False))
        )

        topic_rights_models_pcoll = (
            self.pipeline
            | 'Get all TopicRightsModels' >> ndb_io.GetModels(
                topic_models.TopicRightsModel.get_all(
                    include_deleted=False))
        )

        topic_summary_models_pcoll = (
            self.pipeline
            | 'Get all TopicSummaryModels' >> ndb_io.GetModels(
                topic_models.TopicSummaryModel.get_all(
                    include_deleted=False))
        )

        return (
            topic_models_pcoll
            | 'Validate Topic Models' >> beam.ParDo(
                self._validate_topic_models,
                beam.pvalue.AsIter(topic_rights_models_pcoll),
                beam.pvalue.AsIter(topic_summary_models_pcoll)))

    def _validate_topic_models(
        self,
        topic_model: topic_models.TopicModel,
        topic_rights_models: List[topic_models.TopicRightsModel],
        topic_summary_models: List[topic_models.TopicSummaryModel]
    ) -> List[base_validation_errors.ModelRelationshipError]:
        """Validates that the given TopicModel has corresponding
        TopicRightsModels and TopicSummaryModels. Yields validation
        errors if any of these relationships are missing.

        Args:
            topic_model: TopicModel. The TopicModel instance to validate.
            topic_rights_models: List[TopicRightsModel]. List of
                TopicRightsModel.
            topic_summary_models: List[TopicSummaryModel]. List of
                TopicSummaryModel.

        Returns:
            List[String]. List of validation errors (if any).
        """
        errors = []

        if not any(
            rights_model.id == topic_model.id
            for rights_model in topic_rights_models):
            errors.append(
                base_validation_errors.ModelRelationshipError(
                id_property=model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                model_id=job_utils.get_model_id(topic_model),
                target_kind='TopicRightsModel',
                target_id=topic_model.name
            ))

        if not any(
            summary_model.id == topic_model.id
            for summary_model in topic_summary_models):
            errors.append(
                base_validation_errors.ModelRelationshipError(
                id_property=model_property.ModelProperty(
                    topic_models.TopicModel,
                    topic_models.TopicModel.name),
                model_id=job_utils.get_model_id(topic_model),
                target_kind='TopicSummaryModel',
                target_id=topic_model.name))
        return errors

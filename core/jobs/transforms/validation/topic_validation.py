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

"""Beam DoFns and PTransforms to provide validation of topic models."""

from __future__ import annotations

from core.domain import topic_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.jobs.types import topic_validation_errors
from core.platform import models

import apache_beam as beam

(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


@validation_decorators.AuditsExisting(topic_models.TopicModel)
class ValidateCanonicalNameMatchesNameInLowercase(beam.DoFn):
    """DoFn to validate canonical name matching with lower case name."""

    def process(self, input_model):
        """Function that validate that canonical name of the model is same as
        name of the model in lowercase.

        Args:
            input_model: datastore_services.Model. TopicModel to validate.

        Yields:
            ModelCanonicalNameMismatchError. An error class for
            name mismatched models.
        """
        model = job_utils.clone_model(input_model)
        name = model.name
        if name.lower() != model.canonical_name:
            yield topic_validation_errors.ModelCanonicalNameMismatchError(model)


@validation_decorators.AuditsExisting(
    topic_models.TopicSnapshotMetadataModel)
class ValidateTopicSnapshotMetadataModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for TopicSnapshotMetadataModel."""

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            topic_domain.TopicChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return topic_domain.TopicChange


@validation_decorators.AuditsExisting(
    topic_models.TopicRightsSnapshotMetadataModel)
class ValidateTopicRightsSnapshotMetadataModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for TopicRightsSnapshotMetadataModel.
    """

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            topic_domain.TopicRightsChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return topic_domain.TopicRightsChange


@validation_decorators.AuditsExisting(topic_models.TopicCommitLogEntryModel)
class ValidateTopicCommitLogEntryModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for TopicCommitLogEntryModel.
    """

    def _get_change_domain_class(self, input_model):
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            topic_domain.TopicRightsChange|topic_domain.TopicChange.
            A domain object class for the changes made by commit commands of
            the model.
        """
        model = job_utils.clone_model(input_model)
        if model.id.startswith('rights'):
            return topic_domain.TopicRightsChange
        elif model.id.startswith('topic'):
            return topic_domain.TopicChange
        else:
            return None


@validation_decorators.RelationshipsOf(topic_models.TopicSummaryModel)
def topic_summary_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [topic_models.TopicModel]
    yield model.id, [topic_models.TopicRightsModel]

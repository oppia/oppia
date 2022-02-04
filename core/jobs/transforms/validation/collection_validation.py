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

"""Beam DoFns and PTransforms to provide validation of collection models."""

from __future__ import annotations

from core.domain import collection_domain
from core.domain import rights_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.platform import models

(collection_models,) = models.Registry.import_models([models.Names.COLLECTION])


@validation_decorators.AuditsExisting(
    collection_models.CollectionSnapshotMetadataModel)
class ValidateCollectionSnapshotMetadataModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for CollectionSnapshotMetadataModel.
    """

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            collection_domain.CollectionChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return collection_domain.CollectionChange


@validation_decorators.RelationshipsOf(collection_models.CollectionSummaryModel)
def collection_summary_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [collection_models.CollectionModel]
    yield model.id, [collection_models.CollectionRightsModel]


@validation_decorators.AuditsExisting(
    collection_models.CollectionRightsSnapshotMetadataModel)
class ValidateCollectionRightsSnapshotMetadataModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for
    CollectionRightsSnapshotMetadataModel.
    """

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            rights_domain.CollectionRightsChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return rights_domain.CollectionRightsChange


@validation_decorators.AuditsExisting(
    collection_models.CollectionCommitLogEntryModel)
class ValidateCollectionCommitLogEntryModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for CollectionCommitLogEntryModel."""

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            collection_domain.CollectionChange|
            rights_domain.CollectionRightsChange.
            A domain object class for the changes made by commit commands of
            the model.
        """
        model = job_utils.clone_model(input_model)

        if model.id.startswith('rights'):
            return rights_domain.CollectionRightsChange
        elif model.id.startswith('collection'):
            return collection_domain.CollectionChange
        else:
            return None

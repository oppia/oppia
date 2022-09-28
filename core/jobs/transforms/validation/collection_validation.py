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
from core.jobs.types import model_property
from core.platform import models

from typing import Iterator, List, Optional, Tuple, Type, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models

(collection_models,) = models.Registry.import_models([models.Names.COLLECTION])


@validation_decorators.AuditsExisting(
    collection_models.CollectionSnapshotMetadataModel)
class ValidateCollectionSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        collection_models.CollectionSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for CollectionSnapshotMetadataModel.
    """

    def _get_change_domain_class(
        self, input_model: collection_models.CollectionSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[collection_domain.CollectionChange]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            collection_domain.CollectionChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return collection_domain.CollectionChange


@validation_decorators.RelationshipsOf(collection_models.CollectionSummaryModel)
def collection_summary_model_relationships(
    model: Type[collection_models.CollectionSummaryModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            collection_models.CollectionModel,
            collection_models.CollectionRightsModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [collection_models.CollectionModel]
    yield model.id, [collection_models.CollectionRightsModel]


@validation_decorators.AuditsExisting(
    collection_models.CollectionRightsSnapshotMetadataModel)
class ValidateCollectionRightsSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        collection_models.CollectionRightsSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for
    CollectionRightsSnapshotMetadataModel.
    """

    def _get_change_domain_class(
        self,
        input_model: collection_models.CollectionRightsSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[rights_domain.CollectionRightsChange]:
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
    base_validation.BaseValidateCommitCmdsSchema[
        collection_models.CollectionCommitLogEntryModel
    ]
):
    """Overrides _get_change_domain_class for CollectionCommitLogEntryModel."""

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with super class's _get_change_domain_class() method.
    def _get_change_domain_class(  # type: ignore[override]
        self, input_model: collection_models.CollectionCommitLogEntryModel
    ) -> Optional[
        Type[Union[
            rights_domain.CollectionRightsChange,
            collection_domain.CollectionChange
        ]]
    ]:
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

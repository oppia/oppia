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

"""Beam DoFns and PTransforms to provide validation of exploration models."""

from __future__ import annotations

from core.domain import exp_domain
from core.domain import rights_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.jobs.types import model_property
from core.platform import models

from typing import Iterator, List, Optional, Tuple, Type, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import story_models

(exp_models, story_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.STORY
])


@validation_decorators.AuditsExisting(
    exp_models.ExplorationSnapshotMetadataModel)
class ValidateExplorationSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        exp_models.ExplorationSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for exploration models """

    def _get_change_domain_class(
        self, input_model: exp_models.ExplorationSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[exp_domain.ExplorationChange]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            exp_domain.ExplorationChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return exp_domain.ExplorationChange

# TODO(#12688): Implement the skipped model.ID relationship checks (listed in
# 12688). These are skipped at the moment as, Realationshipsof is only capable
# of handling straigtforward model.ID relations.


@validation_decorators.RelationshipsOf(exp_models.ExplorationContextModel)
def exploration_context_model_relationships(
    model: Type[exp_models.ExplorationContextModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[story_models.StoryModel, exp_models.ExplorationModel]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.story_id, [story_models.StoryModel]
    yield model.id, [exp_models.ExplorationModel]


@validation_decorators.RelationshipsOf(exp_models.ExpSummaryModel)
def exp_summary_model_relationships(
    model: Type[exp_models.ExpSummaryModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            exp_models.ExplorationModel, exp_models.ExplorationRightsModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [exp_models.ExplorationModel]
    yield model.id, [exp_models.ExplorationRightsModel]


@validation_decorators.AuditsExisting(
    exp_models.ExplorationRightsSnapshotMetadataModel)
class ValidateExplorationRightsSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        exp_models.ExplorationRightsSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for exploration models """

    def _get_change_domain_class(
        self, input_model: exp_models.ExplorationRightsSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[rights_domain.ExplorationRightsChange]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            rights_domain.ExplorationRightsChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return rights_domain.ExplorationRightsChange


@validation_decorators.AuditsExisting(
    exp_models.ExplorationCommitLogEntryModel)
class ValidateExplorationCommitLogEntryModel(
    base_validation.BaseValidateCommitCmdsSchema[
        exp_models.ExplorationCommitLogEntryModel
    ]
):
    """Overrides _get_change_domain_class for exploration models """

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with super class's _get_change_domain_class() method.
    def _get_change_domain_class(  # type: ignore[override]
        self, input_model: exp_models.ExplorationCommitLogEntryModel
    ) -> Optional[
        Type[Union[
            rights_domain.ExplorationRightsChange,
            exp_domain.ExplorationChange
        ]]
    ]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            rights_domain.ExplorationRightsChange|exp_domain.ExplorationChange.
            A domain object class for the changes made by commit commands of
            the model.
        """
        model = job_utils.clone_model(input_model)
        if model.id.startswith('rights'):
            return rights_domain.ExplorationRightsChange
        elif model.id.startswith('exploration'):
            return exp_domain.ExplorationChange
        else:
            return None

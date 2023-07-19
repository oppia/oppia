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

"""Beam DoFns and PTransforms to provide validation of auth models."""

from __future__ import annotations

from core import feconf
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.platform import models

from typing import Iterator, List, Tuple, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import datastore_services

(auth_models,) = models.Registry.import_models([models.Names.AUTH])

datastore_services = models.Registry.import_datastore_services()


@validation_decorators.AuditsExisting(auth_models.FirebaseSeedModel)
class ValidateFirebaseSeedModelId(base_validation.ValidateBaseModelId):
    """Overrides regex to match the single valid FirebaseSeedModel ID."""

    def __init__(self) -> None:
        super().__init__()
        self._pattern = auth_models.ONLY_FIREBASE_SEED_MODEL_ID


@validation_decorators.AuditsExisting(auth_models.UserIdByFirebaseAuthIdModel)
class ValidateUserIdByFirebaseAuthIdModelId(
        base_validation.ValidateBaseModelId):
    """Overrides regex to match the Firebase account ID pattern."""

    def __init__(self) -> None:
        super().__init__()
        self._pattern = feconf.FIREBASE_AUTH_ID_REGEX


@validation_decorators.RelationshipsOf(auth_models.UserAuthDetailsModel)
def user_auth_details_model_relationships(
    model: Type[auth_models.UserAuthDetailsModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            auth_models.UserIdByFirebaseAuthIdModel,
            auth_models.UserIdentifiersModel
        ]]]
    ]
]:
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.firebase_auth_id, [auth_models.UserIdByFirebaseAuthIdModel])
    yield (model.gae_id, [auth_models.UserIdentifiersModel])


@validation_decorators.RelationshipsOf(auth_models.UserIdByFirebaseAuthIdModel)
def user_id_by_firebase_auth_id_model_relationships(
    model: Type[auth_models.UserIdByFirebaseAuthIdModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[auth_models.UserAuthDetailsModel]]
    ]
]:
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.user_id, [auth_models.UserAuthDetailsModel])


@validation_decorators.RelationshipsOf(auth_models.UserIdentifiersModel)
def user_identifiers_model_relationships(
    model: Type[auth_models.UserIdentifiersModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[auth_models.UserAuthDetailsModel]]
    ]
]:
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.user_id, [auth_models.UserAuthDetailsModel])

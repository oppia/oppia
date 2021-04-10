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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs.decorators import audit_decorators
from jobs.transforms import base_model_audits

(auth_models, user_models) = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))


@audit_decorators.AuditsExisting(auth_models.FirebaseSeedModel)
class ValidateFirebaseSeedModelId(base_model_audits.ValidateBaseModelId):
    """Overrides regex to match the single valid FirebaseSeedModel ID."""

    def __init__(self):
        super(ValidateFirebaseSeedModelId, self).__init__()
        self._pattern = auth_models.ONLY_FIREBASE_SEED_MODEL_ID


@audit_decorators.AuditsExisting(auth_models.UserIdByFirebaseAuthIdModel)
class ValidateUserIdByFirebaseAuthIdModelId(
        base_model_audits.ValidateBaseModelId):
    """Overrides regex to match the Firebase account ID pattern."""

    def __init__(self):
        super(ValidateUserIdByFirebaseAuthIdModelId, self).__init__()
        self._pattern = feconf.FIREBASE_AUTH_ID_REGEX


@audit_decorators.RelationshipsOf(auth_models.UserAuthDetailsModel)
def user_auth_details_model_relationships(model):
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.firebase_auth_id, [auth_models.UserIdByFirebaseAuthIdModel])
    yield (model.gae_id, [auth_models.UserIdentifiersModel])


@audit_decorators.RelationshipsOf(auth_models.UserIdByFirebaseAuthIdModel)
def user_id_by_firebase_auth_id_model_relationships(model):
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.user_id, [auth_models.UserAuthDetailsModel])


@audit_decorators.RelationshipsOf(auth_models.UserIdentifiersModel)
def user_identifiers_model_relationships(model):
    """Yields how the properties of the model relate to the IDs of others."""
    yield (model.user_id, [auth_models.UserAuthDetailsModel])

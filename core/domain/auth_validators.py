# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for auth models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models

(auth_models, user_models) = models.Registry.import_models(
    [models.NAMES.auth, models.NAMES.user])


class UserIdByFirebaseAuthIdModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UserIdByFirebaseAuthIdModels."""

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        # Firebase only constrains IDs to be between 1 and 128 characters:
        # https://firebase.google.com/docs/auth/admin/manage-users#create_a_user
        if len(item.id) > 128:
            cls._add_error(
                'model %s' % (base_model_validators.ERROR_CATEGORY_ID_CHECK,),
                'Entity id %s: Firebase ID len must be in range [1, 128)' % (
                    item.id.decode('utf-8')))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids',
                user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'user_auth_details_ids',
                user_models.UserAuthDetailsModel,
                [item.user_id])
        ]

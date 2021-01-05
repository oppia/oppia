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

user_models, = models.Registry.import_models([models.NAMES.user])


class UserIdByFirebaseAuthIdModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UserIdByFirebaseAuthIdModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        # Firebase *explicitly* requires IDs to have at most 128 characters:
        # https://firebase.google.com/docs/auth/admin/manage-users#create_a_user
        #
        # After manually inspecting ~200 of them, however, we've also found that
        # they only use alpha-numeric characters, hence the tighter restriction.
        return '^[A-Za-z0-9]{1,128}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'user_auth_details_ids',
                user_models.UserAuthDetailsModel,
                [item.user_id]),
        ]

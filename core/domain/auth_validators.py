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
import feconf

auth_models, = models.Registry.import_models([models.NAMES.auth])


class UserAuthDetailsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserAuthDetailsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
        ]
        if item.parent_user_id is None:
            # Full users (users without a parent) should have a valid auth ID.
            if item.gae_id is not None:
                external_id_relationships.append(
                    base_model_validators.ExternalModelFetcherDetails(
                        'auth_ids',
                        auth_models.UserIdentifiersModel,
                        [item.gae_id]))
            if item.firebase_auth_id is not None:
                external_id_relationships.append(
                    base_model_validators.ExternalModelFetcherDetails(
                        'auth_ids',
                        auth_models.UserIdByFirebaseAuthIdModel,
                        [item.firebase_auth_id]))
        else:
            # Profile users (users with a parent) should have a valid parent ID.
            external_id_relationships.append(
                base_model_validators.UserSettingsModelFetcherDetails(
                    'parent_user_settings_ids', [item.parent_user_id],
                    may_contain_system_ids=False,
                    may_contain_pseudonymous_ids=False))
        return external_id_relationships


class UserIdentifiersModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating UserIdentifiersModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[0-9]{1,24}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        Args:
            item: auth_models.UserIdentifiersModel. Entity to validate.

        Returns:
            list(ExternalModelFetcherDetails). A list whose values are
            ExternalModelFetcherDetails instances each representing
            the class and ids for a single type of external model to fetch.
        """
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'user_auth_details_ids',
                auth_models.UserAuthDetailsModel,
                [item.user_id]),
        ]


class UserIdByFirebaseAuthIdModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UserIdByFirebaseAuthIdModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return feconf.FIREBASE_AUTH_ID_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        Args:
            item: auth_models.UserIdByFirebaseAuthIdModel. Entity to validate.

        Returns:
            list(ExternalModelFetcherDetails). A list whose values are
            ExternalModelFetcherDetails instances each representing
            the class and ids for a single type of external model to fetch.
        """
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'user_auth_details_ids',
                auth_models.UserAuthDetailsModel,
                [item.user_id]),
        ]


class FirebaseSeedModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating FirebaseSeedModel."""

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        if item.id != auth_models.ONLY_FIREBASE_SEED_MODEL_ID:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id must be %s' % (
                    item.id, auth_models.ONLY_FIREBASE_SEED_MODEL_ID))

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        Args:
            item: auth_models.FirebaseSeedModel. Entity to validate.

        Returns:
            list(ExternalModelFetcherDetails). A list whose values are
            ExternalModelFetcherDetails instances each representing
            the class and ids for a single type of external model to fetch.
        """
        return []

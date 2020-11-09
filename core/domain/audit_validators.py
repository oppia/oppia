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

"""Validators for audit models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])


class RoleQueryAuditModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating RoleQueryAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [user_id].[timestamp_in_sec].[intent].[random_number]
        regex_string = '^%s\\.\\d+\\.%s\\.\\d+$' % (item.user_id, item.intent)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_ids', user_models.UserSettingsModel, [item.user_id])]


class UsernameChangeAuditModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UsernameChangeAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [committer_id].[timestamp_in_sec]
        # committer_id refers to the user that is making the change.
        regex_string = '^%s\\.\\d+$' % item.committer_id
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]

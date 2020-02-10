# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Models for activity references."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import core.storage.base_model.gae_models as base_models
import feconf

from google.appengine.ext import ndb


class ActivityReferencesModel(base_models.BaseModel):
    """Storage model for a list of activity references.

    The id of each model instance is the name of the list. This should be one
    of the constants in feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES.
    """
    # The types and ids of activities to show in the library page. Each item
    # in this list is a dict with two keys: 'type' and 'id'.
    activity_references = ndb.JsonProperty(repeated=True)

    @staticmethod
    def get_deletion_policy():
        """ActivityReferencesModel are not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """ActivityReferencesModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_or_create(cls, list_name):
        """This creates the relevant model instance, if it does not already
        exist.
        """
        if list_name not in feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES:
            raise Exception(
                'Invalid ActivityListModel id: %s' % list_name)

        entity = cls.get(list_name, strict=False)
        if entity is None:
            entity = cls(id=list_name, activity_references=[])
            entity.put()

        return entity

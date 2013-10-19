# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Models for Oppia users."""

__author__ = 'Stephanie Federwisch'

import logging

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb

QUERY_LIMIT = 100

class UserSettingsModel(base_models.BaseModel):
    """Settings and preferences for a particular user.

    The id/key of instances of this class has the form
        [USER_ID].
    """
    # Identifiable username to display in the UI
    username = ndb.StringProperty(indexed=True)

    # Normalized username
    normalized_username = ndb.StringProperty(indexed=True)

    @classmethod
    def get_or_create(cls, user_id):
        user_settings = cls.get(user_id, strict=False)
        if not user_settings:
            user_settings = cls(id=user_id)
        return user_settings

    @classmethod
    def is_normalized_username_taken(cls, normalized_username):
        """Returns whether or a given normalized_username is taken."""
        return bool(cls.get_all().filter(
            cls.normalized_username == normalized_username).get())

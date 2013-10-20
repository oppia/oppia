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

import core.storage.base_model.models as base_models

from django.db import models


class UserSettingsModel(base_models.BaseModel):
    """A settings and preferences for a particular user.

    The id/key of instances of this class has the form
        [USER_ID].
    """
    # Identifiable username to display in the UI
    username = models.CharField(max_length=100)

    # Normalized username
    normalized_username = models.CharField(max_length=100)

    @classmethod
    def get_or_create(cls, user_id):
        user_prefs = cls.get(user_id, strict=False)
        if not user_prefs:
            user_prefs = cls(id=user_id)
        return user_prefs

    @classmethod
    def is_normalized_username_taken(cls, username):
        """Returns whether or a given username is taken."""
        return len(cls.objects.filter(normalized_username=username)) > 0

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
    """Settings and preferences for a particular user.

    Instances of this class are keyed by the user id.
    """
    # Email address of the user.
    email = models.CharField(max_length=100)

    # Identifiable username to display in the UI
    username = models.CharField(max_length=100, blank=True)
    # Normalized username
    normalized_username = models.CharField(max_length=100, blank=True)
    # When the user last agreed to the terms of the site.
    last_updated = models.DateTimeField(blank=True)

    @classmethod
    def is_normalized_username_taken(cls, username):
        """Returns whether or a given username is taken."""
        return len(cls.objects.filter(normalized_username=username)) > 0

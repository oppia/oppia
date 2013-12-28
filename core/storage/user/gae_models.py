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

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb


class UserSettingsModel(base_models.BaseModel):
    """Settings and preferences for a particular user.

    Instances of this class are keyed by the user id.
    """
    # Email address of the user.
    email = ndb.StringProperty(required=True, indexed=True)

    # Identifiable username to display in the UI.
    username = ndb.StringProperty(indexed=True)
    # Normalized username (for catching duplicates).
    normalized_username = ndb.StringProperty(indexed=True)
    # When the user last agreed to the terms of the site.
    last_agreed_to_terms = ndb.DateTimeProperty(default=None)

    @classmethod
    def is_normalized_username_taken(cls, normalized_username):
        """Returns whether or a given normalized_username is taken."""
        return bool(cls.get_all().filter(
            cls.normalized_username == normalized_username).get())

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

"""Services for user data."""

__author__ = 'Stephanie Federwisch'

from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])

def set_username(user_id, username):
    """Sets the username for a given user."""
    user_settings = user_models.UserSettingsModel.get_or_create(user_id)
    user_settings.username = username
    user_settings.normalized_username = username.lower()
    user_settings.put()


def get_username(user_id):
    """Gets the username for a given user."""
    user_settings = user_models.UserSettingsModel.get_or_create(user_id)
    return user_settings.username if user_settings.username else None


def is_username_taken(username):
    """Normalizes the username and checks if that is taken.
       Normalizing is lowercasing at this point."""
    return user_models.UserSettingsModel.is_username_taken(username.lower())
   

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

"""Domain object for users models."""

__author__ = 'Stephanie	Federwisch'

import copy
import operator

from core.platform import models
(users_models,) = models.Registry.import_models([models.NAMES.users])


class UserSettings(object):
    """Domain object that keeps settings for specific users.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """

    @classmethod
    def set_username(cls, user_id, username):
      """Sets the username for a given user."""
      user_prefs = users_models.UserSettingsModel.get_or_create(user_id)
      if not users_models.UserSettingsModel.is_unique(username):
          logging.info("THIS IS NOT UNIQUE")
      user_prefs.username = username
      user_prefs.put()

    @classmethod
    def get_username(cls, user_id):
      """Gets the username for a given user."""
      user_prefs = users_models.UserSettingsModel.get_or_create(user_id)
      if user_prefs.username:
         return username
      else:
         return ""


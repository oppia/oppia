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

from core.domain import users_domain


def set_username(user_id, username):
    """Sets the username for the given user."""
    users_domain.UserSettings.set_username(user_id, username)

def get_username(user_id):
    """Gets the username for the given user."""
    return users_domain.UserSettings.get_username(user_id)

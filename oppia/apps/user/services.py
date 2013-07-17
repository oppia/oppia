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

"""Provides a seam for user-related services."""

__author__ = 'Sean Lip'


from google.appengine.api import users

def create_login_url(slug):
    """Creates a login url."""
    return users.create_login_url(slug)


def create_logout_url(slug):
    """Creates a logout url."""
    return users.create_logout_url(slug)


def is_current_user_admin():
    """Checks whether the current user is an admin."""
    return users.is_current_user_admin()


def get_current_user():
    """Returns the current user."""
    return users.get_current_user()

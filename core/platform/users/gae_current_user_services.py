# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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


import utils

from google.appengine.api import users
from google.appengine.ext import ndb


def create_login_url(slug):
    """Creates a login url."""
    return users.create_login_url(slug)


def create_logout_url(slug):
    """Creates a logout url."""
    return users.create_logout_url(slug)


def get_current_user(request):
    """Returns the current user."""
    return users.get_current_user()


def is_super_admin(user_id, request):
    """Checks whether the user with the given user_id owns this app.

    For GAE, the user in question is also required to be the current user.
    """
    user = users.get_current_user()
    if user is None:
        return False

    return user.user_id() == user_id and users.is_current_user_admin()


def get_user_id_from_email(email):
    """Given an email address, returns a user id.

    Returns None if the email address does not correspond to a valid user id.
    """
    class _FakeUser(ndb.Model):
        _use_memcache = False
        _use_cache = False
        user = ndb.UserProperty(required=True)

    try:
        u = users.User(email)
    except users.UserNotFoundError:
        raise utils.InvalidInputException(
            'User with email address %s not found' % email)

    key = _FakeUser(user=u).put()
    obj = _FakeUser.get_by_id(key.id())
    user_id = obj.user.user_id()
    if user_id:
        return unicode(user_id)
    else:
        return None


def get_user_id(user):
    """ Given an user object, get the user id. """
    return user.user_id()


def get_user_email(user):
    """ Given an user object, get the user's email. """
    return user.email()

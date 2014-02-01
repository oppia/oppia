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

__author__ = 'Tarashish Mishra'

from django.contrib.sessions.models import Session
from django.contrib.auth.models import User


def create_login_url(slug):
    """Creates a login url."""
    # Currently we have no way to implement this on non-GAE platforms
    # as a stand alone app.
    return ''


def create_logout_url(slug):
    """Creates a logout url."""
    # Currently we have no way to implement this on non-GAE platforms
    # as a stand alone app.
    return ''


def is_current_user_super_admin(request=None):
    """Checks whether the current user owns this app."""
    user = get_current_user(request)
    if user:
        return user.is_superuser
    else:
        return False


def get_current_user(request):
    """Returns the current user."""
    session_key = request.cookies.get('sessionid')
    try:
        session = Session.objects.get(session_key=session_key)
        uid = session.get_decoded().get('_auth_user_id')
        user = User.objects.get(pk=uid)
        return user
    except Session.DoesNotExist:
        return None


def get_user_id_from_email(email):
    """Given an email address, return a user id.

    Returns None if the email address does not correspond to a valid user id.
    """
    return email

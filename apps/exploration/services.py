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

"""Commands that can be used to operate on Oppia explorations."""

__author__ = 'Sean Lip'

import feconf

from apps.exploration.models import Exploration
from google.appengine.api import users
from google.appengine.ext import ndb


# Methods for managing rights.
def is_owner(user, exploration):
    """Returns whether the given user owns the exploration."""
    if is_demo(exploration):
        return users.is_current_user_admin()
    else:
        return user and user == exploration.editors[0]


def is_editor(user, exploration):
    """Checks whether the given user has rights to edit this exploration."""
    return user and (
        user in exploration.editors or users.is_current_user_admin())


def get_viewable_explorations(user):
    """Returns a list of explorations viewable by the given user."""
    return Exploration.query().filter(
        ndb.OR(Exploration.is_public == True, Exploration.editors == user)
    )


def get_editable_explorations(user):
    """Returns a list of explorations editable by the given user."""
    return [exploration for exploration in get_viewable_explorations(user)
            if is_editor(user, exploration)]


# Methods characterizing individual explorations.
def is_demo(exploration):
    """Checks if the exploration is one of the demo explorations."""
    return exploration.id.isdigit() and (
        0 <= int(exploration.id) < len(feconf.DEMO_EXPLORATIONS))

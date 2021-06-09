# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""This module contains the structure of roles and actions,
actions permitted to the roles and the functions needed to access roles
and actions.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import math
import random
import time

from core.platform import models
import feconf

(audit_models,) = models.Registry.import_models([models.NAMES.audit])

# Actions that can be performed in the system.
ACTION_ACCEPT_ANY_SUGGESTION = 'ACCEPT_ANY_SUGGESTION'
ACTION_ACCEPT_ANY_VOICEOVER_APPLICATION = (
    'ACTION_ACCEPT_ANY_VOICEOVER_APPLICATION')
ACTION_ACCESS_CREATOR_DASHBOARD = 'ACCESS_CREATOR_DASHBOARD'
ACTION_ACCESS_LEARNER_DASHBOARD = 'ACCESS_LEARNER_DASHBOARD'
ACTION_ACCESS_MODERATOR_PAGE = 'ACCESS_MODERATOR_PAGE'
ACTION_ACCESS_RELEASE_COORDINATOR_PAGE = 'ACCESS_RELEASE_COORDINATOR_PAGE'
ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD = 'ACCESS_TOPICS_AND_SKILLS_DASHBOARD'
ACTION_CHANGE_TOPIC_STATUS = 'CHANGE_TOPIC_STATUS'
ACTION_CHANGE_STORY_STATUS = 'CHANGE_STORY_STATUS'
ACTION_CREATE_COLLECTION = 'CREATE_COLLECTION'
ACTION_CREATE_EXPLORATION = 'CREATE_EXPLORATION'
ACTION_CREATE_NEW_SKILL = 'CREATE_NEW_SKILL'
ACTION_CREATE_NEW_TOPIC = 'CREATE_NEW_TOPIC'
ACTION_MANAGE_QUESTION_SKILL_STATUS = 'MANAGE_QUESTION_SKILL_STATUS'
ACTION_DELETE_ANY_ACTIVITY = 'DELETE_ANY_ACTIVITY'
ACTION_DELETE_ANY_PUBLIC_ACTIVITY = 'DELETE_ANY_PUBLIC_ACTIVITY'
ACTION_DELETE_ANY_QUESTION = 'DELETE_ANY_QUESTION'
ACTION_DELETE_ANY_SKILL = 'DELETE_ANY_SKILL'
ACTION_DELETE_OWNED_PRIVATE_ACTIVITY = 'DELETE_OWNED_PRIVATE_ACTIVITY'
ACTION_DELETE_TOPIC = 'DELETE_TOPIC'
ACTION_EDIT_ANY_ACTIVITY = 'EDIT_ANY_ACTIVITY'
ACTION_EDIT_ANY_PUBLIC_ACTIVITY = 'EDIT_ANY_PUBLIC_ACTIVITY'
ACTION_EDIT_ANY_QUESTION = 'EDIT_ANY_QUESTION'
ACTION_EDIT_ANY_SKILL = 'EDIT_ANY_SKILL'
ACTION_EDIT_ANY_SUBTOPIC_PAGE = 'EDIT_ANY_SUBTOPIC_PAGE'
ACTION_EDIT_ANY_TOPIC = 'EDIT_ANY_TOPIC'
ACTION_RUN_ANY_JOB = 'RUN_ANY_JOB'
ACTION_EDIT_ANY_STORY = 'EDIT_ANY_STORY'
ACTION_EDIT_OWNED_ACTIVITY = 'EDIT_OWNED_ACTIVITY'
ACTION_EDIT_OWNED_TOPIC = 'EDIT_OWNED_TOPIC'
ACTION_EDIT_OWNED_STORY = 'EDIT_OWNED_STORY'
ACTION_EDIT_SKILL_DESCRIPTION = 'EDIT_SKILL_DESCRIPTION'
ACTION_EDIT_SKILLS = 'EDIT_SKILLS'
ACTION_FLAG_EXPLORATION = 'FLAG_EXPLORATION'
ACTION_MANAGE_ACCOUNT = 'MANAGE_ACCOUNT'
ACTION_MANAGE_EMAIL_DASHBOARD = 'MANAGE_EMAIL_DASHBOARD'
ACTION_MANAGE_MEMCACHE = 'MANAGE_MEMCACHE'
ACTION_MANAGE_QUESTION_RIGHTS = 'MANAGE_QUESTION_RIGHTS'
ACTION_MANAGE_TOPIC_RIGHTS = 'MANAGE_TOPIC_RIGHTS'
ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY = 'MODIFY_ROLES_FOR_ANY_ACTIVITY'
ACTION_MODIFY_ROLES_FOR_OWNED_ACTIVITY = 'MODIFY_ROLES_FOR_OWNED_ACTIVITY'
ACTION_PLAY_ANY_PRIVATE_ACTIVITY = 'PLAY_ANY_PRIVATE_ACTIVITY'
ACTION_PLAY_ANY_PUBLIC_ACTIVITY = 'PLAY_ANY_PUBLIC_ACTIVITY'
ACTION_PUBLISH_ANY_ACTIVITY = 'PUBLISH_ANY_ACTIVITY'
ACTION_PUBLISH_OWNED_ACTIVITY = 'PUBLISH_OWNED_ACTIVITY'
ACTION_PUBLISH_OWNED_SKILL = 'PUBLISH_OWNED_SKILL'
ACTION_RATE_ANY_PUBLIC_EXPLORATION = 'RATE_ANY_PUBLIC_EXPLORATION'
ACTION_SEND_MODERATOR_EMAILS = 'SEND_MODERATOR_EMAILS'
ACTION_SUBMIT_VOICEOVER_APPLICATION = 'ACTION_SUBMIT_VOICEOVER_APPLICATION'
ACTION_SUBSCRIBE_TO_USERS = 'SUBSCRIBE_TO_USERS'
ACTION_SUGGEST_CHANGES = 'SUGGEST_CHANGES'
ACTION_UNPUBLISH_ANY_PUBLIC_ACTIVITY = 'UNPUBLISH_ANY_PUBLIC_ACTIVITY'
ACTION_VISIT_ANY_QUESTION_EDITOR = 'VISIT_ANY_QUESTION_EDITOR'
ACTION_VISIT_ANY_TOPIC_EDITOR = 'VISIT_ANY_TOPIC_EDITOR'

# Users can be updated to the following list of role IDs via admin interface.
#
# NOTE: LEARNER role should not be updated to any other role, hence do not
#   add it to the following list.
UPDATABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_EXPLORATION_EDITOR,
    feconf.ROLE_ID_MODERATOR,
    feconf.ROLE_ID_RELEASE_COORDINATOR,
    feconf.ROLE_ID_TOPIC_MANAGER
]

# Users can be viewed by following list of role IDs via admin interface.
#
# NOTE: Do not include LEARNER role in this list as it does not represent
#   role for a separate user account, but rather a profile within the account.
VIEWABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_MODERATOR,
    feconf.ROLE_ID_RELEASE_COORDINATOR,
    feconf.ROLE_ID_TOPIC_MANAGER
]

# The string corresponding to role IDs that should be visible to admin.
HUMAN_READABLE_ROLES = {
    feconf.ROLE_ID_ADMIN: 'admin',
    feconf.ROLE_ID_BANNED_USER: 'banned user',
    feconf.ROLE_ID_COLLECTION_EDITOR: 'collection editor',
    feconf.ROLE_ID_EXPLORATION_EDITOR: 'exploration editor',
    feconf.ROLE_ID_GUEST: 'guest',
    feconf.ROLE_ID_LEARNER: 'learner',
    feconf.ROLE_ID_MODERATOR: 'moderator',
    feconf.ROLE_ID_RELEASE_COORDINATOR: 'release coordinator',
    feconf.ROLE_ID_TOPIC_MANAGER: 'topic manager'
}


# TODO(#12755): Remove this function once user roles are independent and
# doesn't need the _get_unique_actions_list to generate the unique actions.
# It is not expected to define a function before defining constants in the
# module. The _get_unique_actions_list function is needed here
# as it helps generating values for constants.
def _get_unique_actions_list(*actions):
    """Returns a list of unique actions out of the given list of actions.

    Args:
        *actions: list(str). List of actions whcihcan contain duplicate items.

    Returns:
        list(str). A list of unique action strings.
    """
    return list(set(actions))


_GUEST_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_PLAY_ANY_PUBLIC_ACTIVITY)

_LEARNER_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_FLAG_EXPLORATION,
    ACTION_ACCESS_LEARNER_DASHBOARD,
    *_GUEST_ALLOWED_ACTIONS)

_EXPLORATION_EDITOR_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_ACCESS_CREATOR_DASHBOARD,
    ACTION_CREATE_EXPLORATION,
    ACTION_DELETE_OWNED_PRIVATE_ACTIVITY,
    ACTION_EDIT_OWNED_ACTIVITY,
    ACTION_SUBSCRIBE_TO_USERS,
    ACTION_MANAGE_ACCOUNT,
    ACTION_MODIFY_ROLES_FOR_OWNED_ACTIVITY,
    ACTION_PUBLISH_OWNED_ACTIVITY,
    ACTION_RATE_ANY_PUBLIC_EXPLORATION,
    ACTION_SUGGEST_CHANGES,
    ACTION_SUBMIT_VOICEOVER_APPLICATION,
    *_LEARNER_ALLOWED_ACTIONS)

_COLLECTION_EDITOR_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_CREATE_COLLECTION,
    *_EXPLORATION_EDITOR_ALLOWED_ACTIONS)

_TOPIC_MANAGER_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD,
    ACTION_DELETE_ANY_QUESTION,
    ACTION_EDIT_ANY_QUESTION,
    ACTION_EDIT_OWNED_STORY,
    ACTION_EDIT_OWNED_TOPIC,
    ACTION_EDIT_SKILLS,
    ACTION_EDIT_ANY_SUBTOPIC_PAGE,
    ACTION_MANAGE_QUESTION_SKILL_STATUS,
    ACTION_VISIT_ANY_QUESTION_EDITOR,
    ACTION_VISIT_ANY_TOPIC_EDITOR,
    *_COLLECTION_EDITOR_ALLOWED_ACTIONS)

_MODERATOR_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_ACCESS_MODERATOR_PAGE,
    ACTION_DELETE_ANY_PUBLIC_ACTIVITY,
    ACTION_EDIT_ANY_PUBLIC_ACTIVITY,
    ACTION_PLAY_ANY_PRIVATE_ACTIVITY,
    ACTION_SEND_MODERATOR_EMAILS,
    ACTION_UNPUBLISH_ANY_PUBLIC_ACTIVITY,
    *_TOPIC_MANAGER_ALLOWED_ACTIONS)

_RELEASE_COORDINATOR_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_ACCESS_RELEASE_COORDINATOR_PAGE,
    ACTION_MANAGE_MEMCACHE,
    ACTION_RUN_ANY_JOB,
    *_EXPLORATION_EDITOR_ALLOWED_ACTIONS)

_ADMIN_ALLOWED_ACTIONS = _get_unique_actions_list(
    ACTION_ACCEPT_ANY_SUGGESTION,
    ACTION_ACCEPT_ANY_VOICEOVER_APPLICATION,
    ACTION_CHANGE_STORY_STATUS,
    ACTION_CHANGE_TOPIC_STATUS,
    ACTION_CREATE_NEW_SKILL,
    ACTION_CREATE_NEW_TOPIC,
    ACTION_DELETE_ANY_ACTIVITY,
    ACTION_DELETE_ANY_SKILL,
    ACTION_DELETE_TOPIC,
    ACTION_EDIT_ANY_ACTIVITY,
    ACTION_EDIT_ANY_STORY,
    ACTION_EDIT_ANY_TOPIC,
    ACTION_EDIT_SKILLS,
    ACTION_EDIT_SKILL_DESCRIPTION,
    ACTION_MANAGE_EMAIL_DASHBOARD,
    ACTION_MANAGE_TOPIC_RIGHTS,
    ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY,
    ACTION_PUBLISH_ANY_ACTIVITY,
    ACTION_PUBLISH_OWNED_SKILL,
    *_MODERATOR_ALLOWED_ACTIONS)

# This dict represents all the actions that belong to a particular role.
_ROLE_ACTIONS = {
    feconf.ROLE_ID_ADMIN: _ADMIN_ALLOWED_ACTIONS,
    feconf.ROLE_ID_BANNED_USER: [],
    feconf.ROLE_ID_COLLECTION_EDITOR: _COLLECTION_EDITOR_ALLOWED_ACTIONS,
    feconf.ROLE_ID_EXPLORATION_EDITOR: _EXPLORATION_EDITOR_ALLOWED_ACTIONS,
    feconf.ROLE_ID_GUEST: _GUEST_ALLOWED_ACTIONS,
    feconf.ROLE_ID_LEARNER: _LEARNER_ALLOWED_ACTIONS,
    feconf.ROLE_ID_MODERATOR: _MODERATOR_ALLOWED_ACTIONS,
    feconf.ROLE_ID_RELEASE_COORDINATOR: _RELEASE_COORDINATOR_ALLOWED_ACTIONS,
    feconf.ROLE_ID_TOPIC_MANAGER: _TOPIC_MANAGER_ALLOWED_ACTIONS
}


def get_all_actions(role):
    """Returns a list of all actions that can be performed by the given role.

    Args:
        role: str. A string defining the user role.

    Returns:
        list(str). A list of actions accessible to the role.

    Raises:
        Exception. The given role does not exist.
    """
    if role not in _ROLE_ACTIONS:
        raise Exception('Role %s does not exist.' % role)

    role_actions = _ROLE_ACTIONS[role]

    return role_actions


def get_role_actions():
    """Returns the possible role to actions items in the application.

    Returns:
        dict(str, list(str)). A dict presenting key as role and values as list
        of actions corresponding to the given role.
    """
    return copy.deepcopy(_ROLE_ACTIONS)


def is_valid_role(role):
    """Validates whether the given role is valid.

    Args:
        role: str. The role to validate.

    Returns:
        bool. Whether the given role is valid or not.
    """
    return role in _ROLE_ACTIONS


def log_role_query(user_id, intent, role=None, username=None):
    """Stores the query to role structure in RoleQueryAuditModel."""
    model_id = '%s.%s.%s.%s' % (
        user_id, int(math.floor(time.time())), intent, random.randint(0, 1000)
    )

    model = audit_models.RoleQueryAuditModel(
        id=model_id, user_id=user_id, intent=intent,
        role=role, username=username)
    model.update_timestamps()
    model.put()

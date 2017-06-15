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

"""This module contains the Hierarchy Structure of roles for action
inheritance, Actions permitted to the roles and the functions needed to
access roles and actions.
"""

import feconf

# Actions that can be performed in the system.
ACTION_ACCESS_ADMIN_PAGE = 'ACCESS_ADMIN_PAGE'
ACTION_ACCESS_MODERATOR_PAGE = 'ACCESS_MODERATOR_PAGE'
ACTION_CREATE_COLLECTION = 'CREATE_COLLECTION'
ACTION_CREATE_EXPLORATION = 'CREATE_EXPLORATION'
ACTION_DOWNLOAD_EXPLORATION = 'DOWNLOAD_EXPLORATION'
ACTION_EDIT_COLLECTION = 'EDIT_COLLECTION'
ACTION_EDIT_EXPLORATION = 'EDIT_EXPLORATION'
ACTION_EDIT_COLLECTION_RIGHTS = 'EDIT_COLLECTION_RIGHTS'
ACTION_PLAY_COLLECTION = 'PLAY_COLLECTION'
ACTION_PLAY_EXPLORATION = 'PLAY_EXPLORATION'
ACTION_SEND_BULK_EMAIL = 'SEND_BULK_EMAIL'
ACTION_START_FEEDBACK_THREAD = 'START_FEEDBACK_THREAD'
ACTION_SUGGEST_EDIT_TO_EXPLORATION = 'SUGGEST_EDIT_TO_EXPLORATION'
ACTION_UPDATE_FEATURED_ACTIVITIES = 'UPDATE_FEATURED_ACTIVITIES'
ACTION_VIEW_COLLECTION_RIGHTS = 'VIEW_COLLECTION_RIGHTS'
ACTION_VIEW_EXPLORATION_STATS = 'VIEW_EXPLORATION_STATS'

# This dict represents how the actions are inherited among different
# roles in the site.
#   key -> name of role
#   value -> list of direct neighbour roles from which actions are inherited
# Eg -
#   say, key 'COLLECTION_EDITOR' has ['EXPLORATION_EDITOR'] as its value, then
#   'COLLECTION_EDITOR' can perform {all the actions that can be performed by
#   'EXPLORATION_EDITOR' and its value recursively} plus {the actions
#   corresponding to 'COLLECTION_EDITOR'.}
#
# NOTE FOR DEVELOPERS:
# - Follow the Playbook in wiki(https://github.com/oppia/oppia/wiki/
#   Instructions-for-editing-roles-or-actions) before making any changes to
#   this dict.
#
# CAUTION: Before removing any role from this dict, please ensure that there is
#   no existing user with that role.
PARENT_ROLES = {
    feconf.ROLE_ADMIN: [feconf.ROLE_MODERATOR],
    feconf.ROLE_BANNED_USER: [feconf.ROLE_GUEST],
    feconf.ROLE_COLLECTION_EDITOR: [feconf.ROLE_EXPLORATION_EDITOR],
    feconf.ROLE_EXPLORATION_EDITOR: [feconf.ROLE_BANNED_USER],
    feconf.ROLE_GUEST: [],
    feconf.ROLE_MODERATOR: [feconf.ROLE_COLLECTION_EDITOR],
    feconf.ROLE_SUPER_ADMIN: [feconf.ROLE_ADMIN]
}

# This dict represents the unique actions that belong to a particular role.
# Unique in the sense that the action belongs to this role but can't be
# inherited from any other role.
#   key -> name of role
#   value -> list of unique actions.
#
# NOTE FOR DEVELOPERS :
# - Follow the Playbook in wiki(https://github.com/oppia/oppia/wiki/
#   Instructions-for-editing-roles-or-actions) before making any changes to
#   this dict.
ROLE_ACTIONS = {
    feconf.ROLE_ADMIN: [],
    feconf.ROLE_BANNED_USER: [],
    feconf.ROLE_COLLECTION_EDITOR: [
        ACTION_CREATE_COLLECTION,
        ACTION_EDIT_COLLECTION,
        ACTION_EDIT_COLLECTION_RIGHTS,
        ACTION_VIEW_COLLECTION_RIGHTS,
    ],
    feconf.ROLE_EXPLORATION_EDITOR: [
        ACTION_CREATE_EXPLORATION,
        ACTION_EDIT_EXPLORATION,
        ACTION_START_FEEDBACK_THREAD,
        ACTION_SUGGEST_EDIT_TO_EXPLORATION
    ],
    feconf.ROLE_GUEST: [
        ACTION_DOWNLOAD_EXPLORATION,
        ACTION_PLAY_COLLECTION,
        ACTION_PLAY_EXPLORATION,
        ACTION_VIEW_EXPLORATION_STATS
    ],
    feconf.ROLE_MODERATOR: [
        ACTION_ACCESS_MODERATOR_PAGE,
        ACTION_UPDATE_FEATURED_ACTIVITIES
    ],
    feconf.ROLE_SUPER_ADMIN: [
        ACTION_ACCESS_ADMIN_PAGE,
        ACTION_SEND_BULK_EMAIL
    ]
}


def get_all_actions(role):
    """Returns a list of all actions (including inherited actions)
    that can be performed by the given role.

    Args:
        role: str. A string defining user role. It should be a key of
            PARENT_ROLES.

    Returns:
        list(str). A list of actions accessible to the role.

    Raises:
        Exception: The given role does not exist.
    """
    if role not in PARENT_ROLES:
        raise Exception('Role %s does not exist.' % role)

    role_actions = ROLE_ACTIONS[role]

    for parent_role in PARENT_ROLES[role]:
        role_actions.extend(get_all_actions(parent_role))

    return list(set(role_actions))

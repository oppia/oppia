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

import math
import random
import time

from core.platform import models
import feconf

(audit_models,) = models.Registry.import_models([models.NAMES.audit])

# Actions that can be performed in the system.
ACTION_PLAY_ANY_PRIVATE_COLLECTION = 'PLAY_ANY_PRIVATE_COLLECTION'
ACTION_PLAY_ANY_PUBLIC_COLLECTION = 'PLAY_ANY_PUBLIC_COLLECTION'
ACTION_PLAY_ANY_PRIVATE_EXPLORATION = 'PLAY_ANY_PRIVATE_EXPLORATION'
ACTION_PLAY_ANY_PUBLIC_EXPLORATION = 'PLAY_ANY_PUBLIC_EXPLORATION'


# Users can be updated to the following list of role Ids via admin interface.
UPDATABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_EXPLORATION_EDITOR,
    feconf.ROLE_ID_MODERATOR
]

# Users can be viewed by following list of role Ids via admin interface.
VIEWABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_MODERATOR,
]

# The string corresponding to role Ids that should be visible to admin.
HUMAN_READABLE_ROLES = {
    feconf.ROLE_ID_ADMIN: 'admin',
    feconf.ROLE_ID_BANNED_USER: 'banned user',
    feconf.ROLE_ID_COLLECTION_EDITOR: 'collection editor',
    feconf.ROLE_ID_EXPLORATION_EDITOR: 'exploration editor',
    feconf.ROLE_ID_GUEST: 'guest',
    feconf.ROLE_ID_MODERATOR: 'moderator',
}

# This dict maps the roles in current authorization system to roles in new
# authorization.
# TODO (1995YogeshSharma): Remove this once new system takes over.
ROLE_SYNC_DICT = {
    'WHITELISTED_EMAIL_SENDERS': {
        'name': 'whitelisted_email_senders',
        'role': feconf.ROLE_ID_ADMIN
    },
    'ADMIN_USERNAMES': {
        'name': 'admin_usernames',
        'role': feconf.ROLE_ID_ADMIN
    },
    'COLLECTION_EDITOR_WHITELIST': {
        'name': 'collection_editor_whitelist',
        'role': feconf.ROLE_ID_COLLECTION_EDITOR
    },
    'BANNED_USERNAMES': {
        'name': 'banned_usernames',
        'role': feconf.ROLE_ID_BANNED_USER
    },
    'MODERATOR_USERNAMES': {
        'name': 'moderator_usernames',
        'role': feconf.ROLE_ID_MODERATOR
    }
}

# This dict gives the priority number (an integer value to chose for looking
# at priority of a role over other). This is used for keeping sync in config
# lists and new roles.
# Eg: Suppose a user is in both moderator_usernames and whitelisted_collection
# _editor_usernames. The priority number in this dict will be used to select
# whether the user will have role moderator or collection editor in new system.
# TODO (1995YogeshSharma): Remove this dict once the new system takes over.
PRIORITY_NUMBER_DICT = {
    feconf.ROLE_ID_EXPLORATION_EDITOR: 0,
    feconf.ROLE_ID_BANNED_USER: 1,
    feconf.ROLE_ID_COLLECTION_EDITOR: 2,
    feconf.ROLE_ID_MODERATOR: 3,
    feconf.ROLE_ID_ADMIN: 4
}

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
# - Follow the Playbook in wiki (https://github.com/oppia/oppia/wiki/
#   Instructions-for-editing-roles-or-actions) before making any changes to
#   this dict.
#
# CAUTION: Before removing any role from this dict, please ensure that there is
#   no existing user with that role.
PARENT_ROLES = {
    feconf.ROLE_ID_ADMIN: [feconf.ROLE_ID_MODERATOR],
    feconf.ROLE_ID_BANNED_USER: [feconf.ROLE_ID_GUEST],
    feconf.ROLE_ID_COLLECTION_EDITOR: [feconf.ROLE_ID_EXPLORATION_EDITOR],
    feconf.ROLE_ID_EXPLORATION_EDITOR: [feconf.ROLE_ID_GUEST],
    feconf.ROLE_ID_GUEST: [],
    feconf.ROLE_ID_MODERATOR: [feconf.ROLE_ID_COLLECTION_EDITOR],
}

# This dict represents the unique actions that belong to a particular role.
# Unique in the sense that the action belongs to this role but can't be
# inherited from any other role.
#   key -> name of role
#   value -> list of unique actions.
#
# NOTE FOR DEVELOPERS :
# - Follow the Playbook in wiki (https://github.com/oppia/oppia/wiki/
#   Instructions-for-editing-roles-or-actions) before making any changes to
#   this dict.
ROLE_ACTIONS = {
    feconf.ROLE_ID_ADMIN: [
    ],
    feconf.ROLE_ID_BANNED_USER: [
    ],
    feconf.ROLE_ID_COLLECTION_EDITOR: [
    ],
    feconf.ROLE_ID_EXPLORATION_EDITOR: [
    ],
    feconf.ROLE_ID_GUEST: [
        ACTION_PLAY_ANY_PUBLIC_COLLECTION,
        ACTION_PLAY_ANY_PUBLIC_EXPLORATION,
    ],
    feconf.ROLE_ID_MODERATOR: [
        ACTION_PLAY_ANY_PRIVATE_COLLECTION,
        ACTION_PLAY_ANY_PRIVATE_EXPLORATION,
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


def get_role_graph_data():
    """Returns dict for displaying roles graph.

    Returns:
        dict. A dict containing data in following format:
        {
            links: list(dict(str:str)). List of dicts defing each edge in
                following format:
                    {
                        source: Role Id from which edge is going out.
                        target: Role Id to which edge is incoming.
                    }
            nodes: dict(str:str). Mapping of role Id to its human readable
                format.
        }
    """
    role_graph = {}
    role_graph['links'] = []
    role_graph['nodes'] = {}
    for role in PARENT_ROLES:
        role_graph['nodes'][role] = HUMAN_READABLE_ROLES[role]
        for parent in PARENT_ROLES[role]:
            role_graph['links'].append({'source': parent, 'target': role})
    return role_graph


def log_role_query(user_id, intent, role=None, username=None):
    """Stores the query to role structure in RoleQueryAuditModel."""
    model_id = '%s.%s.%s.%s' % (
        user_id, int(math.floor(time.time())), intent, random.randint(0, 1000)
    )

    audit_models.RoleQueryAuditModel(
        id=model_id, user_id=user_id, intent=intent,
        role=role, username=username).put()


def get_max_priority_role(role_list):
    """Returns the role with maximum priority among the given list
    of roles.

    Args:
        role_list: list(str). List of roles.

    Returns:
        str. Role with highest priority among given roles.
    """
    priority_num = -1
    resultant_role = None
    for role in role_list:
        if PRIORITY_NUMBER_DICT[role] > priority_num:
            resultant_role = role
            priority_num = PRIORITY_NUMBER_DICT[role]
    return resultant_role


def get_role_changes(old_config_properties, new_config_properties):
    """This function takes old and new versions of config property values
    and returns the resultant roles for users in terms of new system.

    Args:
        old_config_properties: dict(str:list). Dict mapping config property ids
            to their values.
        new_config_properties: dict(str:list). Dict mapping config property ids
            to their values.

    Returns:
        dict(str:str). Dict mapping usernames to roles in terms of new system.
    """
    changed_user_roles = {}
    resultant_changed_roles = {}

    for key in ROLE_SYNC_DICT:
        if ROLE_SYNC_DICT[key]['name'] in new_config_properties:
            new_config_values = (
                new_config_properties[ROLE_SYNC_DICT[key]['name']])
            old_config_values = (
                old_config_properties[ROLE_SYNC_DICT[key]['name']])
            for username in new_config_values:
                if username not in changed_user_roles:
                    changed_user_roles[username] = []
                changed_user_roles[username].append(
                    ROLE_SYNC_DICT[key]['role'])
            for username in old_config_values:
                if username not in changed_user_roles:
                    changed_user_roles[username] = []
                changed_user_roles[username].append(
                    feconf.ROLE_ID_EXPLORATION_EDITOR)

    for username in changed_user_roles:
        resultant_changed_roles[username] = get_max_priority_role(
            changed_user_roles[username])

    return resultant_changed_roles

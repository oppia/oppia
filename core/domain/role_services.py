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
ACTION_ACCESS_CREATOR_DASHBOARD = 'ACCESS_CREATOR_DASHBOARD'
ACTION_ACCESS_LEARNER_DASHBOARD = 'ACCESS_LEARNER_DASHBOARD'
ACTION_ACCESS_MODERATOR_PAGE = 'ACCESS_MODERATOR_PAGE'
ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD = 'ACCESS_TOPICS_AND_SKILLS_DASHBOARD'
ACTION_CHANGE_QUESTION_STATUS = 'CHANGE_QUESTION_STATUS'
ACTION_CHANGE_TOPIC_STATUS = 'CHANGE_TOPIC_STATUS'
ACTION_CREATE_COLLECTION = 'CREATE_COLLECTION'
ACTION_CREATE_EXPLORATION = 'CREATE_EXPLORATION'
ACTION_CREATE_QUESTION = 'CREATE_NEW_QUESTION'
ACTION_CREATE_NEW_SKILL = 'CREATE_NEW_SKILL'
ACTION_CREATE_NEW_TOPIC = 'CREATE_NEW_TOPIC'
ACTION_DELETE_ANY_ACTIVITY = 'DELETE_ANY_ACTIVITY'
ACTION_DELETE_ANY_PUBLIC_ACTIVITY = 'DELETE_ANY_PUBLIC_ACTIVITY'
ACTION_DELETE_ANY_SKILL = 'DELETE_ANY_SKILL'
ACTION_DELETE_OWNED_PRIVATE_ACTIVITY = 'DELETE_OWNED_PRIVATE_ACTIVITY'
ACTION_EDIT_ANY_ACTIVITY = 'EDIT_ANY_ACTIVITY'
ACTION_EDIT_ANY_PUBLIC_ACTIVITY = 'EDIT_ANY_PUBLIC_ACTIVITY'
ACTION_EDIT_ANY_SKILL = 'EDIT_ANY_SKILL'
ACTION_EDIT_ANY_SUBTOPIC_PAGE = 'EDIT_ANY_SUBTOPIC_PAGE'
ACTION_EDIT_ANY_TOPIC = 'EDIT_ANY_TOPIC'
ACTION_EDIT_ANY_QUESTION = 'EDIT_ANY_QUESTION'
ACTION_EDIT_OWNED_ACTIVITY = 'EDIT_OWNED_ACTIVITY'
ACTION_EDIT_OWNED_QUESTION = 'EDIT_OWNED_QUESTION'
ACTION_EDIT_OWNED_TOPIC = 'EDIT_OWNED_TOPIC'
ACTION_FLAG_EXPLORATION = 'FLAG_EXPLORATION'
ACTION_MANAGE_EMAIL_DASHBOARD = 'MANAGE_EMAIL_DASHBOARD'
ACTION_MANAGE_PROFILE = 'MANAGE_PROFILE'
ACTION_MANAGE_QUESTION_RIGHTS = 'MANAGE_QUESTION_RIGHTS'
ACTION_MANAGE_TOPIC_RIGHTS = 'MANAGE_TOPIC_RIGHTS'
ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY = 'MODIFY_ROLES_FOR_ANY_ACTIVITY'
ACTION_MODIFY_ROLES_FOR_OWNED_ACTIVITY = 'MODIFY_ROLES_FOR_OWNED_ACTIVITY'
ACTION_PLAY_ANY_PRIVATE_ACTIVITY = 'PLAY_ANY_PRIVATE_ACTIVITY'
ACTION_PLAY_ANY_PUBLIC_ACTIVITY = 'PLAY_ANY_PUBLIC_ACTIVITY'
ACTION_PUBLISH_ANY_ACTIVITY = 'PUBLISH_ANY_ACTIVITY'
ACTION_PUBLISH_OWNED_ACTIVITY = 'PUBLISH_OWNED_ACTIVITY'
ACTION_CHANGE_TOPIC_STATUS = 'CHANGE_TOPIC_STATUS'
ACTION_RATE_ANY_PUBLIC_EXPLORATION = 'RATE_ANY_PUBLIC_EXPLORATION'
ACTION_SEND_MODERATOR_EMAILS = 'SEND_MODERATOR_EMAILS'
ACTION_SUBSCRIBE_TO_USERS = 'SUBSCRIBE_TO_USERS'
ACTION_SUGGEST_CHANGES_TO_EXPLORATION = 'SUGGEST_CHANGES_TO_EXPLORATION'
ACTION_UNPUBLISH_ANY_PUBLIC_ACTIVITY = 'UNPUBLISH_ANY_PUBLIC_ACTIVITY'
ACTION_VISIT_ANY_QUESTION_EDITOR = 'VISIT_QUESTION_EDITOR'
ACTION_VISIT_ANY_TOPIC_EDITOR = 'VISIT_ANY_TOPIC_EDITROLE_ID_ADMINOR'

# Users can be updated to the following list of role IDs via admin interface.
UPDATABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_EXPLORATION_EDITOR,
    feconf.ROLE_ID_MODERATOR,
    feconf.ROLE_ID_TOPIC_MANAGER
]

# Users can be viewed by following list of role IDs via admin interface.
VIEWABLE_ROLES = [
    feconf.ROLE_ID_ADMIN,
    feconf.ROLE_ID_BANNED_USER,
    feconf.ROLE_ID_COLLECTION_EDITOR,
    feconf.ROLE_ID_MODERATOR,
    feconf.ROLE_ID_TOPIC_MANAGER
]

# The string corresponding to role IDs that should be visible to admin.
HUMAN_READABLE_ROLES = {
    feconf.ROLE_ID_ADMIN: 'admin',
    feconf.ROLE_ID_BANNED_USER: 'banned user',
    feconf.ROLE_ID_COLLECTION_EDITOR: 'collection editor',
    feconf.ROLE_ID_EXPLORATION_EDITOR: 'exploration editor',
    feconf.ROLE_ID_GUEST: 'guest',
    feconf.ROLE_ID_MODERATOR: 'moderator',
    feconf.ROLE_ID_TOPIC_MANAGER: 'topic manager'
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
    feconf.ROLE_ID_MODERATOR: [feconf.ROLE_ID_TOPIC_MANAGER],
    feconf.ROLE_ID_TOPIC_MANAGER: [feconf.ROLE_ID_COLLECTION_EDITOR]
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
        ACTION_CHANGE_QUESTION_STATUS,
        ACTION_CREATE_NEW_SKILL,
        ACTION_CREATE_NEW_TOPIC,
        ACTION_CREATE_QUESTION,
        ACTION_DELETE_ANY_ACTIVITY,
        ACTION_DELETE_ANY_SKILL,
        ACTION_EDIT_ANY_QUESTION,
        ACTION_EDIT_ANY_ACTIVITY,
        ACTION_EDIT_ANY_TOPIC,
        ACTION_MANAGE_EMAIL_DASHBOARD,
        ACTION_MANAGE_TOPIC_RIGHTS,
        ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY,
        ACTION_PUBLISH_ANY_ACTIVITY,
        ACTION_VISIT_ANY_QUESTION_EDITOR,
        ACTION_EDIT_ANY_QUESTION,
        ACTION_CHANGE_TOPIC_STATUS
    ],
    feconf.ROLE_ID_BANNED_USER: [
    ],
    feconf.ROLE_ID_COLLECTION_EDITOR: [
        ACTION_CREATE_COLLECTION,
    ],
    feconf.ROLE_ID_EXPLORATION_EDITOR: [
        ACTION_ACCESS_CREATOR_DASHBOARD,
        ACTION_ACCESS_LEARNER_DASHBOARD,
        ACTION_CREATE_EXPLORATION,
        ACTION_CREATE_QUESTION,
        ACTION_DELETE_OWNED_PRIVATE_ACTIVITY,
        ACTION_EDIT_OWNED_ACTIVITY,
        ACTION_FLAG_EXPLORATION,
        ACTION_SUBSCRIBE_TO_USERS,
        ACTION_MANAGE_PROFILE,
        ACTION_MODIFY_ROLES_FOR_OWNED_ACTIVITY,
        ACTION_PUBLISH_OWNED_ACTIVITY,
        ACTION_RATE_ANY_PUBLIC_EXPLORATION,
        ACTION_SUGGEST_CHANGES_TO_EXPLORATION,
    ],
    feconf.ROLE_ID_GUEST: [
        ACTION_PLAY_ANY_PUBLIC_ACTIVITY,
    ],
    feconf.ROLE_ID_MODERATOR: [
        ACTION_ACCESS_MODERATOR_PAGE,
        ACTION_DELETE_ANY_PUBLIC_ACTIVITY,
        ACTION_EDIT_ANY_PUBLIC_ACTIVITY,
        ACTION_PLAY_ANY_PRIVATE_ACTIVITY,
        ACTION_SEND_MODERATOR_EMAILS,
        ACTION_UNPUBLISH_ANY_PUBLIC_ACTIVITY,
    ],
    feconf.ROLE_ID_TOPIC_MANAGER: [
        ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD,
        ACTION_CHANGE_QUESTION_STATUS,
        ACTION_CREATE_QUESTION,
        ACTION_EDIT_OWNED_QUESTION,
        ACTION_EDIT_OWNED_TOPIC,
        ACTION_EDIT_ANY_SKILL,
        ACTION_EDIT_ANY_SUBTOPIC_PAGE,
        ACTION_VISIT_ANY_QUESTION_EDITOR,
        ACTION_EDIT_ANY_QUESTION,
        ACTION_VISIT_ANY_TOPIC_EDITOR
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
            nodes: dict(str:str). Mapping of role ID to its human readable
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

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

"""contains required constants and functions for user roles and actions"""

# dict to contain the hierarchy information for a role in oppia
# NOTE FOR DEVELOPERS :
# - Follow the Playbook in wiki before making any changes to this dict.
# - Maintain the alphabetical in keys.
ROLE_HIERARCHY = {
    'ADMIN': ['MODERATOR'],
    'BANNED_USER': ['GUEST'],
    'COLLECTION_EDITOR': ['EXPLORATION_EDITOR'],
    'EXPLORATION_EDITOR': ['BANNED_USER'],
    'GUEST': [],
    'MODERATOR': ['COLLECTION_EDITOR'],
    'SUPER_ADMIN': ['ADMIN']
}

# dict to contain unique actions (actions which are not inherited from parents)
# corresponding to roles.
# NOTE FOR DEVELOPERS :
# - Follow the Playbook in wiki before making any changes to this dict.
# - Maintain the alphabetical order in keys.
ROLE_ACTIONS = {
    'ADMIN': [],
    'BANNED_USER': [],
    'COLLECTION_EDITOR': ['CREATE_COLLECTION', 'EDIT_COLLECTION',
                          'VIEW_COLLECTION_RIGHTS', 'EDIT_COLLECTION_RIGHTS'],
    'EXPLORATION_EDITOR': ['CREATE_EXPLORATION', 'START_FEEDBACK_THREAD',
                           'EDIT_EXPLORATION', 'SUGGEST_EDIT_TO_EXPLORATION'],
    'GUEST': ['DOWNLOAD_EXPLORATION', 'PLAY_COLLECTION', 'PLAY_EXPLORATION',
              'VIEW_EXPLORATION_STATS'],
    'MODERATOR': ['ACCESS_MODERATOR_PAGE', 'UPDATE_FEATURED_ACTIVITIES'],
    'SUPER_ADMIN': ['ACCESS_ADMIN_PAGE', 'SEND_BULK_EMAIL']
}


def get_all_actions(role):
    """Given a string defining role of the user, this method returns all the
    list of all the actions(its own actions plus inherited actions) that can
    be performed by that role
    args: role - a string defining user role
    returns: a list of actions belonging to the role
    """
    if role not in ROLE_HIERARCHY.keys():
        raise Exception("no role with name %s exists." % role)

    role_actions = []
    parents = ROLE_HIERARCHY[role]

    if len(parents) == 0:
        return ROLE_ACTIONS[role]
    else:
        for parent in parents:
            role_actions = list(
                set(role_actions) | set(get_all_actions(parent)))

        if len(ROLE_ACTIONS[role]) != 0:
            role_actions = list(
                set(role_actions) | set(ROLE_ACTIONS[role]))

        return role_actions

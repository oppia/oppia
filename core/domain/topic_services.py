# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Commands for operations on topics, and related models."""

import logging

from core.domain import role_services
from core.domain import topic_domain
from core.domain import user_services
from core.platform import models

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


def get_topic_rights_from_model(topic_rights_model):
    """Constructs a TopicRights object from the given topic rights model.

    Args:
        topic_rights_model: TopicRightsModel. Topic rights from the
            datastore.

    Returns:
        TopicRights. The rights object created from the model.
    """

    return topic_domain.TopicRights(
        topic_rights_model.id,
        topic_rights_model.manager_ids
    )


def save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds):
    """Saves a TopicRights domain object to the datastore.

    Args:
        topic_rights: TopicRights. The rights object for the given
            topic.
        committer_id: str. ID of the committer.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(dict). A list of commands describing what kind of
            commit was done.
    """

    model = topic_models.TopicRightsModel.get(topic_rights.id, strict=False)

    model.manager_ids = topic_rights.manager_ids

    model.commit(committer_id, commit_message, commit_cmds)


def create_new_topic_rights(topic_id, committer_id):
    """Creates a new topic rights object and saves it to the datastore.

    Args:
        topic_id: str. ID of the topic.
        committer_id: str. ID of the committer.
    """

    topic_rights = topic_domain.TopicRights(topic_id, [])
    commit_cmds = [{'cmd': topic_domain.CMD_CREATE_NEW}]

    topic_models.TopicRightsModel(
        id=topic_rights.id,
        manager_ids=topic_rights.manager_ids
    ).commit(committer_id, 'Created new topic rights', commit_cmds)


def get_topic_rights(topic_id, strict=True):
    """Retrieves the rights object for the given topic.

    Args:
        topic_id: str. ID of the topic.

    Returns:
        TopicRights. The rights object associated with the given topic.

    Raises:
        EntityNotFoundError. The topic with ID topic_id was not
            found in the datastore.
    """

    model = topic_models.TopicRightsModel.get(topic_id, strict=strict)

    if model is None:
        return None

    return get_topic_rights_from_model(model)


def check_can_manage_topic(user, topic_rights):
    """Checks whether the user can manage the given topic.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        topic_rights: TopicRights or None. Rights object for the given topic.

    Returns:
        bool. Whether the given user can manage the given topic.
    """

    if topic_rights is None:
        return False
    if role_services.ACTION_EDIT_OWNED_TOPIC not in user.actions:
        return False
    if topic_rights.is_manager(user.user_id):
        return True

    return False


def assign_role(committer, assignee_id, new_role, topic_id):
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionInfo object for the user
            who is performing the action.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role
            ROLE_MANAGER
            (TODO: Add more roles here if required)
        topic_id: str. ID of the topic.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The user is already a manager for the topic.
        Exception. The role is invalid.
    """
    committer_id = committer.user_id
    topic_rights = get_topic_rights(topic_id)

    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY not in
            committer.actions):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of topic %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, topic_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee_id)
    old_role = topic_domain.ROLE_NONE

    if new_role == topic_domain.ROLE_MANAGER:
        if topic_rights.is_manager(assignee_id):
            raise Exception('This user already is a manager for this topic')

        topic_rights.manager_ids.append(assignee_id)
    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [{
        'cmd': topic_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee_id,
        'old_role': old_role,
        'new_role': new_role
    }]

    save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds)

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
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


# Repository GET methods.
def _get_topic_memcache_key(topic_id, version=None):
    """Returns a memcache key for the topic.

    Args:
        topic_id: str. ID of the topic.
        version: int. The version of the topic.

    Returns:
        str. The memcache key of the topic.
    """
    if version:
        return 'topic-version:%s:%s' % (topic_id, version)
    else:
        return 'topic:%s' % topic_id


def get_topic_from_model(topic_model):
    """Returns a topic domain object given a topic model loaded
    from the datastore.

    Args:
        topic_model: TopicModel. The topic model loaded from the
            datastore.

    Returns:
        topic. A Topic domain object corresponding to the given
        topic model.
    """
    return topic_domain.Topic(
        topic_model.id, topic_model.name,
        topic_model.description, topic_model.canonical_story_ids,
        topic_model.additional_story_ids, topic_model.skill_ids,
        topic_model.language_code,
        topic_model.version, topic_model.created_on,
        topic_model.last_updated)



def get_topic_summary_from_model(topic_summary_model):
    """Returns a domain object for an Oppia topic summary given a
    topic summary model.

    Args:
        topic_summary_model: TopicSummaryModel.

    Returns:
        TopicSummary.
    """
    return topic_domain.TopicSummary(
        topic_summary_model.id, topic_summary_model.name,
        topic_summary_model.language_code,
        topic_summary_model.version,
        topic_summary_model.canonical_story_count,
        topic_summary_model.additional_story_count,
        topic_summary_model.skill_count,
        topic_summary_model.topic_model_created_on,
        topic_summary_model.topic_model_last_updated
    )


def get_topic_by_id(topic_id, strict=True, version=None):
    """Returns a domain object representing a topic.

    Args:
        topic_id: str. ID of the topic.
        strict: bool. Whether to fail noisily if no topic with the given
            id exists in the datastore.
        version: int or None. The version number of the topic to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Topic or None. The domain object representing a topic with the
        given id, or None if it does not exist.
    """
    topic_memcache_key = _get_topic_memcache_key(topic_id, version=version)
    memcached_topic = memcache_services.get_multi(
        [topic_memcache_key]).get(topic_memcache_key)

    if memcached_topic is not None:
        return memcached_topic
    else:
        topic_model = topic_models.TopicModel.get(
            topic_id, strict=strict, version=version)
        if topic_model:
            topic = get_topic_from_model(topic_model)
            memcache_services.set_multi({topic_memcache_key: topic})
            return topic
        else:
            return None


def get_topic_summary_by_id(topic_id, strict=True):
    """Returns a domain object representing a topic summary.

    Args:
        topic_id: str. ID of the topic summary.
        strict: bool. Whether to fail noisily if no topic summary with the given
            id exists in the datastore.

    Returns:
        TopicSummary or None. The topic summary domain object corresponding to
        a topic with the given topic_id, if it exists, or else None.
    """
    topic_summary_model = topic_models.TopicSummaryModel.get(
        topic_id, strict=strict)
    if topic_summary_model:
        topic_summary = get_topic_summary_from_model(topic_summary_model)
        return topic_summary
    else:
        return None


def get_new_topic_id():
    """Returns a new topic id.

    Returns:
        str. A new topic id.
    """
    return topic_models.TopicModel.get_new_id('')


def _create_topic(committer_id, topic, commit_message, commit_cmds):
    """Creates a new topic, and ensures that rights for a new topic
    are saved first.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. topic domain object.
        commit_message: str. A description of changes made to the topic.
        commit_cmds: list(TopicChange). A list of TopicChange objects that
            represent change commands made to the given topic.
    """
    topic.validate()
    create_new_topic_rights(topic.id, committer_id)
    model = topic_models.TopicModel(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        language_code=topic.language_code,
        canonical_story_ids=topic.canonical_story_ids,
        additional_story_ids=topic.additional_story_ids,
        skill_ids=topic.skill_ids
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    topic.version += 1
    create_topic_summary(topic.id)


def save_new_topic(committer_id, topic):
    """Saves a new topic.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. Topic to be saved.
    """
    commit_message = (
        'New topic created with name \'%s\'.' % topic.name)
    _create_topic(
        committer_id, topic, commit_message, [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': topic.name
        })])


def apply_change_list(topic_id, change_list):
    """Applies a changelist to a topic and returns the result.

    Args:
        topic_id: str. ID of the given topic.
        change_list: list(TopicChange). A change list to be applied to the given
            topic.

    Returns:
        Topic. The resulting topic domain object.
    """
    topic = get_topic_by_id(topic_id)
    try:
        for change in change_list:
            if change.cmd == topic_domain.CMD_UPDATE_TOPIC_PROPERTY:
                if (change.property_name ==
                        topic_domain.TOPIC_PROPERTY_NAME):
                    topic.update_name(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_DESCRIPTION):
                    topic.update_description(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_CANONICAL_STORY_IDS):
                    topic.update_canonical_story_ids(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_ADDITIONAL_STORY_IDS):
                    topic.update_additional_story_ids(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_SKILL_IDS):
                    topic.update_skill_ids(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE):
                    topic.update_language_code(change.new_value)
        return topic

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, topic_id, change_list)
        )
        raise


def _save_topic(committer_id, topic, commit_message, change_list):
    """Validates a topic and commits it to persistent storage. If
    successful, increments the version number of the incoming topic domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        topic: Topic. The topic domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(TopicChange). List of changes applied to a topic.

    Raises:
        Exception: Received invalid change list.
        Exception: The topic model and the incoming topic domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (topic.id, change_list))
    topic.validate()

    topic_model = topic_models.TopicModel.get(topic.id, strict=False)
    if topic_model is None:
        topic_model = topic_models.TopicModel(id=topic.id)
    else:
        if topic.version > topic_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (topic_model.version, topic.version))
        elif topic.version < topic_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (topic_model.version, topic.version))

    topic_model.description = topic.description
    topic_model.name = topic.name
    topic_model.canonical_story_ids = topic.canonical_story_ids
    topic_model.additional_story_ids = topic.additional_story_ids
    topic_model.skill_ids = topic.skill_ids
    topic_model.language_code = topic.language_code
    change_dicts = [change.to_dict() for change in change_list]
    topic_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(_get_topic_memcache_key(topic.id))
    topic.version += 1


def update_topic(
        committer_id, topic_id, change_list, commit_message):
    """Updates a topic. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - topic_id: str. The topic id.
    - change_list: list(TopicChange). These changes are applied in sequence to
        produce the resulting topic.
    - commit_message: str or None. A description of changes made to the
        topic.

    Raises:
        ValueError: Current user does not have enough rights to edit a topic.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    topic = apply_change_list(topic_id, change_list)
    _save_topic(committer_id, topic, commit_message, change_list)
    create_topic_summary(topic.id)


def delete_topic(committer_id, topic_id, force_deletion=False):
    """Deletes the topic with the given topic_id.

    Args:
        committer_id: str. ID of the committer.
        topic_id: str. ID of the topic to be deleted.
        force_deletion: bool. If true, the topic and its history are fully
            deleted and are unrecoverable. Otherwise, the topic and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.

    Raises:
        ValueError: User does not have enough rights to delete a topic.
    """
    topic_rights_model = topic_models.TopicRightsModel.get(topic_id)
    topic_rights_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_TOPIC_DELETED,
        force_deletion=force_deletion)

    topic_model = topic_models.TopicModel.get(topic_id)
    topic_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_TOPIC_DELETED,
        force_deletion=force_deletion)

    # This must come after the topic is retrieved. Otherwise the memcache
    # key will be reinstated.
    topic_memcache_key = _get_topic_memcache_key(topic_id)
    memcache_services.delete(topic_memcache_key)

    # Delete the summary of the topic (regardless of whether
    # force_deletion is True or not).
    delete_topic_summary(topic_id)


def delete_topic_summary(topic_id):
    """Delete a topic summary model.

    Args:
        topic_id: str. ID of the topic whose topic summary is to
            be deleted.
    """

    topic_models.TopicSummaryModel.get(topic_id).delete()


def create_topic_summary(topic_id):
    """Creates and stores a summary of the given topic.

    Args:
        topic_id: str. ID of the topic.
    """
    topic = get_topic_by_id(topic_id)
    topic_summary = compute_summary_of_topic(topic)
    save_topic_summary(topic_summary)


def compute_summary_of_topic(topic):
    """Create a TopicSummary domain object for a given Topic domain
    object and return it.

    Args:
        topic: Topic. The topic object for which the summary is to be computed.

    Returns:
        TopicSummary. The computed summary for the given topic.
    """
    topic_model_canonical_story_count = len(topic.canonical_story_ids)
    topic_model_additional_story_count = len(topic.additional_story_ids)
    topic_model_skill_count = len(topic.skill_ids)

    topic_summary = topic_domain.TopicSummary(
        topic.id, topic.name, topic.language_code,
        topic.version, topic_model_canonical_story_count,
        topic_model_additional_story_count, topic_model_skill_count,
        topic.created_on, topic.last_updated
    )

    return topic_summary


def save_topic_summary(topic_summary):
    """Save a topic summary domain object as a TopicSummaryModel
    entity in the datastore.

    Args:
        topic_summary: The topic summary object to be saved in the
            datastore.
    """
    topic_summary_model = topic_models.TopicSummaryModel(
        id=topic_summary.id,
        name=topic_summary.name,
        language_code=topic_summary.language_code,
        version=topic_summary.version,
        additional_story_count=topic_summary.additional_story_count,
        canonical_story_count=topic_summary.canonical_story_count,
        skill_count=topic_summary.skill_count,
        topic_model_last_updated=topic_summary.topic_model_last_updated,
        topic_model_created_on=topic_summary.topic_model_created_on
    )

    topic_summary_model.put()


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
        strict: bool. Whether to fail noisily if no topic with a given id
            exists in the datastore.

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


def check_can_edit_topic(user, topic_rights):
    """Checks whether the user can edit the given topic.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        topic_rights: TopicRights or None. Rights object for the given topic.

    Returns:
        bool. Whether the given user can edit the given topic.
    """
    if topic_rights is None:
        return False
    if role_services.ACTION_EDIT_ANY_TOPIC in user.actions:
        return True
    if role_services.ACTION_EDIT_OWNED_TOPIC not in user.actions:
        return False
    if topic_rights.is_manager(user.user_id):
        return True

    return False


def assign_role(committer, assignee, new_role, topic_id):
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        assignee: UserActionsInfo. UserActionsInfo object for the user
            whose role is being changed.
        new_role: str. The name of the new role. Possible values are:
            ROLE_MANAGER
        topic_id: str. ID of the topic.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The assignee is already a manager for the topic.
        Exception. The assignee doesn't have enough rights to become a manager.
        Exception. The role is invalid.
    """
    committer_id = committer.user_id
    topic_rights = get_topic_rights(topic_id)
    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY not in
            committer.actions):
        logging.error(
            'User %s tried to allow user %s to be a %s of topic %s '
            'but was refused permission.' % (
                committer_id, assignee.user_id, new_role, topic_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee.user_id)
    if role_services.ACTION_EDIT_OWNED_TOPIC not in assignee.actions:
        raise Exception(
            'The assignee doesn\'t have enough rights to become a manager.')

    old_role = topic_domain.ROLE_NONE
    if topic_rights.is_manager(assignee.user_id):
        old_role = topic_domain.ROLE_MANAGER

    if new_role == topic_domain.ROLE_MANAGER:
        if topic_rights.is_manager(assignee.user_id):
            raise Exception('This user already is a manager for this topic')
        topic_rights.manager_ids.append(assignee.user_id)
    elif new_role == topic_domain.ROLE_NONE:
        if topic_rights.is_manager(assignee.user_id):
            topic_rights.manager_ids.remove(assignee.user_id)
        else:
            old_role = topic_domain.ROLE_NONE
    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [{
        'cmd': topic_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee.user_id,
        'old_role': old_role,
        'new_role': new_role
    }]

    save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds)

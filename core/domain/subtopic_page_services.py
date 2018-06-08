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

"""Commands for operations on subtopic pages, and related models."""

import logging

from core.domain import subtopic_page_domain
from core.platform import models
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


def get_subtopic_page_from_model(subtopic_page_model):
    """Returns a domain object for an SubtopicPage given a subtopic page model.

    Args:
        subtopic_page_model: SubtopicPageModel.

    Returns:
        SubtopicPage.
    """
    return subtopic_page_domain.SubtopicPage(
        subtopic_page_model.id, subtopic_page_model.topic_id,
        subtopic_page_model.html_data, subtopic_page_model.language_code,
        subtopic_page_model.version
    )


def get_subtopic_page_by_id(topic_id, subtopic_id, strict=True):
    """Returns a domain object representing a topic.

    Args:
        topic_id: str. ID of the topic that the subtopic is a part of.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no topic with the given
            id exists in the datastore.

    Returns:
        SubtopicPage or None. The domain object representing a subtopic page
            with the given id, or None if it does not exist.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    subtopic_page_model = topic_models.SubtopicPageModel.get(
        subtopic_page_id, strict=strict)
    if subtopic_page_model:
        subtopic_page = get_subtopic_page_from_model(subtopic_page_model)
        return subtopic_page
    else:
        return None


def apply_change_list(topic_id, subtopic_id, change_list):
    """Applies a changelist to a topic and returns the result.

    Args:
        topic_id: str. ID of the topic, the subtopic is a part of.
        subtopic_id: int. The id of the subtopic.
        change_list: list(SubtopicPageChange). A change list to be applied to
            the given subtopic page.

    Returns:
        SubtopicPage. The resulting subtopic page domain object.
    """
    subtopic_page = get_subtopic_page_by_id(topic_id, subtopic_id)
    try:
        for change in change_list:
            if (change.cmd ==
                    subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
                if (change.property_name ==
                        subtopic_page_domain.SUBTOPIC_PAGE_PROPERTY_HTML_DATA):
                    subtopic_page.update_html_data(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            else:
                raise Exception('Invalid change dict.')

    except Exception as e:
        logging.error(
            '%s %s %s %s %s' % (
                e.__class__.__name__, e, topic_id, subtopic_id, change_list)
        )
        raise
    return subtopic_page


def update_subtopic_page(
        committer_id, topic_id, subtopic_id, change_list, commit_message):
    """Updates a topic. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - topic_id: str. The id of the  topic, the subtopic is a part of.
    - subtopic_id: int. Id of the subtopic.
    - change_list: list(SubtopicPageChange). These changes are applied in
        sequence to produce the resulting subtopic change.
    - commit_message: str or None. A description of changes made to the
        subtopic page.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    subtopic_page = apply_change_list(topic_id, subtopic_id, change_list)
    _save_subtopic_page(
        committer_id, subtopic_page, commit_message, change_list)


def _create_subtopic_page(
        committer_id, subtopic_page, commit_message, commit_cmds):
    """Creates a new subtopic_page.

    Args:
        committer_id: str. ID of the committer.
        subtopic_page: SubtopicPage. The subtopic page domain object.
        commit_message: str. A description of changes made to the topic.
        commit_cmds: list(SubtopicPageChange). A list of change commands made
            to the given subtopic page.
    """
    subtopic_page.validate()
    model = topic_models.SubtopicPageModel(
        id=subtopic_page.id,
        topic_id=subtopic_page.topic_id,
        html_data=subtopic_page.html_data,
        language_code=subtopic_page.language_code,
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    subtopic_page.version += 1


def save_new_subtopic_page(committer_id, topic_id, subtopic_id):
    """Saves a new topic.

    Args:
        committer_id: str. ID of the committer.
        topic_id: str. The id of the topic the subtopic is a part of..
        subtopic_id: int. The id of the subtopic.
    """
    subtopic_page = (
        subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
            subtopic_id, topic_id))
    commit_message = (
        'New subtopic page created for topic with id \'%s\'.'
        % subtopic_page.topic_id)
    _create_subtopic_page(
        committer_id, subtopic_page, commit_message, [
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_CREATE_NEW,
                'topic_id': subtopic_page.id
            })
        ]
    )


def _save_subtopic_page(
        committer_id, subtopic_page, commit_message, change_list):
    """Validates a subtopic page and commits it to persistent storage. If
    successful, increments the version number of the incoming subtopic page
    domain object by 1.

    Args:
        committer_id: str. ID of the given committer.
        subtopic_page: SubtopicPage. The subtopic page domain object to be
            saved.
        commit_message: str. The commit message.
        change_list: list(SubtopicPageChange). List of changes applied to a
            subtopic page.

    Raises:
        Exception: Received invalid change list.
        Exception: The subtopic page model and the incoming subtopic page domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (subtopic_page.id, change_list))
    subtopic_page.validate()

    subtopic_page_model = topic_models.SubtopicPageModel.get(
        subtopic_page.id, strict=False)
    if subtopic_page_model is None:
        subtopic_page_model = topic_models.SubtopicPageModel(
            id=subtopic_page.id)
    else:
        if subtopic_page.version > subtopic_page_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))
        elif subtopic_page.version < subtopic_page_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))

    subtopic_page_model.topic_id = subtopic_page.topic_id
    subtopic_page_model.html_data = subtopic_page.html_data
    subtopic_page_model.language_code = subtopic_page.language_code
    change_dicts = [change.to_dict() for change in change_list]
    subtopic_page_model.commit(committer_id, commit_message, change_dicts)
    subtopic_page.version += 1


def delete_subtopic_page(
        committer_id, subtopic_id, topic_id, force_deletion=False):
    """Delete a topic summary model.

    Args:
        committer_id: str. The user who is deleting the subtopic page.
        subtopic_id: int. ID of the subtopic which was removed.
        topic_id: str. The topic, this subtopic belonged to.
        force_deletion: bool. If true, the subtopic page and its history are
            fully deleted and are unrecoverable. Otherwise, the subtopic page
            and all its history are marked as deleted, but the corresponding
            models are still retained in the datastore. This last option is the
            preferred one.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    topic_models.SubtopicPageModel.get(subtopic_page_id).delete(
        committer_id, feconf.COMMIT_MESSAGE_SUBTOPIC_PAGE_DELETED,
        force_deletion=force_deletion)

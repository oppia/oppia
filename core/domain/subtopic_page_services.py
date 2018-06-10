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
        strict: bool. Whether to fail noisily if no subtopic page with the given
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


def get_all_subtopic_pages_in_topic(topic_id, include_deleted=False):
    """Returns all subtopic pages linked to a topic.

    Args:
        topic_id: str. The id of the topic to which the subtopic pages are
            linked.
        include_deleted: bool. Whether to include the subtopic pages that
            were not strictly deleted.

    Returns:
        list(SubtopicPage). The list of subtopic pages linked to the given topic
            id.
    """
    subtopic_page_models = topic_models.SubtopicPageModel.query().filter(
        (topic_models.SubtopicPageModel.topic_id == topic_id) and
        (topic_models.SubtopicPageModel.deleted == include_deleted))
    subtopic_pages = [
        get_subtopic_page_from_model(subtopic_page_model)
        for subtopic_page_model in subtopic_page_models
    ]
    return subtopic_pages


def save_subtopic_page(
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


def update_html_data(
        subtopic_pages, subtopic_id, deleted_subtopic_ids, new_html_data):
    """Updates the html_data fields of the subtopic page with the given id in
    the list (if present), provided the id is not in deleted_subtopic_page_ids
    list.

    Args:
        subtopic_pages: list(SubtopicPage). The list of subtopic pages that are
            part of the topic being edited.
        subtopic_id: str. The id of the subtopic page to edit.
        deleted_subtopic_ids: list(int). The ids of the subtopics whose pages
            were deleted in the present change_list (i.e those that are not
            updated in the datastore yet).
        new_html_data: str. The new html data for the given subtopic id.

    Raises:
        Exception. The subtopic page doesn't exist.

    Returns:
        list(SubtopicPage). The modified list of subtopic pages.
    """
    if subtopic_id in deleted_subtopic_ids:
        raise Exception(
            'The subtopic with id %s doesn\'t exist' % subtopic_id)
    for subtopic_page in subtopic_pages:
        if (
                subtopic_page.id ==
                subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                    subtopic_page.topic_id, subtopic_id)):
            subtopic_page.update_html_data(new_html_data)
            return subtopic_pages

    raise Exception(
        'The subtopic with id %s doesn\'t exist' % subtopic_id)


def delete_subtopic_page(
        committer_id, subtopic_id, topic_id, force_deletion=False):
    """Delete a topic summary model.

    Args:
        committer_id: str. The user who is deleting the subtopic page.
        subtopic_id: int. ID of the subtopic which was removed.
        topic_id: str. The ID of the topic that this subtopic belongs to.
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

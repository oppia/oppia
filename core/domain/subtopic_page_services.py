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

import copy
from core.domain import subtopic_page_domain
from core.platform import models
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


def _migrate_page_contents_to_latest_schema(versioned_page_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the page contents structure based on the schema version of the input
    page contents dictionary. If the current page_contents schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_page_contents: A dict with two keys:
          - schema_version: int. The schema version for the page_contents dict.
          - page_contents: dict. The dict comprising the page contents.

    Raises:
        Exception: The schema version of the page_contents is outside of what
            is supported at present.
    """
    page_contents_schema_version = versioned_page_contents['schema_version']
    if not (1 <= page_contents_schema_version
            <= feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d page schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION)

    while (page_contents_schema_version <
           feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        subtopic_page_domain.SubtopicPage.update_page_contents_from_model(
            versioned_page_contents, page_contents_schema_version)
        page_contents_schema_version += 1


def get_subtopic_page_from_model(subtopic_page_model):
    """Returns a domain object for an SubtopicPage given a subtopic page model.

    Args:
        subtopic_page_model: SubtopicPageModel.

    Returns:
        SubtopicPage.
    """
    versioned_page_contents = {
        'schema_version': subtopic_page_model.page_contents_schema_version,
        'page_contents': copy.deepcopy(subtopic_page_model.page_contents)
    }
    if (subtopic_page_model.page_contents_schema_version !=
            feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        _migrate_page_contents_to_latest_schema(versioned_page_contents)
    return subtopic_page_domain.SubtopicPage(
        subtopic_page_model.id,
        subtopic_page_model.topic_id,
        subtopic_page_domain.SubtopicPageContents.from_dict(
            versioned_page_contents['page_contents']),
        versioned_page_contents['schema_version'],
        subtopic_page_model.language_code,
        subtopic_page_model.version
    )


def get_subtopic_page_by_id(topic_id, subtopic_id, strict=True):
    """Returns a domain object representing a subtopic page.

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


def get_subtopic_pages_with_ids(topic_id, subtopic_ids):
    """Returns a list of domain objects with given ids.

    Args:
        topic_id: str. ID of the topic that the subtopics belong to.
        subtopic_ids: list(int). The ids of the subtopics.

    Returns:
        list(SubtopicPage) or None. The list of domain objects representing the
            subtopic pages corresponding to given ids list or None if none
            exist.
    """
    subtopic_page_ids = []
    for subtopic_id in subtopic_ids:
        subtopic_page_ids.append(
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id, subtopic_id))
    subtopic_page_models = topic_models.SubtopicPageModel.get_multi(
        subtopic_page_ids)
    subtopic_pages = []
    for subtopic_page_model in subtopic_page_models:
        if subtopic_page_model is None:
            subtopic_pages.append(subtopic_page_model)
        else:
            subtopic_pages.append(
                get_subtopic_page_from_model(subtopic_page_model))
    return subtopic_pages


def get_subtopic_page_contents_by_id(topic_id, subtopic_id, strict=True):
    """Returns the page contents of a subtopic

    Args:
        topic_id: str. ID of the topic that the subtopic belong to.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no subtopic page with the given
            id exists in the datastore.

    Returns:
        SubtopicPageContents or None: The page contents for a subtopic page,
            or None if subtopic page does not exist.
    """
    subtopic_page = get_subtopic_page_by_id(
        topic_id, subtopic_id, strict=strict)
    if subtopic_page is not None:
        return subtopic_page.page_contents
    else:
        return None


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
    subtopic_page_model.page_contents = subtopic_page.page_contents.to_dict()
    subtopic_page_model.language_code = subtopic_page.language_code
    subtopic_page_model.page_contents_schema_version = (
        subtopic_page.page_contents_schema_version)
    change_dicts = [change.to_dict() for change in change_list]
    subtopic_page_model.commit(committer_id, commit_message, change_dicts)
    subtopic_page.version += 1


def delete_subtopic_page(
        committer_id, topic_id, subtopic_id, force_deletion=False):
    """Delete a topic summary model.

    Args:
        committer_id: str. The user who is deleting the subtopic page.
        topic_id: str. The ID of the topic that this subtopic belongs to.
        subtopic_id: int. ID of the subtopic which was removed.
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

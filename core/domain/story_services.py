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
# limitations under the License.

"""Commands that can be used to operate on storys.

All functions here should be agnostic of how StoryModel objects are
stored in the database. In particular, the various query methods should
delegate to the Story model class. This will enable the story
storage model to be changed without affecting this module and others above it.
"""

import storys
import copy
import logging
import os

from constants import constants
from core.domain import exp_services
from core.domain import story_domain
from core.domain import rights_manager
from core.domain import search_services
from core.platform import models
import feconf
import utils

(story_models,) = models.Registry.import_models([models.NAMES.story])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the story search index.
SEARCH_INDEX_STORIES = 'stories'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10


# Repository GET methods.
def _get_story_memcache_key(story_id, version=None):
    """Returns a memcache key for the story.

    Args:
        story: str. ID of the story.
        version: str. Schema version of the story.

    Returns:
        str. The memcache key of the story.
    """
    if version:
        return 'story-version:%s:%s' % (story_id, version)
    else:
        return 'story:%s' % story_id


def get_story_from_model(story_model):
    """Returns a Story domain object given a story model loaded
    from the datastore.

    Args:
        story_model: StoryModel. The story model loaded from the
            datastore.

    Returns:
        Story. A Story domain object corresponding to the given
        story model.
    """
    return story_domain.Story(
        story_model.id, story_model.title,
        story_model.description, story_model.notes, story_model.topic,
        story_model.story_nodes,
        story_model.language_code,
        story_model.schema_version, [
            story_domain.StoryNode.from_dict(story_node_dict)
            for story_node_dict in story_model.story_nodes
        ],
        story_model.version, story_model.created_on,
        story_model.last_updated)


def get_story_summary_from_model(story_summary_model):
    """Returns a domain object for an Oppia story summary given a
    story summary model.

    Args:
        story_summary_model: StorySummaryModel.

    Returns:
        StorySummary.
    """
    return story_domain.StorySummary(
        story_summary_model.id, story_summary_model.title,
        story_summary_model.category, story_summary_model.objective,
        story_summary_model.language_code, story_summary_model.tags,
        story_summary_model.status,
        story_summary_model.community_owned,
        story_summary_model.owner_ids,
        story_summary_model.editor_ids,
        story_summary_model.viewer_ids,
        story_summary_model.contributor_ids,
        story_summary_model.contributors_summary,
        story_summary_model.version,
        story_summary_model.node_count,
        story_summary_model.story_model_created_on,
        story_summary_model.story_model_last_updated
    )


def get_story_by_id(story_id, strict=True, version=None):
    """Returns a domain object representing a story.

    Args:
        story_id: str. ID of the story.
        strict: bool. Whether to fail noisily if no story with the given
            id exists in the datastore.
        version: str or None. The version number of the story to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Story or None. The domain object representing a story with the
        given id, or None if it does not exist.
    """
    story_memcache_key = _get_story_memcache_key(
        story_id, version=version)
    memcached_story = memcache_services.get_multi(
        [story_memcache_key]).get(story_memcache_key)

    if memcached_story is not None:
        return memcached_story
    else:
        story_model = story_models.StoryModel.get(
            story_id, strict=strict, version=version)
        if story_model:
            story = get_story_from_model(story_model)
            memcache_services.set_multi({story_memcache_key: story})
            return story
        else:
            return None


def get_story_summary_by_id(story_id):
    """Returns a domain object representing a story summary.

    Args:
        story_id: str. ID of the story summary.

    Returns:
        StorySummary. The story summary domain object corresponding to
        a story with the given story_id.
    """
    # TODO(msl): Maybe use memcache similarly to get_story_by_id.
    story_summary_model = story_models.StorySummaryModel.get(
        story_id)
    if story_summary_model:
        story_summary = get_story_summary_from_model(
            story_summary_model)
        return story_summary
    else:
        return None


def get_multiple_storys_by_id(story_ids, strict=True):
    """Returns a dict of domain objects representing storys with the
    given ids as keys.

    Args:
        story_ids: list(str). A list of story ids of storys to
            be retrieved.
        strict: bool. Whether to fail noisily if no story with a given id
            exists in the datastore.

    Returns:
        A dict of domain objects representing storys with the given ids as
        keys.

    Raises:
        ValueError: 'strict' is True, and one or more of the given story
            ids are invalid.
    """
    story_ids = set(story_ids)
    result = {}
    uncached = []
    memcache_keys = [_get_story_memcache_key(i) for i in story_ids]
    cache_result = memcache_services.get_multi(memcache_keys)

    for story_obj in cache_result.itervalues():
        result[story_obj.id] = story_obj

    for _id in story_ids:
        if _id not in result:
            uncached.append(_id)

    db_story_models = story_models.StoryModel.get_multi(
        uncached)
    db_results_dict = {}
    not_found = []
    for index, cid in enumerate(uncached):
        model = db_story_models[index]
        if model:
            story = get_story_from_model(model)
            db_results_dict[cid] = story
        else:
            logging.info('Tried to fetch story with id %s, but no such '
                         'story exists in the datastore' % cid)
            not_found.append(cid)

    if strict and not_found:
        raise ValueError(
            'Couldn\'t find storys with the following ids:\n%s'
            % '\n'.join(not_found))

    cache_update = {
        cid: db_results_dict[cid] for cid in db_results_dict.iterkeys()
        if db_results_dict[cid] is not None
    }

    if cache_update:
        memcache_services.set_multi(cache_update)

    result.update(db_results_dict)
    return result

def get_new_story_id():
    """Returns a new story id.

    Returns:
        str. A new story id.
    """
    return story_models.StoryModel.get_new_id('')

def _get_story_summary_dicts_from_models(story_summary_models):
    """Given an iterable of StorySummaryModel instances, create a dict
    containing corresponding story summary domain objects, keyed by id.

    Args：
        story_summary_models: An iterable of StorySummaryModel
            instances.

    Returns:
        A dict containing corresponding story summary domain objects, keyed
        by id.
    """
    story_summaries = [
        get_story_summary_from_model(story_summary_model)
        for story_summary_model in story_summary_models]
    result = {}
    for story_summary in story_summaries:
        result[story_summary.id] = story_summary
    return result


def get_story_summaries_matching_ids(story_ids):
    """Given a list of story ids, return a list with the corresponding
    summary domain objects (or None if the corresponding summary does not
    exist).

    Args:
        story_ids: A list of story ids.

    Returns:
        list(StorySummary). A list with the corresponding summary domain
        objects.
    """
    return [
        (get_story_summary_from_model(model) if model else None)
        for model in story_models.StorySummaryModel.get_multi(
            story_ids)]

def get_story_ids_matching_query(query_string, cursor=None):
    """Returns a list with all story ids matching the given search query
    string, as well as a search cursor for future fetches.

    Args:
        query_string: str. The search query string.
        cursor: str or None. Cursor indicating where, in the list of
            storys, to start the search from.

    Returns:
        2-tuple of (returned_story_ids, search_cursor), where:
            returned_story_ids : list(str). A list with all story ids
                matching the given search query string, as well as a search
                cursor for future fetches. The list contains exactly
                feconf.SEARCH_RESULTS_PAGE_SIZE results if there are at least
                that many, otherwise it contains all remaining results. (If this
                behaviour does not occur, an error will be logged.)
            search_cursor: str. Search cursor for future fetches.
    """
    returned_story_ids = []
    search_cursor = cursor

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.SEARCH_RESULTS_PAGE_SIZE - len(
            returned_story_ids)

        story_ids, search_cursor = search_services.search_storys(
            query_string, remaining_to_fetch, cursor=search_cursor)

        invalid_story_ids = []
        for ind, model in enumerate(
                story_models.StorySummaryModel.get_multi(
                    story_ids)):
            if model is not None:
                returned_story_ids.append(story_ids[ind])
            else:
                invalid_story_ids.append(story_ids[ind])

        if len(returned_story_ids) == feconf.SEARCH_RESULTS_PAGE_SIZE or (
                search_cursor is None):
            break
        else:
            logging.error(
                'Search index contains stale story ids: %s' %
                ', '.join(invalid_story_ids))

    if (len(returned_story_ids) < feconf.SEARCH_RESULTS_PAGE_SIZE
            and search_cursor is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return (returned_story_ids, search_cursor)


# Repository SAVE and DELETE methods.
def apply_change_list(story_id, change_list):
    """Applies a changelist to a pristine story and returns the result.

    Args:
        story_id: str. ID of the given story.
        change_list: list(dict). A change list to be applied to the given
            story. Each entry in change_list is a dict that represents a
            StoryChange.
    object.

    Returns:
      Story. The resulting story domain object.
    """
    story = get_story_by_id(story_id)
    try:
        changes = [story_domain.StoryChange(change_dict)
                   for change_dict in change_list]

        for change in changes:
            if change.cmd == story_domain.CMD_ADD_COLLECTION_NODE:
                story.add_node(change.exploration_id)
            elif change.cmd == story_domain.CMD_DELETE_COLLECTION_NODE:
                story.delete_node(change.exploration_id)
            elif change.cmd == story_domain.CMD_SWAP_COLLECTION_NODES:
                story.swap_nodes(change.first_index, change.second_index)
            elif change.cmd == story_domain.CMD_EDIT_COLLECTION_PROPERTY:
                if (change.property_name ==
                        story_domain.COLLECTION_PROPERTY_TITLE):
                    story.update_title(change.new_value)
                elif (change.property_name ==
                      story_domain.COLLECTION_PROPERTY_CATEGORY):
                    story.update_category(change.new_value)
                elif (change.property_name ==
                      story_domain.COLLECTION_PROPERTY_OBJECTIVE):
                    story.update_objective(change.new_value)
                elif (change.property_name ==
                      story_domain.COLLECTION_PROPERTY_LANGUAGE_CODE):
                    story.update_language_code(change.new_value)
                elif (change.property_name ==
                      story_domain.COLLECTION_PROPERTY_TAGS):
                    story.update_tags(change.new_value)
            elif (
                    change.cmd ==
                    story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the story model from the datastore into an
                # Story domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # story is sufficient to apply the schema migration.
                continue
        return story

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, story_id, change_list)
        )
        raise

def _save_story(committer_id, story, commit_message, change_list):
    """Validates a story and commits it to persistent storage. If
    successful, increments the version number of the incoming story domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        story: Story. The story domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(dict). List of changes applied to a story. Each
            entry in change_list is a dict that represents a StoryChange.

    Raises:
        ValidationError: An invalid exploration was referenced in the
            story.
        Exception: The story model and the incoming story domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save story %s: %s' % (story.id, change_list))

    story_rights = rights_manager.get_story_rights(story.id)
    if story_rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE:
        story.validate(strict=True)
    else:
        story.validate(strict=False)

    # Validate that all explorations referenced by the story exist.
    exp_ids = story.exploration_ids
    exp_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exp_ids))
    exp_summaries_dict = {
        exp_id: exp_summaries[ind] for (ind, exp_id) in enumerate(exp_ids)
    }
    for story_node in story.nodes:
        if not exp_summaries_dict[story_node.exploration_id]:
            raise utils.ValidationError(
                'Expected story to only reference valid explorations, '
                'but found an exploration with ID: %s (was it deleted?)' %
                story_node.exploration_id)

    # Ensure no explorations are being added that are 'below' the public status
    # of this story. If the story is private, it can have both
    # private and public explorations. If it's public, it can only have public
    # explorations.
    # TODO(bhenning): Ensure the latter is enforced above when trying to
    # publish a story.
    if rights_manager.is_story_public(story.id):
        validate_exps_in_story_are_public(story)

    story_model = story_models.StoryModel.get(
        story.id, strict=False)
    if story_model is None:
        story_model = story_models.StoryModel(id=story.id)
    else:
        if story.version > story_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of story '
                'from version %s. Please reload the page and try again.'
                % (story_model.version, story.version))
        elif story.version < story_model.version:
            raise Exception(
                'Trying to update version %s of story from version %s, '
                'which is too old. Please reload the page and try again.'
                % (story_model.version, story.version))

    story_model.category = story.category
    story_model.title = story.title
    story_model.objective = story.objective
    story_model.language_code = story.language_code
    story_model.tags = story.tags
    story_model.schema_version = story.schema_version
    story_model.story_contents = {
        'nodes': [
            story_node.to_dict() for story_node in story.nodes
        ]
    }
    story_model.node_count = len(story_model.nodes)
    story_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_story_memcache_key(story.id))
    index_storys_given_ids([story.id])

    story.version += 1


def _create_story(committer_id, story, commit_message, commit_cmds):
    """Creates a new story, and ensures that rights for a new story
    are saved first. This is because _save_story() depends on the rights
    object being present to tell it whether to do strict validation or not.

    Args:
        committer_id: str. ID of the committer.
        story: Story. story domain object.
        commit_message: str. A description of changes made to the story.
        commit_cmds: list(dict). A list of change commands made to the given
            story.
    """
    # This line is needed because otherwise a rights object will be created,
    # but the creation of an story object will fail.
    story.validate(strict=False)
    rights_manager.create_new_story_rights(story.id, committer_id)
    model = story_models.StoryModel(
        id=story.id,
        category=story.category,
        title=story.title,
        objective=story.objective,
        language_code=story.language_code,
        tags=story.tags,
        schema_version=story.schema_version,
        story_contents={
            'nodes': [
                story_node.to_dict()
                for story_node in story.nodes
            ]
        },
    )
    model.commit(committer_id, commit_message, commit_cmds)
    story.version += 1
    create_story_summary(story.id, committer_id)


def save_new_story(committer_id, story):
    """Saves a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. Story to be saved.
    """
    commit_message = (
        'New story created with title \'%s\'.' % story.title)
    _create_story(
        committer_id, story, commit_message, [{
            'cmd': CMD_CREATE_NEW,
            'title': story.title,
            'category': story.category,
        }])


def delete_story(committer_id, story_id, force_deletion=False):
    """Deletes the story with the given story_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this story, prior to calling this function.

    Args:
        committer_id: str. ID of the committer.
        story_id: str. ID of the story to be deleted.
        force_deletion: bool. If true, the story and its history are fully
            deleted and are unrecoverable. Otherwise, the story and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
    """
    story_rights_model = story_models.StoryRightsModel.get(
        story_id)
    story_rights_model.delete(
        committer_id, '', force_deletion=force_deletion)

    story_model = story_models.StoryModel.get(story_id)
    story_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_COLLECTION_DELETED,
        force_deletion=force_deletion)

    # This must come after the story is retrieved. Otherwise the memcache
    # key will be reinstated.
    story_memcache_key = _get_story_memcache_key(story_id)
    memcache_services.delete(story_memcache_key)

    # Delete the story from search.
    search_services.delete_storys_from_search_index([story_id])

    # Delete the summary of the story (regardless of whether
    # force_deletion is True or not).
    delete_story_summary(story_id)

    # Remove the story from the featured activity list, if necessary.
    activity_services.remove_featured_activity(
        constants.ACTIVITY_TYPE_COLLECTION, story_id)


def get_story_snapshots_metadata(story_id):
    """Returns the snapshots for this story, as dicts.

    Args:
        story_id: str. The id of the story in question.

    Returns:
        list of dicts, each representing a recent snapshot. Each dict has the
        following keys: committer_id, commit_message, commit_cmds, commit_type,
        created_on_ms, version_number. The version numbers are consecutive and
        in ascending order. There are story.version_number items in the
        returned list.
    """
    story = get_story_by_id(story_id)
    current_version = story.version
    version_nums = range(1, current_version + 1)

    return story_models.StoryModel.get_snapshots_metadata(
        story_id, version_nums)


def publish_story_and_update_user_profiles(committer, story_id):
    """Publishes the story with publish_story() function in
    rights_manager.py, as well as updates first_contribution_msec.

    It is the responsibility of the caller to check that the story is
    valid prior to publication.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        story_id: str. ID of the story to be published.
    """
    rights_manager.publish_story(committer, story_id)
    contribution_time_msec = utils.get_current_time_in_millisecs()
    story_summary = get_story_summary_by_id(story_id)
    contributor_ids = story_summary.contributor_ids
    for contributor in contributor_ids:
        user_services.update_first_contribution_msec_if_not_set(
            contributor, contribution_time_msec)


def update_story(
        committer_id, story_id, change_list, commit_message):
    """Updates a story. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - story_id: str. The story id.
    - change_list: list of dicts, each representing a StoryChange object.
        These changes are applied in sequence to produce the resulting
        story.
    - commit_message: str or None. A description of changes made to the
        story. For published storys, this must be present; for
        unpublished storys, it may be equal to None.
    """
    is_public = rights_manager.is_story_public(story_id)

    if is_public and not commit_message:
        raise ValueError(
            'Story is public so expected a commit message but '
            'received none.')

    story = apply_change_list(story_id, change_list)

    _save_story(committer_id, story, commit_message, change_list)
    update_story_summary(story.id, committer_id)

    if (not rights_manager.is_story_private(story.id) and
            committer_id != feconf.MIGRATION_BOT_USER_ID):
        user_services.update_first_contribution_msec_if_not_set(
            committer_id, utils.get_current_time_in_millisecs())


def create_story_summary(story_id, contributor_id_to_add):
    """Creates and stores a summary of the given story.

    Args:
        story_id: str. ID of the story.
        contributor_id_to_add: str. ID of the contributor to be added to the
            story summary.
    """
    story = get_story_by_id(story_id)
    story_summary = compute_summary_of_story(
        story, contributor_id_to_add)
    save_story_summary(story_summary)


def update_story_summary(story_id, contributor_id_to_add):
    """Update the summary of an story.

    Args:
        story_id: str. ID of the story.
        contributor_id_to_add: str. ID of the contributor to be added to the
            story summary.
    """
    create_story_summary(story_id, contributor_id_to_add)


def compute_summary_of_story(story, contributor_id_to_add):
    """Create a StorySummary domain object for a given Story domain
    object and return it.

    Args:
        story_id: str. ID of the story.
        contributor_id_to_add: str. ID of the contributor to be added to the
            story summary.

    Returns:
        StorySummary. The computed summary for the given story.
    """
    story_rights = story_models.StoryRightsModel.get_by_id(
        story.id)
    story_summary_model = (
        story_models.StorySummaryModel.get_by_id(story.id))

    # Update the contributor id list if necessary (contributors
    # defined as humans who have made a positive (i.e. not just
    # a revert) change to an story's content).
    if story_summary_model:
        contributor_ids = story_summary_model.contributor_ids
        contributors_summary = story_summary_model.contributors_summary
    else:
        contributor_ids = []
        contributors_summary = {}

    if (contributor_id_to_add is not None and
            contributor_id_to_add not in feconf.SYSTEM_USER_IDS and
            contributor_id_to_add not in contributor_ids):
        contributor_ids.append(contributor_id_to_add)

    if contributor_id_to_add not in feconf.SYSTEM_USER_IDS:
        if contributor_id_to_add is None:
            # Revert commit or other non-positive commit.
            contributors_summary = compute_story_contributors_summary(
                story.id)
        else:
            if contributor_id_to_add in contributors_summary:
                contributors_summary[contributor_id_to_add] += 1
            else:
                contributors_summary[contributor_id_to_add] = 1

    story_model_last_updated = story.last_updated
    story_model_created_on = story.created_on
    story_model_node_count = len(story.nodes)

    story_summary = story_domain.StorySummary(
        story.id, story.title, story.category,
        story.objective, story.language_code, story.tags,
        story_rights.status, story_rights.community_owned,
        story_rights.owner_ids, story_rights.editor_ids,
        story_rights.viewer_ids, contributor_ids, contributors_summary,
        story.version, story_model_node_count,
        story_model_created_on,
        story_model_last_updated
    )

    return story_summary


def compute_story_contributors_summary(story_id):
    """Computes the contributors' summary for a given story.

    Args:
        story_id: str. ID of the story.

    Returns:
        A dict whose keys are user_ids and whose values are the number of
        (non-revert) commits made to the given story by that user_id.
        This does not count commits which have since been reverted.
    """
    snapshots_metadata = get_story_snapshots_metadata(story_id)
    current_version = len(snapshots_metadata)
    contributors_summary = storys.defaultdict(int)
    while True:
        snapshot_metadata = snapshots_metadata[current_version - 1]
        committer_id = snapshot_metadata['committer_id']
        is_revert = (snapshot_metadata['commit_type'] == 'revert')
        if not is_revert and committer_id not in feconf.SYSTEM_USER_IDS:
            contributors_summary[committer_id] += 1

        if current_version == 1:
            break

        if is_revert:
            current_version = snapshot_metadata['commit_cmds'][0][
                'version_number']
        else:
            current_version -= 1
    return contributors_summary


def save_story_summary(story_summary):
    """Save a story summary domain object as a StorySummaryModel
    entity in the datastore.

    Args:
        story_summary: The story summary object to be saved in the
            datastore.
    """
    story_summary_model = story_models.StorySummaryModel(
        id=story_summary.id,
        title=story_summary.title,
        category=story_summary.category,
        objective=story_summary.objective,
        language_code=story_summary.language_code,
        tags=story_summary.tags,
        status=story_summary.status,
        community_owned=story_summary.community_owned,
        owner_ids=story_summary.owner_ids,
        editor_ids=story_summary.editor_ids,
        viewer_ids=story_summary.viewer_ids,
        contributor_ids=story_summary.contributor_ids,
        contributors_summary=story_summary.contributors_summary,
        version=story_summary.version,
        node_count=story_summary.node_count,
        story_model_last_updated=(
            story_summary.story_model_last_updated),
        story_model_created_on=(
            story_summary.story_model_created_on)
    )

    story_summary_model.put()


def delete_story_summary(story_id):
    """Delete a story summary model.

    Args:
        story_id: str. ID of the story whose story summary is to
            be deleted.
    """

    story_models.StorySummaryModel.get(story_id).delete()

# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to operate on collections.

All functions here should be agnostic of how CollectionModel objects are
stored in the database. In particular, the various query methods should
delegate to the Collection model class. This will enable the collection
storage model to be changed without affecting this module and others above it.
"""

import collections
import copy
import datetime
import logging
import os

from core.domain import activity_services
from core.domain import collection_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
import feconf
import utils

(collection_models, user_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.user])
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the collection search index.
SEARCH_INDEX_COLLECTIONS = 'collections'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10

# TODO(bhenning): Improve the ranking calculation. Some possible suggestions
# for a better ranking include using an average of the search ranks of each
# exploration referenced in the collection and/or demoting collections
# for any validation errors from explorations referenced in the collection.
_STATUS_PUBLICIZED_BONUS = 30
# This is done to prevent the rank hitting 0 too easily. Note that
# negative ranks are disallowed in the Search API.
_DEFAULT_RANK = 20


def _migrate_collection_to_latest_schema(versioned_collection):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the collection structure based on the schema version of the input
    collection dictionary. This is very similar to the exploration migration
    process seen in exp_services. If any of the current collection schemas
    change, a new conversion function must be added and some code appended to
    this function to account for that new version.

    Args:
        versioned_collection: A dict with two keys:
          - schema_version: the schema version for the collection.
          - nodes: the list of collection nodes comprising the collection.
    """
    collection_schema_version = versioned_collection['schema_version']
    if not (1 <= collection_schema_version
            <= feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d collection schemas at '
            'present.' % feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    # This is where conversion functions will be placed once updates to the
    # collection schemas happen.
    # TODO(sll): Ensure that there is a test similar to
    # exp_domain_test.SchemaMigrationMethodsUnitTests to ensure that the
    # appropriate migration functions are declared.


# Repository GET methods.
def _get_collection_memcache_key(collection_id, version=None):
    """Returns a memcache key for an collection."""
    if version:
        return 'collection-version:%s:%s' % (collection_id, version)
    else:
        return 'collection:%s' % collection_id


def get_collection_from_model(collection_model, run_conversion=True):
    """Returns a Collection domain object given a collection model loaded
    from the datastore.

    If run_conversion is True, then the collection's schema version will be
    checked against the current schema version. If they do not match, the
    collection will be automatically updated to the latest schema version.

    IMPORTANT NOTE TO DEVELOPERS: In general, run_conversion should never be
    False. This option is only used for testing that the schema version
    migration works correctly, and it should never be changed otherwise.
    """

    # Ensure the original collection model does not get altered.
    versioned_collection = {
        'schema_version': collection_model.schema_version,
        'nodes': copy.deepcopy(collection_model.nodes)
    }

    # Migrate the collection if it is not using the latest schema version.
    if (run_conversion and collection_model.schema_version !=
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        _migrate_collection_to_latest_schema(versioned_collection)

    return collection_domain.Collection(
        collection_model.id, collection_model.title,
        collection_model.category, collection_model.objective,
        collection_model.language_code, collection_model.tags,
        versioned_collection['schema_version'], [
            collection_domain.CollectionNode.from_dict(collection_node_dict)
            for collection_node_dict in versioned_collection['nodes']
        ],
        collection_model.version, collection_model.created_on,
        collection_model.last_updated)


def get_collection_summary_from_model(collection_summary_model):
    return collection_domain.CollectionSummary(
        collection_summary_model.id, collection_summary_model.title,
        collection_summary_model.category, collection_summary_model.objective,
        collection_summary_model.language_code, collection_summary_model.tags,
        collection_summary_model.status,
        collection_summary_model.community_owned,
        collection_summary_model.owner_ids,
        collection_summary_model.editor_ids,
        collection_summary_model.viewer_ids,
        collection_summary_model.contributor_ids,
        collection_summary_model.contributors_summary,
        collection_summary_model.version,
        collection_summary_model.node_count,
        collection_summary_model.collection_model_created_on,
        collection_summary_model.collection_model_last_updated
    )


def get_collection_by_id(collection_id, strict=True, version=None):
    """Returns a domain object representing a collection."""
    collection_memcache_key = _get_collection_memcache_key(
        collection_id, version=version)
    memcached_collection = memcache_services.get_multi(
        [collection_memcache_key]).get(collection_memcache_key)

    if memcached_collection is not None:
        return memcached_collection
    else:
        collection_model = collection_models.CollectionModel.get(
            collection_id, strict=strict, version=version)
        if collection_model:
            collection = get_collection_from_model(collection_model)
            memcache_services.set_multi({collection_memcache_key: collection})
            return collection
        else:
            return None


def get_collection_summary_by_id(collection_id):
    """Returns a domain object representing a collection summary."""
    # TODO(msl): Maybe use memcache similarly to get_collection_by_id.
    collection_summary_model = collection_models.CollectionSummaryModel.get(
        collection_id)
    if collection_summary_model:
        collection_summary = get_collection_summary_from_model(
            collection_summary_model)
        return collection_summary
    else:
        return None


def get_multiple_collections_by_id(collection_ids, strict=True):
    """Returns a dict of domain objects representing collections with the
    given ids as keys. If a collection_id is not present it is not included in
    the return dict.
    """
    collection_ids = set(collection_ids)
    result = {}
    uncached = []
    memcache_keys = [_get_collection_memcache_key(i) for i in collection_ids]
    cache_result = memcache_services.get_multi(memcache_keys)

    for collection_obj in cache_result.itervalues():
        result[collection_obj.id] = collection_obj

    for _id in collection_ids:
        if _id not in result:
            uncached.append(_id)

    db_collection_models = collection_models.CollectionModel.get_multi(
        uncached)
    db_results_dict = {}
    not_found = []
    for index, cid in enumerate(uncached):
        model = db_collection_models[index]
        if model:
            collection = get_collection_from_model(model)
            db_results_dict[cid] = collection
        else:
            logging.info('Tried to fetch collection with id %s, but no such '
                         'collection exists in the datastore' % cid)
            not_found.append(cid)

    if strict and not_found:
        raise ValueError(
            'Couldn\'t find collections with the following ids:\n%s'
            % '\n'.join(not_found))

    cache_update = {
        cid: db_results_dict[cid] for cid in db_results_dict.iterkeys()
        if db_results_dict[cid] is not None
    }

    if cache_update:
        memcache_services.set_multi(cache_update)

    result.update(db_results_dict)
    return result


def get_new_collection_id():
    """Returns a new collection id."""
    return collection_models.CollectionModel.get_new_id('')


def is_collection_summary_editable(collection_summary, user_id=None):
    """Checks if a given user may edit an collection by checking
    the given domain object.
    """
    return user_id is not None and (
        user_id in collection_summary.editor_ids
        or user_id in collection_summary.owner_ids
        or collection_summary.community_owned)


# Query methods.
def get_collection_titles_and_categories(collection_ids):
    """Returns collection titles and categories for the given ids.

    The result is a dict with collection ids as keys. The corresponding values
    are dicts with the keys 'title' and 'category'.

    Any invalid collection_ids will not be included in the return dict. No
    error will be raised.
    """
    collection_list = [
        (get_collection_from_model(e) if e else None)
        for e in collection_models.CollectionModel.get_multi(collection_ids)]

    result = {}
    for collection in collection_list:
        if collection is None:
            logging.error('Could not find collection corresponding to id')
        else:
            result[collection.id] = {
                'title': collection.title,
                'category': collection.category,
            }
    return result


def get_completed_exploration_ids(user_id, collection_id):
    """Returns a list of explorations the user has completed within the context
    of the provided collection. Returns an empty list if the user has not yet
    completed any explorations within the collection. Note that this function
    will also return an empty list if either the collection and/or user do not
    exist.

    A progress model isn't added until the first exploration of a collection is
    completed, so, if a model is missing, there isn't enough information to
    infer whether that means the collection doesn't exist, the user doesn't
    exist, or if they just haven't mdae any progress in that collection yet.
    Thus, we just assume the user and collection exist for the sake of this
    call, so it returns an empty list, indicating that no progress has yet been
    made.
    """
    progress_model = user_models.CollectionProgressModel.get(
        user_id, collection_id)
    return progress_model.completed_explorations if progress_model else []


def get_valid_completed_exploration_ids(user_id, collection_id, collection):
    """Returns a filtered version of the return value of
    get_completed_exploration_ids, where explorations not also found within the
    collection are removed from the returned list.
    """
    completed_exploration_ids = get_completed_exploration_ids(
        user_id, collection_id)
    return [
        exp_id for exp_id in completed_exploration_ids
        if collection.get_node(exp_id)
    ]


def get_next_exploration_ids_to_complete_by_user(user_id, collection_id):
    """Returns a list of exploration IDs in the specified collection that the
    given user has not yet attempted and has the prerequisite skills to play.

    Returns the collection's initial explorations if the user has yet to
    complete any explorations within the collection. Returns an empty list if
    the user has completed all of the explorations within the collection.

    See collection_domain.Collection.get_next_exploration_ids for more
    information.
    """
    completed_exploration_ids = get_completed_exploration_ids(
        user_id, collection_id)

    collection = get_collection_by_id(collection_id)
    if completed_exploration_ids:
        return collection.get_next_exploration_ids(completed_exploration_ids)
    else:
        # The user has yet to complete any explorations inside the collection.
        return collection.init_exploration_ids


def record_played_exploration_in_collection_context(
        user_id, collection_id, exploration_id):
    progress_model = user_models.CollectionProgressModel.get_or_create(
        user_id, collection_id)

    if exploration_id not in progress_model.completed_explorations:
        progress_model.completed_explorations.append(exploration_id)
        progress_model.put()


def _get_collection_summary_dicts_from_models(collection_summary_models):
    """Given an iterable of CollectionSummaryModel instances, create a dict
    containing corresponding collection summary domain objects, keyed by id.
    """
    collection_summaries = [
        get_collection_summary_from_model(collection_summary_model)
        for collection_summary_model in collection_summary_models]
    result = {}
    for collection_summary in collection_summaries:
        result[collection_summary.id] = collection_summary
    return result


def get_collection_summaries_matching_ids(collection_ids):
    """Given a list of collection ids, return a list with the corresponding
    summary domain objects (or None if the corresponding summary does not
    exist).
    """
    return [
        (get_collection_summary_from_model(model) if model else None)
        for model in collection_models.CollectionSummaryModel.get_multi(
            collection_ids)]


# TODO(bhenning): Update this function to support also matching the query to
# explorations contained within this collection. Introduce tests to verify this
# behavior.
def get_collection_ids_matching_query(query_string, cursor=None):
    """Returns a list with all collection ids matching the given search query
    string, as well as a search cursor for future fetches.

    This method returns exactly feconf.SEARCH_RESULTS_PAGE_SIZE results if
    there are at least that many, otherwise it returns all remaining results.
    (If this behaviour does not occur, an error will be logged.) The method
    also returns a search cursor.
    """
    returned_collection_ids = []
    search_cursor = cursor

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.SEARCH_RESULTS_PAGE_SIZE - len(
            returned_collection_ids)

        collection_ids, search_cursor = search_collections(
            query_string, remaining_to_fetch, cursor=search_cursor)

        invalid_collection_ids = []
        for ind, model in enumerate(
                collection_models.CollectionSummaryModel.get_multi(
                    collection_ids)):
            if model is not None:
                returned_collection_ids.append(collection_ids[ind])
            else:
                invalid_collection_ids.append(collection_ids[ind])

        if len(returned_collection_ids) == feconf.SEARCH_RESULTS_PAGE_SIZE or (
                search_cursor is None):
            break
        else:
            logging.error(
                'Search index contains stale collection ids: %s' %
                ', '.join(invalid_collection_ids))

    if (len(returned_collection_ids) < feconf.SEARCH_RESULTS_PAGE_SIZE
            and search_cursor is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return (returned_collection_ids, search_cursor)

# Repository SAVE and DELETE methods.
def apply_change_list(collection_id, change_list):
    """Applies a changelist to a pristine collection and returns the result.

    Each entry in change_list is a dict that represents an CollectionChange
    object.

    Returns:
      the resulting collection domain object.
    """
    collection = get_collection_by_id(collection_id)
    try:
        changes = [collection_domain.CollectionChange(change_dict)
                   for change_dict in change_list]

        for change in changes:
            if change.cmd == collection_domain.CMD_ADD_COLLECTION_NODE:
                collection.add_node(change.exploration_id)
            elif change.cmd == collection_domain.CMD_DELETE_COLLECTION_NODE:
                collection.delete_node(change.exploration_id)
            elif (
                    change.cmd ==
                    collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY):
                collection_node = collection.get_node(change.exploration_id)
                if (change.property_name ==
                        collection_domain.COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS): # pylint: disable=line-too-long
                    collection_node.update_prerequisite_skills(
                        change.new_value)
                elif (change.property_name ==
                      collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS): # pylint: disable=line-too-long
                    collection_node.update_acquired_skills(change.new_value)
            elif change.cmd == collection_domain.CMD_EDIT_COLLECTION_PROPERTY:
                if (change.property_name ==
                        collection_domain.COLLECTION_PROPERTY_TITLE):
                    collection.update_title(change.new_value)
                elif (change.property_name ==
                      collection_domain.COLLECTION_PROPERTY_CATEGORY):
                    collection.update_category(change.new_value)
                elif (change.property_name ==
                      collection_domain.COLLECTION_PROPERTY_OBJECTIVE):
                    collection.update_objective(change.new_value)
                elif (change.property_name ==
                      collection_domain.COLLECTION_PROPERTY_LANGUAGE_CODE):
                    collection.update_language_code(change.new_value)
                elif (change.property_name ==
                      collection_domain.COLLECTION_PROPERTY_TAGS):
                    collection.update_tags(change.new_value)
            elif (
                    change.cmd ==
                    collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the collection model from the datastore into an
                # Collection domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # collection is sufficient to apply the schema migration.
                continue
        return collection

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, collection_id, change_list)
        )
        raise


def validate_exps_in_collection_are_public(collection):
    for exploration_id in collection.exploration_ids:
        if rights_manager.is_exploration_private(exploration_id):
            raise utils.ValidationError(
                'Cannot reference a private exploration within a public '
                'collection, exploration ID: %s' % exploration_id)


def _save_collection(committer_id, collection, commit_message, change_list):
    """Validates an collection and commits it to persistent storage.

    If successful, increments the version number of the incoming collection
    domain object by 1.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save collection %s: %s' % (collection.id, change_list))

    collection_rights = rights_manager.get_collection_rights(collection.id)
    if collection_rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE:
        collection.validate(strict=True)
    else:
        collection.validate(strict=False)

    # Validate that all explorations referenced by the collection exist.
    exp_ids = collection.exploration_ids
    exp_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exp_ids))
    exp_summaries_dict = {
        exp_id: exp_summaries[ind] for (ind, exp_id) in enumerate(exp_ids)
    }
    for collection_node in collection.nodes:
        if not exp_summaries_dict[collection_node.exploration_id]:
            raise utils.ValidationError(
                'Expected collection to only reference valid explorations, '
                'but found an exploration with ID: %s (was it deleted?)' %
                collection_node.exploration_id)

    # Ensure no explorations are being added that are 'below' the public status
    # of this collection. If the collection is private, it can have both
    # private and public explorations. If it's public, it can only have public
    # explorations.
    # TODO(bhenning): Ensure the latter is enforced above when trying to
    # publish a collection.
    if rights_manager.is_collection_public(collection.id):
        validate_exps_in_collection_are_public(collection)

    collection_model = collection_models.CollectionModel.get(
        collection.id, strict=False)
    if collection_model is None:
        collection_model = collection_models.CollectionModel(id=collection.id)
    else:
        if collection.version > collection_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of collection '
                'from version %s. Please reload the page and try again.'
                % (collection_model.version, collection.version))
        elif collection.version < collection_model.version:
            raise Exception(
                'Trying to update version %s of collection from version %s, '
                'which is too old. Please reload the page and try again.'
                % (collection_model.version, collection.version))

    collection_model.category = collection.category
    collection_model.title = collection.title
    collection_model.objective = collection.objective
    collection_model.language_code = collection.language_code
    collection_model.tags = collection.tags
    collection_model.schema_version = collection.schema_version
    collection_model.nodes = [
        collection_node.to_dict() for collection_node in collection.nodes
    ]
    collection_model.node_count = len(collection_model.nodes)
    collection_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_collection_memcache_key(collection.id))
    index_collections_given_ids([collection.id])

    collection.version += 1


def _create_collection(committer_id, collection, commit_message, commit_cmds):
    """Ensures that rights for a new collection are saved first.

    This is because _save_collection() depends on the rights object being
    present to tell it whether to do strict validation or not.
    """
    # This line is needed because otherwise a rights object will be created,
    # but the creation of an collection object will fail.
    collection.validate(strict=False)
    rights_manager.create_new_collection_rights(collection.id, committer_id)
    model = collection_models.CollectionModel(
        id=collection.id,
        category=collection.category,
        title=collection.title,
        objective=collection.objective,
        language_code=collection.language_code,
        tags=collection.tags,
        schema_version=collection.schema_version,
        nodes=[
            collection_node.to_dict() for collection_node in collection.nodes
        ],
    )
    model.commit(committer_id, commit_message, commit_cmds)
    collection.version += 1
    create_collection_summary(collection.id, committer_id)


def save_new_collection(committer_id, collection):
    commit_message = (
        'New collection created with title \'%s\'.' % collection.title)
    _create_collection(committer_id, collection, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': collection.title,
        'category': collection.category,
    }])


def delete_collection(committer_id, collection_id, force_deletion=False):
    """Deletes the collection with the given collection_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this collection, prior to calling this function.

    If force_deletion is True the collection and its history are fully deleted
    and are unrecoverable. Otherwise, the collection and all its history are
    marked as deleted, but the corresponding models are still retained in the
    datastore. This last option is the preferred one.
    """
    collection_rights_model = collection_models.CollectionRightsModel.get(
        collection_id)
    collection_rights_model.delete(
        committer_id, '', force_deletion=force_deletion)

    collection_model = collection_models.CollectionModel.get(collection_id)
    collection_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_COLLECTION_DELETED,
        force_deletion=force_deletion)

    # This must come after the collection is retrieved. Otherwise the memcache
    # key will be reinstated.
    collection_memcache_key = _get_collection_memcache_key(collection_id)
    memcache_services.delete(collection_memcache_key)

    # Delete the collection from search.
    delete_documents_from_search_index([collection_id])

    # Delete the summary of the collection (regardless of whether
    # force_deletion is True or not).
    delete_collection_summary(collection_id)

    # Remove the collection from the featured activity list, if necessary.
    activity_services.remove_featured_activity(
        feconf.ACTIVITY_TYPE_COLLECTION, collection_id)


def get_collection_snapshots_metadata(collection_id):
    """Returns the snapshots for this collection, as dicts.

    Args:
        collection_id: str. The id of the collection in question.

    Returns:
        list of dicts, each representing a recent snapshot. Each dict has the
        following keys: committer_id, commit_message, commit_cmds, commit_type,
        created_on_ms, version_number. The version numbers are consecutive and
        in ascending order. There are collection.version_number items in the
        returned list.
    """
    collection = get_collection_by_id(collection_id)
    current_version = collection.version
    version_nums = range(1, current_version + 1)

    return collection_models.CollectionModel.get_snapshots_metadata(
        collection_id, version_nums)


def publish_collection_and_update_user_profiles(committer_id, col_id):
    """Publishes the collection with publish_collection() function in
    rights_manager.py, as well as updates first_contribution_msec.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.
    """
    rights_manager.publish_collection(committer_id, col_id)
    contribution_time_msec = utils.get_current_time_in_millisecs()
    collection_summary = get_collection_summary_by_id(col_id)
    contributor_ids = collection_summary.contributor_ids
    for contributor in contributor_ids:
        user_services.update_first_contribution_msec_if_not_set(
            contributor, contribution_time_msec)


def update_collection(
        committer_id, collection_id, change_list, commit_message):
    """Update an collection. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - collection_id: str. The collection id.
    - change_list: list of dicts, each representing a CollectionChange object.
        These changes are applied in sequence to produce the resulting
        collection.
    - commit_message: str or None. A description of changes made to the
        collection. For published collections, this must be present; for
        unpublished collections, it may be equal to None.
    """
    is_public = rights_manager.is_collection_public(collection_id)

    if is_public and not commit_message:
        raise ValueError(
            'Collection is public so expected a commit message but '
            'received none.')

    collection = apply_change_list(collection_id, change_list)
    _save_collection(committer_id, collection, commit_message, change_list)
    update_collection_summary(collection.id, committer_id)

    if not rights_manager.is_collection_private(collection.id):
        user_services.update_first_contribution_msec_if_not_set(
            committer_id, utils.get_current_time_in_millisecs())


def create_collection_summary(collection_id, contributor_id_to_add):
    """Create summary of a collection and store in datastore."""
    collection = get_collection_by_id(collection_id)
    collection_summary = compute_summary_of_collection(
        collection, contributor_id_to_add)
    save_collection_summary(collection_summary)


def update_collection_summary(collection_id, contributor_id_to_add):
    """Update the summary of an collection."""
    create_collection_summary(collection_id, contributor_id_to_add)


def compute_summary_of_collection(collection, contributor_id_to_add):
    """Create a CollectionSummary domain object for a given Collection domain
    object and return it.
    """
    collection_rights = collection_models.CollectionRightsModel.get_by_id(
        collection.id)
    collection_summary_model = (
        collection_models.CollectionSummaryModel.get_by_id(collection.id))

    # Update the contributor id list if necessary (contributors
    # defined as humans who have made a positive (i.e. not just
    # a revert) change to an collection's content).
    if collection_summary_model:
        contributor_ids = collection_summary_model.contributor_ids
        contributors_summary = collection_summary_model.contributors_summary
    else:
        contributor_ids = []
        contributors_summary = {}

    if (contributor_id_to_add is not None and
            contributor_id_to_add not in feconf.SYSTEM_USER_IDS and
            contributor_id_to_add not in contributor_ids):
        contributor_ids.append(contributor_id_to_add)

    if contributor_id_to_add not in feconf.SYSTEM_USER_IDS:
        if contributor_id_to_add is None:
            # Revert commit or other non-positive commit
            contributors_summary = compute_collection_contributors_summary(
                collection.id)
        else:
            if contributor_id_to_add in contributors_summary:
                contributors_summary[contributor_id_to_add] += 1
            else:
                contributors_summary[contributor_id_to_add] = 1

    collection_model_last_updated = collection.last_updated
    collection_model_created_on = collection.created_on
    collection_model_node_count = len(collection.nodes)

    collection_summary = collection_domain.CollectionSummary(
        collection.id, collection.title, collection.category,
        collection.objective, collection.language_code, collection.tags,
        collection_rights.status, collection_rights.community_owned,
        collection_rights.owner_ids, collection_rights.editor_ids,
        collection_rights.viewer_ids, contributor_ids, contributors_summary,
        collection.version, collection_model_node_count,
        collection_model_created_on,
        collection_model_last_updated
    )

    return collection_summary


def compute_collection_contributors_summary(collection_id):
    """Returns a dict whose keys are user_ids and whose values are
    the number of (non-revert) commits made to the given collection
    by that user_id. This does not count commits which have since been reverted.
    """
    snapshots_metadata = get_collection_snapshots_metadata(collection_id)
    current_version = len(snapshots_metadata)
    contributors_summary = collections.defaultdict(int)
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


def save_collection_summary(collection_summary):
    """Save a collection summary domain object as a CollectionSummaryModel
    entity in the datastore.
    """
    collection_summary_model = collection_models.CollectionSummaryModel(
        id=collection_summary.id,
        title=collection_summary.title,
        category=collection_summary.category,
        objective=collection_summary.objective,
        language_code=collection_summary.language_code,
        tags=collection_summary.tags,
        status=collection_summary.status,
        community_owned=collection_summary.community_owned,
        owner_ids=collection_summary.owner_ids,
        editor_ids=collection_summary.editor_ids,
        viewer_ids=collection_summary.viewer_ids,
        contributor_ids=collection_summary.contributor_ids,
        contributors_summary=collection_summary.contributors_summary,
        version=collection_summary.version,
        node_count=collection_summary.node_count,
        collection_model_last_updated=(
            collection_summary.collection_model_last_updated),
        collection_model_created_on=(
            collection_summary.collection_model_created_on)
    )

    collection_summary_model.put()


def delete_collection_summary(collection_id):
    """Delete a collection summary model."""

    collection_models.CollectionSummaryModel.get(collection_id).delete()


def save_new_collection_from_yaml(committer_id, yaml_content, collection_id):
    collection = collection_domain.Collection.from_yaml(
        collection_id, yaml_content)
    commit_message = (
        'New collection created from YAML file with title \'%s\'.'
        % collection.title)

    _create_collection(committer_id, collection, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': collection.title,
        'category': collection.category,
    }])

    return collection


def delete_demo(collection_id):
    """Deletes a single demo collection."""
    if not collection_domain.Collection.is_demo_collection_id(collection_id):
        raise Exception('Invalid demo collection id %s' % collection_id)

    collection = get_collection_by_id(collection_id, strict=False)
    if not collection:
        logging.info('Collection with id %s was not deleted, because it '
                     'does not exist.' % collection_id)
    else:
        delete_collection(
            feconf.SYSTEM_COMMITTER_ID, collection_id, force_deletion=True)


def load_demo(collection_id):
    """Loads a demo collection.

    The resulting collection will have version 2 (one for its initial
    creation and one for its subsequent modification.)
    """
    delete_demo(collection_id)

    if not collection_domain.Collection.is_demo_collection_id(collection_id):
        raise Exception('Invalid demo collection id %s' % collection_id)

    demo_filepath = os.path.join(
        feconf.SAMPLE_COLLECTIONS_DIR,
        feconf.DEMO_COLLECTIONS[collection_id])

    if demo_filepath.endswith('yaml'):
        yaml_content = utils.get_file_contents(demo_filepath)
    else:
        raise Exception('Unrecognized file path: %s' % demo_filepath)

    collection = save_new_collection_from_yaml(
        feconf.SYSTEM_COMMITTER_ID, yaml_content, collection_id)

    publish_collection_and_update_user_profiles(
        feconf.SYSTEM_COMMITTER_ID, collection_id)

    index_collections_given_ids([collection_id])

    # Now, load all of the demo explorations that are part of the collection.
    for collection_node in collection.nodes:
        exp_id = collection_node.exploration_id
        # Only load the demo exploration if it is not yet loaded.
        if exp_services.get_exploration_by_id(exp_id, strict=False) is None:
            exp_services.load_demo(exp_id)

    logging.info('Collection with id %s was loaded.' % collection_id)


# TODO(bhenning): Cleanup search logic and abstract it between explorations and
# collections to avoid code duplication.


def get_next_page_of_all_commits(
        page_size=feconf.COMMIT_LIST_PAGE_SIZE, urlsafe_start_cursor=None):
    """Returns a page of commits to all collections in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        collection_models.CollectionCommitLogEntryModel.get_all_commits(
            page_size, urlsafe_start_cursor))

    return ([collection_domain.CollectionCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.collection_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_next_page_of_all_non_private_commits(
        page_size=feconf.COMMIT_LIST_PAGE_SIZE, urlsafe_start_cursor=None,
        max_age=None):
    """Returns a page of non-private commits in reverse time order. If max_age
    is given, it should be a datetime.timedelta instance.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    if max_age is not None and not isinstance(max_age, datetime.timedelta):
        raise ValueError(
            "max_age must be a datetime.timedelta instance. or None.")

    results, new_urlsafe_start_cursor, more = (
        collection_models.CollectionCommitLogEntryModel.get_all_non_private_commits( # pylint: disable=line-too-long
            page_size, urlsafe_start_cursor, max_age=max_age))

    return ([collection_domain.CollectionCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.collection_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def _collection_rights_to_search_dict(rights):
    # Allow searches like "is:featured".
    doc = {}
    if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED:
        doc['is'] = 'featured'
    return doc


def _should_index(collection):
    rights = rights_manager.get_collection_rights(collection.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _get_search_rank(collection_id):
    """Returns an integer determining the document's rank in search.

    Featured collections get a ranking bump, and so do collections that
    have been more recently updated.
    """
    rights = rights_manager.get_collection_rights(collection_id)
    rank = _DEFAULT_RANK + (
        _STATUS_PUBLICIZED_BONUS
        if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED
        else 0)

    # Ranks must be non-negative.
    return max(rank, 0)


def _collection_to_search_dict(collection):
    rights = rights_manager.get_collection_rights(collection.id)
    doc = {
        'id': collection.id,
        'title': collection.title,
        'category': collection.category,
        'objective': collection.objective,
        'language_code': collection.language_code,
        'tags': collection.tags,
        'rank': _get_search_rank(collection.id),
    }
    doc.update(_collection_rights_to_search_dict(rights))
    return doc


def clear_search_index():
    """WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    search_services.clear_index(SEARCH_INDEX_COLLECTIONS)


def index_collections_given_ids(collection_ids):
    # We pass 'strict=False' so as not to index deleted collections.
    collection_list = get_multiple_collections_by_id(
        collection_ids, strict=False).values()
    search_services.add_documents_to_index([
        _collection_to_search_dict(collection)
        for collection in collection_list
        if _should_index(collection)
    ], SEARCH_INDEX_COLLECTIONS)


def patch_collection_search_document(collection_id, update):
    """Patches an collection's current search document, with the values
    from the 'update' dictionary.
    """
    doc = search_services.get_document_from_index(
        collection_id, SEARCH_INDEX_COLLECTIONS)
    doc.update(update)
    search_services.add_documents_to_index([doc], SEARCH_INDEX_COLLECTIONS)


def update_collection_status_in_search(collection_id):
    rights = rights_manager.get_collection_rights(collection_id)
    if rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        delete_documents_from_search_index([collection_id])
    else:
        patch_collection_search_document(
            rights.id, _collection_rights_to_search_dict(rights))


def delete_documents_from_search_index(collection_ids):
    search_services.delete_documents_from_index(
        collection_ids, SEARCH_INDEX_COLLECTIONS)


def search_collections(query, limit, sort=None, cursor=None):
    """Searches through the available collections.

    args:
      - query_string: the query string to search for.
      - sort: a string indicating how to sort results. This should be a string
          of space separated values. Each value should start with a '+' or a
          '-' character indicating whether to sort in ascending or descending
          order respectively. This character should be followed by a field name
          to sort on. When this is None, results are based on 'rank'. See
          _get_search_rank to see how rank is determined.
      - limit: the maximum number of results to return.
      - cursor: A cursor, used to get the next page of results.
          If there are more documents that match the query than 'limit', this
          function will return a cursor to get the next page.

    returns: a tuple:
      - a list of collection ids that match the query.
      - a cursor if there are more matching collections to fetch, None
          otherwise. If a cursor is returned, it will be a web-safe string that
          can be used in URLs.
    """
    return search_services.search(
        query, SEARCH_INDEX_COLLECTIONS, cursor, limit, sort, ids_only=True)

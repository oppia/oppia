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
import logging
import os

from constants import constants
from core.domain import activity_services
from core.domain import collection_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

(collection_models, user_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the collection search index.
SEARCH_INDEX_COLLECTIONS = 'collections'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10


def _migrate_collection_contents_to_latest_schema(
        versioned_collection_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the collection structure based on the schema version of the input
    collection dictionary. This is very similar to the exploration migration
    process seen in exp_services. If any of the current collection schemas
    change, a new conversion function must be added and some code appended to
    this function to account for that new version.

    Args:
        versioned_collection_contents: A dict with two keys:
          - schema_version: str. The schema version for the collection.
          - collection_contents: dict. The dict comprising the collection
              contents.

    Raises:
        Exception: The schema version of the collection is outside of what is
        supported at present.
    """
    collection_schema_version = versioned_collection_contents['schema_version']
    if not (1 <= collection_schema_version
            <= feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d collection schemas at '
            'present.' % feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    while (collection_schema_version <
           feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        collection_domain.Collection.update_collection_contents_from_model(
            versioned_collection_contents, collection_schema_version)
        collection_schema_version += 1


# Repository GET methods.
def _get_collection_memcache_key(collection_id, version=None):
    """Returns a memcache key for the collection.

    Args:
        collection_id: str. ID of the collection.
        version: str. Schema version of the collection.

    Returns:
        str. The memcache key of the collection.
    """
    if version:
        return 'collection-version:%s:%s' % (collection_id, version)
    else:
        return 'collection:%s' % collection_id


def get_collection_from_model(collection_model, run_conversion=True):
    """Returns a Collection domain object given a collection model loaded
    from the datastore.

    Args:
        collection_model: CollectionModel. The collection model loaded from the
            datastore.
        run_conversion: bool. If true, the the collection's schema version will
            be checked against the current schema version. If they do not match,
            the collection will be automatically updated to the latest schema
            version.

            IMPORTANT NOTE TO DEVELOPERS: In general, run_conversion should
            never be False. This option is only used for testing that the
            schema version migration works correctly, and it should never be
            changed otherwise.

    Returns:
        Collection. A Collection domain object corresponding to the given
        collection model.
    """

    # Ensure the original collection model does not get altered.
    versioned_collection_contents = {
        'schema_version': collection_model.schema_version,
        'collection_contents':
            copy.deepcopy(collection_model.collection_contents)
    }

    # If collection is in version 2, copy nodes data to collection contents.
    if collection_model.schema_version == 2:
        versioned_collection_contents['collection_contents'] = {
            'nodes': copy.deepcopy(collection_model.nodes)
        }

    # Migrate the collection if it is not using the latest schema version.
    if (run_conversion and collection_model.schema_version !=
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        _migrate_collection_contents_to_latest_schema(
            versioned_collection_contents)

    return collection_domain.Collection(
        collection_model.id, collection_model.title,
        collection_model.category, collection_model.objective,
        collection_model.language_code, collection_model.tags,
        versioned_collection_contents['schema_version'], [
            collection_domain.CollectionNode.from_dict(collection_node_dict)
            for collection_node_dict in
            versioned_collection_contents['collection_contents']['nodes']
        ],
        collection_model.version, collection_model.created_on,
        collection_model.last_updated)


def get_collection_summary_from_model(collection_summary_model):
    """Returns a domain object for an Oppia collection summary given a
    collection summary model.

    Args:
        collection_summary_model: CollectionSummaryModel.

    Returns:
        CollectionSummary.
    """
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
    """Returns a domain object representing a collection.

    Args:
        collection_id: str. ID of the collection.
        strict: bool. Whether to fail noisily if no collection with the given
            id exists in the datastore.
        version: str or None. The version number of the collection to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Collection or None. The domain object representing a collection with the
        given id, or None if it does not exist.
    """
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
    """Returns a domain object representing a collection summary.

    Args:
        collection_id: str. ID of the collection summary.

    Returns:
        CollectionSummary. The collection summary domain object corresponding to
        a collection with the given collection_id.
    """
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
    given ids as keys.

    Args:
        collection_ids: list(str). A list of collection ids of collections to
            be retrieved.
        strict: bool. Whether to fail noisily if no collection with a given id
            exists in the datastore.

    Returns:
        A dict of domain objects representing collections with the given ids as
        keys.

    Raises:
        ValueError: 'strict' is True, and one or more of the given collection
            ids are invalid.
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


def get_collection_and_collection_rights_by_id(collection_id):
    """Returns a tuple for collection domain object and collection rights
    object.

    Args:
        collection_id: str. Id of the collection.

    Returns:
        tuple(Collection|None, CollectionRights|None). The collection and
        collection rights domain object, respectively.
    """
    collection_and_rights = (
        datastore_services.fetch_multiple_entities_by_ids_and_models(
            [
                ('CollectionModel', [collection_id]),
                ('CollectionRightsModel', [collection_id])
            ]))

    collection = None
    if collection_and_rights[0][0] is not None:
        collection = get_collection_from_model(
            collection_and_rights[0][0])

    collection_rights = None
    if collection_and_rights[1][0] is not None:
        collection_rights = (
            rights_manager.get_activity_rights_from_model(
                collection_and_rights[1][0],
                constants.ACTIVITY_TYPE_COLLECTION))

    return (collection, collection_rights)


def get_new_collection_id():
    """Returns a new collection id.

    Returns:
        str. A new collection id.
    """
    return collection_models.CollectionModel.get_new_id('')


# Query methods.
def get_collection_titles_and_categories(collection_ids):
    """Returns collection titles and categories for the given ids.

    Args:
        collection_ids: list(str). IDs of the collections whose titles and
            categories are to be retrieved.

    Returns:
        A dict with collection ids as keys. The corresponding values
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
    of the provided collection.

    Args:
        user_id: str. ID of the given user.
        collection_id: str. ID of the collection.

    Returns:
        list(Exploration). A list of explorations that the user with the given
        user id has completed within the context of the provided collection with
        the given collection id. The list is empty if the user has not yet
        completed any explorations within the collection, or if either the
        collection and/or user do not exist.

        A progress model isn't added until the first exploration of a collection
        is completed, so, if a model is missing, there isn't enough information
        to infer whether that means the collection doesn't exist, the user
        doesn't exist, or if they just haven't mdae any progress in that
        collection yet. Thus, we just assume the user and collection exist for
        the sake of this call, so it returns an empty list, indicating that no
        progress has yet been made.
    """
    progress_model = user_models.CollectionProgressModel.get(
        user_id, collection_id)
    return progress_model.completed_explorations if progress_model else []


def get_explorations_completed_in_collections(user_id, collection_ids):
    """Returns the ids of the explorations completed in each of the collections.

    Args:
        user_id: str. ID of the given user.
        collection_ids: list(str). IDs of the collections.

    Returns:
        list(list(str)). List of the exploration ids completed in each
            collection.
    """
    progress_models = user_models.CollectionProgressModel.get_multi(
        user_id, collection_ids)

    exploration_ids_completed_in_collections = []

    for progress_model in progress_models:
        if progress_model:
            exploration_ids_completed_in_collections.append(
                progress_model.completed_explorations)
        else:
            exploration_ids_completed_in_collections.append([])

    return exploration_ids_completed_in_collections


def get_valid_completed_exploration_ids(user_id, collection):
    """Returns a filtered version of the return value of
    get_completed_exploration_ids, which only includes explorations found within
    the current version of the collection.

    Args:
        user_id: str. ID of the given user.
        collection: Collection.

    Returns:
        A filtered version of the return value of get_completed_exploration_ids
        which only includes explorations found within the current version of
        the collection.
    """
    completed_exploration_ids = get_completed_exploration_ids(
        user_id, collection.id)
    return [
        exp_id for exp_id in completed_exploration_ids
        if collection.get_node(exp_id)
    ]


def get_next_exploration_id_to_complete_by_user(user_id, collection_id):
    """Returns the first exploration ID in the specified collection that the
    given user has not yet attempted.

    Args:
        user_id: str. ID of the user.
        collection_id: str. ID of the collection.

    Returns:
        str. The first exploration ID in the specified collection that
        the given user has not completed. Returns the collection's initial
        exploration if the user has yet to complete any explorations
        within the collection.
    """
    completed_exploration_ids = get_completed_exploration_ids(
        user_id, collection_id)

    collection = get_collection_by_id(collection_id)
    if completed_exploration_ids:
        return collection.get_next_exploration_id(completed_exploration_ids)
    else:
        # The user has yet to complete any explorations inside the collection.
        return collection.first_exploration_id


def record_played_exploration_in_collection_context(
        user_id, collection_id, exploration_id):
    """Records a exploration by a given user in a given collection
    context as having been played.

    Args:
        user_id: str. ID of the given user.
        collection_id: str. ID of the given collection.
        exploration_id: str. ID of the given exploration.
    """
    progress_model = user_models.CollectionProgressModel.get_or_create(
        user_id, collection_id)

    if exploration_id not in progress_model.completed_explorations:
        progress_model.completed_explorations.append(exploration_id)
        progress_model.put()


def _get_collection_summary_dicts_from_models(collection_summary_models):
    """Given an iterable of CollectionSummaryModel instances, create a dict
    containing corresponding collection summary domain objects, keyed by id.

    Args：
        collection_summary_models: An iterable of CollectionSummaryModel
            instances.

    Returns:
        A dict containing corresponding collection summary domain objects, keyed
        by id.
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

    Args:
        collection_ids: A list of collection ids.

    Returns:
        list(CollectionSummary). A list with the corresponding summary domain
        objects.
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

    Args:
        query_string: str. The search query string.
        cursor: str or None. Cursor indicating where, in the list of
            collections, to start the search from.

    Returns:
        2-tuple of (returned_collection_ids, search_cursor), where:
            returned_collection_ids : list(str). A list with all collection ids
                matching the given search query string, as well as a search
                cursor for future fetches. The list contains exactly
                feconf.SEARCH_RESULTS_PAGE_SIZE results if there are at least
                that many, otherwise it contains all remaining results. (If this
                behaviour does not occur, an error will be logged.)
            search_cursor: str. Search cursor for future fetches.
    """
    returned_collection_ids = []
    search_cursor = cursor

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.SEARCH_RESULTS_PAGE_SIZE - len(
            returned_collection_ids)

        collection_ids, search_cursor = search_services.search_collections(
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

    Args:
        collection_id: str. ID of the given collection.
        change_list: list(dict). A change list to be applied to the given
            collection. Each entry in change_list is a dict that represents a
            CollectionChange.
    object.

    Returns:
      Collection. The resulting collection domain object.
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
            elif change.cmd == collection_domain.CMD_SWAP_COLLECTION_NODES:
                collection.swap_nodes(change.first_index, change.second_index)
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
    """Validates that explorations in a given collection are public.

    Args:
        collection: Collection. Collection to be validated.

    Raises:
        ValidationError: The collection contains at least one private
            exploration.
    """
    for exploration_id in collection.exploration_ids:
        if rights_manager.is_exploration_private(exploration_id):
            raise utils.ValidationError(
                'Cannot reference a private exploration within a public '
                'collection, exploration ID: %s' % exploration_id)


def _save_collection(committer_id, collection, commit_message, change_list):
    """Validates a collection and commits it to persistent storage. If
    successful, increments the version number of the incoming collection domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        collection: Collection. The collection domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(dict). List of changes applied to a collection. Each
            entry in change_list is a dict that represents a CollectionChange.

    Raises:
        ValidationError: An invalid exploration was referenced in the
            collection.
        Exception: The collection model and the incoming collection domain
            object have different version numbers.
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
    collection_model.collection_contents = {
        'nodes': [
            collection_node.to_dict() for collection_node in collection.nodes
        ]
    }
    collection_model.node_count = len(collection_model.nodes)
    collection_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_collection_memcache_key(collection.id))
    index_collections_given_ids([collection.id])

    collection.version += 1


def _create_collection(committer_id, collection, commit_message, commit_cmds):
    """Creates a new collection, and ensures that rights for a new collection
    are saved first. This is because _save_collection() depends on the rights
    object being present to tell it whether to do strict validation or not.

    Args:
        committer_id: str. ID of the committer.
        collection: Collection. collection domain object.
        commit_message: str. A description of changes made to the collection.
        commit_cmds: list(dict). A list of change commands made to the given
            collection.
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
        collection_contents={
            'nodes': [
                collection_node.to_dict()
                for collection_node in collection.nodes
            ]
        },
    )
    model.commit(committer_id, commit_message, commit_cmds)
    collection.version += 1
    create_collection_summary(collection.id, committer_id)


def save_new_collection(committer_id, collection):
    """Saves a new collection.

    Args:
        committer_id: str. ID of the committer.
        collection: Collection. Collection to be saved.
    """
    commit_message = (
        'New collection created with title \'%s\'.' % collection.title)
    _create_collection(
        committer_id, collection, commit_message, [{
            'cmd': CMD_CREATE_NEW,
            'title': collection.title,
            'category': collection.category,
        }])


def delete_collection(committer_id, collection_id, force_deletion=False):
    """Deletes the collection with the given collection_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this collection, prior to calling this function.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection to be deleted.
        force_deletion: bool. If true, the collection and its history are fully
            deleted and are unrecoverable. Otherwise, the collection and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
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
    search_services.delete_collections_from_search_index([collection_id])

    # Delete the summary of the collection (regardless of whether
    # force_deletion is True or not).
    delete_collection_summary(collection_id)

    # Remove the collection from the featured activity list, if necessary.
    activity_services.remove_featured_activity(
        constants.ACTIVITY_TYPE_COLLECTION, collection_id)


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


def publish_collection_and_update_user_profiles(committer, collection_id):
    """Publishes the collection with publish_collection() function in
    rights_manager.py, as well as updates first_contribution_msec.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        collection_id: str. ID of the collection to be published.
    """
    rights_manager.publish_collection(committer, collection_id)
    contribution_time_msec = utils.get_current_time_in_millisecs()
    collection_summary = get_collection_summary_by_id(collection_id)
    contributor_ids = collection_summary.contributor_ids
    for contributor in contributor_ids:
        user_services.update_first_contribution_msec_if_not_set(
            contributor, contribution_time_msec)


def update_collection(
        committer_id, collection_id, change_list, commit_message):
    """Updates a collection. Commits changes.

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

    if (not rights_manager.is_collection_private(collection.id) and
            committer_id != feconf.MIGRATION_BOT_USER_ID):
        user_services.update_first_contribution_msec_if_not_set(
            committer_id, utils.get_current_time_in_millisecs())


def create_collection_summary(collection_id, contributor_id_to_add):
    """Creates and stores a summary of the given collection.

    Args:
        collection_id: str. ID of the collection.
        contributor_id_to_add: str. ID of the contributor to be added to the
            collection summary.
    """
    collection = get_collection_by_id(collection_id)
    collection_summary = compute_summary_of_collection(
        collection, contributor_id_to_add)
    save_collection_summary(collection_summary)


def update_collection_summary(collection_id, contributor_id_to_add):
    """Update the summary of an collection.

    Args:
        collection_id: str. ID of the collection.
        contributor_id_to_add: str. ID of the contributor to be added to the
            collection summary.
    """
    create_collection_summary(collection_id, contributor_id_to_add)


def compute_summary_of_collection(collection, contributor_id_to_add):
    """Create a CollectionSummary domain object for a given Collection domain
    object and return it.

    Args:
        collection: Collection. The collection object.
        contributor_id_to_add: str. ID of the contributor to be added to the
            collection summary.

    Returns:
        CollectionSummary. The computed summary for the given collection.
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
            # Revert commit or other non-positive commit.
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
    """Computes the contributors' summary for a given collection.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        A dict whose keys are user_ids and whose values are the number of
        (non-revert) commits made to the given collection by that user_id.
        This does not count commits which have since been reverted.
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

    Args:
        collection_summary: The collection summary object to be saved in the
            datastore.
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
    """Delete a collection summary model.

    Args:
        collection_id: str. ID of the collection whose collection summary is to
            be deleted.
    """

    collection_models.CollectionSummaryModel.get(collection_id).delete()


def save_new_collection_from_yaml(committer_id, yaml_content, collection_id):
    """Saves a new collection from a yaml content string.

    Args:
        committer_id: str. ID of the committer.
        yaml_content: str. The yaml content string specifying a collection.
        collection_id: str. ID of the saved collection.

    Returns:
        collection. The collection object.
    """
    collection = collection_domain.Collection.from_yaml(
        collection_id, yaml_content)
    commit_message = (
        'New collection created from YAML file with title \'%s\'.'
        % collection.title)

    _create_collection(
        committer_id, collection, commit_message, [{
            'cmd': CMD_CREATE_NEW,
            'title': collection.title,
            'category': collection.category,
        }])

    return collection


def delete_demo(collection_id):
    """Deletes a single demo collection.

    Args:
        collection_id: str. ID of the demo collection to be deleted.
    """
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
    creation and one for its subsequent modification).

    Args:
        collection_id: str. ID of the collection to be loaded.
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

    system_user = user_services.get_system_user()
    publish_collection_and_update_user_profiles(system_user, collection_id)

    index_collections_given_ids([collection_id])

    # Now, load all of the demo explorations that are part of the collection.
    for collection_node in collection.nodes:
        exp_id = collection_node.exploration_id
        # Only load the demo exploration if it is not yet loaded.
        if exp_services.get_exploration_by_id(exp_id, strict=False) is None:
            exp_services.load_demo(exp_id)

    logging.info('Collection with id %s was loaded.' % collection_id)


def index_collections_given_ids(collection_ids):
    """Adds the given collections to the search index.

    Args:
        collection_ids: list(str). List of collection ids whose collections are
            to be indexed.
    """
    collection_summaries = get_collection_summaries_matching_ids(collection_ids)
    search_services.index_collection_summaries([
        collection_summary for collection_summary in collection_summaries
        if collection_summary is not None])

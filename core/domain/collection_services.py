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

__author__ = 'Ben Henning'

import copy
import logging
import os

from core.domain import event_services
from core.domain import collection_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
(collection_models,) = models.Registry.import_models([models.NAMES.collection])
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()
import feconf
import utils


# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the collection search index.
SEARCH_INDEX_COLLECTIONS = 'collections'


def _migrate_collection_schemas(versioned_collection):
    """Holds the responsibility of performing a step-by-step, sequential update
    of a the collection structure based on the schema version of the input
    collection dictionary. This is very similar to the exploration migration
    process seen in exp_services. If any of the current collection schemas
    change, a new conversion function must be added and some code appended to
    this function to account for that new version.

    Args:
        versioned_collection: A dict with two keys:
          - schema_version: the schema version for the collection.
          - linked_explorations: the dict of linked explorations comprising the
            collection. The keys in this dict are exploration IDs.
    """
    collection_schema_version = versioned_collection['schema_version']
    if (collection_schema_version is None
            or collection_schema_version < 1):
        collection_schema_version = 1

    if not (1 <= collection_schema_version
            <= feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned collection '
            'schemas at present.' %
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    # This is where conversion functions will be placed once updates to the
    # collection schemas happen.


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
        'linked_explorations': copy.deepcopy(
            collection_model.linked_explorations)
    }

    # If the collection uses the latest states schema version, no conversion
    # is necessary.
    if (run_conversion and collection_model.schema_version !=
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
        _migrate_collection_schemas(versioned_collection)

    return collection_domain.Collection(
        collection_model.id, collection_model.title,
        collection_model.category, collection_model.objective,
        versioned_collection['schema_version'], {
            exp_id: collection_domain.LinkedExploration.from_dict(
                exp_id, linked_exp_dict)
            for (exp_id, linked_exp_dict)
            in versioned_collection['linked_explorations'].iteritems()
        },
        collection_model.version, collection_model.created_on,
        collection_model.last_updated)


def get_collection_summary_from_model(collection_summary_model):
    return collection_domain.CollectionSummary(
        collection_summary_model.id, collection_summary_model.title,
        collection_summary_model.category, collection_summary_model.objective,
        collection_summary_model.status,
        collection_summary_model.community_owned,
        collection_summary_model.owner_ids,
        collection_summary_model.editor_ids,
        collection_summary_model.viewer_ids,
        collection_summary_model.version,
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
    for i, cid in enumerate(uncached):
        model = db_collection_models[i]
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
    collections = [
        (get_collection_from_model(e) if e else None)
        for e in collection_models.CollectionModel.get_multi(collection_ids)]

    result = {}
    for ind, collection in enumerate(collections):
        if collection is None:
            logging.error(
                'Could not find collection corresponding to id')
        else:
            result[collection.id] = {
                'title': collection.title,
                'category': collection.category,
            }
    return result


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


def get_collection_summaries_matching_query(query_string, cursor=None):
    """Returns a list with all collection summary domain objects matching the
    given search query string, as well as a search cursor for future fetches.

    This method returns exactly feconf.GALLERY_PAGE_SIZE results if there are
    at least that many, otherwise it returns all remaining results. (If this
    behaviour does not occur, an error will be logged.) The method also returns
    a search cursor.
    """
    MAX_ITERATIONS = 10
    summary_models = []
    search_cursor = cursor

    for i in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.GALLERY_PAGE_SIZE - len(summary_models)

        collectionids, search_cursor = search_collections(
            query_string, remaining_to_fetch, cursor=search_cursor)

        invalid_collection_ids = []
        for ind, model in enumerate(
                collection_models.CollectionSummaryModel.get_multi(
                    collection_ids)):
            if model is not None:
                summary_models.append(model)
            else:
                invalid_collection_ids.append(collection_ids[ind])

        if len(summary_models) == feconf.GALLERY_PAGE_SIZE or (
                search_cursor is None):
            break
        else:
            logging.error(
                'Search index contains stale collection ids: %s' %
                ', '.join(invalid_collection_ids))

    if (len(summary_models) < feconf.GALLERY_PAGE_SIZE
            and search_cursor is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return ([
        get_collection_summary_from_model(summary_model)
        for summary_model in summary_models
    ], search_cursor)


def get_non_private_collection_summaries():
    """Returns a dict with all non-private collection summary domain objects,
    keyed by their id.
    """
    return _get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_non_private())


def get_all_collection_summaries():
    """Returns a dict with all collection summary domain objects,
    keyed by their id.
    """
    return _get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_all())


def get_private_at_least_viewable_collection_summaries(user_id):
    """Returns a dict with all collection summary domain objects that are
    at least viewable by given user. The dict is keyed by collection id.
    """
    return _get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_private_at_least_viewable(
            user_id=user_id))


def get_at_least_editable_collection_summaries(user_id):
    """Returns a dict with all collection summary domain objects that are
    at least editable by given user. The dict is keyed by collection id.
    """
    return _get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_at_least_editable(
            user_id=user_id))


def count_collections():
    """Returns the total number of collections."""
    return collection_models.CollectionModel.get_collection_count()


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
            if change.cmd == collection_domain.CMD_ADD_EXPLORATION:
                collection.add_exploration(change.exploration_id)
            elif change.cmd == collection_domain.CMD_DELETE_EXPLORATION:
                collection.delete_exploration(change.exploration_id)
            elif (change.cmd ==
                    collection_domain.CMD_EDIT_LINKED_EXPLORATION_PROPERTY):
                linked_exploration = collection.linked_explorations[
                    change.exploration_id]
                if (change.property_name ==
                        collection_domain.LINKED_EXPLORATION_PROPERTY_PREREQUISITE_SKILLS):
                    linked_exploration.update_prerequisite_skills(
                        change.new_value)
                elif (change.property_name ==
                        collection_domain.LINKED_EXPLORATION_PROPERTY_ACQUIRED_SKILLS):
                    linked_exploration.update_acquired_skills(change.new_value)
            elif change.cmd == collection_domain.CMD_EDIT_COLLECTION_PROPERTY:
                if change.property_name == 'title':
                    collection.update_title(change.new_value)
                elif change.property_name == 'category':
                    collection.update_category(change.new_value)
                elif change.property_name == 'objective':
                    collection.update_objective(change.new_value)
            elif (change.cmd ==
                    collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the collection model from the datastore into an
                # Collection domain object automatically converts it to use the
                # latest states schema version. As a result, simply resaving
                # the collection is sufficient to apply the states schema
                # update.
                continue
        return collection

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, collection_id, change_list)
        )
        raise


def get_summary_of_change_list(base_collection, change_list):
    """Applies a changelist to a pristine collection and returns a summary.

    Each entry in change_list is a dict that represents an CollectionChange
    object.

    Returns:
      a dict with five keys:
        collection_property_changes: a dict, where each key is a property_name
          of the collection, and the corresponding values are dicts with keys
          old_value and new_value.
        linked_exploration_property_changes: a dict, where each key is an
          exploration ID, and the corresponding values are dicts; the keys of
          these dicts represent properties of the linked exploration, and the
          corresponding values are dicts with keys old_value and new_value.
        changed_explorations: a list of exploration IDs. This indicates that
          the linked exploration has changed but we do not know what the
          changes are. This can happen for complicated operations like removing
          a linked exploration and later adding a new linked exploration with
          the exploration ID as the removed linked exploration.
        added_explorations: a list of added exploration IDs.
        deleted_explorations: a list of deleted exploration IDs.
    """
    # TODO(sll): This really needs tests, especially the diff logic. Probably
    # worth comparing with the actual changed collection.

    # Ensure that the original collection does not get altered.
    collection = copy.deepcopy(base_collection)

    changes = [
        collection_domain.CollectionChange(change_dict)
        for change_dict in change_list]

    collection_property_changes = {}
    linked_exploration_property_changes = {}
    changed_explorations = []
    added_explorations = []
    deleted_explorations = []

    for change in changes:
        if change.cmd == collection_domain.CMD_ADD_EXPLORATION:
            if change.exploration_id in changed_explorations:
                continue
            elif change.exploration_id in deleted_explorations:
                changed_explorations.append(change.exploration_id)
                del linked_exploration_property_changes[change.exploration_id]
                deleted_explorations.remove(change.exploration_id)
            else:
                added_explorations.append(change.state_name)
        elif change.cmd == collection_domain.CMD_DELETE_EXPLORATION:
            if change.exploration_id in changed_explorations:
                continue
            elif change.exploration_id in added_explorations:
                added_explorations.remove(change.exploration_id)
            else:
                deleted_explorations.append(change.exploration_id)
        elif (change.cmd ==
                collection_domain.CMD_EDIT_LINKED_EXPLORATION_PROPERTY):
            exp_id = change.exploration_id
            if exp_id in changed_explorations:
                continue

            property_name = change.property_name

            if exp_id not in linked_exploration_property_changes:
                linked_exploration_property_changes[exp_id] = {}
            if (property_name not in
                    linked_exploration_property_changes[exp_id]):
                linked_exploration_property_changes[exp_id][property_name] = {
                    'old_value': change.old_value
                }
            linked_exploration_property_changes[exp_id][property_name][
                'new_value'] = change.new_value
        elif change.cmd == collection_domain.CMD_EDIT_COLLECTION_PROPERTY:
            property_name = change.property_name

            if property_name not in collection_property_changes:
                collection_property_changes[property_name] = {
                    'old_value': change.old_value
                }
            collection_property_changes[property_name]['new_value'] = (
                change.new_value)
        elif (change.cmd ==
                collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
            continue

    unchanged_exploration_properties = []
    for property_name in collection_property_changes:
        if (collection_property_changes[property_name]['old_value'] ==
                collection_property_changes[property_name]['new_value']):
            unchanged_exploration_properties.append(property_name)
    for property_name in unchanged_exploration_properties:
        del collection_property_changes[property_name]

    unchanged_exploration_ids = []
    for exp_id in linked_exploration_property_changes:
        unchanged_state_properties = []
        changes = linked_exploration_property_changes[exp_id]
        for property_name in changes:
            if (changes[property_name]['old_value'] ==
                    changes[property_name]['new_value']):
                unchanged_state_properties.append(property_name)
        for property_name in unchanged_state_properties:
            del changes[property_name]

        if len(changes) == 0:
            unchanged_exploration_ids.append(exp_id)
    for exp_id in unchanged_exploration_ids:
        del linked_exploration_property_changes[exp_id]

    return {
        'collection_property_changes': collection_property_changes,
        'linked_exploration_property_changes': (
            linked_exploration_property_changes),
        'changed_explorations': changed_explorations,
        'added_explorations': added_explorations,
        'deleted_explorations': deleted_explorations,
    }


def _save_collection(committer_id, collection, commit_message, change_list):
    """Validates an collection and commits it to persistent storage.

    If successful, increments the version number of the incoming collection
    domain object by 1.
    """
    if change_list is None:
        change_list = []
    collection_rights = rights_manager.get_collection_rights(collection.id)
    if collection_rights.status != rights_manager.COLLECTION_STATUS_PRIVATE:
        collection.validate(strict=True)
    else:
        collection.validate(strict=False)

    collection_model = collection_models.CollectionModel.get(
        collection.id, strict=False)
    if collection_model is None:
        collection_model = collection_models.CollectionModel(id=collection.id)
    else:
        if collection_model.version > collection_model.version:
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
    collection_model.schema_version = collection.schema_version
    collection_model.linked_explorations = {
        exp_id: linked_exp.to_dict()
        for (exp_id, linked_exp) in collection.linked_explorations.iteritems()
    }

    collection_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_collection_memcache_key(collection.id))
    event_services.CollectionContentChangeEventHandler.record(collection.id)
    index_collections_given_ids([collection.id])

    collection.version += 1


def _create_collection(committer_id, collection, commit_message, commit_cmds):
    """Ensures that rights for a new collection are saved first.

    This is because _save_collection() depends on the rights object being
    present to tell it whether to do strict validation or not.
    """
    # This line is needed because otherwise a rights object will be created,
    # but the creation of an collection object will fail. Do not validate
    # explorations if it is a demo collection.
    collection.validate(
        strict=False, validate_explorations=not collection.is_demo)
    rights_manager.create_new_collection_rights(collection.id, committer_id)
    model = collection_models.CollectionModel(
        id=collection.id,
        category=collection.category,
        title=collection.title,
        objective=collection.objective,
        schema_version=collection.schema_version,
        linked_explorations={
            exp_id: linked_exp.to_dict()
            for (exp_id, linked_exp)
            in collection.linked_explorations.iteritems()
        },
    )
    model.commit(committer_id, commit_message, commit_cmds)
    event_services.CollectionContentChangeEventHandler.record(collection.id)
    collection.version += 1
    create_collection_summary(collection.id)


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

    # Delete the summary of the collection.
    delete_collection_summary(collection_id, force_deletion=force_deletion)


# Operations on collection snapshots.
def _get_simple_changelist_summary(collection_id, version_number, change_list):
    """Returns an auto-generated changelist summary for the history logs."""
    # TODO(sll): Get this from memcache where possible. It won't change, so we
    # can keep it there indefinitely.

    base_collection = get_collection_by_id(
        collection_id, version=version_number)
    if (len(change_list) == 1 and change_list[0]['cmd'] in
            ['create_new', 'AUTO_revert_version_number']):
        # An automatic summary is not needed here, because the original commit
        # message is sufficiently descriptive.
        return ''
    else:
        full_summary = get_summary_of_change_list(base_collection, change_list)

        short_summary_fragments = []
        if full_summary['added_explorations']:
            short_summary_fragments.append(
                'added \'%s\'' % '\', \''.join(
                    full_summary['added_explorations']))
        if full_summary['deleted_explorations']:
            short_summary_fragments.append(
                'deleted \'%s\'' % '\', \''.join(
                    full_summary['deleted_explorations']))
        if (full_summary['changed_explorations'] or
                full_summary['linked_exploration_property_changes']):
            affected_exploration_ids = (
                full_summary['changed_explorations'] +
                full_summary['linked_exploration_property_changes'].keys())
            affected_exploration_titles = [
                base_collection.linked_explorations[exp_id].exploration.title
                for exp_id in affected_exploration_ids
            ]
            short_summary_fragments.append(
                'edited \'%s\'' % '\', \''.join(affected_exploration_titles))
        if full_summary['collection_property_changes']:
            short_summary_fragments.append(
                'edited collection properties %s' % ', '.join(
                    full_summary['collection_property_changes'].keys()))

        return '; '.join(short_summary_fragments)


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


def update_collection(
        committer_id, collection_id, change_list, commit_message):
    """Update an collection. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - collection_id: str. The collection id.
    - change_list: list of dicts, each representing a _Change object. These
        changes are applied in sequence to produce the resulting collection.
    - commit_message: str or None. A description of changes made to the
        collection. For published collections, this must be present; for
        unpublished collections, it should be equal to None.
    """
    is_public = rights_manager.is_collection_public(collection_id)

    if is_public and not commit_message:
        raise ValueError(
            'Collection is public so expected a commit message but '
            'received none.')

    collection = apply_change_list(collection_id, change_list)
    _save_collection(committer_id, collection, commit_message, change_list)
    update_collection_summary(collection.id)


def create_collection_summary(collection_id):
    """Create summary of a collection and store in datastore."""
    collection = get_collection_by_id(collection_id)
    collection_summary = get_summary_of_collection(collection)
    save_collection_summary(collection_summary)


def update_collection_summary(collection_id):
    """Update the summary of an collection."""
    create_collection_summary(collection_id)


def get_summary_of_collection(collection):
    """Create a CollectionSummary domain object for a given Collection domain
    object and return it.
    """
    collection_rights = collection_models.CollectionRightsModel.get_by_id(
        collection.id)
    collection_summary_model = (
        collection_models.CollectionSummaryModel.get_by_id(collection.id))

    collection_model_last_updated = collection.last_updated
    collection_model_created_on = collection.created_on

    collection_summary = collection_domain.CollectionSummary(
        collection.id, collection.title, collection.category,
        collection.objective, collection_rights.status,
        collection_rights.community_owned, collection_rights.owner_ids,
        collection_rights.editor_ids, collection_rights.viewer_ids,
        collection.version, collection_model_created_on,
        collection_model_last_updated
    )

    return collection_summary


def save_collection_summary(collection_summary):
    """Save a collection summary domain object as a CollectionSummaryModel
    entity in the datastore.
    """
    collection_summary_model = collection_models.CollectionSummaryModel(
        id=collection_summary.id,
        title=collection_summary.title,
        category=collection_summary.category,
        objective=collection_summary.objective,
        status=collection_summary.status,
        community_owned=collection_summary.community_owned,
        owner_ids=collection_summary.owner_ids,
        editor_ids=collection_summary.editor_ids,
        viewer_ids=collection_summary.viewer_ids,
        version=collection_summary.version,
        collection_model_last_updated=(
            collection_summary.collection_model_last_updated),
        collection_model_created_on=(
            collection_summary.collection_model_created_on)
    )

    collection_summary_model.put()


def delete_collection_summary(collection_id, force_deletion=False):
    """Delete an collection summary model."""

    collection_models.CollectionSummaryModel.get(collection_id).delete()


# Demo creation and deletion methods.
def get_demo_collection_components(demo_path):
    """Gets the content of `demo_path` in the sample collections folder.

    Args:
      demo_path: the file path for the content of an collection in
        SAMPLE_COLLECTIONS_DIR. E.g.: 'adventure.yaml' or 'tar/'.

    Returns:
      a yaml string
    """
    demo_filepath = os.path.join(feconf.SAMPLE_COLLECTIONS_DIR, demo_path)

    if demo_filepath.endswith('yaml'):
        file_contents = utils.get_file_contents(demo_filepath)
        return file_contents
    else:
        raise Exception('Unrecognized file path: %s' % demo_path)


def save_new_collection_from_yaml(
        committer_id, yaml_content, title, category, collection_id):
    collection = collection_domain.Collection.from_yaml(
        collection_id, title, category, yaml_content)
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
    if not (0 <= int(collection_id) < len(feconf.DEMO_COLLECTIONS)):
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

    if not (0 <= int(collection_id) < len(feconf.DEMO_COLLECTIONS)):
        raise Exception('Invalid demo collection id %s' % collection_id)

    collection_info = feconf.DEMO_COLLECTIONS[int(collection_id)]

    if len(collection_info) == 3:
        (collection_filename, title, category) = collection_info
    else:
        raise Exception('Invalid demo collection: %s' % collection_info)

    yaml_content = get_demo_collection_components(collection_filename)
    collection = save_new_collection_from_yaml(
        feconf.SYSTEM_COMMITTER_ID, yaml_content, title, category,
        collection_id)

    rights_manager.publish_collection(
        feconf.SYSTEM_COMMITTER_ID, collection_id)
    # Release ownership of all demo collections.
    rights_manager.release_ownership_of_collection(
        feconf.SYSTEM_COMMITTER_ID, collection_id)

    index_collections_given_ids([collection_id])

    # Now, load all of the demo explorations that are part of the collection.
    for demo_exp_id in collection.linked_explorations:
        exp_services.load_demo(demo_exp_id)

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
        collection_models.CollectionCommitLogEntryModel.get_all_non_private_commits(
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
    if rights.status == rights_manager.COLLECTION_STATUS_PUBLICIZED:
        doc['is'] = 'featured'
    return doc


def _should_index(collection):
    rights = rights_manager.get_collection_rights(collection.id)
    return rights.status != rights_manager.COLLECTION_STATUS_PRIVATE


def _get_search_rank(collection_id):
    """Returns an integer determining the document's rank in search.

    Featured collections get a ranking bump, and so do collections that
    have been more recently updated.
    """
    # TODO(sll): Improve this calculation.
    _STATUS_PUBLICIZED_BONUS = 30
    # This is done to prevent the rank hitting 0 too easily. Note that
    # negative ranks are disallowed in the Search API.
    _DEFAULT_RANK = 20

    collection = get_collection_by_id(collection_id)
    rights = rights_manager.get_collection_rights(collection_id)
    summary = get_collection_summary_by_id(collection_id)
    rank = _DEFAULT_RANK + (
        _STATUS_PUBLICIZED_BONUS
        if rights.status == rights_manager.COLLECTION_STATUS_PUBLICIZED
        else 0)

    # Iterate backwards through the collection history metadata until we find
    # the most recent snapshot that was committed by a human.
    last_human_update_ms = 0
    snapshots_metadata = get_collection_snapshots_metadata(collection_id)
    for snapshot_metadata in reversed(snapshots_metadata):
        if snapshot_metadata['committer_id'] != feconf.MIGRATION_BOT_USER_ID:
            last_human_update_ms = snapshot_metadata['created_on_ms']
            break

    _TIME_NOW_MS = utils.get_current_time_in_millisecs()
    _MS_IN_ONE_DAY = 24 * 60 * 60 * 1000
    time_delta_days = int(
        (_TIME_NOW_MS - last_human_update_ms) / _MS_IN_ONE_DAY)
    if time_delta_days == 0:
        rank += 80
    elif time_delta_days == 1:
        rank += 50
    elif 2 <= time_delta_days <= 7:
        rank += 35

    # Ranks must be non-negative.
    return max(rank, 0)


def _collection_to_search_dict(collection):
    rights = rights_manager.get_collection_rights(collection.id)
    doc = {
        'id': collection.id,
        'title': collection.title,
        'category': collection.category,
        'objective': collection.objective,
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
    collection_models = get_multiple_collections_by_id(
        collection_ids, strict=False)
    search_services.add_documents_to_index([
        _collection_to_search_dict(collection)
        for collection in collection_models.values()
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
    if rights.status == rights_manager.COLLECTION_STATUS_PRIVATE:
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

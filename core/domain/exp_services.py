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

"""Commands that can be used to operate on explorations.

All functions here should be agnostic of how ExplorationModel objects are
stored in the database. In particular, the various query methods should
delegate to the Exploration model class. This will enable the exploration
storage model to be changed without affecting this module and others above it.
"""

__author__ = 'Sean Lip'

import copy
import datetime
import logging
import os
import StringIO
import zipfile

from core.domain import exp_domain
from core.domain import fs_domain
from core.domain import rights_manager
from core.platform import models
import feconf
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()
taskqueue_services = models.Registry.import_taskqueue_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
import utils

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# TODO(sll): Unify this with the SUBMIT_HANDLER_NAMEs in other files.
SUBMIT_HANDLER_NAME = 'submit'

#Name for the exploration search index
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# Repository GET methods.
def _get_exploration_memcache_key(exploration_id, version=None):
    """Returns a memcache key for an exploration."""
    if version:
        return 'exploration-version:%s:%s' % (exploration_id, version)
    else:
        return 'exploration:%s' % exploration_id


def get_exploration_from_model(exploration_model):
    return exp_domain.Exploration(
        exploration_model.id, exploration_model.title,
        exploration_model.category, exploration_model.objective,
        exploration_model.language_code, exploration_model.skill_tags,
        exploration_model.blurb, exploration_model.author_notes,
        exploration_model.default_skin, exploration_model.init_state_name,
        exploration_model.states, exploration_model.param_specs,
        exploration_model.param_changes, exploration_model.version)


def get_exploration_by_id(exploration_id, strict=True, version=None):
    """Returns a domain object representing an exploration."""
    exploration_memcache_key = _get_exploration_memcache_key(
        exploration_id, version=version)
    memcached_exploration = memcache_services.get_multi(
        [exploration_memcache_key]).get(exploration_memcache_key)

    if memcached_exploration is not None:
        return memcached_exploration
    else:
        exploration_model = exp_models.ExplorationModel.get(
            exploration_id, strict=strict, version=version)
        if exploration_model:
            exploration = get_exploration_from_model(exploration_model)
            memcache_services.set_multi({
                exploration_memcache_key: exploration})
            return exploration
        else:
            return None

def get_multiple_explorations_by_id(exp_ids, strict=True):
    """Returns a dict of domain objects representing explorations with the given
    ids as keys..
    """
    exp_ids = set(exp_ids)
    result = {}
    uncached = []
    memcache_keys = [_get_exploration_memcache_key(i) for i in exp_ids]
    cache_result = memcache_services.get_multi(memcache_keys)

    for exp_obj in cache_result.itervalues():
        result[exp_obj.id] = exp_obj

    for _id in exp_ids:
        if _id not in result:
            uncached.append(_id)

    db_exp_models = exp_models.ExplorationModel.get_multi(uncached, strict=strict)
    db_results_dict = {}
    for i, eid in enumerate(uncached):
        model = db_exp_models[i]
        if model:
            exploration = get_exploration_from_model(model)
        else:
            logging.info('Tried to fetch exploration with id %s, but no such'
                         'exploration exists in the datastore' % eid)
            exploration = None
        db_results_dict[eid] = exploration

    cache_update = {eid: db_results_dict[eid] for eid in db_results_dict.iterkeys()
                    if db_results_dict[eid] is not None}

    if cache_update:
        memcache_services.set_multi(cache_update)

    result.update(db_results_dict)
    return result


def get_new_exploration_id():
    """Returns a new exploration id."""
    return exp_models.ExplorationModel.get_new_id('')


# Query methods.
def _get_explorations_summary_dict(
        exploration_rights, include_timestamps=False):
    """Returns exploration summaries corresponding to the given rights objects.

    The summary is a dict that is keyed by exploration id. Each value is a dict
    with the following keys: title, category and rights. The value for 'rights'
    is the rights object, represented as a dict.
    """
    exp_ids = [rights.id for rights in exploration_rights]
    exploration_models = exp_models.ExplorationModel.get_multi(exp_ids)
    explorations = [
        (get_exploration_from_model(e) if e else None)
        for e in exploration_models]

    result = {}
    for ind, exploration in enumerate(explorations):
        if exploration is None:
            logging.error(
                'Could not find exploration corresponding to exploration '
                'rights object with id %s' % exploration_rights[ind].id)
        else:
            result[exploration.id] = {
                'title': exploration.title,
                'category': exploration.category,
                'rights': exploration_rights[ind].to_dict(),
            }
            if include_timestamps:
                result[exploration.id]['last_updated'] = (
                    utils.get_time_in_millisecs(
                        exploration_models[ind].last_updated))
    return result


def get_exploration_titles_and_categories(exp_ids):
    """Returns exploration titles and categories for the given ids.

    The result is a dict with exploration ids as keys. The corresponding values
    are dicts with the keys 'title' and 'category'.
    """
    explorations = [
        (get_exploration_from_model(e) if e else None)
        for e in exp_models.ExplorationModel.get_multi(exp_ids)]

    result = {}
    for ind, exploration in enumerate(explorations):
        if exploration is None:
            logging.error(
                'Could not find exploration corresponding to id')
        else:
            result[exploration.id] = {
                'title': exploration.title,
                'category': exploration.category,
            }
    return result


def get_exploration_titles(exp_ids):
    """Returns exploration titles for the given ids.

    The result is a dict with exploration ids as keys and their corresponding
    titles as the values.
    """
    explorations = [
        (get_exploration_from_model(e) if e else None)
        for e in exp_models.ExplorationModel.get_multi(exp_ids)]

    result = {}
    for ind, exploration in enumerate(explorations):
        if exploration is None:
            logging.error(
                'Could not find exploration corresponding to id')
        else:
            result[exploration.id] = exploration.title
    return result


def get_recently_edited_public_explorations_summary_dict():
    """Returns a summary of recently edited public (beta) explorations."""
    # TODO(sll): This is inefficient and not page-able; replace this once we
    # have an easily-queryable list of explorations.
    return _get_explorations_summary_dict(
        rights_manager.get_public_exploration_rights(),
        include_timestamps=True)


def get_public_explorations_summary_dict():
    """Returns a summary of public (beta) explorations."""
    return _get_explorations_summary_dict(
        rights_manager.get_public_exploration_rights())


def get_publicized_explorations_summary_dict():
    """Returns a summary of publicized explorations."""
    return _get_explorations_summary_dict(
        rights_manager.get_publicized_exploration_rights())


def get_non_private_explorations_summary_dict():
    """Returns a summary of non-private explorations."""
    return _get_explorations_summary_dict(
        rights_manager.get_non_private_exploration_rights())


def get_community_owned_explorations_summary_dict():
    """Returns a summary of community-owned explorations."""
    return _get_explorations_summary_dict(
        rights_manager.get_community_owned_exploration_rights())


def get_explicit_viewer_explorations_summary_dict(
        user_id, include_timestamps=False):
    """Returns a summary of some viewable explorations for this user.

    These explorations have the user explicitly listed in the viewer_ids field.
    This means that the user can view this exploration, but is not an owner of
    it, and cannot edit it.

    There may be other explorations that this user can view -- namely, those
    that he/she owns or is allowed to edit -- that are not returned by this
    query.
    """
    return _get_explorations_summary_dict(
        rights_manager.get_viewable_exploration_rights(user_id),
        include_timestamps=include_timestamps)


def get_private_at_least_viewable_summary_dict(user_id):
    """Returns a summary of private explorations that are at least viewable by
    this user.
    """
    return  _get_explorations_summary_dict(
        rights_manager.get_private_at_least_viewable_exploration_rights(
            user_id))


def get_at_least_editable_summary_dict(user_id):
    """Returns a summary of explorations that are at least editable by this
    user.
    """
    return  _get_explorations_summary_dict(
        rights_manager.get_at_least_editable_exploration_rights(user_id))


def get_viewable_explorations_summary_dict(user_id):
    """Returns a summary of all explorations viewable by this user."""
    result = get_private_at_least_viewable_summary_dict(user_id)
    result.update(get_non_private_explorations_summary_dict())
    return result


def count_explorations():
    """Returns the total number of explorations."""
    return exp_models.ExplorationModel.get_exploration_count()


# Methods for exporting states and explorations to other formats.
def export_to_zip_file(exploration_id, version=None):
    """Returns a ZIP archive of the exploration."""
    exploration = get_exploration_by_id(exploration_id, version=version)
    yaml_repr = exploration.to_yaml()

    o = StringIO.StringIO()
    with zipfile.ZipFile(o, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('%s.yaml' % exploration.title, yaml_repr)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')
        for filepath in dir_list:
            # Currently, the version number of all files is 1, since they are
            # not modifiable post-upload.
            # TODO(sll): When allowing editing of files, implement versioning
            # for them.
            zf.writestr('assets/%s' % filepath, fs.get(filepath, version=1))

    return o.getvalue()


# Repository SAVE and DELETE methods.
def apply_change_list(exploration_id, change_list):
    """Applies a changelist to a pristine exploration and returns the result.

    Each entry in change_list is a dict that represents an ExplorationChange
    object.

    Returns:
      the resulting exploration domain object.
    """
    exploration = get_exploration_by_id(exploration_id)
    try:
        changes = [exp_domain.ExplorationChange(change_dict)
                   for change_dict in change_list]

        for change in changes:
            if change.cmd == 'add_state':
                exploration.add_states([change.state_name])
            elif change.cmd == 'rename_state':
                exploration.rename_state(
                    change.old_state_name, change.new_state_name)
            elif change.cmd == 'delete_state':
                exploration.delete_state(change.state_name)
            elif change.cmd == 'edit_state_property':
                state = exploration.states[change.state_name]
                if change.property_name == 'param_changes':
                    state.update_param_changes(change.new_value)
                elif change.property_name == 'content':
                    state.update_content(change.new_value)
                elif change.property_name == 'widget_id':
                    state.update_widget_id(change.new_value)
                elif change.property_name == 'widget_customization_args':
                    state.update_widget_customization_args(change.new_value)
                elif change.property_name == 'widget_sticky':
                    state.update_widget_sticky(change.new_value)
                elif change.property_name == 'widget_handlers':
                    state.update_widget_handlers(change.new_value)
            elif change.cmd == 'edit_exploration_property':
                if change.property_name == 'title':
                    exploration.update_title(change.new_value)
                elif change.property_name == 'category':
                    exploration.update_category(change.new_value)
                elif change.property_name == 'objective':
                    exploration.update_objective(change.new_value)
                elif change.property_name == 'language_code':
                    exploration.update_language_code(change.new_value)
                elif change.property_name == 'skill_tags':
                    exploration.update_skill_tags(change.new_value)
                elif change.property_name == 'blurb':
                    exploration.update_blurb(change.new_value)
                elif change.property_name == 'author_notes':
                    exploration.update_author_notes(change.new_value)
                elif change.property_name == 'param_specs':
                    exploration.update_param_specs(change.new_value)
                elif change.property_name == 'param_changes':
                    exploration.update_param_changes(change.new_value)
                elif change.property_name == 'default_skin_id':
                    exploration.update_default_skin_id(change.new_value)
        return exploration
    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, exploration_id, change_list)
        )
        raise


def get_summary_of_change_list(base_exploration, change_list):
    """Applies a changelist to a pristine exploration and returns a summary.

    Each entry in change_list is a dict that represents an ExplorationChange
    object.

    Returns:
      a dict with five keys:
        exploration_property_changes: a dict, where each key is a property_name
          of the exploration, and the corresponding values are dicts with keys
          old_value and new_value.
        state_property_changes: a dict, where each key is a state name, and the
          corresponding values are dicts; the keys of these dicts represent
          properties of the state, and the corresponding values are dicts with
          keys old_value and new_value. If a state name is changed, this is
          listed as a property name change under the old state name in the
          outer dict.
        changed_states: a list of state names. This indicates that the state
          has changed but we do not know what the changes are. This can happen
          for complicated operations like removing a state and later adding a
          new state with the same name as the removed state.
        added_states: a list of added state names.
        deleted_states: a list of deleted state names.
    """
    # TODO(sll): This really needs tests, especially the diff logic. Probably
    # worth comparing with the actual changed exploration.

    # Ensure that the original exploration does not get altered.
    exploration = copy.deepcopy(base_exploration)

    changes = [
        exp_domain.ExplorationChange(change_dict)
        for change_dict in change_list]

    exploration_property_changes = {}
    state_property_changes = {}
    changed_states = []
    added_states = []
    deleted_states = []

    original_state_names = {
        state_name: state_name for state_name in exploration.states.keys()
    }

    for change in changes:
        if change.cmd == 'add_state':
            if change.state_name in changed_states:
                continue
            elif change.state_name in deleted_states:
                changed_states.append(change.state_name)
                del state_property_changes[change.state_name]
                deleted_states.remove(change.state_name)
            else:
                added_states.append(change.state_name)
                original_state_names[change.state_name] = change.state_name
        elif change.cmd == 'rename_state':
            orig_state_name = original_state_names[change.old_state_name]
            original_state_names[change.new_state_name] = orig_state_name

            if orig_state_name in changed_states:
                continue

            if orig_state_name not in state_property_changes:
                state_property_changes[orig_state_name] = {}
            if 'name' not in state_property_changes[orig_state_name]:
                state_property_changes[orig_state_name]['name'] = {
                    'old_value': change.old_state_name
                }
            state_property_changes[orig_state_name]['name']['new_value'] = (
                change.new_state_name)
        elif change.cmd == 'delete_state':
            orig_state_name = original_state_names[change.state_name]
            if orig_state_name in changed_states:
                continue
            elif orig_state_name in added_states:
                added_states.remove(orig_state_name)
            else:
                deleted_states.append(orig_state_name)
        elif change.cmd == 'edit_state_property':
            orig_state_name = original_state_names[change.state_name]
            if orig_state_name in changed_states:
                continue

            property_name = change.property_name

            if orig_state_name not in state_property_changes:
                state_property_changes[orig_state_name] = {}
            if property_name not in state_property_changes[orig_state_name]:
                state_property_changes[orig_state_name][property_name] = {
                    'old_value': change.old_value
                }
            state_property_changes[orig_state_name][property_name][
                'new_value'] = change.new_value
        elif change.cmd == 'edit_exploration_property':
            property_name = change.property_name

            if property_name not in exploration_property_changes:
                exploration_property_changes[property_name] = {
                    'old_value': change.old_value
                }
            exploration_property_changes[property_name]['new_value'] = (
                change.new_value)

    unchanged_exploration_properties = []
    for property_name in exploration_property_changes:
        if (exploration_property_changes[property_name]['old_value'] ==
                exploration_property_changes[property_name]['new_value']):
            unchanged_exploration_properties.append(property_name)
    for property_name in unchanged_exploration_properties:
        del exploration_property_changes[property_name]

    unchanged_state_names = []
    for state_name in state_property_changes:
        unchanged_state_properties = []
        changes = state_property_changes[state_name]
        for property_name in changes:
            if (changes[property_name]['old_value'] ==
                    changes[property_name]['new_value']):
                unchanged_state_properties.append(property_name)
        for property_name in unchanged_state_properties:
            del changes[property_name]

        if len(changes) == 0:
            unchanged_state_names.append(state_name)
    for state_name in unchanged_state_names:
        del state_property_changes[state_name]

    return {
        'exploration_property_changes': exploration_property_changes,
        'state_property_changes': state_property_changes,
        'changed_states': changed_states,
        'added_states': added_states,
        'deleted_states': deleted_states,
    }


def _save_exploration(
        committer_id, exploration, commit_message, change_list):
    """Validates an exploration and commits it to persistent storage.

    If successful, increments the version number of the incoming exploration
    domain object by 1.
    """
    if change_list is None:
        change_list = []
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    if exploration_rights.status != rights_manager.EXPLORATION_STATUS_PRIVATE:
        exploration.validate(strict=True)
    else:
        exploration.validate()

    exploration_model = exp_models.ExplorationModel.get(
        exploration.id, strict=False)
    if exploration_model is None:
        exploration_model = exp_models.ExplorationModel(id=exploration.id)
    else:
        if exploration.version > exploration_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of exploration '
                'from version %s. Please reload the page and try again.'
                % (exploration_model.version, exploration.version))
        elif exploration.version < exploration_model.version:
            raise Exception(
                'Trying to update version %s of exploration from version %s, '
                'which is too old. Please reload the page and try again.'
                % (exploration_model.version, exploration.version))

    exploration_model.category = exploration.category
    exploration_model.title = exploration.title
    exploration_model.objective = exploration.objective
    exploration_model.language_code = exploration.language_code
    exploration_model.skill_tags = exploration.skill_tags
    exploration_model.blurb = exploration.blurb
    exploration_model.author_notes = exploration.author_notes
    exploration_model.default_skin = exploration.default_skin

    exploration_model.init_state_name = exploration.init_state_name
    exploration_model.states = {
        state_name: state.to_dict()
        for (state_name, state) in exploration.states.iteritems()}
    exploration_model.param_specs = exploration.param_specs_dict
    exploration_model.param_changes = exploration.param_change_dicts

    exploration_model.commit(
        committer_id, commit_message, change_list)
    memcache_services.delete(_get_exploration_memcache_key(exploration.id))

    exploration.version += 1


def _create_exploration(
        committer_id, exploration, commit_message, commit_cmds):
    """Ensures that rights for a new exploration are saved first.

    This is because _save_exploration() depends on the rights object being
    present to tell it whether to do strict validation or not.
    """
    # This line is needed because otherwise a rights object will be created,
    # but the creation of an exploration object will fail.
    exploration.validate()
    rights_manager.create_new_exploration_rights(exploration.id, committer_id)
    model = exp_models.ExplorationModel(
        id=exploration.id,
        category=exploration.category,
        title=exploration.title,
        objective=exploration.objective,
        language_code=exploration.language_code,
        skill_tags=exploration.skill_tags,
        blurb=exploration.blurb,
        author_notes=exploration.author_notes,
        default_skin=exploration.default_skin,
        init_state_name=exploration.init_state_name,
        states={
            state_name: state.to_dict()
            for (state_name, state) in exploration.states.iteritems()},
        param_specs=exploration.param_specs_dict,
        param_changes=exploration.param_change_dicts,
    )
    model.commit(committer_id, commit_message, commit_cmds)
    exploration.version += 1


def save_new_exploration(committer_id, exploration):
    commit_message = (
        'New exploration created with title \'%s\'.' % exploration.title)
    _create_exploration(committer_id, exploration, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': exploration.title,
        'category': exploration.category,
    }])


def delete_exploration(committer_id, exploration_id, force_deletion=False):
    """Deletes the exploration with the given exploration_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this exploration, prior to calling this function.

    If force_deletion is True the exploration and its history are fully deleted
    and are unrecoverable. Otherwise, the exploration and all its history are
    marked as deleted, but the corresponding models are still retained in the
    datastore. This last option is the preferred one.
    """
    # TODO(sll): Delete the files too?

    exploration_rights_model = exp_models.ExplorationRightsModel.get(
        exploration_id)
    exploration_rights_model.delete(
        committer_id, '', force_deletion=force_deletion)

    exploration_model = exp_models.ExplorationModel.get(exploration_id)
    exploration_model.delete(committer_id, '', force_deletion=force_deletion)

    # This must come after the exploration is retrieved. Otherwise the memcache
    # key will be reinstated.
    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcache_services.delete(exploration_memcache_key)

    #delete the exploration from search.
    search_services.delete_documents_from_index([exploration_id],
                                                SEARCH_INDEX_EXPLORATIONS)


# Operations on exploration snapshots.
def _get_simple_changelist_summary(
        exploration_id, version_number, change_list):
    """Returns an auto-generated changelist summary for the history logs."""
    # TODO(sll): Get this from memcache where possible. It won't change, so we
    # can keep it there indefinitely.

    base_exploration = get_exploration_by_id(
        exploration_id, version=version_number)
    if (len(change_list) == 1 and change_list[0]['cmd'] in
            ['create_new', 'AUTO_revert_version_number']):
        # An automatic summary is not needed here, because the original commit
        # message is sufficiently descriptive.
        return ''
    else:
        full_summary = get_summary_of_change_list(
            base_exploration, change_list)

        short_summary_fragments = []
        if full_summary['added_states']:
            short_summary_fragments.append(
                'added \'%s\'' % '\', \''.join(full_summary['added_states']))
        if full_summary['deleted_states']:
            short_summary_fragments.append(
                'deleted \'%s\'' % '\', \''.join(
                    full_summary['deleted_states']))
        if (full_summary['changed_states'] or
                full_summary['state_property_changes']):
            affected_states = (
                full_summary['changed_states'] +
                full_summary['state_property_changes'].keys())
            short_summary_fragments.append(
                'edited \'%s\'' % '\', \''.join(affected_states))
        if full_summary['exploration_property_changes']:
            short_summary_fragments.append(
                'edited exploration properties %s' % ', '.join(
                    full_summary['exploration_property_changes'].keys()))

        return '; '.join(short_summary_fragments)


def get_exploration_snapshots_metadata(exploration_id, limit):
    """Returns the most recent snapshots for this exploration, as dicts.

    Args:
        exploration_id: str. The id of the exploration in question.
        limit: int. The maximum number of snapshots to return.

    Returns:
        list of dicts, each representing a recent snapshot. Each dict has the
        following keys: committer_id, commit_message, commit_cmds, commit_type,
        created_on, version_number. The version numbers are consecutive and in
        descending order. There are max(limit, exploration.version_number)
        items in the returned list.
    """
    exploration = get_exploration_by_id(exploration_id)
    oldest_version = max(exploration.version - limit, 0) + 1
    current_version = exploration.version
    version_nums = range(current_version, oldest_version - 1, -1)

    snapshots_metadata = exp_models.ExplorationModel.get_snapshots_metadata(
        exploration_id, version_nums)

    for ind, item in enumerate(snapshots_metadata):
        item['auto_summary'] = _get_simple_changelist_summary(
            exploration_id, item['version_number'] - 1, item['commit_cmds'])

    return snapshots_metadata


def update_exploration(
        committer_id, exploration_id, change_list, commit_message):
    """Update an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    - change_list: list of dicts, each representing a _Change object. These
        changes are applied in sequence to produce the resulting exploration.
    - commit_message: str or None. A description of changes made to the state.
        For published explorations, this must be present; for unpublished
        explorations, it should be equal to None.
    """
    is_public = rights_manager.is_exploration_public(exploration_id)

    if is_public and not commit_message:
        raise ValueError(
            'Exploration is public so expected a commit message but '
            'received none.')

    exploration = apply_change_list(exploration_id, change_list)
    _save_exploration(committer_id, exploration, commit_message, change_list)


def revert_exploration(
        committer_id, exploration_id, current_version, revert_to_version):
    """Reverts an exploration to the given version number. Commits changes."""
    exploration_model = exp_models.ExplorationModel.get(
        exploration_id, strict=False)

    if current_version > exploration_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of exploration '
            'from version %s. Please reload the page and try again.'
            % (exploration_model.version, current_version))
    elif current_version < exploration_model.version:
        raise Exception(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_model.version, current_version))

    exploration_model.revert(
        committer_id, 'Reverted exploration to version %s' % revert_to_version,
        revert_to_version)
    memcache_services.delete(_get_exploration_memcache_key(exploration_id))


# Creation and deletion methods.
def get_demo_exploration_components(demo_path):
    """Gets the content of `demo_path` in the sample explorations folder.

    Args:
      demo_path: the file or folder path for the content of an exploration
        in SAMPLE_EXPLORATIONS_DIR. E.g.: 'adventure.yaml' or 'tar/'.

    Returns:
      a 2-tuple, the first element of which is a yaml string, and the second
      element of which is a list of (filepath, content) 2-tuples. The filepath
      does not include the assets/ prefix.
    """
    demo_filepath = os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, demo_path)

    if demo_filepath.endswith('yaml'):
        file_contents = utils.get_file_contents(demo_filepath)
        return file_contents, []
    elif os.path.isdir(demo_filepath):
        return utils.get_exploration_components_from_dir(demo_filepath)
    else:
        raise Exception('Unrecognized file path: %s' % demo_path)


def save_new_exploration_from_yaml_and_assets(
        committer_id, yaml_content, title, category, exploration_id,
        assets_list):
    if assets_list is None:
        assets_list = []

    exploration = exp_domain.Exploration.from_yaml(
        exploration_id, title, category, yaml_content)
    commit_message = (
        'New exploration created from YAML file with title \'%s\'.'
        % exploration.title)

    _create_exploration(committer_id, exploration, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': exploration.title,
        'category': exploration.category,
    }])

    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        fs.commit(committer_id, asset_filename, asset_content)


def delete_demo(exploration_id):
    """Deletes a single demo exploration."""
    if not (0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS)):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration = get_exploration_by_id(exploration_id, strict=False)
    if not exploration:
        logging.info('Exploration with id %s was not deleted, because it '
                     'does not exist.' % exploration_id)
    else:
        delete_exploration(
            feconf.ADMIN_COMMITTER_ID, exploration_id, force_deletion=True)


def load_demo(exploration_id):
    """Loads a demo exploration.

    The resulting exploration will have version 2 (one for its initial
    creation and one for its subsequent modification.)
    """
    # TODO(sll): Speed this method up. It is too slow.
    delete_demo(exploration_id)

    if not (0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS)):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration_info = feconf.DEMO_EXPLORATIONS[int(exploration_id)]

    if len(exploration_info) == 3:
        (exp_filename, title, category) = exploration_info
    else:
        raise Exception('Invalid demo exploration: %s' % exploration_info)

    yaml_content, assets_list = get_demo_exploration_components(exp_filename)
    save_new_exploration_from_yaml_and_assets(
        feconf.ADMIN_COMMITTER_ID, yaml_content, title, category,
        exploration_id, assets_list)

    rights_manager.publish_exploration(
        feconf.ADMIN_COMMITTER_ID, exploration_id)
    # Release ownership of all explorations.
    rights_manager.release_ownership(
        feconf.ADMIN_COMMITTER_ID, exploration_id)

    logging.info('Exploration with id %s was loaded.' % exploration_id)


def get_next_page_of_all_commits(
        page_size=feconf.DEFAULT_PAGE_SIZE, urlsafe_start_cursor=None):
    """Returns a page of commits to all explorations in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_commits(
            page_size, urlsafe_start_cursor))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_next_page_of_all_non_private_commits(
        page_size=feconf.DEFAULT_PAGE_SIZE, urlsafe_start_cursor=None, max_age=None):
    """Returns a page of non-private commits in reverse time order. If max_age
    is given, it should be a datetime.timedelta instance.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    if max_age is not None and not isinstance(max_age, datetime.timedelta):
        raise ValueError("max_age must be a datetime.timedelta instance. or None.")

    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_non_private_commits(
            page_size, urlsafe_start_cursor, max_age=max_age))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_next_page_of_all_commits_by_exp_id(
        exploration_id, page_size=feconf.DEFAULT_PAGE_SIZE,
        urlsafe_start_cursor=None):
    """Returns a page of commits to this exploration in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_commits_by_exp_id(
            exploration_id, page_size, urlsafe_start_cursor))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_next_page_of_all_commits_by_user_id(
        user_id, page_size=feconf.DEFAULT_PAGE_SIZE,
        urlsafe_start_cursor=None):
    """Returns a page of commits by the given user_id in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass#Query_fetch_page
    """
    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_commits_by_user_id(
            user_id, page_size, urlsafe_start_cursor))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def _exp_to_search_dict(exp):
    rights = rights_manager.get_exploration_rights(exp.id)
    doc = {
        'id': exp.id,
        'language_code': exp.language_code,
        'title': exp.title,
        'category': exp.category,
        'skills': exp.skill_tags,
        'blurb': exp.blurb,
        'objective': exp.objective,
        'author_notes': exp.author_notes,
    }
    # Allow searches like "is:beta" or "is:publicized".
    if rights.status == rights_manager.EXPLORATION_STATUS_PUBLICIZED:
        doc['is'] = 'publicized'
    else:
        doc['is'] = 'beta'

    return doc


def index_explorations_given_ids(exp_ids):
    exploration_models = get_multiple_explorations_by_id(exp_ids)
    search_docs = [_exp_to_search_dict(exploration_models[model])
                   for model in exploration_models]
    search_services.add_documents_to_index(search_docs, SEARCH_INDEX_EXPLORATIONS)


def search_explorations(
    query, sort, limit=feconf.DEFAULT_PAGE_SIZE, cursor=None):
    """Searcher through the exploration

    args:
      - query_string: the query string to search for.
      - sort: a string indicating how to sort results.
        This should be a string of space separated values.
        Each value should start with a '+' or a '-' character indicating whether
        to sort in ascending or descending
        order respectively. This character should be followed by a field name to
        sort on.
      - limit: the maximum number of results to return.
      - cursor: A cursor, used to get the next page of results.
        If there are more documents that match the query than
        'limit', this function will return a cursor to get the next page.

    returns: a tuple:
      - a list of Exploration domain objects that match the query.
      - a cursor if there are more matching exploration to fetch, None otherwise.
        If a cursor is returned, it will be a web-safe string that can be used in URLs.
    """
    results, cursor = search_services.search(query, SEARCH_INDEX_EXPLORATIONS,
                                             cursor, limit, sort, ids_only=True)
    ids = [result.get('id') for result in results]
    explorations = get_multiple_explorations_by_id(ids, strict=True)
    return [explorations[_id] for _id in ids ], cursor

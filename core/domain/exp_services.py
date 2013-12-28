# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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
import logging
import os
import StringIO
import zipfile

from core.domain import exp_domain
from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import param_domain
from core.domain import rights_manager
from core.domain import rule_domain
from core.domain import widget_registry
from core.platform import models
import feconf
import jinja_utils
memcache_services = models.Registry.import_memcache_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
import utils


# TODO(sll): Unify this with the SUBMIT_HANDLER_NAMEs in other files.
SUBMIT_HANDLER_NAME = 'submit'
ALLOWED_CONTENT_TYPES = ['text']

# The current version of the exploration schema. If any backward-incompatible
# changes are made to the exploration schema in the YAML definitions, this
# version number must be changed and a migration process put in place.
CURRENT_EXPLORATION_SCHEMA_VERSION = 2


# Repository GET methods.
def _get_exploration_memcache_key(exploration_id):
    """Returns a memcache key for an exploration."""
    return 'exploration:%s' % exploration_id


def get_exploration_by_id(exploration_id, strict=True):
    """Returns a domain object representing an exploration."""
    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcached_exploration = memcache_services.get_multi(
        [exploration_memcache_key]).get(exploration_memcache_key)

    if memcached_exploration is not None:
        return memcached_exploration
    else:
        exploration_model = exp_models.ExplorationModel.get(
            exploration_id, strict=strict)
        if exploration_model:
            exploration = exp_domain.Exploration(exploration_model)
            memcache_services.set_multi({
                exploration_memcache_key: exploration})
            return exploration
        else:
            return None


# Query methods.
def get_all_explorations():
    """Returns a list of domain objects representing all explorations."""
    return [exp_domain.Exploration(e) for e in
            exp_models.ExplorationModel.get_all()]


def get_public_explorations():
    """Returns a list of domain objects representing public explorations."""
    return [exp_domain.Exploration(e) for e in
            exp_models.ExplorationModel.get_public_explorations()]


def get_viewable_explorations(user_id):
    """Returns domain objects for explorations viewable by the given user."""
    actor = rights_manager.Actor(user_id)
    all_explorations = exp_models.ExplorationModel.get_all()
    return [exp_domain.Exploration(e) for e in all_explorations if
            actor.can_view(e.id)]


def get_editable_explorations(user_id):
    """Returns domain objects for explorations editable by the given user."""
    actor = rights_manager.Actor(user_id)
    all_explorations = exp_models.ExplorationModel.get_all()
    return [exp_domain.Exploration(e) for e in all_explorations if
            actor.can_edit(e.id)]


def count_explorations():
    """Returns the total number of explorations."""
    return exp_models.ExplorationModel.get_exploration_count()


# Methods for exporting states and explorations to other formats.
def export_content_to_html(exploration_id, content_array, params=None):
    """Takes a Content array and transforms it into HTML.

    Args:
        exploration_id: the id of the exploration
        content_array: an array, each of whose members is of type Content. This
            object has two keys: type and value. Currently we expect the array
            to contain exactly one entry with type 'text'. The value is an
            HTML string.
        params: any parameters used for templatizing text strings.

    Returns:
        the HTML string representing the array.

    Raises:
        InvalidInputException: if content has no 'type' attribute, or an
            invalid 'type' attribute.
    """
    if params is None:
        params = {}

    html = ''
    for content in content_array:
        if content.type in ALLOWED_CONTENT_TYPES:
            value = jinja_utils.parse_string(content.value, params)

            html += '<div>%s</div>' % value
        else:
            raise utils.InvalidInputException(
                'Invalid content type %s', content.type)
    return html


def export_to_yaml(exploration_id):
    """Returns a YAML version of the exploration."""
    exploration = get_exploration_by_id(exploration_id)

    return utils.yaml_from_dict({
        'default_skin': exploration.default_skin,
        'init_state_name': exploration.init_state_name,
        'param_changes': exploration.param_change_dicts,
        'param_specs': exploration.param_specs_dict,
        'states': {state_name: state.to_dict()
                   for (state_name, state) in exploration.states.iteritems()},
        'schema_version': CURRENT_EXPLORATION_SCHEMA_VERSION
    })


def export_to_zip_file(exploration_id):
    """Returns a ZIP archive of the exploration."""
    yaml_repr = export_to_yaml(exploration_id)
    exploration = get_exploration_by_id(exploration_id)

    o = StringIO.StringIO()
    with zipfile.ZipFile(o, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('%s.yaml' % exploration.title, yaml_repr)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')
        for filepath in dir_list:
            zf.writestr('assets/%s' % filepath, fs.get(filepath))

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
                elif change.property_name == 'param_specs':
                    exploration.update_param_specs(change.new_value)
                elif change.property_name == 'param_changes':
                    exploration.update_param_changes(change.new_value)
        return exploration
    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, exploration_id, change_list)
        )
        raise


def get_summary_of_change_list(exploration_id, change_list):
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

    exploration = get_exploration_by_id(exploration_id)
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


def require_pass_strict_validation(exploration):
    """Ensures that the exploration passes strict validation.

    Raises a utils.ValidationError if strict validation fails.
    """
    warnings = exploration.validate(strict=True)
    if warnings:
        raise utils.ValidationError(warnings)


def save_exploration(
        committer_id, exploration, commit_message='', change_list=None):
    """Commits an exploration domain object to persistent storage.

    If successful, increments the version number of the incoming exploration
    domain object by 1.
    """
    if change_list is None:
        change_list = []

    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    if exploration_rights.status != rights_manager.EXPLORATION_STATUS_PRIVATE:
        require_pass_strict_validation(exploration)
    else:
        exploration.validate()

    def export_to_versionable_dict(exploration):
        """Returns a serialized version of this exploration for versioning.

        The criterion for whether an item is included in the return dict is:
        "suppose I am currently at v10 (say) and want to revert to v4; is this
        property something I would be happy with being overwritten?". Thus, the
        following properties are excluded for explorations:

            ['category', 'default_skin', 'title']

        The exploration id will be used to name the object in the history log,
        so it does not need to be saved within the returned dict.

        For states, all properties except 'id' are versioned. State dests are
        specified using names and not ids.
        """
        return {
            'init_state_name': exploration.init_state_name,
            'param_changes': exploration.param_change_dicts,
            'param_specs': exploration.param_specs_dict,
            'states': {
                state_name: state.to_dict()
                for (state_name, state) in exploration.states.iteritems()
            }
        }

    exploration_model = exp_models.ExplorationModel.get(exploration.id)
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

    properties_dict = {
        'category': exploration.category,
        'title': exploration.title,
        'init_state_name': exploration.init_state_name,
        'states': {
            state_name: state.to_dict()
            for (state_name, state) in exploration.states.iteritems()},
        'param_specs': exploration.param_specs_dict,
        'param_changes': exploration.param_change_dicts,
        'default_skin': exploration.default_skin,
        'version': exploration_model.version,
    }

    version_snapshot = export_to_versionable_dict(exploration)
    exploration_model.put(
        committer_id, properties_dict, version_snapshot, commit_message,
        change_list)
    memcache_services.delete(_get_exploration_memcache_key(exploration.id))

    exploration.version += 1


def create_new(
    user_id, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME,
        default_dest_is_end_state=False, cloned_from=None):
    """Creates and saves a new exploration; returns its id."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = (exploration_id or
                      exp_models.ExplorationModel.get_new_id(title))

    default_dest = (
        feconf.END_DEST if default_dest_is_end_state else init_state_name)
    init_state = exp_domain.State.create_default_state(default_dest)

    exploration_model = exp_models.ExplorationModel(
        id=exploration_id, title=title, category=category,
        init_state_name=init_state_name,
        states={
            init_state_name: init_state.to_dict()
        }
    )

    exp_domain.Exploration(exploration_model).validate()

    exploration_model.put(
        user_id, {}, commit_message='Exploration first created.')

    rights_manager.create_new_exploration_rights(
        exploration_id, user_id, cloned_from)

    return exploration_id


def delete_exploration(committer_id, exploration_id, force_deletion=False):
    """Deletes the exploration with the given exploration_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this exploration, prior to calling this function.

    If force_deletion is True the exploration and its history are fully deleted
    and are unrecoverable. Otherwise, the exploration and all its history are
    marked as deleted, but the corresponding models are still retained in the
    datastore. This last option is the preferred one.
    """
    # This must come after the exploration is retrieved. Otherwise the memcache
    # key will be reinstated.
    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcache_services.delete(exploration_memcache_key)

    exploration_model = exp_models.ExplorationModel.get(exploration_id)
    exploration_model.delete(committer_id, '', force_deletion=force_deletion)


# Operations involving exploration parameters.
def get_init_params(exploration_id):
    """Returns an initial set of exploration parameters for a reader."""
    exploration = get_exploration_by_id(exploration_id)

    # Note that the list of parameter changes is ordered. Parameter changes
    # later in the list may depend on parameter changes that have been set
    # earlier in the same list.
    new_params = {}
    for pc in exploration.param_changes:
        obj_type = exploration.get_obj_type_for_param(pc.name)
        new_params[pc.name] = pc.get_normalized_value(obj_type, new_params)
    return new_params


def update_with_state_params(exploration_id, state_name, reader_params):
    """Updates a reader's params using the params for the given state."""
    exploration = get_exploration_by_id(exploration_id)
    state = exploration.states[state_name]
    new_params = copy.deepcopy(reader_params)

    # Note that the list of parameter changes is ordered. Parameter changes
    # later in the list may depend on parameter changes that have been set
    # earlier in the same list.
    for pc in state.param_changes:
        obj_type = exploration.get_obj_type_for_param(pc.name)
        new_params[pc.name] = pc.get_normalized_value(obj_type, new_params)
    return new_params


# Operations on exploration snapshots.
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
    save_exploration(committer_id, exploration, commit_message, change_list)


def classify(exploration_id, state_name, handler_name, answer, params):
    """Return the first rule that is satisfied by a reader's answer."""

    exploration = get_exploration_by_id(exploration_id)
    state = exploration.states[state_name]

    # Get the widget to determine the input type.
    generic_handler = widget_registry.Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, state.widget.widget_id
    ).get_handler_by_name(handler_name)

    handler = next(h for h in state.widget.handlers if h.name == handler_name)
    fs = fs_domain.AbstractFileSystem(
        fs_domain.ExplorationFileSystem(exploration_id))

    if generic_handler.input_type is None:
        return handler.rule_specs[0]
    else:
        for rule_spec in handler.rule_specs:
            if rule_domain.evaluate_rule(
                    rule_spec.definition, exploration.param_specs,
                    generic_handler.input_type, params, answer, fs):
                return rule_spec

        raise Exception(
            'No matching rule found for handler %s.' % handler.name)


# Creation and deletion methods.
def create_from_yaml(
        yaml_content, user_id, title, category, exploration_id=None,
        cloned_from=None):
    """Creates an exploration from a YAML text string."""

    def convert_v1_dict_to_v2_dict(exploration_dict):
        """Converts a v1 exploration dict into a v2 exploration dict."""
        exploration_dict['schema_version'] = 2
        exploration_dict['init_state_name'] = (
            exploration_dict['states'][0]['name'])

        states_dict = {}
        for state in exploration_dict['states']:
            states_dict[state['name']] = state
            del states_dict[state['name']]['name']
        exploration_dict['states'] = states_dict

        return exploration_dict

    exploration_dict = utils.dict_from_yaml(yaml_content)

    exploration_schema_version = exploration_dict.get('schema_version')
    if not (1 <= exploration_schema_version
            <= CURRENT_EXPLORATION_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1 and v2 YAML files at present.')
    if exploration_schema_version == 1:
        exploration_dict = convert_v1_dict_to_v2_dict(exploration_dict)

    init_state_name = exploration_dict['init_state_name']
    exploration_id = create_new(
        user_id, title, category, exploration_id=exploration_id,
        init_state_name=init_state_name, cloned_from=cloned_from)

    exploration = get_exploration_by_id(exploration_id)

    try:
        exploration_param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val) for
            (ps_name, ps_val) in exploration_dict['param_specs'].iteritems()
        }

        exploration.add_states([
            state_name for state_name in exploration_dict['states']
            if state_name != init_state_name])

        for (state_name, sdict) in exploration_dict['states'].iteritems():
            state = exploration.states[state_name]

            state.content = [
                exp_domain.Content(
                    item['type'], html_cleaner.clean(item['value']))
                for item in sdict['content']
            ]

            state.param_changes = [param_domain.ParamChange(
                pc['name'], pc['generator_id'], pc['customization_args']
            ) for pc in sdict['param_changes']]

            for pc in state.param_changes:
                if pc.name not in exploration_param_specs:
                    raise Exception('Parameter %s was used in a state but not '
                                    'declared in the exploration param_specs.'
                                    % pc.name)

            wdict = sdict['widget']
            widget_handlers = [exp_domain.AnswerHandlerInstance.from_dict({
                'name': handler['name'],
                'rule_specs': [{
                    'definition': rule_spec['definition'],
                    'dest': rule_spec['dest'],
                    'feedback': [html_cleaner.clean(feedback)
                                 for feedback in rule_spec['feedback']],
                    'param_changes': rule_spec.get('param_changes', []),
                } for rule_spec in handler['rule_specs']],
            }) for handler in wdict['handlers']]

            state.widget = exp_domain.WidgetInstance(
                wdict['widget_id'], wdict['customization_args'],
                widget_handlers, wdict['sticky'])

            exploration.states[state_name] = state

        exploration.default_skin = exploration_dict['default_skin']
        exploration.param_specs = exploration_param_specs
        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]
        save_exploration(user_id, exploration)
    except Exception:
        delete_exploration(user_id, exploration_id, force_deletion=True)
        raise

    return exploration_id


def clone_exploration(committer_id, old_exploration_id):
    """Clones an exploration and returns the new exploration's id."""
    old_exploration = get_exploration_by_id(old_exploration_id)
    if not rights_manager.Actor(committer_id).can_clone(old_exploration_id):
        raise Exception('You cannot copy this exploration.')

    new_exploration_id = create_from_yaml(
        export_to_yaml(old_exploration_id), committer_id,
        'Copy of %s' % old_exploration.title, old_exploration.category,
        cloned_from=old_exploration_id
    )

    # Duplicate the assets of the old exploration.
    old_fs = fs_domain.AbstractFileSystem(
        fs_domain.ExplorationFileSystem(old_exploration_id))
    new_fs = fs_domain.AbstractFileSystem(
        fs_domain.ExplorationFileSystem(new_exploration_id))

    dir_list = old_fs.listdir('')
    for filepath in dir_list:
        file_content = old_fs.get(filepath)
        new_fs.put(feconf.ADMIN_COMMITTER_ID, filepath, file_content)

    return new_exploration_id


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


def delete_demo(exploration_id):
    """Deletes a single demo exploration."""
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
    create_from_yaml(
        yaml_content, feconf.ADMIN_COMMITTER_ID, title, category,
        exploration_id=exploration_id)

    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        fs.put(feconf.ADMIN_COMMITTER_ID, asset_filename, asset_content)

    rights_manager.publish_exploration(
        feconf.ADMIN_COMMITTER_ID, exploration_id)

    logging.info('Exploration with id %s was loaded.' % exploration_id)

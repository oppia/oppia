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
import json
import logging
import os

from core.domain import exp_domain
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import stats_domain
from core.domain import widget_domain
from core.platform import models
import feconf
import jinja_utils
memcache_services = models.Registry.import_memcache_services()
(exp_models, image_models, state_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.image, models.NAMES.state])
import utils


# TODO(sll): Unify this with the SUBMIT_HANDLER_NAMEs in other files.
SUBMIT_HANDLER_NAME = 'submit'
ADMIN_COMMITTER_ID = 'admin'


# Repository GET methods.
def _get_exploration_memcache_key(exploration_id):
    """Returns a memcache key for an exploration."""
    return 'exploration:%s' % exploration_id


def _get_state_memcache_key(exploration_id, state_id):
    """Returns a memcache key for a state."""
    return 'state:%s:%s' % (exploration_id, state_id)


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
        exploration = exp_domain.Exploration(
            exploration_model) if exploration_model else None

        memcache_services.set_multi({exploration_memcache_key: exploration})
        return exploration


def get_state_by_id(exploration_id, state_id, strict=True):
    """Returns a domain object representing a state, given its id."""
    # TODO(sll): Generalize this to handle multiple state_ids at a time.
    exploration = get_exploration_by_id(exploration_id)
    if state_id not in exploration.state_ids:
        raise ValueError(
            'Invalid state id %s for exploration %s' % (
                state_id, exploration.id))

    state_memcache_key = _get_state_memcache_key(exploration_id, state_id)
    memcached_state = memcache_services.get_multi(
        [state_memcache_key]).get(state_memcache_key)

    if memcached_state is not None:
        return memcached_state
    else:
        state = next(s for s in exploration.states if s.id == state_id)
        memcache_services.set_multi({state_memcache_key: state})
        return state


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
    return [exp_domain.Exploration(e) for e in
            exp_models.ExplorationModel.get_viewable_explorations(user_id)]


def get_editable_explorations(user_id):
    """Returns domain objects for explorations editable by the given user."""
    return [e for e in get_viewable_explorations(user_id)
            if e.is_editable_by(user_id)]


def count_explorations():
    """Returns the total number of explorations."""
    return exp_models.ExplorationModel.get_exploration_count()


# Methods for exporting states and explorations to other formats.
def export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=False):
    """Gets a Python dict of the internals of the state."""

    state = get_state_by_id(exploration_id, state_id)
    state_dict = copy.deepcopy(state.to_dict())

    if human_readable_dests:
        # Change the dest ids to human-readable names.
        for handler in state_dict['widget']['handlers']:
            for rule in handler['rule_specs']:
                if rule['dest'] != feconf.END_DEST:
                    dest_state = get_state_by_id(exploration_id, rule['dest'])
                    rule['dest'] = dest_state.name
    return state_dict


def export_state_to_dict(exploration_id, state_id):
    """Gets a Python dict representation of the state."""
    state_dict = export_state_internals_to_dict(exploration_id, state_id)
    state_dict.update({'id': state_id})
    return state_dict


def get_unresolved_answers_for_default_rule(exploration_id, state_id):
    """Gets the tally of unresolved answers that hit the default rule."""
    # TODO(sll): Add similar functionality for other rules? But then we have
    # to figure out what happens when those rules are edited/deleted.
    # TODO(sll): Should this return just the top N answers instead?
    return stats_domain.StateRuleAnswerLog.get(
        exploration_id, state_id, SUBMIT_HANDLER_NAME,
        exp_domain.DEFAULT_RULESPEC_STR).answers


def export_state_to_verbose_dict(exploration_id, state_id):
    """Gets a state dict with rule descriptions and unresolved answers."""

    state_dict = export_state_to_dict(exploration_id, state_id)

    state_dict['unresolved_answers'] = get_unresolved_answers_for_default_rule(
        exploration_id, state_id)

    # TODO(sll): Fix the frontend and remove this line.
    state_dict['widget']['id'] = state_dict['widget']['widget_id']

    state = get_state_by_id(exploration_id, state_id)

    for handler in state_dict['widget']['handlers']:
        for rule_spec in handler['rule_specs']:
            if rule_spec['name'] == feconf.DEFAULT_RULE_NAME:
                rule_spec['description'] = feconf.DEFAULT_RULE_NAME
            else:
                rule_spec['description'] = (
                    widget_domain.Registry.get_widget_by_id(
                        feconf.INTERACTIVE_PREFIX, state.widget.widget_id
                    ).get_rule_description(handler['name'], rule_spec['name'])
                )

    return state_dict


def export_content_to_html(content_array, block_number, params=None):
    """Takes a Content array and transforms it into HTML.

    Args:
        content_array: an array, each of whose members is of type Content. This
            object has two keys: type and value. The 'type' is one of the
            following:
                - 'text'; then the value is a text string
                - 'image'; then the value is an image ID
                - 'video'; then the value is a video ID
                - 'widget'; then the value is a JSON-encoded dict with keys
                    'id' and 'params', from which the raw widget HTML can be
                    constructed
        block_number: the number of content blocks preceding this one.
        params: any parameters used for templatizing text strings.

    Returns:
        the HTML string representing the array.

    Raises:
        InvalidInputException: if content has no 'type' attribute, or an
            invalid 'type' attribute.
    """
    if params is None:
        params = {}

    JINJA_ENV = jinja_utils.get_jinja_env(feconf.FRONTEND_TEMPLATES_DIR)

    html, widget_array = '', []
    for content in content_array:
        if content.type in ['text', 'image', 'video']:
            value = (utils.parse_with_jinja(content.value, params)
                     if content.type == 'text' else content.value)

            html += JINJA_ENV.get_template('reader/content.html').render({
                'type': content.type,
                'value': value,
            })
        elif content.type == 'widget':
            # Ignore empty widget specifications.
            if not content.value:
                continue

            widget_dict = json.loads(content.value)
            widget = widget_domain.Registry.get_widget_by_id(
                feconf.NONINTERACTIVE_PREFIX, widget_dict['id'])
            widget_array_len = len(widget_array)
            html += JINJA_ENV.get_template('reader/content.html').render({
                'blockIndex': block_number,
                'index': widget_array_len,
                'type': content.type,
            })
            widget_array.append({
                'blockIndex': block_number,
                'index': widget_array_len,
                'raw': widget.get_raw_code(widget_dict['params']),
            })
        else:
            raise utils.InvalidInputException(
                'Invalid content type %s', content.type)
    return html, widget_array


def export_to_versionable_dict(exploration_id):
    """Returns a serialized version of this exploration for versioning.

    The criterion for whether an item is included in the return dict is:
    "suppose I am currently at v10 (say) and want to revert to v4; is this
    property something I would be happy with being overwritten?". Thus, the
    following properties are excluded for explorations:

        ['category', 'default_skin', 'editor_ids', 'image_id', 'is_public',
         'title']

    The exploration id will be used to name the object in the history log,
    so it does not need to be saved within the returned dict.

    For states, all properties except 'id' are versioned. State dests are
    specified using names and not ids.
    """
    exploration = get_exploration_by_id(exploration_id)

    params = [{
        'name': param.name, 'obj_type': param.obj_type, 'values': param.values
    } for param in exploration.parameters]

    states_list = [export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=True)
        for state_id in exploration.state_ids]

    return {
        'parameters': params, 'states': states_list
    }


def export_to_yaml(exploration_id):
    """Returns a YAML version of the exploration."""
    exploration = get_exploration_by_id(exploration_id)

    params = [{
        'name': param.name, 'obj_type': param.obj_type, 'values': param.values
    } for param in exploration.parameters]

    states_list = [export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=True)
        for state_id in exploration.state_ids]

    return utils.yaml_from_dict({
        'default_skin': exploration.default_skin,
        'parameters': params,
        'states': states_list
    })


# Repository SAVE and DELETE methods.
def save_exploration(committer_id, exploration):
    """Commits an exploration domain object to persistent storage."""
    exploration.validate()

    versionable_dict = None
    if exploration.is_public:
        # This must be computed before memcache is cleared.
        versionable_dict = export_to_versionable_dict(exploration.id)

    # TODO(sll): The rest of this should be done in a transaction.

    exploration_memcache_key = _get_exploration_memcache_key(exploration.id)
    memcache_services.delete(exploration_memcache_key)

    exploration_model = exp_models.ExplorationModel.get(exploration.id)
    properties_dict = {
        'category': exploration.category,
        'title': exploration.title,
        'state_ids': exploration.state_ids,
        'parameters': exploration.param_dicts,
        'is_public': exploration.is_public,
        'image_id': exploration.image_id,
        'editor_ids': exploration.editor_ids,
        'default_skin': exploration.default_skin,
        'version': exploration_model.version,
    }

    if versionable_dict:
        # Create a snapshot for the version history.
        exploration_model.put(
            committer_id,
            properties_dict,
            snapshot=versionable_dict
        )
    else:
        exploration_model.put(committer_id, properties_dict)


def save_state(committer_id, exploration_id, state):
    """Commits a state domain object to persistent storage.

    The caller should also commit the exploration, if appropriate.
    """
    state_memcache_key = _get_state_memcache_key(exploration_id, state.id)
    memcache_services.delete(state_memcache_key)

    state.validate()

    state_model = state_models.StateModel.get(state.id, strict=False)
    if state_model is None:
        state_model = state_models.StateModel(id=state.id)

    state_model.value = state.to_dict()
    state_model.put()


def create_new(
    user_id, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME, image_id=None):
    """Creates and saves a new exploration; returns its id."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = (exploration_id or
                      exp_models.ExplorationModel.get_new_id(title))

    state_id = state_models.StateModel.get_new_id(init_state_name)
    new_state = exp_domain.State(state_id, init_state_name, [], [], None)
    save_state(user_id, exploration_id, new_state)

    # Note that demo explorations do not have owners, so user_id may be None.
    exploration_model = exp_models.ExplorationModel(
        id=exploration_id, title=title, category=category,
        image_id=image_id, state_ids=[state_id],
        editor_ids=[user_id] if user_id else [])

    exploration_model.put(user_id, {})

    return exploration_model.id


def delete_state_model(exploration_id, state_id):
    """Directly deletes a state model."""
    state_memcache_key = _get_state_memcache_key(exploration_id, state_id)
    memcache_services.delete(state_memcache_key)
    state_model = state_models.StateModel.get(state_id)
    state_model.delete()


def delete_exploration(committer_id, exploration_id, force_deletion=False):
    """Deletes the exploration with the given exploration_id."""
    exploration = get_exploration_by_id(exploration_id)
    if not force_deletion and not exploration.is_deletable_by(committer_id):
        raise Exception(
            'User %s does not have permissions to delete exploration %s' %
            (committer_id, exploration_id))

    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcache_services.delete(exploration_memcache_key)

    for state in exploration.states:
        delete_state_model(exploration_id, state.id)

    exploration_model = exp_models.ExplorationModel.get(exploration_id)
    exploration_model.delete()

    for snapshot in exp_models.ExplorationSnapshotModel.get_all():
        if snapshot.exploration_id == exploration_id:
            snapshot.delete()


# Operations involving exploration parameters.
def get_or_create_param(committer_id, exploration_id, name, obj_type, values):
    """Returns a Parameter instance corresponding to the given inputs.

    If the parameter does not exist in the given exploration, it is added to
    the list of exploration parameters.

    If the obj_type is None, it is taken to be 'TemplatedString' if any element
    of values contains '{{' and '}}' characters, and 'UnicodeString' otherwise.

    If a parameter with this name already exists for the exploration, and the
    new obj_type does not match the existing parameter's obj_type, a
    ValueError is raised.
    """
    exploration = get_exploration_by_id(exploration_id)

    for param in exploration.parameters:
        if param.name == name:
            if obj_type and param.obj_type != obj_type:
                raise ValueError(
                    'Parameter %s has wrong obj_type: was %s, expected %s'
                    % (name, obj_type, param.obj_type))
            else:
                return param_domain.Parameter(
                    param.name, param.obj_type, values)

    # The parameter was not found, so add it.
    if obj_type is None:
        is_template = False
        for value in values:
            if (isinstance(value, basestring) and
                    '{{' in value and '}}' in value):
                is_template = True
        obj_type = ('TemplatedString' if is_template else 'UnicodeString')

    added_param = param_domain.Parameter(name, obj_type, values)

    exploration.parameters.append(added_param)
    save_exploration(committer_id, exploration)

    return added_param


def update_with_state_params(exploration_id, state_id, reader_params=None):
    """Updates a reader's params using the params for the given state."""
    if reader_params is None:
        reader_params = {}

    state = get_state_by_id(exploration_id, state_id)

    for item in state.param_changes:
        reader_params[item.name] = (
            None if item.value is None else utils.parse_with_jinja(
                item.value, reader_params))
    return reader_params


def get_exploration_params(exploration_id):
    """Gets exploration-scoped parameters when an exploration is started."""
    exploration = get_exploration_by_id(exploration_id)

    params = {}
    for param in exploration.parameters:
        params[param.name] = param.value
    return params


# Operations on exploration snapshots.
def get_exploration_snapshots_metadata(exploration_id, limit):
    """Returns the most recent snapshots for this exploration, as dicts.

    Args:
        exploration_id: str. The id of the exploration in question.
        limit: int. The maximum number of snapshots to return.

    Returns:
        list of dicts, each representing a recent snapshot. Each dict has the
        following keys: committer_id, commit_message, created_on,
        version_number. The version numbers are consecutive and in descending
        order. There are max(limit, exploration.version_number) items in the
        returned list.
    """
    exploration = get_exploration_by_id(exploration_id)
    oldest_version = max(exploration.version - limit, 0) + 1
    current_version = exploration.version
    version_nums = range(current_version, oldest_version - 1, -1)

    return [exp_models.ExplorationSnapshotModel.get_metadata(
        exploration_id, version_num
    ) for version_num in version_nums]


# Operations on states belonging to an exploration.
def get_state_by_name(exploration_id, state_name, strict=True):
    """Gets a state by name. Fails noisily if strict == True."""
    exploration = get_exploration_by_id(exploration_id)
    assert state_name

    # TODO(sll): This is too slow; improve it.
    state = None
    for candidate_state in exploration.states:
        if candidate_state.name == state_name:
            state = candidate_state
            break

    if strict and not state:
        raise Exception('State %s not found' % state_name)
    return state


def convert_state_name_to_id(exploration_id, state_name):
    """Converts a state name to an id. Handles the END state case."""
    if state_name == feconf.END_DEST:
        return feconf.END_DEST
    return get_state_by_name(exploration_id, state_name).id


def add_state(committer_id, exploration_id, state_name, state_id=None):
    """Adds a new state, and returns it. Commits changes."""
    exploration = get_exploration_by_id(exploration_id)
    if exploration.has_state_named(state_name):
        raise ValueError('Duplicate state name %s' % state_name)

    state_id = state_id or state_models.StateModel.get_new_id(state_name)
    new_state = exp_domain.State(state_id, state_name, [], [], None)
    save_state(committer_id, exploration_id, new_state)

    exploration.state_ids.append(state_id)
    save_exploration(committer_id, exploration)


def rename_state(committer_id, exploration_id, state_id, new_state_name):
    """Renames a state of this exploration. Commits changes."""
    if new_state_name == feconf.END_DEST:
        raise ValueError('Invalid state name: %s' % feconf.END_DEST)

    state = get_state_by_id(exploration_id, state_id)
    if state.name == new_state_name:
        return get_exploration_by_id(exploration_id)

    exploration = get_exploration_by_id(exploration_id)
    if exploration.has_state_named(new_state_name):
        raise ValueError('Duplicate state name: %s' % new_state_name)

    state.name = new_state_name
    save_state(committer_id, exploration_id, state)
    save_exploration(committer_id, exploration)


def delete_state(committer_id, exploration_id, state_id):
    """Deletes the given state. Commits changes."""
    exploration = get_exploration_by_id(exploration_id)
    if state_id not in exploration.state_ids:
        raise ValueError('Invalid state id %s for exploration %s' %
                        (state_id, exploration.id))

    # Do not allow deletion of initial states.
    if exploration.state_ids[0] == state_id:
        raise ValueError('Cannot delete initial state of an exploration.')

    # Find all destinations in the exploration which equal the deleted
    # state, and change them to loop back to their containing state.
    for other_state_id in exploration.state_ids:
        other_state = get_state_by_id(exploration_id, other_state_id)
        changed = False
        for handler in other_state.widget.handlers:
            for rule in handler.rule_specs:
                if rule.dest == state_id:
                    rule.dest = other_state_id
                    changed = True
        if changed:
            save_state(committer_id, exploration_id, other_state)

    # Delete the state with id state_id.
    delete_state_model(exploration_id, state_id)
    exploration.state_ids.remove(state_id)
    save_exploration(committer_id, exploration)


def _find_first_match(handler, all_rule_classes, answer, state_params):
    for rule_spec in handler.rule_specs:
        if rule_spec.is_default:
            return rule_spec

        r = next(r for r in all_rule_classes if r.__name__ == rule_spec.name)

        param_list = []
        param_defns = rule_domain.get_param_list(r.description)
        for (param_name, obj_cls) in param_defns:
            parsed_param = rule_spec.inputs[param_name]
            if (isinstance(parsed_param, basestring) and '{{' in parsed_param):
                parsed_param = utils.parse_with_jinja(
                    parsed_param, state_params)
            normalized_param = obj_cls.normalize(parsed_param)
            param_list.append(normalized_param)

        match = r(*param_list).eval(answer)
        if match:
            return rule_spec

    raise Exception(
        'No matching rule found for handler %s.' % handler.name)


def classify(exploration_id, state_id, handler_name, answer, params):
    """Return the first rule that is satisfied by a reader's answer."""
    state = get_state_by_id(exploration_id, state_id)

    # Get the widget to determine the input type.
    generic_handler = widget_domain.Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, state.widget.widget_id
    ).get_handler_by_name(handler_name)

    handler = next(h for h in state.widget.handlers if h.name == handler_name)

    if generic_handler.input_type is None:
        selected_rule = handler.rule_specs[0]
    else:
        selected_rule = _find_first_match(
            handler, generic_handler.rules, answer, params)

    return selected_rule


# Creation and deletion methods.
def create_from_yaml(
    yaml_content, user_id, title, category, exploration_id=None,
        image_id=None):
    """Creates an exploration from a YAML text string."""
    exploration_dict = utils.dict_from_yaml(yaml_content)
    init_state_name = exploration_dict['states'][0]['name']

    # TODO(sll): Import the default skin too.
    exploration = get_exploration_by_id(create_new(
        user_id, title, category, exploration_id=exploration_id,
        init_state_name=init_state_name, image_id=image_id))
    exploration_id = exploration.id

    try:
        exploration.parameters = [
            param_domain.Parameter.from_dict(param_dict)
            for param_dict in exploration_dict['parameters']
        ]

        for sdict in exploration_dict['states']:
            if sdict['name'] != init_state_name:
                add_state(user_id, exploration_id, sdict['name'])

        for sdict in exploration_dict['states']:
            state = get_state_by_name(exploration_id, sdict['name'])

            state.content = [
                exp_domain.Content(item['type'], item['value'])
                for item in sdict['content']
            ]

            state.param_changes = [get_or_create_param(
                user_id, exploration_id, pc['name'],
                pc['obj_type'], pc['values']
            ) for pc in sdict['param_changes']]

            wdict = sdict['widget']
            widget_handlers = [exp_domain.AnswerHandlerInstance.from_dict({
                'name': handler['name'],
                'rule_specs': [{
                    'name': rule_spec['name'],
                    'inputs': rule_spec['inputs'],
                    'dest': convert_state_name_to_id(
                        exploration_id, rule_spec['dest']),
                    'feedback': rule_spec['feedback'],
                    'param_changes': rule_spec.get('param_changes', []),
                } for rule_spec in handler['rule_specs']],
            }) for handler in wdict['handlers']]

            state.widget = exp_domain.WidgetInstance(
                wdict['widget_id'], wdict['params'], widget_handlers,
                wdict['sticky'])

            save_state(user_id, exploration_id, state)

    except Exception:
        delete_exploration(user_id, exploration.id, force_deletion=True)
        raise

    return exploration.id


def fork_exploration(exploration_id, user_id):
    """Forks an exploration and returns the new exploration's id."""
    exploration = get_exploration_by_id(exploration_id)
    if not exploration.is_forkable_by(user_id):
        raise Exception('You cannot copy this exploration.')

    return create_from_yaml(
        export_to_yaml(exploration_id), user_id,
        'Copy of %s' % exploration.title, exploration.category
    )


def load_demos():
    """Initializes the demo explorations."""
    for index, exploration in enumerate(feconf.DEMO_EXPLORATIONS):
        if len(exploration) == 3:
            (exp_filename, title, category) = exploration
            image_filename = None
        elif len(exploration) == 4:
            (exp_filename, title, category, image_filename) = exploration
        else:
            raise Exception('Invalid demo exploration: %s' % exploration)

        image_id = None
        if image_filename:
            image_filepath = os.path.join(
                feconf.SAMPLE_IMAGES_DIR, image_filename)
            image_id = image_models.Image.create(utils.get_file_contents(
                image_filepath, raw_bytes=True))

        yaml_content = utils.get_sample_exploration_yaml(exp_filename)
        exploration_id = create_from_yaml(
            yaml_content, ADMIN_COMMITTER_ID, title, category,
            exploration_id=str(index), image_id=image_id)

        exploration = get_exploration_by_id(exploration_id)
        exploration.is_public = True
        save_exploration(ADMIN_COMMITTER_ID, exploration)


def delete_demos():
    """Deletes the demo explorations."""
    exploration_ids_to_delete = []
    for int_id in range(len(feconf.DEMO_EXPLORATIONS)):
        exploration = get_exploration_by_id(str(int_id), strict=False)
        if not exploration:
            # This exploration does not exist, so it cannot be deleted.
            logging.info('No exploration with id %s found.' % int_id)
        else:
            exploration_ids_to_delete.append(exploration.id)

    for exploration_id in exploration_ids_to_delete:
        delete_exploration(ADMIN_COMMITTER_ID, exploration_id)


def reload_demos():
    """Reloads the demo explorations."""
    delete_demos()
    load_demos()


def delete_all_explorations():
    """Deletes all explorations."""
    explorations = get_all_explorations()
    for exploration in explorations:
        delete_exploration(None, exploration.id, force_deletion=True)

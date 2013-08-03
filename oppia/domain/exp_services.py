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

"""Commands that can be used to operate on Oppia explorations.

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

import feconf
from oppia.domain import exp_domain
from oppia.domain import rule_domain
from oppia.domain import stats_services
from oppia.domain import widget_domain
from oppia.platform import models
(exp_models, image_models, param_models, state_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.image,
        models.NAMES.parameter, models.NAMES.state
    ])
)
import utils


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


# Operations involving exploration parameters.
def get_or_create_param(exploration_id, param_name, obj_type=None):
    """Returns a ParamChange instance corresponding to the given inputs.

    If the parameter does not exist in the given exploration, it is added to
    the list of exploration parameters.

    If the obj_type is not specified it is taken to be 'UnicodeString'.

    If the obj_type does not match the obj_type for the parameter in the
    exploration, an Exception is raised.
    """
    exploration = exp_domain.Exploration.get(exploration_id)

    for param in exploration.parameters:
        if param.name == param_name:
            if obj_type and param.obj_type != obj_type:
                raise Exception(
                    'Parameter %s has wrong obj_type: was %s, expected %s'
                    % (param_name, obj_type, param.obj_type))
            return param_models.ParamChange(
                name=param.name, obj_type=param.obj_type)

    # The parameter was not found, so add it.
    if not obj_type:
        obj_type = 'UnicodeString'
    exploration.parameters.append(
        param_models.Parameter(name=param_name, obj_type=obj_type))
    exploration.put()
    return param_models.ParamChange(name=param_name, obj_type=obj_type)


def update_with_state_params(exploration_id, state_id, reader_params=None):
    """Updates a reader's params using the params for the given state."""
    if reader_params is None:
        reader_params = {}

    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

    for item in state.param_changes:
        reader_params[item.name] = (
            None if item.value is None else utils.parse_with_jinja(
                item.value, reader_params))
    return reader_params


def get_exploration_params(exploration_id):
    """Gets exploration-scoped parameters when an exploration is started."""
    exploration = exp_domain.Exploration.get(exploration_id)

    params = {}
    for param in exploration.parameters:
        params[param.name] = param.value
    return params


# Operations on states belonging to an exploration.
def get_state_by_name(exploration_id, state_name, strict=True):
    """Gets a state by name. Fails noisily if strict == True."""
    exploration = exp_domain.Exploration.get(exploration_id)
    assert state_name

    # TODO(sll): This is too slow; improve it.
    state = None
    for state_id in exploration.state_ids:
        candidate_state = state_models.State.get(state_id)
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


def modify_using_dict(exploration_id, state_id, sdict):
    """Modifies the properties of a state using values from a dict."""
    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

    state.content = [
        state_models.Content(type=item['type'], value=item['value'])
        for item in sdict['content']
    ]

    state.param_changes = []
    for pc in sdict['param_changes']:
        instance = get_or_create_param(
            exploration_id, pc['name'], obj_type=pc['obj_type'])
        instance.values = pc['values']
        state.param_changes.append(instance)

    wdict = sdict['widget']
    state.widget = state_models.WidgetInstance(
        widget_id=wdict['widget_id'], sticky=wdict['sticky'],
        params=wdict['params'], handlers=[]).put()

    # Augment the list of parameters in state.widget with the default widget
    # params.
    widget_params = widget_domain.Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, wdict['widget_id']).params
    for wp in widget_params:
        if wp.name not in wdict['params']:
            state.widget.params[wp.name] = wp.values

    for handler in wdict['handlers']:
        handler_rule_specs = [state_models.RuleSpec(
            name=rule_spec['name'],
            inputs=rule_spec['inputs'],
            dest=convert_state_name_to_id(exploration_id, rule_spec['dest']),
            feedback=rule_spec['feedback']
        ) for rule_spec in handler['rule_specs']]

        state.widget.handlers.append(state_models.AnswerHandlerInstance(
            name=handler['name'], rule_specs=handler_rule_specs))

    state.widget.put()
    state.put()
    return state


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
    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

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
def create_new(
    user_id, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME, image_id=None):
    """Creates, saves and returns a new exploration id."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = (exploration_id or
                      exp_models.ExplorationModel.get_new_id(title))

    state_id = state_models.State.get_new_id(init_state_name)
    new_state = state_models.State(id=state_id, name=init_state_name)
    new_state.put()

    # Note that demo explorations do not have owners, so user_id may be None.
    exploration = exp_models.ExplorationModel(
        id=exploration_id, title=title, category=category,
        image_id=image_id, state_ids=[state_id],
        editor_ids=[user_id] if user_id else [])

    exploration.put()

    return exploration.id


def create_from_yaml(
    yaml_content, user_id, title, category, exploration_id=None,
        image_id=None):
    """Creates an exploration from a YAML text string."""
    exploration_dict = utils.dict_from_yaml(yaml_content)
    init_state_name = exploration_dict['states'][0]['name']

    exploration = exp_domain.Exploration.get(create_new(
        user_id, title, category, exploration_id=exploration_id,
        init_state_name=init_state_name, image_id=image_id))

    init_state = get_state_by_name(exploration.id, init_state_name)

    try:
        exploration.parameters = [param_models.Parameter(
            name=param['name'], obj_type=param['obj_type'],
            values=param['values']
        ) for param in exploration_dict['parameters']]

        state_list = []
        for state_description in exploration_dict['states']:
            state_name = state_description['name']
            state = (init_state if state_name == init_state_name
                     else exploration.add_state(state_name))
            state_list.append({'state': state, 'desc': state_description})

        for index, state in enumerate(state_list):
            modify_using_dict(exploration.id, state['state'].id, state['desc'])
    except Exception:
        exploration.delete()
        raise

    return exploration.id


def fork_exploration(exploration_id, user_id):
    """Forks an exploration and returns the new exploration's id."""
    exploration = exp_domain.Exploration.get(exploration_id)
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
            yaml_content, None, title, category, exploration_id=str(index),
            image_id=image_id)

        exploration = exp_domain.Exploration.get(exploration_id)
        exploration.is_public = True
        exploration.put()


def delete_demos():
    """Deletes the demo explorations."""
    explorations_to_delete = []
    for int_id in range(len(feconf.DEMO_EXPLORATIONS)):
        exploration = exp_domain.Exploration.get(str(int_id), strict=False)
        if not exploration:
            # This exploration does not exist, so it cannot be deleted.
            logging.info('No exploration with id %s found.' % int_id)
        else:
            explorations_to_delete.append(exploration)

    for exploration in explorations_to_delete:
        exploration.delete()


def reload_demos():
    """Reloads the demo explorations."""
    delete_demos()
    load_demos()


def delete_all_explorations():
    """Deletes all explorations."""
    explorations = get_all_explorations()
    for exploration in explorations:
        exploration.delete()


# Methods for exporting states and explorations to other formats.
def export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=False):
    """Gets a Python dict of the internals of the state."""

    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

    state_dict = copy.deepcopy(state.to_dict())

    if human_readable_dests:
        # Change the dest ids to human-readable names.
        for handler in state_dict['widget']['handlers']:
            for rule in handler['rule_specs']:
                if rule['dest'] != feconf.END_DEST:
                    dest_state = exploration.get_state_by_id(rule['dest'])
                    rule['dest'] = dest_state.name
    return state_dict


def export_state_to_dict(exploration_id, state_id):
    """Gets a Python dict representation of the state."""
    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

    state_dict = export_state_internals_to_dict(exploration_id, state_id)
    state_dict.update({'id': state.id, 'name': state.name})
    return state_dict


def export_state_to_verbose_dict(exploration_id, state_id):
    """Gets a state dict with rule descriptions and unresolved answers."""

    state_dict = export_state_to_dict(exploration_id, state_id)

    state_dict['unresolved_answers'] = (
        stats_services.get_unresolved_answers_for_default_rule(
            exploration_id, state_id))

    # TODO(sll): Fix the frontend and remove this line.
    state_dict['widget']['id'] = state_dict['widget']['widget_id']

    exploration = exp_domain.Exploration.get(exploration_id)
    state = exploration.get_state_by_id(state_id)

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

    html = ''
    widget_array = []
    widget_counter = 0
    for content in content_array:
        if content.type in ['text', 'image', 'video']:
            value = (utils.parse_with_jinja(content.value, params)
                     if content.type == 'text' else content.value)

            html += feconf.OPPIA_JINJA_ENV.get_template(
                'reader/content.html').render({
                    'type': content.type, 'value': value})
        elif content.type == 'widget':
            # Ignore empty widget specifications.
            if not content.value:
                continue

            widget_dict = json.loads(content.value)
            widget = widget_domain.Registry.get_widget_by_id(
                feconf.NONINTERACTIVE_PREFIX, widget_dict['id'])
            html += feconf.OPPIA_JINJA_ENV.get_template(
                'reader/content.html').render({
                    'blockIndex': block_number,
                    'index': widget_counter,
                    'type': content.type,
                })
            widget_array.append({
                'blockIndex': block_number,
                'index': widget_counter,
                'raw': widget.get_with_params(widget_dict['params'])['raw'],
            })
            widget_counter += 1
        else:
            raise utils.InvalidInputException(
                'Invalid content type %s', content.type)
    return html, widget_array


def export_to_yaml(exploration_id):
    """Returns a YAML version of the exploration."""
    exploration = exp_domain.Exploration.get(exploration_id)

    params = [{
        'name': param.name, 'obj_type': param.obj_type, 'values': param.values
    } for param in exploration.parameters]

    states_list = [export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=True)
        for state_id in exploration.state_ids]

    return utils.yaml_from_dict({
        'parameters': params, 'states': states_list
    })

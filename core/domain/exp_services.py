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
from core.domain import stats_domain
from core.domain import widget_registry
from core.platform import models
import feconf
import jinja_utils
current_user_services = models.Registry.import_current_user_services()
memcache_services = models.Registry.import_memcache_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
import utils


# TODO(sll): Unify this with the SUBMIT_HANDLER_NAMEs in other files.
SUBMIT_HANDLER_NAME = 'submit'
ADMIN_COMMITTER_ID = 'admin'
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
def get_unresolved_answers_for_default_rule(exploration_id, state_name):
    """Gets the tally of unresolved answers that hit the default rule."""
    # TODO(sll): Add similar functionality for other rules? But then we have
    # to figure out what happens when those rules are edited/deleted.
    # TODO(sll): Should this return just the top N answers instead?
    return stats_domain.StateRuleAnswerLog.get(
        exploration_id, state_name, SUBMIT_HANDLER_NAME,
        exp_domain.DEFAULT_RULESPEC_STR).answers


def export_state_to_verbose_dict(exploration_id, state_name):
    """Gets a state dict with rule descriptions and unresolved answers."""
    exploration = get_exploration_by_id(exploration_id)

    state_dict = exploration.states[state_name].to_dict()

    state_dict['unresolved_answers'] = get_unresolved_answers_for_default_rule(
        exploration_id, state_name)

    # TODO(sll): Fix the frontend and remove this line.
    state_dict['widget']['id'] = state_dict['widget']['widget_id']

    for handler in state_dict['widget']['handlers']:
        for rule_spec in handler['rule_specs']:

            widget = widget_registry.Registry.get_widget_by_id(
                feconf.INTERACTIVE_PREFIX,
                state_dict['widget']['widget_id']
            )

            input_type = widget.get_handler_by_name(handler['name']).input_type

            rule_spec['description'] = rule_domain.get_rule_description(
                rule_spec['definition'], exploration.param_specs, input_type
            )

    return state_dict


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
def save_exploration(committer_id, exploration, commit_message=''):
    """Commits an exploration domain object to persistent storage."""
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

    version_snapshot = feconf.NULL_SNAPSHOT
    if rights_manager.is_exploration_public(exploration.id):
        version_snapshot = export_to_versionable_dict(exploration)
    exploration_model.put(
        committer_id, properties_dict, version_snapshot, commit_message)

    exploration_memcache_key = _get_exploration_memcache_key(
        exploration.id)
    memcache_services.delete(exploration_memcache_key)


def create_new(
    user_id, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME, cloned_from=None):
    """Creates and saves a new exploration; returns its id."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = (exploration_id or
                      exp_models.ExplorationModel.get_new_id(title))

    init_state = exp_domain.State.create_default_state(init_state_name)

    exploration_model = exp_models.ExplorationModel(
        id=exploration_id, title=title, category=category,
        init_state_name=init_state_name,
        states={
            init_state_name: init_state.to_dict()
        }
    )

    exp_domain.Exploration(exploration_model).validate()

    exploration_model.put(user_id, {})

    exploration_rights = rights_manager.ExplorationRights(
        exploration_id, [user_id], [], [], cloned_from=cloned_from)
    rights_manager.save_exploration_rights(exploration_rights)

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
    if force_deletion:
        exploration_model.delete()
    else:
        exploration_model.put(committer_id, {'deleted': True})

    for snapshot in exp_models.ExplorationSnapshotModel.get_all():
        if snapshot.exploration_id == exploration_id:
            if force_deletion:
                snapshot.delete()
            else:
                snapshot.deleted = True
                snapshot.put()

    for snapshot in exp_models.ExplorationSnapshotContentModel.get_all():
        if snapshot.exploration_id == exploration_id:
            if force_deletion:
                snapshot.delete()
            else:
                snapshot.deleted = True
                snapshot.put()


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
        following keys: committer_id, commit_message, created_on,
        version_number. The version numbers are consecutive and in descending
        order. There are max(limit, exploration.version_number) items in the
        returned list.
    """
    exploration = get_exploration_by_id(exploration_id)
    oldest_version = max(exploration.version - limit, 0) + 1
    current_version = exploration.version
    version_nums = range(current_version, oldest_version - 1, -1)

    snapshots_metadata = [exp_models.ExplorationSnapshotModel.get_metadata(
        exploration_id, version_num
    ) for version_num in version_nums]
    return snapshots_metadata


# Operations on states belonging to an exploration.
def _update_state(exploration, state_name,
                  param_changes, widget_id, widget_customization_args,
                  widget_handlers, widget_sticky, content):
    """Updates the given state in the exploration and returns the exploration.

    Does not commit changes.

    Args:
    - exploration_id: str. The exploration domain object.
    - state_name: str. The name of the state being updated.
    - param_changes: list of dicts with keys ('name', 'generator_id',
        'customization_args'), or None. If present, represents parameter
        changes that should be applied when a reader enters the state.
    - widget_id: str or None. If present, the id of the interactive widget for
        this state.
    - widget_customization_args: dict or None. If present, the
        customization_args used to render the interactive widget for this
        state.
    - widget_handlers: dict or None. If present, it represents the handler and
        rule specifications for this state.
    - widget_sticky: bool or None. If present, the setting for whether the
        interactive widget for this state should be preserved when the reader
        navigates to another state that uses the same interactive widget. For
        example, we might want a textarea containing user-entered code to
        retain that code in a state transition, rather than being overwritten
        with a brand-new textarea.
    - content: None, or a list of dicts, where each dict has keys ('type',
        'value'). Currently we expect this list to have exactly one element
        with type 'text'. If present, this list represents the non-interactive
        content for the state.
    """
    # TODO(sll): Add more documentation for widget_handlers, above.

    state = exploration.states[state_name]

    if param_changes:
        state.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_changes]

    if widget_id:
        state.widget.widget_id = widget_id

    if widget_customization_args is not None:
        state.widget.customization_args = widget_customization_args

    if widget_sticky is not None:
        state.widget.sticky = widget_sticky

    if widget_handlers:
        if not isinstance(widget_handlers, dict):
            raise Exception(
                'Expected widget_handlers to be a dictionary, received %s'
                % widget_handlers)
        ruleset = widget_handlers['submit']
        if not isinstance(ruleset, list):
            raise Exception(
                'Expected widget_handlers[submit] to be a list, received %s'
                % ruleset)
        utils.recursively_remove_key(ruleset, u'$$hashKey')

        state.widget.handlers = [
            exp_domain.AnswerHandlerInstance('submit', [])]

        generic_widget = widget_registry.Registry.get_widget_by_id(
            'interactive', state.widget.widget_id)

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for rule_ind in range(len(ruleset)):
            rule = ruleset[rule_ind]

            state_rule = exp_domain.RuleSpec(
                rule.get('definition'), rule.get('dest'),
                [html_cleaner.clean(feedback)
                 for feedback in rule.get('feedback')],
                rule.get('param_changes'))

            if rule['description'] == feconf.DEFAULT_RULE_NAME:
                if rule_ind != len(ruleset) - 1:
                    raise ValueError(
                        'Invalid ruleset: rules other than the '
                        'last one should not be default rules.')
                if (rule['definition']['rule_type'] !=
                        rule_domain.DEFAULT_RULE_TYPE):
                    raise ValueError(
                        'For a default rule the rule_type should be %s not %s'
                        % rule_domain.DEFAULT_RULE_TYPE
                        % rule['definition']['rule_type'])
            else:
                if rule_ind == len(ruleset) - 1:
                    raise ValueError(
                        'Invalid ruleset: the last rule should be a default '
                        'rule')
                if (rule['definition']['rule_type'] ==
                        rule_domain.DEFAULT_RULE_TYPE):
                    raise ValueError(
                        'For a non-default rule the rule_type should not be %s'
                        % rule_domain.DEFAULT_RULE_TYPE)

                # TODO(sll): Generalize this to Boolean combinations of rules.
                matched_rule = generic_widget.get_rule_by_name(
                    'submit', state_rule.definition['name'])

                # Normalize and store the rule params.
                # TODO(sll): Generalize this to Boolean combinations of rules.
                rule_inputs = state_rule.definition['inputs']
                if not isinstance(rule_inputs, dict):
                    raise Exception(
                        'Expected rule_inputs to be a dict, received %s'
                        % rule_inputs)
                for param_name, value in rule_inputs.iteritems():
                    param_type = rule_domain.get_obj_type_for_param_name(
                        matched_rule, param_name)

                    if (isinstance(value, basestring) and
                            '{{' in value and '}}' in value):
                        # TODO(jacobdavis11): Create checks that all parameters
                        # referred to exist and have the correct types
                        normalized_param = value
                    else:
                        try:
                            normalized_param = param_type.normalize(value)
                        except TypeError:
                            raise Exception(
                                '%s has the wrong type. '
                                'Please replace it with a %s.' %
                                (value, param_type.__name__))
                    rule_inputs[param_name] = normalized_param

            state.widget.handlers[0].rule_specs.append(state_rule)

    if content:
        # TODO(sll): Must sanitize all content in noninteractive widget attrs.
        state.content = [exp_domain.Content.from_dict(content[0])]

    return exploration


def update_exploration(
        committer_id, exploration_id, title, category, param_specs,
        param_changes, states, commit_message):
    """Update an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    - title: str or None. The title of the exploration.
    - category: str or None. The category for this exploration in the gallery.
    - param_specs: dict or None. If the former, a dict specifying the types of
        parameters used in this exploration. The keys of the dict are the
        parameter names, and the values are their object types.
    - param_changes: list or None. If the former, a list of dicts, each
        representing a parameter change.
    - states: dict or None. If the former, a dict of states, keyed by the state
        id, whose values are dicts containing new values for the fields of the
        state. See the documentation of _update_state() for more information
        on how these fields are defined.
    - commit_message: str or None. A description of changes made to the state.
        For published explorations, this must be present; for unpublished
        explorations, it should be equal to None.
    """
    # TODO(sll): Add tests to ensure that the parameters are of the correct
    # types, etc.
    exploration = get_exploration_by_id(exploration_id)
    is_public = rights_manager.is_exploration_public(exploration_id)

    if is_public and commit_message is None:
        raise ValueError(
            'Exploration is public so expected a commit message but '
            'received none.')
    if not is_public and commit_message is not None:
        raise ValueError(
            'Exploration is unpublished so expected no commit message, but '
            'received %s' % commit_message)

    if category:
        exploration.category = category
    if title:
        exploration.title = title
    if param_specs is not None:
        exploration.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in param_specs.iteritems()
        }
    if param_changes is not None:
        exploration.param_changes = [
            param_domain.ParamChange.from_dict(param_change)
            for param_change in param_changes
        ]

    if states:
        for (state_name, state_data) in states.iteritems():
            param_changes = state_data.get('param_changes')
            widget_id = state_data.get('widget_id')
            widget_customization_args = state_data.get(
                'widget_customization_args')
            widget_handlers = state_data.get('widget_handlers')
            widget_sticky = state_data.get('widget_sticky')
            content = state_data.get('content')

            if state_name not in exploration.states:
                exploration.add_states([state_name])

            exploration = _update_state(
                exploration, state_name, param_changes, widget_id,
                widget_customization_args, widget_handlers, widget_sticky,
                content
            )

            if 'state_name' in state_data:
                # Rename this state.
                exploration.rename_state(state_name, state_data['state_name'])

    save_exploration(committer_id, exploration, commit_message)


def delete_state(committer_id, exploration_id, state_name):
    """Deletes the given state. Commits changes."""
    exploration = get_exploration_by_id(exploration_id)
    if state_name not in exploration.states:
        raise ValueError('Invalid state name %s for exploration %s' %
                         (state_name, exploration.id))

    # Do not allow deletion of initial states.
    if exploration.init_state_name == state_name:
        raise ValueError('Cannot delete initial state of an exploration.')

    # Find all destinations in the exploration which equal the deleted
    # state, and change them to loop back to their containing state.
    for other_state_name in exploration.states:
        other_state = exploration.states[other_state_name]
        for handler in other_state.widget.handlers:
            for rule in handler.rule_specs:
                if rule.dest == state_name:
                    rule.dest = other_state_name

    # Delete the state with name state_name.
    del exploration.states[state_name]

    exploration_memcache_key = _get_exploration_memcache_key(
        exploration_id)
    memcache_services.delete(exploration_memcache_key)
    save_exploration(
        committer_id, exploration, 'Deleted state: %s' % state_name)


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
def convert_v1_dict_to_v2_dict(exploration_dict):
    """Converts a v1 exploration dict into a v2 exploration dict."""
    exploration_dict['schema_version'] = 2
    exploration_dict['init_state_name'] = exploration_dict['states'][0]['name']

    states_dict = {}
    for state in exploration_dict['states']:
        states_dict[state['name']] = state
        del states_dict[state['name']]['name']
    exploration_dict['states'] = states_dict

    return exploration_dict


def create_from_yaml(
        yaml_content, user_id, title, category, exploration_id=None,
        cloned_from=None):
    """Creates an exploration from a YAML text string."""
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
        new_fs.put(filepath, file_content)

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
        # This exploration does not exist, so it cannot be deleted.
        logging.info('Exploration with id %s was not deleted, because it '
                     'does not exist.' % exploration_id)
    else:
        delete_exploration(
            ADMIN_COMMITTER_ID, exploration_id, force_deletion=True)


def load_demo(exploration_id):
    """Loads a demo exploration."""
    # TODO(sll): Speed this method up. It is too slow.
    delete_demo(exploration_id)

    if not (0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS)):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration = feconf.DEMO_EXPLORATIONS[int(exploration_id)]

    if len(exploration) == 3:
        (exp_filename, title, category) = exploration
    else:
        raise Exception('Invalid demo exploration: %s' % exploration)

    yaml_content, assets_list = get_demo_exploration_components(exp_filename)
    exploration_id = create_from_yaml(
        yaml_content, ADMIN_COMMITTER_ID, title, category,
        exploration_id=exploration_id)

    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        fs.put(asset_filename, asset_content)

    exploration = get_exploration_by_id(exploration_id)
    save_exploration(ADMIN_COMMITTER_ID, exploration)

    rights_manager.publish_exploration(ADMIN_COMMITTER_ID, exploration_id)

    logging.info('Exploration with id %s was loaded.' % exploration_id)

# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Controllers for the Oppia editor view."""

__author__ = 'sll@google.com (Sean Lip)'

import feconf
from oppia.apps.exploration import exp_domain
from oppia.apps.exploration import exp_services
import oppia.apps.parameter.models as param_models
from oppia.apps.rule import rule_domain
import oppia.apps.state.models as state_models
from oppia.apps.statistics import stats_services
from oppia.apps.widget import widget_domain
from oppia.controllers import base
import utils

EDITOR_MODE = 'editor'


def get_state_for_frontend(state, exploration):
    """Returns a representation of the given state for the frontend."""

    state_repr = exp_services.export_state_to_dict(exploration.id, state.id)
    modified_state_dict = exp_services.export_state_internals_to_dict(
        exploration.id, state.id, human_readable_dests=True)

    # TODO(sll): The following is for backwards-compatibility and should be
    # deleted later.
    rules = {}
    for handler in state_repr['widget']['handlers']:
        rules[handler['name']] = handler['rules']
        for item in rules[handler['name']]:
            if item['name'] == 'Default':
                item['rule'] = 'Default'
            else:
                # Get the human-readable name for a rule.
                item['rule'] = widget_domain.Registry.get_widget_by_id(
                    feconf.INTERACTIVE_PREFIX, state.widget.widget_id
                ).get_rule_description(handler['name'], item['name'])

    state_repr['widget']['rules'] = rules
    state_repr['widget']['id'] = state_repr['widget']['widget_id']

    state_repr['yaml'] = utils.yaml_from_dict(modified_state_dict)

    state_repr['unresolved_answers'] = stats_services.get_unresolved_answers(
        exploration.id, state.id)
    return state_repr


def get_exploration_stats(exploration):
    """Returns a dict with stats for the given exploration."""

    num_visits = stats_services.get_exploration_stats(
        stats_services.STATS_ENUMS.exploration_visited, exploration.id)

    num_completions = stats_services.get_exploration_stats(
        stats_services.STATS_ENUMS.exploration_completed, exploration.id)

    answers = stats_services.get_exploration_stats(
        stats_services.STATS_ENUMS.rule_hit, exploration.id)

    state_counts = stats_services.get_exploration_stats(
        stats_services.STATS_ENUMS.state_hit, exploration.id)

    state_stats = {}
    for state_id in answers.keys():
        state_stats[state_id] = {
            'name': answers[state_id]['name'],
            'count': state_counts[state_id]['count'],
            'rule_stats': {},
        }
        all_rule_count = 0
        state_count = state_counts[state_id]['count']
        for rule in answers[state_id]['rules'].keys():
            state_stats[state_id]['rule_stats'][rule] = (
                answers[state_id]['rules'][rule])
            rule_count = 0
            for _, count in answers[state_id]['rules'][rule]['answers']:
                rule_count += count
                all_rule_count += count
            state_stats[state_id]['rule_stats'][rule]['chartData'] = [
                ['', 'This rule', 'Other answers'],
                ['', rule_count, state_count - rule_count]]
        state_stats[state_id]['no_answer_chartdata'] = [
            ['', 'No answer', 'Answer given'],
            ['',  state_count - all_rule_count, all_rule_count]]

    return {
        'num_visits': num_visits,
        'num_completions': num_completions,
        'state_stats': state_stats,
    }


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    @base.require_user
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        yaml_content = self.request.get('yaml')

        if yaml_content and feconf.ALLOW_YAML_FILE_UPLOAD:
            exploration_id = exp_services.create_from_yaml(
                yaml_content, self.user_id, title, category)
        else:
            exploration_id = exp_services.create_new(
                self.user_id, title=title, category=category)

        self.render_json({'explorationId': exploration_id})


class ForkExploration(base.BaseHandler):
    """Forks an existing exploration."""

    @base.require_user
    def post(self):
        """Handles POST requests."""

        exploration_id = self.payload.get('exploration_id')

        forked_exploration = exp_domain.Exploration.get(exploration_id)
        if not forked_exploration.is_demo:
            raise self.InvalidInputException('Exploration cannot be forked.')

        # Get the demo exploration as a YAML file, so that new states can be
        # created.
        yaml_content = exp_services.export_to_yaml(forked_exploration.id)
        title = 'Copy of %s' % forked_exploration.title
        category = forked_exploration.category

        new_exploration_id = exp_services.create_from_yaml(
            yaml_content, self.user_id, title, category)

        self.render_json({'explorationId': new_exploration_id})


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    @base.require_editor
    def get(self, unused_exploration):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': EDITOR_MODE,
        })
        self.render_template('editor/editor_exploration.html')


class ExplorationHandler(base.BaseHandler):
    """Page with editor data for a single exploration."""

    @base.require_editor
    def get(self, exploration):
        """Gets the question name and state list for a question page."""

        state_list = {}
        for state_id in exploration.state_ids:
            state = exploration.get_state_by_id(state_id)
            state_list[state.id] = get_state_for_frontend(state, exploration)

        parameters = []
        for param in exploration.parameters:
            parameters.append({
                'name': param.name, 'obj_type': param.obj_type,
                'description': param.description, 'values': param.values
            })

        self.values.update({
            'exploration_id': exploration.id,
            'init_state_id': exploration.init_state_id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'editors': exploration.editor_ids,
            'states': state_list,
            'parameters': parameters,
        })

        statistics = get_exploration_stats(exploration)
        self.values.update({
            'num_visits': statistics['num_visits'],
            'num_completions': statistics['num_completions'],
            'state_stats': statistics['state_stats'],
        })
        improvements = stats_services.get_top_ten_improvable_states(
            [exploration])
        self.values.update({
            'imp': improvements,
        })
        self.render_json(self.values)

    @base.require_editor
    def post(self, exploration):
        """Adds a new state to the given exploration."""

        state_name = self.payload.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        state = exploration.add_state(state_name)
        self.render_json(
            exp_services.export_state_to_dict(exploration.id, state.id))

    @base.require_editor
    def put(self, exploration):
        """Updates properties of the given exploration."""

        is_public = self.payload.get('is_public')
        category = self.payload.get('category')
        title = self.payload.get('title')
        image_id = self.payload.get('image_id')
        editors = self.payload.get('editors')
        parameters = self.payload.get('parameters')

        if is_public:
            exploration.is_public = True
        if category:
            exploration.category = category
        if title:
            exploration.title = title
        if 'image_id' in self.payload:
            exploration.image_id = None if image_id == 'null' else image_id
        if editors:
            if (exploration.editor_ids and
                    self.user_id == exploration.editor_ids[0]):
                exploration.editor_ids = []
                for email in editors:
                    exploration.add_editor(email)
            else:
                raise self.UnauthorizedUserException(
                    'Only the exploration owner can add new collaborators.')
        if parameters:
            exploration.parameters = [
                param_models.Parameter(
                    name=item['name'], obj_type=item['obj_type'],
                    description=item['description'], values=item['values']
                ) for item in parameters
            ]

        exploration.put()

    @base.require_editor
    def delete(self, exploration):
        """Deletes the given exploration."""
        exploration.delete()


class ExplorationDownloadHandler(base.BaseHandler):
    """Downloads an exploration as a YAML file."""

    @base.require_editor
    def get(self, exploration):
        """Handles GET requests."""
        filename = 'oppia-%s' % utils.to_ascii(exploration.title)
        if not filename:
            filename = feconf.DEFAULT_FILE_NAME

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.txt' % filename)

        self.response.write(exp_services.export_to_yaml(exploration.id))


class StateHandler(base.BaseHandler):
    """Handles state transactions."""

    @base.require_editor
    def put(self, exploration, state):
        """Saves updates to a state."""

        yaml_file = self.payload.get('yaml_file')
        if yaml_file and feconf.ALLOW_YAML_FILE_UPLOAD:
            # The user has uploaded a YAML file. Process only this action.
            state = exp_services.modify_using_dict(
                exploration.id, state.id, utils.dict_from_yaml(yaml_file))
            self.render_json(get_state_for_frontend(state, exploration))
            return

        state_name = self.payload.get('state_name')
        param_changes = self.payload.get('param_changes')
        interactive_widget = self.payload.get('interactive_widget')
        interactive_params = self.payload.get('interactive_params')
        interactive_rulesets = self.payload.get('interactive_rulesets')
        sticky_interactive_widget = self.payload.get(
            'sticky_interactive_widget')
        content = self.payload.get('content')
        unresolved_answers = self.payload.get('unresolved_answers')

        if 'state_name' in self.payload:
            # Replace the state name with this one, after checking validity.
            if state_name == feconf.END_DEST:
                raise self.InvalidInputException('Invalid state name: END')
            exploration.rename_state(state.id, state_name)

        if 'param_changes' in self.payload:
            state.param_changes = []
            for param_change in param_changes:
                instance = exp_services.get_or_create_param(
                    exploration.id, param_change['name'])
                instance.values = param_change['values']
                state.param_changes.append(instance)

        if interactive_widget:
            state.widget.widget_id = interactive_widget

        if interactive_params:
            state.widget.params = interactive_params

        if sticky_interactive_widget is not None:
            state.widget.sticky = sticky_interactive_widget

        if interactive_rulesets:
            ruleset = interactive_rulesets['submit']
            utils.recursively_remove_key(ruleset, u'$$hashKey')

            state.widget.handlers = [state_models.AnswerHandlerInstance(
                name='submit', rule_specs=[])]

            generic_handler = widget_domain.Registry.get_widget_by_id(
                'interactive', state.widget.widget_id).get_handler_by_name(
                    'submit')

            # This is part of the state. The rules should be put into it.
            state_ruleset = state.widget.handlers[0].rule_specs

            # TODO(yanamal): Do additional calculations here to get the
            # parameter changes, if necessary.
            for rule_ind in range(len(ruleset)):
                rule = ruleset[rule_ind]

                state_rule = state_models.RuleSpec()
                state_rule.name = rule.get('name')
                state_rule.inputs = rule.get('inputs')
                state_rule.dest = rule.get('dest')
                state_rule.feedback = rule.get('feedback')

                # Generate the code to be executed.
                if rule['rule'] == 'Default':
                    # This is the default rule.
                    assert rule_ind == len(ruleset) - 1
                    state_rule.name = 'Default'
                    state_ruleset.append(state_rule)
                    continue

                matched_generic_rule = next(
                    r for r in generic_handler.rules
                    if r.__name__ == state_rule.name
                )

                # Normalize the params here, then store them.
                param_name_list = state_rule.inputs.keys()

                for index, param_name in enumerate(param_name_list):
                    param_type = rule_domain.get_obj_type_for_param_name(
                        matched_generic_rule, param_name)
                    value = state_rule.inputs[param_name]
                    if (not isinstance(value, basestring) or
                            '{{' not in value or '}}' not in value):
                        normalized_param = param_type.normalize(value)
                    else:
                        normalized_param = value

                    if normalized_param is None:
                        raise self.InvalidInputException(
                            '%s has the wrong type. Please replace it with a '
                            '%s.' % (value, param_type.__name__))

                    state_rule.inputs[param_name] = normalized_param

                state_ruleset.append(state_rule)

        if content:
            state.content = [
                state_models.Content(type=item['type'], value=item['value'])
                for item in content
            ]

        if 'unresolved_answers' in self.payload:
            stats_services.EventHandler.replace_unresolved_answers(
                exploration.id, state.id,
                {k: v for k, v in unresolved_answers.iteritems() if v > 0}
            )

        state.put()
        self.render_json(get_state_for_frontend(state, exploration))

    @base.require_editor
    def delete(self, exploration, state):
        """Deletes the state with id state_id."""
        exploration.delete_state(state.id)

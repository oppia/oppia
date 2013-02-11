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

import json, logging
from controllers.base import BaseHandler, require_editor, require_user
import feconf, models, utils

EDITOR_MODE = 'editor'
END_DEST = '-1'


def GetStateAsDict(state):
    """Gets a Python dict representation of a state."""
    category_list = state.classifier_categories
    return {
        'content': state.content,
        'input_type': {'name': state.input_view.get().name},
        'answers': [{
            category_list[i]: {
                'text': state.action_sets[i].get().text,
                'dest': (state.action_sets[i].get().dest.get().name
                         if state.action_sets[i].get().dest else 'END')
            }
        } for i in range(len(state.action_sets))],
    }


class NewExploration(BaseHandler):
    """Creates a new exploration."""

    @require_user
    def post(self, user):  # pylint: disable-msg=C6409
        """Handles POST requests."""

        title = self.request.get('title')
        category = self.request.get('category')
        yaml = self.request.get('yaml')
        if yaml:
            exploration = utils.CreateExplorationFromYaml(
                yaml=yaml, user=user, title=title, category=category)
        else:
            exploration = utils.CreateNewExploration(
                user, title=title, category=category)

        self.response.out.write(json.dumps({
                'explorationId': exploration.hash_id,
        }))


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(
                ['editorExploration', 'editorClassifiers', 'editorTree',
                 'editorGraph', 'guiEditor', 'yamlEditor']),
            'nav_mode': EDITOR_MODE,
        })
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/editor_exploration.html').render(self.values))

    @require_editor
    def post(self, user, exploration):  # pylint: disable-msg=C6409
        """Adds a new state to the given exploration."""

        state_name = self.request.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        # Check that the state_name has not been taken.
        if utils.CheckExistenceOfName(models.State, state_name, exploration):
            raise self.InvalidInputException(
                'Duplicate state name for exploration %s: %s' %
                (exploration.title, state_name))

        state = utils.CreateNewState(exploration, state_name)

        self.response.out.write(json.dumps({
            'classifier': state.input_view.get().classifier,
            'inputType': state.input_view.get().name,
            'stateId': state.hash_id,
            'stateName': state.name,
            'stateContent': state.content,
        }))

    @require_editor
    def put(self, user, exploration):  # pylint: disable-msg=C6409
        """Updates properties of the given exploration."""

        for key in self.request.arguments():
            if key not in ['is_public', 'category', 'title', 'image_id']:
                raise self.InvalidInputException(
                    '\'%s\' is not a valid editable property' % key)

        is_public = self.request.get('is_public')
        category = self.request.get('category')
        title = self.request.get('title')
        image_id = self.request.get('image_id')

        if is_public:
            exploration.is_public = True
        if category:
            exploration.category = category
        if title:
            exploration.title = title
        if 'image_id' in self.request.arguments():  # NB: image_id can be null
            exploration.image_id = image_id
        exploration.put()

    @require_editor
    def delete(self, user, exploration):
        """Deletes the given exploration."""

        for state_key in exploration.states:
            for action_set_key in state_key.get().action_sets:
                action_set_key.delete()
            state_key.delete()

        augmented_users = models.AugmentedUser.query().filter(
            models.AugmentedUser.editable_explorations == exploration.key)
        for augmented_user in augmented_users:
            augmented_user.editable_explorations.remove(exploration.key)
            augmented_user.put()

        exploration.key.delete()


class ExplorationHandler(BaseHandler):
    """Page with editor data for a single exploration."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Gets the question name and state list for a question page."""

        state_list = {}
        for state_key in exploration.states:
            state = state_key.get()
            state_destinations = []
            category_list = state.classifier_categories
            for i in range(len(category_list)):
                try:
                    action_set = state.action_sets[i].get()
                except IndexError:
                    logging.error('action_sets %s has no element at index %s',
                                  state.action_sets, i)
                    action_set = models.ActionSet(
                        category_index=i, dest=state.key)
                    action_set.put()
                    state.action_sets.append(action_set.key)
                state_destination_map = {'category': category_list[i]}
                if action_set.dest_exploration:
                    state_destination_map['dest'] = (
                        'q-%s' % action_set.dest_exploration.get().hash_id)
                elif action_set.dest:
                    state_destination_map['dest'] = action_set.dest.get().hash_id
                else:
                    state_destination_map['dest'] = END_DEST
                state_destinations.append(state_destination_map)
            state_list[state.hash_id] = {
                'desc': state.name, 'dests': state_destinations
            }

        self.data_values.update({
            'exploration_id': exploration.hash_id,
            'init_state_id': exploration.init_state.get().hash_id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'owner': str(exploration.owner),
            'nav_mode': EDITOR_MODE,
            'state_list': state_list,
        })
        self.response.out.write(json.dumps(self.data_values))


class ExplorationDownloadHandler(BaseHandler):
    """Downloads an exploration as a YAML file."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        filename = str('oppia-%s' % exploration.title)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.txt' % filename)
        # TODO(sll): Cache the YAML file.
        init_dict = {}
        exploration_dict = {}
        for state_key in exploration.states:
            state = state_key.get()
            if exploration.init_state.get().hash_id == state.hash_id:
                init_dict[state.name] = GetStateAsDict(state)
            else:
                exploration_dict[state.name] = GetStateAsDict(state)
        self.response.out.write(utils.GetYamlFromDict(init_dict))
        self.response.out.write(utils.GetYamlFromDict(exploration_dict))


class StatePage(BaseHandler):
    """Allows content creators to edit a state."""

    @require_editor
    def get(self, user, exploration, unused_state):  # pylint: disable-msg=C6409
        """Gets a page representing an exploration with a list of states."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(
                ['editorExploration', 'editorClassifiers', 'editorGraph',
                 'editorTree', 'guiEditor', 'yamlEditor']),
            'nav_mode': EDITOR_MODE,
        })
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/editor_exploration.html').render(self.values))

    @require_editor
    def post(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Returns the properties of a state when it is opened for editing."""

        values = {
            'actions': [],
            'classifier': state.input_view.get().classifier,
            'inputType': state.input_view.get().name,
            'stateId': state.hash_id,
            'stateName': state.name,
            'stateContent': state.content,
            'yaml': '',
        }

        # Retrieve the actions corresponding to this state.
        category_list = state.classifier_categories
        for i in range(len(category_list)):
            try:
                action_set = state.action_sets[i].get()
            except IndexError:
                action_set = models.ActionSet(category_index=i)
                action_set.put()
                state.action_sets.append(action_set.key)

            action = {'category': category_list[i], 'dest': '-1'}
            if action_set.text:
                action['text'] = action_set.text
            if action_set.dest_exploration:
                action['dest'] = (
                    'q-%s' % action_set.dest_exploration.get().hash_id)
            elif action_set.dest:
                action['dest'] = action_set.dest.get().hash_id
            values['actions'].append(action)

        values['yaml'] = utils.GetYamlFromDict(GetStateAsDict(state))
        values['interactive_widget'] = state.interactive_widget
        values['interactive_ruleset'] = state.interactive_ruleset
        values['interactive_params'] = state.interactive_params

        self.response.out.write(json.dumps(values))


class StateHandler(BaseHandler):
    """Handles state transactions."""

    @require_editor
    def put(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Saves updates to a state."""

        yaml_file = self.request.get('yaml_file')
        if yaml_file:
            # The user has uploaded a YAML file. Process only this action.
            dests_array = utils.ModifyStateUsingDict(
                exploration, state, utils.GetDictFromYaml(yaml_file))
            input_view = state.input_view.get()
            self.response.out.write(json.dumps({
                'classifier': input_view.classifier,
                'explorationId': exploration.hash_id,
                'inputType': input_view.name,
                'state': {'desc': state.name, 'dests': dests_array},
                'stateContent': state.content,
            }))
            return

        state_name = self.request.get('state_name')
        state_content_json = self.request.get('state_content')
        input_type = self.request.get('input_type')
        actions_json = self.request.get('actions')

        if state_name:
            # Replace the state name with this one, after checking validity.
            if state_name == 'END':
                raise self.InvalidInputException('Invalid state name: END')
            if (state_name != state.name and utils.CheckExistenceOfName(
                models.State, state_name, exploration)):
                raise self.InvalidInputException(
                    'Duplicate state name: %s', state_name)
            state.name = state_name
            state.put()

        if state_content_json:
            state_content = json.loads(state_content_json)
            state.content = [{'type': item['type'], 'value': item['value']}
                             for item in state_content]

        if input_type:
            input_view = models.InputView.gql(
                'WHERE name = :name', name=input_type).get()
            if input_view is None:
                raise self.InvalidInputException('Invalid input type: %s', input_type)
            state.input_view = input_view.key

        # TODO(sll): Check that 'actions' is properly formatted.
        if actions_json:
            actions = json.loads(actions_json)
            classifier_categories = [action['category'] for action in actions]

            input_view = state.input_view.get()
            if (input_view.classifier not in ['none', 'finite'] and
                classifier_categories[-1] != utils.DEFAULT_CATEGORY):
                raise utils.InvalidCategoryError(
                    'The last category in %s should be "%s".',
                    classifier_categories, utils.DEFAULT_CATEGORY)
            state.classifier_categories = classifier_categories

            # Retrieve the actions corresponding to this state.
            num_categories = len(state.classifier_categories)
            while len(state.action_sets) > num_categories:
                state.action_sets[-1].delete()
                state.action_sets = state.action_sets[:-1]
            for i in range(num_categories):
                try:
                    action_set = state.action_sets[i].get()
                except IndexError, e:
                    action_set = models.ActionSet(category_index=i)
                    action_set.put()
                    state.action_sets.append(action_set.key)
                # TODO(sll): If the user deletes a category, make sure that the action
                # set for it is deleted too.
                # Add each action to the action_set.
                if 'text' in actions[i]:
                    action_set.text = actions[i]['text']
                if 'dest' in actions[i]:
                    # Note that actions[i]['dest'] is a state's hash_id, or END_DEST
                    # if this is an END state, or 'q-[exploration_id]' if the destination is
                    # a different exploration.
                    if actions[i]['dest'] == END_DEST:
                        action_set.dest = None
                    elif str(actions[i]['dest']).startswith('q-'):
                        try:
                            dest_exploration = utils.GetEntity(
                                models.Exploration, actions[i]['dest'][2:])
                            action_set.dest_exploration = dest_exploration.key
                            action_set.dest = dest_exploration.init_state
                        except utils.EntityIdNotFoundError, e:
                            raise self.InvalidInputException(
                                'Destination exploration for state %s not found. Error: %s',
                                state.name, e)
                    else:
                        try:
                            dest_state = utils.GetEntity(
                                models.State, actions[i]['dest'])
                            action_set.dest_exploration = None
                            action_set.dest = dest_state.key
                        except utils.EntityIdNotFoundError, e:
                            raise self.InvalidInputException(
                                'Destination exploration for state %s not found. Error: %s',
                                state.name, e)
                action_set.put()

        state.put()

    @require_editor
    def delete(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Deletes the state with id state_id."""

        # Do not allow deletion of initial states.
        if exploration.init_state == state.key:
            raise self.InvalidInputException(
                'Cannot delete initial state of an exploration.')
            return

        # Find all action_sets whose dest is the state to be deleted, and change
        # their destinations to the END state.
        incoming_action_sets = models.ActionSet.query().filter(
            models.ActionSet.dest == state.key)
        for action_set in incoming_action_sets:
            # Find the incoming state.
            origin_state = models.State.query().filter(
                models.State.action_sets == action_set.key).get()
            action_set.dest = origin_state.key
            action_set.put()

        # Delete all action_sets corresponding to this state.
        for action_set in state.action_sets:
            action_set.delete()

        # Delete the state with id state_id.
        state.key.delete()
        exploration.states.remove(state.key)
        exploration.put()

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

import datetime, json, logging, os, yaml
import base, classifiers, feconf, main, models, reader, utils

from google.appengine.api import users
from google.appengine.ext import ndb

EDITOR_MODE = 'editor'
END_DEST = '-1'


class BaseHandler(base.BaseHandler):
  """Common methods for editor handlers."""

  def CheckAuth(self, user, exploration):
    """Checks if the user has credentials to access the given exploration.

    Args:
        user: the current user
        exploration: the exploration

    Returns:
        True, if the user has edit access to the given exploration; False otherwise.
    """
    return exploration.key in utils.GetAugmentedUser(user).editable_explorations

  def GetUserAndExploration(self, exploration_id):
    """Returns the user and exploration id if the user has the right credentials.

    Args:
        exploration_id: the id of the exploration

    Returns:
        The user and exploration instance, if the user is authorized to edit this
        exploration.

    Raises:
        self.NotLoggedInException: if there is no current user.
        self.UnauthorizedUserException: if the user exists but does not have the
            right credentials.
    """
    user = users.get_current_user()
    if not user:
      raise self.NotLoggedInException('Please log in.')

    exploration = utils.GetEntity(models.Exploration, exploration_id)
    if not self.CheckAuth(user, exploration):
      raise self.UnauthorizedUserException(
          'User %s does not have the credentials to edit this exploration.' % user)
    return user, exploration


class MainPage(BaseHandler):
  """The editor's main page, which displays a list of explorations that he/she can edit."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
      return
    augmented_user = utils.GetAugmentedUser(user)

    categories = {}
    for exploration_key in augmented_user.editable_explorations:
      exploration = exploration_key.get()
      category_name = exploration.metadata.get(
          'category', reader.DEFAULT_CATALOG_CATEGORY_NAME)
      if not categories.get(category_name):
        categories[category_name] = {'explorations': [exploration]}
      else:
        # TODO(sll): make the following 'exploration' more explicit
        categories[category_name]['explorations'].append(exploration)

    self.values.update({
        'categories': categories,
        'js': utils.GetJsFilesWithBase(['editorMain']),
        'mode': EDITOR_MODE,
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('editor/editor_main.html').render(self.values))


class NewExploration(BaseHandler):
  """Creates a new exploration."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
      return

    exploration = utils.CreateNewExploration(user)
    self.response.out.write(json.dumps({
        'explorationId': exploration.hash_id,
    }))


class ExplorationPage(BaseHandler):
  """Page describing a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user, exploration = self.GetUserAndExploration(exploration_id)

    self.values.update({
        'js': utils.GetJsFilesWithBase(
            ['editorExploration', 'editorClassifiers', 'editorGraph']),
        'mode': EDITOR_MODE,
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('editor/editor_exploration.html').render(self.values))

  def post(self, exploration_id):  # pylint: disable-msg=C6409
    """Adds a new state.

    Args:
      exploration_id: string representing the exploration id.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)

    exploration = utils.GetEntity(models.Exploration, exploration_id)
    state_name = self.request.get('state_name')
    if not state_name:
      raise self.InvalidInputException('Please specify a state name.')

    # Check that the state_name has not been taken.
    if utils.CheckExistenceOfName(models.State, state_name, exploration):
      raise self.InvalidInputException(
          'A state called %s already exists' % state_name)

    state = utils.CreateNewState(exploration, state_name)

    self.response.out.write(json.dumps({
        'classifier': state.input_view.get().classifier,
        'inputType': state.input_view.get().name,
        'stateId': state.hash_id,
        'stateName': state.name,
        'stateText': state.text,
    }))

  def put(self, exploration_id):  # pylint: disable-msg=C6409
    """Makes an exploration public.

    Args:
      exploration_id: string representing the exploration id.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)
    exploration.is_public = True
    exploration.put()


class ExplorationHandler(BaseHandler):
  """Page with editor data for a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Gets the question name and state list for a question page.

    Args:
      exploration_id: string representing the exploration id.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)

    state_list = {}
    for state_key in exploration.states:
      state = state_key.get()
      state_destinations = []
      category_list = classifiers.GetCategoryList(
          state.input_view.get().classifier, state.classifier_categories)
      for i in range(len(category_list)):
        try:
          action_set = state.action_sets[i].get()
        except IndexError:
          logging.error('action_sets %s has no element at index %s',
                        state.action_sets, i)
          action_set = models.ActionSet(category_index=i, dest=state.key)
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
      state_list[state.hash_id] = {'desc': state.name,
                                   'dests': state_destinations}

    DIR_PREFIX = 'classifier_editors/'
    self.data_values.update({
        'exploration_id': exploration.hash_id,
        'init_state_id': exploration.init_state.get().hash_id,
        'is_public': exploration.is_public,
        'js': utils.GetJsFilesWithBase(['editorExploration', 'editorGraph']),
        'metadata': exploration.metadata,
        'mode': EDITOR_MODE,
        'state_list': state_list,
        'finite_code': utils.GetFileContents('%s/finite.html' % DIR_PREFIX),
        'numeric_code': utils.GetFileContents('%s/numeric.html' % DIR_PREFIX),
        'set_code': utils.GetFileContents('%s/set.html' % DIR_PREFIX),
        'text_code': utils.GetFileContents('%s/text.html' % DIR_PREFIX),
    })
    self.response.out.write(json.dumps(self.data_values))

  def put(self, exploration_id):  # pylint: disable-msg=C6409
    """Updates the name of an exploration.

    Args:
      exploration_id: string representing the exploration id.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)

    exploration = utils.GetEntity(models.Exploration, exploration_id)
    exploration_name = self.request.get('exploration_name')
    if exploration_name:
      exploration.metadata['title'] = exploration_name
      exploration.put()


class StatePage(BaseHandler):
  """Allows content creators to edit a state."""

  def get(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Gets a generic page representing an exploration.

    Args:
      exploration_id: string representing the exploration id.
      state_id: string representing the state id (not used).

    Returns:
      a generic page that represents an exploration with a list of states.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)

    DIR_PREFIX = 'classifier_editors/'
    self.values.update({
        'js': utils.GetJsFilesWithBase(
            ['editorExploration', 'editorClassifiers', 'editorGraph']),
        'mode': EDITOR_MODE,
        'finite_code': utils.GetFileContents('%s/finite.html' % DIR_PREFIX),
        'numeric_code': utils.GetFileContents('%s/numeric.html' % DIR_PREFIX),
        'set_code': utils.GetFileContents('%s/set.html' % DIR_PREFIX),
        'text_code': utils.GetFileContents('%s/text.html' % DIR_PREFIX),
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('editor/editor_exploration.html').render(
            self.values))

  def post(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Called when a state is initialized for editing.

    Args:
      exploration_id: string representing the exploration id.
      state_id: string representing the state id.

    Returns:
      parameters describing properties of the state (its id, name, text,
      input_type and actions).
    """
    user, exploration = self.GetUserAndExploration(exploration_id)
    state = utils.GetEntity(models.State, state_id)
    values = {
        'actions': [],
        'classifier': state.input_view.get().classifier,
        'inputType': state.input_view.get().name,
        'stateId': state.hash_id,
        'stateName': state.name,
        'stateText': state.text,
        'yaml': '',
    }

    # Retrieve the actions corresponding to this state.
    category_list = classifiers.GetCategoryList(
        state.input_view.get().classifier, state.classifier_categories)
    for i in range(len(category_list)):
      try:
        action_set = state.action_sets[i].get()
      except IndexError:
        action_set = models.ActionSet(category_index=i)
        action_set.put()
        state.action_sets.append(action_set.key)
      # The default destination is the same state.
      action = {'category': category_list[i], 'dest': state.hash_id}
      if action_set.text:
        action['text'] = action_set.text
      if action_set.dest_exploration:
        action['dest'] = 'q-%s' % action_set.dest_exploration.get().hash_id
      elif action_set.dest:
        action['dest'] = action_set.dest.get().hash_id
      values['actions'].append(action)

    values['yaml'] = yaml.safe_dump({
        'content': [{text['type']: text['value']} for text in state.text],
        'input_type': {'name': state.input_view.get().name},
        'answers': [
            {category_list[i]:
                {'text': state.action_sets[i].get().text,
                 'dest': (state.action_sets[i].get().dest.get().name
                          if state.action_sets[i].get().dest else 'END')}
            }
            for i in range(len(state.action_sets))],
    }, default_flow_style=False)

    self.response.out.write(json.dumps(values))


class StateHandler(BaseHandler):
  """Handles state transactions."""

  def put(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Saves updates to a state."""
    user, exploration = self.GetUserAndExploration(exploration_id)
    state = utils.GetEntity(models.State, state_id)

    state_name = self.request.get('state_name')
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

    if self.request.get('state_text'):
      state_text = json.loads(self.request.get('state_text'))
      # Remove empty content.
      state.text = [item for item in state_text if item['value']]

    if self.request.get('input_type'):
      # TODO(sll): Check whether the given input_type is a valid one.
      state.input_view = models.InputView.gql(
          'WHERE name = :name', name=self.request.get('input_type')).get().key

    # TODO(sll): Check whether the editor has rights to make this change.
    # TODO(sll): Check that 'actions' is properly formatted.

    if self.request.get('actions'):
      actions = json.loads(self.request.get('actions'))
      classifier_categories = []
      input_view = state.input_view.get()
      if input_view.name != 'none':
        for action in actions:
          classifier_categories.append(action['category'])
      if (input_view.classifier != 'none' and
          input_view.classifier != 'finite'):
        if classifier_categories[-1] != utils.DEFAULT_CATEGORY:
          raise utils.InvalidCategoryError(
              'The last category in %s should be "%s".',
              str(classifier_categories), utils.DEFAULT_CATEGORY)
        classifier_categories.pop()
      state.classifier_categories = classifier_categories

      # Retrieve the actions corresponding to this state.
      num_categories = classifiers.GetNumCategories(
          state.input_view.get().classifier, state.classifier_categories)
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
              logging.error(
                  'Destination exploration for state %s not found. Error: %s',
                  state.name, e)
          else:
            try:
              dest_state = utils.GetEntity(
                  models.State, actions[i]['dest'])
              action_set.dest_exploration = None
              action_set.dest = dest_state.key
            except utils.EntityIdNotFoundError, e:
              logging.error(
                  'Destination exploration for state %s not found. Error: %s',
                  state.name, e)
        action_set.put()

    state.put()

  def delete(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Deletes the state with id state_id."""
    user, exploration = self.GetUserAndExploration(exploration_id)
    state = utils.GetEntity(models.State, state_id)

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


class Image(base.BaseHandler):
  """Handles image uploads and retrievals."""

  def get(self, image_id):  # pylint: disable-msg=C6409
    """Returns an image.

    Args:
      image_id: string representing the image id.

    Raises:
      utils.EntityIdNotFoundError, if an id is not supplied or no image with
      this id exists.
    """
    image = utils.GetEntity(models.Image, image_id)
    if image:
      # TODO(sll): Support other image types.
      self.response.headers['Content-Type'] = 'image/png'
      self.response.out.write(image.image)
    else:
      self.response.out.write('No image')

  def post(self):  # pylint: disable-msg=C6409
    """Saves an image uploaded by a content creator."""
    # TODO(sll): Check that the image is really an image.
    image = self.request.get('image')
    if image:
      image_hash_id = utils.GetNewId(models.Image, image)
      image_entity = models.Image(hash_id=image_hash_id, image=image)
      image_entity.put()
      self.response.out.write(json.dumps({'image_id': image_entity.hash_id}))
    else:
      raise self.InvalidInputException('No image supplied')
      return

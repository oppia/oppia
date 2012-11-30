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

"""Main package for the Oppia editor."""

__author__ = 'sll@google.com (Sean Lip)'

import datetime
import json
import logging
import os

import jinja2
import webapp2

import classifiers
import datamodels
import feconf
import utils

from google.appengine.api import users
from google.appengine.ext import ndb

jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR)))
END_DEST = '-1'


class BaseHandler(webapp2.RequestHandler):
  """Base class for all handlers in this file."""

  def error(self, code):  # pylint: disable-msg=C6409
    super(BaseHandler, self).error(code)
    self.response.out.write('Resource not found.')
    return

  def JsonError(self, error_message, code=406):
    """Used to handle error messages in JSON returns."""
    super(BaseHandler, self).error(code)
    logging.error('%s: %s', code, error_message)
    self.response.out.write(json.dumps({'error': str(error_message)}))
    return

  def InitializeStoryPage(self, story_id):
    [story] = utils.TryParsingUrlParameters(True, story_id)
    self.response.out.write(jinja_env.get_template('editor/story.html').render({
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('editorStory'),
        'logout_url': users.create_logout_url(self.request.uri),
        'mode': 'structure',
        'story': {'id': story.hash_id, 'name': story.name},
        'user': users.get_current_user(),
    }))

  def InitializeQuestionPage(self, story_id, chapter_id, question_id):
    """Assembles variables for the creation of a bare-bones question page."""
    [story, chapter, question] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id)
    dir_prefix = 'classifier_editors/'
    self.response.out.write(jinja_env.get_template('editor/question.html').render({
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFileWithClassifiers('editorQuestion'),
        'logout_url': users.create_logout_url(self.request.uri),
        'mode': 'qneditor',
        'story': {'id': story.hash_id, 'name': story.name},
        'finite_code': utils.GetFileContents('%s/finite.html' % dir_prefix),
        'numeric_code': utils.GetFileContents('%s/numeric.html' % dir_prefix),
        'set_code': utils.GetFileContents('%s/set.html' % dir_prefix),
        'text_code': utils.GetFileContents('%s/text.html' % dir_prefix),
    }))


class HomePage(BaseHandler):
  """The editor's home page, which displays a list of explorations that he can edit."""
  
  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
      return

    values = {
        'css': utils.GetCssFile('oppia'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('editorMain'),
        'logout_url': users.create_logout_url(self.request.uri),
        'user': user,
    }
    self.response.out.write(
        jinja_env.get_template('editor/editor_main.html').render(values))


class ExplorationPage(BaseHandler):
  """Page describing a single exploration."""
  
  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
      return

    values = {
        'css': utils.GetCssFile('oppia'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('editorExploration'),
        'logout_url': users.create_logout_url(self.request.uri),
        'user': user,
    }
    self.response.out.write(
        jinja_env.get_template('editor/editor_exploration.html').render(values))


class MainPage(BaseHandler):
  """Displays a page with a list of stories that content creators can edit."""

  def GetEditableStories(self, user):
    return datamodels.Story.query().filter(datamodels.Story.editors == user)

  def InitializeInputViews(self):
    """Loads pre-written input views into the Oppia datastore."""
    # TODO(sll): This is temporary code that automatically loads input views
    # into the datastore on startup. Remove it once the bulk upload described
    # below is implemented.
    input_view_list = [utils.input_views.none,
                       utils.input_views.multiple_choice,
                       utils.input_views.int,
                       utils.input_views.set,
                       utils.input_views.text]
    classifier_list = [classifiers.classifiers.none,
                       classifiers.classifiers.finite,
                       classifiers.classifiers.numeric,
                       classifiers.classifiers.set,
                       classifiers.classifiers.text]
    for i in range(len(input_view_list)):
      name = input_view_list[i]
      if not datamodels.InputView.gql('WHERE name = :name', name=name).get():
        input_view = datamodels.InputView(
            name=name, classifier=classifier_list[i],
            html=utils.GetFileContents('/input_views/%s.html' % name))
        input_view.put()

  def get(self):  # pylint: disable-msg=C6409
    """Displays a list of stories."""

    # TODO(sll): The following line loads the input views into the datastore.
    # This should be changed to some sort of bulk upload instead, since the
    # entry point for users may not always be the main page.
    self.InitializeInputViews()

    user = users.get_current_user()
    editable_stories = self.GetEditableStories(user)
    values = {
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('editorIndex'),
        'logout_url': users.create_logout_url(self.request.uri),
        'story_list': [(story.hash_id, story.name)
                       for story in editable_stories],
        'user': user,
    }
    self.response.out.write(jinja_env.get_template('editor/index.html').render(values))

  def post(self):  # pylint: disable-msg=C6409
    """Adds a new story."""
    user = users.get_current_user()
    story_name = self.request.get('story_name')
    if not story_name:
      logging.error('No story name supplied.')
      self.redirect('/editor/')
      return

    # Check that the story name has not been taken.
    if utils.CheckExistenceOfName(datamodels.Story, story_name):
      self.JsonError('A story called %s already exists' % story_name)
      return

    # TODO(sll): Use a transaction here to make sure that there is no race
    # condition.
    # TODO(sll): Use fake (temporary) keys instead, to get rid of the GetNewId
    # overhead. AppEngine should be able to create IDs faster.
    new_story = datamodels.Story(
        hash_id=utils.GetNewId(datamodels.Story, story_name),
        name=story_name, editors=[user])
    new_story.put()
    new_chapter = datamodels.Chapter(parent=new_story.key)
    new_chapter.put()
    new_group = datamodels.QuestionGroup(
        hash_id=utils.GetNewId(datamodels.QuestionGroup, 'new_group'),
        parent=new_chapter.key)
    new_group.put()

    new_story.chapters = [new_chapter.key]
    new_story.put()
    new_chapter.question_groups = [new_group.key]
    new_chapter.put()

    self.redirect('/editor/%s/structure' % new_story.hash_id)


class Image(BaseHandler):
  """Handles image uploads and retrievals."""

  def get(self, image_id):  # pylint: disable-msg=C6409
    """Returns an image.

    Args:
      image_id: string representing the image id.

    Raises:
      utils.EntityIdNotFoundError, if an id is not supplied or no image with
      this id exists.
    """
    image = utils.GetEntity(datamodels.Image, image_id)
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
      image_hash_id = utils.GetNewId(datamodels.Image, image)
      image_entity = datamodels.Image(hash_id=image_hash_id, image=image)
      image_entity.put()
      self.response.out.write(json.dumps({'image_id': image_entity.hash_id}))
    else:
      self.JsonError('No image supplied')
      return


class StoryPage(BaseHandler):
  """Displays a page allowing content creators to edit a story."""

  def get(self, story_id):  # pylint: disable-msg=C6409
    """Redirects a GET request to the first chapter of the story.

    Args:
      story_id: string representing the story id.
    """
    self.redirect('/editor/%s/structure/0' % story_id)

  def post(self, story_id):  # pylint: disable-msg=C6409
    """Adds a new chapter, question or question group, or changes the nav mode.

    Args:
      story_id: string representing the story id.

    Raises:
      utils.EntityIdNotFoundError, if no story with this story id exists.
    """
    [story] = utils.TryParsingUrlParameters(True, story_id)

    if 'story_navigation' in self.request.arguments():
      story.navigation = self.request.get('story_navigation')
      story.put()
      return

    # Handle the case where the user adds a chapter.
    # TODO(sll): Allow the user to delete a chapter.
    if 'chapter_number' not in self.request.arguments():
      new_chapter_name = self.request.get('chapter_name')
      if new_chapter_name:
        if utils.CheckExistenceOfName(
            datamodels.Chapter, new_chapter_name, story):
          self.JsonError('A chapter named %s already exists' % new_chapter_name)
        else:
          new_chapter = datamodels.Chapter(
              name=new_chapter_name, parent=story.key)
          new_chapter.put()
          new_group = datamodels.QuestionGroup(
              hash_id=utils.GetNewId(datamodels.QuestionGroup, 'new_group'),
              parent=new_chapter.key)
          new_group.put()
          new_chapter.question_groups = [new_group.key]
          new_chapter.put()
          story.chapters.append(new_chapter.key)
          story.put()
          self.response.out.write(json.dumps({
              'chapter_id': len(story.chapters) - 1,
              'chapter_name': new_chapter_name,
              'new_group_id': new_group.hash_id,
              'new_group_name': new_group.name}))
      else:
        self.JsonError('Please specify a chapter name.')
      return

    chapter_number = self.request.get('chapter_number')
    try:
      chapter_number = int(chapter_number)
    except ValueError:
      self.JsonError('Invalid chapter number %s' % chapter_number)
    # Otherwise, chapter_number is the index of the chapter being edited.
    if chapter_number < 0 or chapter_number >= len(story.chapters):
      self.JsonError('Invalid chapter number %s' % chapter_number)
      return

    chapter = story.chapters[chapter_number].get()
    question_group_name = self.request.get('question_group_name')
    if question_group_name:
      if utils.CheckExistenceOfName(
          datamodels.QuestionGroup, question_group_name, chapter):
        self.JsonError('A group called %s already exists' % question_group_name)
        return
      group_hash_id = utils.GetNewId(
          datamodels.QuestionGroup, question_group_name)
      new_question_group = datamodels.QuestionGroup(
          hash_id=group_hash_id, name=question_group_name, parent=chapter.key)
      new_question_group.put()
      chapter.question_groups.append(new_question_group.key)
      chapter.put()
      self.response.out.write(json.dumps({
          'question_group_id': group_hash_id,
          'question_group_name': question_group_name,
          'chapter_number': chapter_number}))
      return

    question_name = self.request.get('question_name')
    if question_name:
      if utils.CheckExistenceOfName(
          datamodels.Question, question_name, chapter):
        self.JsonError('A state called %s already exists' % question_name)
        return
      question_hash_id = utils.GetNewId(datamodels.Question, question_name)
      state_hash_id = utils.GetNewId(datamodels.State, 'Initial state')

      # Create a fake state key temporarily for initialization of the question.
      # TODO(sll): Do this in a transaction so it doesn't break other things.
      fake_state_key = ndb.Key(datamodels.State, state_hash_id)

      none_input_view = datamodels.InputView.gql(
          'WHERE name = :name', name='none').get()
      none_action_set = datamodels.ActionSet(category_index=0, dest=None)
      none_action_set.put()

      question = datamodels.Question(
          hash_id=question_hash_id, init_state=fake_state_key,
          name=question_name, question_group=None, parent=chapter.key)
      question.put()
      new_init_state = datamodels.State(
          hash_id=state_hash_id, input_view=none_input_view.key,
          parent=question.key, action_sets=[none_action_set.key])
      new_init_state.put()

      # Replace the fake key with its real counterpart.
      question.init_state = new_init_state.key
      question.states = [new_init_state.key]
      question.put()
      chapter.questions.append(question.key)
      chapter.put()
      self.response.out.write(json.dumps(
          {'question_id': question.hash_id, 'question_name': question.name,
           'chapter_number': chapter_number}))

    utils.Log('No transaction performed. Args: %s' % self.request.arguments())
    return

  def put(self, story_id):  # pylint: disable-msg=C6409
    """Adds additional editors to a story.

    Args:
      story_id: string representing the story id.

    Raises:
      utils.EntityIdNotFoundError, if no story with this story id exists.
    """
    [story] = utils.TryParsingUrlParameters(True, story_id)

    # TODO(sll): Fix registration here, so that if an email address outside the
    # system is entered, that user is notified and is prompted to register with
    # the system if necessary.
    new_editor_email = self.request.get('new_editor')
    readers = datamodels.Reader.query()
    new_user = None
    for reader in readers:
      if reader.reader.email() == new_editor_email:
        new_user = reader.reader
    if not new_user:
      utils.Log('New user %s created' % new_editor_email)
      new_user = users.User(email=new_editor_email)
    if new_user in story.editors:
      self.JsonError('User %s is already an editor of story "%s"' % (
          new_editor_email, story.name))
      return
    else:
      utils.Log('New user %s added to story %s' % (new_editor_email, story_id))
      story.editors.append(new_user)
      story.put()


class ChapterPage(BaseHandler):
  """Displays a page allowing content creators to edit a chapter."""

  def get(self, story_id, chapter_id=0):  # pylint: disable-msg=C6409
    """Handles an HTTP GET request, displaying an error page if necessary.

    Args:
      story_id: string representing the story id.
      chapter_id: the chapter index.

    Raises:
      utils.EntityIdNotFoundError, if the entity path is invalid.
    """
    self.InitializeStoryPage(story_id)


class ChapterHandler(BaseHandler):
  """Handles chapter operations."""

  def get(self, story_id, chapter_id):  # pylint: disable-msg=C6409
    """Gets the data for a story page with a particular default chapter.

    Args:
      story_id: string representing the story id.
      chapter_id: the chapter index.

    Returns:
      - the story name,
      - for each chapter: its name, question groups, the questions in these
        question groups, and the list of free (unallocated) questions.
    """
    [story] = utils.TryParsingUrlParameters(True, story_id)
    chapters = []
    for i in range(len(story.chapters)):
      chapter = story.chapters[i].get()
      question_groups = []
      for group_key in chapter.question_groups:
        group = group_key.get()
        questions_in_group = datamodels.Question.query(
            ancestor=chapter.key).filter(
                datamodels.Question.question_group == group.key)
        question_list = []
        for question in questions_in_group:
          question_list.append(
              {'id': question.hash_id, 'desc': question.name})
        group_values = {
            'id': group.hash_id, 'desc': group.name, 'prereqDate': '',
            'questions': question_list, 'prereqMetrics': group.prereq_metrics}
        if group.prereq_date:
          group_values['prereqDate'] = str(group.prereq_date)
        question_groups.append(group_values)
      free_questions = []
      for question_key in chapter.questions:
        question = question_key.get()
        if not question.question_group:
          free_questions.append(
              {'id': question.hash_id, 'desc': question.name})
      chapters.append({'desc': chapter.name,
                       'groups': question_groups,
                       'freeQuestions': free_questions})

    self.response.out.write(json.dumps({
        'chapters': chapters,
        'curr_chapter': int(chapter_id),
        'debug': feconf.DEBUG,
        'navigation': story.navigation,
        'story_name': story.name,
    }))

  def put(self, story_id, chapter_id):  # pylint: disable-msg=C6409
    """Updates the structure of a chapter.

    Args:
      story_id: string representing the story id.
      chapter_id: index of the chapter.

    Raises:
      utils.EntityIdNotFoundError, if no story with this story id exists.
    """
    [story, chapter] = utils.TryParsingUrlParameters(True, story_id, chapter_id)

    name = self.request.get('chapter_name')
    if name:
      chapter.name = name
      chapter.put()

    question_id = self.request.get('question_id')
    new_group_id = self.request.get('new_group_id')

    if question_id:
      question = datamodels.Question.query(ancestor=chapter.key).filter(
          datamodels.Question.hash_id == question_id).get()
      new_group = datamodels.QuestionGroup.query(ancestor=chapter.key).filter(
          datamodels.QuestionGroup.hash_id == new_group_id).get()
      question.question_group = new_group.key
      question.put()


class QuestionGroupHandler(BaseHandler):
  """Handles question group operations."""

  def put(self, story_id, chapter_id, group_id):  # pylint: disable-msg=C6409
    """Updates the name or prerequisites for a question group.

    Args:
      story_id: string representing the story id.
      chapter_id: index of the chapter.
      group_id: id of the group to be edited.

    Raises:
      utils.EntityIdNotFoundError, if the entity path is invalid.
    """
    [story, chapter] = utils.TryParsingUrlParameters(True, story_id, chapter_id)
    if not group_id:
      raise utils.EntityIdNotFoundError('No group id supplied.')
    group = datamodels.QuestionGroup.query(ancestor=chapter.key).filter(
        datamodels.QuestionGroup.hash_id == group_id).get()
    if not group:
      raise utils.EntityIdNotFoundError('Invalid group id %s' % group_id)

    name = self.request.get('group_name')
    if name:
      group.name = name
      group.put()

    prereq_metrics = self.request.get('prereq_metrics')
    if prereq_metrics:
      group.prereq_metrics = json.loads(prereq_metrics)
      group.put()

    prereq_date = self.request.get('prereq_date')
    logging.info(prereq_date)
    if prereq_date:
      date_str = json.loads(prereq_date)
      if date_str:
        group.prereq_date = datetime.date(
            int(date_str[0:4]), int(date_str[5:7]), int(date_str[8:10]))
        group.put()

  def delete(self, story_id, chapter_id, group_id):  # pylint: disable-msg=C6409
    """Deletes a question group.

    Args:
      story_id: string representing the story id.
      chapter_id: index of the chapter.
      group_id: id of the group to be deleted.

    Raises:
      utils.EntityIdNotFoundError, if the entity path is invalid.
    """
    [story, chapter] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id)
    if not group_id:
      raise utils.EntityIdNotFoundError('No group id supplied.')

    # Move all elements of that group to the free questions list, and delete the
    # group.
    group = datamodels.QuestionGroup.query(ancestor=chapter.key).filter(
        datamodels.QuestionGroup.hash_id == group_id).get()
    questions = datamodels.Question.query(ancestor=chapter.key).filter(
        datamodels.Question.question_group == group.key)
    for question in questions:
      question.question_group = None
      question.put()

    chapter.question_groups = [gr for gr in chapter.question_groups
                               if not gr == group.key]
    chapter.put()
    group.key.delete()


class QuestionPage(BaseHandler):
  """Displays a page allowing content creators to edit a question."""

  def get(self, story_id, chapter_id, question_id):  # pylint: disable-msg=C6409
    """Gets a generic page representing a question.

    Args:
      story_id: string representing the story id.
      chapter_id: index of the chapter.
      question_id: string representing the question id.

    Returns:
      a generic page that represents a question with a list of states.

    Raises:
      utils.EntityIdNotFoundError, if (story_id, chapter_id, question_id) is
      invalid.
    """
    self.InitializeQuestionPage(story_id, chapter_id, question_id)

  def post(self, story_id, chapter_id,  # pylint: disable-msg=C6409
           question_id):
    """Adds a new state.

    Args:
      story_id: string representing the story id.
      chapter_id: index of the chapter.
      question_id: string representing the question id.

    Raises:
      utils.EntityIdNotFoundError, if (story_id, chapter_id, question_id) is
      invalid.
    """
    [story, chapter, question] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id)
    state_name = self.request.get('state_name')
    if not state_name:
      self.JsonError('Please specify a state name.')
      return

    # Check that the state_name has not been taken.
    if utils.CheckExistenceOfName(datamodels.State, state_name, question):
      self.JsonError('A state called %s already exists' % state_name)
      return
    state_hash_id = utils.GetNewId(datamodels.State, state_name)
    none_input_view = datamodels.InputView.gql(
        'WHERE name = :name', name='none').get()
    none_action_set = datamodels.ActionSet(category_index=0)
    none_action_set.put()
    state = datamodels.State(
        name=state_name, hash_id=state_hash_id, input_view=none_input_view.key,
        action_sets=[none_action_set.key], parent=question.key)
    state.put()
    none_action_set.dest = state.key
    none_action_set.put()
    question.states.append(state.key)
    question.put()

    self.response.out.write(json.dumps({
        'classifier': state.input_view.get().classifier,
        'inputType': state.input_view.get().name,
        # The following actions correspond to input type: 'none' (the default).
        'optionalActions': [{'category': '', 'dest': state.hash_id}],
        'stateId': state.hash_id,
        'stateName': state.name,
        'stateText': state.text,
    }))


class QuestionHandler(BaseHandler):
  """Returns the JavaScript variables for a question page."""

  def get(self, story_id, chapter_id, question_id):  # pylint: disable-msg=C6409
    """Gets the story name, question name and state list for a question page.

    Args:
      story_id: string representing the story id.
      chapter_id: the index of the chapter.
      question_id: string representing the question id.

    Raises:
      utils.EntityIdNotFoundError, if (story_id, question_id) is invalid.
    """
    [story, chapter, question] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id)
    state_list = {}
    for state_key in question.states:
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
          action_set = datamodels.ActionSet(category_index=i, dest=state.key)
          action_set.put()
          state.action_sets.append(action_set.key)
        state_destination_map = {'category': category_list[i]}
        if action_set.dest_question:
          state_destination_map['dest'] = (
              'q-%s' % action_set.dest_question.get().hash_id)
        elif action_set.dest:
          state_destination_map['dest'] = action_set.dest.get().hash_id
        else:
          state_destination_map['dest'] = END_DEST
        state_destinations.append(state_destination_map)
      state_list[state.hash_id] = {'desc': state.name,
                                   'dests': state_destinations}

    question_list = {}
    for question_key in chapter.questions:
      question_in_list = question_key.get()
      question_list[question_in_list.hash_id] = {'desc': question_in_list.name}

    self.response.out.write(json.dumps({
        'debug': feconf.DEBUG,
        'init_state_id': question.init_state.get().hash_id,
        'question_list': question_list,
        'question_name': question.name,
        'state_list': state_list,
        'story_name': story.name,
    }))

  def put(self, story_id, chapter_id, question_id):  # pylint: disable-msg=C6409
    """Updates the name of a question.

    Args:
      story_id: string representing the story id.
      chapter_id: the index of the chapter.
      question_id: string representing the question id.

    Raises:
      utils.EntityIdNotFoundError, if (story_id, question_id) is invalid.
    """
    [story, chapter, question] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id)
    question_name = self.request.get('question_name')
    if question_name:
      # Check if the new name is already in use.
      if utils.CheckExistenceOfName(
          datamodels.Question, question_name, chapter):
        self.JsonError('Question name %s is already in use.' % question_name)
        return
      else:
        question.name = question_name
        question.put()


class StatePage(BaseHandler):
  """Allows content creators to edit a state."""

  def get(self, story_id, chapter_id, question_id,  # pylint: disable-msg=C6409
          state_id):
    """Gets a generic page representing a question.

    Args:
      story_id: string representing the story id.
      chapter_id: the index of the chapter.
      question_id: string representing the question id.
      state_id: string representing the state id (not used).

    Returns:
      a generic page that represents a question with a list of states.

    Raises:
      utils.EntityIdNotFoundError, if (story_id, chapter_id, question_id) is
      invalid.
    """
    self.InitializeQuestionPage(story_id, chapter_id, question_id)

  def post(self, story_id, chapter_id, question_id,  # pylint: disable-msg=C6409
           state_id):
    """Called when a state is initialized for editing.

    Args:
      story_id: string representing the story id.
      chapter_id: the index of the chapter.
      question_id: string representing the question id.
      state_id: string representing the state id.

    Returns:
      parameters describing properties of the state (its id, name, text,
      input_type and actions).

    Raises:
      utils.EntityIdNotFoundError, if (story_id, question_id, state_id) is
      invalid.
    """
    [story, chapter, question, state] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id, state_id)
    values = {
        'classifier': state.input_view.get().classifier,
        'inputType': state.input_view.get().name,
        'optionalActions': [],
        'stateId': state.hash_id,
        'stateName': state.name,
        'stateText': state.text,
    }

    # Retrieve the actions corresponding to this state.
    category_list = classifiers.GetCategoryList(
        state.input_view.get().classifier, state.classifier_categories)
    for i in range(len(category_list)):
      try:
        action_set = state.action_sets[i].get()
      except IndexError:
        action_set = datamodels.ActionSet(category_index=i)
        action_set.put()
        state.action_sets.append(action_set.key)
      # The default destination is the same state.
      action = {'category': category_list[i], 'dest': state.hash_id}
      if action_set.text:
        action['text'] = action_set.text
      action['metrics'] = action_set.metrics
      if action_set.dest_question:
        action['dest'] = 'q-%s' % action_set.dest_question.get().hash_id
      elif action_set.dest:
        action['dest'] = action_set.dest.get().hash_id
      values['optionalActions'].append(action)

    self.response.out.write(json.dumps(values))


class StateHandler(BaseHandler):
  """Handles state transactions."""

  def put(self, story_id, chapter_id, question_id,  # pylint: disable-msg=C6409
          state_id):
    """Saves updates to a state."""
    [story, chapter, question, state] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id, state_id)

    if self.request.get('state_name'):
      state_name = self.request.get('state_name')
      if state_name:
        # Check if the new name is already in use
        if datamodels.State.gql('WHERE name = :state_name',
                                state_name=state_name).get():
          self.JsonError('State name %s is already in use.' % state_name)
          return
        else:
          state.name = state_name

    if self.request.get('state_text'):
      state_text = json.loads(self.request.get('state_text'))
      # Remove empty content.
      state.text = [item for item in state_text if item['value']]

    if self.request.get('input_type'):
      # TODO(sll): Check whether the given input_type is a valid one.
      state.input_view = datamodels.InputView.gql(
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
          action_set = datamodels.ActionSet(category_index=i)
          action_set.put()
          state.action_sets.append(action_set.key)
        # TODO(sll): If the user deletes a category, make sure that the action
        # set for it is deleted too.
        # Add each action to the action_set.
        if 'text' in actions[i]:
          action_set.text = actions[i]['text']
        if 'metrics' in actions[i]:
          action_set.metrics = actions[i]['metrics']
        if 'dest' in actions[i]:
          # Note that actions[i]['dest'] is a state's hash_id, or END_DEST
          # if this is an END state, or 'q-[question_id]' if the destination is
          # a question.
          if actions[i]['dest'] == END_DEST:
            action_set.dest = None
          elif str(actions[i]['dest']).startswith('q-'):
            try:
              dest_question = utils.GetEntity(
                  datamodels.Question, actions[i]['dest'][2:])
              action_set.dest_question = dest_question.key
              action_set.dest = dest_question.init_state
            except utils.EntityIdNotFoundError, e:
              logging.error(
                  'Destination question for state %s not found. Error: %s',
                  state.name, e)
          else:
            try:
              dest_state = utils.GetEntity(
                  datamodels.State, actions[i]['dest'])
              action_set.dest_question = None
              action_set.dest = dest_state.key
            except utils.EntityIdNotFoundError, e:
              logging.error(
                  'Destination question for state %s not found. Error: %s',
                  state.name, e)
        action_set.put()

    state.put()

  def delete(self, story_id, chapter_id,  # pylint: disable-msg=C6409
             question_id, state_id):
    """Deletes the state with id state_id."""
    [story, chapter, question, state] = utils.TryParsingUrlParameters(
        True, story_id, chapter_id, question_id, state_id)

    # Do not allow deletion of initial states.
    if question.init_state == state.key:
      self.JsonError('Cannot delete initial state of a question.')
      return

    # Find all action_sets whose dest is the state to be deleted, and change
    # their destinations to the END state.
    incoming_action_sets = datamodels.ActionSet.query().filter(
        datamodels.ActionSet.dest == state.key)
    for action_set in incoming_action_sets:
      # Find the incoming state.
      origin_state = datamodels.State.query().filter(
          datamodels.State.action_sets == action_set.key).get()
      action_set.dest = origin_state.key
      action_set.put()

    # Delete all action_sets corresponding to this state.
    for action_set in state.action_sets:
      action_set.delete()

    # Delete the state with id state_id.
    state.key.delete()
    question.states.remove(state.key)
    question.put()

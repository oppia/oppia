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

"""Common utility functions."""

__author__ = 'sll@google.com (Sean Lip)'

import base64
import datetime
import hashlib
import logging
import os

import jinja2

import datamodels
import feconf

from google.appengine.api import users

jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR)))
DEFAULT_CATEGORY = 'All other inputs'


def Enum(*sequential, **names):
  enums = dict(zip(sequential, sequential), **names)
  return type('Enum', (), enums)


input_views = Enum('none', 'multiple_choice', 'int', 'set', 'text', 'finished')


class InvalidInputError(Exception):
  """Error class for when invalid input is entered into a classifier."""
  pass


class InvalidCategoryError(Exception):
  """Error class for when an invalid category is passed into a classifier."""
  pass


class InvalidParamError(Exception):
  """Error class for when an invalid parameter is passed into a classifier."""
  pass


class EntityIdNotFoundError(Exception):
  """Error class for when a story/question/state ID is not in the datastore."""
  pass


class InvalidStoryError(Exception):
  """Error class for when a story is not yet ready for viewing."""
  pass


def Log(message):
  """Logs info messages in development/debug mode.

  Args:
    message: the message to be logged.
  """

  if feconf.DEV or feconf.DEBUG:
    logging.info(str(message))


# TODO(sll): Consider refactoring this to include ancestors.
def GetEntity(entity, entity_id):
  """Gets the story, question or state corresponding to a given id.

  Args:
    entity: one of datamodels.Story, datamodels.QuestionGroup,
        datamodels.Question or datamodels.State
    entity_id: string representing the entity id.

  Returns:
    the entity corresponding to the input id

  Raises:
    EntityIdNotFoundError: If the entity_id is None, or cannot be found.
  """
  entity_type = entity.__name__.lower()
  if not entity_id:
    raise EntityIdNotFoundError('No %s id supplied' % entity_type)
  entity = entity.query().filter(entity.hash_id == entity_id).get()
  if not entity:
    raise EntityIdNotFoundError('%s id %s not found' % (entity_type, entity_id))
  return entity


def CheckExistenceOfName(entity, name, ancestor=None):
  """Checks whether an entity with the given name and ancestor already exists.

  Args:
    entity: one of datamodels.Story, datamodels.QuestionGroup,
        datamodels.Question or datamodels.State
    name: string representing the entity name.
    ancestor: the ancestor entity, if applicable.

  Returns:
    True if such an entity exists with the same name and ancestor, else False.

  Raises:
    EntityIdNotFoundError: If no entity name is supplied.
    KeyError: If a non-story entity is queried and no ancestor is supplied.
  """
  entity_type = entity.__name__.lower()
  if not name:
    raise EntityIdNotFoundError('No %s name supplied', entity_type)
  if ancestor:
    entity = entity.query(ancestor=ancestor.key).filter(
        entity.name == name).get()
  else:
    if entity != datamodels.Story:
      raise KeyError('Queries for non-story entities should include ancestors.')
    else:
      entity = entity.query().filter(entity.name == name).get()
  if not entity:
    return False
  return True


def CheckAuthorship(story):
  """Checks whether the current user has rights to edit this story.

  Args:
    story: a story.

  Raises:
    EntityIdNotFoundError: if the current user does not have editing rights to
        the given story.
  """
  user = users.get_current_user()
  if user not in story.editors:
    raise EntityIdNotFoundError('%s is not an editor of this story.' % user)


def TryParsingUrlParameters(auth, *args):
  """Returns the entities corresponding to the ids in an HTTP request.

  Args:
    auth: True if we need to check if the user has edit access, False if not.
    *args: A list of hash_ids. This is expected to be of the form [story],
           [story, chapter, question] or [story, chapter, question, state].

  Returns:
    the list of entities corresponding to these hash_ids.

  Raises:
    EntityIdNotFoundError:
      - If there are too many or too few arguments.
      - If any of the entities doesn't exist.
      - If the entities don't relate to each other (e.g. the state does not
        belong to the question).
      - If auth=True and the current user does not have editing permissions for
        the story.
  """
  if not args or len(args) > 4:
    raise EntityIdNotFoundError(
        'Path corresponding to %s does not exist' % args)

  logging.info(args)
  story = GetEntity(datamodels.Story, args[0])
  entities = [story]
  if len(args) > 1:
    chapter = story.chapters[int(args[1])].get()
    entities.append(chapter)
    if len(args) > 2:
      question = GetEntity(datamodels.Question, args[2])
      if question.key not in chapter.questions:
        raise EntityIdNotFoundError('Question does not belong to chapter.')
      entities.append(question)
      if len(args) > 3:
        state = GetEntity(datamodels.State, args[3])
        if state.key not in question.states:
          raise EntityIdNotFoundError('State does not belong to question.')
        entities.append(state)

  if auth:
    CheckAuthorship(story)

  return entities


def GetNewId(entity, entity_name):
  """Gets the id of a new story, question or state, based on its name.

  Args:
    entity: one of datamodels.Story, datamodels.Question or datamodels.State
    entity_name: string representing the name of the story, question or state

  Returns:
    string - the id representing the entity
  """
  new_id = base64.urlsafe_b64encode(hashlib.sha1(entity_name).digest())[:10]
  seed = 0
  while entity.query().filter(entity.hash_id == new_id).get():
    seed += 1
    new_id = base64.urlsafe_b64encode(
        hashlib.sha1('%s%s' % (entity_name, seed)).digest())[:10]
  return new_id


def GetFileContents(filepath):
  """Gets the contents of a file in the template directories.

  Args:
    filepath: a path to a HTML, JS or CSS file. It should not include the
        template/standard/head or template/output/standard prefix.

  Returns:
    the file contents.
  """
  file_contents = open(feconf.TEMPLATE_DIR + filepath, 'r')
  return file_contents.read().decode('utf-8')


def GetJsFile(filename):
  """Gets the contents of a JS file, including the base JS.

  Args:
    filename: the name of a JS file (without the '.js' suffix).

  Returns:
    the JS file contents.
  """
  return GetFileContents('js/base.js') + GetFileContents('js/%s.js' % filename)


def GetJsFileWithClassifiers(filename):
  """Gets the contents of a JS file, and append JS for the classifier editors.

  Args:
    filename: the name of a JS file (without the '.js' suffix).

  Returns:
    the JS file contents.
  """
  return GetJsFile(filename) + GetFileContents('js/editorClassifiers.js')


def GetCssFile(filename):
  """Gets the contents of a CSS file.

  Args:
    filename: The name of a CSS file (without the '.css' suffix).

  Returns:
    the CSS file contents.
  """
  return GetFileContents('css/%s.css' % filename)


def ParseContentIntoHtml(content_array, block_number):
  """Takes a content array and transforms it into HTML.

  Args:
    content_array: an array, each of whose members is a dict with two keys: type
        and value. The 'type' is one of the following:
          - 'text'; then the value is a text string
          - 'image'; then the value is an image ID
          - 'video'; then the value is a video ID
          - 'widget'; then the value is a widget ID
    block_number: the number of content blocks preceding this one.

  Returns:
    the HTML string representing the array, and the widget array containing JS
    and HTML for each widget.

  Raises:
    InvalidInputError: if content has no 'type' attribute, or an invalid 'type'
        attribute.
  """
  html = ''
  widget_array = []
  widget_counter = 0
  for content in content_array:
    if 'type' not in content:
      raise InvalidInputError(
          'Content type for content_array %s does not exist', content_array)
    if content['type'] == 'widget':
      widget = GetEntity(datamodels.Widget, content['value'])
      html += jinja_env.get_template('content.html').render({
          'type': content['type'], 'blockIndex': block_number,
          'index': widget_counter})
      widget_counter += 1
      widget_array.append({'js': widget.js, 'html': widget.html})
    elif (content['type'] in ['text', 'image', 'video']):
      html += jinja_env.get_template('content.html').render({
          'type': content['type'], 'value': content['value']})
    else:
      raise InvalidInputError('Invalid content type %s', content['type'])
  return html, widget_array


def CreateNewReader(user, story):
  """Creates and saves a new reader for the given user/story combination.

  Args:
    user: the person who is going to read the story
    story: the story to be read

  Returns:
    a new reader corresponding to this user/story combination.

  Raises:
    InvalidStoryError: if the story cannot be initialized.
  """
  init_chapter = story.chapters[0].get()
  if not init_chapter.question_groups:
    raise InvalidStoryError('This story is not ready for viewing. It has no '
                            'question groups defined yet.')
  init_question_group = init_chapter.question_groups[0].get()
  init_question = datamodels.Question.query(ancestor=init_chapter.key).filter(
      datamodels.Question.question_group == init_question_group.key).get()
  if not init_question:
    raise InvalidStoryError('This story is not ready for viewing. The initial '
                            'question group has no questions yet.')
  init_state = init_question.init_state.get()
  init_html, init_widgets = ParseContentIntoHtml(init_state.text, 0)
  init_page = datamodels.PageContent(html=[init_html], widgets=[init_widgets])
  init_page.put()

  new_reader = datamodels.Reader.query().filter(
      datamodels.Reader.reader == user).filter(
          datamodels.Reader.story == story.key).get()
  if not new_reader:
    new_reader = datamodels.Reader(
        reader=user, story=story.key, question=init_question.key,
        state=init_state.key, pages=[init_page.key])
  else:
    logging.info('Reader for %s | %s is being replaced', user, story.name)
    new_reader.question = init_question.key
    new_reader.state = init_state.key
    new_reader.pages = [init_page.key]

  new_reader.put()
  Log('New reader created.')
  return new_reader


def CheckPrereqs(prereq_date, prereq_metrics, reader_metrics):
  """Checks whether the prerequisites for an entity are satisfied.

  Args:
    prereq_date: the earliest date at which this entity can be seen.
    prereq_metrics: the minimum metrics qualification for this entity.
    reader_metrics: the reader's metrics.

  Returns:
    True if the prerequisites are satisfied; False otherwise.
  """
  if prereq_date and datetime.date.today() < prereq_date:
    return False
  logging.info(prereq_metrics)
  for (metric_key, metric_value) in prereq_metrics.iteritems():
    if not reader_metrics.get(metric_key) and metric_value > 0:
      return False
    elif reader_metrics[metric_key] < metric_value:
      return False
  return True

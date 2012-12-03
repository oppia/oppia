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

"""Main package for the reader-specific part of Oppia."""

__author__ = 'Sean Lip'

import json
import logging
import os

import jinja2
import webapp2

import base
import classifiers
import datamodels
import feconf
import models
import utils

from google.appengine.api import users
from google.appengine.ext import ndb

DEFAULT_CATALOG_CATEGORY_NAME = 'Miscellaneous'
READER_MODE = 'reader'
jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR)))


class MainPage(base.BaseHandler):
  """The reader's main page, which displays a catalog of explorations."""
  
  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    categories = {}
    for exploration in models.Exploration.query():
      category_name = exploration.metadata.get(
          'category', DEFAULT_CATALOG_CATEGORY_NAME)

      if not categories.get(category_name):
        categories[category_name] = {'explorations': [exploration]}
      else:
        # TODO(sll): make the following 'exploration' more explicit
        categories[category_name]['explorations'].append(exploration)

    self.values.update({
        'categories': categories,
        'js': utils.GetJsFile('readerMain'),
        'mode': READER_MODE,
    })
    self.response.out.write(
        jinja_env.get_template('reader/reader_main.html').render(self.values))


class ExplorationPage(base.BaseHandler):
  """Page describing a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Handles GET requests.

    Args:
      exploration_id: string representing the exploration id.
    """
    self.values.update({
        'js': utils.GetJsFile('readerExploration'),
        'mode': READER_MODE,
    })
    logging.info(self.request.arguments())
    # The following is needed for embedding Oppia explorations in other pages.
    logging.info(self.request.get('hideNavbar'))
    if self.request.get('hideNavbar') == 'true':
      logging.info('hide')
      self.values['hide_navbar'] = True

    self.response.out.write(jinja_env.get_template(
        'reader/reader_exploration.html').render(self.values))


class ExplorationHandler(base.BaseHandler):
  """Provides the data for a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Populates the data on the individual exploration page.

    Args:
      exploration_id: string representing the exploration id.
    """
    # TODO(sll): This should send a complete state machine to the frontend.
    # All interaction would happen client-side.
    exploration = utils.GetEntity(models.Exploration, exploration_id)
    init_state = exploration.init_state.get()
    init_html, init_widgets = utils.ParseContentIntoHtml(init_state.text, 0)
    self.data_values.update({
        'html': init_html,
        'input_view': init_state.input_view.get().name,
        'state_id': init_state.hash_id,
        'title': exploration.title,
        'widgets': init_widgets,
    })
    self.data_values['input_template'] = utils.GetInputTemplate(self.data_values['input_view'])
    if self.data_values['input_view'] == utils.input_views.multiple_choice:
      self.data_values['categories'] = init_state.classifier_categories
    self.response.out.write(json.dumps(self.data_values))

  def post(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Handles feedback interactions with readers.

    Args:
      exploration_id: string representing the exploration id.
      state_id: string representing the state id.

    Raises:
      KeyError: if a metric change or destination is invalid.
    """
    values = {'error': []}

    exploration = utils.GetEntity(models.Exploration, exploration_id)
    state = utils.GetEntity(models.State, state_id)
    old_state = state
    # Modify the reader's metrics and state based on the response received.
    response = self.request.get('answer')
    category = classifiers.Classify(state.input_view.get().classifier, response,
                                    state.classifier_categories)
    try:
      action_set = state.action_sets[category].get()
    except IndexError:
      # TODO(sll): handle the following error more gracefully. Perhaps use the
      # default category?
      logging.error('No action set found for response %s', response)
      return
    for metric in action_set.metrics:
      self.AdjustMetric(reader, metric)

    html_output = ''
    widget_output = []
    # Append reader's response.
    if state.input_view.get().classifier == 'finite':
      html_output = jinja_env.get_template(
          'reader_response.html').render(
              {'response': state.classifier_categories[int(response)]})
    else:
      html_output = jinja_env.get_template(
          'reader_response.html').render({'response': response})

    if not action_set.dest:
      # This leads to a FINISHED state.
      if action_set.text:
        action_html, action_widgets = utils.ParseContentIntoHtml(
            [{'type': 'text', 'value': action_set.text}], len(page.html))
        html_output += action_html
        html_output += 'FINISHED'
        widget_output.append(action_widgets)
    else:
      if action_set.dest_exploration:
        self.redirect('/learn/%s' % action_set.dest_exploration)
        return
      else:
        state = action_set.dest.get()

      # Append Oppia's feedback, if any.
      # TODO(sll): Rewrite this once the action_set.text becomes a content
      #     array.
      if action_set.text:
        action_html, action_widgets = utils.ParseContentIntoHtml(
            [{'type': 'text', 'value': action_set.text}], len(page.html))
        html_output += action_html
        widget_output.append(action_widgets)
      # Append text for the new state only if the new and old states differ.
      if old_state.hash_id != state.hash_id:
        state_html, state_widgets = utils.ParseContentIntoHtml(
            state.text, len(page.html))
        html_output += state_html
        widget_output.append(state_widgets)


    values['exploration_id'] = exploration.hash_id
    values['html'] = html_output
    values['widgets'] = widget_output
    if not action_set.dest:
      values['input_view'] = utils.input_views.finished
      values['input_template'] = ' '
    else:
      values['input_view'] = (state.input_view.get().name)
      values['input_template'] = utils.GetInputTemplate(values['input_view'])
    if values['input_view'] == utils.input_views.multiple_choice:
      values['categories'] = state.classifier_categories
    utils.Log(values)
    self.response.out.write(json.dumps(values))


##### The following code is old code. #####


class BaseHandler(base.BaseHandler):
  """This base class allows 404 errors to be handled easily."""

  def DescriptiveError(self, code, error_message):
    """Displays a simple error page to the content creator."""
    super(BaseHandler, self).error(code)
    logging.error('%s: %s', code, error_message)
    self.response.out.write('Error: ' + str(error_message))
    return


class HomePage(BaseHandler):
  """The main index page, which displays a choice of stories for the user."""

  def GetReaderList(self, user):
    """Get all the readers corresponding to this user.

    Args:
      user: the user whose list of readers we want to get.

    Returns:
      the list of readers corresponding to this user.
    """
    return datamodels.Reader.query().filter(datamodels.Reader.reader == user)

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    reader_list = self.GetReaderList(user)
    seen_story_keys = [reader.story for reader in reader_list]

    seen_stories = []
    unseen_stories = []
    for story in datamodels.Story.query():
      if story.key in seen_story_keys:
        seen_stories.append({'id': story.hash_id, 'name': story.name})
      else:
        unseen_stories.append({'id': story.hash_id, 'name': story.name})

    values = {
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('readerIndex'),
        'logout_url': users.create_logout_url(self.request.uri),
        'mode': 'index',
        'seen_stories': seen_stories,
        'unseen_stories': unseen_stories,
        'user': user,
    }
    self.response.out.write(
        jinja_env.get_template('index.html').render(values))


class StoryInitPage(BaseHandler):
  """Story page initializer. Sets up the story page template."""

  def get(self, story_id):  # pylint: disable-msg=C6409
    """Handles an HTTP GET request, displaying an error page if necessary.

    Args:
      story_id: string representing the story id.
    """
    [story] = utils.TryParsingUrlParameters(False, story_id)
    self.response.out.write(jinja_env.get_template('story.html').render({
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('readerStory'),
        'logout_url': users.create_logout_url(self.request.uri),
        'story_name': story.name,
    }))


class StoryHandler(BaseHandler):
  """Returns the values needed to set up a story page."""

  def GetReader(self, user, story):
    """Gets the reader corresponding to a user/story combination.

    Args:
      user: the user corresponding to this reader.
      story: the story corresponding to this reader.

    Returns:
      the reader corresponding to this user/story combination.
    """
    return datamodels.Reader.query().filter(
        datamodels.Reader.reader == user).filter(
            datamodels.Reader.story == story.key).get()

  def GetInputTemplate(self, template_name):
    """Gets a template for the reader's input view.

    Args:
      template_name: the name of the template.

    Returns:
      the corresponding input template.
    """
    return utils.GetFileContents('input_views/%s.html' % template_name)

  def AdjustMetric(self, reader, metric_dict):
    """Adjusts a reader's metric.

    Args:
      reader: the current reader.
      metric_dict: a dict with two elements -- 'key', the name of the metric
          to adjust, and 'value', the amount to adjust the metric by.
    """
    logging.info(metric_dict)
    try:
      delta = float(metric_dict['value'])
    except ValueError:
      logging.error('%s is not a valid metric delta.', delta)
      return

    if not reader.metrics.get(metric_dict['key']):
      reader.metrics[metric_dict['key']] = delta
    else:
      reader.metrics[metric_dict['key']] += delta
    reader.put()

  def GetValuesForStoryPage(self, story, reader, page=''):
    """Gets the values for a story page.

    Args:
      story: the current story.
      reader: the current reader.
      page: if present, the number of the page to retrieve. Otherwise the
          current page associated with the user is returned.

    Returns:
      A JS object containing variables with which to populate the story page.
    """
    if page:
      page = int(page) - 1  # Makes it 0-indexed
      if isinstance(page, int):
        reader.current_page = int(page)
      else:
        raise utils.InvalidInputError(
            'Input %s is not a valid page number.' % page)

    if reader.current_page > len(reader.pages) - 1:
      logging.error('Current page %s > max page %s',
                    reader.current_page, len(reader.pages) - 1)
      reader.current_page = len(reader.pages) - 1

    reader.put()
    content = reader.pages[reader.current_page].get()

    values = {
        'debug': feconf.DEBUG,
        'html': content.html,
        'input_view': ('none' if reader.current_page != len(reader.pages) - 1
                       else reader.state.get().input_view.get().name),
        'max_page': len(reader.pages),
        'story_id': story.hash_id,
        'story_name': story.name,
        'widgets': content.widgets,
    }
    # Do not show input views for users in a 'finished' state, or for any
    # page before the last page.
    # TODO(sll): What to do if the reader has finished in 'question-group'
    # mode, then the editor changes the navigation to 'story' mode? The
    # reader will not have had a page history, and would have to reset. A
    # possibility would to require the editor to decide at the outset
    # whether to write a story or a course.
    if reader.finished or reader.current_page < len(reader.pages) - 1:
      values['input_view'] = utils.input_views.finished
      values['input_template'] = ''
    else:
      values['input_template'] = self.GetInputTemplate(values['input_view'])

    if values['input_view'] == utils.input_views.multiple_choice:
      values['categories'] = reader.state.get().classifier_categories

    values['current_page'] = reader.current_page + 1  # Makes it 1-indexed
    self.response.out.write(json.dumps(values))

  def GetValuesForQuestionGroup(
      self, story, reader, chapter_id, group_id):
    """Gets the values for a question from the given question group.

    Args:
      story: the current story.
      reader: the current reader.
      chapter_id: the current chapter index.
      group_id: the current question group id.

    Returns:
      A JS object containing variables with which to populate the question.
    """
    # TODO(sll): Cache the chapter list (which is used for navigation), and
    # force an update only when it changes on the editor's side.
    chapter_list = []
    for chapter_key in story.chapters:
      chapter = chapter_key.get()
      group_list = []
      for group_key in chapter.question_groups:
        group = group_key.get()
        if utils.CheckPrereqs(
            group.prereq_date, group.prereq_metrics, reader.metrics):
          group_list.append({'groupId': group.hash_id, 'name': group.name})
      chapter_list.append({'name': chapter.name, 'groups': group_list})

    logging.info(reader.question)
    if not chapter_id or not group_id:
      self.response.out.write(json.dumps({
          'chapter_list': chapter_list,
          'debug': feconf.DEBUG,
          'html': [],
          'story_id': story.hash_id,
          'story_name': story.name,
          'widgets': [],
      }))
      return

    # TODO(sll): Check if this group belongs to the right story.
    group = utils.GetEntity(datamodels.QuestionGroup, group_id)

    # Pick a random question from the given question group.
    # TODO(sll): Base this on the reader's prerequisites?
    # TODO(sll): Get this question more intelligently, e.g. take the reader's
    #   history of questions seen into account.
    question = datamodels.Question.query().filter(
        datamodels.Question.question_group == group.key).get()
    if not question:
      raise utils.InvalidStoryError('This item is not ready for viewing.')
    reader.question = question.key
    reader.state = question.init_state
    reader.current_page = 0

    # Fill the page up with question content.
    init_html, init_widgets = utils.ParseContentIntoHtml(
        reader.state.get().text, 0)
    page_key = reader.pages[0]
    if not page_key:
      page = datamodels.PageContent(html=[init_html], widgets=[init_widgets])
      page.put()
      reader.pages.append(page.key)
    else:
      page = page_key.get()
      page.html = [init_html]
      page.widgets = [init_widgets]
      page.put()
    reader.put()

    values = {
        'chapter_list': chapter_list,
        'curr_chapter': int(chapter_id),  # 0-indexed
        'debug': feconf.DEBUG,
        'group_id': group.hash_id,
        'group_name': group.name,
        'html': page.html,
        'input_view': reader.state.get().input_view.get().name,
        'question_id': question.hash_id,
        'story_id': story.hash_id,
        'story_name': story.name,
        'widgets': page.widgets,
    }
    values['input_template'] = self.GetInputTemplate(values['input_view'])
    if values['input_view'] == utils.input_views.multiple_choice:
      values['categories'] = reader.state.get().classifier_categories

    self.response.out.write(json.dumps(values))

  def get(self, story_id, page_or_chapter_id='',  # pylint: disable-msg=C6409
          group_id=''):
    """Returns the JavaScript variables for a page shown to the reader.

    Args:
      story_id: string representing the story id.
      page_or_chapter_id: if present, the number of the page to retrieve
          (otherwise the current page associated with the user is returned), or
          the index of the chapter
      group_id: if present, the string representing the question group id.

    Raises:
      ValueError: if story.navigation is invalid.
    """
    user = users.get_current_user()
    [story] = utils.TryParsingUrlParameters(False, story_id)
    reader = self.GetReader(user, story)
    if not reader:
      # Create a new reader.
      # TODO(sll): In REST, a GET should not result in a change in the
      # datastore. Refactor to make it this way.
      try:
        reader = utils.CreateNewReader(user, story)
        utils.Log('New reader created for user %s, story %s' % (user, story))
        reader.put()
      except utils.InvalidStoryError, e:
        self.JsonError(e)
        return

    if story.navigation == 'story':
      page_number = page_or_chapter_id
      self.GetValuesForStoryPage(story, reader, page_number)
    elif story.navigation == 'question_group':
      chapter_id = page_or_chapter_id
      try:
        self.GetValuesForQuestionGroup(story, reader, chapter_id, group_id)
      except utils.InvalidStoryError, e:
        # TODO(sll): This error doesn't get transmitted to the frontend; why?
        self.JsonError(e)
        return
    else:
      raise ValueError('Invalid navigation option %s for story id %s',
                       story.navigation, story.hash_id)

  def post(self, story_id):  # pylint: disable-msg=C6409
    """Handles feedback interactions with readers.

    Args:
      story_id: string representing the story id.

    Raises:
      KeyError: if a metric change or destination is invalid.
    """
    user = users.get_current_user()
    [story] = utils.TryParsingUrlParameters(False, story_id)

    values = {'error': []}
    reader = self.GetReader(user, story)
    if not reader:
      self.JsonError('User %s has no access to story %s' % (user, story))
      return
    if reader.finished and story.navigation == 'story':
      self.JsonError('User %s called POST in a finished state' % user)
      return

    state = reader.state.get()
    # Modify the reader's metrics and state based on the response received.
    response = self.request.get('answer')
    category = classifiers.Classify(state.input_view.get().classifier, response,
                                    state.classifier_categories)
    try:
      action_set = state.action_sets[category].get()
    except IndexError:
      # TODO(sll): handle the following error more gracefully. Perhaps use the
      # default category?
      logging.error('No action set found for response %s', response)
      return
    for metric in action_set.metrics:
      self.AdjustMetric(reader, metric)

    try:
      old_state = reader.state
      old_page = reader.pages[reader.current_page].get()
    except IndexError:
      logging.info(reader.pages)
      self.JsonError('Page %s for %s doesn\'t exist.' %
                     (reader.current_page, reader.reader))
      return

    # Append reader's response.
    if state.input_view.get().classifier == 'finite':
      old_page.html.append(jinja_env.get_template(
          'reader_response.html').render(
              {'response': state.classifier_categories[int(response)]}))
    else:
      old_page.html.append(jinja_env.get_template(
          'reader_response.html').render({'response': response}))
    old_page.put()

    if not action_set.dest:
      # This leads to a FINISHED state.
      if story.navigation == 'story':
        page = datamodels.PageContent(html=[self.GetInputTemplate(
            utils.input_views.finished)])
        page.put()
        reader.pages.append(page.key)
        reader.current_page += 1
        reader.finished = True
        reader.put()
        # Give the reader editing rights.
        logging.info('Reader %s has access to story %s', reader.reader,
                     story.name)
        if reader.reader not in story.editors:
          story.editors.append(reader.reader)
          story.put()
      else:
        page = reader.pages[0].get()
        if action_set.text:
          action_html, action_widgets = utils.ParseContentIntoHtml(
              [{'type': 'text', 'value': action_set.text}], len(page.html))
          page.html.append(action_html)
          page.widgets.append(action_widgets)
    else:
      if action_set.dest_question:
        reader.question = action_set.dest_question
        reader.state = reader.question.get().init_state
        if action_set.dest != reader.state:
          utils.Log('Error: dests for action_set %s don\'t match' % action_set)
        if story.navigation == 'story':
          page = datamodels.PageContent()
          page.put()
          reader.pages.append(page.key)
          reader.current_page += 1
        else:
          page = reader.pages[0].get()
          page.html = []
          page.widgets = []
      else:
        reader.state = action_set.dest
        page = old_page

      reader.put()
      state = reader.state.get()
      # Append Oppia's feedback, if any.
      # TODO(sll): Rewrite this once the action_set.text becomes a content
      #     array.
      if action_set.text and not (
          story.navigation == 'question_group' and action_set.dest_question):
        action_html, action_widgets = utils.ParseContentIntoHtml(
            [{'type': 'text', 'value': action_set.text}], len(page.html))
        page.html.append(action_html)
        page.widgets.append(action_widgets)
      # Append text for the new state only if the new and old states differ.
      if old_state != reader.state:
        state_html, state_widgets = utils.ParseContentIntoHtml(
            state.text, len(page.html))
        page.html.append(state_html)
        page.widgets.append(state_widgets)
      page.put()

    if story.navigation == 'story':
      values['current_page'] = reader.current_page + 1  # Makes it 1-indexed.
      values['max_page'] = len(reader.pages)
    else:
      question = reader.question.get()
      group = question.question_group.get()
      values['question_id'] = question.hash_id
      values['group_id'] = group.hash_id
      values['group_name'] = group.name
    values['html'] = page.html
    values['widgets'] = page.widgets
    if not action_set.dest:
      values['input_view'] = utils.input_views.finished
      values['input_template'] = ' '
    else:
      values['input_view'] = (state.input_view.get().name)
      values['input_template'] = self.GetInputTemplate(values['input_view'])
    if values['input_view'] == utils.input_views.multiple_choice:
      values['categories'] = state.classifier_categories
    utils.Log(values)
    self.response.out.write(json.dumps(values))

  def delete(self, story_id):  # pylint: disable-msg=C6409
    """Clears a reader's progress.

    Args:
      story_id: string representing the story id.
    """
    user = users.get_current_user()
    [story] = utils.TryParsingUrlParameters(False, story_id)
    reader = self.GetReader(user, story)
    if reader:
      ndb.delete_multi(reader.pages)
      ndb.delete_multi(reader.parameters)
      reader.key.delete()
    utils.CreateNewReader(user, story)
    logging.info('Progress cleared.')


class ProfilePage(BaseHandler):
  """Sets up the reader's profile page."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles an HTTP GET request."""
    user = users.get_current_user()
    readers = datamodels.Reader.query().filter(
        datamodels.Reader.reader == user)

    metrics_data = []
    for reader in readers:
      story = reader.story.get()
      if story.show_profile:
        metrics_data.append({'story_id': story.hash_id,
                             'story_name': story.name,
                             'metrics': reader.metrics})
    self.response.out.write(jinja_env.get_template('profile.html').render({
        'css': utils.GetCssFile('main'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('readerStory'),
        'logout_url': users.create_logout_url(self.request.uri),
        'metrics_data': metrics_data,
        'mode': 'profile',
        'user': user,
    }))

# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the story viewer page"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_progress_services
from core.domain import question_services
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_fetchers
import feconf
import utils


class StoryPage(base.BaseHandler):
    """Page describing a single story."""

    @acl_decorators.can_access_story_viewer_page
    def get(self, _):
        """Handles GET requests."""
        self.render_template('story-viewer-page.mainpage.html')


class StoryPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the
    story viewer page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_story_viewer_page
    def get(self, story_id):
        """Handles GET requests."""
        story = story_fetchers.get_story_by_id(story_id)
        topic_id = story.corresponding_topic_id
        topic_name = topic_fetchers.get_topic_by_id(topic_id).name

        completed_node_ids = [
            completed_node.id for completed_node in
            story_fetchers.get_completed_nodes_in_story(self.user_id, story_id)]

        ordered_node_dicts = [
            node.to_dict() for node in story.story_contents.get_ordered_nodes()
        ]
        for node in ordered_node_dicts:
            node['completed'] = False
            if node['id'] in completed_node_ids:
                node['completed'] = True

        exp_ids = [
            node['exploration_id'] for node in ordered_node_dicts]
        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                exp_ids, user=self.user))

        for ind, node in enumerate(ordered_node_dicts):
            node['exp_summary_dict'] = exp_summary_dicts[ind]

        self.values.update({
            'story_id': story.id,
            'story_title': story.title,
            'story_description': story.description,
            'story_nodes': ordered_node_dicts,
            'topic_name': topic_name,
            'meta_tag_content': story.meta_tag_content
        })
        self.render_json(self.values)


class StoryProgressHandler(base.BaseHandler):
    """Marks a story node as completed after completing and returns exp ID of
    next chapter (if applicable).
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _record_node_completion(
            self, story_id, node_id, completed_node_ids, ordered_nodes):
        """Records node completion."""
        if not constants.ENABLE_NEW_STRUCTURE_VIEWER_UPDATES:
            raise self.PageNotFoundException

        try:
            story_fetchers.get_node_index_by_story_id_and_node_id(
                story_id, node_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        next_exp_ids = []
        next_node_id = None
        if node_id not in completed_node_ids:
            story_services.record_completed_node_in_story_context(
                self.user_id, story_id, node_id)

            completed_nodes = story_fetchers.get_completed_nodes_in_story(
                self.user_id, story_id)
            completed_node_ids = [
                completed_node.id for completed_node in completed_nodes]

            for node in ordered_nodes:
                if node.id not in completed_node_ids:
                    next_exp_ids = [node.exploration_id]
                    next_node_id = node.id
                    break
        return (next_exp_ids, next_node_id, completed_node_ids)

    @acl_decorators.can_access_story_viewer_page
    def get(self, story_id, node_id):
        """Handles GET requests."""
        (
            _, _, classroom_url_fragment, topic_url_fragment,
            story_url_fragment, node_id) = self.request.path.split('/')
        story = story_fetchers.get_story_by_id(story_id)
        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.user_id, story_id)
        ordered_nodes = story.story_contents.get_ordered_nodes()

        # In case the user is a returning user and has completed nodes in the
        # past, redirect to the story page so that the user can continue from
        # where they had left off.
        # If the node id is not the first node in the story, redirect to
        # the story page.
        if completed_nodes or node_id != ordered_nodes[0].id:
            self.redirect(
                '/learn/%s/%s/story/%s' % (
                    classroom_url_fragment, topic_url_fragment,
                    story_url_fragment))
            return

        (next_exp_ids, next_node_id, _) = (
            self._record_node_completion(story_id, node_id, [], ordered_nodes))
        if next_node_id is None:
            self.redirect(
                '/learn/%s/%s/story/%s' % (
                    classroom_url_fragment, topic_url_fragment,
                    story_url_fragment))
            return

        redirect_url = '%s/%s' % (
            feconf.EXPLORATION_URL_PREFIX, next_exp_ids[0])
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'classroom_url_fragment', classroom_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'topic_url_fragment', topic_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'story_url_fragment', story_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'node_id', next_node_id)

        self.redirect(redirect_url)

    @acl_decorators.can_access_story_viewer_page
    def post(self, story_id, node_id):
        story = story_fetchers.get_story_by_id(story_id)
        if story is None:
            logging.error(
                'Could not find a story corresponding to '
                '%s id.' % story_id)
            self.render_json({})
            return
        topic = topic_fetchers.get_topic_by_id(story.corresponding_topic_id)
        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.user_id, story_id)
        completed_node_ids = [
            completed_node.id for completed_node in completed_nodes]
        ordered_nodes = story.story_contents.get_ordered_nodes()

        (next_exp_ids, next_node_id, completed_node_ids) = (
            self._record_node_completion(
                story_id, node_id, completed_node_ids, ordered_nodes))

        ready_for_review_test = False
        exp_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                next_exp_ids))

        # If there are no questions for any of the acquired skills that the
        # learner has completed, do not show review tests.
        acquired_skills = skill_fetchers.get_multi_skills(
            story.get_acquired_skill_ids_for_node_ids(
                completed_node_ids
            ))

        acquired_skill_ids = [skill.id for skill in acquired_skills]
        questions_available = len(
            question_services.get_questions_by_skill_ids(
                1, acquired_skill_ids, False)) > 0

        learner_completed_story = len(completed_node_ids) == len(ordered_nodes)
        learner_at_review_point_in_story = (
            len(exp_summaries) != 0 and (
                len(completed_node_ids) &
                constants.NUM_EXPLORATIONS_PER_REVIEW_TEST == 0)
        )
        if questions_available and (
                learner_at_review_point_in_story or learner_completed_story):
            ready_for_review_test = True

        # If there is no next_node_id, the story is marked as completed else
        # mark the story as incomplete.
        if next_node_id is None:
            learner_progress_services.mark_story_as_completed(
                self.user_id, story_id)
        else:
            learner_progress_services.record_story_started(
                self.user_id, story.id)

        completed_story_ids = (
            learner_progress_services.get_all_completed_story_ids(
                self.user_id))
        story_ids_in_topic = []
        for story in topic.canonical_story_references:
            story_ids_in_topic.append(story.story_id)

        is_topic_completed = set(story_ids_in_topic).intersection(
            set(completed_story_ids))

        # If at least one story in the topic is completed,
        # mark the topic as learnt else mark it as partially learnt.
        if not is_topic_completed:
            learner_progress_services.record_topic_started(
                self.user_id, topic.id)
        else:
            learner_progress_services.mark_topic_as_learnt(
                self.user_id, topic.id)

        return self.render_json({
            'summaries': exp_summaries,
            'ready_for_review_test': ready_for_review_test,
            'next_node_id': next_node_id
        })

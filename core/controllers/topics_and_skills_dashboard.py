# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the topics and skills dashboard, from where topics and skills
are created.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import question_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
import feconf


class TopicsAndSkillsDashboardPage(base.BaseHandler):
    """Page showing the topics and skills dashboard."""

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self):
        self.render_template(
            'topics-and-skills-dashboard-page.mainpage.html')


class TopicsAndSkillsDashboardPageDataHandler(base.BaseHandler):
    """Provides data for the user's topics and skills dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self):
        """Handles GET requests."""

        topic_summaries = topic_services.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]

        skill_summaries = skill_services.get_all_skill_summaries()
        skill_summary_dicts = [
            summary.to_dict() for summary in skill_summaries]

        skill_ids_assigned_to_some_topic = (
            topic_services.get_all_skill_ids_assigned_to_some_topic())
        merged_skill_ids = (
            skill_services.get_merged_skill_ids())
        topic_rights_dict = topic_services.get_all_topic_rights()
        for topic_summary in topic_summary_dicts:
            if topic_rights_dict[topic_summary['id']]:
                topic_rights = topic_rights_dict[topic_summary['id']]
                if topic_rights:
                    topic_summary['is_published'] = (
                        topic_rights.topic_is_published)
                    topic_summary['can_edit_topic'] = (
                        topic_services.check_can_edit_topic(
                            self.user, topic_rights)
                    )

        untriaged_skill_summary_dicts = []
        mergeable_skill_summary_dicts = []
        for skill_summary_dict in skill_summary_dicts:
            skill_id = skill_summary_dict['id']
            if (skill_id not in skill_ids_assigned_to_some_topic) and (
                    skill_id not in merged_skill_ids):
                untriaged_skill_summary_dicts.append(skill_summary_dict)
            if (skill_id in skill_ids_assigned_to_some_topic) and (
                    skill_id not in merged_skill_ids):
                mergeable_skill_summary_dicts.append(skill_summary_dict)

        can_delete_topic = (
            role_services.ACTION_DELETE_TOPIC in self.user.actions)

        can_create_topic = (
            role_services.ACTION_CREATE_NEW_TOPIC in self.user.actions)

        can_delete_skill = (
            role_services.ACTION_DELETE_ANY_SKILL in self.user.actions)

        can_create_skill = (
            role_services.ACTION_CREATE_NEW_SKILL in self.user.actions)

        self.values.update({
            'untriaged_skill_summary_dicts': untriaged_skill_summary_dicts,
            'mergeable_skill_summary_dicts': mergeable_skill_summary_dicts,
            'topic_summary_dicts': topic_summary_dicts,
            'can_delete_topic': can_delete_topic,
            'can_create_topic': can_create_topic,
            'can_delete_skill': can_delete_skill,
            'can_create_skill': can_create_skill
        })
        self.render_json(self.values)


class NewTopicHandler(base.BaseHandler):
    """Creates a new topic."""

    @acl_decorators.can_create_topic
    def post(self):
        """Handles POST requests."""
        name = self.payload.get('name')
        abbreviated_name = self.payload.get('abbreviated_name')
        topic_domain.Topic.require_valid_name(name)
        new_topic_id = topic_services.get_new_topic_id()
        topic = topic_domain.Topic.create_default_topic(
            new_topic_id, name, abbreviated_name)
        topic_services.save_new_topic(self.user_id, topic)

        self.render_json({
            'topicId': new_topic_id
        })


class NewSkillHandler(base.BaseHandler):
    """Creates a new skill."""

    @acl_decorators.can_create_skill
    def post(self):
        description = self.payload.get('description')
        linked_topic_ids = self.payload.get('linked_topic_ids')
        explanation_dict = self.payload.get('explanation_dict')
        rubrics = self.payload.get('rubrics')

        if not isinstance(rubrics, list):
            raise self.InvalidInputException('Rubrics should be a list.')

        if not isinstance(explanation_dict, dict):
            raise self.InvalidInputException(
                'Explanation should be a dict.')

        try:
            state_domain.SubtitledHtml.from_dict(explanation_dict)
        except:
            raise self.InvalidInputException(
                'Explanation should be a valid SubtitledHtml dict.')

        rubrics = [skill_domain.Rubric.from_dict(rubric) for rubric in rubrics]
        new_skill_id = skill_services.get_new_skill_id()
        if linked_topic_ids is not None:
            topics = topic_fetchers.get_topics_by_ids(linked_topic_ids)
            for topic in topics:
                if topic is None:
                    raise self.InvalidInputException
                topic_services.add_uncategorized_skill(
                    self.user_id, topic.id, new_skill_id)

        skill_domain.Skill.require_valid_description(description)

        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, description, rubrics)

        skill.update_explanation(
            state_domain.SubtitledHtml.from_dict(explanation_dict))
        skill_services.save_new_skill(self.user_id, skill)

        self.render_json({
            'skillId': new_skill_id
        })


class MergeSkillHandler(base.BaseHandler):
    """Handles merging of the skills."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_topics_and_skills_dashboard
    def post(self):
        """Handles the POST request."""
        old_skill_id = self.payload.get('old_skill_id')
        new_skill_id = self.payload.get('new_skill_id')
        new_skill = skill_services.get_skill_by_id(new_skill_id, strict=False)
        if new_skill is None:
            raise self.PageNotFoundException(
                Exception('The new skill with the given id doesn\'t exist.'))
        old_skill = skill_services.get_skill_by_id(old_skill_id, strict=False)
        if old_skill is None:
            raise self.PageNotFoundException(
                Exception('The old skill with the given id doesn\'t exist.'))
        question_services.replace_skill_id_for_all_questions(
            old_skill_id, old_skill.description, new_skill_id)
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': old_skill.superseding_skill_id,
                'new_value': new_skill_id
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED),
                'old_value': False,
                'new_value': True
            })
        ]
        skill_services.update_skill(
            self.user_id, old_skill_id, changelist,
            'Marking the skill as having being merged successfully.')
        self.render_json({
            'merged_into_skill': new_skill_id
        })

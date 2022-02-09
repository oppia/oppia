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

"""Controllers for the skill mastery."""

from __future__ import annotations

from core import feconf
from core import utils
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import topic_fetchers


class SkillMasteryDataHandler(base.BaseHandler):
    """A handler that handles fetching and updating the degrees of user
    skill mastery.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'selected_skill_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        },
        'PUT': {
            'mastery_change_per_skill': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                         'schema': {
                             'type': 'float'
                         }
                    }
                }
            }
        }
    }

    @acl_decorators.can_access_learner_dashboard
    def get(self):
        """Handles GET requests."""
        skill_ids = (
            self.normalized_request.get('selected_skill_ids'))

        try:
            for skill_id in skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except utils.ValidationError as e:
            raise self.InvalidInputException(
                'Invalid skill ID %s' % skill_id) from e

        try:
            skill_fetchers.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e) from e

        degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.user_id, skill_ids)

        self.values.update({
            'degrees_of_mastery': degrees_of_mastery
        })
        self.render_json(self.values)

    @acl_decorators.can_access_learner_dashboard
    def put(self):
        """Handles PUT requests."""
        mastery_change_per_skill = (
            self.normalized_payload.get('mastery_change_per_skill'))

        skill_ids = list(mastery_change_per_skill.keys())

        current_degrees_of_mastery = (
            skill_services.get_multi_user_skill_mastery(self.user_id, skill_ids)
        )
        new_degrees_of_mastery = {}

        for skill_id in skill_ids:
            try:
                skill_domain.Skill.require_valid_skill_id(skill_id)
            except utils.ValidationError as e:
                raise self.InvalidInputException(
                    'Invalid skill ID %s' % skill_id) from e

            if current_degrees_of_mastery[skill_id] is None:
                current_degrees_of_mastery[skill_id] = 0.0
            new_degrees_of_mastery[skill_id] = (
                current_degrees_of_mastery[skill_id] +
                mastery_change_per_skill[skill_id])

            if new_degrees_of_mastery[skill_id] < 0.0:
                new_degrees_of_mastery[skill_id] = 0.0
            elif new_degrees_of_mastery[skill_id] > 1.0:
                new_degrees_of_mastery[skill_id] = 1.0

        try:
            skill_fetchers.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e) from e

        skill_services.create_multi_user_skill_mastery(
            self.user_id, new_degrees_of_mastery)

        self.render_json({})


class SubtopicMasteryDataHandler(base.BaseHandler):
    """A handler that handles fetching user subtopic mastery for a topic."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'selected_topic_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
    }

    @acl_decorators.can_access_learner_dashboard
    def get(self):
        """Handles GET requests."""
        topic_ids = self.normalized_request.get('selected_topic_ids')
        topics = topic_fetchers.get_topics_by_ids(topic_ids)
        all_skill_ids = []
        subtopic_mastery_dict = {}

        for ind, topic in enumerate(topics):
            if not topic:
                raise self.InvalidInputException(
                    'Invalid topic ID %s' % topic_ids[ind])
            all_skill_ids.extend(topic.get_all_skill_ids())

        all_skill_ids = list(set(all_skill_ids))
        all_skills_mastery_dict = skill_services.get_multi_user_skill_mastery(
            self.user_id, all_skill_ids)
        for topic in topics:
            subtopic_mastery_dict[topic.id] = {}
            for subtopic in topic.subtopics:
                skill_mastery_dict = {
                    skill_id: mastery
                    for skill_id, mastery in all_skills_mastery_dict.items()
                    if mastery is not None and skill_id in subtopic.skill_ids
                }
                if skill_mastery_dict:
                    # Subtopic mastery is average of skill masteries.
                    subtopic_mastery_dict[topic.id][subtopic.id] = (
                        sum(skill_mastery_dict.values()) /
                        len(skill_mastery_dict))

        self.values.update({
            'subtopic_mastery_dict': subtopic_mastery_dict
        })
        self.render_json(self.values)

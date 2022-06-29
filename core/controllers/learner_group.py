# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the learner groups."""

from __future__ import annotations

from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import user_services


LEARNER_GROUP_SCHEMA = {
    'group_title': {
        'schema': {
            'type': 'basestring'
        },
        'default_value': None
    },
    'group_description': {
        'schema': {
            'type': 'basestring',
        },
        'default_value': None
    },
    'student_usernames': {
        'schema': {
            'type': 'list',
            'items': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_USERNAME_LENGTH
                }]
            }
        },
        'default_value': []
    },
    'invited_student_usernames': {
        'schema': {
            'type': 'list',
            'items': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_USERNAME_LENGTH
                }]
            }
        },
        'default_value': []
    },
    'subtopic_page_ids': {
        'schema': {
            'type': 'list',
            'items': {
                'type': 'basestring'
            }
        },
        'default_value': []
    },
    'story_ids': {
        'schema': {
            'type': 'list',
            'items': {
                'type': 'basestring'
            }
        },
        'default_value': []
    }
}


class CreateLearnerGroupHandler(base.BaseHandler):
    """Handles creation of a new learner group."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': LEARNER_GROUP_SCHEMA
    }

    @acl_decorators.can_access_learner_groups
    def post(self):
        """Creates a new learner group."""

        title = self.normalized_payload.get('group_title')
        description = self.normalized_payload.get('group_description')
        student_usernames = self.normalized_payload.get('student_usernames')
        invited_student_usernames = self.normalized_payload.get(
            'invited_student_usernames')
        subtopic_page_ids = self.normalized_payload.get('subtopic_page_ids')
        story_ids = self.normalized_payload.get('story_ids')

        student_ids = user_services.get_multi_user_ids_from_usernames(
            student_usernames)
        invited_student_ids = user_services.get_multi_user_ids_from_usernames(
            invited_student_usernames)

        # Create a new learner group ID.
        new_learner_grp_id = learner_group_fetchers.get_new_learner_group_id()

        learner_group = learner_group_services.create_learner_group(
            new_learner_grp_id, title, description, [self.user_id],
            student_ids, invited_student_ids, subtopic_page_ids, story_ids
        )

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'student_usernames': user_services.get_usernames(
                learner_group.student_user_ids),
            'invited_student_usernames': user_services.get_usernames(
                learner_group.invited_student_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })


class LearnerGroupHandler(base.BaseHandler):
    """Handles operations related to the learner groups."""

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            },
            'default_value': None
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'PUT': LEARNER_GROUP_SCHEMA,
        'DELETE': {}
    }

    @acl_decorators.can_access_learner_groups
    def put(self, learner_group_id):
        """Updates an existing learner group."""

        title = self.normalized_payload.get('group_title')
        description = self.normalized_payload.get('group_description')
        student_usernames = self.normalized_payload.get('student_usernames')
        invited_student_usernames = self.normalized_payload.get(
            'invited_student_usernames')
        subtopic_page_ids = self.normalized_payload.get('subtopic_page_ids')
        story_ids = self.normalized_payload.get('story_ids')

        # Check if user is the facilitator of the learner group, as only
        # facilitators have the right to update a learner group.
        is_valid_request = learner_group_services.is_user_a_facilitator(
            self.user_id, learner_group_id
        )

        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        student_ids = user_services.get_multi_user_ids_from_usernames(
            student_usernames
        )
        invited_student_ids = user_services.get_multi_user_ids_from_usernames(
            invited_student_usernames
        )

        learner_group = learner_group_services.update_learner_group(
            learner_group_id, title, description, [self.user_id],
            student_ids, invited_student_ids, subtopic_page_ids, story_ids
        )

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'student_usernames': user_services.get_usernames(
                learner_group.student_user_ids),
            'invited_student_usernames': user_services.get_usernames(
                learner_group.invited_student_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })

    @acl_decorators.can_access_learner_groups
    def delete(self, learner_group_id):
        """Deletes a learner group."""

        is_valid_request = learner_group_services.is_user_a_facilitator(
            self.user_id, learner_group_id
        )

        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You do not have the rights to delete this learner group '
                'as you are its facilitator.')

        learner_group_services.remove_learner_group(learner_group_id)

        self.render_json({
            'success': True
        })


class LearnerGroupStudentProgressHandler(base.BaseHandler):
    """Handles operations related to the learner group student's progress."""

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            },
            'default_value': None
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'student_usernames': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id):
        """Handles GET requests for users progress through learner
        group syllabus.
        """

        student_usernames = self.normalized_request.get('student_usernames')

        student_user_ids = user_services.get_multi_user_ids_from_usernames(
            student_usernames)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)

        if learner_group is None:
            raise self.InvalidInputException('No such learner group exists.')

        subtopic_page_ids = learner_group.subtopic_page_ids
        story_ids = learner_group.story_ids
        topic_ids = (
            learner_group_services.get_topic_ids_from_subtopic_page_ids(
                subtopic_page_ids))
        topics = topic_fetchers.get_topics_by_ids(topic_ids)
        all_skill_ids = []

        for topic in topics:
            if topic:
                all_skill_ids.extend(topic.get_all_skill_ids())

        all_skill_ids = list(set(all_skill_ids))

        all_students_progress = []

        for user_id in student_user_ids:
            progress_sharing_permission = (
                learner_group_fetchers.get_progress_sharing_permission(
                    user_id, learner_group_id))

            student_progress = {
                'username': user_services.get_username(user_id),
                'progress_sharing_is_turned_on': progress_sharing_permission,
                'stories_progress': [],
                'subtopic_page_progress': []
            }

            # If progress sharing is turned off, then we don't need to
            # fetch the progress of the student.
            if not progress_sharing_permission:
                all_students_progress.append(student_progress)
                continue

            # Fetch the progress of the student in all the stories assigned
            # in the group syllabus.
            stories_progress = story_fetchers.get_progress_in_stories(
                    user_id, story_ids)
            story_summaries = story_fetchers.get_story_summaries_by_ids(
                story_ids)

            for index, summary in enumerate(story_summaries):
                progress_dict = stories_progress[index].to_dict()
                story_prog_dict = summary.to_dict()
                story_prog_dict['story_is_published'] = True
                story_prog_dict['completed_node_titles'] = (
                    progress_dict['completed_node_titles'])
                story_prog_dict['all_node_dicts'] = (
                    progress_dict['all_node_dicts'])
                student_progress['stories_progress'].append(story_prog_dict)

            # Fetch the progress of the student in all the subtopics assigned
            # in the group syllabus.
            skills_mastery_dict = (
                skill_services.get_multi_user_skill_mastery(
                    user_id, all_skill_ids
                )
            )
            for topic in topics:
                for subtopic in topic.subtopics:
                    subtopic_page_id = topic.id + ':' + str(subtopic.id)
                    if not subtopic_page_id in subtopic_page_ids:
                        continue
                    skill_mastery_dict = {
                        skill_id: mastery
                        for skill_id, mastery in skills_mastery_dict.items()
                        if mastery is not None and (
                            skill_id in subtopic.skill_ids
                        )
                    }
                    if skill_mastery_dict:
                        # Subtopic mastery is average of skill masteries.
                        subtopic_prog_dict = {
                            'subtopic_id': subtopic.id,
                            'subtopic_title': subtopic.title,
                            'parent_topic_id': topic.id,
                            'parent_topic_name': topic.name,
                            'thumbnail_filename': subtopic.thumbnail_filename,
                            'thumbnail_bg_color': subtopic.thumbnail_bg_color,
                            'subtopic_mastery': (
                                sum(skill_mastery_dict.values()) /
                                len(skill_mastery_dict)
                            )
                        }
                        student_progress['subtopic_page_progress'].append(
                            subtopic_prog_dict)

            # Add current student's progress to all students progress.
            all_students_progress.append(student_progress)

        self.render_json({
            'students_progress': all_students_progress
        })


class FilterLearnerGroupSyllabusHandler(base.BaseHandler):
    """Handles operations related to the learner group syllabus."""

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            },
            'default_value': None
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'filter_keyword': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': ''
            },
            'filter_type': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None
            },
            'filter_category': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None
            },
            'filter_language': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id):
        """Handles GET requests for learner group syllabus views."""

        filter_keyword = self.normalized_request.get('filter_keyword')
        filter_type = self.normalized_request.get('filter_type')
        filter_category = self.normalized_request.get('filter_category')
        filter_language = self.normalized_request.get('filter_language')

        filtered_syllabus = (
            learner_group_services.get_filtered_learner_group_syllabus(
                learner_group_id, filter_keyword,
                filter_type, filter_category, filter_language
            )
        )

        self.render_json({
            'learner_group_id': learner_group_id,
            'story_summaries': filtered_syllabus['story_summaries'],
            'subtopic_summaries': filtered_syllabus['subtopic_summaries']
        })


class TeacherDashboardHandler(base.BaseHandler):
    """Handles operations related to the teacher dashboard."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self):
        """Handles GET requests for the teacher dashboard."""

        learner_groups = (
            learner_group_fetchers.get_learner_groups_of_facilitator(
                self.user_id)
        )

        learner_groups_data = []
        for learner_group in learner_groups:
            learner_groups_data.append({
                'id': learner_group.group_id,
                'title': learner_group.title,
                'description': learner_group.description,
                'facilitator_usernames': user_services.get_usernames(
                    self.user_id),
                'students_count': len(learner_group.student_user_ids)
            })

        self.render_json({
            'learner_groups_list': learner_groups_data
        })


class FacilitatorLearnerGroupViewHandler(base.BaseHandler):
    """Handles operations related to the facilitators view of learner group."""

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            },
            'default_value': None
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id):
        """Handles GET requests for facilitator's view of learner group."""

        is_valid_request = learner_group_services.is_user_a_facilitator(
            self.user_id, learner_group_id)

        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        learner_group = learner_group_fetchers.get_learner_group_by_id(
                learner_group_id)

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'student_usernames': user_services.get_usernames(
                learner_group.student_user_ids),
            'invited_student_usernames': user_services.get_usernames(
                learner_group.invited_student_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })

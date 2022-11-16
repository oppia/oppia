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

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import story_fetchers
from core.domain import subtopic_page_services
from core.domain import user_services

from typing import Dict


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
    'learner_usernames': {
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
    'invited_learner_usernames': {
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

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': LEARNER_GROUP_SCHEMA
    }

    @acl_decorators.can_access_learner_groups
    def post(self) -> None:
        """Creates a new learner group."""

        title = self.normalized_payload.get('group_title')
        description = self.normalized_payload.get('group_description')
        invited_learner_usernames = self.normalized_payload.get(
            'invited_learner_usernames')
        subtopic_page_ids = self.normalized_payload.get('subtopic_page_ids')
        story_ids = self.normalized_payload.get('story_ids')

        invited_learner_ids = user_services.get_multi_user_ids_from_usernames(
            invited_learner_usernames)

        new_learner_grp_id = learner_group_fetchers.get_new_learner_group_id()

        learner_group = learner_group_services.create_learner_group(
            new_learner_grp_id, title, description, [self.user_id],
            invited_learner_ids, subtopic_page_ids, story_ids
        )

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'learner_usernames': user_services.get_usernames(
                learner_group.learner_user_ids),
            'invited_learner_usernames': user_services.get_usernames(
                learner_group.invited_learner_user_ids),
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
            }
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'PUT': LEARNER_GROUP_SCHEMA,
        'DELETE': {}
    }

    @acl_decorators.can_access_learner_groups
    def put(self, learner_group_id: str) -> None:
        """Updates an existing learner group."""

        title = self.normalized_payload.get('group_title')
        description = self.normalized_payload.get('group_description')
        learner_usernames = self.normalized_payload.get('learner_usernames')
        invited_learner_usernames = self.normalized_payload.get(
            'invited_learner_usernames')
        subtopic_page_ids = self.normalized_payload.get('subtopic_page_ids')
        story_ids = self.normalized_payload.get('story_ids')

        # Check if user is the facilitator of the learner group, as only
        # facilitators have the right to update a learner group.
        is_valid_request = learner_group_services.is_user_facilitator(
            self.user_id, learner_group_id
        )
        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        learner_ids = user_services.get_multi_user_ids_from_usernames(
            learner_usernames
        )
        invited_learner_ids = user_services.get_multi_user_ids_from_usernames(
            invited_learner_usernames
        )

        learner_group = learner_group_services.update_learner_group(
            learner_group_id, title, description, [self.user_id],
            learner_ids, invited_learner_ids, subtopic_page_ids, story_ids
        )

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'learner_usernames': user_services.get_usernames(
                learner_group.learner_user_ids),
            'invited_learner_usernames': user_services.get_usernames(
                learner_group.invited_learner_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })

    @acl_decorators.can_access_learner_groups
    def delete(self, learner_group_id: str) -> None:
        """Deletes a learner group."""

        is_valid_request = learner_group_services.is_user_facilitator(
            self.user_id, learner_group_id
        )
        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You do not have the rights to delete this learner group '
                'as you are not its facilitator.')

        learner_group_services.remove_learner_group(learner_group_id)

        self.render_json({
            'success': True
        })


class LearnerGroupLearnerProgressHandler(base.BaseHandler):
    """Handles operations related to the learner group learner's progress."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'learner_usernames': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests for users progress through learner
        group syllabus.
        """

        learner_usernames = self.normalized_request.get('learner_usernames')
        learner_user_ids = user_services.get_multi_user_ids_from_usernames(
            learner_usernames)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)
        if learner_group is None:
            raise self.InvalidInputException('No such learner group exists.')

        progress_sharing_permissions = (
            learner_group_fetchers.can_multi_learners_share_progress(
                learner_user_ids, learner_group_id
            )
        )
        learners_with_progress_sharing_on = []
        for i, user_id in enumerate(learner_user_ids):
            if progress_sharing_permissions[i]:
                learners_with_progress_sharing_on.append(user_id)

        story_ids = learner_group.story_ids
        stories_progresses = (
            story_fetchers.get_multi_users_progress_in_stories(
                learners_with_progress_sharing_on, story_ids
            )
        )
        subtopic_page_ids = learner_group.subtopic_page_ids
        subtopic_pages_progresses = (
            subtopic_page_services.get_multi_users_subtopic_pages_progress(
                learners_with_progress_sharing_on, subtopic_page_ids
            )
        )

        all_users_settings = user_services.get_users_settings(learner_user_ids)
        all_learners_progress = []
        for i, user_id in enumerate(learner_user_ids):
            learner_progress = {
                'username': learner_usernames[i],
                'progress_sharing_is_turned_on':
                    progress_sharing_permissions[i],
                'profile_picture_data_url':
                    all_users_settings[i].profile_picture_data_url,
                'stories_progress': [],
                'subtopic_pages_progress': []
            }

            # If progress sharing is turned off, then we don't need to
            # show the progress of the learner.
            if not progress_sharing_permissions[i]:
                all_learners_progress.append(learner_progress)
                continue

            learner_progress['stories_progress'] = stories_progresses[user_id]
            learner_progress['subtopic_pages_progress'] = (
                subtopic_pages_progresses[user_id]
            )
            all_learners_progress.append(learner_progress)

        self.render_json(all_learners_progress)


class LearnerGroupLearnerSpecificProgressHandler(base.BaseHandler):
    """Handles operations related to fetching learner specific progress."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests for user progress through learner
        group syllabus.
        """

        learner_user_id = self.user_id

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)
        if learner_group is None:
            raise self.InvalidInputException('No such learner group exists.')

        progress_sharing_permission = (
            learner_group_fetchers.can_multi_learners_share_progress(
                [learner_user_id], learner_group_id
            )
        )[0]

        story_ids = learner_group.story_ids
        stories_progress = (
            story_fetchers.get_multi_users_progress_in_stories(
                [learner_user_id], story_ids
            )
        )[learner_user_id]
        subtopic_page_ids = learner_group.subtopic_page_ids
        subtopic_pages_progress = (
            subtopic_page_services.get_multi_users_subtopic_pages_progress(
                [learner_user_id], subtopic_page_ids
            )
        )[learner_user_id]

        users_settings = user_services.get_user_settings(learner_user_id)
        learner_progress = {
            'username': self.username,
            'progress_sharing_is_turned_on':
                progress_sharing_permission,
            'profile_picture_data_url':
                users_settings.profile_picture_data_url,
            'stories_progress': stories_progress,
            'subtopic_pages_progress': subtopic_pages_progress
        }

        self.render_json(learner_progress)


class LearnerGroupSyllabusHandler(base.BaseHandler):
    """Handles fetching of the learner group syllabus."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests for the learner group syllabus."""

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)
        if learner_group is None:
            raise self.InvalidInputException('No such learner group exists.')

        story_summary_dicts = (
            story_fetchers.get_learner_group_syllabus_story_summaries(
                learner_group.story_ids))
        subtopic_summary_dicts = (
            subtopic_page_services
                .get_learner_group_syllabus_subtopic_page_summaries(
                    learner_group.subtopic_page_ids))

        self.render_json({
            'learner_group_id': learner_group_id,
            'story_summary_dicts': story_summary_dicts,
            'subtopic_summary_dicts': subtopic_summary_dicts
        })


class LearnerGroupSearchSyllabusHandler(base.BaseHandler):
    """Handles operations related to the learner group syllabus."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'learner_group_id': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': ''
            },
            'search_keyword': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': ''
            },
            'search_type': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': constants.DEFAULT_ADD_SYLLABUS_FILTER
            },
            'search_category': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': constants.DEFAULT_ADD_SYLLABUS_FILTER
            },
            'search_language_code': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': constants.DEFAULT_ADD_SYLLABUS_FILTER
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Handles GET requests for learner group syllabus views."""

        search_keyword = self.normalized_request.get('search_keyword')
        search_type = self.normalized_request.get('search_type')
        search_category = self.normalized_request.get('search_category')
        search_language_code = self.normalized_request.get(
            'search_language_code')
        learner_group_id = self.normalized_request.get('learner_group_id')

        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                learner_group_id, search_keyword,
                search_type, search_category, search_language_code
            )
        )

        self.render_json({
            'learner_group_id': learner_group_id,
            'story_summary_dicts': matching_syllabus['story_summary_dicts'],
            'subtopic_summary_dicts':
                matching_syllabus['subtopic_summary_dicts']
        })


class FacilitatorDashboardHandler(base.BaseHandler):
    """Handles operations related to the facilitator dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self):
        """Handles GET requests for the facilitator dashboard."""

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
                'learners_count': len(learner_group.learner_user_ids)
            })

        self.render_json({
            'learner_groups_list': learner_groups_data
        })


class ViewLearnerGroupInfoHandler(base.BaseHandler):
    """Handles operations related to viewing learner group info."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests for viewing learner group info."""

        is_valid_facilitator = learner_group_services.is_user_facilitator(
            self.user_id, learner_group_id)
        is_valid_learner = learner_group_services.is_user_learner(
            self.user_id, learner_group_id)
        if not (is_valid_facilitator or is_valid_learner):
            raise self.UnauthorizedUserException(
                'You are not a member of this learner group.')

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'learner_usernames': user_services.get_usernames(
                learner_group.learner_user_ids),
            'invited_learner_usernames': user_services.get_usernames(
                learner_group.invited_learner_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })


class FacilitatorDashboardPage(base.BaseHandler):
    """Page showing the teacher dashboard."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Handles GET requests."""
        if not config_domain.LEARNER_GROUPS_ARE_ENABLED.value:
            raise self.PageNotFoundException

        self.render_template('facilitator-dashboard-page.mainpage.html')


class CreateLearnerGroupPage(base.BaseHandler):
    """Page for creating a new learner group."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Handles GET requests."""
        if not config_domain.LEARNER_GROUPS_ARE_ENABLED.value:
            raise self.PageNotFoundException

        self.render_template('create-learner-group-page.mainpage.html')


class LearnerGroupSearchLearnerHandler(base.BaseHandler):
    """Handles searching of learners to invite in learner group."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'learner_group_id': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': ''
            },
            'username': {
                'schema': {
                    'type': 'basestring',
                },
                'default_value': ''
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Handles GET requests."""

        username: str = self.normalized_request.get('username')
        learner_group_id: str = self.normalized_request.get('learner_group_id')

        user_settings = user_services.get_user_settings_from_username(username)

        if user_settings is None:
            self.render_json({
                'username': username,
                'profile_picture_data_url': '',
                'error': ('User with username %s does not exist.' % username)
            })
            return

        if self.username.lower() == username.lower():
            self.render_json({
                'username': user_settings.username,
                'profile_picture_data_url': '',
                'error': 'You cannot invite yourself to the group'
            })
            return

        (valid_invitation, error) = learner_group_services.can_user_be_invited(
            user_settings.user_id, user_settings.username, learner_group_id
        )

        if not valid_invitation:
            self.render_json({
                'username': user_settings.username,
                'profile_picture_data_url': '',
                'error': error
            })
            return

        self.render_json({
            'username': user_settings.username,
            'profile_picture_data_url': user_settings.profile_picture_data_url,
            'error': ''
        })


class EditLearnerGroupPage(base.BaseHandler):
    """Page for editing a learner group."""

    URL_PATH_ARGS_SCHEMAS = {
        'group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, group_id: str) -> None:
        """Handles GET requests."""
        if not config_domain.LEARNER_GROUPS_ARE_ENABLED.value:
            raise self.PageNotFoundException

        is_valid_request = learner_group_services.is_user_facilitator(
            self.user_id, group_id)

        if not is_valid_request:
            raise self.PageNotFoundException

        self.render_template('edit-learner-group-page.mainpage.html')


class LearnerGroupLearnersInfoHandler(base.BaseHandler):
    """Handles getting info of learners of a learner group."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests."""

        is_valid_request = learner_group_services.is_user_facilitator(
            self.user_id, learner_group_id)

        if not is_valid_request:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)

        learners_user_settings = user_services.get_users_settings(
            learner_group.learner_user_ids, strict=True)
        invited_user_settings = user_services.get_users_settings(
            learner_group.invited_learner_user_ids, strict=True)

        self.render_json({
            'learners_info': [
                {
                    'username': user_settings.username,
                    'profile_picture_data_url':
                        user_settings.profile_picture_data_url
                }
                for user_settings in learners_user_settings
            ],
            'invited_learners_info': [
                {
                    'username': user_settings.username,
                    'profile_picture_data_url':
                        user_settings.profile_picture_data_url
                }
                for user_settings in invited_user_settings
            ]
        })


class LearnerGroupLearnerInvitationHandler(base.BaseHandler):
    """Handles a learner accepting or declining a learner group invitation."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'learner_username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_USERNAME_LENGTH
                    }]
                }
            },
            'is_invitation_accepted': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': 'false'
            },
            'progress_sharing_permission': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': 'false'
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def put(self, learner_group_id: str) -> None:
        """Handles PUT requests."""

        learner_username = self.normalized_payload.get('learner_username')
        is_invitation_accepted = (
            self.normalized_payload.get('is_invitation_accepted') == 'true')
        progress_sharing_permission = (
            self.normalized_payload.get(
                'progress_sharing_permission') == 'true')

        learner_user_id = user_services.get_user_id_from_username(
            learner_username)
        if is_invitation_accepted:
            learner_group_services.add_learner_to_learner_group(
                learner_group_id, learner_user_id, progress_sharing_permission)
        else:
            learner_group_services.remove_invited_learners_from_learner_group(
                learner_group_id, [learner_user_id], True)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'learner_usernames': user_services.get_usernames(
                learner_group.learner_user_ids),
            'invited_learner_usernames': user_services.get_usernames(
                learner_group.invited_learner_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })


class ExitLearnerGroupHandler(base.BaseHandler):
    """Handles a learner exiting from a learner group."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'learner_username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_USERNAME_LENGTH
                    }]
                }
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def put(self, learner_group_id: str) -> None:
        """Handles PUT requests."""

        learner_username = self.normalized_payload.get('learner_username')

        learner_user_id = user_services.get_user_id_from_username(
            learner_username)
        learner_group_services.remove_learners_from_learner_group(
            learner_group_id, [learner_user_id], True)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            learner_group_id)

        self.render_json({
            'id': learner_group.group_id,
            'title': learner_group.title,
            'description': learner_group.description,
            'facilitator_usernames': user_services.get_usernames(
                learner_group.facilitator_user_ids),
            'learner_usernames': user_services.get_usernames(
                learner_group.learner_user_ids),
            'invited_learner_usernames': user_services.get_usernames(
                learner_group.invited_learner_user_ids),
            'subtopic_page_ids': learner_group.subtopic_page_ids,
            'story_ids': learner_group.story_ids
        })


class LearnerStoriesChaptersProgressHandler(base.BaseHandler):
    """Handles fetching progress of a user in all chapters of given stories"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring',
            },
            'default_value': ''
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'story_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self, username: str) -> None:
        """Handles GET requests."""

        story_ids = self.normalized_request.get('story_ids')
        user_id = user_services.get_user_id_from_username(username)

        stories_chapters_progress = (
            story_fetchers.get_user_progress_in_story_chapters(
                user_id, story_ids))

        self.render_json(stories_chapters_progress)


class LearnerDashboardLearnerGroupsHandler(base.BaseHandler):
    """Handles fetching of learners groups on learner dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Handles GET requests for the fetching learner groups on learner
        dashboard.
        """

        invited_to_learner_groups = (
            learner_group_fetchers.get_invited_learner_groups_of_learner(
                self.user_id)
        )
        invited_to_learner_groups_data = []
        for learner_group in invited_to_learner_groups:
            invited_to_learner_groups_data.append({
                'id': learner_group.group_id,
                'title': learner_group.title,
                'description': learner_group.description,
                'facilitator_usernames': user_services.get_usernames(
                    learner_group.facilitator_user_ids),
                'learners_count': len(learner_group.learner_user_ids)
            })

        learner_groups_joined = (
            learner_group_fetchers.get_learner_groups_joined_by_learner(
                self.user_id)
        )
        learner_of_learner_groups_data = []
        for learner_group in learner_groups_joined:
            learner_of_learner_groups_data.append({
                'id': learner_group.group_id,
                'title': learner_group.title,
                'description': learner_group.description,
                'facilitator_usernames': user_services.get_usernames(
                    learner_group.facilitator_user_ids),
                'learners_count': len(learner_group.learner_user_ids)
            })

        self.render_json({
            'learner_groups_joined': learner_of_learner_groups_data,
            'invited_to_learner_groups': invited_to_learner_groups_data
        })


class LearnerGroupProgressSharingPermissionHandler(base.BaseHandler):
    """The handler for fetching and updating progress sharing permissions of
    a learner for a given learner group.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.LEARNER_GROUP_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'progress_sharing_permission': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': 'false'
            }
        }
    }

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Handles GET requests."""

        progress_sharing_permission = (
            learner_group_fetchers.can_multi_learners_share_progress(
                [self.user_id], learner_group_id)[0]
        )
        self.render_json({
            'progress_sharing_permission': progress_sharing_permission
        })

    @acl_decorators.can_access_learner_groups
    def put(self, learner_group_id: str) -> None:
        """Handles PUT requests."""

        progress_sharing_permission = (
            self.normalized_payload.get(
                'progress_sharing_permission') == 'true')

        learner_group_services.update_progress_sharing_permission(
            self.user_id, learner_group_id, progress_sharing_permission)

        self.render_json({
            'progress_sharing_permission': progress_sharing_permission
        })


class LearnerGroupsFeatureStatusHandler(base.BaseHandler):
    """The handler for checking whether the learner groups feature is
    enabled.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.render_json({
            'feature_is_enabled': (
                config_domain.LEARNER_GROUPS_ARE_ENABLED.value)
        })

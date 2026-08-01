# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers for validating access."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators, base, editor, reader
from core.domain import (
    blog_services,
    classroom_config_services,
    learner_group_services,
    skill_domain,
    skill_fetchers,
    story_domain,
    story_fetchers,
    topic_domain,
    topic_fetchers,
    user_services,
)

from typing import Dict, List, Optional, TypedDict

# TODO(#13605): Refactor access validation handlers to follow a single handler
# pattern.


class ClassroomAccessValidationHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ClassroomAccessValidationHandler's
    normalized_request dictionary.
    """

    classroom_url_fragment: str


class ClassroomAccessValidationHandler(
    base.BaseHandler[
        Dict[str, str], ClassroomAccessValidationHandlerNormalizedRequestDict
    ]
):
    """Validates whether request made to /learn route."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {'classroom_url_fragment': {'schema': {'type': 'basestring'}}}
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves information about a classroom.

        Raises:
            NotFoundException. The classroom cannot be found.
        """
        assert self.normalized_request is not None
        classroom_url_fragment = self.normalized_request[
            'classroom_url_fragment'
        ]
        classroom = classroom_config_services.get_classroom_by_url_fragment(
            classroom_url_fragment
        )

        if not classroom:
            raise self.NotFoundException

        if not classroom.is_published:
            if self.user_id is None or not user_services.is_curriculum_admin(
                self.user_id
            ):
                raise self.NotFoundException


class ClassroomsPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to classrooms page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves information about classrooms.

        Raises:
            PageNotFoundException. No public classrooms are present.
        """

        classrooms = classroom_config_services.get_all_classrooms()
        has_public_classrooms = any(map(lambda c: c.is_published, classrooms))

        if not (has_public_classrooms or constants.DEV_MODE):
            raise self.NotFoundException


class SubtopicViewerPageRevisionRedirectHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects /revision URLs to /studyguide for subtopic viewer page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'subtopic_url_fragment': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.VALID_URL_FRAGMENT_REGEX,
                    },
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT,
                    },
                ],
            }
        },
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, *args: str) -> None:
        """Handles GET requests and redirects to study guide URL."""
        classroom_url_fragment = self.request.route_kwargs.get(
            'classroom_url_fragment'
        )
        topic_url_fragment = self.request.route_kwargs.get('topic_url_fragment')
        subtopic_url_fragment = self.request.route_kwargs.get(
            'subtopic_url_fragment'
        )
        new_url = '/learn/%s/%s/studyguide/%s' % (
            classroom_url_fragment,
            topic_url_fragment,
            subtopic_url_fragment,
        )
        self.redirect(new_url, permanent=True)


class SubtopicViewerPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to the Subtopic Viewer Page"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'subtopic_url_fragment': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.VALID_URL_FRAGMENT_REGEX,
                    },
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT,
                    },
                ],
            }
        },
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, *args: str) -> None:
        """Handles GET requests."""
        pass


class CollectionViewerPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to collection page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'collection_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_collection
    def get(self, _: str) -> None:
        """Handles GET requests."""
        pass


class TopicViewerPageRevisionRedirectHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects old revision URLs to study guide URLs for topic viewer page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_topic_viewer_page
    def get(self, *args: str) -> None:
        """Handles GET requests and redirects to study guide URL."""
        classroom_url_fragment = self.request.route_kwargs.get(
            'classroom_url_fragment'
        )
        topic_url_fragment = self.request.route_kwargs.get('topic_url_fragment')
        new_url = '/learn/%s/%s/studyguide' % (
            classroom_url_fragment,
            topic_url_fragment,
        )
        self.redirect(new_url, permanent=True)


class TopicViewerPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to topic viewer page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_topic_viewer_page
    def get(self, _: str) -> None:
        """Handles GET requests."""
        pass


class StoryViewerPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to the story viewer page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_story_viewer_page
    def get(self, _: str) -> None:
        """Handles GET requests."""
        pass


class FacilitatorDashboardPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to facilitator dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Retrieves information about a learner group.

        Raises:
            PageNotFoundException. The learner groups are not enabled.
        """
        assert self.user_id is not None
        if not learner_group_services.is_learner_group_feature_enabled(
            self.user_id
        ):
            raise self.NotFoundException


class ManageOwnAccountValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to preferences page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_manage_own_account
    def get(self) -> None:
        """Handles GET requests."""
        pass


class PracticeSessionAccessValidationPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to practice session page."""

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'node_id': {
            'schema': {'type': 'basestring'},
            'default_value': None,
        },
        'arc_id': {
            'schema': {'type': 'basestring'},
            'default_value': None,
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'selected_subtopic_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString',
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.can_access_topic_viewer_page
    def get(self, _: str, **kwargs: str) -> None:
        """Handles GET requests."""

        assert self.normalized_request is not None
        subtopics = self.normalized_request.get('selected_subtopic_ids')
        node_id = self.request.route_kwargs.get('node_id')
        arc_id = self.request.route_kwargs.get('arc_id')

        topic_url_fragment = self.request.route_kwargs.get('topic_url_fragment')
        assert isinstance(topic_url_fragment, str)
        topic = topic_fetchers.get_topic_by_url_fragment(topic_url_fragment)
        assert topic is not None

        if node_id is not None:
            self._validate_node_id(topic, node_id)
            return

        if arc_id is not None:
            self._validate_arc_id(topic, arc_id)
            return

        if subtopics is None:
            # Legacy practice session without subtopics should fail.
            is_legacy_path = (
                'practice/session' in self.request.path
                or self.request.path.endswith('practice/session')
            )
            if is_legacy_path:
                raise self.InvalidInputException(
                    'Expected selected_subtopic_ids.'
                )
            # Mastery challenge - just validate topic access (done by decorator).
            return

        if not isinstance(subtopics, list) or not all(
            isinstance(s, int) for s in subtopics
        ):
            raise self.InvalidInputException('Invalid subtopic IDs')

        subtopics_ids = {subtopic.id for subtopic in topic.subtopics}

        for subtopic_id in subtopics:
            if subtopic_id not in subtopics_ids:
                raise self.NotFoundException

    def _get_all_nodes_for_topic(
        self, topic: topic_domain.Topic
    ) -> List[story_domain.StoryNode]:
        """Returns nodes from the first published story in the topic.

        Args:
            topic: Topic. The topic object.

        Returns:
            list(StoryNode). All nodes in order.
        """
        return story_fetchers.get_all_nodes_for_topic(topic)

    def _get_all_arcs_for_topic(
        self, topic: topic_domain.Topic
    ) -> List[story_domain.Arc]:
        """Returns arcs from the first published story in the topic.

        Args:
            topic: Topic. The topic object.

        Returns:
            list(Arc). All arcs in order.
        """
        return [
            arc
            for _, arc in story_fetchers.get_all_arcs_with_stories_for_topic(
                topic
            )
        ]

    def _validate_node_id(
        self, topic: topic_domain.Topic, node_id: str
    ) -> None:
        """Validates that the given node ID exists in the first story.

        The node_id parameter is a 1-based index that maps to the nth node
        in the first published story of the topic.

        Args:
            topic: Topic. The topic object.
            node_id: str. The node ID (1-based index) to validate.

        Raises:
            NotFoundException. The node ID was not found.
        """
        all_nodes = self._get_all_nodes_for_topic(topic)
        valid_indices = {node.id.replace('node_', '') for node in all_nodes}
        if node_id not in valid_indices:
            raise self.NotFoundException(
                'Node with id %s is not part of this topic.' % node_id
            )

    def _validate_arc_id(self, topic: topic_domain.Topic, arc_id: str) -> None:
        """Validates that the given arc ID exists in the first story.

        The arc_id parameter maps to an arc by its 1-based position among the
        arcs of the first published story (e.g., '1' maps to the first arc)
        or by its full ID (e.g., 'default_arc' maps to the arc whose id is
        'default_arc').

        Args:
            topic: Topic. The topic object.
            arc_id: str. The 1-based arc position or full arc ID to validate.

        Raises:
            NotFoundException. The arc ID was not found.
        """
        all_arcs = self._get_all_arcs_for_topic(topic)
        if arc_id.isdigit():
            arc_index = int(arc_id)
            if 1 <= arc_index <= len(all_arcs):
                return
            raise self.NotFoundException(
                'Arc with id %s is not part of this topic.' % arc_id
            )
        valid_indices = {arc.id.replace('arc_', '') for arc in all_arcs}
        if arc_id not in valid_indices:
            raise self.NotFoundException(
                'Arc with id %s is not part of this topic.' % arc_id
            )


class ProfileExistsValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The world-viewable profile page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {'username': {'schema': {'type': 'basestring'}}}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, username: str) -> None:
        """Validates access to profile page.

        Args:
            username: str. The username of the user.

        Raises:
            NotFoundException. No user settings found for the given
                username.
        """
        user_settings = user_services.get_user_settings_from_username(username)

        if not user_settings:
            raise self.NotFoundException


class DiagnosticTestPlayerAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to diagnostic test player page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        pass


class ReleaseCoordinatorAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to release coordinator page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_release_coordinator_page
    def get(self) -> None:
        """Handles GET requests."""
        pass


class ViewLearnerGroupPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to view learner group page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.LEARNER_GROUP_ID_REGEX,
                    }
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Retrieves information about a learner group.

        Args:
            learner_group_id: str. The learner group ID.

        Raises:
            NotFoundException. The learner groups are not enabled.
            NotFoundException. The user is not a member of the learner
                group.
        """
        assert self.user_id is not None
        if not learner_group_services.is_learner_group_feature_enabled(
            self.user_id
        ):
            raise self.NotFoundException

        is_valid_request = learner_group_services.is_user_learner(
            self.user_id, learner_group_id
        )

        if not is_valid_request:
            raise self.NotFoundException


class ExplorationPlayerPageNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationPage's
    normalized_request dictionary.
    """

    v: Optional[int]
    parent: Optional[str]
    iframed: Optional[bool]
    collection_id: Optional[str]


class ExplorationPlayerAccessValidationPage(
    base.BaseHandler[Dict[str, str], ExplorationPlayerPageNormalizedRequestDict]
):
    """Page describing a single exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': editor.SCHEMA_FOR_EXPLORATION_ID}
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': {
                    'type': 'int',
                    'validators': [
                        {
                            'id': 'is_at_least',
                            # Version must be greater than zero.
                            'min_value': 1,
                        }
                    ],
                },
                'default_value': None,
            },
            'parent': {'schema': {'type': 'basestring'}, 'default_value': None},
            'iframed': {'schema': {'type': 'bool'}, 'default_value': None},
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'is_regex_matched',
                            'regex_pattern': constants.ENTITY_ID_REGEX,
                        }
                    ],
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_request is not None
        version = self.normalized_request.get('v')

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection or if
        # the 'parent' parameter is present.
        if self.normalized_request.get('parent'):
            collection_id = None
        else:
            collection_id = self.normalized_request.get('collection_id')

        if not reader._does_exploration_exist(  # pylint: disable=protected-access
            exploration_id, version, collection_id
        ):
            raise self.NotFoundException


class CreateLearnerGroupPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to create learner group page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_groups
    def get(self) -> None:
        """Retrieves information about a learner group.

        Raises:
            NotFoundException. The learner groups are not enabled.
        """
        assert self.user_id is not None
        if not learner_group_services.is_learner_group_feature_enabled(
            self.user_id
        ):
            raise self.NotFoundException


class EditLearnerGroupPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to edit learner group page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'learner_group_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.LEARNER_GROUP_ID_REGEX,
                    }
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_groups
    def get(self, learner_group_id: str) -> None:
        """Validates access to edit learner group page.

        Args:
            learner_group_id: str. The learner group ID.

        Raises:
            NotFoundException. The learner groups are not enabled.
            NotFoundException. The user is not a member of the learner
                group.
        """
        assert self.user_id is not None
        if not learner_group_services.is_learner_group_feature_enabled(
            self.user_id
        ):
            raise self.NotFoundException

        is_valid_request = learner_group_services.is_user_facilitator(
            self.user_id, learner_group_id
        )

        if not is_valid_request:
            raise self.NotFoundException


class BlogHomePageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to blog home page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Validates access to blog home page."""
        pass


class BlogPostPageAccessValidationHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BlogPostPageAccessValidationHandler's
    normalized_request dictionary.
    """

    blog_post_url_fragment: str


class BlogPostPageAccessValidationHandler(
    base.BaseHandler[
        Dict[str, str], BlogPostPageAccessValidationHandlerNormalizedRequestDict
    ]
):
    """Validates whether request made to correct blog post route."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {'blog_post_url_fragment': {'schema': {'type': 'basestring'}}}
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves information about a blog post.

        Raises:
            NotFoundException. The blog post cannot be found.
        """
        assert self.normalized_request is not None
        blog_post_url_fragment = self.normalized_request[
            'blog_post_url_fragment'
        ]
        blog_post = blog_services.get_blog_post_by_url_fragment(
            blog_post_url_fragment
        )

        if not blog_post:
            raise self.NotFoundException


class BlogAuthorProfilePageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to blog author profile page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'author_username': {
            'schema': {'type': 'basestring'},
            'validators': [
                {
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_AUTHOR_NAME_LENGTH,
                }
            ],
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, author_username: str) -> None:
        """Retrieves information about a blog post author.

        Args:
            author_username: str. The author username.

        Raises:
            NotFoundException. User with given username does not exist.
            NotFoundException. User with given username is not a blog
                post author.
        """
        author_settings = user_services.get_user_settings_from_username(
            author_username
        )

        if author_settings is None:
            raise self.NotFoundException(
                'User with given username does not exist'
            )

        if not user_services.is_user_blog_post_author(author_settings.user_id):
            raise self.NotFoundException(
                'User with given username is not a blog post author.'
            )


class SkillEditorPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to skill editor page"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'skill_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX,
                    }
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_skill
    def get(self, skill_id: str) -> None:
        """Renders skill editor page.

        Args:
            skill_id: str. The skill ID.

        Raises:
            Exception. The skill with the given ID doesn't exist.
        """
        skill_domain.Skill.require_valid_skill_id(skill_id)

        skill = skill_fetchers.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.NotFoundException(
                'The skill with the given id doesn\'t exist.'
            )


class CollectionEditorAccessValidationPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to collection editor page."""

    URL_PATH_ARGS_SCHEMAS = {
        'collection_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_collection
    def get(self, _: str) -> None:
        """Handles GET requests."""
        pass


class ExplorationEditorAccessValidationHandlerPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The editor page for a single exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX,
                    }
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, unused_exploration_id: str) -> None:
        """Renders an exploration editor page.

        Args:
            unused_exploration_id: str. The unused exploration ID.
        """
        pass


class TopicEditorAccessValidationPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The editor page for a single topic."""

    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX,
                    }
                ],
            }
        }
    }

    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id: str) -> None:
        """Displays the topic editor page.

        Args:
            topic_id: str. The ID of the topic.

        Raises:
            NotFoundException. If the topic with the given ID doesn't exist.
        """
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.NotFoundException(
                Exception('The topic with the given id doesn\'t exist.')
            )


class StoryEditorAccessValidationHandlerPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The editor page for a single story."""

    URL_PATH_ARGS_SCHEMAS = {
        'story_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {'id': 'has_length', 'value': constants.STORY_ID_LENGTH}
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_story
    def get(self, unused_story_id: str) -> None:
        """Renders the story editor page.

        Args:
            unused_story_id: str. The unused story ID.
        """
        pass


class ReviewTestsPageAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to review tests page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_story_viewer_page
    def get(self, _: str) -> None:
        """Handles GET requests."""
        pass


class TechnicalFeedbackDashboardAccessValidationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Validates access to Technical Feedback Dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_technical_feedback_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        pass

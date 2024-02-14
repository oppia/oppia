# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the Oppia exploration learner view."""

from __future__ import annotations

import logging
import random

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.controllers import editor
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import interaction_registry
from core.domain import learner_progress_services
from core.domain import moderator_services
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.domain import question_services
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import story_fetchers
from core.domain import summary_services
from core.domain import translation_fetchers
from core.domain import translation_services
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict, Union

MAX_SYSTEM_RECOMMENDATIONS = 4


def _does_exploration_exist(
    exploration_id: str, version: Optional[int], collection_id: Optional[str]
) -> bool:
    """Returns if an exploration exists.

    Args:
        exploration_id: str. The ID of the exploration.
        version: int or None. The version of the exploration.
        collection_id: str. ID of the collection.

    Returns:
        bool. True if the exploration exists False otherwise.
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=False, version=version)

    if exploration is None:
        return False

    if collection_id:
        collection = collection_services.get_collection_by_id(
            collection_id, strict=False)
        if collection is None:
            return False

    return True


class ExplorationEmbedPageNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationEmbedPage's
    normalized_request dictionary.
    """

    v: Optional[int]
    collection_id: Optional[str]
    iframed: bool


class ExplorationEmbedPage(
    base.BaseHandler[
        Dict[str, str], ExplorationEmbedPageNormalizedRequestDict
    ]
):
    """Page describing a single embedded exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                },
                'default_value': None
            },
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            },
            'iframed': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
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
        # exploration is being played outside the context of a collection.
        collection_id = self.normalized_request.get('collection_id')

        # This check is needed in order to show the correct page when a 404
        # error is raised. The self.request.get('iframed') part of the check is
        # needed for backwards compatibility with older versions of the
        # embedding script.
        if (feconf.EXPLORATION_URL_EMBED_PREFIX in self.request.uri or
                self.normalized_request.get('iframed')):
            self.iframed = True

        if not _does_exploration_exist(exploration_id, version, collection_id):
            raise self.PageNotFoundException

        self.iframed = True
        self.render_template(
            'oppia-root.mainpage.html', iframe_restriction=None)


class ExplorationPageNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationPage's
    normalized_request dictionary.
    """

    v: Optional[int]
    parent: Optional[str]
    iframed: Optional[bool]
    collection_id: Optional[str]


class ExplorationPage(
    base.BaseHandler[
        Dict[str, str], ExplorationPageNormalizedRequestDict
    ]
):
    """Page describing a single exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                },
                'default_value': None
            },
            'parent': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'iframed': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': None
            },
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            }
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

        if self.normalized_request.get('iframed'):
            redirect_url = '/embed/exploration/%s' % exploration_id
            if version:
                redirect_url += '?v=%s' % version
            self.redirect(redirect_url)
            return

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection or if
        # the 'parent' parameter is present.
        if self.normalized_request.get('parent'):
            collection_id = None
        else:
            collection_id = self.normalized_request.get('collection_id')

        if not _does_exploration_exist(exploration_id, version, collection_id):
            raise self.PageNotFoundException

        self.render_template('oppia-root.mainpage.html')


class ExplorationHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationHandler's
    normalized_request dictionary.
    """

    v: Optional[int]
    pid: Optional[str]


class ExplorationHandler(
    base.BaseHandler[
        Dict[str, str], ExplorationHandlerNormalizedRequestDict
    ]
):
    """Provides the initial data for a single exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                },
                'default_value': None
            },
            'pid': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_PROGRESS_URL_ID_LENGTH
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Populates the data on the individual exploration page.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_request is not None
        version = self.normalized_request.get('v')
        unique_progress_url_id = self.normalized_request.get('pid')

        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, strict=False, version=version)
        if exploration is None:
            raise self.PageNotFoundException()

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        user_settings = user_services.get_user_settings(
            self.user_id, strict=False
        ) if self.user_id else None

        preferred_audio_language_code = None
        preferred_language_codes = None
        has_viewed_lesson_info_modal_once = None

        displayable_language_codes = []
        if exp_services.get_story_id_linked_to_exploration(exploration_id):
            displayable_language_codes = (
                translation_services.get_displayable_translation_languages(
                    feconf.TranslatableEntityType.EXPLORATION, exploration))

        if user_settings is not None:
            preferred_audio_language_code = (
                user_settings.preferred_audio_language_code)
            preferred_language_codes = (
                user_settings.preferred_language_codes)
            has_viewed_lesson_info_modal_once = (
                user_settings.has_viewed_lesson_info_modal_once)

        furthest_reached_checkpoint_exp_version = None
        furthest_reached_checkpoint_state_name = None
        most_recently_reached_checkpoint_exp_version = None
        most_recently_reached_checkpoint_state_name = None

        if not self.user_id and unique_progress_url_id is not None:
            logged_out_user_data = (
                exp_fetchers.get_logged_out_user_progress(
                    unique_progress_url_id, strict=True))

            synced_exp_user_data = None
            # If the latest exploration version is ahead of the most recently
            # interacted exploration version.
            if (
                logged_out_user_data.most_recently_reached_checkpoint_exp_version is not None and # pylint: disable=line-too-long
                logged_out_user_data.most_recently_reached_checkpoint_exp_version < exploration.version # pylint: disable=line-too-long
            ):
                synced_exp_user_data = (
                    exp_services.sync_logged_out_learner_checkpoint_progress_with_current_exp_version( # pylint: disable=line-too-long
                        logged_out_user_data.exploration_id,
                        unique_progress_url_id,
                        strict=True
                    )
                )
            else:
                synced_exp_user_data = logged_out_user_data

            furthest_reached_checkpoint_exp_version = (
                synced_exp_user_data.furthest_reached_checkpoint_exp_version)
            furthest_reached_checkpoint_state_name = (
                synced_exp_user_data.furthest_reached_checkpoint_state_name)
            most_recently_reached_checkpoint_exp_version = (
                synced_exp_user_data
                    .most_recently_reached_checkpoint_exp_version)
            most_recently_reached_checkpoint_state_name = (
                synced_exp_user_data
                    .most_recently_reached_checkpoint_state_name)

        elif self.user_id is not None:
            exp_user_data = exp_fetchers.get_exploration_user_data(
                self.user_id, exploration_id)

            # If exp_user_data is None, it means the exploration is started
            # for the first time and no checkpoint progress of the user
            #  exists for the respective exploration.
            # Exploration version 'v' passed as a parameter in GET request
            # means a previous version of the exploration is being fetched.
            # In that case, we want that exploration to start from the
            # beginning and do not allow users to save their checkpoint
            # progress in older exploration version.
            if exp_user_data is not None and version is None:
                synced_exp_logged_in_user_data = None
                # If the latest exploration version is ahead of the most
                # recently interacted exploration version.
                if (
                    exp_user_data.most_recently_reached_checkpoint_exp_version is not None and # pylint: disable=line-too-long
                    exp_user_data.most_recently_reached_checkpoint_exp_version < exploration.version # pylint: disable=line-too-long
                ):
                    synced_exp_logged_in_user_data = (
                        user_services.sync_logged_in_learner_checkpoint_progress_with_current_exp_version( # pylint: disable=line-too-long
                            self.user_id, exploration_id, strict=True))
                else:
                    synced_exp_logged_in_user_data = exp_user_data

                furthest_reached_checkpoint_exp_version = (
                    synced_exp_logged_in_user_data.furthest_reached_checkpoint_exp_version) # pylint: disable=line-too-long
                furthest_reached_checkpoint_state_name = (
                    synced_exp_logged_in_user_data.furthest_reached_checkpoint_state_name) # pylint: disable=line-too-long
                most_recently_reached_checkpoint_exp_version = (
                    synced_exp_logged_in_user_data
                        .most_recently_reached_checkpoint_exp_version)
                most_recently_reached_checkpoint_state_name = (
                    synced_exp_logged_in_user_data
                        .most_recently_reached_checkpoint_state_name)

        self.values.update({
            'can_edit': (
                rights_manager.check_can_edit_activity(
                    self.user, exploration_rights)),
            'exploration': exploration.to_player_dict(),
            'exploration_metadata': exploration.get_metadata().to_dict(),
            'exploration_id': exploration_id,
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
            'version': exploration.version,
            'preferred_audio_language_code': preferred_audio_language_code,
            'preferred_language_codes': preferred_language_codes,
            'auto_tts_enabled': exploration.auto_tts_enabled,
            'record_playthrough_probability': (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName.
                    RECORD_PLAYTHROUGH_PROBABILITY.value
                )
            ),
            'has_viewed_lesson_info_modal_once': (
                has_viewed_lesson_info_modal_once),
            'furthest_reached_checkpoint_exp_version': (
                furthest_reached_checkpoint_exp_version),
            'furthest_reached_checkpoint_state_name': (
                furthest_reached_checkpoint_state_name),
            'most_recently_reached_checkpoint_exp_version': (
                most_recently_reached_checkpoint_exp_version),
            'most_recently_reached_checkpoint_state_name': (
                most_recently_reached_checkpoint_state_name),
            'displayable_language_codes': displayable_language_codes
        })
        self.render_json(self.values)


class EntityTranslationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The handler to fetch translations for a given entity in a given
    language.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {
            'schema': {
                'type': 'basestring',
                'choices': [
                    feconf.ENTITY_TYPE_EXPLORATION,
                    feconf.ENTITY_TYPE_QUESTION
                ]
            }
        },
        'entity_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        },
        'entity_version': {
            'schema': {
                'type': 'int',
                'validators': [{
                    'id': 'is_at_least',
                    # Version must be greater than zero.
                    'min_value': 1
                }]
            }
        },
        'language_code': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_supported_audio_language_code'
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(
        self,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_code: str
    ) -> None:
        entity_translation = translation_fetchers.get_entity_translation(
            feconf.TranslatableEntityType(entity_type), entity_id,
            entity_version, language_code)

        self.render_json(entity_translation.to_dict())


class PretestHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of PretestHandler's
    normalized_request dictionary.
    """

    story_url_fragment: str


class PretestHandler(
    base.BaseHandler[
        Dict[str, str], PretestHandlerNormalizedRequestDict
    ]
):
    """Provides subsequent pretest questions after initial batch."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS,
        }
    }

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Handles GET request."""
        assert self.normalized_request is not None
        story_url_fragment = self.normalized_request['story_url_fragment']
        story = story_fetchers.get_story_by_url_fragment(story_url_fragment)
        if story is None:
            raise self.InvalidInputException
        if not story.has_exploration(exploration_id):
            raise self.InvalidInputException
        prerequisite_skill_ids = story.get_prerequisite_skill_ids_for_exp_id(
            exploration_id
        )
        if prerequisite_skill_ids is None:
            raise Exception(
                'No prerequisite skill_ids found for the exploration with '
                'exploration_id: %s' % exploration_id
            )
        pretest_questions = (
            question_services.get_questions_by_skill_ids(
                feconf.NUM_PRETEST_QUESTIONS,
                prerequisite_skill_ids,
                True)
        )
        question_dicts = [question.to_dict() for question in pretest_questions]

        self.values.update({
            'pretest_question_dicts': question_dicts,
        })
        self.render_json(self.values)


class StorePlaythroughHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StorePlaythroughHandler's
    normalized_payload dictionary.
    """

    issue_schema_version: int
    playthrough_data: stats_domain.Playthrough


class StorePlaythroughHandler(
    base.BaseHandler[
        StorePlaythroughHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Commits a playthrough recorded on the frontend to storage."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'issue_schema_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                },
            },
            'playthrough_data': {
                'schema': {
                    'type': 'object_dict',
                    'object_class': stats_domain.Playthrough
                }
            },
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests. Appends to existing list of playthroughs or
        deletes it if already full.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        issue_schema_version = self.normalized_payload[
            'issue_schema_version']

        playthrough = self.normalized_payload['playthrough_data']

        exp_issues = stats_services.get_exp_issues(
            exploration_id, playthrough.exp_version)

        if stats_services.assign_playthrough_to_corresponding_issue(
                playthrough, exp_issues, issue_schema_version):
            stats_services.save_exp_issues_model(exp_issues)
        self.render_json({})


class StatsEventsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StatsEventsHandler's
    normalized_payload dictionary.
    """

    aggregated_stats: stats_domain.AggregatedStatsDict
    exp_version: int


class StatsEventsHandler(
    base.BaseHandler[
        StatsEventsHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handles a batch of events coming in from the frontend."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'aggregated_stats': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_aggregated_stats),
                }
            },
            'exp_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        assert self.normalized_payload is not None
        aggregated_stats = self.normalized_payload['aggregated_stats']
        exp_version = self.normalized_payload['exp_version']
        event_services.StatsEventsHandler.record(
            exploration_id, exp_version, aggregated_stats)
        self.render_json({})


class AnswerSubmittedEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of AnswerSubmittedEventHandler's
    normalized_payload dictionary.
    """

    params: Dict[str, Union[str, int, Dict[str, str], List[str]]]
    session_id: str
    old_state_name: str
    answer: Union[str, int, Dict[str, str], List[str]]
    client_time_spent_in_secs: float
    answer_group_index: int
    rule_spec_index: int
    version: int
    classification_categorization: str


class AnswerSubmittedEventHandler(
    base.BaseHandler[
        AnswerSubmittedEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner submitting an answer."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'params': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'weak_multiple',
                            'options': ['int', 'basestring', 'dict', 'list']
                        }
                    }
                },
                'default_value': {}
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'old_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'answer': {
                'schema': {
                    'type': 'weak_multiple',
                    'options': ['int', 'basestring', 'dict', 'list']
                }
            },
            'client_time_spent_in_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'answer_group_index': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'rule_spec_index': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'version': {
                'schema': editor.SCHEMA_FOR_VERSION
            },
            'classification_categorization': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        exp_domain.EXPLICIT_CLASSIFICATION,
                        exp_domain.TRAINING_DATA_CLASSIFICATION,
                        exp_domain.STATISTICAL_CLASSIFICATION,
                        exp_domain.DEFAULT_OUTCOME_CLASSIFICATION
                    ]
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        old_state_name = self.normalized_payload['old_state_name']
        # The reader's answer.
        answer = self.normalized_payload['answer']
        # Parameters associated with the learner.
        params = self.normalized_payload.get('params', {})
        # The version of the exploration.
        version = self.normalized_payload['version']
        session_id = self.normalized_payload['session_id']
        client_time_spent_in_secs = self.normalized_payload[
            'client_time_spent_in_secs']
        # The answer group and rule spec indexes, which will be used to get
        # the rule spec string.
        answer_group_index = self.normalized_payload['answer_group_index']
        rule_spec_index = self.normalized_payload['rule_spec_index']
        classification_categorization = self.normalized_payload[
            'classification_categorization']

        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, version=version)

        old_interaction = exploration.states[old_state_name].interaction

        old_interaction_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                old_interaction.id))

        normalized_answer = old_interaction_instance.normalize_answer(answer)

        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, version, old_state_name,
            exploration.states[old_state_name].interaction.id,
            answer_group_index, rule_spec_index, classification_categorization,
            session_id, client_time_spent_in_secs, params, normalized_answer)
        self.render_json({})


class StateHitEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StateHitEventHandler's
    normalized_payload dictionary.
    """

    session_id: str
    exploration_version: int
    new_state_name: Optional[str]
    client_time_spent_in_secs: float
    old_params: Dict[str, Union[str, int, Dict[str, str], List[str]]]


class StateHitEventHandler(
    base.BaseHandler[
        StateHitEventHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Tracks a learner hitting a new state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    REQUIRE_PAYLOAD_CSRF_CHECK = False
    URL_PATH_ARGS_SCHEMAS = {
         'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'exploration_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            },
            'new_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'client_time_spent_in_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'old_params': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'weak_multiple',
                            'options': ['int', 'basestring', 'dict', 'list']
                        },
                    },
                    'default_value': {}
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        new_state_name = self.normalized_payload['new_state_name']
        exploration_version = self.normalized_payload['exploration_version']
        session_id = self.normalized_payload['session_id']
        # TODO(sll): Why do we not record the value of this anywhere?
        client_time_spent_in_secs = self.normalized_payload[  # pylint: disable=unused-variable
            'client_time_spent_in_secs']
        old_params = self.normalized_payload['old_params']

        event_services.StateHitEventHandler.record(
            exploration_id, exploration_version, new_state_name,
            session_id, old_params, feconf.PLAY_TYPE_NORMAL)
        self.render_json({})


class StateCompleteEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StateCompleteEventHandler's
    normalized_payload dictionary.
    """

    state_name: str
    session_id: str
    time_spent_in_state_secs: float
    exp_version: int


class StateCompleteEventHandler(
    base.BaseHandler[
        StateCompleteEventHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Tracks a learner complete a state. Here, 'completing' means answering
    the state and progressing to a new state.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    URL_PATH_ARGS_SCHEMAS = {
         'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
             'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'time_spent_in_state_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'exp_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        state_name = self.normalized_payload['state_name']
        session_id = self.normalized_payload['session_id']
        time_spent_in_state_secs = self.normalized_payload[
            'time_spent_in_state_secs']
        exp_version = self.normalized_payload['exp_version']
        event_services.StateCompleteEventHandler.record(
            exploration_id,
            exp_version,
            state_name,
            session_id,
            time_spent_in_state_secs
        )
        self.render_json({})


class LeaveForRefresherExpEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of LeaveForRefresherExpEventHandler's
    normalized_payload dictionary.
    """

    refresher_exp_id: str
    exp_version: int
    state_name: str
    session_id: str
    time_spent_in_state_secs: float


class LeaveForRefresherExpEventHandler(
    base.BaseHandler[
        LeaveForRefresherExpEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner leaving an exploration for a refresher exploration."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    URL_PATH_ARGS_SCHEMAS = {
         'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'refresher_exp_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'exp_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'time_spent_in_state_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        refresher_exp_id = self.normalized_payload['refresher_exp_id']
        exp_version = self.normalized_payload['exp_version']
        state_name = self.normalized_payload['state_name']
        session_id = self.normalized_payload['session_id']
        time_spent_in_state_secs = self.normalized_payload[
            'time_spent_in_state_secs']

        event_services.LeaveForRefresherExpEventHandler.record(
            exploration_id,
            refresher_exp_id,
            exp_version,
            state_name,
            session_id,
            time_spent_in_state_secs
        )
        self.render_json({})


class ReaderFeedbackHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ReaderFeedbackHandler's
    normalized_payload dictionary.
    """

    subject: str
    feedback: str
    include_author: bool
    state_name: Optional[str]


class ReaderFeedbackHandler(
    base.BaseHandler[
        ReaderFeedbackHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Submits feedback from the reader."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'subject': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': 'Feedback from a learner'
            },
            'feedback': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': 10000
                    }]
                }
            },
            'include_author': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': True
            },
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        subject = self.normalized_payload['subject']
        feedback = self.normalized_payload['feedback']
        include_author = self.normalized_payload['include_author']

        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION,
            exploration_id,
            self.user_id if include_author else None,
            subject,
            feedback)
        self.render_json(self.values)


class ExplorationStartEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationStartEventHandler's
    normalized_payload dictionary.
    """

    params: Dict[str, Union[str, int]]
    session_id: str
    state_name: str
    version: int


class ExplorationStartEventHandler(
    base.BaseHandler[
        ExplorationStartEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner starting an exploration."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'params': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'weak_multiple',
                            'options': ['int', 'basestring']
                        }
                    }
                }
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
            },
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        event_services.StartExplorationEventHandler.record(
            exploration_id,
            self.normalized_payload['version'],
            self.normalized_payload['state_name'],
            self.normalized_payload['session_id'],
            self.normalized_payload['params'],
            feconf.PLAY_TYPE_NORMAL)
        self.render_json({})


class ExplorationActualStartEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationActualStartEventHandler's
    normalized_payload dictionary.
    """

    exploration_version: int
    state_name: str
    session_id: str


class ExplorationActualStartEventHandler(
    base.BaseHandler[
        ExplorationActualStartEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner actually starting an exploration. These are the learners
    who traverse past the initial state.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'exploration_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        event_services.ExplorationActualStartEventHandler.record(
            exploration_id,
            self.normalized_payload['exploration_version'],
            self.normalized_payload['state_name'],
            self.normalized_payload['session_id'])
        self.render_json({})


class SolutionHitEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SolutionHitEventHandler's
    normalized_payload dictionary.
    """

    exploration_version: int
    state_name: str
    session_id: str
    time_spent_in_state_secs: float


class SolutionHitEventHandler(
    base.BaseHandler[
        SolutionHitEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner clicking on the 'View Solution' button."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'exploration_version': {
                'schema': editor.SCHEMA_FOR_VERSION
            },
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'time_spent_in_state_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            }
        }
    }

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        event_services.SolutionHitEventHandler.record(
            exploration_id,
            self.normalized_payload['exploration_version'],
            self.normalized_payload['state_name'],
            self.normalized_payload['session_id'],
            self.normalized_payload['time_spent_in_state_secs'])
        self.render_json({})


class ExplorationCompleteEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationCompleteEventHandler's
    normalized_payload dictionary.
    """

    collection_id: Optional[str]
    version: int
    state_name: str
    session_id: str
    client_time_spent_in_secs: float
    params: Dict[str, Union[str, int, Dict[str, str], List[str]]]


class ExplorationCompleteEventHandler(
    base.BaseHandler[
        ExplorationCompleteEventHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Tracks a learner completing an exploration.

    The state name recorded should be a state with a terminal interaction.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            },
            'version': {
                'schema': editor.SCHEMA_FOR_VERSION
            },
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'client_time_spent_in_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'params': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'weak_multiple',
                            'options': ['int', 'basestring', 'dict', 'list']
                        }
                    }
                }
            },
        }
    }

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        # This will be None if the exploration is not being played within the
        # context of a collection.
        collection_id = self.normalized_payload.get('collection_id')
        user_id = self.user_id

        event_services.CompleteExplorationEventHandler.record(
            exploration_id,
            self.normalized_payload['version'],
            self.normalized_payload['state_name'],
            self.normalized_payload['session_id'],
            self.normalized_payload['client_time_spent_in_secs'],
            self.normalized_payload['params'],
            feconf.PLAY_TYPE_NORMAL)

        if user_id:
            learner_progress_services.mark_exploration_as_completed(
                user_id, exploration_id)

        if user_id and collection_id:
            collection_services.record_played_exploration_in_collection_context(
                user_id, collection_id, exploration_id)
            next_exp_id_to_complete = (
                collection_services.get_next_exploration_id_to_complete_by_user( # pylint: disable=line-too-long
                    user_id, collection_id))

            if not next_exp_id_to_complete:
                learner_progress_services.mark_collection_as_completed(
                    user_id, collection_id)
            else:
                learner_progress_services.mark_collection_as_incomplete(
                    user_id, collection_id)

        self.render_json(self.values)


class ExplorationMaybeLeaveHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationMaybeLeaveHandler's
    normalized_payload dictionary.
    """

    version: int
    state_name: str
    collection_id: Optional[str]
    session_id: str
    client_time_spent_in_secs: float
    params: Dict[str, Union[str, int, Dict[str, str], List[str]]]


class ExplorationMaybeLeaveHandler(
    base.BaseHandler[
        ExplorationMaybeLeaveHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Tracks a learner leaving an exploration without completing it.

    The state name recorded should be a state with a non-terminal interaction.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'version': {
                'schema': editor.SCHEMA_FOR_VERSION
            },
            'state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            },
            'session_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'client_time_spent_in_secs': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'params': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'weak_multiple',
                            'options': ['int', 'basestring', 'dict', 'list']
                        }
                    }
                }
            },
        }
    }

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        version = self.normalized_payload['version']
        state_name = self.normalized_payload['state_name']
        user_id = self.user_id
        collection_id = self.normalized_payload.get('collection_id')
        story_id = exp_services.get_story_id_linked_to_exploration(
            exploration_id)

        if user_id:
            learner_progress_services.mark_exploration_as_incomplete(
                user_id, exploration_id, state_name, version)

        if user_id and collection_id:
            learner_progress_services.mark_collection_as_incomplete(
                user_id, collection_id)

        if user_id and story_id:
            story = story_fetchers.get_story_by_id(story_id)
            if story is not None:
                learner_progress_services.record_story_started(
                    user_id, story.id)
                if story.corresponding_topic_id is not None:
                    learner_progress_services.record_topic_started(
                        user_id, story.corresponding_topic_id)
            else:
                logging.error(
                    'Could not find a story corresponding to %s '
                    'id.' % story_id)
                self.render_json({})
                return

        event_services.MaybeLeaveExplorationEventHandler.record(
            exploration_id,
            version,
            state_name,
            self.normalized_payload['session_id'],
            self.normalized_payload['client_time_spent_in_secs'],
            self.normalized_payload['params'],
            feconf.PLAY_TYPE_NORMAL)
        self.render_json(self.values)


class LearnerIncompleteActivityHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles operations related to the activities in the incomplete list of
    the user.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'activity_type': {
            'schema': {
                'type': 'basestring',
                'choices': [
                    constants.ACTIVITY_TYPE_EXPLORATION,
                    constants.ACTIVITY_TYPE_COLLECTION,
                    constants.ACTIVITY_TYPE_STORY,
                    constants.ACTIVITY_TYPE_LEARN_TOPIC
                ]
            }
        },
        'activity_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'DELETE': {}}

    @acl_decorators.can_access_learner_dashboard
    def delete(self, activity_type: str, activity_id: str) -> None:
        """Removes exploration, collection, story or topic from incomplete
            list.

        Args:
            activity_type: str. The activity type. Currently, it can take values
                "exploration", "collection", "story" or "topic".
            activity_id: str. The ID of the activity to be deleted.
        """
        assert self.user_id is not None
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            learner_progress_services.remove_exp_from_incomplete_list(
                self.user_id, activity_id)
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
            learner_progress_services.remove_collection_from_incomplete_list(
                self.user_id, activity_id)
        elif activity_type == constants.ACTIVITY_TYPE_STORY:
            learner_progress_services.remove_story_from_incomplete_list(
                self.user_id, activity_id)
        elif activity_type == constants.ACTIVITY_TYPE_LEARN_TOPIC:
            learner_progress_services.remove_topic_from_partially_learnt_list(
                self.user_id, activity_id)

        self.render_json(self.values)


class RatingHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of RatingHandler's
    normalized_payload dictionary.
    """

    user_rating: int


class RatingHandler(
    base.BaseHandler[
        RatingHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Records the rating of an exploration submitted by a user.

    Note that this represents ratings submitted on completion of the
    exploration.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'user_rating': {
                'schema': {
                    'type': 'int',
                    'choices': [1, 2, 3, 4, 5]
                }
            }
        }
    }

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Handles GET requests."""
        self.values.update({
            'overall_ratings':
                rating_services.get_overall_ratings_for_exploration(
                    exploration_id),
            'user_rating': (
                rating_services.get_user_specific_rating_for_exploration(
                    self.user_id, exploration_id) if self.user_id else None)
        })
        self.render_json(self.values)

    @acl_decorators.can_rate_exploration
    def put(self, exploration_id: str) -> None:
        """Handles PUT requests for submitting ratings at the end of an
        exploration.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        user_rating = self.normalized_payload['user_rating']
        rating_services.assign_rating_to_exploration(
            self.user_id, exploration_id, user_rating)
        self.render_json({})


class RecommendationsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of RecommendationsHandler's
    normalized_request dictionary.
    """

    collection_id: Optional[str]
    include_system_recommendations: bool
    author_recommended_ids: List[str]
    story_id: Optional[str]
    current_node_id: Optional[str]


class RecommendationsHandler(
    base.BaseHandler[
        Dict[str, str], RecommendationsHandlerNormalizedRequestDict
    ]
):
    """Provides recommendations to be displayed at the end of explorations.
    Which explorations are provided depends on whether the exploration was
    played within the context of a collection and whether the user is logged in.
    If both are true, then the explorations are suggested from the collection,
    if there are upcoming explorations for the learner to complete.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'collection_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            },
            'include_system_recommendations': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': True
            },
            'author_recommended_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            },
            'story_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            },
            'current_node_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.ENTITY_ID_REGEX
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        collection_id = self.normalized_request.get('collection_id')
        include_system_recommendations = self.normalized_request[
            'include_system_recommendations']
        author_recommended_exp_ids = self.normalized_request[
            'author_recommended_ids']

        system_recommended_exp_ids = []
        next_exp_id = None

        if collection_id:
            if self.user_id:
                next_exp_id = (
                    collection_services.get_next_exploration_id_to_complete_by_user(  # pylint: disable=line-too-long
                        self.user_id, collection_id))
            else:
                collection = collection_services.get_collection_by_id(
                    collection_id)
                next_exp_id = (
                    collection.get_next_exploration_id_in_sequence(
                        exploration_id))
        elif include_system_recommendations:
            system_chosen_exp_ids = (
                recommendations_services.get_exploration_recommendations(
                    exploration_id))
            filtered_exp_ids = list(
                set(system_chosen_exp_ids) - set(author_recommended_exp_ids))
            system_recommended_exp_ids = random.sample(
                filtered_exp_ids,
                min(MAX_SYSTEM_RECOMMENDATIONS, len(filtered_exp_ids)))

        recommended_exp_ids = set(
            author_recommended_exp_ids + system_recommended_exp_ids)
        if next_exp_id is not None:
            recommended_exp_ids.add(next_exp_id)

        self.values.update({
            'summaries': (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    list(recommended_exp_ids))),
        })
        self.render_json(self.values)


class FlagExplorationHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of FlagExplorationHandler's
    normalized_payload dictionary.
    """

    report_text: str


class FlagExplorationHandler(
    base.BaseHandler[
        FlagExplorationHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles operations relating to learner flagging of explorations."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'report_text': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_flag_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        moderator_services.enqueue_flag_exploration_email_task(
            exploration_id,
            self.normalized_payload['report_text'],
            self.user_id)
        self.render_json(self.values)


class QuestionPlayerHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of QuestionPlayerHandler's
    normalized_request dictionary.
    """

    skill_ids: str
    question_count: int
    fetch_by_difficulty: bool


class QuestionPlayerHandler(
    base.BaseHandler[
        Dict[str, str], QuestionPlayerHandlerNormalizedRequestDict
    ]
):
    """Provides questions with given skill ids."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'skill_ids': {
            'schema': {
                'type': 'object_dict',
                'validation_method': domain_objects_validator.validate_skill_ids
            }
            },
            'question_count': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }, {
                        'id': 'is_at_most',
                        'max_value': feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME
                    }]
                }
            },
            'fetch_by_difficulty': {
                'schema': {
                    'type': 'bool'
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET request."""
        # Skill ids are given as a comma separated list because this is
        # a GET request.
        assert self.normalized_request is not None
        skill_ids = self.normalized_request['skill_ids'].split(',')
        question_count = self.normalized_request['question_count']
        fetch_by_difficulty = self.normalized_request[
            'fetch_by_difficulty'
        ]

        if len(skill_ids) > feconf.MAX_NUMBER_OF_SKILL_IDS:
            skill_ids = skill_services.filter_skills_by_mastery(
                self.user_id, skill_ids) if self.user_id else skill_ids

        questions = (
            question_services.get_questions_by_skill_ids(
                int(question_count), skill_ids, fetch_by_difficulty)
        )
        random.shuffle(questions)

        question_dicts = [question.to_dict() for question in questions]
        self.values.update({
            'question_dicts': question_dicts[:feconf.QUESTION_BATCH_SIZE]
        })
        self.render_json(self.values)


class TransientCheckpointUrlPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Responsible for redirecting the learner to the checkpoint
    last reached on the exploration page as a logged out user."""

    URL_PATH_ARGS_SCHEMAS = {
        'unique_progress_url_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_PROGRESS_URL_ID_LENGTH
                }]
            },
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, unique_progress_url_id: str) -> None:
        """Handles GET requests. Fetches the logged-out learner's progress."""

        logged_out_user_data = (
            exp_fetchers.get_logged_out_user_progress(unique_progress_url_id))

        if logged_out_user_data is None:
            raise self.PageNotFoundException()

        redirect_url = '%s/%s?pid=%s' % (
            feconf.EXPLORATION_URL_PREFIX,
            logged_out_user_data.exploration_id,
            unique_progress_url_id)

        self.redirect(redirect_url)


class SaveTransientCheckpointProgressHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SaveTransientCheckpointProgressHandler's
    normalized_request dictionary.
    """

    most_recently_reached_checkpoint_state_name: str
    most_recently_reached_checkpoint_exp_version: int
    unique_progress_url_id: str


class SaveTransientCheckpointProgressHandler(
    base.BaseHandler[
        SaveTransientCheckpointProgressHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Responsible for storing progress of a logged-out learner."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'most_recently_reached_checkpoint_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'most_recently_reached_checkpoint_exp_version': {
                'schema': editor.SCHEMA_FOR_VERSION
            }
        },
        'PUT': {
            'unique_progress_url_id': {
                'schema': {
                    'type': 'basestring',
                }
            },
            'most_recently_reached_checkpoint_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
            'most_recently_reached_checkpoint_exp_version': {
                'schema': editor.SCHEMA_FOR_VERSION
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests. Creates a new unique progress
        url ID and a new corresponding TransientCheckpointUrl model.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        most_recently_reached_checkpoint_state_name = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_state_name'])
        most_recently_reached_checkpoint_exp_version = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_exp_version'])

        # Create a new unique_progress_url_id.
        new_unique_progress_url_id = (
            exp_fetchers.get_new_unique_progress_url_id())

        # Create a new model corresponding to the new progress id.
        exp_services.update_logged_out_user_progress(
            exploration_id,
            new_unique_progress_url_id,
            most_recently_reached_checkpoint_state_name,
            most_recently_reached_checkpoint_exp_version)

        self.render_json({
            'unique_progress_url_id': new_unique_progress_url_id
        })

    @acl_decorators.can_play_exploration
    def put(self, exploration_id: str) -> None:
        """"Handles the PUT requests. Saves the logged-out user's progress."""
        assert self.normalized_payload is not None
        unique_progress_url_id = (
            self.normalized_payload['unique_progress_url_id'])
        most_recently_reached_checkpoint_state_name = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_state_name'])
        most_recently_reached_checkpoint_exp_version = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_exp_version'])

        exp_services.update_logged_out_user_progress(
            exploration_id,
            unique_progress_url_id,
            most_recently_reached_checkpoint_state_name,
            most_recently_reached_checkpoint_exp_version)

        self.render_json(self.values)


class LearnerAnswerDetailsSubmissionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of LearnerAnswerDetailsSubmissionHandler's
    normalized_payload dictionary.
    """

    state_name: Optional[str]
    interaction_id: str
    answer: Union[str, int, Dict[str, str], List[str]]
    answer_details: str


class LearnerAnswerDetailsSubmissionHandler(
    base.BaseHandler[
        LearnerAnswerDetailsSubmissionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles the learner answer details submission."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {
            'schema': {
                'type': 'basestring',
                'choices': [
                    feconf.ENTITY_TYPE_EXPLORATION,
                    feconf.ENTITY_TYPE_QUESTION
                ]
            }
        },
        'entity_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'state_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'interaction_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'answer': {
                'schema': {
                    'type': 'weak_multiple',
                    'options': ['int', 'basestring', 'dict', 'list']
                }
            },
            'answer_details': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_play_entity
    def put(self, entity_type: str, entity_id: str) -> None:
        """"Handles the PUT requests. Stores the answer details submitted
        by the learner.
        """
        assert self.normalized_payload is not None
        if not constants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE:
            raise self.PageNotFoundException

        interaction_id = self.normalized_payload['interaction_id']
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            state_name = self.normalized_payload.get('state_name')
            if state_name is None:
                raise Exception(
                    'The \'state_name\' must be provided when the entity_type '
                    'is %s.' % feconf.ENTITY_TYPE_EXPLORATION
                )
            state_reference = (
                stats_services.get_state_reference_for_exploration(
                    entity_id, state_name))
            if interaction_id != exp_services.get_interaction_id_for_state(
                    entity_id, state_name):
                raise utils.InvalidInputException(
                    'Interaction id given does not match with the '
                    'interaction id of the state')
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            state_reference = (
                stats_services.get_state_reference_for_question(entity_id))
            if interaction_id != (
                    question_services.get_interaction_id_for_question(
                        entity_id)):
                raise utils.InvalidInputException(
                    'Interaction id given does not match with the '
                    'interaction id of the question')

        answer = self.normalized_payload['answer']
        answer_details = self.normalized_payload['answer_details']
        stats_services.record_learner_answer_info(
            entity_type, state_reference,
            interaction_id, answer, answer_details)
        self.render_json({})


class CheckpointReachedEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of CheckpointReachedEventHandler's
    normalized_request dictionary.
    """

    most_recently_reached_checkpoint_exp_version: int
    most_recently_reached_checkpoint_state_name: str


class CheckpointReachedEventHandler(
    base.BaseHandler[
        CheckpointReachedEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner reaching a checkpoint."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'most_recently_reached_checkpoint_exp_version': {
                'schema': editor.SCHEMA_FOR_VERSION
            },
            'most_recently_reached_checkpoint_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                }
            },
        }
    }

    @acl_decorators.can_play_exploration
    def put(self, exploration_id: str) -> None:
        """Handles PUT requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        most_recently_reached_checkpoint_state_name = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_state_name'])
        most_recently_reached_checkpoint_exp_version = (
            self.normalized_payload[
                'most_recently_reached_checkpoint_exp_version'])

        if self.user_id is not None:
            user_services.update_learner_checkpoint_progress(
                self.user_id,
                exploration_id,
                most_recently_reached_checkpoint_state_name,
                most_recently_reached_checkpoint_exp_version
            )

        self.render_json(self.values)


class ExplorationRestartEventHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ExplorationRestartEventHandler's
    normalized_request dictionary.
    """

    most_recently_reached_checkpoint_state_name: Optional[str]


class ExplorationRestartEventHandler(
    base.BaseHandler[
        ExplorationRestartEventHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Tracks a learner restarting an exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': editor.SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'most_recently_reached_checkpoint_state_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_STATE_NAME_LENGTH
                    }]
                },
                'default_value': None
            },
        }
    }

    @acl_decorators.can_play_exploration
    def put(self, exploration_id: str) -> None:
        """Handles PUT requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        assert self.normalized_payload is not None
        most_recently_reached_checkpoint_state_name = (
            self.normalized_payload.get(
                'most_recently_reached_checkpoint_state_name'))

        if most_recently_reached_checkpoint_state_name is None:
            if self.user_id is not None:
                user_services.clear_learner_checkpoint_progress(
                    self.user_id, exploration_id)

        self.render_json(self.values)


class SyncLoggedOutLearnerProgressHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SyncLoggedOutLearnerProgressHandler's
    normalized_request dictionary.
    """

    unique_progress_url_id: str


class SyncLoggedOutLearnerProgressHandler(
    base.BaseHandler[
        SyncLoggedOutLearnerProgressHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Syncs logged out progress of a learner with the logged in progress."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'unique_progress_url_id': {
                'schema': {
                    'type': 'basestring',
                }
            },
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, exploration_id: str) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        unique_progress_url_id = self.normalized_payload[
            'unique_progress_url_id']
        if self.user_id is not None:
            exp_services.sync_logged_out_learner_progress_with_logged_in_progress( # pylint: disable=line-too-long
                self.user_id,
                exploration_id,
                unique_progress_url_id
            )

        self.render_json(self.values)


class StateVersionHistoryHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles the fetching of the version history for a state at the given
    version of the exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        },
        'state_name': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_STATE_NAME_LENGTH
                }]
            }
        },
        'version': {
            'schema': {
                'type': 'int',
                'validators': [{
                    'id': 'is_at_least',
                    'min_value': 1
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str, state_name: str, version: int) -> None:
        """Handles GET requests."""
        version_history = exp_fetchers.get_exploration_version_history(
            exploration_id, version
        )

        if version_history is None:
            raise self.PageNotFoundException

        state_version_history = (
            version_history.state_version_history[state_name]
        )
        last_edited_version_number = (
            state_version_history.previously_edited_in_version
        )
        state_name_in_previous_version = (
            state_version_history.state_name_in_previous_version
        )
        state_in_previous_version = None
        last_edited_committer_username = user_services.get_username(
            state_version_history.committer_id
        )

        # If the state has not been updated after it was added for the
        # first time, the value of last_edited_version_number will be None.
        if (
            last_edited_version_number is not None and
            state_name_in_previous_version is not None
        ):
            exploration = exp_fetchers.get_exploration_by_id(
                exploration_id, version=last_edited_version_number
            )
            state_in_previous_version = (
                exploration.states[state_name_in_previous_version]
            )

        self.render_json({
            'last_edited_version_number': last_edited_version_number,
            'state_name_in_previous_version': state_name_in_previous_version,
            'state_dict_in_previous_version': (
                state_in_previous_version.to_dict()
                if state_in_previous_version is not None else None
            ),
            'last_edited_committer_username': last_edited_committer_username
        })


class MetadataVersionHistoryHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles the fetching of the version history for the exploration metadata
    at the given version of the exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        },
        'version': {
            'schema': {
                'type': 'int',
                'validators': [{
                    'id': 'is_at_least',
                    'min_value': 1
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str, version: int) -> None:
        """Handles GET requests."""
        version_history = exp_fetchers.get_exploration_version_history(
            exploration_id, version
        )

        if version_history is None:
            raise self.PageNotFoundException

        metadata_version_history = version_history.metadata_version_history
        metadata_in_previous_version = None

        # If the metadata has not been updated after the exploration was
        # created, the value of last_edited_version_number will be None.
        if metadata_version_history.last_edited_version_number is not None:
            exploration = exp_fetchers.get_exploration_by_id(
                exploration_id,
                version=metadata_version_history.last_edited_version_number
            )
            metadata_in_previous_version = exploration.get_metadata()

        self.render_json({
            'last_edited_version_number': (
                metadata_version_history.last_edited_version_number
            ),
            'last_edited_committer_username': user_services.get_username(
                metadata_version_history.last_edited_committer_id
            ),
            'metadata_dict_in_previous_version': (
                metadata_in_previous_version.to_dict()
                if metadata_in_previous_version is not None else None
            )
        })

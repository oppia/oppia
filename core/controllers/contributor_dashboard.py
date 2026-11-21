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

"""Controllers for the contributor dashboard page."""

from __future__ import annotations

import datetime
import json

from core import feature_flag_list, feconf
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    classroom_config_services,
    exp_domain,
    exp_fetchers,
    feature_flag_services,
    opportunity_domain,
    opportunity_services,
    skill_domain,
    skill_fetchers,
    suggestion_registry,
    suggestion_services,
    topic_fetchers,
    translation_domain,
    translation_fetchers,
    translation_services,
    user_services,
)

from typing import (
    Dict,
    List,
    Optional,
    Sequence,
    Tuple,
    TypedDict,
    Union,
)

ListOfContributorDashboardStatsTypes = Sequence[
    Union[
        suggestion_registry.TranslationContributionStats,
        suggestion_registry.TranslationReviewStats,
        suggestion_registry.QuestionContributionStats,
        suggestion_registry.QuestionReviewStats,
    ]
]


ListOfContributorDashboardStatsDictTypes = Sequence[
    Union[
        suggestion_registry.TranslationContributionStatsFrontendDict,
        suggestion_registry.TranslationReviewStatsFrontendDict,
        suggestion_registry.QuestionContributionStatsFrontendDict,
        suggestion_registry.QuestionReviewStatsFrontendDict,
    ]
]


class ClientSideSkillOpportunityDict(opportunity_domain.SkillOpportunityDict):
    """A dictionary representation of client side SkillOpportunity object."""

    topic_name: str
    questions_in_review_count: int


class ContributionOpportunitiesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ContributionOpportunitiesHandler's
    normalized_request dictionary.
    """

    cursor: Optional[str]
    language_code: Optional[str]
    topic_name: Optional[str]
    search_query: Optional[str]


class ContributionOpportunitiesHandler(
    base.BaseHandler[
        Dict[str, str], ContributionOpportunitiesHandlerNormalizedRequestDict
    ]
):
    """Provides data for opportunities available in different categories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'opportunity_type': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {'schema': {'type': 'basestring'}, 'default_value': None},
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                },
                'default_value': None,
            },
            'topic_name': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'search_query': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def get(self, opportunity_type: str) -> None:
        """Handles GET requests.

        Args:
            opportunity_type: str. The opportunity type.

        Raises:
            NotFoundException. The opportunity type is invalid.
            InvalidInputException. The language_code is invalid.
                This happens when the opportunity type is of type
                constant.OPPORTUNITY_TYPE_TRANSLATION and the
                language_code is set to None by normalized_request.
        """
        assert self.normalized_request is not None
        search_cursor = self.normalized_request.get('cursor')
        search_query = self.normalized_request.get('search_query')

        if opportunity_type == constants.OPPORTUNITY_TYPE_SKILL:
            opportunities, next_cursor, more = (
                self._get_skill_opportunities_with_corresponding_topic_name(
                    search_cursor, search_query
                )
            )
        else:
            raise self.NotFoundException

        self.values = {
            'opportunities': opportunities,
            'next_cursor': next_cursor,
            'more': more,
        }
        self.render_json(self.values)

    def _get_skill_opportunities_with_corresponding_topic_name(
        self, cursor: Optional[str], search_query: Optional[str] = None
    ) -> Tuple[List[ClientSideSkillOpportunityDict], Optional[str], bool]:
        """Returns a list of skill opportunities available for questions with
        a corresponding topic name.

        Args:
            cursor: str or None. If provided, the list of returned entities
                starts from this datastore cursor. Otherwise, the returned
                entities start from the beginning of the full list of entities.
            search_query: str or None. An optional string to filter skill
                opportunities by. It is a case-insensitive substring match
                for skill description or topic name.

        Returns:
            3-tuple(opportunities, cursor, more). where:
                opportunities: list(dict). A list of dicts of skill opportunity
                    details with additional corresponding topic_name.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        # We want to focus attention on lessons that are part of a classroom.
        # See issue #12221.
        classroom_topic_ids: List[str] = []
        classrooms = classroom_config_services.get_all_classrooms()
        for classroom in classrooms:
            classroom_topic_ids.extend(classroom.get_topic_ids())
        classroom_topics = topic_fetchers.get_topics_by_ids(classroom_topic_ids)
        # Associate each skill with one classroom topic name.
        # TODO(#8912): Associate each skill/skill opportunity with all linked
        # topics.
        classroom_topic_skill_id_to_topic_name = {}
        for topic in classroom_topics:
            if topic is None:
                continue
            for skill_id in topic.get_all_skill_ids():
                classroom_topic_skill_id_to_topic_name[skill_id] = topic.name

        skill_opportunities, cursor, more = (
            opportunity_services.get_skill_opportunities(cursor)
        )
        opportunities: List[ClientSideSkillOpportunityDict] = []
        # Fetch opportunities until we have at least a page's worth that
        # correspond to a classroom or there are no more opportunities.
        while len(opportunities) < constants.OPPORTUNITIES_PAGE_SIZE:
            for skill_opportunity in skill_opportunities:
                if (
                    skill_opportunity.id
                    in classroom_topic_skill_id_to_topic_name
                ):
                    skill_opportunity_dict = skill_opportunity.to_dict()
                    topic_name = classroom_topic_skill_id_to_topic_name[
                        skill_opportunity.id
                    ]
                    skill_description = skill_opportunity_dict[
                        'skill_description'
                    ]

                    # We filter here in the controller rather than the service/model layer because:
                    # 1. Datastore does not natively support case-insensitive substring matching.
                    # 2. SkillOpportunityModel does not store topic_name, so we must fetch the
                    #    paginated batch, map the topics, and filter them in memory.
                    # This performs a case-insensitive match on both the skill description and topic name.
                    if search_query is None or (
                        search_query.lower() in skill_description.lower()
                        or search_query.lower() in topic_name.lower()
                    ):
                        client_side_skill_opportunity_dict: (
                            ClientSideSkillOpportunityDict
                        ) = {
                            'id': skill_opportunity_dict['id'],
                            'skill_description': skill_description,
                            'question_count': skill_opportunity_dict[
                                'question_count'
                            ],
                            'topic_name': topic_name,
                            'questions_in_review_count': 0,
                        }
                        opportunities.append(client_side_skill_opportunity_dict)
            if (
                not more
                or len(opportunities) >= constants.OPPORTUNITIES_PAGE_SIZE
            ):
                break
            skill_opportunities, cursor, more = (
                opportunity_services.get_skill_opportunities(cursor)
            )

        skill_ids = [opp['id'] for opp in opportunities]
        skill_id_to_in_review_count = suggestion_services.get_question_suggestions_in_review_count_by_skill_ids(
            skill_ids
        )

        for opp in opportunities:
            opp['questions_in_review_count'] = skill_id_to_in_review_count.get(
                opp['id'], 0
            )

        return opportunities, cursor, more


class TranslationOpportunitiesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TranslationOpportunitiesHandler's
    normalized_request dictionary.
    """

    cursor: Optional[str]
    language_code: str
    topic_name: Optional[str]
    entity_type: str


class TranslationOpportunitiesHandler(
    base.BaseHandler[
        Dict[str, str], TranslationOpportunitiesHandlerNormalizedRequestDict
    ]
):
    """Provides data for translation opportunities."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {'schema': {'type': 'basestring'}, 'default_value': None},
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                },
            },
            'topic_name': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'entity_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.TRANSLATABLE_ENTITY_TYPES,
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None

        cursor = self.normalized_request.get('cursor')
        language_code = self.normalized_request['language_code']
        topic_name = self.normalized_request.get('topic_name')
        entity_type = self.normalized_request.get('entity_type')

        opportunities, next_cursor, more = (
            opportunity_services.get_translation_opportunities(
                entity_type, language_code, topic_name, cursor
            )
        )
        opportunity_dicts = [opp.to_dict() for opp in opportunities]

        self.values = {
            'opportunities': opportunity_dicts,
            'next_cursor': next_cursor,
            'more': more,
        }
        self.render_json(self.values)


class ReviewableOpportunitiesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ReviewableOpportunitiesHandler's
    normalized_request dictionary.
    """

    topic_name: Optional[str]
    language_code: Optional[str]
    entity_type: str


class ReviewableOpportunitiesHandler(
    base.BaseHandler[
        Dict[str, str], ReviewableOpportunitiesHandlerNormalizedRequestDict
    ]
):
    """Provides data for reviewable opportunities."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'topic_name': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'language_code': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'entity_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.TRANSLATABLE_ENTITY_TYPES,
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Fetches reviewable translation suggestions."""
        assert self.normalized_request is not None

        topic_name = self.normalized_request.get('topic_name', None)
        language = self.normalized_request.get('language_code')
        entity_type = self.normalized_request.get('entity_type')

        opportunity_dicts = []
        if self.user_id:
            for opp in self._get_reviewable_translation_opportunities(
                self.user_id, entity_type, topic_name, language
            ):
                opportunity_dicts.append(opp.to_dict())
        self.values = {
            'opportunities': opportunity_dicts,
        }
        self.render_json(self.values)

    def _get_reviewable_translation_opportunities(
        self,
        user_id: str,
        entity_type: Optional[str],
        topic_name: Optional[str],
        language: Optional[str],
    ) -> List[opportunity_domain.TranslationOpportunityCardInfo]:
        """Returns translation opportunities that have translation suggestions
        that are reviewable by the supplied user.

        Args:
            user_id: str. The user ID of the user.
            entity_type: str|None. The type of the entity to filter by. If
                None, opportunities of every translatable entity type are
                returned.
            topic_name: str|None. A topic name.
            language: str|None. ISO 639-1 language code.

        Returns:
            list(TranslationOpportunityCardInfo). A list of the matching
            translation opportunities.
        """
        # The dashboard sends an empty topic name when its topic filter is set
        # to "all", which means the same thing as sending no topic at all.
        if not topic_name:
            topic_name = None

        if topic_name is not None:
            topic = topic_fetchers.get_topic_by_name(topic_name)
            if topic is None:
                raise self.InvalidInputException(
                    'The supplied input topic: %s is not valid' % topic_name
                )

        in_review_suggestion_target_ids = suggestion_services.get_reviewable_translation_suggestion_target_ids(
            user_id, language, target_type=entity_type
        )

        if not in_review_suggestion_target_ids:
            return []

        if language is None:
            language = ''

        # An absent entity type means the dashboard's content type filter is
        # set to "all", so opportunities are gathered for every translatable
        # entity type instead of defaulting to one of them.
        entity_types_to_fetch = (
            [entity_type] if entity_type else feconf.TRANSLATABLE_ENTITY_TYPES
        )
        opportunities = []
        for entity_type_to_fetch in entity_types_to_fetch:
            opportunities.extend(
                opportunity_services.get_translation_opportunity_cards_by_entity_ids(
                    entity_type_to_fetch,
                    in_review_suggestion_target_ids,
                    language,
                )
            )

        filtered_opportunities = []
        for opp in opportunities:
            if topic_name is None or opp.topic_name == topic_name:
                filtered_opportunities.append(opp)

        return filtered_opportunities


class TranslatableContentsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TranslatableContentsHandler's
    normalized_request dictionary.
    """

    language_code: str
    entity_type: str
    entity_id: str


class TranslatableContentsHandler(
    base.BaseHandler[
        Dict[str, str], TranslatableContentsHandlerNormalizedRequestDict
    ]
):
    """Provides entity content which can be translated in a given language."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                }
            },
            'entity_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.TRANSLATABLE_ENTITY_TYPES,
                }
            },
            'entity_id': {'schema': {'type': 'basestring'}},
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None

        entity_type = self.normalized_request['entity_type']
        entity_id = self.normalized_request['entity_id']
        language_code = self.normalized_request['language_code']

        domain_object: Optional[
            Union[exp_domain.Exploration, skill_domain.Skill]
        ] = None
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            domain_object = exp_fetchers.get_exploration_by_id(
                entity_id, strict=False
            )
        elif entity_type == feconf.ENTITY_TYPE_SKILL:
            domain_object = skill_fetchers.get_skill_by_id(
                entity_id, strict=False
            )
        else:
            raise self.InvalidInputException(
                'Translation for entity_type %s is not supported yet.'
                % entity_type
            )

        if domain_object is None:
            raise self.InvalidInputException(
                'Invalid entity_id: %s' % entity_id
            )

        suggestions = []
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            suggestions = suggestion_services.get_translation_suggestions_in_review_by_exploration(
                entity_id, language_code
            )

        entity_translations = translation_fetchers.get_entity_translation(
            feconf.TranslatableEntityType(entity_type),
            entity_id,
            domain_object.version,
            language_code,
        )

        reviewable_language_codes = []
        if self.user_id:
            contribution_rights = user_services.get_user_contribution_rights(
                self.user_id
            )
            reviewable_language_codes = (
                contribution_rights.can_review_translation_for_language_codes
            )

        contents_which_need_translation = (
            domain_object.get_all_contents_which_need_translations(
                entity_translations
            )
        )

        content_id_to_grouping_key = {}
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            assert isinstance(domain_object, exp_domain.Exploration)
            for state_name, state in domain_object.states.items():
                translatable_contents_collection = (
                    state.get_translatable_contents_collection()
                )
                for (
                    content_id
                ) in (
                    translatable_contents_collection.content_id_to_translatable_content
                ):
                    content_id_to_grouping_key[content_id] = state_name

        translatable_contents = []
        for content in contents_which_need_translation.values():
            # Skip list-format content if the user does not have reviewer
            # rights for the selected language. Translating list contents
            # (such as answer choices) requires reviewer privileges.
            if (
                language_code not in reviewable_language_codes
                and content.is_data_format_list()
            ):
                continue

            # Skip content that already has a suggestion in review to
            # prevent duplicate translation submissions.
            if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
                if any(
                    s.change_cmd.content_id == content.content_id
                    for s in suggestions
                ):
                    continue

            content_dict = {
                'content_id': content.content_id,
                'content_type': content.content_type.value,
                'content_format': content.content_format.value,
                'content_value': content.content_value,
                'interaction_id': content.interaction_id,
                'rule_type': content.rule_type,
                'grouping_key': (
                    content_id_to_grouping_key.get(content.content_id)
                ),
            }

            translatable_contents.append(content_dict)

        self.values = {
            'version': domain_object.version,
            'translatable_contents': translatable_contents,
        }
        self.render_json(self.values)


class LessonsPinningHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of LessonsPinningHandler's
    normalized_request dictionary.
    """

    language_code: str
    topic_id: str
    opportunity_id: Optional[str]
    entity_type: str


class LessonsPinningHandler(
    base.BaseHandler[
        LessonsPinningHandlerNormalizedRequestDict,
        Dict[str, str],
    ]
):
    """Handler for pinning & unpinning lessons."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'language_code': {'schema': {'type': 'basestring'}},
            'topic_id': {'schema': {'type': 'basestring'}},
            'opportunity_id': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'entity_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.TRANSLATABLE_ENTITY_TYPES,
                },
                'default_value': feconf.ENTITY_TYPE_EXPLORATION,
            },
        },
    }

    @acl_decorators.open_access
    def put(self) -> None:
        """Handles pinning/unpinning lessons."""
        assert self.normalized_payload is not None
        assert self.user_id is not None
        topic_name = self.normalized_payload.get('topic_id')
        language_code = self.normalized_payload.get('language_code')
        opportunity_id = self.normalized_payload.get('opportunity_id')
        entity_type = self.normalized_payload['entity_type']
        if language_code and topic_name:
            topic = topic_fetchers.get_topic_by_name(topic_name)
            topic_id = topic.id
            opportunity_services.update_pinned_opportunity_model(
                self.user_id,
                language_code,
                topic_id,
                opportunity_id,
                entity_type=entity_type,
            )
        self.render_json(self.values)


class OpportunitiesCountHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of OpportunitiesCountHandler's
    normalized_request dictionary.
    """

    language_code: Optional[str]
    topic_name: Optional[str]
    entity_type: Optional[str]


class OpportunitiesCountHandler(
    base.BaseHandler[
        Dict[str, str], OpportunitiesCountHandlerNormalizedRequestDict
    ]
):
    """Provides counts for opportunities available in different categories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'opportunity_type': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                },
                'default_value': None,
            },
            'topic_name': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'entity_type': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
        }
    }

    @acl_decorators.open_access
    def get(self, opportunity_type: str) -> None:
        """Handles GET requests.

        Args:
            opportunity_type: str. The type of opportunity to count.

        Raises:
            NotFoundException. The opportunity_type is not valid.
        """
        if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_DROPDOWN_PAGINATION.value,
            self.user_id,
        ):
            raise self.NotFoundException

        assert self.normalized_request is not None
        language_code = self.normalized_request.get('language_code')
        topic_name = self.normalized_request.get('topic_name')
        entity_type = self.normalized_request.get('entity_type')

        if opportunity_type == constants.OPPORTUNITY_TYPE_SKILL:
            count = opportunity_services.get_skill_opportunities_count()
        elif opportunity_type == constants.OPPORTUNITY_TYPE_TRANSLATION:
            if language_code is None:
                raise self.InvalidInputException('language_code is required')

            count = opportunity_services.get_translation_opportunities_count(
                entity_type, language_code, topic_name
            )
        else:
            raise self.NotFoundException

        self.values = {'total_count': count}
        self.render_json(self.values)


class MachineTranslationStateTextsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of MachineTranslationStateTextsHandler's
    normalized_request dictionary.
    """

    exp_id: str
    state_name: str
    content_ids: str
    target_language_code: str


class MachineTranslationStateTextsHandler(
    base.BaseHandler[
        Dict[str, str], MachineTranslationStateTextsHandlerNormalizedRequestDict
    ]
):
    """Provides a machine translation of exploration content."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exp_id': {'schema': {'type': 'basestring'}},
            'state_name': {'schema': {'type': 'basestring'}},
            'content_ids': {'schema': {'type': 'basestring'}},
            'target_language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {'id': 'is_supported_audio_language_code'},
                        {'id': 'is_valid_audio_language_code'},
                    ],
                }
            },
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests. Responds with a mapping from content id to
        translation of form:

            dict('translated_texts', dict(str, str|None))

        If no translation is found for a given content id, that id is mapped to
        None.

        Params:
            exp_id: str. The ID of the exploration being translated.
            state_name: str. The name of the exploration state being translated.
            content_ids: str[]. The content IDs of the texts to be translated.
            target_language_code: str. The language code of the target
                translation language.

        Data Response:

            dict('translated_texts': dict(str, str|None))

            A dictionary containing the translated texts stored as a mapping
                from content ID to the translated text. If an error occured
                during retrieval of some content translations, but not others,
                failed translations are mapped to None.

        Raises:
            400 (Bad Request): InvalidInputException. At least one input is
                missing or improperly formatted.
            404 (Not Found): NotFoundException. At least one identifier does
                not correspond to an entry in the datastore.
        """
        assert self.normalized_request is not None
        exp_id = self.normalized_request['exp_id']

        state_name = self.normalized_request['state_name']

        content_ids_string = self.normalized_request['content_ids']
        content_ids: List[str] = []
        try:
            content_ids = json.loads(content_ids_string)
        except Exception as e:
            raise self.InvalidInputException(
                'Improperly formatted content_ids: %s' % content_ids_string
            ) from e

        target_language_code = self.normalized_request['target_language_code']

        exp = exp_fetchers.get_exploration_by_id(exp_id, strict=False)
        if exp is None:
            raise self.NotFoundException()
        state_names_to_content_id_mapping: Dict[
            str, Dict[str, translation_domain.TranslatableContent]
        ] = translation_services.get_translatable_text(
            exp, target_language_code
        )
        if state_name not in state_names_to_content_id_mapping:
            raise self.NotFoundException()
        content_id_to_translatable_item_mapping = (
            state_names_to_content_id_mapping[state_name]
        )
        translated_texts: Dict[str, Optional[str]] = {}
        for content_id in content_ids:
            if content_id not in content_id_to_translatable_item_mapping:
                translated_texts[content_id] = None
                continue

            source_text = content_id_to_translatable_item_mapping[
                content_id
            ].content_value

            # Machine translation supports strings, not lists of rule text.
            if isinstance(source_text, list):
                translated_texts[content_id] = None
                continue

            translated_texts[content_id] = (
                translation_services.get_and_cache_machine_translation(
                    exp.language_code, target_language_code, source_text
                )
            )

        self.values = {'translated_texts': translated_texts}
        self.render_json(self.values)


class UserContributionRightsDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides contribution rights of the logged in user in translation,
    voiceover and question category on the contributor dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        contribution_rights = None
        if self.username:
            # Here we are sure that 'user_id' is not None because
            # 'user_id' is recorded every time whenever a user claims
            # an authentication whereas 'username' is recorded iff the
            # user claims an authentication and successfully logged in.
            assert self.user_id is not None
            contribution_rights = user_services.get_user_contribution_rights(
                self.user_id
            )
        self.render_json(
            {
                'can_review_translation_for_language_codes': (
                    contribution_rights.can_review_translation_for_language_codes
                    if contribution_rights
                    else []
                ),
                'can_review_voiceover_for_language_codes': (
                    contribution_rights.can_review_voiceover_for_language_codes
                    if contribution_rights
                    else []
                ),
                'can_review_questions': (
                    contribution_rights.can_review_questions
                    if contribution_rights
                    else False
                ),
                'can_suggest_questions': (
                    (
                        contribution_rights.can_submit_questions
                        if contribution_rights
                        else False
                    )
                ),
            }
        )


class FeaturedTranslationLanguagesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides featured translation languages."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.render_json(
            {
                'featured_translation_languages': constants.FEATURED_TRANSLATION_LANGUAGES
            }
        )


class TranslatableTopicNamesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides names of all translatable topics in the datastore."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_names = [summary.name for summary in topic_summaries]
        self.values = {'topic_names': topic_names}
        self.render_json(self.values)


class TranslatableTopicDict(TypedDict):
    """Dict for a translatable topic and its translation completeness."""

    name: str
    id: str
    completeness: Optional[float]


class TranslatableTopicNamesPerClassroomHandlerDict(TypedDict):
    """A dictionary representing all topics associated to classroom."""

    classroom: str
    topics: List[TranslatableTopicDict]


class TranslatableTopicNamesPerClassroomHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TranslatableTopicNamesPerClassroomHandler's
    normalized_request dictionary.
    """

    language_code: Optional[str]


class TranslatableTopicNamesPerClassroomHandler(
    base.BaseHandler[
        Dict[str, str],
        TranslatableTopicNamesPerClassroomHandlerNormalizedRequestDict,
    ]
):
    """Provides names of all translatable topics associated with classroom in
    the datastore."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                },
                'default_value': None,
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Gets all translatable topics grouped by classroom, optionally.
        annotated with each topic's translation completeness for a language.
        """
        assert self.normalized_request is not None
        language_code = self.normalized_request.get('language_code')

        # Build mapping of topic IDs to classroom names.
        topic_id_to_classroom = {
            topic_id: classroom.name
            for classroom in classroom_config_services.get_all_classrooms()
            for topic_id in classroom.get_topic_ids()
        }

        topic_id_to_completeness: Dict[str, float] = {}
        if language_code is not None:
            topic_id_to_completeness = (
                opportunity_services.get_topic_id_to_translation_completeness(
                    language_code
                )
            )

        # Group topics by classroom and format response.
        topics_per_classroom: Dict[str, List[TranslatableTopicDict]] = {}
        for summary in topic_fetchers.get_all_topic_summaries():
            classroom_name = topic_id_to_classroom.get(summary.id, '')
            completeness = (
                topic_id_to_completeness.get(summary.id, 0)
                if language_code is not None
                else None
            )
            topics_per_classroom.setdefault(classroom_name, []).append(
                TranslatableTopicDict(
                    name=summary.name, id=summary.id, completeness=completeness
                )
            )

        if language_code is not None:
            for topics in topics_per_classroom.values():
                topics.sort(
                    key=lambda topic: (
                        -(topic['completeness'] or 0),
                        topic['name'].lower(),
                    )
                )
        self.values = {
            'topic_names_per_classroom': [
                TranslatableTopicNamesPerClassroomHandlerDict(
                    classroom=classroom, topics=topics
                )
                for classroom, topics in topics_per_classroom.items()
            ]
        }
        self.render_json(self.values)


class TranslationPreferenceHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TranslationPreferenceHandler's
    normalized_request dictionary.
    """

    language_code: str


class TranslationPreferenceHandler(
    base.BaseHandler[
        TranslationPreferenceHandlerNormalizedRequestDict, Dict[str, str]
    ]
):
    """Provides the preferred translation language in the
    contributor dashboard page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    # TODO(#15559): Rename 'is_supported_audio_language_code' and
    # 'SUPPORTED_AUDIO_LANGUAGES' constant to make sure that the name
    # clearly defines the purpose.
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                }
            }
        },
    }

    @acl_decorators.can_manage_own_account
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        user_settings = user_services.get_user_settings(self.user_id)
        return self.render_json(
            {
                'preferred_translation_language_code': (
                    user_settings.preferred_translation_language_code
                )
            }
        )

    @acl_decorators.can_manage_own_account
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        language_code = self.normalized_payload['language_code']
        user_settings = user_services.get_user_settings(self.user_id)
        user_settings.preferred_translation_language_code = language_code
        user_services.save_user_settings(user_settings)
        self.render_json({})


class ContributorStatsSummariesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Returns contribution statistics for the supplied contribution type."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'username': {'schema': {'type': 'basestring'}},
        'contribution_type': {'schema': {'type': 'basestring'}},
        'contribution_subtype': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_fetch_contributor_dashboard_stats
    def get(
        self, contribution_type: str, contribution_subtype: str, username: str
    ) -> None:
        """Handles GET requests.

        Args:
            contribution_type: str. The type of contribution to retrieve
                statistics for. This should be one of the following constants:
                - feconf.CONTRIBUTION_TYPE_TRANSLATION: For translation
                  contributions.
                - feconf.CONTRIBUTION_TYPE_QUESTION: For question
                  contributions.
            contribution_subtype: str. The subtype of contribution to retrieve
                statistics for. This should be one of the following constants:
                - feconf.CONTRIBUTION_SUBTYPE_SUBMISSION: For contributions made
                  as submissions.
                - feconf.CONTRIBUTION_SUBTYPE_REVIEW: For contributions made as
                  reviews.
            username: str. The username of the contributor whose statistics are
                to be fetched.

        Raises:
            InvalidInputException. The contribution type or the contribution
                subtype is invalid.
        """
        if contribution_type not in [
            feconf.CONTRIBUTION_TYPE_TRANSLATION,
            feconf.CONTRIBUTION_TYPE_QUESTION,
        ]:
            raise self.InvalidInputException(
                'Invalid contribution type %s.' % (contribution_type)
            )
        if contribution_subtype not in [
            feconf.CONTRIBUTION_SUBTYPE_SUBMISSION,
            feconf.CONTRIBUTION_SUBTYPE_REVIEW,
        ]:
            raise self.InvalidInputException(
                'Invalid contribution subtype %s.' % (contribution_subtype)
            )

        user_id = user_services.get_user_id_from_username(username)
        # Here we are sure that user_id will never be None, because
        # we are already handling the None case of user_id in
        # `can_fetch_contributor_dashboard_stats` decorator by
        # raising an exception.
        assert user_id is not None
        if contribution_type == feconf.CONTRIBUTION_TYPE_TRANSLATION:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                stats: ListOfContributorDashboardStatsTypes = (
                    suggestion_services.get_all_translation_contribution_stats(
                        user_id
                    )
                )
                self.values = {
                    'translation_contribution_stats': _get_client_side_stats(
                        stats
                    )
                }

            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                stats = suggestion_services.get_all_translation_review_stats(
                    user_id
                )
                self.values = {
                    'translation_review_stats': _get_client_side_stats(stats)
                }

        if contribution_type == feconf.CONTRIBUTION_TYPE_QUESTION:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                stats = suggestion_services.get_all_question_contribution_stats(
                    user_id
                )
                self.values = {
                    'question_contribution_stats': _get_client_side_stats(stats)
                }

            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                stats = suggestion_services.get_all_question_review_stats(
                    user_id
                )
                self.values = {
                    'question_review_stats': _get_client_side_stats(stats)
                }

        self.render_json(self.values)


class CertificateDataResponse(TypedDict):
    """Dict holding a ContributorCertificateInfoDict, or None to represent
    no contributor certificate information.
    """

    certificate_data: Optional[
        suggestion_registry.ContributorCertificateInfoDict
    ]


class ContributorCertificateHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Returns contributor certificate."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_USERNAME_LENGTH,
                    }
                ],
            }
        },
        'suggestion_type': {
            'schema': {
                'type': 'basestring',
                'choices': feconf.SUGGESTION_TYPE_CHOICES,
            }
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'from_date': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'is_regex_matched',
                            'regex_pattern': constants.DATE_REGEX,
                        }
                    ],
                }
            },
            'to_date': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'is_regex_matched',
                            'regex_pattern': constants.DATE_REGEX,
                        }
                    ],
                }
            },
            'language': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{'id': 'is_supported_audio_language_code'}],
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.can_fetch_all_contributor_dashboard_stats
    def get(self, username: str, suggestion_type: str) -> None:
        """Generates data for contributor certificates.

        Args:
            username: str. A user's username.
            suggestion_type: str. The suggestion type.
        """
        assert self.normalized_request is not None
        from_date = self.normalized_request['from_date']
        to_date = self.normalized_request['to_date']

        # When generating the question contributors' certificates, we do not
        # send language parameter. Hence, we will have to use
        # self.normalized_request.get('language') in order to get the default
        # value when language is not present in the request.
        language = self.normalized_request.get('language')

        from_datetime = datetime.datetime.strptime(from_date, '%Y-%m-%d')
        to_datetime = datetime.datetime.strptime(to_date, '%Y-%m-%d')
        if to_datetime.date() > datetime.datetime.now().date():
            raise self.InvalidInputException(
                'To date should not be a future date.'
            )

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                username, suggestion_type, language, from_datetime, to_datetime
            )
        )

        response: CertificateDataResponse = {
            'certificate_data': certificate_data
        }

        self.render_json(response)


class ContributorAllStatsSummariesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Returns all contribution statistics associated with the user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {'username': {'schema': {'type': 'basestring'}}}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_fetch_all_contributor_dashboard_stats
    def get(self, username: str) -> None:
        """Fetches stats for given contributor.

        Args:
            username: str. A user's username.
        """
        user_id = user_services.get_user_id_from_username(username)
        # Here we are sure that user_id will never be None, because
        # we are already handling the None case of user_id in
        # `can_fetch_all_contributor_dashboard_stats` decorator by
        # raising an exception.
        assert user_id is not None
        stats = suggestion_services.get_all_contributor_stats(user_id)
        response = {}

        if stats.translation_contribution_stats is not None:
            response['translation_contribution_stats'] = _get_client_side_stats(
                stats.translation_contribution_stats
            )

        if stats.translation_review_stats is not None:
            response['translation_review_stats'] = _get_client_side_stats(
                stats.translation_review_stats
            )

        if stats.question_contribution_stats is not None:
            response['question_contribution_stats'] = _get_client_side_stats(
                stats.question_contribution_stats
            )

        if stats.question_review_stats is not None:
            response['question_review_stats'] = _get_client_side_stats(
                stats.question_review_stats
            )

        self.render_json(response)


def _get_client_side_stats(
    backend_stats: ListOfContributorDashboardStatsTypes,
) -> ListOfContributorDashboardStatsDictTypes:
    """Returns corresponding stats dicts with all the necessary
    information for the frontend.

    Args:
        backend_stats: list. Stats domain objects.

    Returns:
        list. Dict representations of TranslationContributionStats/
        TranslationReviewStats/QuestionContributionStats/
        QuestionReviewStats domain objects with additional keys:
            topic_name: str. Topic name.
            contribution_months: str. Unique translation contribution
                months of format: "%b %Y", e.g. "Jan 2021".
        Unnecessary keys topic_id, contribution_dates, contributor_user_id
        are consequently deleted.

    Raises:
        Exception. No topic_id associated with stats object.
    """
    stats_dicts = [stats.to_frontend_dict() for stats in backend_stats]
    topic_ids = []
    for stats_dict in stats_dicts:
        topic_ids.append(stats_dict['topic_id'])
    topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
    topic_name_by_topic_id = {
        topic_summary.id: topic_summary.name
        for topic_summary in topic_summaries
        if topic_summary is not None
    }
    for stats_dict in stats_dicts:
        # Here we are asserting that 'stats_dict['topic_id']' will never be None
        # because above we are already handling the case of None 'topic_id' by
        # raising an exception.
        assert stats_dict['topic_id'] is not None
        # Here we use MyPy ignore because 'stats_dict' is of union TypedDicts
        # and MyPy is unable to infer on which TypedDict 'topic_name' key
        # is added. So, due to this MyPy throws an error. Thus, to avoid
        # the error, we use ignore here.
        stats_dict['topic_name'] = topic_name_by_topic_id.get(  # type: ignore[typeddict-item]
            stats_dict['topic_id'], 'UNKNOWN'
        )
        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        del stats_dict['topic_id']  # type: ignore[misc]
    return stats_dicts

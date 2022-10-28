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

import json

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import story_fetchers
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import translation_services
from core.domain import user_services

from typing import List, Union


class ContributorDashboardPage(base.BaseHandler):
    """Page showing the contributor dashboard."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        # TODO(#7402): Serve this page statically through app.yaml once
        # the CONTRIBUTOR_DASHBOARD_ENABLED flag is removed.
        if not config_domain.CONTRIBUTOR_DASHBOARD_IS_ENABLED.value:
            raise self.PageNotFoundException
        self.render_template('contributor-dashboard-page.mainpage.html')


class ContributionOpportunitiesHandler(base.BaseHandler):
    """Provides data for opportunities available in different categories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'opportunity_type': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            },
            'topic_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self, opportunity_type):
        """Handles GET requests."""
        if not config_domain.CONTRIBUTOR_DASHBOARD_IS_ENABLED.value:
            raise self.PageNotFoundException
        search_cursor = self.normalized_request.get('cursor')
        language_code = self.normalized_request.get('language_code')

        if opportunity_type == constants.OPPORTUNITY_TYPE_SKILL:
            opportunities, next_cursor, more = (
                self._get_skill_opportunities_with_corresponding_topic_name(
                    search_cursor))

        elif opportunity_type == constants.OPPORTUNITY_TYPE_TRANSLATION:
            topic_name = self.normalized_request.get('topic_name')
            if language_code is None:
                raise self.InvalidInputException
            opportunities, next_cursor, more = (
                self._get_translation_opportunity_dicts(
                    language_code, topic_name, search_cursor))

        else:
            raise self.PageNotFoundException

        self.values = {
            'opportunities': opportunities,
            'next_cursor': next_cursor,
            'more': more
        }
        self.render_json(self.values)

    def _get_skill_opportunities_with_corresponding_topic_name(self, cursor):
        """Returns a list of skill opportunities available for questions with
        a corresponding topic name.

        Args:
            cursor: str or None. If provided, the list of returned entities
                starts from this datastore cursor. Otherwise, the returned
                entities start from the beginning of the full list of entities.

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
        classroom_topic_ids = []
        for classroom_dict in config_domain.CLASSROOM_PAGES_DATA.value:
            classroom_topic_ids.extend(classroom_dict['topic_ids'])
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
            opportunity_services.get_skill_opportunities(cursor))
        opportunities = []
        # Fetch opportunities until we have at least a page's worth that
        # correspond to a classroom or there are no more opportunities.
        while len(opportunities) < constants.OPPORTUNITIES_PAGE_SIZE:
            for skill_opportunity in skill_opportunities:
                if (
                        skill_opportunity.id
                        in classroom_topic_skill_id_to_topic_name):
                    skill_opportunity_dict = skill_opportunity.to_dict()
                    skill_opportunity_dict['topic_name'] = (
                        classroom_topic_skill_id_to_topic_name[
                            skill_opportunity.id])
                    opportunities.append(skill_opportunity_dict)
            if (
                    not more or
                    len(opportunities) >= constants.OPPORTUNITIES_PAGE_SIZE):
                break
            skill_opportunities, cursor, more = (
                opportunity_services.get_skill_opportunities(cursor))

        return opportunities, cursor, more

    def _get_translation_opportunity_dicts(
            self, language_code, topic_name, search_cursor):
        """Returns a list of translation opportunity dicts.

        Args:
            language_code: str. The language for which translation opportunities
                should be fetched.
            topic_name: str or None. The topic for which translation
                opportunities should be fetched. If topic_name is None or empty,
                fetch translation opportunities from all topics.
            search_cursor: str or None. If provided, the list of returned
                entities starts from this datastore cursor. Otherwise, the
                returned entities start from the beginning of the full list of
                entities.

        Returns:
            3-tuple(opportunities, cursor, more). where:
            opportunities: list(dict). A list of ExplorationOpportunitySummary
                dicts.
            cursor: str or None. A query cursor pointing to the next batch of
                results. If there are no more results, this might be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
        """
        opportunities, next_cursor, more = (
            opportunity_services.get_translation_opportunities(
                language_code, topic_name, search_cursor))
        opportunity_dicts = [opp.to_dict() for opp in opportunities]
        return opportunity_dicts, next_cursor, more


class ReviewableOpportunitiesHandler(base.BaseHandler):
    """Provides opportunities that have translation suggestions in review."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'topic_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        topic_name = self.normalized_request.get('topic_name')
        opportunity_dicts = [
            opp.to_dict()
            for opp in self
                ._get_reviewable_exploration_opportunity_summaries(
                    self.user_id, topic_name)]
        self.values = {
            'opportunities': opportunity_dicts,
        }
        self.render_json(self.values)

    def _get_reviewable_exploration_opportunity_summaries(
        self, user_id, topic_name
    ):
        """Returns exploration opportunity summaries that have translation
        suggestions that are reviewable by the supplied user. The result is
        sorted in descending order by topic, story, and story node order.

        Args:
            user_id: str. The user ID of the user for which to filter
                translation suggestions.
            topic_name: str. A topic name for which to filter the exploration
                opportunity summaries. If 'All' is supplied, all available
                exploration opportunity summaries will be returned.

        Returns:
            list(ExplorationOpportunitySummary). A list of the matching
            exploration opportunity summaries.
        """
        # 1. Fetch the eligible topics.
        # 2. Fetch the stories for the topics.
        # 3. Get the reviewable translation suggestion target IDs for the user.
        # 4. Get story exploration nodes in order, filtering for explorations
        # that have in review translation suggestions.
        if topic_name is None:
            topics = topic_fetchers.get_all_topics()
        else:
            topic = topic_fetchers.get_topic_by_name(topic_name)
            if topic is None:
                raise self.InvalidInputException(
                    'The supplied input topic: %s is not valid' % topic_name)
            topics = [topic]
        topic_stories = story_fetchers.get_stories_by_ids([
            reference.story_id
            for topic in topics
            for reference in topic.get_all_story_references()
            if reference.story_is_published])
        topic_exp_ids = [
            node.exploration_id
            for story in topic_stories
            for node in story.story_contents.get_ordered_nodes()
        ]
        in_review_suggestions, _ = (
            suggestion_services
            .get_reviewable_translation_suggestions_by_offset(
                user_id, topic_exp_ids, None, 0))
        # Filter out suggestions that should not be shown to the user.
        # This is defined as a set as we only care about the unique IDs.
        in_review_suggestion_target_ids = {
            suggestion.target_id
            for suggestion in
            suggestion_services.get_suggestions_with_translatable_explorations(
                in_review_suggestions)
        }
        exp_ids = [
            exp_id
            for exp_id in topic_exp_ids
            if exp_id in in_review_suggestion_target_ids
        ]
        return (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                exp_ids).values())


class TranslatableTextHandler(base.BaseHandler):
    """Provides lessons content which can be translated in a given language."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                }
            },
            'exp_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        language_code = self.normalized_request.get('language_code')
        exp_id = self.normalized_request.get('exp_id')

        if not opportunity_services.is_exploration_available_for_contribution(
                exp_id):
            raise self.InvalidInputException('Invalid exp_id: %s' % exp_id)

        exp = exp_fetchers.get_exploration_by_id(exp_id)
        state_names_to_content_id_mapping = exp.get_translatable_text(
            language_code)
        contribution_rights = user_services.get_user_contribution_rights(
            self.user_id)
        reviewable_language_codes = (
            contribution_rights.can_review_translation_for_language_codes)
        if language_code not in reviewable_language_codes:
            state_names_to_content_id_mapping = (
                self._get_state_names_to_not_set_content_id_mapping(
                    state_names_to_content_id_mapping
                ))
        state_names_to_not_in_review_content_id_mapping = (
            self._get_state_names_to_not_in_review_content_id_mapping(
                state_names_to_content_id_mapping,
                suggestion_services
                .get_translation_suggestions_in_review_by_exploration(
                    exp_id, language_code)
            )
        )
        self.values = {
            'state_names_to_content_id_mapping': (
                state_names_to_not_in_review_content_id_mapping),
            'version': exp.version
        }

        self.render_json(self.values)

    def _get_state_names_to_not_set_content_id_mapping(
            self, state_names_to_content_id_mapping):
        """Returns a copy of the supplied state_names_to_content_id_mapping
        minus any contents of which the data is set of strings.

        Args:
            state_names_to_content_id_mapping:
                dict(str, dict(str, TranslatableItem)). A dict whose keys are
                state names, and whose corresponding values are each dicts
                mapping content IDs to the corresponding translatable items.

        Returns:
            dict(str, dict(str, TranslatableItem)). A dict where state_name
            is the key and a dict with content_id as the key and
            TranslatableItem as value.
        """
        mapping_without_set_data_format = {}
        for state_name in state_names_to_content_id_mapping:
            content_id_to_translatable_item = (
                state_names_to_content_id_mapping[state_name])
            content_id_to_not_set_translatable_item = {}
            for content_id, translatable_item in (
                    content_id_to_translatable_item.items()):
                if not translatable_item.is_set_data_format():
                    content_id_to_not_set_translatable_item[content_id] = (
                        translatable_item)
            if content_id_to_not_set_translatable_item:
                mapping_without_set_data_format[state_name] = (
                    content_id_to_not_set_translatable_item)
        return mapping_without_set_data_format

    def _get_state_names_to_not_in_review_content_id_mapping(
            self, state_names_to_content_id_mapping, suggestions):
        """Returns a copy of the supplied state_names_to_content_id_mapping
        minus any contents found in suggestions.

        Args:
            state_names_to_content_id_mapping:
                dict(str, dict(str, TranslatableItem)). A dict whose keys are
                state names, and whose corresponding values are each dicts
                mapping content IDs to the corresponding translatable items.
            suggestions: list(Suggestion). A list of translation suggestions.

        Returns:
            dict(str, dict(str, TranslatableItem)). A dict where state_name
            is the key and a dict with content_id as the key and
            TranslatableItem as value.
        """
        final_mapping = {}
        for state_name in state_names_to_content_id_mapping:
            content_id_to_translatable_item = dict(
                state_names_to_content_id_mapping[state_name])
            content_id_to_unsubmitted_translatable_item = {}
            for content_id, item in content_id_to_translatable_item.items():
                if not self._is_content_in_review(
                        state_name, content_id, suggestions):
                    content_id_to_unsubmitted_translatable_item[content_id] = (
                        item)
            if content_id_to_unsubmitted_translatable_item:
                final_mapping[state_name] = {
                    cid: translatable_item.to_dict()
                    for cid, translatable_item in (
                        content_id_to_unsubmitted_translatable_item.items())
                }
        return final_mapping

    def _is_content_in_review(self, state_name, content_id, suggestions):
        """Returns whether a suggestion exists in suggestions with a change dict
        matching the supplied state_name and content_id.

        Args:
            state_name: str. Exploration state name.
            content_id: str. Content ID.
            suggestions: list(Suggestion). A list of translation suggestions.

        Returns:
            bool. True if suggestion exists in suggestions with a change dict
            matching state_name and content_id, False otherwise.
        """
        return any(
            s.change.state_name == state_name and
            s.change.content_id == content_id for s in suggestions)


class MachineTranslationStateTextsHandler(base.BaseHandler):
    """Provides a machine translation of exploration content."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exp_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'content_ids': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'target_language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }, {
                        'id': 'is_valid_audio_language_code'
                    }]
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self):
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
            404 (Not Found): PageNotFoundException. At least one identifier does
                not correspond to an entry in the datastore.
        """
        exp_id = self.normalized_request.get('exp_id')

        state_name = self.normalized_request.get('state_name')

        content_ids_string = self.normalized_request.get('content_ids')
        content_ids = []
        try:
            content_ids = json.loads(content_ids_string)
        except Exception as e:
            raise self.InvalidInputException(
                'Improperly formatted content_ids: %s' % content_ids_string
            ) from e

        target_language_code = self.normalized_request.get(
            'target_language_code')

        exp = exp_fetchers.get_exploration_by_id(exp_id, strict=False)
        if exp is None:
            raise self.PageNotFoundException()
        state_names_to_content_id_mapping = exp.get_translatable_text(
            target_language_code)
        if state_name not in state_names_to_content_id_mapping:
            raise self.PageNotFoundException()
        content_id_to_translatable_item_mapping = (
            state_names_to_content_id_mapping[state_name])
        translated_texts = {}
        for content_id in content_ids:
            if content_id not in content_id_to_translatable_item_mapping:
                translated_texts[content_id] = None
                continue

            source_text = content_id_to_translatable_item_mapping[
                content_id].content
            translated_texts[content_id] = (
                translation_services.get_and_cache_machine_translation(
                    exp.language_code, target_language_code, source_text)
            )

        self.values = {
            'translated_texts': translated_texts
        }
        self.render_json(self.values)


class UserContributionRightsDataHandler(base.BaseHandler):
    """Provides contribution rights of the logged in user in translation,
    voiceover and question category on the contributor dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        contribution_rights = None
        if self.username:
            contribution_rights = user_services.get_user_contribution_rights(
                self.user_id)
        self.render_json({
            'can_review_translation_for_language_codes': (
                contribution_rights.can_review_translation_for_language_codes
                if contribution_rights else []),
            'can_review_voiceover_for_language_codes': (
                contribution_rights.can_review_voiceover_for_language_codes
                if contribution_rights else []),
            'can_review_questions': (
                contribution_rights.can_review_questions
                if contribution_rights else False),
            'can_suggest_questions': (
                (contribution_rights.can_submit_questions
                 if contribution_rights else False))
        })


class FeaturedTranslationLanguagesHandler(base.BaseHandler):
    """Provides featured translation languages set in admin config."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_json({
            'featured_translation_languages':
                config_domain.FEATURED_TRANSLATION_LANGUAGES.value
        })


class TranslatableTopicNamesHandler(base.BaseHandler):
    """Provides names of all translatable topics in the datastore."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        # Only published topics are translatable.
        topic_summaries = topic_fetchers.get_published_topic_summaries()
        topic_names = [summary.name for summary in topic_summaries]
        self.values = {
            'topic_names': topic_names
        }
        self.render_json(self.values)


class TranslationPreferenceHandler(base.BaseHandler):
    """Provides the preferred translation language in the
    contributor dashboard page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    # TODO(#15559): Rename 'is_supported_audio_language_code' and
    # 'SUPPORTED_AUDIO_LANGUAGES' constant to make sure that the name
    # clearly defines the purpose.
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                }
            }
        }
    }

    @acl_decorators.can_manage_own_account
    def get(self):
        """Handles GET requests."""
        user_settings = user_services.get_user_settings(self.user_id)
        return self.render_json({
            'preferred_translation_language_code': (
                user_settings.preferred_translation_language_code)
        })

    @acl_decorators.can_manage_own_account
    def post(self):
        """Handles POST requests."""
        language_code = self.normalized_payload.get('language_code')
        user_services.update_preferred_translation_language_code(
            self.user_id, language_code)
        self.render_json({})


class ContributorStatsSummariesHandler(base.BaseHandler):
    """Returns contribution statistics for the supplied contribution type."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring'
            }
        },
        'contribution_type': {
            'schema': {
                'type': 'basestring'
            }
        },
        'contribution_subtype': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_fetch_contributor_dashboard_stats
    def get(self, contribution_type, contribution_subtype, username):
        """Handles GET requests."""
        if contribution_type not in [
            feconf.CONTRIBUTION_TYPE_TRANSLATION,
            feconf.CONTRIBUTION_TYPE_QUESTION
        ]:
            raise self.InvalidInputException(
                'Invalid contribution type %s.' % (contribution_type)
            )
        if contribution_subtype not in [
            feconf.CONTRIBUTION_SUBTYPE_SUBMISSION,
            feconf.CONTRIBUTION_SUBTYPE_REVIEW
        ]:
            raise self.InvalidInputException(
                'Invalid contribution subtype %s.' % (contribution_subtype)
            )

        user_id = user_services.get_user_id_from_username(username)

        if contribution_type == feconf.CONTRIBUTION_TYPE_TRANSLATION:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                stats = (
                    suggestion_services.get_all_translation_contribution_stats(
                        user_id))
                self.values = {
                    'translation_contribution_stats': _get_client_side_stats(
                        stats)
                }

            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                stats = suggestion_services.get_all_translation_review_stats(
                    user_id)
                self.values = {
                    'translation_review_stats': _get_client_side_stats(
                        stats)
                }

        if contribution_type == feconf.CONTRIBUTION_TYPE_QUESTION:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                stats = suggestion_services.get_all_question_contribution_stats(
                    user_id)
                self.values = {
                    'question_contribution_stats': _get_client_side_stats(
                        stats)
                }

            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                stats = suggestion_services.get_all_question_review_stats(
                    user_id)
                self.values = {
                    'question_review_stats': _get_client_side_stats(stats)
                }

        self.render_json(self.values)


class ContributorAllStatsSummariesHandler(base.BaseHandler):
    """Returns all contribution statistics associated with the user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_fetch_all_contributor_dashboard_stats
    def get(self, username):
        """Handles GET requests."""
        user_id = user_services.get_user_id_from_username(username)

        stats = suggestion_services.get_all_contributor_stats(user_id)
        response = {}

        if stats.translation_contribution_stats is not None:
            response['translation_contribution_stats'] = _get_client_side_stats(
                stats.translation_contribution_stats)

        if stats.translation_review_stats is not None:
            response['translation_review_stats'] = _get_client_side_stats(
                stats.translation_review_stats)

        if stats.question_contribution_stats is not None:
            response['question_contribution_stats'] = _get_client_side_stats(
                stats.question_contribution_stats)

        if stats.question_review_stats is not None:
            response['question_review_stats'] = _get_client_side_stats(
                stats.question_review_stats)

        self.render_json(response)


def _get_client_side_stats(
    backend_stats: List[Union[
        suggestion_registry.TranslationContributionStats,
        suggestion_registry.TranslationReviewStats,
        suggestion_registry.QuestionContributionStats,
        suggestion_registry.QuestionReviewStats
    ]]
):
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
    """
    stats_dicts = [
        stats.to_dict() for stats in backend_stats
    ]
    topic_ids = [
        stats_dict['topic_id']
        for stats_dict in stats_dicts
    ]
    topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
    topic_name_by_topic_id = {
        topic_summary.id: topic_summary.name
        for topic_summary in topic_summaries if topic_summary is not None
    }
    for stats_dict in stats_dicts:
        stats_dict['topic_name'] = topic_name_by_topic_id.get(
            stats_dict['topic_id'], 'UNKNOWN')

        # TODO(#16051): TranslationContributionStats to use
        # first_contribution_date and last_contribution_date.
        if 'contribution_dates' in stats_dict.keys():
            sorted_contribution_dates = sorted(stats_dict['contribution_dates'])
            first_contribution_date = sorted_contribution_dates[0]
            last_contribution_date = sorted_contribution_dates[-1]
            del stats_dict['contribution_dates']
        else:
            first_contribution_date = stats_dict['first_contribution_date']
            last_contribution_date = stats_dict['last_contribution_date']
        stats_dict['first_contribution_date'] = (
            first_contribution_date.strftime('%b %Y'))
        stats_dict['last_contribution_date'] = (
            last_contribution_date.strftime('%b %Y'))

        del stats_dict['topic_id']
        del stats_dict['contributor_user_id']
    return stats_dicts

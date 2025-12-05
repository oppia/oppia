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

"""Controllers for the library page."""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Sequence, Tuple, TypedDict, Union

from core import feconf, utils
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    collection_services,
    exp_services,
    summary_services,
    user_services,
)

# Shared types.


# Shared types.
UnionSummaryDictType = Union[
    summary_services.DisplayableExplorationSummaryDict,
    summary_services.DisplayableCollectionSummaryDict,
]


# Utility function.
def get_matching_activity_dicts(
    query_string: str,
    categories: List[str],
    language_codes: List[str],
    search_offset: Optional[int],
) -> Tuple[Sequence[UnionSummaryDictType], Optional[int]]:
    """Returns list of activities that match search query and filters."""
    collection_ids: List[str] = []

    if not search_offset:
        collection_ids, _ = (
            collection_services.get_collection_ids_matching_query(
                query_string, categories, language_codes
            )
        )

    exp_ids, new_offset = exp_services.get_exploration_ids_matching_query(
        query_string, categories, language_codes, offset=search_offset
    )

    results: List[UnionSummaryDictType] = []

    for (
        col
    ) in summary_services.get_displayable_collection_summary_dicts_matching_ids(
        collection_ids
    ):
        results.append(col)

    for exp in summary_services.get_displayable_exp_summary_dicts_matching_ids(
        exp_ids
    ):
        results.append(exp)

    if len(results) == feconf.DEFAULT_QUERY_LIMIT:
        logging.exception(
            '%s results fetched - possible query limit edge-case.',
            feconf.DEFAULT_QUERY_LIMIT,
        )

    return results, new_offset


# Redirect handlers.
class OldLibraryRedirectPage(base.BaseHandler):
    """Redirects old /library URL to the new community library."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        self.redirect(feconf.LIBRARY_INDEX_URL, permanent=True)


class LibraryRedirectPage(base.BaseHandler):
    """Redirects old /gallery URL to /community-library."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        self.redirect('/community-library')


# Library index page.
class LibraryIndexHandler(base.BaseHandler):
    """Provides data for the main community library page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self) -> None:
        summary_groups = summary_services.get_library_groups(
            [constants.DEFAULT_LANGUAGE_CODE]
        )

        top_rated = summary_services.get_top_rated_exploration_summary_dicts(
            [constants.DEFAULT_LANGUAGE_CODE],
            feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE,
        )

        featured = summary_services.get_featured_activity_summary_dicts(
            [constants.DEFAULT_LANGUAGE_CODE]
        )

        preferred_langs = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            preferred_langs = user_services.get_user_settings(
                self.user_id
            ).preferred_language_codes

        if top_rated:
            summary_groups.insert(
                0,
                {
                    'activity_summary_dicts': top_rated,
                    'categories': [],
                    'header_i18n_id': feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS,
                    'has_full_results_page': True,
                    'full_results_url': feconf.LIBRARY_TOP_RATED_URL,
                },
            )

        if featured:
            summary_groups.insert(
                0,
                {
                    'activity_summary_dicts': featured,
                    'categories': [],
                    'header_i18n_id': feconf.LIBRARY_CATEGORY_FEATURED_ACTIVITIES,
                    'has_full_results_page': False,
                    'full_results_url': None,
                },
            )

        self.values.update(
            {
                'activity_summary_dicts_by_category': summary_groups,
                'preferred_language_codes': preferred_langs,
            }
        )

        self.render_json(self.values)


# Library group page.
class LibraryGroupIndexHandlerNormalizedRequestDict(TypedDict):
    """Normalized request format for LibraryGroupIndexHandler."""

    group_name: str


class LibraryGroupIndexHandler(
    base.BaseHandler[
        Dict[str, str], LibraryGroupIndexHandlerNormalizedRequestDict
    ]
):
    """Returns activities for top rated or recently published groups."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'group_name': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED,
                        feconf.LIBRARY_GROUP_TOP_RATED,
                    ],
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        assert self.normalized_request is not None
        group = self.normalized_request['group_name']

        if group == feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED:
            activity_list = (
                summary_services.get_recently_published_exp_summary_dicts(
                    feconf.RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE
                )
            )
            header = feconf.LIBRARY_CATEGORY_RECENTLY_PUBLISHED

        else:
            activity_list = (
                summary_services.get_top_rated_exploration_summary_dicts(
                    [constants.DEFAULT_LANGUAGE_CODE],
                    feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FULL_PAGE,
                )
            )
            header = feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS

        preferred_langs = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            preferred_langs = user_services.get_user_settings(
                self.user_id
            ).preferred_language_codes

        self.values.update(
            {
                'activity_list': activity_list,
                'header_i18n_id': header,
                'preferred_language_codes': preferred_langs,
            }
        )
        self.render_json(self.values)


# Exploration summaries.
class ExplorationSummariesHandlerNormalizedRequestDict(TypedDict):
    """Normalized request dictionary for ExplorationSummariesHandler."""

    stringified_exp_ids: str
    include_private_explorations: Optional[bool]


class ExplorationSummariesHandler(
    base.BaseHandler[
        Dict[str, str], ExplorationSummariesHandlerNormalizedRequestDict
    ]
):
    """Returns summaries for exploration IDs."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'stringified_exp_ids': {
                'schema': {'type': 'custom', 'obj_type': 'JsonEncodedInString'}
            },
            'include_private_explorations': {
                'schema': {'type': 'bool'},
                'default_value': False,
            },
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        assert self.normalized_request is not None

        exp_ids = self.normalized_request['stringified_exp_ids']
        include_private = self.normalized_request.get(
            'include_private_explorations', False
        )

        if not isinstance(exp_ids, list) or not all(
            isinstance(i, str) for i in exp_ids
        ):
            raise self.NotFoundException

        if include_private and self.user_id:
            summaries = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    exp_ids, user=self.user
                )
            )
        else:
            summaries = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    exp_ids
                )
            )

        self.values.update({'summaries': summaries})
        self.render_json(self.values)


# Collection summaries.
class CollectionSummariesHandlerNormalizedRequestDict(TypedDict):
    """Normalized request dictionary for CollectionSummariesHandler."""

    stringified_collection_ids: List[str]


class CollectionSummariesHandler(
    base.BaseHandler[
        Dict[str, str], CollectionSummariesHandlerNormalizedRequestDict
    ]
):
    """Returns summaries for collections."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'stringified_collection_ids': {
                'schema': {'type': 'custom', 'obj_type': 'JsonEncodedInString'}
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        assert self.normalized_request is not None

        collection_ids = self.normalized_request['stringified_collection_ids']

        summaries = summary_services.get_displayable_collection_summary_dicts_matching_ids(
            collection_ids
        )

        self.values.update({'summaries': summaries})
        self.render_json(self.values)


# Search handler.
class SearchHandlerNormalizedRequestDict(TypedDict):
    """Normalized request dict for SearchHandler."""

    q: str
    category: str
    language_code: str
    offset: Optional[int]


class SearchHandler(
    base.BaseHandler[Dict[str, str], SearchHandlerNormalizedRequestDict]
):
    """Provides search results for explorations and collections."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'q': {'schema': {'type': 'basestring'}, 'default_value': ''},
            'category': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {'id': 'is_search_query_string'},
                        {
                            'id': 'is_regex_matched',
                            'regex_pattern': r'[\\-\\w+()\"\\s]*',
                        },
                    ],
                },
                'default_value': '',
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {'id': 'is_search_query_string'},
                        {
                            'id': 'is_regex_matched',
                            'regex_pattern': r'[\\-\\w+()\"\\s]*',
                        },
                    ],
                },
                'default_value': '',
            },
            'offset': {'schema': {'type': 'int'}, 'default_value': None},
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Returns search results based on query and filters."""
        assert self.normalized_request is not None

        query_string = utils.get_formatted_query_string(
            self.normalized_request['q']
        )

        categories = utils.convert_filter_parameter_string_into_list(
            self.normalized_request['category']
        )

        language_codes = utils.convert_filter_parameter_string_into_list(
            self.normalized_request['language_code']
        )

        search_offset = self.normalized_request.get('offset')

        results, new_offset = get_matching_activity_dicts(
            query_string, categories, language_codes, search_offset
        )

        self.values.update(
            {
                'activity_list': results,
                'search_cursor': new_offset,
            }
        )
        self.render_json(self.values)

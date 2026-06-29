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

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import summary_services, user_services

from typing import Dict, List, Optional, TypedDict


class OldLibraryRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Redirects the old library URL to the new one."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect(feconf.LIBRARY_INDEX_URL, permanent=True)


class LibraryIndexHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides data for the default library index page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        # TODO(sll): Support index pages for other language codes.
        summary_dicts_by_category = summary_services.get_library_groups(
            [constants.DEFAULT_LANGUAGE_CODE]
        )
        top_rated_activity_summary_dicts = (
            summary_services.get_top_rated_exploration_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE],
                feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE,
            )
        )
        featured_activity_summary_dicts = (
            summary_services.get_featured_activity_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE]
            )
        )

        preferred_language_codes = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        if top_rated_activity_summary_dicts:
            # Here we use MyPy ignore because here we are adding a new
            # 'protractor_id' key on a TypedDict dictionary, and addition
            # of any new key on typedDict is prohibited by MyPy.
            summary_dicts_by_category.insert(
                0,
                {
                    'activity_summary_dicts': top_rated_activity_summary_dicts,
                    'categories': [],
                    'header_i18n_id': (
                        feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS
                    ),
                    'has_full_results_page': True,
                    'full_results_url': feconf.LIBRARY_TOP_RATED_URL,
                    'protractor_id': 'top-rated',  # type: ignore[typeddict-item]
                },
            )
        if featured_activity_summary_dicts:
            summary_dicts_by_category.insert(
                0,
                {
                    'activity_summary_dicts': featured_activity_summary_dicts,
                    'categories': [],
                    'header_i18n_id': (
                        feconf.LIBRARY_CATEGORY_FEATURED_ACTIVITIES
                    ),
                    'has_full_results_page': False,
                    'full_results_url': None,
                },
            )

        self.values.update(
            {
                'activity_summary_dicts_by_category': (
                    summary_dicts_by_category
                ),
                'preferred_language_codes': preferred_language_codes,
            }
        )
        self.render_json(self.values)


class LibraryGroupIndexHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of LibraryGroupIndexHandler's
    normalized_request dictionary.
    """

    group_name: str


class LibraryGroupIndexHandler(
    base.BaseHandler[
        Dict[str, str], LibraryGroupIndexHandlerNormalizedRequestDict
    ]
):
    """Provides data for categories such as top rated and recently published."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
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
        """Handles GET requests for group pages."""
        # TODO(sll): Support index pages for other language codes.
        assert self.normalized_request is not None
        group_name = self.normalized_request['group_name']
        activity_list = []
        header_i18n_id = ''

        if group_name == feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED:
            recently_published_summary_dicts = (
                summary_services.get_recently_published_exp_summary_dicts(
                    feconf.RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE
                )
            )
            if recently_published_summary_dicts:
                activity_list = recently_published_summary_dicts
                header_i18n_id = feconf.LIBRARY_CATEGORY_RECENTLY_PUBLISHED

        else:
            top_rated_activity_summary_dicts = (
                summary_services.get_top_rated_exploration_summary_dicts(
                    [constants.DEFAULT_LANGUAGE_CODE],
                    feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FULL_PAGE,
                )
            )
            if top_rated_activity_summary_dicts:
                activity_list = top_rated_activity_summary_dicts
                header_i18n_id = feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS

        preferred_language_codes = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        self.values.update(
            {
                'activity_list': activity_list,
                'header_i18n_id': header_i18n_id,
                'preferred_language_codes': preferred_language_codes,
            }
        )
        self.render_json(self.values)


class LibraryRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """An old 'gallery' page that should redirect to the library index page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect('/community-library')


class ExplorationSummariesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ExplorationSummariesHandler's
    normalized_request dictionary.
    """

    stringified_exp_ids: str
    include_private_explorations: Optional[bool]


class ExplorationSummariesHandler(
    base.BaseHandler[
        Dict[str, str], ExplorationSummariesHandlerNormalizedRequestDict
    ]
):
    """Returns summaries corresponding to ids of public explorations. This
    controller supports returning private explorations for the given user.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
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
        """Handles GET requests."""
        assert self.normalized_request is not None
        exp_ids = self.normalized_request['stringified_exp_ids']
        include_private_exps = self.normalized_request.get(
            'include_private_explorations'
        )

        editor_user_id = self.user_id if include_private_exps else None
        if not editor_user_id:
            include_private_exps = False

        if not isinstance(exp_ids, list) or not all(
            isinstance(exp_id, str) for exp_id in exp_ids
        ):
            raise self.NotFoundException

        if include_private_exps:
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


class CollectionSummariesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of CollectionSummariesHandler's
    normalized_request dictionary.
    """

    stringified_collection_ids: List[str]


class CollectionSummariesHandler(
    base.BaseHandler[
        Dict[str, str], CollectionSummariesHandlerNormalizedRequestDict
    ]
):
    """Returns collection summaries corresponding to collection ids."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'stringified_collection_ids': {
                'schema': {'type': 'custom', 'obj_type': 'JsonEncodedInString'}
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        collection_ids = self.normalized_request['stringified_collection_ids']

        summaries = summary_services.get_displayable_collection_summary_dicts_matching_ids(  # pylint: disable=line-too-long
            collection_ids
        )
        self.values.update({'summaries': summaries})
        self.render_json(self.values)

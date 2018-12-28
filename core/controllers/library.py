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

import json
import logging
import string

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import collection_services
from core.domain import exp_services
from core.domain import summary_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
current_user_services = models.Registry.import_current_user_services()


def get_matching_activity_dicts(query_string, search_cursor):
    """Given a query string and a search cursor, returns a list of activity
    dicts that satisfy the search query.
    """
    # We only populate collections in the initial load, since the current
    # frontend search infrastructure is set up to only deal with one search
    # cursor at a time.
    # TODO(sll): Remove this special casing.
    collection_ids = []
    if not search_cursor:
        collection_ids, _ = (
            collection_services.get_collection_ids_matching_query(
                query_string))

    exp_ids, new_search_cursor = (
        exp_services.get_exploration_ids_matching_query(
            query_string, cursor=search_cursor))
    activity_list = []
    activity_list = (
        summary_services.get_displayable_collection_summary_dicts_matching_ids(
            collection_ids))
    activity_list += (
        summary_services.get_displayable_exp_summary_dicts_matching_ids(
            exp_ids))

    if len(activity_list) == feconf.DEFAULT_QUERY_LIMIT:
        logging.error(
            '%s activities were fetched to load the library page. '
            'You may be running up against the default query limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return activity_list, new_search_cursor


class LibraryPage(base.BaseHandler):
    """The main library page. Used for both the default list of categories and
    for search results.
    """
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        search_mode = 'search' in self.request.url

        if search_mode:
            page_mode = feconf.LIBRARY_PAGE_MODE_SEARCH
        else:
            page_mode = feconf.LIBRARY_PAGE_MODE_INDEX

        self.values.update({
            'meta_description': (
                feconf.SEARCH_PAGE_DESCRIPTION if search_mode
                else feconf.LIBRARY_PAGE_DESCRIPTION),
            'has_fully_registered': bool(
                self.user_id and
                user_services.has_fully_registered(self.user_id)),
            'LANGUAGE_CODES_AND_NAMES': (
                utils.get_all_language_codes_and_names()),
            'page_mode': page_mode,
            'SEARCH_DROPDOWN_CATEGORIES': feconf.SEARCH_DROPDOWN_CATEGORIES,
        })
        self.render_template('pages/library/library.html')


class LibraryIndexHandler(base.BaseHandler):
    """Provides data for the default library index page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        # TODO(sll): Support index pages for other language codes.
        summary_dicts_by_category = summary_services.get_library_groups([
            constants.DEFAULT_LANGUAGE_CODE])
        top_rated_activity_summary_dicts = (
            summary_services.get_top_rated_exploration_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE],
                feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE))
        featured_activity_summary_dicts = (
            summary_services.get_featured_activity_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE]))

        preferred_language_codes = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        if top_rated_activity_summary_dicts:
            summary_dicts_by_category.insert(
                0, {
                    'activity_summary_dicts': top_rated_activity_summary_dicts,
                    'categories': [],
                    'header_i18n_id': (
                        feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS),
                    'has_full_results_page': True,
                    'full_results_url': feconf.LIBRARY_TOP_RATED_URL,
                    'protractor_id': 'top-rated',
                })
        if featured_activity_summary_dicts:
            summary_dicts_by_category.insert(
                0, {
                    'activity_summary_dicts': featured_activity_summary_dicts,
                    'categories': [],
                    'header_i18n_id': (
                        feconf.LIBRARY_CATEGORY_FEATURED_ACTIVITIES),
                    'has_full_results_page': False,
                    'full_results_url': None,
                })

        self.values.update({
            'activity_summary_dicts_by_category': (
                summary_dicts_by_category),
            'preferred_language_codes': preferred_language_codes,
        })
        self.render_json(self.values)


class LibraryGroupPage(base.BaseHandler):
    """The page for displaying top rated and recently published
    explorations.
    """

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""

        self.values.update({
            'meta_description': (
                feconf.LIBRARY_GROUP_PAGE_DESCRIPTION),
            'has_fully_registered': bool(
                self.user_id and
                user_services.has_fully_registered(self.user_id)),
            'LANGUAGE_CODES_AND_NAMES': (
                utils.get_all_language_codes_and_names()),
            'page_mode': feconf.LIBRARY_PAGE_MODE_GROUP,
            'SEARCH_DROPDOWN_CATEGORIES': feconf.SEARCH_DROPDOWN_CATEGORIES,
        })
        self.render_template('pages/library/library.html')


class LibraryGroupIndexHandler(base.BaseHandler):
    """Provides data for categories such as top rated and recently published."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests for group pages."""
        # TODO(sll): Support index pages for other language codes.
        group_name = self.request.get('group_name')
        activity_list = []
        header_i18n_id = ''

        if group_name == feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED:
            recently_published_summary_dicts = (
                summary_services.get_recently_published_exp_summary_dicts(
                    feconf.RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE))
            if recently_published_summary_dicts:
                activity_list = recently_published_summary_dicts
                header_i18n_id = feconf.LIBRARY_CATEGORY_RECENTLY_PUBLISHED

        elif group_name == feconf.LIBRARY_GROUP_TOP_RATED:
            top_rated_activity_summary_dicts = (
                summary_services.get_top_rated_exploration_summary_dicts(
                    [constants.DEFAULT_LANGUAGE_CODE],
                    feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FULL_PAGE))
            if top_rated_activity_summary_dicts:
                activity_list = top_rated_activity_summary_dicts
                header_i18n_id = feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS

        else:
            return self.PageNotFoundException

        preferred_language_codes = [constants.DEFAULT_LANGUAGE_CODE]
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        self.values.update({
            'activity_list': activity_list,
            'header_i18n_id': header_i18n_id,
            'preferred_language_codes': preferred_language_codes,
        })
        self.render_json(self.values)


class SearchHandler(base.BaseHandler):
    """Provides data for activity search results."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        query_string = utils.unescape_encoded_uri_component(
            self.request.get('q'))

        # Remove all punctuation from the query string, and replace it with
        # spaces. See http://stackoverflow.com/a/266162 and
        # http://stackoverflow.com/a/11693937
        remove_punctuation_map = dict(
            (ord(char), None) for char in string.punctuation)
        query_string = query_string.translate(remove_punctuation_map)

        if self.request.get('category'):
            query_string += ' category=%s' % self.request.get('category')
        if self.request.get('language_code'):
            query_string += ' language_code=%s' % self.request.get(
                'language_code')
        search_cursor = self.request.get('cursor', None)

        activity_list, new_search_cursor = get_matching_activity_dicts(
            query_string, search_cursor)

        self.values.update({
            'activity_list': activity_list,
            'search_cursor': new_search_cursor,
        })

        self.render_json(self.values)


class LibraryRedirectPage(base.BaseHandler):
    """An old 'gallery' page that should redirect to the library index page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/library')


class ExplorationSummariesHandler(base.BaseHandler):
    """Returns summaries corresponding to ids of public explorations. This
    controller supports returning private explorations for the given user.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        try:
            exp_ids = json.loads(self.request.get('stringified_exp_ids'))
        except Exception:
            raise self.PageNotFoundException
        include_private_exps_str = self.request.get(
            'include_private_explorations')
        include_private_exps = (
            include_private_exps_str.lower() == 'true'
            if include_private_exps_str else False)

        editor_user_id = self.user_id if include_private_exps else None
        if not editor_user_id:
            include_private_exps = False

        if (not isinstance(exp_ids, list) or not all([
                isinstance(exp_id, basestring) for exp_id in exp_ids])):
            raise self.PageNotFoundException

        if include_private_exps:
            summaries = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    exp_ids, user=self.user))
        else:
            summaries = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    exp_ids))
        self.values.update({
            'summaries': summaries
        })
        self.render_json(self.values)


class CollectionSummariesHandler(base.BaseHandler):
    """Returns collection summaries corresponding to collection ids."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        try:
            collection_ids = json.loads(
                self.request.get('stringified_collection_ids'))
        except Exception:
            raise self.PageNotFoundException
        summaries = (
            summary_services.get_displayable_collection_summary_dicts_matching_ids( # pylint: disable=line-too-long
                collection_ids))
        self.values.update({
            'summaries': summaries
        })
        self.render_json(self.values)

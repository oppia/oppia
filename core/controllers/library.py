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

from core.controllers import base
from core.domain import exp_services
from core.domain import summary_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
current_user_services = models.Registry.import_current_user_services()


def get_matching_exploration_dicts(query_string, search_cursor):
    """Given a query string and a search cursor, returns a list of exploration
       dicts that satisfy the search query.
    """
    exp_ids, new_search_cursor = (
        exp_services.get_exploration_ids_matching_query(
            query_string, cursor=search_cursor))

    explorations_list = (
        summary_services.get_displayable_exp_summary_dicts_matching_ids(
            exp_ids))

    if len(explorations_list) == feconf.DEFAULT_QUERY_LIMIT:
        logging.error(
            '%s explorations were fetched to load the search results. '
            'You may be running up against the default query limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return explorations_list, new_search_cursor


class LibraryPage(base.BaseHandler):
    """The main library page. Used for both the default list of categories and
    for search results.
    """

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': feconf.NAV_MODE_LIBRARY,
            'has_fully_registered': bool(
                self.user_id and
                user_services.has_fully_registered(self.user_id)),
            'LANGUAGE_CODES_AND_NAMES': (
                utils.get_all_language_codes_and_names()),
            'LIBRARY_CATEGORY_FEATURED_EXPLORATIONS': (
                feconf.LIBRARY_CATEGORY_FEATURED_EXPLORATIONS),
        })
        self.render_template('library/library.html')


class LibraryIndexHandler(base.BaseHandler):
    """Provides data for the default library index page."""

    def get(self):
        """Handles GET requests."""
        language_codes = self.request.get('language_codes', [])
        summary_dicts_by_category = (
            summary_services.get_library_groups(language_codes))

        preferred_language_codes = [feconf.DEFAULT_LANGUAGE_CODE]
        featured_activity_summary_dicts = (
            summary_services.get_featured_exploration_summary_dicts())
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        if featured_activity_summary_dicts:
            summary_dicts_by_category.insert(0, {
                'activity_summary_dicts': featured_activity_summary_dicts,
                'categories': [],
                'header': feconf.LIBRARY_CATEGORY_FEATURED_EXPLORATIONS,
            })

        self.values.update({
            'activity_summary_dicts_by_category': (
                summary_dicts_by_category),
            'preferred_language_codes': preferred_language_codes,
        })
        self.render_json(self.values)


class SearchHandler(base.BaseHandler):
    """Provides data for exploration search results."""

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

        explorations_list, new_search_cursor = get_matching_exploration_dicts(
            query_string, search_cursor)

        self.values.update({
            'explorations_list': explorations_list,
            'search_cursor': new_search_cursor,
        })

        self.render_json(self.values)


class LibraryRedirectPage(base.BaseHandler):
    """An old 'gallery' page that should redirect to the library index page."""

    def get(self):
        """Handles GET requests."""
        self.redirect('/library')


class ExplorationSummariesHandler(base.BaseHandler):
    """Returns summaries corresponding to ids of public explorations. This
    controller supports returning private explorations for the given user.
    """

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
                    exp_ids,
                    editor_user_id=editor_user_id))
        else:
            summaries = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    exp_ids))
        self.values.update({
            'summaries': summaries
        })
        self.render_json(self.values)

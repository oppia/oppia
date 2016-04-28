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

"""Controllers for the gallery pages."""

import json
import logging

from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import summary_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
current_user_services = models.Registry.import_current_user_services()

SPLASH_PAGE_YOUTUBE_VIDEO_ID = config_domain.ConfigProperty(
    'splash_page_youtube_video_id', {'type': 'unicode'},
    'The (optional) video id for the Splash page',
    default_value='')

EXPLORATION_ID_KEY = 'explorationId'
COLLECTION_ID_KEY = 'collectionId'

ALLOW_YAML_FILE_UPLOAD = config_domain.ConfigProperty(
    'allow_yaml_file_upload', {'type': 'bool'},
    'Whether to allow file uploads via YAML in the gallery page.',
    default_value=False)

CAROUSEL_SLIDES_CONFIG = config_domain.ConfigProperty(
    'carousel_slides_config', {
        'type': 'list',
        'items': {
            'type': 'dict',
            'properties': [{
                'name': 'topic',
                'description': 'Topic of the exploration',
                'schema': {'type': 'unicode'},
            }, {
                'name': 'exploration_id',
                'description': 'The exploration ID',
                'schema': {'type': 'unicode'},
            }, {
                'name': 'image_filename',
                'description': (
                    'Filename of the carousel image (in /images/splash)'),
                'schema': {'type': 'unicode'},
            }]
        }
    },
    'Configuration for slides in the gallery carousel.',
    default_value=[{
        'topic': 'anything',
        'exploration_id': '0',
        'image_filename': 'default.jpg',
    }])


def get_matching_exploration_dicts(query_string, search_cursor):
    """Given a query string and a search cursor, returns a list of exploration
       dicts that satisfy the search query.
    """
    exp_ids, search_cursor = (
        exp_services.get_exploration_ids_matching_query(
            query_string, cursor=search_cursor))

    explorations_list = (
        summary_services.get_displayable_exp_summary_dicts_matching_ids(
            exp_ids))

    if len(explorations_list) == feconf.DEFAULT_QUERY_LIMIT:
        logging.error(
            '%s explorations were fetched to load the gallery page. '
            'You may be running up against the default query limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return explorations_list


class GalleryPage(base.BaseHandler):
    """The exploration gallery page."""

    PAGE_NAME_FOR_CSRF = 'gallery'

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': feconf.NAV_MODE_GALLERY,
            'allow_yaml_file_upload': ALLOW_YAML_FILE_UPLOAD.value,
            'has_fully_registered': bool(
                self.user_id and
                user_services.has_fully_registered(self.user_id)),
            'SPLASH_PAGE_YOUTUBE_VIDEO_ID': SPLASH_PAGE_YOUTUBE_VIDEO_ID.value,
            'CAROUSEL_SLIDES_CONFIG': CAROUSEL_SLIDES_CONFIG.value,
            'LANGUAGE_CODES_AND_NAMES': (
                utils.get_all_language_codes_and_names()),
        })
        self.render_template('galleries/gallery.html')

class GallerySearchPage(base.BaseHandler):
    """The exploration gallery search page."""

    PAGE_NAME_FOR_CSRF = 'gallery'

    def get(self):
        """Handles GET requests."""

        self.values.update({
            'nav_mode': feconf.NAV_MODE_GALLERY,
            'allow_yaml_file_upload': ALLOW_YAML_FILE_UPLOAD.value,
            'has_fully_registered': bool(
                self.user_id and
                user_services.has_fully_registered(self.user_id)),
            'SPLASH_PAGE_YOUTUBE_VIDEO_ID': SPLASH_PAGE_YOUTUBE_VIDEO_ID.value,
            'CAROUSEL_SLIDES_CONFIG': CAROUSEL_SLIDES_CONFIG.value,
            'LANGUAGE_CODES_AND_NAMES': (
                utils.get_all_language_codes_and_names()),
        })
        self.render_template('galleries/gallery.html')


class DefaultGalleryCategoriesHandler(base.BaseHandler):
    """Provides data for the default gallery page."""

    def get(self):
        """Handles GET requests."""
        language_codes = self.request.get('language_codes', [])
        summary_dicts_by_category = (
            summary_services.get_gallery_category_groupings(language_codes))

        preferred_language_codes = [feconf.DEFAULT_LANGUAGE_CODE]
        featured_activity_summary_dicts = (
            summary_services.get_featured_exploration_summary_dicts())
        if self.user_id:
            user_settings = user_services.get_user_settings(self.user_id)
            preferred_language_codes = user_settings.preferred_language_codes

        self.values.update({
            'activity_summary_dicts_by_category': (
                summary_dicts_by_category),
            'featured_activity_summary_dicts': (
                featured_activity_summary_dicts),
            'preferred_language_codes': preferred_language_codes,
        })
        self.render_json(self.values)


class GalleryHandler(base.BaseHandler):
    """Provides data for the exploration gallery page."""

    def get(self):
        """Handles GET requests."""
        query_string = self.request.get('q')
        if self.request.get('category'):
            query_string += ' category=%s' % self.request.get('category')
        if self.request.get('language_code'):
            query_string += ' language_code=%s' % self.request.get(
                'language_code')
        search_cursor = self.request.get('cursor', None)

        explorations_list = get_matching_exploration_dicts(
            query_string, search_cursor)

        self.values.update({
            'explorations_list': explorations_list,
            'search_cursor': search_cursor,
        })

        self.render_json(self.values)


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    PAGE_NAME_FOR_CSRF = 'gallery'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        objective = self.payload.get('objective')
        language_code = self.payload.get('language_code')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')
        if not language_code:
            raise self.InvalidInputException('No language chosen.')

        new_exploration_id = exp_services.get_new_exploration_id()
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exploration_id, title, category,
            objective=objective, language_code=language_code)
        exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({EXPLORATION_ID_KEY: new_exploration_id})


class NewCollection(base.BaseHandler):
    """Creates a new collection."""

    PAGE_NAME_FOR_CSRF = 'gallery'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        objective = self.payload.get('objective')
        # TODO(bhenning): Implement support for language codes in collections.

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        new_collection_id = collection_services.get_new_collection_id()
        collection = collection_domain.Collection.create_default_collection(
            new_collection_id, title, category, objective=objective)
        collection_services.save_new_collection(self.user_id, collection)

        self.render_json({COLLECTION_ID_KEY: new_collection_id})


class UploadExploration(base.BaseHandler):
    """Uploads a new exploration."""

    PAGE_NAME_FOR_CSRF = 'gallery'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        yaml_content = self.request.get('yaml_file')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        new_exploration_id = exp_services.get_new_exploration_id()
        if ALLOW_YAML_FILE_UPLOAD.value:
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.user_id, yaml_content, title, category,
                new_exploration_id, [])
            self.render_json({EXPLORATION_ID_KEY: new_exploration_id})
        else:
            raise self.InvalidInputException(
                'This server does not allow file uploads.')


class GalleryRedirectPage(base.BaseHandler):
    """An old exploration gallery page."""

    def get(self):
        """Handles GET requests."""
        self.redirect('/gallery')


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

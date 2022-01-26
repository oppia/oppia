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

"""Controllers for Oppia resources (templates, images)."""

from __future__ import annotations

import io
import logging
import urllib

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import config_services
from core.domain import fs_domain
from core.domain import value_generators_domain


class ValueGeneratorHandler(base.BaseHandler):
    """Retrieves the HTML template for a value generator editor."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, generator_id):
        """Handles GET requests."""
        try:
            self.response.write(
                value_generators_domain.Registry.get_generator_class_by_id(
                    generator_id).get_html_template())
        except KeyError as e:
            logging.exception(
                'Value generator not found: %s. %s' % (generator_id, e))
            raise self.PageNotFoundException


class AssetDevHandler(base.BaseHandler):
    """Handles image and audio retrievals (only in dev -- in production,
    image and audio files are served from GCS).
    """

    _SUPPORTED_TYPES = ['image', 'audio', 'thumbnail']
    _SUPPORTED_PAGE_CONTEXTS = [
        feconf.ENTITY_TYPE_EXPLORATION, feconf.ENTITY_TYPE_SKILL,
        feconf.ENTITY_TYPE_BLOG_POST,
        feconf.ENTITY_TYPE_TOPIC, feconf.ENTITY_TYPE_STORY,
        feconf.ENTITY_TYPE_QUESTION, feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS,
        feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS]

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, page_context, page_identifier, asset_type, encoded_filename):
        """Returns an asset file.

        Args:
            page_context: str. The context of the page where the asset is
                required.
            page_identifier: str. The unique identifier for the particular
                context. Valid page_context: page_identifier pairs:
                exploration: exp_id
                story: story_id
                topic: topic_id
                skill: skill_id
                subtopic: topic_name of the topic that it is part of.
            asset_type: str. Type of the asset, either image or audio.
            encoded_filename: str. The asset filename. This
                string is encoded in the frontend using encodeURIComponent().
        """
        if not constants.EMULATOR_MODE:
            raise self.PageNotFoundException

        try:
            filename = urllib.parse.unquote(encoded_filename)
            file_format = filename[(filename.rfind('.') + 1):]

            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            content_type = (
                'image/svg+xml' if file_format == 'svg' else '%s/%s' % (
                    asset_type, file_format))
            self.response.headers['Content-Type'] = content_type

            if page_context not in self._SUPPORTED_PAGE_CONTEXTS:
                raise self.InvalidInputException

            fs = fs_domain.AbstractFileSystem(
                fs_domain.GcsFileSystem(page_context, page_identifier))
            raw = fs.get('%s/%s' % (asset_type, filename))

            self.response.cache_control.no_cache = None
            self.response.cache_control.public = True
            self.response.cache_control.max_age = 600
            self.response.body_file = io.BytesIO(raw)
        except Exception as e:
            logging.exception(
                'File not found: %s. %s' % (encoded_filename, e))
            raise self.PageNotFoundException


class PromoBarHandler(base.BaseHandler):
    """Handler for the promo-bar."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'promo_bar_enabled': {
                'schema': {
                    'type': 'bool'
                },
            },
            'promo_bar_message': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # This prevents partially logged in user from being logged out
    # during user registration.
    REDIRECT_UNFINISHED_SIGNUPS = False

    @acl_decorators.open_access
    def get(self):
        self.render_json({
            'promo_bar_enabled': config_domain.PROMO_BAR_ENABLED.value,
            'promo_bar_message': config_domain.PROMO_BAR_MESSAGE.value
        })

    @acl_decorators.can_access_release_coordinator_page
    def put(self):
        promo_bar_enabled_value = self.normalized_payload.get(
            'promo_bar_enabled')
        promo_bar_message_value = self.normalized_payload.get(
            'promo_bar_message')

        logging.info(
            '[RELEASE COORDINATOR] %s saved promo-bar config property values: '
            '%s' % (self.user_id, promo_bar_message_value))
        config_services.set_property(
            self.user_id, 'promo_bar_enabled', promo_bar_enabled_value)
        config_services.set_property(
            self.user_id, 'promo_bar_message', promo_bar_message_value)

        self.render_json({})

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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import fs_domain
from core.domain import topic_fetchers
from core.domain import value_generators_domain
import feconf
import python_utils


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
        except Exception as e:
            logging.error('Value generator not found: %s. %s' %
                          (generator_id, e))
            raise self.PageNotFoundException


class AssetDevHandler(base.BaseHandler):
    """Handles image and audio retrievals (only in dev -- in production,
    image and audio files are served from GCS).
    """

    _SUPPORTED_TYPES = ['image', 'audio', 'thumbnail']
    _SUPPORTED_PAGE_CONTEXTS = [
        feconf.ENTITY_TYPE_EXPLORATION, feconf.ENTITY_TYPE_SKILL,
        feconf.ENTITY_TYPE_TOPIC, feconf.ENTITY_TYPE_STORY,
        feconf.ENTITY_TYPE_QUESTION, feconf.ENTITY_TYPE_SUBTOPIC
    ]

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
        if not constants.DEV_MODE:
            raise self.PageNotFoundException

        try:
            filename = python_utils.urllib_unquote(encoded_filename)
            file_format = filename[(filename.rfind('.') + 1):]

            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            self.response.headers[
                b'Content-Type'] = python_utils.convert_to_bytes(
                    '%s/%s' % (asset_type, file_format))

            if page_context not in self._SUPPORTED_PAGE_CONTEXTS:
                raise self.InvalidInputException

            if page_context == feconf.ENTITY_TYPE_SUBTOPIC:
                entity_type = feconf.ENTITY_TYPE_TOPIC
                topic = topic_fetchers.get_topic_by_name(page_identifier)
                entity_id = topic.id
            else:
                entity_type = page_context
                entity_id = page_identifier

            fs = fs_domain.AbstractFileSystem(
                fs_domain.DatastoreBackedFileSystem(entity_type, entity_id))
            raw = fs.get('%s/%s' % (asset_type, filename))

            self.response.cache_control.no_cache = None
            self.response.cache_control.public = True
            self.response.cache_control.max_age = 600
            self.response.write(raw)
        except:
            raise self.PageNotFoundException


class PromoBarHandler(base.BaseHandler):
    """The handler for checking if Promobar is enabled and fetching
    promobar message.
    """

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

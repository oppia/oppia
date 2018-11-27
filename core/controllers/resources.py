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

import logging
import urllib

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import fs_domain
from core.domain import value_generators_domain
import feconf


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

    _SUPPORTED_TYPES = ['image', 'audio']

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, exploration_id, asset_type, encoded_filename):
        """Returns an asset file.

        Args:
            exploration_id: str. The id of the exploration.
            asset_type: str. Type of the asset, either image or audio.
            encoded_filename: str. The asset filename. This
              string is encoded in the frontend using encodeURIComponent().
        """
        if not constants.DEV_MODE:
            raise self.PageNotFoundException
        if asset_type not in self._SUPPORTED_TYPES:
            raise Exception('%s is not a supported asset type.' % asset_type)
        try:
            filename = urllib.unquote(encoded_filename)
            file_format = filename[(filename.rfind('.') + 1):]

            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            self.response.headers['Content-Type'] = str(
                '%s/%s' % (asset_type, file_format))

            fs = fs_domain.AbstractFileSystem(
                fs_domain.ExplorationFileSystem(
                    'exploration/%s' % exploration_id))
            raw = fs.get('%s/%s' % (asset_type, filename))

            self.response.cache_control.no_cache = None
            self.response.cache_control.public = True
            self.response.cache_control.max_age = 600
            self.response.write(raw)
        except:
            raise self.PageNotFoundException

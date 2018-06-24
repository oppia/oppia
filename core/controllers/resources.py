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

from core.controllers import base
from core.domain import acl_decorators
from core.domain import fs_domain
from core.domain import value_generators_domain


class ValueGeneratorHandler(base.BaseHandler):
    """Retrieves the HTML template for a value generator editor."""

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


class ImageHandler(base.BaseHandler):
    """Handles image retrievals."""

    @acl_decorators.open_access
    def get(self, exploration_id, encoded_filepath):
        """Returns an image.

        Args:
            exploration_id: the id of the exploration.
            encoded_filepath: a string representing the image filepath. This
              string is encoded in the frontend using encodeURIComponent().
        """
        try:
            filepath = urllib.unquote(encoded_filepath)
            file_format = filepath[(filepath.rfind('.') + 1):]
            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            self.response.headers['Content-Type'] = str(
                'image/%s' % file_format)

            fs = fs_domain.AbstractFileSystem(
                fs_domain.ExplorationFileSystem(exploration_id))
            raw = fs.get(filepath)

            self.response.cache_control.no_cache = None
            self.response.cache_control.public = True
            self.response.cache_control.max_age = 600
            self.response.write(raw)
        except:
            raise self.PageNotFoundException


class AudioHandler(base.BaseHandler):
    """Handles audio retrievals (only in dev -- in production, audio files are
    served from GCS).
    """

    _AUDIO_PATH_PREFIX = 'audio'

    @acl_decorators.open_access
    def get(self, exploration_id, filename):
        """Returns an audio file.

        Args:
            encoded_filepath: a string representing the audio filepath. This
              string is encoded in the frontend using encodeURIComponent().
        """
        file_format = filename[(filename.rfind('.') + 1):]
        # If the following is not cast to str, an error occurs in the wsgi
        # library because unicode gets used.
        self.response.headers['Content-Type'] = str(
            'audio/%s' % file_format)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))

        try:
            raw = fs.get('%s/%s' % (self._AUDIO_PATH_PREFIX, filename))
        except:
            raise self.PageNotFoundException

        self.response.cache_control.no_cache = None
        self.response.cache_control.public = True
        self.response.cache_control.max_age = 600
        self.response.write(raw)

# Copyright 2012 Google Inc. All Rights Reserved.
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

__author__ = 'sll@google.com (Sean Lip)'

import base64
import datetime
import hashlib
import imghdr
import logging
import mimetypes

from core.controllers import base
from core.domain import fs_domain
from core.domain import value_generators_domain
import feconf
import urllib
import utils


class TemplateHandler(base.BaseHandler):
    """Retrieves a template for a UI component."""

    def get(self, template_type):
        """Handles GET requests."""
        try:
            self.response.write(self.jinja2_env.get_template(
                'components/%s.html' % template_type).render({}))
        except:
            raise self.PageNotFoundException


class RteAssetHandler(base.BaseHandler):
    """Retrieves an asset for the rich text editor."""

    def get(self, asset_file_path):
        """Handles GET requests. Returns the image as a data URL."""
        try:
            # TODO(sll): Should the location be changed?
            file_contents = utils.get_file_contents(
                'core/templates/dev/head/components/rte_assets/%s'
                % asset_file_path, raw_bytes=True)
            self.response.write('data:image/png;base64,%s' % urllib.quote(
                file_contents.encode('base64')))
        except Exception as e:
            raise self.PageNotFoundException(e)


class ValueGeneratorHandler(base.BaseHandler):
    """Retrieves the HTML template for a value generator editor."""

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

    def get(self, exploration_id, image_id):
        """Returns an image.

        Args:
            exploration_id: the id of the exploration.
            image_id: string representing the image filepath.
        """
        try:
            format = image_id[(image_id.rfind('.') + 1) :]
            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            self.response.headers['Content-Type'] = str('image/%s' % format)

            fs = fs_domain.AbstractFileSystem(
                fs_domain.ExplorationFileSystem(exploration_id))
            raw = fs.get(image_id)
            self.response.write(raw)
        except:
            raise self.PageNotFoundException


class ImageUploadHandler(base.BaseHandler):
    """Handles image uploads."""

    PAGE_NAME_FOR_CSRF = 'editor'

    def _get_random_filename(self, banned_filenames):
        """Generates a random filename not in the given list."""
        count = 0

        while True:
            count += 1
            random_prefix = base64.urlsafe_b64encode(hashlib.sha1(
                str(utils.get_random_int(127 * 127))).digest())[:12]
            date_str = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
            candidate_filename = '%s:%s' % (random_prefix, date_str)
            if candidate_filename not in banned_filenames:
                return candidate_filename
            if count >= 10:
                raise Exception('Unable to generate new filename.')

    @base.require_editor
    def post(self, exploration_id):
        """Saves an image uploaded by a content creator."""
        # This sets the payload so that an error response is rendered as JSON
        # instead of HTML.
        # TODO(sll): This is hacky and needs to be cleaned up.
        self.payload = 'image_upload'

        raw = self.request.get('image')
        if not raw:
            raise self.InvalidInputException('No image supplied')

        format = imghdr.what(None, h=raw)
        if format not in feconf.ACCEPTED_IMAGE_FORMATS:
            allowed_formats = ', '.join(feconf.ACCEPTED_IMAGE_FORMATS)
            raise Exception('Image file not recognized: it should be in '
                            'one of the following formats: %s.' %
                            allowed_formats)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')
        image_id = '%s.%s' % (self._get_random_filename(dir_list), format)
        fs.put(image_id, raw)

        self.render_json({'image_id': image_id})


class StaticFileHandler(base.BaseHandler):
    """Handles static file serving on non-GAE platforms."""

    def get(self):

        file_path = self.request.path
        for path in feconf.PATH_MAP:
            if file_path.startswith(path):
                file_path = file_path.replace(path, feconf.PATH_MAP[path])
        try:
            f = open(file_path, 'r')
            self.response.headers['Content-Type'] = mimetypes.guess_type(file_path)[0]
             # TODO(sll): Add a ALLOW_CACHING flag and set the appropriate caching
             # headers if that's turned on.
            self.response.write(f.read())
            f.close()
        except Exception:
            self.response.set_status(404)

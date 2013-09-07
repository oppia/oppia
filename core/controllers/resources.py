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

import logging
import mimetypes
import os

from core.controllers import base
from core.domain import value_generators_domain
from core.platform import models
(image_models,) = models.Registry.import_models([models.NAMES.image])
import feconf
import utils


class EditorViewHandler(base.BaseHandler):
    """Retrieves an editor view in the 'editor/views' directory."""

    def get(self, view_type):
        """Handles GET requests."""
        try:
            self.response.write(self.jinja2_env.get_template(
                'editor/views/%s.html' % view_type).render({}))
        except:
            raise self.PageNotFoundException


class TemplateHandler(base.BaseHandler):
    """Retrieves a template for a UI component."""

    def get(self, template_type):
        """Handles GET requests."""
        try:
            self.response.write(self.jinja2_env.get_template(
                'components/%s.html' % template_type).render({}))
        except:
            raise self.PageNotFoundException


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

    def get(self, image_id):
        """Returns an image.

        Args:
            image_id: string representing the image id.
        """
        try:
            image = image_models.Image.get(image_id)

            # If the following is not cast to str, an error occurs in the wsgi
            # library because unicode gets used.
            self.response.headers['Content-Type'] = (
                str('image/%s' % image.format))
            self.response.write(image.raw)
        except:
            raise self.PageNotFoundException


class ImageUploadHandler(base.BaseHandler):
    """Handles image uploads."""

    PAGE_NAME_FOR_CSRF = 'editor'

    def post(self):
        """Saves an image uploaded by a content creator."""
        raw = self.request.get('image')
        if raw:
            image_id = image_models.Image.create(raw)
            self.render_json({'image_id': image_id})
        else:
            raise self.InvalidInputException('No image supplied')


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

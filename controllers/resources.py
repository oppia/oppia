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

from apps.image.models import Image
from controllers.base import BaseHandler
import feconf
import utils


class EditorViewHandler(BaseHandler):
    """Retrieves an editor view in the 'editor/views' directory."""

    def get(self, view_type):
        """Handles GET requests."""
        self.response.write(feconf.JINJA_ENV.get_template(
            'editor/views/%s.html' % view_type).render({}))


class TemplateHandler(BaseHandler):
    """Retrieves a template in the 'generic' directory."""

    def get(self, template_type):
        """Handles GET requests."""
        self.response.write(feconf.JINJA_ENV.get_template(
            'generic/%s.html' % template_type).render({}))


class ImageHandler(BaseHandler):
    """Handles image uploads and retrievals."""

    def get(self, image_id):
        """Returns an image.

        Args:
            image_id: string representing the image id.
        """
        image = Image.get_by_id(image_id)
        if image:
            # TODO(sll): Support other image types.
            self.response.headers['Content-Type'] = str('image/%s' % image.format)
            self.response.write(image.raw)
        else:
            self.response.write('No image')

    def post(self):
        """Saves an image uploaded by a content creator."""
        raw = self.request.get('image')
        if raw:
            image_id = Image.create(raw)
            self.render_json({'image_id': image_id})
        else:
            raise self.InvalidInputException('No image supplied')

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

import json
from controllers.base import BaseHandler
import feconf
from models.models import Image
import utils


class TemplateHandler(BaseHandler):
    """Retrieves an editor template."""

    def get(self, template_type):
        """Handles GET requests."""
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/views/%s_editor.html' % template_type).render({}))


class ImageHandler(BaseHandler):
    """Handles image uploads and retrievals."""

    def get(self, image_id):  # pylint: disable-msg=C6409
        """Returns an image.

        Args:
            image_id: string representing the image id.
        """
        image = utils.GetEntity(Image, image_id)
        if image:
            # TODO(sll): Support other image types.
            self.response.headers['Content-Type'] = 'image/png'
            self.response.out.write(image.image)
        else:
            self.response.out.write('No image')

    def post(self):  # pylint: disable-msg=C6409
        """Saves an image uploaded by a content creator."""
        # TODO(sll): Check that the image is really an image.
        image = self.request.get('image')
        if image:
            image_hash_id = utils.GetNewId(Image, image)
            image_entity = Image(hash_id=image_hash_id, image=image)
            image_entity.put()
            self.response.out.write(json.dumps(
                {'image_id': image_entity.hash_id}))
        else:
            raise self.InvalidInputException('No image supplied')
            return

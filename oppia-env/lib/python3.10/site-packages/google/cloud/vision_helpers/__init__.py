# Copyright 2017, Google LLC All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import absolute_import

from google.api_core import protobuf_helpers as protobuf
import proto


class VisionHelpers(object):
    """A set of convenience methods to make the Vision GAPIC easier to use.

    This class should be considered abstract; it is used as a superclass
    in a multiple-inheritance construction alongside the applicable GAPIC.
    See the :class:`~google.cloud.vision_v1.ImageAnnotatorClient`.
    """

    def annotate_image(self, request, *, retry=None, timeout=None, metadata=()):
        """Run image detection and annotation for an image.

        Example:
            >>> from google.cloud.vision_v1 import ImageAnnotatorClient
            >>> client = ImageAnnotatorClient()
            >>> request = {
            ...     'image': {
            ...         'source': {'image_uri': 'https://foo.com/image.jpg'},
            ...     },
            ... }
            >>> response = client.annotate_image(request)

        Args:
            request (:class:`~.vision_v1.AnnotateImageRequest`)
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.
            timeout (float): The timeout for this request.
            metadata (Sequence[Tuple[str, str]]): Strings which should be
                sent along with the request as metadata.

        Returns:
            :class:`~.vision_v1.AnnotateImageResponse` The API response.
        """
        if not isinstance(request, proto.Message):
            # If the image is a file handler, set the content.
            image = protobuf.get(request, "image")
            if not isinstance(image, proto.Message):
                if hasattr(image, "read"):
                    img_bytes = image.read()
                    protobuf.set(request, "image", {})
                    protobuf.set(request, "image.content", img_bytes)
                    image = protobuf.get(request, "image")

                # If a filename is provided, read the file.
                filename = protobuf.get(image, "source.filename", default=None)
                if filename:
                    with open(filename, "rb") as img_file:
                        protobuf.set(request, "image.content", img_file.read())
                        protobuf.set(request, "image.source", None)

        # This method allows features not to be specified, and you get all
        # of them.
        if not isinstance(request, proto.Message):
            protobuf.setdefault(request, "features", self._get_all_features())
        elif len(request.features) == 0:
            request.features = self._get_all_features()
        r = self.batch_annotate_images(
            requests=[request], retry=retry, timeout=timeout, metadata=metadata
        )
        return r.responses[0]

    def _get_all_features(self):
        """Return a list of all features.

        Returns:
            list: A list of all available features.
        """
        return [{"type_": feature} for feature in self.Feature.Type if feature != 0]

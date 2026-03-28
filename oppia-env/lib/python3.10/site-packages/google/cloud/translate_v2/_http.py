# Copyright 2016 Google LLC
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

"""Create / interact with Google Cloud Translation connections."""

from google.cloud import _http
from google.cloud.translate_v2 import __version__


class Connection(_http.JSONConnection):
    """A connection to Google Cloud Translation API via the JSON REST API.

    :type client: :class:`~google.cloud.translate.client.Client`
    :param client: The client that owns the current connection.

    :type client_info: :class:`~google.api_core.client_info.ClientInfo`
    :param client_info: (Optional) instance used to generate user agent.
    """

    DEFAULT_API_ENDPOINT = "https://translation.googleapis.com"

    def __init__(self, client, client_info=None, api_endpoint=DEFAULT_API_ENDPOINT):
        super(Connection, self).__init__(client, client_info)
        self.API_BASE_URL = api_endpoint
        self._client_info.gapic_version = __version__
        self._client_info.client_library_version = __version__

    API_VERSION = "v2"
    """The version of the API, used in building the API call's URL."""

    API_URL_TEMPLATE = "{api_base_url}/language/translate/{api_version}{path}"
    """A template for the URL of a particular API call."""

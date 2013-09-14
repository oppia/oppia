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

"""Controllers for miscellaneous services."""

__author__ = 'Tarashish Mishra'

import base64
import json

from core.controllers import base


class FileReadHandler(base.BaseHandler):
    """Returns a base64-encoded ascii string with uploaded file's content."""

    def post(self):
        raw_file_content = self.request.get('file')

        encoded_content = base64.b64encode(raw_file_content)

        self.response.headers['Content-Type'] = 'application/json'
        response = {
            'base64_file_content': encoded_content,
        }
        self.response.out.write(json.dumps(response))

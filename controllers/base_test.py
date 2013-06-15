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

__author__ = 'Sean Lip'

import main
import test_utils


class BaseHandlerTest(test_utils.AppEngineTestBase):

    def test_that_no_get_results_in_500_error(self):
        """Test that no GET request results in a 500 error."""

        for route_tuple in main.urls:
            url = str(route_tuple[0])
            if url.endswith('?'):
                url = url[:-1]
            url = url.replace('(%s)' % main.r, 'abc012')

            # Some of these will 404 or 302. This is expected.
            try:
                response = self.testapp.get(url)
            except:
                raise Exception('GET: %s' % url)
            self.assertNotEqual(response.status_int, 500)

        # TODO(sll): Add similar tests for POST, PUT, DELETE.
        # TODO(sll): Unify Model.get() methods and make them
        #     behave consistently (either all raise Exceptions or
        #     return None).
        # TODO(sll): Set a self.payload attr in the BaseHandler for
        #     POST, PUT and DELETE. Something needs to regulate what
        #     the fields in the payload should be.

# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import fixtures

from requests_mock import mocker


class Fixture(fixtures.Fixture, mocker.MockerCore):

    def __init__(self, **kwargs):
        fixtures.Fixture.__init__(self)
        mocker.MockerCore.__init__(self, **kwargs)

    def setUp(self):
        super(Fixture, self).setUp()
        self.start()
        self.addCleanup(self.stop)

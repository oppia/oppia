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

from requests_mock.adapter import Adapter, ANY
from requests_mock.exceptions import MockException, NoMockAddress
from requests_mock.mocker import mock, Mocker, MockerCore
from requests_mock.mocker import DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
from requests_mock.response import create_response, CookieJar


__all__ = ['Adapter',
           'ANY',
           'create_response',
           'CookieJar',
           'mock',
           'Mocker',
           'MockerCore',
           'MockException',
           'NoMockAddress',

           'DELETE',
           'GET',
           'HEAD',
           'OPTIONS',
           'PATCH',
           'POST',
           'PUT',
           ]

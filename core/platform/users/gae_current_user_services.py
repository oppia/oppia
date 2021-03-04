# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Provides a seam for user-related services.

TODO(#11462): Remove this file and its clients once we've migrated to Firebase.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf
import utils

from google.appengine.api import users


def create_login_url(slug):
    """Creates a login url.

    Args:
        slug: str. The URL to redirect to after login.

    Returns:
        str. The correct login URL that includes the page to redirect to.
    """
    return users.create_login_url(
        dest_url=utils.set_url_query_parameter(
            feconf.SIGNUP_URL, 'return_url', slug))

# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for authentication."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections

# Auth ID refers to an identifier that links many Identity Providers to a single
# user. For example, an individual user's Facebook, Google, and Apple profiles
# would all map to a single Auth ID.
#
# Auth IDs are handled by the sub-modules in `core.platform.auth`.
#
# This domain object is simply a convenience for pairing Auth IDs to their
# corresponding Oppia-generated IDs in our APIs.
AuthIdUserIdPair = (
    collections.namedtuple('AuthIdUserIdPair', ['auth_id', 'user_id']))

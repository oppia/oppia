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

import python_utils

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


class AuthClaims(python_utils.OBJECT):
    """Domain object representing essential Claims (a piece of information about
    a user, like name, address, phone number, etc.) of an authorized user.

    Attributes:
        auth_id: str|None. A unique identifier associated to the user. The ID is
            only unique with respect to the Identity Provider who produced it.
        email: str|None. The email address associated to the user.
    """

    def __init__(self, auth_id, email):
        self.auth_id = auth_id
        self.email = email

    def __repr__(self):
        return 'AuthClaims(auth_id=%r, email=%r)' % (self.auth_id, self.email)

    def __hash__(self):
        return hash((self.auth_id, self.email))

    def __eq__(self, other):
        return (
            # https://docs.python.org/2/library/constants.html#NotImplemented
            NotImplemented if not isinstance(other, AuthClaims) else
            self.auth_id == other.auth_id and self.email == other.email)

    def __ne__(self, other):
        # Required in Python 2: https://stackoverflow.com/a/30676267/4859885.
        return not self == other

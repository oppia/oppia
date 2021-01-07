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
import utils

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
    """Domain object for holding onto essential Claims about an authorized user.

    A Claim is a piece of information about a user (e.g. name, mailing address,
    phone number).

    Attributes:
        auth_id: str. A unique identifier associated to the user. The ID is only
            unique with respect to the Identity Provider that produced it.
        email: str|None. The email address associated to the user, if any.
        role_is_super_admin: bool. Whether the user has intrinsic administrator
            privileges.
    """

    def __init__(self, auth_id, email, role_is_super_admin):
        if not auth_id:
            raise Exception('auth_id must not be empty')
        self.auth_id = auth_id
        self.email = email
        self.role_is_super_admin = role_is_super_admin

    def __repr__(self):
        return 'AuthClaims(auth_id=%r, email=%r, role_is_super_admin=%r)' % (
            self.auth_id, self.email, self.role_is_super_admin)

    def __hash__(self):
        return hash((self.auth_id, self.email, self.role_is_super_admin))

    def __eq__(self, other):
        # https://docs.python.org/2/library/constants.html#NotImplemented.
        return NotImplemented if not isinstance(other, AuthClaims) else (
            self.auth_id == other.auth_id and self.email == other.email and
            self.role_is_super_admin == other.role_is_super_admin)

    def __ne__(self, other):
        # TODO(#11474): Delete this method once we've moved to Python 3 and rely
        # on auto-generated method. In Python 2, we need to write this method
        # ourselves: https://stackoverflow.com/a/30676267/4859885.
        return not self == other


class UserAuthDetails(python_utils.OBJECT):
    """Value object representing a user's authentication details information.

    Attributes:
        user_id: str. The unique ID of the user.
        auth_id: str or None. The platform-agnostic identifier issued by an auth
            providers to uniquely identify a user.
        gae_id: str or None. The ID of the user retrieved from GAE.
        firebase_auth_id: str or None. The Firebase authentication ID of the
            user.
        parent_user_id: str or None. For profile users, the user ID of the full
            user associated with that profile. None for full users.
        deleted: bool. Whether the user is marked as deleted and will be fully
            deleted soon.
    """

    def __init__(
            self, user_id, gae_id=None, firebase_auth_id=None,
            parent_user_id=None, deleted=False):
        """Constructs a UserAuthDetails domain object.

        Args:
            user_id: str. The unique ID of the user.
            gae_id: str or None. The ID of the user retrieved from GAE.
            firebase_auth_id: str or None. The Firebase authentication ID of the
                user.
            parent_user_id: str or None. For profile users, the user ID of the
                full user associated with that profile. None for full users.
            deleted: bool. Whether the user has requested removal of their
                account.
        """
        self.user_id = user_id
        self.gae_id = gae_id
        self.firebase_auth_id = firebase_auth_id
        self.parent_user_id = parent_user_id
        self.deleted = deleted

    @property
    def auth_id(self):
        """Returns the platform-agnostic authentication identifier of a user."""
        return self.firebase_auth_id or self.gae_id

    def validate(self):
        """Checks that user_id, gae_id, firebase_auth_id, and parent_user_id
        fields of this UserAuthDetails domain object are valid.

        Raises:
            ValidationError. The user_id is not str.
            ValidationError. The gae_id is not str.
            ValidationError. The firebase_auth_id is not str.
            ValidationError. The parent_user_id is not str.
        """
        if not isinstance(self.user_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')
        if not utils.is_user_id_valid(self.user_id):
            raise utils.ValidationError('user_id=%r is in a wrong format.' % (
                self.user_id))

        if (self.gae_id is not None and
                not isinstance(self.gae_id, python_utils.BASESTRING)):
            raise utils.ValidationError(
                'Expected gae_id to be a string, received %s' % self.gae_id)

        if (self.firebase_auth_id is not None and
                not isinstance(self.firebase_auth_id, python_utils.BASESTRING)):
            raise utils.ValidationError(
                'Expected firebase_auth_id to be a string, received %s' %
                self.firebase_auth_id)

        if (self.parent_user_id is not None and
                not utils.is_user_id_valid(self.parent_user_id)):
            raise utils.ValidationError(
                'The parent user ID is in a wrong format.')

        if self.parent_user_id and self.auth_id:
            raise utils.ValidationError(
                'The parent user ID and auth_id cannot be present together '
                'for a user.')

        if not self.parent_user_id and not self.auth_id:
            raise utils.ValidationError(
                'The parent user ID and auth_id cannot be None together '
                'for a user.')

    def is_full_user(self):
        """Whether the user is a full user (not a profile user).

        Returns:
            bool. True if user is full user, False otherwise.
        """
        return self.auth_id is not None

    def to_dict(self):
        """Returns a dict matching the properties of UserAuthDetailsModel."""
        return {
            'gae_id': self.gae_id,
            'firebase_auth_id': self.firebase_auth_id,
            'parent_user_id': self.parent_user_id,
            'deleted': self.deleted
        }

    @classmethod
    def from_model(cls, user_auth_details_model):
        """Returns new domain object with values from a UserAuthDetailsModel."""
        return cls(
            user_auth_details_model.id,
            gae_id=user_auth_details_model.gae_id,
            firebase_auth_id=user_auth_details_model.firebase_auth_id,
            parent_user_id=user_auth_details_model.parent_user_id,
            deleted=user_auth_details_model.deleted)

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

"""Service layer for handling the authentication details of users via Firebase.

Oppia depends upon the OpenID Connect 1.0 specification for handling user
authentication, and uses [Firebase](https://firebase.google.com/docs/auth) as
the primary provider.

Glossary:
    OpenID Connect 1.0: a specification (i.e., a strict set of algorithms, data
        structures, and rules) that defines how two parties must share data
        about a user securely, on that user's behalf.
    Claim: a piece of information about a user (name, address, phone number,
        etc.) that has been encrypted and digitally signed.
    JWT: JSON Web Token; a compact and URL-safe protocol primarily designed to
        send Claims between two parties. Claims are organized in a JSON object
        that maps "Claim Name" to "Claim Value".
    Identity provider: An entity that creates, maintains, and manages identity
        information and provides authentication services. Such services rely on
        JWTs to send identity information. Examples of identity providers
        include: Google, Facebook, Email verification links, and Text message
        SMS codes.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib

from core.platform.datastore import gae_datastore_services as datastore_services
from core.storage.base_model import gae_models as base_model
import python_utils

import firebase_admin
from firebase_admin import auth


@contextlib.contextmanager
def acquire_auth_context():
    """Context manager in which other auth-related services must be called from.

    This function establishes the necessary setup to make calls to the rest of
    the auth_services API. DO NOT MAKE OTHER CALLS WITHOUT ACQUIRING A CONTEXT
    FIRST!

    Yields:
        None. Nada.

    Raises:
        Exception. The context could not be established.
    """
    app = firebase_admin.initialize_app()
    try:
        yield app
    finally:
        firebase_admin.delete_app(app)


def get_verified_sub(response):
    """Returns the subject identifier for the signed-in user, if any, from the
    response.

    Args:
        response: webapp2.Response. The HTTP response to inspect.

    Returns:
        str or None. The unique Firebase ID of the user that is currently logged
        in. If a user is not logged in, this value will be None.

    Raises:
        Exception. The response was not authorized.
    """
    if 'Authorization' not in response.headers:
        raise Exception('Authorization header is missing')
    auth_header = response.headers.get('Authorization', '')
    bearer, _, token = auth_header.partition(' ')
    if bearer != 'Bearer':
        raise Exception('\'Bearer \' prefix is missing')
    return auth.verify_id_token(token)['sub']


class _UserIdByFirebaseSubModel(base_model.BaseModel):
    """Stores the relationship between Firebase subject identifiers and user ID.

    Instances of this class are keyed by Firebase subject identifier.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Model contains data to delete corresponding to a user: id,
         and user_id fields.
        """
        return base_model.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user():
        """Currently, the model holds identifiers relevant only for backend that
        should not be exported.
        """
        return base_model.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user.
        Currently, the model holds authentication details relevant only for
        backend, and no exportable user data. It may contain user data in
        the future.
        """
        return dict(
            super(_UserIdByFirebaseSubModel, cls).get_export_policy(),
            **{'user_id': base_model.EXPORT_POLICY.NOT_APPLICABLE})

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of _UserIdByFirebaseSubModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether _UserIdByFirebaseSubModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any _UserIdByFirebaseSubModel refers to the given user
            ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def get_by_user_id(cls, user_id):
        """Fetch a entry by user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            _UserIdByFirebaseSubModel. The model with user_id field equal to
            user_id argument.
        """
        return cls.query(cls.user_id == user_id).get()


def get_user_id_from_sub(sub):
    """Returns the user ID associated to the given subject identifier.

    Args:
        sub: str. The subject identifier.

    Returns:
        str|None. The user ID associated to the given subject, or None if no
        association exists yet.
    """
    mapping = _UserIdByFirebaseSubModel.get_by_id(sub)
    return None if mapping is None else mapping.user_id


def get_multi_user_ids_from_subs(subs):
    """Returns the user IDs associated to the given subject identifiers.

    Args:
        subs: list(str). The subject identifiers.

    Returns:
        list(str|None). The user ID associated to each of the given subject,
        or None for associations that don't exist.
    """
    return [None if mapping is None else mapping.user_id
            for mapping in _UserIdByFirebaseSubModel.get_multi(subs)]


def associate_sub_to_user_id(sub, user_id):
    """Commits the association between user ID and Firebase subject identifier.

    Args:
        sub: str. The subject identifier of the user.
        user_id: str. The ID of the user.

    Raises:
        Exception. The subject identifier is already associated to a user_id.
    """
    claimed_user_id = get_user_id_from_sub(sub)
    if claimed_user_id is not None:
        raise Exception(
            'sub=%r is already mapped to user_id=%r' % (sub, claimed_user_id))

    mapping = _UserIdByFirebaseSubModel(id=sub, user_id=user_id)
    mapping.update_timestamps()
    mapping.put()


def associate_multi_subs_to_user_ids(subs, user_ids):
    """Commits the associations between user IDs and Firebase subject
    identifiers.

    Args:
        subs: list(str). The subject identifier of the users.
        user_ids: list(str). The ID of the users.

    Raises:
        Exception. The list lengths don't match up, or a mapping already exists.
    """
    if len(user_ids) != len(subs):
        raise Exception('input lists have unequal lengths')

    claimed_user_ids = get_multi_user_ids_from_subs(subs)
    if any(user_id is not None for user_id in claimed_user_ids):
        existing_associations = sorted(
            'sub=%r, user_id=%r' % (sub, user_id)
            for sub, user_id in python_utils.ZIP(subs, claimed_user_ids)
            if user_id is not None)
        raise Exception(
            'associations already exist for: %r' % (existing_associations,))

    mappings = [_UserIdByFirebaseSubModel(id=sub, user_id=user_id)
                for sub, user_id in python_utils.ZIP(subs, user_ids)]
    _UserIdByFirebaseSubModel.update_timestamps_multi(mappings)
    _UserIdByFirebaseSubModel.put_multi(mappings)

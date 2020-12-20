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

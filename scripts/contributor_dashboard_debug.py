# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""This script assists development of the contributor dashboard. When the
"contributor dashboard debug" flag is enabled, the start script will call the
"populate_debug_data" function, which does the following:
    1. Create an admin user with the username "a" and assign curriculum,
    translation, and question admin rights to "a".
    2. Create a non-admin user with the username "b" and give the user "submit
    question" rights.
    3. Populate sample lessons for translations. This is achieved by reproducing
    the "Load dummy new structures data" admin action.
    4. Add the topics linked to the lessons above to a classroom. This is needed
    for the topics, if published, to show up in the topic selectors and for the
    linked opportunities to show up in the "Submit Question" tab.
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import os

from core import feconf
from core.constants import constants

import firebase_admin
from firebase_admin import auth as firebase_auth
import requests
from typing import Dict, Final, Iterator, List

FIREBASE_AUTH_EMULATOR_HOST: Final = (
    'localhost:%s' % feconf.FIREBASE_EMULATOR_PORT)
FIREBASE_SIGN_IN_URL: Final = (
    'http://%s/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'
    % FIREBASE_AUTH_EMULATOR_HOST)

SUPER_ADMIN_EMAIL: Final = feconf.ADMIN_EMAIL_ADDRESS
SUPER_ADMIN_USERNAME: Final = 'a'
SUPER_ADMIN_ROLES: Final = [
    feconf.ROLE_ID_CURRICULUM_ADMIN, feconf.ROLE_ID_TRANSLATION_ADMIN,
    feconf.ROLE_ID_QUESTION_ADMIN]

CONTRIBUTOR_EMAIL: Final = 'contributor@example.com'
CONTRIBUTOR_USERNAME: Final = 'b'

CLASSROOM_NAME: Final = 'math'
CLASSROOM_URL_FRAGMENT: Final = 'math'


class ContributorDashboardDebugInitializer:
    """Contains functions that populate sample data by sending requests to the
    development server.

    Attributes:
        session: object(Session). The requests.Session object to send requests
            to the Oppia server.
        base_url: str. The base url of the Oppia server.
        csrf_token: str. The csrf token of the current session.
    """

    def __init__(self, base_url: str) -> None:
        self.session = requests.session()
        self.base_url = base_url
        self.csrf_token = ''

    def populate_debug_data(self) -> None:
        """Populate sample data to help develop for the contributor
        dashboard.
        """
        firebase_admin.initialize_app(
            options={'projectId': feconf.OPPIA_PROJECT_ID})

        self._sign_up_new_user(SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME)
        self._sign_up_new_user(CONTRIBUTOR_EMAIL, CONTRIBUTOR_USERNAME)

        self._sign_in(SUPER_ADMIN_EMAIL)
        self.csrf_token = self._get_csrf_token()
        self._assign_admin_roles(SUPER_ADMIN_ROLES, SUPER_ADMIN_USERNAME)
        self._add_submit_question_rights(CONTRIBUTOR_USERNAME)
        self._generate_sample_new_structures_data()
        self._add_topics_to_classroom(CLASSROOM_NAME, CLASSROOM_URL_FRAGMENT)

    def _sign_up_new_user(self, email: str, username: str) -> None:
        """Sign up a new user based on email and username. The password is
        generated automatically from email.
        """
        # In development mode, the "Sign In" button will call the function
        # AuthService.signInWithEmail() in the file
        # core/templates/services/auth.service.ts. That function generates a
        # password through the MD5 hash of email addresses to save developers
        # and end-to-end test authors the trouble of providing passwords. This
        # script also uses the MD5 hash when creating a user in the Firebase
        # Authentication emulator. When we want to sign in a user created using
        # this script, clicking the "Sign In" button will generate a valid
        # password which is the same as that in the emulator.
        password = hashlib.md5(email.encode('utf-8')).hexdigest()

        # The FIREBASE_AUTH_EMULATOR_HOST environment variable is set to connect
        # with the Firebase Authentication emulator.
        with self._set_environ(
            'FIREBASE_AUTH_EMULATOR_HOST', FIREBASE_AUTH_EMULATOR_HOST
        ):
            # Create a new user in Firebase.
            firebase_auth.create_user(email=email, password=password)

        # Sign up the new user in Oppia and set its username.
        self._sign_in(email)
        self._make_request('GET', '/signup?return_url=/')
        self.csrf_token = self._get_csrf_token()

        params = {'payload': json.dumps({
            'username': username,
            'agreed_to_terms': True,
            'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
        }), 'csrf_token': self.csrf_token}

        self._make_request('POST', feconf.SIGNUP_DATA_URL, params=params)

        # End current session, i.e. log out.
        self._make_request('GET', '/session_end')
        self.csrf_token = ''

    @contextlib.contextmanager
    def _set_environ(self, env_name: str, value: str) -> Iterator[None]:
        """Temporarily set the environment variable 'env_name' to 'value' while
        inside the ``with`` block.
        """
        old_value = os.environ.get(env_name)
        os.environ[env_name] = value
        try:
            yield
        finally:
            if old_value is None:
                del os.environ[env_name]
            else:
                os.environ[env_name] = old_value

    def _sign_in(self, email: str) -> None:
        """Begins a session with the given email, i.e. log in with the email."""
        password = hashlib.md5(email.encode('utf-8')).hexdigest()

        token_id = self._sign_in_with_email_and_password(email, password)
        headers = {'Authorization': 'Bearer %s' % token_id}

        self._make_request('GET', '/session_begin', headers=headers)

    def _sign_in_with_email_and_password(
        self, email: str, password: str
    ) -> str | None:
        """Signs in with email and password, and returns the token id."""
        token_id = requests.post(
            FIREBASE_SIGN_IN_URL,
            params={'key': 'fake-api-key'},
            json={
                'email': email,
                'password': password
            }
        ).json()['idToken']

        return str(token_id) if token_id else None

    def _get_csrf_token(self) -> str:
        """Gets the CSRF token."""
        response = self._make_request('GET', '/csrfhandler')
        csrf_token = str(
            json.loads(response.text[len(feconf.XSSI_PREFIX):])['token'])

        return csrf_token

    def _assign_admin_roles(self, roles: List[str], username: str) -> None:
        """Assigns the given roles to the user with the given username."""
        for role in roles:
            params = {
                'payload': json.dumps({
                    'role': role,
                    'username': username
                }),
                'csrf_token': self.csrf_token
            }
            self._make_request(
                'PUT', feconf.ADMIN_ROLE_HANDLER_URL, params=params)

    def _add_submit_question_rights(self, username: str) -> None:
        """Adds submit question rights to the user with the given username."""
        params = {
            'payload': json.dumps({'username': username}),
            'csrf_token': self.csrf_token
        }

        self._make_request(
            'POST', '/contributionrightshandler/submit_question', params=params)

    def _generate_sample_new_structures_data(self) -> None:
        """Generates sample new structures data."""
        params = {
            'payload': json.dumps({
                'action': 'generate_dummy_new_structures_data'}),
            'csrf_token': self.csrf_token
        }

        self._make_request('POST', '/adminhandler', params=params)

    def _add_topics_to_classroom(
        self, classroom_name: str, classroom_url_fragment: str
    ) -> None:
        """Adds all dummy topics to a classroom."""
        response = self._make_request(
            'GET', '/topics_and_skills_dashboard/data')
        topic_summary_dicts = json.loads(
            response.text[len(feconf.XSSI_PREFIX):])['topic_summary_dicts']
        topic_ids = [
            topic_summary_dict['id'] for topic_summary_dict in
            topic_summary_dicts]

        params = {
            'payload': json.dumps({
                'action': 'save_config_properties',
                'new_config_property_values': {
                    'classroom_pages_data': [{
                        'name': classroom_name,
                        'url_fragment': classroom_url_fragment,
                        'course_details': '',
                        'topic_list_intro': '',
                        'topic_ids': topic_ids
                    }]
                }
            }),
            'csrf_token': self.csrf_token
        }

        self._make_request('POST', '/adminhandler', params=params)

    def _make_request(
        self,
        method: str,
        url: str,
        params: Dict[str, str] | None = None,
        headers: Dict[str, str] | None = None
    ) -> requests.Response:
        """Makes a request to the Oppia server."""
        if params is None:
            params = {}
        if headers is None:
            headers = {}

        response = self.session.request(
            method, self.base_url + url, headers=headers, params=params)

        return response

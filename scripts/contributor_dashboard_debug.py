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

"""This script helps develop for the contributor dashboard."""

from __future__ import annotations

import json
import os
import requests
import hashlib

from core import feconf
from core.constants import constants

import firebase_admin
from firebase_admin import auth as firebase_auth

FIREBASE_AUTH_EMULATOR_HOST = 'localhost:%s' % feconf.FIREBASE_EMULATOR_PORT
os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = FIREBASE_AUTH_EMULATOR_HOST
FIREBASE_SIGN_IN_URL = (
    'http://' + FIREBASE_AUTH_EMULATOR_HOST +
    '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword')

SUPER_ADMIN_EMAIL = feconf.ADMIN_EMAIL_ADDRESS
SUPER_ADMIN_USERNAME = 'a'
SUPER_ADMIN_ROLES = [feconf.ROLE_ID_CURRICULUM_ADMIN,
        feconf.ROLE_ID_TRANSLATION_ADMIN, feconf.ROLE_ID_QUESTION_ADMIN]

CONTRIBUTOR_EMAIL = 'contributor@example.com'
CONTRIBUTOR_USERNAME = 'b'


class ClientRequests():
    """Requests to help develop for the contributor dashboard."""

    def __init__(self, base_url):
        self.client = requests.session()
        self.base_url = base_url
        self.csrf_token = None

    def populate_data_for_contributor_dashboard_debug(self):
        """Populate sample data to help develop for the contributor
        dashboard.
        """
        firebase_admin.initialize_app(
            options={'projectId': feconf.OPPIA_PROJECT_ID})

        self._create_new_user(SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME)
        self._create_new_user(CONTRIBUTOR_EMAIL, CONTRIBUTOR_USERNAME)

        self._begin_session(SUPER_ADMIN_EMAIL)
        self.csrf_token = self._get_csrf_token()
        self._assign_admin_roles(SUPER_ADMIN_ROLES, SUPER_ADMIN_USERNAME)
        self._add_submit_question_rights(CONTRIBUTOR_USERNAME)
        self._generate_dummy_new_structures_data()
        self._add_topics_to_classroom()

    def _make_request(self, method, url, params=None, headers=None):
        """Makes a request to the Oppia server."""
        if params is None:
            params = {}
        if headers is None:
            headers = {}

        response = self.client.request(
            method, self.base_url + url, headers=headers, params=params)

        return response

    def _create_new_user(self, email, username):
        """Creates a new user based on email and username. The password is
        generated automatically from email.
        """
        password = hashlib.md5(email.encode('utf-8')).hexdigest()

        # Create a new user in firebase.
        firebase_auth.create_user(email=email, password=password)

        # Sign up the new user in Oppia and set its username.
        self._begin_session(email)
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
        self.csrf_token = None

    def _begin_session(self, email):
        """Begin a session with the given email, i.e. log in wtih the email."""
        password = hashlib.md5(email.encode('utf-8')).hexdigest()

        token_id = requests.post(
            FIREBASE_SIGN_IN_URL,
            params={'key': 'fake-api-key'},
            json={
                'email': email,
                'password': password
        }).json()['idToken']
        headers = {'Authorization': 'Bearer %s' % token_id}

        self._make_request('GET', '/session_begin', headers=headers)

    def _get_csrf_token(self):
        """Gets the CSRF token."""
        response = self._make_request('GET', '/csrfhandler')
        csrf_token = json.loads(
            response.text[len(feconf.XSSI_PREFIX):])['token']

        return csrf_token

    def _assign_admin_roles(self, roles, username):
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

    def _add_submit_question_rights(self, username):
        """Adds submit question rights to the user with the given username."""
        params = {
            'payload': json.dumps({'username': username}),
            'csrf_token': self.csrf_token
        }

        self._make_request(
            'POST', '/contributionrightshandler/submit_question', params=params)

    def _generate_dummy_new_structures_data(self):
        """Generates dummy new structures data."""
        params = {
            'payload': json.dumps({
                'action': 'generate_dummy_new_structures_data'}),
            'csrf_token': self.csrf_token
        }

        self._make_request('POST', '/adminhandler', params=params)

    def _add_topics_to_classroom(self):
        """Adds all dummy topics to classroom."""
        response = self._make_request(
            'GET', '/topics_and_skills_dashboard/data')
        topic_summary_dicts = json.loads(
            response.text[len(feconf.XSSI_PREFIX):])['topic_summary_dicts']
        topic_ids = [topic_summary_dict['id']
                        for topic_summary_dict in topic_summary_dicts]

        params = {
            'payload': json.dumps({
                'action': 'save_config_properties',
                'new_config_property_values': {
                    'classroom_pages_data': [{
                        'name': 'dummy',
                        'url_fragment': 'dummy',
                        'course_details': '',
                        'topic_list_intro': '',
                        'topic_ids': topic_ids
                    }]
                }
            }),
            'csrf_token': self.csrf_token
        }

        self._make_request('POST', '/adminhandler', params=params)

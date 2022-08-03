import json
import os
from urllib import response
import requests
import hashlib
import pprint

import sys

THIRD_PARTY_PYTHON_LIBS_DIR = 'third_party/python_libs/'
sys.path.append(THIRD_PARTY_PYTHON_LIBS_DIR)

from core import feconf
from core.constants import constants

if 'google' in sys.modules:
    google_path = os.path.join(THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
    google_module = sys.modules['google']
    google_module.__path__ = [google_path, THIRD_PARTY_PYTHON_LIBS_DIR]
    google_module.__file__ = os.path.join(google_path, '__init__.py')
        
import google.auth
import firebase_admin
from firebase_admin import auth as firebase_auth

base_url = 'http://localhost:8181'

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

def populate_data_for_contributor_dashboard_debug():

    firebase_admin.initialize_app(
        options={'projectId': feconf.OPPIA_PROJECT_ID})
    
    _create_new_user(SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME)
    _create_new_user(CONTRIBUTOR_EMAIL, CONTRIBUTOR_USERNAME)

    _assign_admin_roles(SUPER_ADMIN_ROLES, SUPER_ADMIN_USERNAME)
    _add_submit_question_rights(CONTRIBUTOR_USERNAME)

def _create_new_user(email, username):
    """Reloads the collection in dev_mode corresponding to the given
    collection id.

    Args:
        collection_id: str. The collection id.

    Raises:
        Exception. Cannot reload a collection in production.
    """

    password = hashlib.md5(email.encode('utf-8')).hexdigest()

    # create new user in firebase
    firebase_auth.create_user(email=email, password=password)

    cookies = _get_session_cookies(email)

    # sign up new user in web app
    requests.get(base_url + '/signup?return_url=/', cookies=cookies)

    csrf_token = _get_csrf_token(cookies)

    params = {'payload': json.dumps({
        'username': username,
        'agreed_to_terms': True,
        'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
    }), 'csrf_token': csrf_token}
    requests.post(
        base_url + feconf.SIGNUP_DATA_URL, params=params, cookies=cookies)

def _get_session_cookies(email):
    password = hashlib.md5(email.encode('utf-8')).hexdigest()

    token_id = requests.post(FIREBASE_SIGN_IN_URL,
                    params={"key": 'fake-api-key'},
                    json={
                        'email': email,
                        "password": password
                    }).json()["idToken"]
    headers = {'Authorization': 'Bearer %s' % token_id}

    response = requests.get(base_url + '/session_begin', headers=headers)
    
    return response.cookies

def _get_csrf_token(cookies):
    response = requests.get(base_url + '/csrfhandler', cookies=cookies)
    csrf_token = json.loads(response.text[len(feconf.XSSI_PREFIX):])['token']

    return csrf_token

def _assign_admin_roles(roles, username):

    cookies = _get_session_cookies(SUPER_ADMIN_EMAIL)
    csrf_token = _get_csrf_token(cookies)

    for role in roles:
        requests.put(base_url + feconf.ADMIN_ROLE_HANDLER_URL, params={
            'payload': json.dumps({
                'role': role,
                'username': username
            }),
            'csrf_token': csrf_token
        }, cookies=cookies)

def _add_submit_question_rights(username):

    cookies = _get_session_cookies(SUPER_ADMIN_EMAIL)
    csrf_token = _get_csrf_token(cookies)

    requests.post(base_url + '/contributionrightshandler/submit_question',
        params={'payload': json.dumps({'username': username}),
                'csrf_token': csrf_token}, cookies=cookies)

populate_data_for_contributor_dashboard_debug()
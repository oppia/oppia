# coding: utf-8

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

"""Tests for the exploration editor page."""

from __future__ import annotations

import datetime
import io
import logging
import os
import zipfile

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import creator_dashboard
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import stats_services
from core.domain import translation_domain
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import stats_models
    from mypy_imports import user_models

(exp_models, user_models, stats_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER, models.Names.STATISTICS])


class BaseEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup('voiceoveradmin@app.com', 'voiceoverManager')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            'voiceoveradmin@app.com')

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.add_user_role('voiceoverManager', feconf.ROLE_ID_VOICEOVER_ADMIN)

        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.system_user = user_services.get_system_user()
        self.editor = user_services.get_user_actions_info(self.editor_id)
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id)

    def assert_can_edit(self, exp_id: str) -> None:
        """Returns True if the current user can edit the exploration
        editable.
        """
        response = self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id))
        self.assertEqual(response['can_edit'], True)

    def assert_cannot_edit(self, exp_id: str) -> None:
        """Returns True if the current user can not edit the exploration
        not editable.
        """
        response = self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id))
        self.assertEqual(response['can_edit'], False)

    def assert_can_voiceover(self, exp_id: str) -> None:
        """Returns True if the current user can voiceover the exploration."""
        response = self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id))
        self.assertEqual(response['can_voiceover'], True)

    def assert_cannot_voiceover(self, exp_id: str) -> None:
        """Returns True if the current user can not voiceover the
        exploration.
        """
        response = self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id))
        self.assertEqual(response['can_voiceover'], False)


class EditorTests(BaseEditorControllerTests):

    def setUp(self) -> None:
        super().setUp()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')

    def test_editor_page(self) -> None:
        """Test access to editor pages for the sample exploration."""

        # Check that non-editors can access, but not edit, the editor page.
        response = self.get_html_response('/create/0')
        self.assertIn(
            b'<exploration-editor-page></exploration-editor-page>',
            response.body)
        self.assert_cannot_edit('0')

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        # Check that it is now possible to access and edit the editor page.
        response = self.get_html_response('/create/0')
        self.assertIn(
            b'<exploration-editor-page></exploration-editor-page>',
            response.body)
        self.assert_can_edit('0')

        self.logout()

    def test_that_default_exploration_cannot_be_published(self) -> None:
        """Test that publishing a default exploration raises an error
        due to failing strict validation.
        """
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()
        exp_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token=csrf_token
        )[creator_dashboard.EXPLORATION_ID_KEY]

        csrf_token = self.get_new_csrf_token()
        publish_url = '%s/%s' % (feconf.EXPLORATION_STATUS_PREFIX, exp_id)
        self.put_json(
            publish_url, {
                'make_public': True,
            }, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_add_new_state_error_cases(self) -> None:
        """Test the error cases for adding a new state to an exploration."""
        current_version = 1

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id('0')
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        def _get_payload(
            new_state_name: str,
            version: Optional[int] = None
        ) -> Dict[str, Union[str, List[Dict[str, Union[str, int]]], int]]:
            """Gets the payload in the dict format."""
            result: Dict[
                str, Union[
                    str,
                    List[Dict[str, Union[str, int]]],
                    int
                ]
            ] = {
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': new_state_name,
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }, {
                   'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }],
                'commit_message': 'Add new state',
            }
            if version is not None:
                result['version'] = version
            return result

        def _put_and_expect_400_error(
            payload: Dict[
                str, Union[str, List[Dict[str, Union[str, int]]], int]]
        ) -> Dict[str, str]:
            """Puts a request with no version number and hence, expects 400
            error.
            """
            return self.put_json(
                '/createhandler/data/0', payload,
                csrf_token=csrf_token, expected_status_int=400)

        # A request with no version number is invalid.
        response_dict = _put_and_expect_400_error(_get_payload('New state'))
        self.assertIn(
            'Missing key in handler args: version.', response_dict['error'])

        # A request with the wrong version number is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('New state', version=123))
        self.assertIn('which is not possible', response_dict['error'])

        # A request with an empty state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('', version=current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a really long state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('a' * 100, version=current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a state name containing invalid characters is
        # invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('[Bad State Name]', version=current_version))
        self.assertIn('Invalid character [', response_dict['error'])

        # A name cannot have spaces at the front or back.
        response_dict = _put_and_expect_400_error(
            _get_payload('  aa', version=current_version))
        self.assertIn('start or end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('aa\t', version=current_version))
        self.assertIn('end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('\n', version=current_version))
        self.assertIn('end with whitespace', response_dict['error'])

        # A name cannot have consecutive whitespace.
        response_dict = _put_and_expect_400_error(
            _get_payload('The   B', version=current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('The\t\tB', version=current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])

        self.logout()

    def test_publish_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(
            exp_id, self.admin_id, end_state_name='end state')
        csrf_token = self.get_new_csrf_token()
        publish_url = '%s/%s' % (feconf.EXPLORATION_STATUS_PREFIX, exp_id)

        exploration_rights = self.put_json(
            publish_url, {},
            csrf_token=csrf_token)['rights']

        self.assertEqual(exploration_rights['status'], 'private')

        exploration_rights = self.put_json(
            publish_url, {'make_public': True},
            csrf_token=csrf_token)['rights']

        self.assertEqual(exploration_rights['status'], 'public')

        self.logout()

    def test_lock_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(
            exp_id, self.admin_id, end_state_name='end state')
        csrf_token = self.get_new_csrf_token()
        edits_allowed_url = '/editsallowedhandler/%s' % exp_id
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        self.assertEqual(exploration.edits_allowed, True)

        self.put_json(
            edits_allowed_url,
            {'edits_are_allowed': False},
            csrf_token=csrf_token)

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        self.assertEqual(exploration.edits_allowed, False)

        self.logout()

    def test_cannot_update_exploration_when_locked(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(
            exp_id, self.admin_id, end_state_name='end state')
        csrf_token = self.get_new_csrf_token()
        edits_allowed_url = '/editsallowedhandler/%s' % exp_id
        self.put_json(
            edits_allowed_url,
            {'edits_are_allowed': False},
            csrf_token=csrf_token)

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertEqual(exploration.edits_allowed, False)

        response_dict = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            {
                'version': exploration.version,
                'commit_message': 'dummy update',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State 4',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    ),
                }, {
                    'cmd': 'edit_state_property',
                    'state_name': 'State 4',
                    'property_name': 'widget_id',
                    'new_value': 'TextInput',
                }, {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertEqual(
            response_dict['error'],
            'This exploration cannot be edited. Please contact the admin.')
        self.logout()


class DownloadIntegrationTest(BaseEditorControllerTests):
    """Test handler for exploration and state download."""

    SAMPLE_JSON_CONTENT = {
        'State A': (
            """card_is_checkpoint: false
classifier_model_id: null
content:
  content_id: content_3
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_9
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: State A
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_4
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_9: {}
    content_3: {}
    default_outcome_4: {}
solicit_answer_details: false
"""),
        'State B': (
            """card_is_checkpoint: false
classifier_model_id: null
content:
  content_id: content_5
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_10
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: State B
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_6
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_10: {}
    content_5: {}
    default_outcome_6: {}
solicit_answer_details: false
"""),
        feconf.DEFAULT_INIT_STATE_NAME: (
            """card_is_checkpoint: true
classifier_model_id: null
content:
  content_id: content_0
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_2
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: %s
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_1
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_2: {}
    content_0: {}
    default_outcome_1: {}
solicit_answer_details: false
""") % feconf.DEFAULT_INIT_STATE_NAME
    }

    SAMPLE_STATE_STRING = (
        """card_is_checkpoint: false
classifier_model_id: null
content:
  content_id: content_3
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_9
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: State A
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_4
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_9: {}
    content_3: {}
    default_outcome_4: {}
solicit_answer_details: false
""")

    def test_can_not_download_exploration_with_disabled_exp_id(self) -> None:
        download_url = '/createhandler/download/5'
        self.get_json(download_url, expected_status_int=404)

    def test_exploration_download_handler_for_default_exploration(self) -> None:
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='The title for ZIP download handler test!',
            category='This is just a test category',
            objective='')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        assert init_interaction.default_outcome is not None
        init_interaction.default_outcome.dest = exploration.init_state_name
        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'auto_tts_enabled',
                    'new_value': True,
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State 2',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State 3',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State A',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'State A',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate(
                                    translation_domain.ContentType
                                    .CUSTOMIZATION_ARG,
                                    extra_prefix='placeholder'
                                ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {
                            'value': False
                        }
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State 2',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'State 2',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate(
                                    translation_domain.ContentType
                                    .CUSTOMIZATION_ARG,
                                    extra_prefix='placeholder'
                                ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {
                            'value': False
                        }
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State 3',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'State 3',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate(
                                    translation_domain.ContentType
                                    .CUSTOMIZATION_ARG,
                                    extra_prefix='placeholder'
                                ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {
                            'value': False
                        }
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'State 2',
                    'new_state_name': 'State B'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'State 3',
                }),
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                })], 'changes')
        response = self.get_html_response('/create/%s' % exp_id)

        # Check download to zip file.
        # Download to zip file using download handler.
        download_url = '/createhandler/download/%s' % exp_id
        response = self.get_custom_response(download_url, 'text/plain')

        # Check downloaded zip file.
        filename = 'oppia-ThetitleforZIPdownloadhandlertest!-v2.zip'
        self.assertEqual(
            response.headers['Content-Disposition'],
            'attachment; filename=%s' % filename)
        zf_saved = zipfile.ZipFile(io.BytesIO(response.body))
        self.assertEqual(
            zf_saved.namelist(),
            ['The title for ZIP download handler test.yaml'])

        # Load golden zip file.
        golden_zip_filepath = os.path.join(
            feconf.TESTS_DATA_DIR,
            'oppia-ThetitleforZIPdownloadhandlertest!-v2-gold.zip')
        with utils.open_file(
            golden_zip_filepath, 'rb', encoding=None) as f:
            golden_zipfile = f.read()
        zf_gold = zipfile.ZipFile(io.BytesIO(golden_zipfile))
        # Compare saved with golden file.
        self.assertEqual(
            zf_saved.open(
                'The title for ZIP download handler test.yaml').read(),
            zf_gold.open(
                'The title for ZIP download handler test!.yaml').read())

        # Check download to JSON.
        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'objective',
                    'new_value': 'Test JSON download',
                })], 'Updates exploration objective')

        # Download to JSON string using download handler.
        self.maxDiff = None
        download_url = (
            '/createhandler/download/%s?output_format=%s' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)

        # Check downloaded dict.
        self.assertEqual(self.SAMPLE_JSON_CONTENT, response)

        # Check downloading a specific version.
        download_url = (
            '/createhandler/download/%s?output_format=%s&v=1' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)
        self.assertEqual(['Introduction'], list(response.keys()))

        self.logout()

    def test_exploration_download_handler_with_unicode_title(self) -> None:
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title=u'¡Hola!',
            category='This is just a test category',
            objective='')

        # Download to zip file using download handler.
        download_url = '/createhandler/download/%s' % exp_id
        response = self.get_custom_response(download_url, 'text/plain')

        # Check downloaded zip file.
        filename = 'oppia-Hola!-v1.zip'
        self.assertEqual(
            response.headers['Content-Disposition'],
            'attachment; filename=%s' % filename)

        zf_saved = zipfile.ZipFile(io.BytesIO(response.body))
        self.assertEqual(zf_saved.namelist(), [u'Hola.yaml'])

        self.logout()

    def test_exploration_download_handler_with_no_title(self) -> None:
        # This is the case for most unpublished explorations.
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='',
            category='This is just a test category',
            objective='')

        # Download to zip file using download handler.
        download_url = '/createhandler/download/%s' % exp_id
        response = self.get_custom_response(download_url, 'text/plain')

        # Check downloaded zip file.
        filename = 'oppia-unpublished_exploration-v1.zip'
        self.assertEqual(
            response.headers['Content-Disposition'],
            'attachment; filename=%s' % filename)

        zf_saved = zipfile.ZipFile(io.BytesIO(response.body))
        self.assertEqual(zf_saved.namelist(), ['Unpublished_exploration.yaml'])

        self.logout()

    def test_state_yaml_handler(self) -> None:
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='The title for states download handler test!',
            category='This is just a test category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.set_interaction_for_state(
            exploration.states['State A'], 'TextInput', content_id_generator)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json('/createhandler/state_yaml/%s' % exp_id, {
            'state_dict': exploration.states['State A'].to_dict(),
            'width': 50,
        }, csrf_token=csrf_token)
        self.assertEqual({
            'yaml': self.SAMPLE_STATE_STRING
        }, response)

        self.logout()

    def test_state_yaml_handler_with_no_state_dict_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(exp_id, owner_id)

        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '/createhandler/state_yaml/%s' % exp_id, {},
            csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_exploration_download_handler_with_invalid_exploration_id(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/download/invalid_id',
            expected_status_int=404)

        self.logout()

    def test_guest_cannot_access_exploration_download_handler(self) -> None:
        self.save_new_valid_exploration('exp_id', 'owner_id')
        self.get_json('/createhandler/download/exp_id', expected_status_int=404)

    def test_exploration_download_handler_with_invalid_output_format(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exp_id = 'exp_id1'

        self.save_new_valid_exploration(exp_id, owner_id)

        response = self.get_json(
            '/createhandler/download/%s?output_format=invalid_output_format'
            % (exp_id), expected_status_int=400)

        error_msg = (
            'Schema validation for \'output_format\' failed: Received '
            'invalid_output_format which is not in the allowed range of '
            'choices: [\'zip\', \'json\']'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class ExplorationSnapshotsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/snapshots/invalid_id',
            expected_status_int=404)

        self.logout()

    def test_get_exploration_snapshot_history(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exploration = self.save_new_valid_exploration(exp_id, owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        snapshots = exp_services.get_exploration_snapshots_metadata(exp_id)

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            snapshot.update({
                'committer_id': 'owner'
            })

        response = self.get_json('/createhandler/snapshots/%s' % (exp_id))

        self.assertEqual(response['snapshots'], snapshots)

        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index,
                    'old_value': 0
            })], 'Addes state')

        snapshots = exp_services.get_exploration_snapshots_metadata(exp_id)

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            snapshot.update({
                'committer_id': 'owner'
            })

        response = self.get_json('/createhandler/snapshots/%s' % (exp_id))

        self.assertEqual(response['snapshots'], snapshots)

        self.logout()


class ExplorationStatisticsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/statistics/invalid_id',
            expected_status_int=404)

        self.logout()

    def test_guest_cannot_access_exploration_statistics_handler(self) -> None:
        self.save_new_valid_exploration('exp_id', 'owner_id')
        self.get_json(
            '/createhandler/statistics/exp_id', expected_status_int=404)

    def test_get_exploration_statistics(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exploration = self.save_new_valid_exploration(exp_id, owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_stats = stats_services.get_exploration_stats(
            exp_id, exploration.version)

        response = self.get_json('/createhandler/statistics/%s' % (exp_id))

        self.assertEqual(response, exp_stats.to_frontend_dict())

        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }), exp_domain.ExplorationChange({
                        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                        'property_name': 'next_content_id_index',
                        'new_value': content_id_generator.next_content_id_index,
                        'old_value': 0
                })
            ], 'Addes state')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exp_stats = stats_services.get_exploration_stats(
            exp_id, exploration.version)

        response = self.get_json('/createhandler/statistics/%s' % (exp_id))

        self.assertEqual(response, exp_stats.to_frontend_dict())

        self.logout()


class StartedTutorialEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_record_user_saw_tutorial(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(exp_id, owner_id)

        csrf_token = self.get_new_csrf_token()

        user_settings = user_services.get_user_settings(owner_id)

        self.assertFalse(user_settings.last_started_state_editor_tutorial)

        self.post_json(
            '/createhandler/started_tutorial_event/%s' % (exp_id), {},
            csrf_token=csrf_token)

        user_settings = user_services.get_user_settings(owner_id)

        self.assertTrue(user_settings.last_started_state_editor_tutorial)

        self.logout()


class TopUnresolvedAnswersHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.exp_id = 'exp_id'
        self.exploration = self.save_new_valid_exploration(
            self.exp_id, self.owner_id)

    def test_cannot_get_unresolved_answers_with_no_state_name(self) -> None:
        self.login(self.OWNER_EMAIL)

        response = self.get_json(
            '/createhandler/get_top_unresolved_answers/%s' % self.exp_id,
            expected_status_int=200)

        self.assertEqual(response['unresolved_answers'], [])

        self.logout()


class StateInteractionStatsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/state_interaction_stats/%s/%s' % (
                'invalid_id', 'state_name'),
            expected_status_int=404)

        self.logout()

    def test_cannot_get_learner_answer_statistics_with_invalid_state_name(
        self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(
            msg: str, *args: str, **unused_kwargs: str
        ) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'exception', _mock_logging_function)

        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(exp_id, owner_id)

        with logging_swap:
            self.get_json(
                '/createhandler/state_interaction_stats/%s/%s' % (
                    exp_id, 'invalid_state_name'),
                expected_status_int=404)

        self.assertEqual(len(observed_log_messages), 3)
        self.assertEqual(
            observed_log_messages[:2],
            [
                'Could not find state: invalid_state_name',
                'Available states: [\'Introduction\']'
            ]
        )
        self.assertRaisesRegex(Exception, 'Bad response: 503')

        self.logout()

    def test_get_learner_answer_statistics_for_state(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = self.save_new_valid_exploration(exp_id, owner_id)

        response = self.get_json(
            '/createhandler/state_interaction_stats/%s/%s' % (
                exp_id, exploration.init_state_name))

        self.assertEqual(response['visualizations_info'], [])


class ExplorationDeletionRightsTests(BaseEditorControllerTests):

    def test_deletion_rights_for_unpublished_exploration(self) -> None:
        """Test rights management for deletion of unpublished explorations."""
        # Unpublished exploration id.
        unpublished_exp_id = 'unpub_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            unpublished_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner, unpublished_exp_id, self.editor_id,
            rights_domain.ROLE_EDITOR)

        self.login(self.EDITOR_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=200)
        self.logout()

    def test_deletion_rights_for_published_exploration(self) -> None:
        """Test rights management for deletion of published explorations."""
        # Published exploration id.
        published_exp_id = 'pub_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id, title='A title', category='A category')
        exp_services.save_new_exploration(self.owner_id, exploration)
        rights_manager.publish_exploration(self.owner, published_exp_id)

        rights_manager.assign_role_for_exploration(
            self.owner, published_exp_id, self.editor_id,
            rights_domain.ROLE_EDITOR)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin, published_exp_id, self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST)

        self.login(self.EDITOR_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=200)
        self.logout()

    def test_logging_info_after_deletion(self) -> None:
        """Test correctness of logged statements while deleting exploration."""
        observed_log_messages = []

        def mock_logging_function(msg: str, *_: str) -> None:
            # Message logged by function clear_all_pending() in
            # oppia_tools/google_appengine_1.9.67/google_appengine/google/
            # appengine/ext/ndb/tasklets.py, not to be checked here.
            log_from_google_app_engine = 'all_pending: clear %s'

            if msg != log_from_google_app_engine:
                observed_log_messages.append(msg)

        with self.swap(logging, 'info', mock_logging_function), self.swap(
            logging, 'debug', mock_logging_function):
            # Checking for non-moderator/non-admin.

            # Unpublished exploration id.
            exp_id = 'unpub_eid'
            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id)
            exp_services.save_new_exploration(self.owner_id, exploration)

            self.login(self.OWNER_EMAIL)
            self.delete_json(
                '/createhandler/data/%s' % exp_id)

            self.assertEqual(observed_log_messages, [
                '(%s) %s tried to delete exploration %s' %
                ([feconf.ROLE_ID_FULL_USER], self.owner_id, exp_id),
                '(%s) %s deleted exploration %s' %
                ([feconf.ROLE_ID_FULL_USER], self.owner_id, exp_id)
            ])
            self.logout()

            # Checking for moderator.
            observed_log_messages = []
            # Unpublished exploration id.
            exp_id = 'unpub_eid3'
            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id)
            exp_services.save_new_exploration(self.moderator_id, exploration)

            self.login(self.MODERATOR_EMAIL)
            self.delete_json('/createhandler/data/%s' % exp_id)
            self.assertEqual(observed_log_messages, [
                '(%s) %s tried to delete exploration %s' % (
                    [feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_MODERATOR],
                    self.moderator_id, exp_id),
                '(%s) %s deleted exploration %s' % (
                    [feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_MODERATOR],
                    self.moderator_id, exp_id)
            ])
            self.logout()


class VersioningIntegrationTest(BaseEditorControllerTests):
    """Test retrieval of and reverting to old exploration versions."""

    EXP_ID = '0'

    def setUp(self) -> None:
        """Create exploration with two versions."""
        super().setUp()

        exp_services.load_demo(self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            self.system_user, self.EXP_ID)

        self.login(self.EDITOR_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # In version 2, change the objective and the initial state content.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        init_state = exploration.states[exploration.init_state_name]
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective',
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'state_name': exploration.init_state_name,
                'new_value': {
                    'content_id': init_state.content.content_id,
                    'html': '<p>ABC</p>'
                },
            })], 'Change objective and init state content')

    def test_get_with_disabled_exploration_id_raises_error(self) -> None:
        self.get_html_response(
            '%s/%s' % (
                feconf.EDITOR_URL_PREFIX, feconf.DISABLED_EXPLORATION_IDS[0]),
            expected_status_int=404)

    def test_check_revert_valid(self) -> None:
        """Test if an old exploration version is valid."""
        reader_dict = self.get_json(
            '/createhandler/check_revert_valid/%s/%s' % (self.EXP_ID, 1))
        self.assertTrue(reader_dict['valid'])
        self.assertIsNone(reader_dict['details'])

    def test_reverting_to_old_exploration(self) -> None:
        """Test reverting to old exploration versions."""
        # Open editor page.
        csrf_token = self.get_new_csrf_token()

        # May not revert to any version that's not 1.
        for rev_version in (2, 3, 4, '10'):
            response_dict = self.post_json(
                '/createhandler/revert/%s' % self.EXP_ID, {
                    'current_version': 2,
                    'revert_to_version': rev_version
                }, csrf_token=csrf_token, expected_status_int=400)

            self.assertIn('Cannot revert to version', response_dict['error'])

            # Check that exploration is really not reverted to old version.
            reader_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
            init_state_name = reader_dict['exploration']['init_state_name']
            init_state_data = (
                reader_dict['exploration']['states'][init_state_name])
            init_content = init_state_data['content']['html']
            self.assertIn('ABC', init_content)
            self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # May not revert to any version that's not convertible to int.
        for rev_version in ('abc', ()):
            response_dict = self.post_json(
                '/createhandler/revert/%s' % self.EXP_ID, {
                    'current_version': 2,
                    'revert_to_version': rev_version
                }, csrf_token=csrf_token, expected_status_int=400)

            self.assertIn(
                'Schema validation for \'revert_to_version\' '
                'failed:', response_dict['error'])

        # Revert to version 1.
        rev_version = 1
        response_dict = self.post_json(
            '/createhandler/revert/%s' % self.EXP_ID, {
                'current_version': 2,
                'revert_to_version': rev_version
            }, csrf_token=csrf_token)

        # Check that exploration is really reverted to version 1.
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))

        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertNotIn('ABC', init_content)
        self.assertIn('Hi, welcome to Oppia!', init_content)

    def test_versioning_for_default_exploration(self) -> None:
        """Test retrieval of old exploration versions."""
        # The latest version contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v1 contains 'Hi, welcome to Oppia!'.
        reader_dict = self.get_json(
            '%s/%s?v=1' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('Hi, welcome to Oppia!', init_content)
        self.assertNotIn('ABC', init_content)

        # v2 contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s?v=2' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v3 does not exist.
        self.get_json(
            '%s/%s?v=3' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID),
            expected_status_int=404)

    def test_revert_with_invalid_current_version_raises_error(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/createhandler/revert/%s' % self.EXP_ID, {
                'current_version': 'invalid_version',
                'revert_to_version': 1
            }, csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'current_version\' failed: Could not '
            'convert str to int: invalid_version'
        )
        self.assertEqual(response['error'], error_msg)


class ExplorationEditRightsTest(BaseEditorControllerTests):
    """Test the handling of edit rights for explorations."""

    def test_user_banning(self) -> None:
        """Test that banned users are banned."""

        exp_id = '0'
        exp_services.load_demo(exp_id)
        rights_manager.release_ownership_of_exploration(
            self.system_user, exp_id)

        # Sign-up new editors Joe and Sandra.
        self.signup('joe@example.com', 'joe')
        self.signup('sandra@example.com', 'sandra')

        # Joe logs in.
        self.login('joe@example.com')

        self.get_html_response(feconf.LIBRARY_INDEX_URL)
        self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(exp_id)

        # Ban joe.
        self.mark_user_banned('joe')

        # Test that Joe is banned (He can still access the library page).
        self.get_html_response(feconf.LIBRARY_INDEX_URL)
        self.get_html_response('/create/%s' % exp_id)
        self.assert_cannot_edit(exp_id)

        # Joe logs out.
        self.logout()

        # Sandra logs in and is unaffected.
        self.login('sandra@example.com')
        self.assert_can_edit(exp_id)
        self.logout()


class ExplorationRightsIntegrationTest(BaseEditorControllerTests):
    """Test the handler for managing exploration editing rights."""

    COLLABORATOR_EMAIL: Final = 'collaborator@example.com'
    COLLABORATOR_USERNAME: Final = 'collab'
    COLLABORATOR2_EMAIL: Final = 'collaborator2@example.com'
    COLLABORATOR2_USERNAME: Final = 'collab2'
    COLLABORATOR3_EMAIL: Final = 'collaborator3@example.com'
    COLLABORATOR3_USERNAME: Final = 'collab3'
    COLLABORATOR4_EMAIL: Final = 'collaborator4@example.com'
    COLLABORATOR4_USERNAME: Final = 'collab4'
    RANDOM_USER_EMAIL: Final = 'randomuser@example.com'
    RANDOM_USER_USERNAME: Final = 'randomuser'

    def test_for_deassign_editor_role(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index)
        self.set_interaction_for_state(
            exploration.states['State A'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 2'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 3'], 'TextInput', content_id_generator)
        self.logout()

        self.login(self.COLLABORATOR_EMAIL)
        self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id),
            expected_status_int=404)
        self.logout()

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
                'viewable_if_private': None
            }, csrf_token=csrf_token)
        self.logout()

        self.login(self.COLLABORATOR_EMAIL)
        self.assert_can_edit(exp_id)
        self.assert_can_voiceover(exp_id)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            rights_url, params={
                'username': self.COLLABORATOR_USERNAME
            })
        self.logout()

        self.login(self.COLLABORATOR_EMAIL)
        self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id),
            expected_status_int=404)
        self.logout()

    def test_for_deassign_sole_owner_from_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index)
        self.set_interaction_for_state(
            exploration.states['State A'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 2'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 3'], 'TextInput', content_id_generator)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)

        response = self.delete_json(
            rights_url, params={
                'username': self.OWNER_USERNAME
            }, expected_status_int=400)
        self.assertEqual(
            response['error'], 'Sorry, users cannot remove their own roles.')
        self.logout()

    def test_users_cannot_assign_other_role_to_itself(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.OWNER_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
                'make_community_owned': False,
                'viewable_if_private': None
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Users are not allowed to assign other roles to themselves.')
        self.logout()

    def test_for_deassign_viewer_role_from_exploration(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index)
        self.set_interaction_for_state(
            exploration.states['State A'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 2'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 3'], 'TextInput', content_id_generator)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id),
            expected_status_int=404)
        self.logout()

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.VIEWER_USERNAME,
                'new_member_role': rights_domain.ROLE_VIEWER,
                'viewable_if_private': None
            }, csrf_token=csrf_token)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.assert_cannot_edit(exp_id)
        self.assert_cannot_voiceover(exp_id)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            rights_url, params={
                'username': self.VIEWER_USERNAME
            })
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id),
            expected_status_int=404)
        self.logout()

    def test_role_must_be_provided_for_a_new_member(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        response = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'viewable_if_private': None
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'Please provide a role for the new member of the exploration.'
        )

    def test_that_an_editor_can_edit_the_exploration(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
                'viewable_if_private': None
            }, csrf_token=csrf_token)

        # Check that collaborator can add a new state called 'State B'.
        self.login(self.COLLABORATOR_EMAIL)
        self.assert_can_edit(exp_id)
        self.assert_can_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn('State B', reader_dict['states'])

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            {
                'version': exploration.version,
                'commit_message': 'Added State B',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State B',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }, {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=200
        )
        self.assertIn('State B', response['states'])
        self.logout()

    def test_that_an_editor_cannot_assign_role_to_others(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
                'viewable_if_private': None
            }, csrf_token=csrf_token)

        # Check that collaborator cannot add new members.
        self.login(self.COLLABORATOR_EMAIL)
        self.assert_can_edit(exp_id)
        self.assert_can_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )

        response = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR2_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
            }, csrf_token=csrf_token,
            expected_status_int=401
        )
        error_msg = (
            'You do not have credentials to change rights '
            'for this exploration.'
        )
        self.assertEqual(response['error'], error_msg)
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )
        self.logout()

    def test_that_a_viewer_cannot_edit_the_exploration(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_VIEWER,
                'viewable_if_private': None
            }, csrf_token=csrf_token)

        # Check that collaborator cannot add a new state called 'State B'.
        self.login(self.COLLABORATOR_EMAIL)
        self.assert_cannot_edit(exp_id)
        self.assert_cannot_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn('State B', reader_dict['states'])

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            {
                'version': exploration.version,
                'commit_message': 'Added State B',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State B',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }, {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=401
        )
        error_msg = (
            'You do not have permissions to save this exploration.'
        )
        self.assertEqual(response['error'], error_msg)
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn('State B', reader_dict['states'])
        self.logout()

    def test_that_a_viewer_cannot_assign_role_to_others(self) -> None:
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_VIEWER,
                'viewable_if_private': None
            }, csrf_token=csrf_token)

        # Check that collaborator cannot add new members.
        self.login(self.COLLABORATOR_EMAIL)
        self.assert_cannot_edit(exp_id)
        self.assert_cannot_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )

        response = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR2_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
                'viewable_if_private': None
            }, csrf_token=csrf_token,
            expected_status_int=401
        )
        error_msg = (
            'You do not have credentials to change rights '
            'for this exploration.'
        )
        self.assertEqual(response['error'], error_msg)
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )
        self.logout()

    def test_that_a_voice_artist_cannot_edit_the_exploration(self) -> None:
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        rights_manager.publish_exploration(self.owner, exp_id)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin, exp_id, self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST)

        voiceover_artist_email = user_services.get_email_from_user_id(
            self.voice_artist_id)

        # Check that voiceover artist cannot add a new state
        # called 'State B'.
        self.login(voiceover_artist_email)
        self.assert_cannot_edit(exp_id)
        self.assert_can_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn('State B', reader_dict['states'])

        self.put_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            {
                'version': exploration.version,
                'commit_message': 'Added State B',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State B',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }, {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=500
        )
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn('State B', reader_dict['states'])
        self.logout()

    def test_that_a_voice_artist_cannot_assign_role_to_others(self) -> None:
        self.signup(
            self.COLLABORATOR2_EMAIL, self.COLLABORATOR2_USERNAME)

        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A'])

        rights_manager.publish_exploration(self.owner, exp_id)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin, exp_id, self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST)

        voiceover_artist_email = user_services.get_email_from_user_id(
            self.voice_artist_id)

        # Check that voice artist cannot add new members.
        self.login(voiceover_artist_email)
        self.assert_cannot_edit(exp_id)
        self.assert_can_voiceover(exp_id)
        csrf_token = self.get_new_csrf_token()

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )

        response = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR2_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR,
            },
            csrf_token=csrf_token,
            expected_status_int=401
        )
        error_msg = (
            'You do not have credentials to change rights '
            'for this exploration.'
        )
        self.assertEqual(response['error'], error_msg)
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertNotIn(
            self.COLLABORATOR2_USERNAME,
            reader_dict['rights']['editor_names']
        )
        self.logout()

    def test_for_checking_username_is_valid(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        response = self.delete_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            params={'username': 'any_username'}, expected_status_int=400)
        self.assertEqual(
            response['error'], 'Sorry, we could not find the specified user.')
        self.logout()

    def test_transfering_ownership_to_the_community(self) -> None:
        """Test exploration rights handler for transfering ownership to the
        community.
        """
        # Owner creates an exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='My Exploration',
            end_state_name='END')
        csrf_token = self.get_new_csrf_token()
        rights_manager.publish_exploration(self.owner, exp_id)

        # Owner transfers ownership to the community.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'make_community_owned': True,
                'new_member_username': None,
                'new_member_role': None,
                'viewable_if_private': None
            }, csrf_token=csrf_token)

        self.logout()

        # Create a random user.
        self.signup(
            self.RANDOM_USER_EMAIL, self.RANDOM_USER_USERNAME)

        # Check community_owned_status value.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(exp_id)
        community_owned_status = exp_summary.community_owned
        self.assertTrue(community_owned_status)

        # Check that any random user can access editor page and can edit.
        self.login(self.RANDOM_USER_EMAIL)
        self.assert_can_edit(exp_id)

        self.logout()

    def test_cannot_transfer_ownership_of_invalid_exp_to_the_community(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'

        rights_manager.create_new_exploration_rights(exp_id, self.owner_id)
        content_id_generator = translation_domain.ContentIdGenerator()
        model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            language_code='invalid_language_code',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    state_domain.State.create_default_state(
                        'End',
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT),
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME),
                    is_initial_state=True
                    ).to_dict()),
            },
            next_content_id_index=content_id_generator.next_content_id_index,
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
        )
        commit_cmd = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_CREATE_NEW,
            'title': 'title',
            'category': 'category',
        })
        commit_cmds_dict = [commit_cmd.to_dict()]
        model.commit(self.owner_id, 'commit_message', commit_cmds_dict)

        # The exploration is now invalid due to invalid language code.
        # Therefore, the following PUT request will raise an exception after
        # creating a domain object from the exploration model and validating it.
        csrf_token = self.get_new_csrf_token()

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        response = self.put_json(
            rights_url, {
                'version': 1,
                'make_community_owned': True,
                'new_member_username': None,
                'new_member_role': None,
                'viewable_if_private': None
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid_language_code')

    def test_get_with_invalid_version_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            params={'v': '546'}, expected_status_int=404)
        self.logout()

    def test_put_with_long_commit_message_raises_error(self) -> None:
        # Create several users.
        self.signup(self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        long_commit_message = 'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1)

        csrf_token = self.get_new_csrf_token()

        response_dict = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            {
                'version': exploration.version,
                'commit_message': long_commit_message,
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State 4',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }, {
                    'cmd': 'edit_state_property',
                    'state_name': 'State 4',
                    'property_name': 'widget_id',
                    'new_value': 'TextInput',
                }, {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        error_msg = (
            'Schema validation for \'commit_message\' failed: Validation '
            'failed: has_length_at_most ({\'max_value\': 375}) for object %s'
            % long_commit_message
        )
        self.assertEqual(response_dict['error'], error_msg)

    def test_put_with_invalid_new_member_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            {
                'version': exploration.version,
                'new_member_username': 'invalid_new_member_username',
                'make_community_owned': False,
                'new_member_role': None,
                'viewable_if_private': None
            },
            csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Sorry, we could not find the specified user.')

    def test_put_with_deleted_user_raises_error(self) -> None:
        wipeout_service.pre_delete_user(self.viewer_id)

        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            {
                'version': exploration.version,
                'new_member_username': self.VIEWER_USERNAME,
                'make_community_owned': False,
                'new_member_role': None,
                'viewable_if_private': None
            },
            csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Sorry, we could not find the specified user.')

    def test_make_private_exploration_viewable(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration_rights = rights_manager.get_exploration_rights(exp_id)
        self.assertFalse(exploration_rights.viewable_if_private)
        self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            {
                'version': exploration.version,
                'viewable_if_private': True,
                'new_member_username': None,
                'new_member_role': None,
                'make_community_owned': False,
            }, csrf_token=csrf_token)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration_rights = rights_manager.get_exploration_rights(exp_id)
        self.assertTrue(exploration_rights.viewable_if_private)

    def test_put_with_no_specified_changes_raise_error(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            {
                'version': exploration.version,
                'new_member_username': None,
                'make_community_owned': False,
                'new_member_role': None,
                'viewable_if_private': None
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'No change was made to this exploration.')

    def test_can_not_assign_roles_with_invalid_payload_version(self) -> None:
         # Create collaborator user.
        self.signup(
            self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index)
        self.set_interaction_for_state(
            exploration.states['State A'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 2'], 'TextInput', content_id_generator)
        self.set_interaction_for_state(
            exploration.states['State 3'], 'TextInput', content_id_generator)

        csrf_token = self.get_new_csrf_token()

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)

        # Raises error as version from payload is None.
        response_dict = self.put_json(
            rights_url, {
                'version': None,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Missing key in handler args: version.')

        # Raises error as version from payload does not match the exploration
        # version.
        response_dict = self.put_json(
            rights_url, {
                'version': 2,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_domain.ROLE_EDITOR
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Trying to update version 1 of exploration from version 2, '
            'which is too old. Please reload the page and try again.')

        self.logout()


class UserExplorationEmailsIntegrationTest(BaseEditorControllerTests):
    """Test the handler for user email notification preferences."""

    def test_user_exploration_emails_handler(self) -> None:
        """Test user exploration emails handler."""

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for emails handler test!',
            category='Category')

        csrf_token = self.get_new_csrf_token()
        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertFalse(exp_email_preferences.mute_feedback_notifications)
        self.assertFalse(exp_email_preferences.mute_suggestion_notifications)

        # Owner changes email preferences.
        emails_url = '%s/%s' % (feconf.USER_EXPLORATION_EMAILS_PREFIX, exp_id)
        self.put_json(
            emails_url, {
                'mute': True,
                'message_type': 'feedback'
            }, csrf_token=csrf_token)

        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertTrue(exp_email_preferences.mute_feedback_notifications)
        self.assertFalse(exp_email_preferences.mute_suggestion_notifications)

        self.put_json(
            emails_url, {
                'mute': True,
                'message_type': 'suggestion'
            }, csrf_token=csrf_token)
        self.put_json(
            emails_url, {
                'mute': False,
                'message_type': 'feedback'
            }, csrf_token=csrf_token)

        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertFalse(exp_email_preferences.mute_feedback_notifications)
        self.assertTrue(exp_email_preferences.mute_suggestion_notifications)

        self.logout()

    def test_put_with_invalid_message_type_raises_error(self) -> None:
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/%s' % (feconf.USER_EXPLORATION_EMAILS_PREFIX, exp_id),
            {'message_type': 'invalid_message_type'},
            csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'message_type\' failed: Received '
            'invalid_message_type which is not in the allowed range '
            'of choices: [\'feedback\', \'suggestion\']'
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()


class ModeratorEmailsTests(test_utils.EmailTestBase):
    """Integration test for post-moderator action emails."""

    EXP_ID: Final = 'eid'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        # Set the default email config.
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        platform_parameter_registry.Registry.update_platform_parameter(
            (
                platform_parameter_list.ParamName.
                UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY.value
            ),
            self.admin_id,
            'Updating email body.',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': 'Default unpublishing email body'
                })
            ],
            'I\'m writing to inform you that I have unpublished the above '
            'exploration.'
        )

    def test_error_cases_for_email_sending(self) -> None:
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', False):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Get csrf token.
            csrf_token = self.get_new_csrf_token()

            # Try to unpublish the exploration without an email body. This
            # should cause an error.
            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'email_body': None,
                    'version': 1,
                }, csrf_token=csrf_token, expected_status_int=400)
            self.assertIn(
                'Missing key in handler args: email_body.',
                response_dict['error'])

            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'email_body': '',
                    'version': 1,
                }, csrf_token=csrf_token, expected_status_int=400)

            error_msg = (
                'Moderator actions should include an email to the recipient.'
            )
            self.assertIn(error_msg, response_dict['error'])

            # Try to unpublish the exploration even if the relevant feconf
            # flags are not set. This should cause a system error.
            valid_payload = {
                'email_body': 'Your exploration is featured!',
                'version': 1,
            }
            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token,
                expected_status_int=500)

            with self.swap(feconf, 'CAN_SEND_EMAILS', True):
                # Now the email gets sent with no error.
                self.put_json(
                    '/createhandler/moderatorrights/%s' % self.EXP_ID,
                    valid_payload, csrf_token=csrf_token)

            # Log out.
            self.logout()

    def test_email_is_sent_correctly_when_unpublishing(self) -> None:
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', True):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Go to the exploration editor page.
            csrf_token = self.get_new_csrf_token()

            new_email_body = 'Your exploration is unpublished :('

            valid_payload = {
                'email_body': new_email_body,
                'version': 1,
            }

            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token)

            # Check that an email was sent with the correct content.
            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            self.assertEqual(
                messages[0].sender,
                'Site Admin <%s>' % feconf.SYSTEM_EMAIL_ADDRESS)
            self.assertEqual(messages[0].to, [self.EDITOR_EMAIL])
            self.assertFalse(hasattr(messages[0], 'cc'))
            self.assertEqual(messages[0].bcc, feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(
                messages[0].subject,
                'Your Oppia exploration "My Exploration" has been unpublished')
            self.assertEqual(messages[0].body, (
                'Hi %s,\n\n'
                '%s\n\n'
                'Thanks!\n'
                '%s (Oppia moderator)\n\n'
                'You can change your email preferences via the Preferences '
                'page.' % (
                    self.EDITOR_USERNAME,
                    new_email_body,
                    self.MODERATOR_USERNAME)))
            self.assertEqual(messages[0].html, (
                'Hi %s,<br><br>'
                '%s<br><br>'
                'Thanks!<br>'
                '%s (Oppia moderator)<br><br>'
                'You can change your email preferences via the '
                '<a href="http://localhost:8181/preferences">Preferences</a> '
                'page.' % (
                    self.EDITOR_USERNAME,
                    new_email_body,
                    self.MODERATOR_USERNAME)))

            self.logout()

    def test_email_functionality_cannot_be_used_by_non_moderators(self) -> None:
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', True):
            # Log in as a non-moderator.
            self.login(self.EDITOR_EMAIL)

            # Go to the exploration editor page.
            csrf_token = self.get_new_csrf_token()

            new_email_body = 'Your exploration is unpublished :('

            valid_payload = {
                'email_body': new_email_body,
                'version': 1,
            }

            # The user should receive an 'unauthorized user' error.
            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token,
                expected_status_int=401)

            self.logout()


class FetchIssuesPlaythroughHandlerTests(test_utils.GenericTestBase):
    """Test the handling of request to fetch issues and playthroughs."""

    EXP_ID: Final = 'exp_id1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.playthrough_id1 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        self.playthrough_id2 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'MultipleIncorrectSubmissions',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'num_times_answered_incorrectly': {
                    'value': 7
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        stats_models.ExplorationIssuesModel.create(
            self.EXP_ID, 1,
            [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': [self.playthrough_id1],
                'schema_version': 1,
                'is_valid': True
            }, {
                'issue_type': 'MultipleIncorrectSubmissions',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'num_times_answered_incorrectly': {
                        'value': 7
                    }
                },
                'playthrough_ids': [self.playthrough_id2],
                'schema_version': 1,
                'is_valid': True
            }]
        )

    def test_cannot_fetch_issues_with_invalid_version(self) -> None:
        self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 2}, expected_status_int=404)

    def test_cannot_fetch_playthrough_with_invalid_playthrough_id(self) -> None:
        self.get_json(
            '/playthroughdatahandler/%s/%s' % (
                self.EXP_ID, 'invalid_playthrough_id'), expected_status_int=404)

    def test_fetch_issues_handler_with_disabled_exp_id(self) -> None:
        self.get_json(
            '/issuesdatahandler/5', params={'exp_version': 2},
            expected_status_int=404)

    def test_fetch_issues_handler(self) -> None:
        """Test that all issues get fetched correctly."""
        response = self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 1})
        self.assertEqual(len(response['unresolved_issues']), 2)
        self.assertEqual(
            response['unresolved_issues'][0]['issue_type'], 'EarlyQuit')
        self.assertEqual(
            response['unresolved_issues'][1]['issue_type'],
            'MultipleIncorrectSubmissions')

    def test_invalid_issues_are_not_retrieved(self) -> None:
        """Test that invalid issues are not retrieved."""
        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            self.EXP_ID, 1)
        assert exp_issues_model is not None
        exp_issues_model.unresolved_issues[1]['is_valid'] = False
        exp_issues_model.update_timestamps()
        exp_issues_model.put()

        response = self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 1})
        self.assertEqual(len(response['unresolved_issues']), 1)
        self.assertEqual(
            response['unresolved_issues'][0]['issue_type'], 'EarlyQuit')

    def test_fetch_playthrough_handler(self) -> None:
        """Test that the playthrough gets fetched correctly."""
        response = self.get_json(
            '/playthroughdatahandler/%s/%s' % (
                self.EXP_ID, self.playthrough_id1))
        self.assertEqual(response['exp_id'], self.EXP_ID)
        self.assertEqual(response['exp_version'], 1)
        self.assertEqual(response['issue_type'], 'EarlyQuit')
        self.assertEqual(
            response['issue_customization_args'], {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            response['actions'], [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])


class ResolveIssueHandlerTests(test_utils.GenericTestBase):
    """Test the handler for resolving issues."""

    EXP_ID: Final = 'exp_id1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.playthrough_id1 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        self.playthrough_id2 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name2'
                    }
                },
                'schema_version': 1
            }])

        stats_models.ExplorationIssuesModel.create(
            self.EXP_ID, 1,
            [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': [self.playthrough_id1, self.playthrough_id2],
                'schema_version': 1,
                'is_valid': True
            }]
        )

        self.exp_issue_dict = {
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            'playthrough_ids': [self.playthrough_id1, self.playthrough_id2],
            'schema_version': 1,
            'is_valid': True
        }

    def test_resolve_issue_handler(self) -> None:
        """Test that resolving an issue deletes associated playthroughs."""
        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token)

        exp_issues = stats_services.get_exp_issues(self.EXP_ID, 1)
        self.assertEqual(exp_issues.unresolved_issues, [])

        playthrough_instances = stats_models.PlaythroughModel.get_multi(
            [self.playthrough_id1, self.playthrough_id2])
        self.assertEqual(playthrough_instances, [None, None])

    def test_error_on_passing_invalid_exp_issue_dict(self) -> None:
        """Test that error is raised on passing invalid exploration issue
        dict.
        """
        del self.exp_issue_dict['issue_type']
        # Since we deleted the 'issue_type' key in the exploration issue dict,
        # the dict is invalid now and exception should be raised.

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token,
                expected_status_int=400)

    def test_error_on_passing_non_matching_exp_issue_dict(self) -> None:
        """Test that error is raised on passing an exploration issue dict that
        doesn't match an issue in the exploration issues model.
        """
        exp_issue_dict = {
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name2'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            'playthrough_ids': [self.playthrough_id1, self.playthrough_id2],
            'schema_version': 1,
            'is_valid': True
        }

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token,
                expected_status_int=404)

    def test_error_on_passing_invalid_exploration_version(self) -> None:

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 2
                }, csrf_token=csrf_token, expected_status_int=404)


class EditorAutosaveTest(BaseEditorControllerTests):
    """Test the handling of editor autosave actions."""

    EXP_ID1: Final = '1'
    EXP_ID2: Final = '2'
    EXP_ID3: Final = '3'
    # 30 days into the future.
    NEWER_DATETIME: Final = datetime.datetime.utcnow() + datetime.timedelta(30)
    # A date in the past.
    OLDER_DATETIME: Final = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    DRAFT_CHANGELIST: Final = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'Updated title'}]
    NEW_CHANGELIST: Final = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'New title'}]
    INVALID_CHANGELIST: Final = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'new_value': 1}]

    def _create_explorations_for_tests(self) -> None:
        """Creates the mock explorations for testing."""
        self.save_new_valid_exploration(self.EXP_ID1, self.owner_id)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        exploration.add_states(['State A'])
        exploration.states['State A'].update_interaction_id('TextInput')
        self.save_new_valid_exploration(self.EXP_ID2, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID3, self.owner_id)

    def _create_exp_user_data_model_objects_for_tests(self) -> None:
        """Creates the ExplorationUserDataModel objects for testing."""
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID1), user_id=self.owner_id,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.NEWER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID2), user_id=self.owner_id,
            exploration_id=self.EXP_ID2,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.OLDER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()

        # Exploration with no draft.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID3), user_id=self.owner_id,
            exploration_id=self.EXP_ID3).put()

    def setUp(self) -> None:
        super().setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self._create_explorations_for_tests()
        self._create_exp_user_data_model_objects_for_tests()

        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_exploration_loaded_with_draft_applied(self) -> None:
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2,
            params={'apply_draft': True})
        # Title updated because change list was applied.
        self.assertEqual(response['title'], 'Updated title')
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)
        # Draft changes passed to UI.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_when_draft_version_invalid(
        self
    ) -> None:
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        exp_user_data.draft_change_list_exp_version = 20
        exp_user_data.update_timestamps()
        exp_user_data.put()
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2,
            params={'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)
        # Draft changes passed to UI even when version is invalid.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_as_draft_does_not_exist(
        self
    ) -> None:
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID3,
            params={'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertIsNone(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 0)
        # Draft changes None.
        self.assertIsNone(response['draft_changes'])

    def test_exploration_not_updated_because_cmd_is_invalid(self) -> None:
        changelist = [dict(self.NEW_CHANGELIST[0])]
        changelist[0]['cmd'] = 'edit_exploration_propert'
        payload = {
            'change_list': changelist,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/data/%s' % self.EXP_ID3, payload,
            csrf_token=self.csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'change_list\' failed: Command '
            'edit_exploration_propert is not allowed'
        )
        self.assertEqual(response['error'], error_msg)

    def test_draft_not_updated_because_newer_draft_exists(self) -> None:
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID1, payload,
            csrf_token=self.csrf_token)
        # Check that draft change list hasn't been updated.
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID1))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)

    def test_draft_not_updated_because_cmd_is_invalid(self) -> None:
        changelist = [dict(self.NEW_CHANGELIST[0])]
        changelist[0]['cmd'] = 'edit_exploration_propert'
        payload = {
            'change_list': changelist,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID1, payload,
            csrf_token=self.csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'change_list\' failed: Command '
            'edit_exploration_propert is not allowed'
        )
        self.assertEqual(response['error'], error_msg)

    def test_draft_not_updated_validation_error(self) -> None:
        self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.DRAFT_CHANGELIST,
                'version': 1,
            }, csrf_token=self.csrf_token)
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.INVALID_CHANGELIST,
                'version': 2,
            }, csrf_token=self.csrf_token,
            expected_status_int=400)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        # ID is incremented the first time but not the second.
        self.assertEqual(exp_user_data.draft_change_list_id, 2)
        self.assertEqual(
            response, {'status_code': 400,
                       'error': 'Expected title to be a string, received 1'})

    def test_draft_updated_version_valid(self) -> None:
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)
        self.assertTrue(response['changes_are_mergeable'])

    def test_draft_not_updated_without_editing_rights(self) -> None:
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 10,
        }

        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertNotEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertNotEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertNotEqual(exp_user_data.draft_change_list_id, 2)

        # User will behave as a voice artist because check_can_edit_activity
        # is false but check_can_voiceover_activity is still true.
        get_voiceover_swap = self.swap_to_always_return(
            rights_manager, 'check_can_edit_activity', value=False)

        with get_voiceover_swap:
            response = self.put_json(
                '/createhandler/autosave_draft/%s' % self.EXP_ID2,
                payload,
                csrf_token=self.csrf_token,
                expected_status_int=400
            )
            exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
                '%s.%s' % (self.owner_id, self.EXP_ID2))
            self.assertNotEqual(
                exp_user_data.draft_change_list, self.NEW_CHANGELIST)
            self.assertNotEqual(exp_user_data.draft_change_list_exp_version, 10)
            self.assertNotEqual(exp_user_data.draft_change_list_id, 2)

        error_msg = (
            'Voice artist does not have permission to make some changes '
            'in the change list.'
        )

        self.assertEqual(response['error'], error_msg)

    def test_draft_updated_version_invalid(self) -> None:
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 10,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertFalse(response['changes_are_mergeable'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_discard_draft(self) -> None:
        self.post_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {},
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)


class HasSeenTutorialTests(BaseEditorControllerTests):

    def test_get_user_has_seen_editor_tutorial(self) -> None:
        self.login(self.OWNER_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertTrue(response['show_state_editor_tutorial_on_load'])

        user_services.record_user_started_state_editor_tutorial(
            self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertFalse(response['show_state_editor_tutorial_on_load'])

        self.logout()

    def test_get_user_has_seen_translation_tutorial(self) -> None:
        self.login(self.OWNER_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertTrue(response['show_state_translation_tutorial_on_load'])

        user_services.record_user_started_state_translation_tutorial(
            self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertFalse(response['show_state_translation_tutorial_on_load'])

        self.logout()


class StateAnswerStatisticsHandlerTests(BaseEditorControllerTests):

    def test_get_invalid_exploration_id(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            illegal_id = '@#$%^&*'
            self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, illegal_id),
                expected_status_int=400)

    def test_get_missing_exploration_id(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            missing_id = '0'
            self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, missing_id),
                expected_status_int=404)

    def test_get_returns_empty_values_from_unvisited_exploration(
        self
    ) -> None:
        with self.login_context(self.OWNER_EMAIL) as owner_id:
            assert owner_id is not None
            exp_id = exp_fetchers.get_new_exploration_id()
            self.save_new_valid_exploration(exp_id, owner_id)

            state_stats = self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, exp_id))

        self.assertEqual(state_stats['answers'], {})

    def test_get_returns_assigned_interaction_ids_of_exploration_states(
        self
    ) -> None:
        with self.login_context(self.OWNER_EMAIL) as owner_id:
            assert owner_id is not None
            exp_id = exp_fetchers.get_new_exploration_id()
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, owner_id,
                ['A', 'B', 'End'], ['FractionInput', 'TextInput'])

            state_stats = self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, exp_id))

        self.assertEqual(state_stats['interaction_ids'], {})


class LearnerAnswerInfoHandlerTests(BaseEditorControllerTests):

    def setUp(self) -> None:
        super().setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(self.exp_id, self.owner_id)

        self.entity_type = feconf.ENTITY_TYPE_EXPLORATION
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

        self.state_name = self.exploration.init_state_name
        interaction_id = self.exploration.states[
            self.state_name].interaction.id
        assert interaction_id is not None
        self.interaction_id = interaction_id
        self.customization_args = self.exploration.states[
            self.state_name].interaction.to_dict()['customization_args']
        self.answer = 'This is an answer'
        self.answer_details = 'These are the answer details'
        self.state_reference = (
            stats_services.get_state_reference_for_exploration(
                self.exp_id, self.state_name))
        stats_services.record_learner_answer_info(
            self.entity_type, self.state_reference, self.interaction_id,
            self.answer, self.answer_details)

    def test_get_learner_answer_details_of_exploration_states(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', False):
            response = self.get_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id),
                expected_status_int=404)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                self.entity_type, self.state_reference)
            assert learner_answer_details is not None
            learner_answer_info_dicts = [
                learner_answer_info.to_dict() for
                learner_answer_info in
                learner_answer_details.learner_answer_info_list]
            learner_answer_info_data = {'learner_answer_info_data': [{
                'state_name': self.state_name,
                'interaction_id': self.interaction_id,
                'customization_args': self.customization_args,
                'learner_answer_info_dicts': learner_answer_info_dicts
            }]}
            response = self.get_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id))
            self.assertEqual(response, learner_answer_info_data)
        self.logout()

    def test_get_learner_answer_details_of_question_states(self) -> None:
        self.login(self.OWNER_EMAIL)
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        question = self.save_new_question(
            question_id, self.owner_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)
        self.assertIsNotNone(question)
        interaction_id = question.question_state_data.interaction.id
        customization_args = (
            question.question_state_data.interaction.to_dict()[
                'customization_args'])
        state_reference = (
            stats_services.get_state_reference_for_question(question_id))
        self.assertEqual(state_reference, question_id)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_QUESTION, state_reference, self.interaction_id,
            self.answer, self.answer_details)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            assert learner_answer_details is not None
            learner_answer_info_dicts = [learner_answer_info.to_dict() for
                                         learner_answer_info in
                                         learner_answer_details
                                         .learner_answer_info_list]
            learner_answer_info_data = {'learner_answer_info_data': {
                'interaction_id': interaction_id,
                'customization_args': customization_args,
                'learner_answer_info_dicts': learner_answer_info_dicts
            }}
            response = self.get_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id))
            self.assertEqual(response, learner_answer_info_data)
        self.logout()

    def test_delete_learner_answer_info_of_exploration_states(self) -> None:
        self.login(self.OWNER_EMAIL)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', False):
            self.delete_json(
                '%s/%s/%s?state_name=%s&learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name, 'learner_answer_info_id'),
                expected_status_int=404)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                self.entity_type, self.state_reference)
            assert learner_answer_details is not None
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 1)
            learner_answer_info_id = (
                learner_answer_details.learner_answer_info_list[0].id)
            self.assertIsNotNone(learner_answer_info_id)
            self.delete_json(
                '%s/%s/%s?state_name=%s&learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name, learner_answer_info_id))
            updated_learner_answer_details = (
                stats_services.get_learner_answer_details(
                    self.entity_type, self.state_reference
                )
            )
            assert updated_learner_answer_details is not None
            self.assertEqual(
                len(
                    updated_learner_answer_details.learner_answer_info_list
                ), 0
            )
            self.delete_json(
                '%s/%s/%s?learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    learner_answer_info_id), expected_status_int=400)
            self.delete_json(
                '%s/%s/%s?state_name=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name), expected_status_int=400)
        self.logout()

    def test_delete_learner_answer_info_of_question_states(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        question = self.save_new_question(
            question_id, self.owner_id,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_1'],
            content_id_generator.next_content_id_index)
        self.assertIsNotNone(question)
        state_reference = (
            stats_services.get_state_reference_for_question(question_id))
        self.assertEqual(state_reference, question_id)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_QUESTION, state_reference, self.interaction_id,
            self.answer, self.answer_details)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            assert learner_answer_details is not None
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 1)
            learner_answer_info_id = (
                learner_answer_details.learner_answer_info_list[0].id)
            self.assertIsNotNone(learner_answer_info_id)
            self.delete_json(
                '%s/%s/%s?learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id,
                    learner_answer_info_id))
            updated_learner_answer_details = (
                stats_services.get_learner_answer_details(
                    feconf.ENTITY_TYPE_QUESTION, state_reference
                )
            )
            assert updated_learner_answer_details is not None
            self.assertEqual(
                len(updated_learner_answer_details.learner_answer_info_list), 0)
        self.logout()


class UserExplorationPermissionsHandlerTests(BaseEditorControllerTests):

    def test_rights_handler_returns_appropriate_rights(self) -> None:
        """Test that rights handler returns the correct rights of a user
        for an exploration.
        """

        self.login(self.EDITOR_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.editor_id)

        response = self.get_json(
            '%s/%s' % (feconf.USER_PERMISSIONS_URL_PREFIX, exp_id))

        self.assertTrue(response['can_delete'])
        self.assertTrue(response['can_edit'])
        self.assertTrue(response['can_modify_roles'])
        self.assertTrue(response['can_publish'])
        self.assertFalse(response['can_release_ownership'])
        self.assertTrue(response['can_voiceover'])
        self.assertFalse(response['can_unpublish'])
        self.assertFalse(response['can_manage_voice_artist'])

        self.logout()


class ImageUploadHandlerTests(BaseEditorControllerTests):

    def test_return_error_when_image_not_uploaded(self) -> None:
        """Test that an error is returned when no image is uploaded."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.editor_id)

        filename = 'image_file.svg'
        filename_prefix = 'image'

        publish_url = '%s/%s/%s' % (
            feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            feconf.ENTITY_TYPE_EXPLORATION, exp_id)

        # Check that the file is not already present.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertFalse(fs.isfile(filepath))

        response = self.post_json(
            publish_url, {
                'image': 'sample_image',
                'filename': filename,
                'filename_prefix': filename_prefix
            },
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=[('image', 'unused_filename', b'')]
        )

        error_msg = 'No image supplied'
        self.assertEqual(response['error'], error_msg)

        # Check that the file is not uploaded.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertFalse(fs.isfile(filepath))

        self.logout()

    def test_return_error_when_uploaded_image_already_exists(self) -> None:
        """Test that an error is returned when uploaded
        image already exists.
        """

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.editor_id)

        filename = 'img.png'
        filename_prefix = 'image'

        publish_url = '%s/%s/%s' % (
            feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            feconf.ENTITY_TYPE_EXPLORATION, exp_id)

        # Check that the file is not already present.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertFalse(fs.isfile(filepath))

        # Read raw image for testing.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()

        get_image_exists_swap = self.swap_to_always_return(
            fs_services.GcsFileSystem, 'isfile', value=True)

        with get_image_exists_swap:
            response = self.post_json(
                publish_url, {
                    'image': 'img',
                    'filename': filename,
                    'filename_prefix': filename_prefix
                },
                csrf_token=csrf_token,
                expected_status_int=400,
                upload_files=[('image', 'unused_filename', raw_image)]
            )

        error_msg = (
            'A file with the name %s already exists. Please choose a '
            'different name.' % filename
        )
        self.assertEqual(response['error'], error_msg)

        # Check that the file is not uploaded.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertFalse(fs.isfile(filepath))

        self.logout()

    def test_upload_successful_when_image_uploaded(self) -> None:
        """Test that no error is returned when valid image is uploaded."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.editor_id)

        filename = 'img.png'
        filename_prefix = 'image'

        publish_url = '%s/%s/%s' % (
            feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            feconf.ENTITY_TYPE_EXPLORATION, exp_id)

        # Check that the file is not already present.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertFalse(fs.isfile(filepath))
        # Read raw image for testing.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()

        response = self.post_json(
            publish_url, {
                'image': 'img',
                'filename': filename,
                'filename_prefix': filename_prefix
            },
            csrf_token=csrf_token,
            expected_status_int=200,
            upload_files=[('image', 'unused_filename', raw_image)]
        )
        self.assertEqual(response['filename'], filename)

        # Check that the file is uploaded successfully.
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        filepath = '%s/%s' % (filename_prefix, filename)
        self.assertTrue(fs.isfile(filepath))

        self.logout()

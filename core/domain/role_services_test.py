# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Test functions relating to roles and actions."""

from __future__ import annotations

import datetime
from unittest import mock

from core import feconf, utils
from core.domain import role_domain, role_services
from core.storage.audit import gae_models
from core.tests import test_utils

from typing import Dict


class RolesAndActionsServicesUnitTests(test_utils.GenericTestBase):
    """Tests for roles and actions."""

    def test_get_role_actions_return_value_in_correct_schema(self) -> None:
        role_actions = role_services.get_role_actions()

        self.assertTrue(isinstance(role_actions, dict))
        for role_name, allotted_actions in role_actions.items():
            self.assertTrue(isinstance(role_name, str))
            self.assertTrue(isinstance(allotted_actions, list))
            self.assertEqual(len(set(allotted_actions)), len(allotted_actions))
            for action_name in allotted_actions:
                self.assertTrue(isinstance(action_name, str))

    def test_get_all_actions(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Role TEST_ROLE does not exist.'
        ):
            role_services.get_all_actions(['TEST_ROLE'])

        self.assertEqual(
            role_services.get_all_actions([feconf.ROLE_ID_GUEST]),
            [role_services.ACTION_PLAY_ANY_PUBLIC_ACTIVITY],
        )

    def test_get_actions_question_admin(self) -> None:
        self.assertCountEqual(
            role_services.get_all_actions([feconf.ROLE_ID_QUESTION_ADMIN]),
            [
                role_services.ACTION_ACCESS_CONTRIBUTOR_DASHBOARD_ADMIN_PAGE,
                role_services.ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD,
                role_services.ACTION_MANAGE_QUESTION_CONTRIBUTOR_ROLES,
                role_services.ACTION_DELETE_ANY_QUESTION,
                role_services.ACTION_EDIT_ANY_QUESTION,
                role_services.ACTION_MANAGE_QUESTION_RIGHTS,
                role_services.ACTION_VISIT_ANY_QUESTION_EDITOR_PAGE,
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE,
                role_services.ACTION_MANAGE_QUESTION_SKILL_STATUS,
            ],
        )

    def test_action_allocated_to_all_allowed_roles(self) -> None:
        role_actions = role_services.get_role_actions()

        self.assertItemsEqual(list(role_actions), feconf.ALLOWED_USER_ROLES)

    def test_log_role_query(self) -> None:
        self.assertEqual(
            gae_models.RoleQueryAuditModel.has_reference_to_user_id(
                'uid_%s' % ('a' * 32)
            ),
            False,
        )
        role_services.log_role_query(
            'uid_%s' % ('a' * 32), feconf.ROLE_ACTION_ADD, role='GUEST'
        )
        self.assertEqual(
            gae_models.RoleQueryAuditModel.has_reference_to_user_id(
                'uid_%s' % ('a' * 32)
            ),
            True,
        )

    def test_log_role_query_rejects_malformed_user_id(self) -> None:
        with self.assertRaisesRegex(utils.ValidationError, 'user_id'):
            role_services.log_role_query(
                'TEST_USER', feconf.ROLE_ACTION_ADD, role='GUEST'
            )
        self.assertEqual(gae_models.RoleQueryAuditModel.query().count(), 0)

    def test_log_role_query_preserves_storage_fields(self) -> None:
        user_id = 'uid_%s' % ('a' * 32)
        now = datetime.datetime(2026, 10, 29)
        with self.swap(utils, 'get_current_utc_datetime', lambda: now):
            with mock.patch(
                'core.domain.role_services.time.time', return_value=1234.9
            ):
                with mock.patch(
                    'core.domain.role_services.random.randint', return_value=42
                ):
                    role_services.log_role_query(
                        user_id,
                        feconf.ROLE_ACTION_VIEW_BY_USERNAME,
                        role='',
                        username=' nonexistent/query ',
                    )
        audit = gae_models.RoleQueryAuditModel.get(
            '%s.1234.%s.42' % (user_id, feconf.ROLE_ACTION_VIEW_BY_USERNAME)
        )
        self.assertEqual(audit.user_id, user_id)
        self.assertEqual(audit.intent, feconf.ROLE_ACTION_VIEW_BY_USERNAME)
        self.assertEqual(audit.role, '')
        self.assertEqual(audit.username, ' nonexistent/query ')
        self.assertEqual(audit.created_on, now)
        self.assertEqual(audit.last_updated, now)
        self.assertFalse(audit.deleted)
        role_services.log_role_query(user_id, feconf.ROLE_ACTION_REMOVE)
        self.assertEqual(gae_models.RoleQueryAuditModel.query().count(), 2)

    def test_log_role_query_rejects_invalid_payloads(self) -> None:
        user_id = 'uid_%s' % ('a' * 32)
        for field, value in (
            ('intent', 'unknown'),
            ('role', 1),
            ('username', False),
        ):
            with self.subTest(field=field):
                with mock.patch(
                    'core.domain.role_services.time.time'
                ) as timestamp:
                    with mock.patch(
                        'core.domain.role_services.random.randint'
                    ) as random_id:
                        with self.assertRaisesRegex(
                            utils.ValidationError, field
                        ):
                            # Here we use object because payload values have
                            # deliberately invalid, unrelated types.
                            payload: Dict[str, object] = {
                                'user_id': user_id,
                                'intent': feconf.ROLE_ACTION_ADD,
                            }
                            payload[field] = value
                            # Here we use MyPy ignore because this call tests
                            # deliberately invalid argument types.
                            role_services.log_role_query(**payload)  # type: ignore[arg-type]
                        timestamp.assert_not_called()
                        random_id.assert_not_called()
                self.assertEqual(
                    gae_models.RoleQueryAuditModel.query().count(), 0
                )

    def test_log_role_query_validates_domain_before_saving(self) -> None:
        with mock.patch.object(
            role_domain.RoleQueryAudit,
            'validate',
            side_effect=utils.ValidationError('Invalid audit'),
        ):
            with mock.patch.object(
                role_services, '_save_role_query_audit'
            ) as save:
                with self.assertRaisesRegex(
                    utils.ValidationError, 'Invalid audit'
                ):
                    role_services.log_role_query(
                        'uid_%s' % ('a' * 32), feconf.ROLE_ACTION_ADD
                    )
                save.assert_not_called()
        self.assertEqual(gae_models.RoleQueryAuditModel.query().count(), 0)

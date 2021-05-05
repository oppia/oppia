# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.transforms.exp_model_audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.platform import models
from jobs import job_test_utils
from jobs.transforms import exp_model_audits
import utils

import apache_beam as beam

(base_models, exp_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])


class ValidateExplorationCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = exp_models.ExplorationSnapshotMetadataModel(
            id='model_id-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_model_audits
                .ValidateExplorationCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])

    def test_exp_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'
        ):
            exp_domain.ExplorationChange({'invalid': 'data'})

    def test_exp_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'
        ):
            exp_domain.ExplorationChange({'cmd': 'invalid'})

    def test_exp_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value')
        ):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'old_value': 'old_value'
            })

    def test_exp_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')
        ):
            exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': 'old_state_name',
                'new_state_name': 'new_state_name',
                'invalid': 'invalid'
            })

    def test_exp_change_object_with_invalid_exploration_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd edit_exploration_property: '
                'invalid is not allowed')
        ):
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_exp_change_object_with_invalid_state_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd edit_state_property: '
                'invalid is not allowed')
        ):
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': 'state_name',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_exp_change_object_with_create_new(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'create_new',
            'category': 'category',
            'title': 'title'
        })

        self.assertEqual(exp_change_object.cmd, 'create_new')
        self.assertEqual(exp_change_object.category, 'category')
        self.assertEqual(exp_change_object.title, 'title')

    def test_exp_change_object_with_add_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'add_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_rename_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'old_state_name',
            'new_state_name': 'new_state_name'
        })

        self.assertEqual(exp_change_object.cmd, 'rename_state')
        self.assertEqual(exp_change_object.old_state_name, 'old_state_name')
        self.assertEqual(exp_change_object.new_state_name, 'new_state_name')

    def test_exp_change_object_with_delete_state(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'state_name',
        })

        self.assertEqual(exp_change_object.cmd, 'delete_state')
        self.assertEqual(exp_change_object.state_name, 'state_name')

    def test_exp_change_object_with_edit_state_property(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'state_name',
            'property_name': 'content',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(exp_change_object.cmd, 'edit_state_property')
        self.assertEqual(exp_change_object.state_name, 'state_name')
        self.assertEqual(exp_change_object.property_name, 'content')
        self.assertEqual(exp_change_object.new_value, 'new_value')
        self.assertEqual(exp_change_object.old_value, 'old_value')

    def test_exp_change_object_with_edit_exploration_property(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(exp_change_object.cmd, 'edit_exploration_property')
        self.assertEqual(exp_change_object.property_name, 'title')
        self.assertEqual(exp_change_object.new_value, 'new_value')
        self.assertEqual(exp_change_object.old_value, 'old_value')

    def test_exp_change_object_with_migrate_states_schema_to_latest_version(
            self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': 'migrate_states_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            exp_change_object.cmd, 'migrate_states_schema_to_latest_version')
        self.assertEqual(exp_change_object.from_version, 'from_version')
        self.assertEqual(exp_change_object.to_version, 'to_version')

    def test_exp_change_object_with_revert_commit(self):
        exp_change_object = exp_domain.ExplorationChange({
            'cmd': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
            'version_number': 'version_number'
        })

        self.assertEqual(
            exp_change_object.cmd,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT)
        self.assertEqual(exp_change_object.version_number, 'version_number')

    def test_to_dict(self):
        exp_change_dict = {
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category'
        }
        exp_change_object = exp_domain.ExplorationChange(exp_change_dict)
        self.assertEqual(exp_change_object.to_dict(), exp_change_dict)

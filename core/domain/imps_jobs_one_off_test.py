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

"""Tests for Skill-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import imps_jobs_one_off
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

base_models, exp_models, imps_models = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.improvements
])


def _create_task(
        entity_id, task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE, task_id=None,
        entity_type=feconf.ENTITY_TYPE_EXPLORATION, target_type=None,
        target_id=None, entity_version_start=1, entity_version_end=None,
        status=imps_models.STATUS_OPEN, closed_on=None, closed_by=None,
        task_summary=None):
    """Helper method to create a simple task. The default values assume the task
    is a high bounce-rate type, intended for an exploration.
    """
    if task_id is None:
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            entity_type, entity_id, task_type)
    task = imps_models.TaskEntryModel(
        id=task_id, entity_type=entity_type, entity_id=entity_id,
        task_type=task_type, entity_version_start=entity_version_start,
        entity_version_end=entity_version_end, target_type=target_type,
        target_id=target_id, status=status, closed_on=closed_on,
        closed_by=closed_by, task_summary=task_summary)
    task.put()
    return task


class TaskEntryModelAuditOneOffJobTests(test_utils.GenericTestBase):

    def count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def run_one_off_job(self):
        """Begins the one off job and asserts it completes as expected.

        Assumes the existence of a class constant ONE_OFF_JOB_CLASS, pointing
        to the queue under test.

        Returns:
            *. The output of the one off job.
        """
        job_id = imps_jobs_one_off.TaskEntryModelAuditOneOffJob.create_new()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        imps_jobs_one_off.TaskEntryModelAuditOneOffJob.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return imps_jobs_one_off.TaskEntryModelAuditOneOffJob.get_output(job_id)

    def test_job_when_no_models_exist(self):
        self.assertEqual(self.run_one_off_job(), [])

    def test_task_with_invalid_entity_id(self):
        _create_task('invalid_exp_id')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        error = output[0]
        self.assertIn('ENTITY_ID_ERROR', error)
        self.assertIn('exploration{id:invalid_exp_id} does not exist', error)

    def test_tasks_with_version_collisions(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task('exp_id', entity_version_start=1, entity_version_end=3)
        _create_task('exp_id', entity_version_start=2, entity_version_end=4)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 2)
        self.assertIn('ENTITY_VERSION_COLLISION', output[0])
        self.assertIn('ENTITY_VERSION_COLLISION', output[1])
        self.assertIn('collision at version 2', output[0])
        self.assertIn('collision at version 2', output[1])

    def test_tasks_with_no_version_collisions(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task('exp_id', entity_version_start=1, entity_version_end=3)
        _create_task('exp_id', entity_version_start=3, entity_version_end=None)

        output = self.run_one_off_job()

        self.assertEqual(output, [])

    def test_tasks_with_valid_target_and_version_collisions(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task(
            'exp_id', entity_version_start=1, entity_version_end=3,
            target_type='state', target_id=feconf.DEFAULT_INIT_STATE_NAME)
        _create_task(
            'exp_id', entity_version_start=2, entity_version_end=4,
            target_type='state', target_id=feconf.DEFAULT_INIT_STATE_NAME)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 2)
        self.assertIn('ENTITY_VERSION_COLLISION', output[0])
        self.assertIn('ENTITY_VERSION_COLLISION', output[1])
        self.assertIn('collision at version 2', output[0])
        self.assertIn('collision at version 2', output[1])

    def test_tasks_with_valid_target_and_no_version_collisions(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task(
            'exp_id', entity_version_start=1, entity_version_end=3,
            target_type='state', target_id=feconf.DEFAULT_INIT_STATE_NAME)
        _create_task(
            'exp_id', entity_version_start=3, entity_version_end=None,
            target_type='state', target_id=feconf.DEFAULT_INIT_STATE_NAME)

        output = self.run_one_off_job()

        self.assertEqual(output, [])

    def test_task_with_invalid_version(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v4
        super( # Bypass logic to delete every exploration version.
            base_models.VersionedModel,
            exp_models.ExplorationModel.get('exp_id', version=2)).delete()

        _create_task('exp_id', entity_version_start=1, entity_version_end=4)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('ENTITY_ID_ERROR', output[0])
        self.assertIn('exp_id is invalid', output[0])

    def test_task_with_empty_version_range(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task('exp_id', entity_version_start=2, entity_version_end=2)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('ENTITY_VERSION_ERROR', output[0])
        self.assertIn('empty range: [2, 2)', output[0])

    def test_task_with_invalid_version_range(self):
        self.save_new_default_exploration('exp_id', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'exp_id', None, 'noop') # v3

        _create_task('exp_id', entity_version_start=2, entity_version_end=0)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('ENTITY_VERSION_ERROR', output[0])
        self.assertIn('invalid range: [2, 0)', output[0])

    def test_task_with_untargetable_target(self):
        self.save_new_default_exploration('exp_id', 'owner_id')

        _create_task(
            'exp_id', target_type='TEST_ONLY_TARGET_TYPE', target_id='foo')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_TYPE_ERROR', output[0])
        self.assertIn(
            'TEST_ONLY_TARGET_TYPE is invalid target for exploration entities',
            output[0])

    def test_task_with_missing_target_id(self):
        self.save_new_default_exploration('exp_id', 'owner_id')

        _create_task('exp_id', target_type='state', target_id=None)

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_TYPE_ERROR', output[0])
        self.assertIn('target_type is state, but target_id is empty', output[0])

    def test_task_with_missing_target_type(self):
        self.save_new_default_exploration('exp_id', 'owner_id')

        _create_task('exp_id', target_type=None, target_id='init')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_TYPE_ERROR', output[0])
        self.assertIn('target_type is empty, but target_id is init', output[0])

    def test_task_with_target_id_that_never_existed(self):
        self.save_new_default_exploration('exp_id', 'owner_id')

        _create_task('exp_id', target_type='state', target_id='bad_state_name')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_ID_ERROR', output[0])
        self.assertIn(
            'state{id:bad_state_name} does not exist at version 1', output[0])

    def test_task_with_target_id_that_changes(self):
        self.save_new_linear_exp_with_state_names_and_interactions( # v1
            'exp_id', 'owner_id', ['A', 'B'], ['TextInput'])
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': 'B',
                'new_state_name': 'C',
            }),
        ]
        exp_services.update_exploration( # v2
            'owner_id', 'exp_id', change_list, 'B -> C')

        _create_task('exp_id', target_type='state', target_id='B')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_ID_ERROR', output[0])
        self.assertIn('state{id:B} does not exist at version 2', output[0])

    def test_tasks_correctly_targeting_renamed_state(self):
        self.save_new_linear_exp_with_state_names_and_interactions( # v1
            'exp_id', 'owner_id', ['A', 'B'], ['TextInput'])
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': 'B',
                'new_state_name': 'C',
            }),
        ]
        exp_services.update_exploration( # v2
            'owner_id', 'exp_id', change_list, 'B -> C')

        _create_task(
            'exp_id', target_type='state', target_id='B',
            entity_version_start=1, entity_version_end=2)
        _create_task(
            'exp_id', target_type='state', target_id='C',
            entity_version_start=2, entity_version_end=None)

        output = self.run_one_off_job()

        self.assertEqual(output, [])

    def test_task_with_target_id_that_gets_deleted(self):
        self.save_new_linear_exp_with_state_names_and_interactions( # v1
            'exp_id', 'owner_id', ['A', 'B'], ['TextInput'])
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'delete_state', 'state_name': 'B'})
        ]
        exp_services.update_exploration( # v2
            'owner_id', 'exp_id', change_list, 'B is deleted')

        _create_task('exp_id', target_type='state', target_id='B')

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('TARGET_ID_ERROR', output[0])
        self.assertIn('state{id:B} does not exist at version 2', output[0])

    def test_task_with_target_id_that_gets_deleted_after_version_end(self):
        self.save_new_linear_exp_with_state_names_and_interactions( # v1
            'exp_id', 'owner_id', ['A', 'B'], ['TextInput'])
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'delete_state', 'state_name': 'B'})
        ]
        exp_services.update_exploration( # v2
            'owner_id', 'exp_id', change_list, 'B is deleted')

        _create_task(
            'exp_id', target_type='state', target_id='B', entity_version_end=2)

        output = self.run_one_off_job()

        self.assertEqual(output, [])

# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for fix_duplicate_content_ids_jobs."""

from __future__ import annotations

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import fix_duplicate_content_ids_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class IdentifyExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.PipelinedTestBase
):
    """Tests for IdentifyExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = fix_duplicate_content_ids_jobs.IdentifyExplorationsWithDuplicateContentIdsJob

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_exploration_without_duplicates(self) -> None:
        """Test that explorations without duplicates are not flagged."""
        # Create exploration with unique content IDs
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id1', title='Test Exploration', category='Algebra')
        
        # Modify states to have unique content IDs
        exploration.states['Introduction'].content.content_id = 'content_1'
        exploration.states['Introduction'].interaction.default_outcome.feedback.content_id = 'default_outcome_1'
        
        exp_services.save_new_exploration(self.owner_id, exploration)
        
        self.assert_job_output_is_empty()

    def test_exploration_with_duplicates(self) -> None:
        """Test that explorations with duplicate content IDs are identified."""
        # Create exploration with duplicate content IDs
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id2', title='Test Exploration', category='Algebra')
        
        # Create a second state
        exploration.add_states(['State2'])
        
        # Set duplicate content IDs
        duplicate_content_id = 'solution_137'
        exploration.states['Introduction'].content.content_id = duplicate_content_id
        exploration.states['State2'].content.content_id = duplicate_content_id
        
        exp_services.save_new_exploration(self.owner_id, exploration)
        
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'Exploration exp_id2 (version 1) has duplicate content IDs: '
                '{\'solution_137\': [\'Introduction\', \'State2\']}'
            )
        ])

    def test_multiple_explorations_with_duplicates(self) -> None:
        """Test multiple explorations with different duplicate patterns."""
        # First exploration with duplicates
        exploration1 = exp_domain.Exploration.create_default_exploration(
            'exp_id3', title='Test Exploration 1', category='Algebra')
        exploration1.add_states(['State2'])
        
        duplicate_id1 = 'solution_139'
        exploration1.states['Introduction'].content.content_id = duplicate_id1
        exploration1.states['State2'].content.content_id = duplicate_id1
        
        exp_services.save_new_exploration(self.owner_id, exploration1)
        
        # Second exploration with different duplicates
        exploration2 = exp_domain.Exploration.create_default_exploration(
            'exp_id4', title='Test Exploration 2', category='Algebra')
        exploration2.add_states(['State2', 'State3'])
        
        duplicate_id2 = 'hint_140'
        exploration2.states['Introduction'].content.content_id = duplicate_id2
        exploration2.states['State2'].content.content_id = duplicate_id2
        exploration2.states['State3'].content.content_id = duplicate_id2
        
        exp_services.save_new_exploration(self.owner_id, exploration2)
        
        expected_outputs = [
            job_run_result.JobRunResult.as_stdout(
                'Exploration exp_id3 (version 1) has duplicate content IDs: '
                '{\'solution_139\': [\'Introduction\', \'State2\']}'
            ),
            job_run_result.JobRunResult.as_stdout(
                'Exploration exp_id4 (version 1) has duplicate content IDs: '
                '{\'hint_140\': [\'Introduction\', \'State2\', \'State3\']}'
            )
        ]
        
        self.assert_job_output_is(expected_outputs)


class FixExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.PipelinedTestBase
):
    """Tests for FixExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = fix_duplicate_content_ids_jobs.FixExplorationsWithDuplicateContentIdsJob

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_exploration_without_duplicates_not_modified(self) -> None:
        """Test that explorations without duplicates are not modified."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id5', title='Test Exploration', category='Algebra')
        
        # Set unique content IDs
        exploration.states['Introduction'].content.content_id = 'content_1'
        exploration.states['Introduction'].interaction.default_outcome.feedback.content_id = 'default_outcome_1'
        
        exp_services.save_new_exploration(self.owner_id, exploration)
        
        self.assert_job_output_is_empty()

    def test_exploration_with_duplicates_gets_fixed(self) -> None:
        """Test that explorations with duplicate content IDs get fixed."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id6', title='Test Exploration', category='Algebra')
        
        # Create additional states
        exploration.add_states(['State2'])
        
        # Set duplicate content IDs
        duplicate_content_id = 'solution_137'
        exploration.states['Introduction'].content.content_id = duplicate_content_id
        exploration.states['State2'].content.content_id = duplicate_content_id
        
        # Set next_content_id_index to a known value
        exploration.next_content_id_index = 10
        
        exp_services.save_new_exploration(self.owner_id, exploration)
        
        # Run the job
        self.run_job()
        
        # Verify the exploration was fixed
        updated_exploration = exp_services.get_exploration_by_id('exp_id6')
        
        # Check that content IDs are now unique
        intro_content_id = updated_exploration.states['Introduction'].content.content_id
        state2_content_id = updated_exploration.states['State2'].content.content_id
        
        self.assertNotEqual(intro_content_id, state2_content_id)
        
        # The first occurrence should keep the original ID
        self.assertEqual(intro_content_id, duplicate_content_id)
        
        # The second occurrence should have a new ID
        self.assertNotEqual(state2_content_id, duplicate_content_id)
        
        # The next_content_id_index should be updated
        self.assertGreater(updated_exploration.next_content_id_index, 10)

    def test_multiple_duplicates_in_single_exploration(self) -> None:
        """Test fixing multiple different duplicate content IDs in one exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id7', title='Test Exploration', category='Algebra')
        
        # Create multiple states
        exploration.add_states(['State2', 'State3', 'State4'])
        
        # Set multiple duplicate content IDs
        duplicate_id1 = 'solution_137'
        duplicate_id2 = 'hint_140'
        
        exploration.states['Introduction'].content.content_id = duplicate_id1
        exploration.states['State2'].content.content_id = duplicate_id1
        exploration.states['State3'].content.content_id = duplicate_id2
        exploration.states['State4'].content.content_id = duplicate_id2
        
        exploration.next_content_id_index = 15
        
        exp_services.save_new_exploration(self.owner_id, exploration)
        
        # Run the job
        self.run_job()
        
        # Verify the exploration was fixed
        updated_exploration = exp_services.get_exploration_by_id('exp_id7')
        
        # Collect all content IDs
        all_content_ids = []
        for state in updated_exploration.states.values():
            all_content_ids.extend(state.get_translatable_content_ids())
        
        # Check that all content IDs are now unique
        self.assertEqual(len(all_content_ids), len(set(all_content_ids)))
        
        # Check that first occurrences keep original IDs
        self.assertEqual(
            updated_exploration.states['Introduction'].content.content_id, 
            duplicate_id1
        )
        self.assertEqual(
            updated_exploration.states['State3'].content.content_id, 
            duplicate_id2
        )
        
        # Check that duplicate occurrences got new IDs
        self.assertNotEqual(
            updated_exploration.states['State2'].content.content_id, 
            duplicate_id1
        )
        self.assertNotEqual(
            updated_exploration.states['State4'].content.content_id, 
            duplicate_id2
        )


class AuditJobsTests(job_test_utils.PipelinedTestBase):
    """Tests for audit versions of the jobs."""

    def test_audit_identify_job_does_not_update_datastore(self) -> None:
        """Test that the audit identify job does not make datastore updates."""
        job = fix_duplicate_content_ids_jobs.AuditIdentifyExplorationsWithDuplicateContentIdsJob(
            self.pipeline
        )
        self.assertFalse(job.DATASTORE_UPDATES_ALLOWED)

    def test_audit_fix_job_does_not_update_datastore(self) -> None:
        """Test that the audit fix job does not make datastore updates."""
        job = fix_duplicate_content_ids_jobs.AuditFixExplorationsWithDuplicateContentIdsJob(
            self.pipeline
        )
        self.assertFalse(job.DATASTORE_UPDATES_ALLOWED) 
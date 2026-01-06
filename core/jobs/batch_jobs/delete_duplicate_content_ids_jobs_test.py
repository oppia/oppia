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

from core.domain import (
    exp_domain,
    exp_fetchers,
    exp_services,
    translation_domain,
)
from core.jobs import job_test_utils
from core.jobs.batch_jobs import delete_duplicate_content_ids_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    pass

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


class IdentifyExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for IdentifyExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.IdentifyExplorationsWithDuplicateContentIdsJob
    )

    def test_identify_job_with_no_duplicates(self) -> None:
        """Test that the job finds no duplicates when there are none."""

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is_empty()

    def test_identify_job_with_duplicates(self) -> None:
        """Test that the job correctly identifies explorations with
        duplicate content IDs.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        state1.content.content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state2.content.content_id = state1.content.content_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Exploration exp_id (version 1) has duplicate content IDs: '
                    '{\'content_2\': [\'Introduction\', \'State2\']}'
                )
            ]
        )


class FixExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for FixExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.FixExplorationsWithDuplicateContentIdsJob
    )

    def test_fix_job_with_no_duplicates(self) -> None:
        """Test that the job does nothing when there are no duplicates."""

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is_empty()

    def test_fix_job_with_duplicates(self) -> None:
        """Test that the job correctly fixes explorations with duplicate
        content IDs.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        state1.content.content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state2.content.content_id = state1.content.content_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        original_content_id = state1.content.content_id

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_id (version 1) - regenerated content '
                    f'IDs: [\'{original_content_id} -> content_3 in State2\']'
                )
            ]
        )

        updated_exploration = exp_fetchers.get_exploration_by_id('exp_id')
        state1_updated = updated_exploration.states['Introduction']
        state2_updated = updated_exploration.states['State2']

        self.assertEqual(state1_updated.content.content_id, original_content_id)
        self.assertEqual(state2_updated.content.content_id, 'content_2')


class AuditIdentifyExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for AuditIdentifyExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.AuditIdentifyExplorationsWithDuplicateContentIdsJob
    )

    def test_audit_identify_job_with_duplicates(self) -> None:
        """Test that the audit job correctly identifies duplicates."""

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        state1.content.content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state2.content.content_id = state1.content.content_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Exploration exp_id (version 1) has duplicate content IDs: '
                    '{\'content_2\': [\'Introduction\', \'State2\']}'
                )
            ]
        )


class AuditFixExplorationsWithDuplicateContentIdsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for AuditFixExplorationsWithDuplicateContentIdsJob."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.AuditFixExplorationsWithDuplicateContentIdsJob
    )

    def test_audit_fix_job_with_duplicates(self) -> None:
        """Test that the audit fix job shows what would be fixed."""

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        state1.content.content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state2.content.content_id = state1.content.content_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        original_content_id = state1.content.content_id

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_id (version 1) - regenerated content '
                    f'IDs: [\'{original_content_id} -> content_3 in State2\']'
                )
            ]
        )

        updated_exploration = exp_fetchers.get_exploration_by_id('exp_id')
        state1_updated = updated_exploration.states['Introduction']
        state2_updated = updated_exploration.states['State2']

        self.assertEqual(state1_updated.content.content_id, original_content_id)
        self.assertEqual(state2_updated.content.content_id, original_content_id)

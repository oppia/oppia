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
    state_domain,
    translation_domain,
)
from core.jobs import job_test_utils
from core.jobs.batch_jobs import delete_duplicate_content_ids_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, List, Union, cast

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
    """Tests for IdentifyExplorationsWithDuplicateContentIdsJob in audit mode."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.IdentifyExplorationsWithDuplicateContentIdsJob
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


class ReplaceContentIdHelpersTests(test_utils.GenericTestBase):
    """Tests for helper functions that replace content IDs."""

    def test_replace_content_id_in_state_updates_nested_references(
        self,
    ) -> None:
        class FakeContent:
            """Simple object carrying a content_id used in tests."""

            def __init__(self, content_id: str) -> None:
                self.content_id = content_id

        class FakeCustomizationArg:
            """Customization arg stub holding heterogeneous values.

            Here we use type Any because customization args can hold lists,
            dicts, or nested domain-like objects and we only exercise traversal
            in the helper, not specific shapes.
            """

            # Here we use type Any because customization args can hold lists,
            # dicts, or nested domain-like objects and we only exercise
            # traversal in the helper, not specific shapes.
            def __init__(self, value: Any, content_ids: List[str]) -> None:
                self.value = value
                self._content_ids = content_ids

            def get_content_ids(self) -> List[str]:
                """Return a copy of content IDs referenced by this arg."""
                return list(self._content_ids)

            # The helper accesses .value directly; no extra methods needed here.

        class FakeOutcome:
            """Outcome stub exposing feedback content."""

            def __init__(self, content_id: str) -> None:
                self.feedback = FakeContent(content_id)

        class FakeAnswerGroup:
            """Answer group stub with a single outcome."""

            def __init__(self, content_id: str) -> None:
                self.outcome = FakeOutcome(content_id)

        class FakeHint:
            """Hint stub exposing hint_content."""

            def __init__(self, content_id: str) -> None:
                self.hint_content = FakeContent(content_id)

        class FakeSolution:
            """Solution stub exposing explanation content."""

            def __init__(self, content_id: str) -> None:
                self.explanation = FakeContent(content_id)

        class FakeInteraction:
            """Interaction stub covering args, outcomes, hints, solution."""

            def __init__(
                self,
                customization_args: Dict[str, FakeCustomizationArg],
                answer_groups: List[FakeAnswerGroup],
                default_outcome: FakeOutcome,
                hints: List[FakeHint],
                solution: FakeSolution,
            ) -> None:
                self.customization_args = customization_args
                self.answer_groups = answer_groups
                self.default_outcome = default_outcome
                self.hints = hints
                self.solution = solution

        class FakeState:
            """State stub bundling content and interaction."""

            def __init__(
                self, content: FakeContent, interaction: FakeInteraction
            ) -> None:
                self.content = content
                self.interaction = interaction

        duplicate_id = 'duplicate_id'
        replacement_id = 'replacement_id'

        customization_values: List[
            Union[Dict[str, FakeContent], FakeContent]
        ] = [
            {'nested': FakeContent(duplicate_id)},
            FakeContent(duplicate_id),
        ]
        customization_arg = FakeCustomizationArg(
            customization_values, [duplicate_id]
        )

        interaction = FakeInteraction(
            {'custom_html': customization_arg},
            [FakeAnswerGroup(duplicate_id)],
            FakeOutcome(duplicate_id),
            [FakeHint(duplicate_id)],
            FakeSolution(duplicate_id),
        )
        state = FakeState(FakeContent(duplicate_id), interaction)

        # Here we use cast because FakeState mimics State without inheriting
        # from it; the helper expects a State instance.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            cast(state_domain.State, state), duplicate_id, replacement_id
        )

        self.assertEqual(state.content.content_id, replacement_id)
        # Here we use cast because the Union element is a dict in this branch.
        self.assertEqual(
            cast(Dict[str, FakeContent], customization_values[0])[
                'nested'
            ].content_id,
            replacement_id,
        )
        # Here we use cast because the Union element is a FakeContent here.
        self.assertEqual(
            cast(FakeContent, customization_values[1]).content_id,
            replacement_id,
        )
        self.assertEqual(
            interaction.answer_groups[0].outcome.feedback.content_id,
            replacement_id,
        )
        self.assertEqual(
            interaction.default_outcome.feedback.content_id, replacement_id
        )
        self.assertEqual(
            interaction.hints[0].hint_content.content_id, replacement_id
        )
        self.assertEqual(
            interaction.solution.explanation.content_id, replacement_id
        )

    def test_replace_content_id_in_state_handles_missing_interaction(
        self,
    ) -> None:
        class FakeContent:
            """Content stub with a content_id."""

            def __init__(self, content_id: str) -> None:
                self.content_id = content_id

        class FakeState:
            """State stub without an interaction field set."""

            def __init__(self, content: FakeContent) -> None:
                self.content = content
                self.interaction = None

        state = FakeState(FakeContent('keep_me'))

        # Here we use cast because FakeState is a stub; helper accepts State.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            cast(state_domain.State, state), 'old_id', 'new_id'
        )

        self.assertEqual(state.content.content_id, 'keep_me')

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

from core import feconf
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

(exp_models, translation_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.TRANSLATION]
)
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
            'exp_id_0', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is_empty()

    def test_identify_job_with_duplicates(self) -> None:
        """Test that the job correctly identifies explorations with
        duplicate content IDs.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_1', title='Test Exploration', category='Test'
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
                    'Exploration exp_id_1 (version 1) has duplicate content IDs: '
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
            'exp_id_2', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is_empty()

    def test_fix_job_with_duplicates(self) -> None:
        """Test that the job correctly fixes explorations with duplicate
        content IDs.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_3', title='Test Exploration', category='Test'
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

        # Add a translation for the duplicate content ID in the first version.
        translation_model = translation_models.EntityTranslationsModel(
            id=f'{feconf.TranslatableEntityType.EXPLORATION.value}-exp_id_3-1-hi',
            entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
            entity_id='exp_id_3',
            entity_version=1,
            language_code='hi',
            translations={
                original_content_id: {
                    'content_value': 'Translation in Hindi',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        )
        translation_model.update_timestamps()
        translation_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_id_3 (version 2) - regenerated content '
                    f'IDs: [\'{original_content_id} -> content_3 in State2\']'
                )
            ]
        )

        from core.domain import caching_services

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, ['exp_id_3']
        )
        updated_exploration = exp_fetchers.get_exploration_by_id('exp_id_3')
        state1_updated = updated_exploration.states['Introduction']
        state2_updated = updated_exploration.states['State2']

        self.assertEqual(state1_updated.content.content_id, original_content_id)
        self.assertEqual(state2_updated.content.content_id, 'content_3')

        # Assert that the new translation model has been created for version 2
        # and the translation has been duplicated for the newly generated content ID.
        new_translation_model = (
            translation_models.EntityTranslationsModel.get_model(
                feconf.TranslatableEntityType.EXPLORATION, 'exp_id_3', 2, 'hi'
            )
        )
        self.assertIsNotNone(new_translation_model)
        self.assertIn(original_content_id, new_translation_model.translations)
        self.assertIn('content_3', new_translation_model.translations)
        self.assertEqual(
            new_translation_model.translations[original_content_id],
            new_translation_model.translations['content_3'],
        )

    def test_fix_job_handles_duplicate_with_missing_translation(self) -> None:
        """Test that the job handles duplicates even if the original content ID
        is missing from the existing translation model.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_missing_translation', title='Test', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        original_content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state1.content.content_id = original_content_id
        state2.content.content_id = original_content_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )
        exp_services.save_new_exploration('owner_id', exploration)

        # Create a translation model that DOES NOT contain the original_content_id
        # to test the branch where old_id is not in translations_dict.
        translation_model = translation_models.EntityTranslationsModel(
            id=f'{feconf.TranslatableEntityType.EXPLORATION.value}-exp_id_missing_translation-1-hi',
            entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
            entity_id='exp_id_missing_translation',
            entity_version=1,
            language_code='hi',
            translations={
                'unrelated_content_id': {
                    'content_value': 'Translation in Hindi',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        )
        translation_model.update_timestamps()
        datastore_services.put_multi([translation_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_id_missing_translation (version 2) - regenerated content '
                    f'IDs: [\'{original_content_id} -> content_3 in State2\']'
                )
            ]
        )

        new_translation_model = (
            translation_models.EntityTranslationsModel.get_model(
                feconf.TranslatableEntityType.EXPLORATION,
                'exp_id_missing_translation',
                2,
                'hi',
            )
        )
        self.assertIsNotNone(new_translation_model)
        self.assertNotIn(
            original_content_id, new_translation_model.translations
        )
        self.assertNotIn('content_3', new_translation_model.translations)
        self.assertIn(
            'unrelated_content_id', new_translation_model.translations
        )

    def test_fix_job_idempotency_guard(self) -> None:
        """Test that the job skips fixing an exploration if its version
        has changed in the datastore since it was fetched (idempotency guard).
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_6', title='Test Exploration', category='Test'
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

        # Simulate a previous Beam retry modifying the exploration by manually
        # incrementing its version in the datastore.
        with datastore_services.get_ndb_context():
            current_model = exp_models.ExplorationModel.get(exploration.id)
            current_model.version += 1
            current_model.update_timestamps()
            datastore_services.put_multi([current_model])

        # The idempotency guard inside _check_and_fix_duplicate_content_ids
        # should catch the version mismatch and return None.
        result = delete_duplicate_content_ids_jobs.FixExplorationsWithDuplicateContentIdsJob._check_and_fix_duplicate_content_ids(  # pylint: disable=protected-access
            exploration, datastore_updates_allowed=True
        )

        self.assertIsNone(result)


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
            'exp_id_4', title='Test Exploration', category='Test'
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
                    'Exploration exp_id_4 (version 1) has duplicate content IDs: '
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
            'exp_id_5', title='Test Exploration', category='Test'
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
                    f'Fixed exploration exp_id_5 (version 2) - regenerated content '
                    f'IDs: [\'{original_content_id} -> content_3 in State2\']'
                )
            ]
        )

        from core.domain import caching_services

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, ['exp_id_5']
        )
        # Clear the NDB context cache to avoid reading the model mutated by the job.
        with datastore_services.get_ndb_context() as ndb_context:
            ndb_context.clear_cache()
        updated_exploration = exp_fetchers.get_exploration_by_id('exp_id_5')
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

    def test_replace_content_id_in_state_handles_negative_conditions(
        self,
    ) -> None:
        """Test that the helper safely skips replacing content IDs when
        various interaction properties are missing, missing a content_id, or
        have a non-matching content_id.
        """

        class FakeContent:
            def __init__(self, content_id: str) -> None:
                self.content_id = content_id

        class FakeContentWithoutId:
            pass

        class FakeCustomizationArg:
            def __init__(self, value: Any, content_ids: List[str]) -> None:
                self.value = value
                self._content_ids = content_ids

            def get_content_ids(self) -> List[str]:
                return list(self._content_ids)

        class FakeOutcome:
            def __init__(self, feedback: Any = None) -> None:
                if feedback is not None:
                    self.feedback = feedback

        class FakeAnswerGroup:
            def __init__(self, outcome: Any) -> None:
                self.outcome = outcome

        class FakeHint:
            def __init__(self, hint_content: Any = None) -> None:
                if hint_content is not None:
                    self.hint_content = hint_content

        class FakeSolution:
            def __init__(self, explanation: Any = None) -> None:
                if explanation is not None:
                    self.explanation = explanation

        class FakeInteraction:
            def __init__(
                self,
                customization_args: Dict[str, FakeCustomizationArg],
                answer_groups: List[FakeAnswerGroup],
                default_outcome: Any,
                hints: List[FakeHint],
                solution: Any,
            ) -> None:
                self.customization_args = customization_args
                self.answer_groups = answer_groups
                self.default_outcome = default_outcome
                self.hints = hints
                self.solution = solution

        class FakeState:
            def __init__(
                self, content: FakeContent, interaction: FakeInteraction
            ) -> None:
                self.content = content
                self.interaction = interaction

        old_id = 'old_id'
        new_id = 'new_id'
        different_id = 'different_id'

        # Customization arg whose content_ids do NOT include old_id
        ca_different_id = FakeCustomizationArg(
            FakeContent(different_id), [different_id]
        )
        # Customization arg with a primitive value (string)
        ca_primitive_val = FakeCustomizationArg('primitive_string', [old_id])

        # Answer groups testing missing feedback, missing content_id, and different content_id
        ag_no_feedback = FakeAnswerGroup(FakeOutcome())
        ag_no_content_id = FakeAnswerGroup(FakeOutcome(FakeContentWithoutId()))
        ag_diff_content_id = FakeAnswerGroup(
            FakeOutcome(FakeContent(different_id))
        )

        # Default outcome testing missing feedback, missing content_id, and different content_id
        do_diff_content_id = FakeOutcome(FakeContent(different_id))

        # Hints testing missing hint_content, missing content_id, and different content_id
        hint_no_content = FakeHint()
        hint_no_content_id = FakeHint(FakeContentWithoutId())
        hint_diff_content_id = FakeHint(FakeContent(different_id))

        # Solution testing missing explanation, missing content_id, and different content_id
        sol_diff_content_id = FakeSolution(FakeContent(different_id))

        interaction = FakeInteraction(
            {'ca1': ca_different_id, 'ca2': ca_primitive_val},
            [ag_no_feedback, ag_no_content_id, ag_diff_content_id],
            do_diff_content_id,
            [hint_no_content, hint_no_content_id, hint_diff_content_id],
            sol_diff_content_id,
        )
        state = FakeState(FakeContent(different_id), interaction)

        # Execution should proceed smoothly without crashing and skip replacements.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(
            cast(state_domain.State, state), old_id, new_id
        )

        # Verify nothing was incorrectly replaced.
        self.assertEqual(state.content.content_id, different_id)
        self.assertEqual(ca_different_id.value.content_id, different_id)
        self.assertEqual(ca_primitive_val.value, 'primitive_string')
        self.assertEqual(
            ag_diff_content_id.outcome.feedback.content_id, different_id
        )
        self.assertEqual(do_diff_content_id.feedback.content_id, different_id)
        self.assertEqual(
            hint_diff_content_id.hint_content.content_id, different_id
        )
        self.assertEqual(
            sol_diff_content_id.explanation.content_id, different_id
        )

        # Test the branch where default_outcome is None
        interaction_no_default = FakeInteraction({}, [], None, [], None)
        state_no_default = FakeState(
            FakeContent(different_id), interaction_no_default
        )
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(
            cast(state_domain.State, state_no_default), old_id, new_id
        )
        self.assertEqual(state_no_default.content.content_id, different_id)

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

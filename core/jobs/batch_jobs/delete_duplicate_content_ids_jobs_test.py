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

from unittest import mock

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

from typing import Dict, List, Union, cast

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

    def test_identify_job_multiple_duplicates(self) -> None:
        """Test identifying multiple duplicate content IDs in same exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_multi_dup', title='Test Exploration', category='Test'
        )

        exploration.add_states(['State2', 'State3'])

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']
        state3 = exploration.states['State3']

        dup_id1 = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        dup_id2 = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state1.content.content_id = dup_id1
        state2.content.content_id = dup_id1
        state3.content.content_id = dup_id2

        # Create another duplicate for dup_id2.
        state1.interaction.hints = [
            state_domain.Hint(
                state_domain.SubtitledHtml(dup_id2, '<p>hint</p>')
            )
        ]

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Exploration exp_multi_dup (version 1) has duplicate content IDs: '
                    f'{{\'{dup_id1}\': [\'Introduction\', \'State2\'], \'{dup_id2}\': [\'Introduction\', \'State3\']}}'
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

    def test_fix_job_with_duplicates_in_customization_args(self) -> None:
        """Test fixing duplicates in customization args."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id5', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state = exploration.states['Introduction']
        state2 = exploration.states['State2']

        duplicate_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state.content.content_id = duplicate_id
        placeholder_ca = state.interaction.customization_args.get('placeholder')
        if placeholder_ca and isinstance(
            placeholder_ca.value, state_domain.SubtitledUnicode
        ):
            placeholder_ca.value.content_id = duplicate_id

        state2.content.content_id = duplicate_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_id5 (version 1) - regenerated content '
                    f'IDs: [\'{duplicate_id} -> content_3 in State2\']'
                )
            ]
        )

    def test_fix_job_with_multiple_answer_groups(self) -> None:
        """Test fixing duplicates with multiple answer groups."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_multi_ag', title='Test', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state = exploration.states['Introduction']
        state2 = exploration.states['State2']

        dup_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state.content.content_id = dup_id
        # Create multiple answer groups with feedback.
        state.interaction.answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Introduction',
                    None,
                    state_domain.SubtitledHtml(dup_id, '<p>feedback1</p>'),
                    False,
                    [],
                    None,
                    None,
                ),
                [],
                [],
                None,
            ),
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Introduction',
                    None,
                    state_domain.SubtitledHtml(
                        'content_other', '<p>feedback2</p>'
                    ),
                    False,
                    [],
                    None,
                    None,
                ),
                [],
                [],
                None,
            ),
        ]

        state2.content.content_id = dup_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_multi_ag (version 1) - regenerated content '
                    f'IDs: [\'{dup_id} -> content_3 in State2\']'
                )
            ]
        )

    def test_fix_job_verifies_datastore_persistence(self) -> None:
        """Test that fixed explorations are persisted to datastore."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_verify', title='Test Exploration', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        dup_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )
        state1.content.content_id = dup_id
        state2.content.content_id = dup_id

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        # Run job once via assert_job_output_is.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_verify (version 1) - regenerated '
                    f'content IDs: [\'{dup_id} -> content_3 in State2\']'
                )
            ]
        )
        updated_model = exp_models.ExplorationModel.get('exp_verify')
        self.assertEqual(updated_model.version, 2)
        self.assertNotEqual(
            updated_model.states['State2']['content']['content_id'],
            updated_model.states['Introduction']['content']['content_id'],
        )

    def test_check_and_fix_direct_call_returns_none_without_duplicates(
        self,
    ) -> None:
        """Directly validate early return when no duplicates exist."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_none_direct', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        result = delete_duplicate_content_ids_jobs.FixExplorationsWithDuplicateContentIdsJob._check_and_fix_duplicate_content_ids(  # pylint: disable=protected-access
            exploration
        )
        self.assertIsNone(result)

    def test_replace_content_id_in_state_updates_answer_groups(self) -> None:
        """Test helper updates answer group feedback content IDs."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_ag', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'content_old'
        new_id = 'content_new'

        # Create answer group with old content ID in feedback.
        state.interaction.answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Introduction',
                    None,
                    state_domain.SubtitledHtml(old_id, '<p>feedback</p>'),
                    False,
                    [],
                    None,
                    None,
                ),
                [],
                [],
                None,
            )
        ]

        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        self.assertEqual(
            state.interaction.answer_groups[0].outcome.feedback.content_id,
            new_id,
        )

    def test_replace_content_id_in_value_handles_objects_with_content_id(
        self,
    ) -> None:
        """Test helper replaces content_id on objects."""
        old_id = 'old_id'
        new_id = 'new_id'
        obj = state_domain.SubtitledHtml(old_id, '<p>text</p>')

        delete_duplicate_content_ids_jobs._replace_content_id_in_value(  # pylint: disable=protected-access
            obj, old_id, new_id
        )

        self.assertEqual(obj.content_id, new_id)

    def test_replace_content_id_in_state_covers_hints_and_solution(
        self,
    ) -> None:
        """Test helper updates hints and solution content IDs."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_hints', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'content_old'
        new_id = 'content_new'

        # Add hints and solution with old content ID.
        state.interaction.hints = [
            state_domain.Hint(state_domain.SubtitledHtml(old_id, '<p>hint</p>'))
        ]
        state.interaction.solution = state_domain.Solution(
            'TextInput',
            False,
            'answer',
            state_domain.SubtitledHtml(old_id, '<p>explanation</p>'),
        )

        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        self.assertEqual(
            state.interaction.hints[0].hint_content.content_id, new_id
        )
        self.assertEqual(
            state.interaction.solution.explanation.content_id, new_id
        )

    def test_replace_content_id_in_value_handles_list_and_dict(self) -> None:
        """Test helper recursively handles lists and dicts."""
        old_id = 'old_id'
        new_id = 'new_id'

        # Test list with nested dict.
        value: List[
            Union[
                state_domain.SubtitledHtml,
                Dict[str, state_domain.SubtitledHtml],
            ]
        ] = [
            state_domain.SubtitledHtml(old_id, '<p>item1</p>'),
            {'key': state_domain.SubtitledHtml(old_id, '<p>item2</p>')},
        ]

        delete_duplicate_content_ids_jobs._replace_content_id_in_value(  # pylint: disable=protected-access
            value, old_id, new_id
        )

        # Here use cast because value contains mixed Union[SubtitledHtml, Dict] and mypy needs type narrowing.
        first = cast(  # pylint: disable=c0048
            state_domain.SubtitledHtml, value[0]
        )
        # Here use cast because mypy cannot infer nested Dict[str, SubtitledHtml] type from mixed list entry.
        second = cast(  # pylint: disable=c0048
            Dict[str, state_domain.SubtitledHtml], value[1]
        )

        self.assertEqual(first.content_id, new_id)
        self.assertEqual(second['key'].content_id, new_id)

    def test_replace_content_id_in_state_handles_missing_optional_fields(
        self,
    ) -> None:
        """Test helper handles states without optional content ID fields."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_optional', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'content_old'
        new_id = 'content_new'

        # Ensure no hints or solution are set (they start as empty lists/None).
        state.interaction.hints = []
        state.interaction.solution = None
        # Remove default_outcome to test None case.
        state.interaction.default_outcome = None

        # Should not raise any errors.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        self.assertEqual(len(state.interaction.hints), 0)
        self.assertIsNone(state.interaction.solution)
        self.assertIsNone(state.interaction.default_outcome)

    def test_replace_content_id_in_value_ignores_non_matching_content_ids(
        self,
    ) -> None:
        """Test helper ignores values with non-matching content IDs."""
        old_id = 'old_id'
        new_id = 'new_id'
        other_id = 'other_id'

        obj = state_domain.SubtitledHtml(other_id, '<p>text</p>')

        delete_duplicate_content_ids_jobs._replace_content_id_in_value(  # pylint: disable=protected-access
            obj, old_id, new_id
        )

        # Content ID should not change because it doesn't match old_id.
        self.assertEqual(obj.content_id, other_id)

    def test_replace_content_id_in_state_no_interaction(self) -> None:
        """Test replacing content ID when state has no interaction."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_no_int', title='Test', category='Test'
        )
        state = exploration.states['Introduction']

        old_id = 'old_id'
        new_id = 'new_id'

        # Use a mock interaction that is falsy to hit the false branch safely.
        mock_interaction = mock.Mock(spec=state_domain.InteractionInstance)
        mock_interaction.__bool__.return_value = False
        # Here use cast because mock_interaction must be typed as InteractionInstance for state assignment.
        state.interaction = cast(
            state_domain.InteractionInstance, mock_interaction
        )  # pylint: disable=c0048
        state.content.content_id = old_id

        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        # Should only update content; interaction remains falsy mock.
        self.assertEqual(state.content.content_id, new_id)
        self.assertFalse(state.interaction)

    def test_replace_content_id_in_state_with_matching_customization_arg(
        self,
    ) -> None:
        """Test replacing content ID in customization args when it matches."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_ca_match', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_ca_id'
        new_id = 'new_ca_id'

        # Create a SubtitledUnicode with the old_id in customization args.
        placeholder_ca = state.interaction.customization_args.get('placeholder')
        if placeholder_ca:
            placeholder_ca.value = state_domain.SubtitledUnicode(
                old_id, 'placeholder text'
            )

        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        # Verify the content ID was updated in customization args.
        updated_placeholder = state.interaction.customization_args.get(
            'placeholder'
        )
        if updated_placeholder and isinstance(
            updated_placeholder.value, state_domain.SubtitledUnicode
        ):
            self.assertEqual(updated_placeholder.value.content_id, new_id)

    def test_replace_content_id_in_state_with_default_outcome(
        self,
    ) -> None:
        """Test replacing content ID in default outcome feedback."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_do', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_do_id'
        new_id = 'new_do_id'

        # Set default outcome with feedback.
        state.interaction.default_outcome = state_domain.Outcome(
            'Introduction',
            None,
            state_domain.SubtitledHtml(old_id, '<p>default feedback</p>'),
            False,
            [],
            None,
            None,
        )

        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

        # Verify the default outcome feedback content ID was updated.
        self.assertEqual(
            state.interaction.default_outcome.feedback.content_id, new_id
        )

    def test_replace_content_id_in_state_with_outcome_missing_feedback(
        self,
    ) -> None:
        """Test when answer group outcome has no feedback attribute."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create a mock outcome without feedback attribute.
        mock_outcome = mock.MagicMock(spec=[])
        mock_answer_group = state_domain.AnswerGroup(
            mock_outcome,
            [],
            [],
            None,
        )
        state.interaction.answer_groups = [mock_answer_group]

        # Should not raise error when hasattr(outcome, 'feedback') is False.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_replace_content_id_in_state_with_solution_missing_explanation(
        self,
    ) -> None:
        """Test when solution has no explanation attribute."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test2', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create a mock solution without explanation attribute.
        mock_solution = mock.MagicMock(spec=[])
        state.interaction.solution = mock_solution

        # Should not raise error when hasattr(solution, 'explanation') is False.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_replace_content_id_in_state_with_solution_explanation_missing_content_id(
        self,
    ) -> None:
        """Test when solution explanation has no content_id attribute."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test6', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create mock explanation without content_id attribute.
        mock_explanation = mock.MagicMock(spec=[])
        mock_solution = mock.MagicMock()
        mock_solution.explanation = mock_explanation
        state.interaction.solution = mock_solution

        # Should not raise error when hasattr(explanation, 'content_id') is False.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_replace_content_id_in_state_with_feedback_missing_content_id(
        self,
    ) -> None:
        """Test when feedback object has no content_id attribute."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test3', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create mock feedback without content_id attribute.
        mock_feedback = mock.MagicMock(spec=[])
        mock_outcome = mock.MagicMock()
        mock_outcome.feedback = mock_feedback

        mock_answer_group = state_domain.AnswerGroup(
            mock_outcome,
            [],
            [],
            None,
        )
        state.interaction.answer_groups = [mock_answer_group]

        # Should not raise error when hasattr(feedback, 'content_id') is False.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_replace_content_id_in_state_with_hint_missing_content_id(
        self,
    ) -> None:
        """Test when hint has no hint_content attribute."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test4', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create mock hint without hint_content attribute.
        mock_hint = mock.MagicMock(spec=[])
        state.interaction.hints = [mock_hint]

        # Should not raise error when hasattr(hint, 'hint_content') is False.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_replace_content_id_in_state_with_default_outcome_missing_attributes(
        self,
    ) -> None:
        """Test when default outcome has missing attributes."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_test5', title='Test', category='Test'
        )
        state = exploration.states['Introduction']
        state.update_interaction_id('TextInput')

        old_id = 'old_id'
        new_id = 'new_id'

        # Create mock default outcome without feedback attribute.
        mock_outcome = mock.MagicMock(spec=[])
        state.interaction.default_outcome = mock_outcome

        # Should not raise error when hasattr checks fail.
        delete_duplicate_content_ids_jobs._replace_content_id_in_state(  # pylint: disable=protected-access
            state, old_id, new_id
        )

    def test_fix_job_with_empty_answer_groups(self) -> None:
        """Test fixing when answer groups exist but have no feedback."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_empty_ag', title='Test', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        dup_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state1.content.content_id = dup_id
        state2.content.content_id = dup_id

        # Add answer group with outcome with feedback that doesn't match.
        # This tests hasattr checks pass but content_id doesn't match old_id.
        state1.interaction.answer_groups = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Introduction',
                    None,
                    state_domain.SubtitledHtml('other_id', '<p>feedback</p>'),
                    False,
                    [],
                    None,
                    None,
                ),
                [],
                [],
                None,
            )
        ]

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_empty_ag (version 1) - regenerated content '
                    f'IDs: [\'{dup_id} -> content_3 in State2\']'
                )
            ]
        )

    def test_fix_job_with_no_solution(self) -> None:
        """Test fixing when state has no solution."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_no_sol', title='Test', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        dup_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state1.content.content_id = dup_id
        state2.content.content_id = dup_id
        state1.interaction.solution = None

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_no_sol (version 1) - regenerated content '
                    f'IDs: [\'{dup_id} -> content_3 in State2\']'
                )
            ]
        )

    def test_fix_job_with_no_hints(self) -> None:
        """Test fixing when state has no hints."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_no_hints', title='Test', category='Test'
        )

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        exploration.add_states(['State2'])
        state1 = exploration.states['Introduction']
        state2 = exploration.states['State2']

        dup_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT
        )

        state1.content.content_id = dup_id
        state2.content.content_id = dup_id
        state1.interaction.hints = []

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        exp_services.save_new_exploration('owner_id', exploration)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'Fixed exploration exp_no_hints (version 1) - regenerated content '
                    f'IDs: [\'{dup_id} -> content_3 in State2\']'
                )
            ]
        )


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

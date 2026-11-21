# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for the NumberLineInput interaction configuration."""

from __future__ import annotations

from core import utils
from core.domain import state_domain
from core.tests import test_utils
from extensions.interactions.NumberLineInput import NumberLineInput


class NumberLineInputTests(test_utils.GenericTestBase):
    """Tests the number line interaction defaults and rules."""

    def test_default_configuration(self) -> None:
        interaction = NumberLineInput.NumberLineInput()

        self.assertEqual(interaction.answer_type, 'Real')
        self.assertEqual(
            [
                spec.default_value
                for spec in interaction.customization_arg_specs
            ],
            [0, 4, 1.0],
        )
        self.assertEqual(list(interaction.rules_dict), ['Equals'])

    def _make_interaction(
        self, start: int, end: int, interval: int, rule_value: float
    ) -> state_domain.InteractionInstance:
        """Create an interaction with one Equals rule for validation tests."""
        customization_args = {
            'startValue': state_domain.InteractionCustomizationArg(
                start, {'type': 'int'}
            ),
            'endValue': state_domain.InteractionCustomizationArg(
                end, {'type': 'int'}
            ),
            'interval': state_domain.InteractionCustomizationArg(
                interval, {'type': 'float'}
            ),
        }
        outcome = state_domain.Outcome(
            'Next',
            None,
            state_domain.SubtitledHtml('feedback', ''),
            False,
            [],
            None,
            None,
        )
        answer_group = state_domain.AnswerGroup(
            outcome,
            [state_domain.RuleSpec('Equals', {'x': rule_value})],
            [],
            None,
        )
        return state_domain.InteractionInstance(
            'NumberLineInput',
            customization_args,
            [answer_group],
            outcome,
            [],
            [],
            None,
        )

    def test_strict_validation_accepts_valid_rule(self) -> None:
        interaction = self._make_interaction(-2, 6, 2, 4)
        interaction.validate({}, strict=True)

    def test_strict_validation_rejects_invalid_grid(self) -> None:
        interaction = self._make_interaction(0, 10, 1, 4)
        with self.assertRaisesRegex(utils.ValidationError, '3 to 10'):
            interaction.validate({}, strict=True)

    def test_strict_validation_rejects_rule_outside_grid(self) -> None:
        interaction = self._make_interaction(1, 7, 2, 4)
        with self.assertRaisesRegex(utils.ValidationError, 'rule refers'):
            interaction.validate({}, strict=True)

    def test_draft_validation_allows_editor_to_fix_rule(self) -> None:
        interaction = self._make_interaction(1, 7, 2, 4)
        interaction.validate({}, strict=False)

    def test_strict_validation_rejects_nonnumeric_bounds(self) -> None:
        interaction = self._make_interaction(-2, 6, 2, 4)
        interaction.customization_args['startValue'].value = '-2'
        with self.assertRaisesRegex(utils.ValidationError, 'numeric start'):
            # Exercise the defensive check before the generic schema check.
            interaction._validate_number_line_input(  # pylint: disable=protected-access
                strict=True
            )

    def test_strict_validation_checks_solution_point(self) -> None:
        interaction = self._make_interaction(-2, 6, 2, 4)
        interaction.solution = state_domain.Solution(
            'NumberLineInput',
            True,
            3,
            state_domain.SubtitledHtml('explanation', ''),
        )
        with self.assertRaisesRegex(utils.ValidationError, 'solution refers'):
            interaction.validate({}, strict=True)

        interaction.solution = state_domain.Solution(
            'NumberLineInput',
            True,
            4,
            state_domain.SubtitledHtml('explanation', ''),
        )
        interaction.validate({}, strict=True)

    def test_point_generation_supports_integer_and_decimal_intervals(
        self,
    ) -> None:
        self.assertEqual(
            NumberLineInput.get_number_line_points(-2, 6, 2),
            [-2, 0, 2, 4, 6],
        )
        self.assertEqual(
            NumberLineInput.get_number_line_points(0, 1, 0.2),
            [0, 0.2, 0.4, 0.6, 0.8, 1],
        )

    def test_point_generation_rejects_invalid_configs(self) -> None:
        for start, end, interval in [
            (0, 1, 1),
            (0, 10, 1),
            (3, 3, 1),
            (0, 7, 2),
            (0, 4, 0),
            (0, 4, float('inf')),
            (0, 4, 1e-320),
        ]:
            self.assertEqual(
                NumberLineInput.get_number_line_points(start, end, interval),
                [],
            )

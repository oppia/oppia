# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.regenerate_math_svgs_migration_job."""

from __future__ import annotations

import json as json_module
import logging
import tempfile
from unittest import mock

from core import feconf
from core.domain import exp_domain, exp_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import regenerate_math_svgs_migration_job
from core.jobs.types import job_run_result
from core.platform import models

from typing import Any, Dict, Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


OLD_SVG_FILENAME: Final = (
    'mathImg_20200904_151542_toclmk6i95_height_2d021_width_6d795_vertical_0d241.svg'
)

NEW_SVG_FILENAME: Final = (
    'mathImg_20260419_064553_aed9669c14_height_2d05_width_6d753_vertical_0d277.svg'
)

UNKNOWN_SVG_FILENAME: Final = (
    'mathImg_19990101_000000_unknownhash_height_1d0_width_1d0_vertical_0d0.svg'
)

HTML_WITH_KNOWN_MATH_TAG: Final = (
    '<p>Let <oppia-noninteractive-math math_content-with-value="'
    '{&quot;raw_latex&quot;: &quot;x=11&quot;, &quot;svg_filename&quot;:'
    ' &quot;%s&quot;}"></oppia-noninteractive-math></p>' % OLD_SVG_FILENAME
)

HTML_WITH_UNKNOWN_MATH_TAG: Final = (
    '<p>Let <oppia-noninteractive-math math_content-with-value="'
    '{&quot;raw_latex&quot;: &quot;y=2&quot;, &quot;svg_filename&quot;:'
    ' &quot;%s&quot;}"></oppia-noninteractive-math></p>' % UNKNOWN_SVG_FILENAME
)

HTML_WITHOUT_MATH: Final = '<p>No math here.</p>'

TEST_SVG_MAPPING: Final = [
    {
        'exploration_id': 'exp_1',
        'old_filename': OLD_SVG_FILENAME,
        'new_filename': NEW_SVG_FILENAME,
        'raw_latex': 'x=11',
    }
]


def _patch_svg_mapping(
    test_instance: job_test_utils.JobTestBase,
    mapping: Dict[str, str],
) -> None:
    """Replaces SVG_FILENAME_MAPPING in the module under test.

    Args:
        test_instance: JobTestBase. The test instance (used for cleanup).
        mapping: dict(str, str). The old_filename → new_filename mapping
            to inject.
    """
    original = regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.copy()
    regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.clear()
    regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.update(mapping)

    def _restore() -> None:
        regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.clear()
        regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.update(original)

    test_instance.addCleanup(_restore)


def _create_exploration_with_html(
    exp_id: str,
    content_html: str,
) -> exp_models.ExplorationModel:
    """Creates and saves an exploration whose intro state has the given HTML.

    Args:
        exp_id: str. The exploration ID.
        content_html: str. The HTML to set as the intro state's content.

    Returns:
        ExplorationModel. The saved exploration model.
    """
    exploration = exp_domain.Exploration.create_default_exploration(
        exp_id, title='Test Exploration', category='Test'
    )
    exp_services.save_new_exploration(feconf.SYSTEM_COMMITTER_ID, exploration)

    # Directly update the model's states dict so we can inject arbitrary HTML
    # without going through validation (which would reject math SVG filenames
    # that don't exist on disk in the test environment).
    exp_model = exp_models.ExplorationModel.get(exp_id)
    init_state_name = exp_model.init_state_name
    exp_model.states[init_state_name]['content']['html'] = content_html
    exp_model.update_timestamps()
    exp_model.commit(
        feconf.SYSTEM_COMMITTER_ID,
        'Set content HTML for test',
        [
            {
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'objective',
                'old_value': '',
                'new_value': 'test',
            }
        ],
    )
    return exp_models.ExplorationModel.get(exp_id)


class RegenerateMathSvgsJobTests(job_test_utils.JobTestBase):
    """Tests for RegenerateMathSvgsJob."""

    JOB_CLASS: Type[
        regenerate_math_svgs_migration_job.RegenerateMathSvgsJob
    ] = regenerate_math_svgs_migration_job.RegenerateMathSvgsJob

    EXP_ID: Final = 'exp_1'

    def setUp(self) -> None:
        super().setUp()
        _patch_svg_mapping(
            self,
            {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
        )

    def test_empty_storage(self) -> None:
        """Job produces no output when there are no explorations."""
        self.assert_job_output_is_empty()

    def test_exploration_without_math_is_not_migrated(self) -> None:
        """Exploration with no math tags produces a processed result but
        no migrated result, because there is nothing to update.
        """
        _create_exploration_with_html(self.EXP_ID, HTML_WITHOUT_MATH)

        self.assert_job_output_is_empty()

    def test_exploration_with_known_math_filename_is_migrated(self) -> None:
        """Exploration whose math tag filename is in the mapping gets updated
        and the model is written back to the datastore.
        """

        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),  # pylint: disable=protected-access
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MIGRATED SUCCESS: 1'
                ),
            ]
        )

        updated_model = exp_models.ExplorationModel.get(self.EXP_ID)
        init_state_name = updated_model.init_state_name
        updated_html = updated_model.states[init_state_name]['content']['html']
        self.assertIn(NEW_SVG_FILENAME, updated_html)
        self.assertNotIn(OLD_SVG_FILENAME, updated_html)

    def test_exploration_with_unknown_math_filename_is_unchanged(self) -> None:
        """Exploration whose math tag filename is NOT in the mapping is
        processed but not migrated — the filename is left as-is.
        """
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_UNKNOWN_MATH_TAG)
        self.assert_job_output_is(  # pylint: disable=protected-access
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),
            ]
        )

        updated_model = exp_models.ExplorationModel.get(self.EXP_ID)
        init_state_name = updated_model.init_state_name
        updated_html = updated_model.states[init_state_name]['content']['html']
        self.assertIn(UNKNOWN_SVG_FILENAME, updated_html)

    def test_multiple_explorations_are_each_processed(self) -> None:
        """Each exploration is processed independently."""
        exp_id_2 = 'exp_2'
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)
        _create_exploration_with_html(exp_id_2, HTML_WITHOUT_MATH)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(  # pylint: disable=protected-access
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MIGRATED SUCCESS: 1'
                ),
            ]
        )

        updated_model = exp_models.ExplorationModel.get(self.EXP_ID)
        init_state_name = updated_model.init_state_name
        updated_html = updated_model.states[init_state_name]['content']['html']
        self.assertIn(NEW_SVG_FILENAME, updated_html)

        unchanged_model = exp_models.ExplorationModel.get(exp_id_2)
        unchanged_init = unchanged_model.init_state_name
        unchanged_html = unchanged_model.states[unchanged_init]['content'][
            'html'
        ]
        self.assertNotIn(NEW_SVG_FILENAME, unchanged_html)

    def test_run_loads_svg_mapping_when_empty(
        self,
    ) -> None:  # pylint: disable=protected-access
        regenerate_math_svgs_migration_job.SVG_FILENAME_MAPPING.clear()
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)
        with mock.patch(
            'core.jobs.batch_jobs.regenerate_math_svgs_migration_job'
            '._load_svg_mapping',
            return_value={OLD_SVG_FILENAME: NEW_SVG_FILENAME},
        ):
            self.assert_job_output_is(  # pylint: disable=protected-access
                [
                    job_run_result.JobRunResult(
                        stdout='EXPLORATION PROCESSED SUCCESS: 1'
                    ),
                    job_run_result.JobRunResult(
                        stdout='EXPLORATION MIGRATED SUCCESS: 1'
                    ),
                ]
            )

    def test_run_skips_loading_svg_mapping_when_already_populated(self) -> None:
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)
        with mock.patch(
            'core.jobs.batch_jobs.regenerate_math_svgs_migration_job'
            '._load_svg_mapping',
        ) as mock_load:
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stdout='EXPLORATION PROCESSED SUCCESS: 1'
                    ),
                    job_run_result.JobRunResult(
                        stdout='EXPLORATION MIGRATED SUCCESS: 1'
                    ),
                ]
            )
            mock_load.assert_not_called()


class RegenerateMathSvgsMigrationJobHelperFunctionTests(
    job_test_utils.JobTestBase
):
    """Tests for helper functions in regenerate_math_svgs_migration_job."""

    JOB_CLASS = regenerate_math_svgs_migration_job.RegenerateMathSvgsJob

    EXP_ID: Final = 'exp_1'

    def test_load_svg_mapping_raises_when_file_missing(self) -> None:
        with mock.patch('os.path.exists', return_value=False):
            with self.assertRaisesRegex(
                FileNotFoundError, 'svg_mapping.json not found'
            ):
                regenerate_math_svgs_migration_job._load_svg_mapping()  # pylint: disable=protected-access

    def test_load_svg_mapping_returns_correct_mapping(self) -> None:
        """_load_svg_mapping correctly parses a valid JSON file."""
        mapping_data = [
            {
                'old_filename': OLD_SVG_FILENAME,
                'new_filename': NEW_SVG_FILENAME,
                'raw_latex': 'x=11',
            }
        ]
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as f:
            json_module.dump(mapping_data, f)
            temp_path = f.name

        with mock.patch.object(
            regenerate_math_svgs_migration_job,
            '_SVG_MAPPING_PATH',
            temp_path,
        ):
            result = (
                regenerate_math_svgs_migration_job._load_svg_mapping()  # pylint: disable=protected-access
            )
            self.assertEqual(result, {OLD_SVG_FILENAME: NEW_SVG_FILENAME})

    def test_load_svg_mapping_skips_entries_with_empty_filenames(
        self,
    ) -> None:
        """_load_svg_mapping skips entries missing old or new filename."""
        mapping_data = [
            {'old_filename': '', 'new_filename': NEW_SVG_FILENAME},
            {'old_filename': OLD_SVG_FILENAME, 'new_filename': ''},
            {
                'old_filename': OLD_SVG_FILENAME,
                'new_filename': NEW_SVG_FILENAME,
            },
        ]
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as f:
            json_module.dump(mapping_data, f)
            temp_path = f.name

        with mock.patch.object(
            regenerate_math_svgs_migration_job,
            '_SVG_MAPPING_PATH',
            temp_path,
        ):
            result = (
                regenerate_math_svgs_migration_job._load_svg_mapping()  # pylint: disable=protected-access
            )
            self.assertEqual(result, {OLD_SVG_FILENAME: NEW_SVG_FILENAME})

    def test_unescape_html_converts_entities(self) -> None:
        """_unescape_html correctly unescapes HTML entities."""
        escaped = '&quot;hello&quot; &amp; &lt;world&gt;'
        result = regenerate_math_svgs_migration_job._unescape_html(  # pylint: disable=protected-access
            escaped
        )
        self.assertEqual(result, '"hello" & <world>')

    def test_escape_html_escapes_special_chars(self) -> None:
        """_escape_html correctly escapes special characters."""
        plain = '"hello" & world'
        result = regenerate_math_svgs_migration_job._escape_html(  # pylint: disable=protected-access
            plain
        )
        self.assertEqual(result, '&quot;hello&quot; &amp; world')

    def test_update_math_tags_replaces_known_filename(self) -> None:
        """Replaces svg_filename when it exists in the mapping."""
        updated_html, count = (
            regenerate_math_svgs_migration_job._update_math_tags_in_html(  # pylint: disable=protected-access
                HTML_WITH_KNOWN_MATH_TAG,
                {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
            )
        )

        self.assertEqual(count, 1)
        self.assertIn(NEW_SVG_FILENAME, updated_html)

    def test_update_math_tags_warning_on_bad_json(self) -> None:
        """Logs warning and makes no replacement when JSON is malformed."""
        html = (
            '<oppia-noninteractive-math math_content-with-value='
            '"not_valid_json_at_all">'
            '</oppia-noninteractive-math>'
        )
        with self.capture_logging(min_level=logging.WARNING) as logs:
            _, count = (
                regenerate_math_svgs_migration_job._update_math_tags_in_html(  # pylint: disable=protected-access
                    html, {}
                )
            )

        self.assertEqual(count, 0)
        self.assertTrue(any('Could not parse' in log for log in logs))

    def test_update_html_in_dict_replaces_html_key(self) -> None:
        obj = {'html': HTML_WITH_KNOWN_MATH_TAG}
        regenerate_math_svgs_migration_job._update_html_in_dict(  # pylint: disable=protected-access
            obj,
            {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
            0,
        )
        self.assertIn(NEW_SVG_FILENAME, obj['html'])
        self.assertNotIn(OLD_SVG_FILENAME, obj['html'])

    def test_update_html_in_dict_handles_nested_dict(self) -> None:
        """Recursion into a nested dict hits the else branch."""
        obj = {'outer': {'html': HTML_WITH_KNOWN_MATH_TAG}}
        regenerate_math_svgs_migration_job._update_html_in_dict(  # pylint: disable=protected-access
            obj,
            {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
            0,
        )
        self.assertIn(NEW_SVG_FILENAME, obj['outer']['html'])

    def test_update_html_in_dict_handles_list(self) -> None:
        """Recursion into a list hits the elif isinstance(obj, list) branch."""
        obj = [{'html': HTML_WITH_KNOWN_MATH_TAG}]
        regenerate_math_svgs_migration_job._update_html_in_dict(  # pylint: disable=protected-access
            obj,
            {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
            0,
        )
        self.assertIn(NEW_SVG_FILENAME, obj[0]['html'])

    def test_update_html_in_dict_ignores_non_dict_non_list(self) -> None:
        original = 'just a string'
        regenerate_math_svgs_migration_job._update_html_in_dict(  # pylint: disable=protected-access
            original, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}, 0
        )
        self.assertEqual(original, 'just a string')

    def test_update_html_in_dict_iterates_multiple_list_items(self) -> None:
        obj = [
            {'html': HTML_WITH_KNOWN_MATH_TAG},
            {'html': HTML_WITHOUT_MATH},
            'just a string',
        ]
        regenerate_math_svgs_migration_job._update_html_in_dict(  # pylint: disable=protected-access
            obj, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}, 0
        )
        first_item = obj[0]
        assert isinstance(first_item, dict)
        self.assertIn(NEW_SVG_FILENAME, first_item['html'])

    def test_exploration_has_math_content_in_content_html(self) -> None:
        """Returns True when math is in state content HTML."""
        exp_id = 'exp_content_math'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['content'][
            'html'
        ] = HTML_WITH_KNOWN_MATH_TAG
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)

    def test_exploration_has_math_in_hints(self) -> None:
        """Returns True when math content is present in hints."""
        exp_id = 'exp_hints'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['hints'] = [
            {
                'hint_content': {
                    'html': HTML_WITH_KNOWN_MATH_TAG,
                    'content_id': 'hint_1',
                }
            }
        ]
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)

    def test_exploration_has_math_in_answer_groups(self) -> None:
        """Returns True when math content is in answer group feedback."""
        exp_id = 'exp_answer_groups'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['interaction']['answer_groups'] = [
            {
                'outcome': {
                    'feedback': {
                        'html': HTML_WITH_KNOWN_MATH_TAG,
                        'content_id': 'feedback_1',
                    },
                    'dest': init_state,
                    'dest_if_really_stuck': None,
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                },
                'rule_specs': [],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)

    def test_exploration_has_math_in_default_outcome(self) -> None:
        """Returns True when math content is in default outcome feedback."""
        exp_id = 'exp_default_outcome'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['interaction']['default_outcome'] = {
            'feedback': {
                'html': HTML_WITH_KNOWN_MATH_TAG,
                'content_id': 'default_outcome',
            },
            'dest': init_state,
            'dest_if_really_stuck': None,
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
        }
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)

    def _make_exp_model_in_memory(
        self, exp_id: str
    ) -> exp_models.ExplorationModel:
        """Creates an exploration and returns the in-memory model without
        re-fetching, so we can mutate states freely without validation
        stripping interaction fields.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        return exp_models.ExplorationModel.get(exp_id)

    def _make_mock_exp_model(
        self,
        exp_id: str,
        states_dict: Dict[str, Any],
        # Here we use type Any because the states
        # structure is nested and heterogeneous. The test only passes it through
        # a mock, so stricter typing is unnecessary here.
    ) -> mock.MagicMock:
        """Returns a mock ExplorationModel with controlled states."""
        exp_model = mock.MagicMock()
        exp_model.id = exp_id
        exp_model.states = states_dict
        return exp_model

    def test_update_exploration_model_handles_exception(self) -> None:
        """Returns Err when an exception occurs during model update."""
        exp_model = mock.MagicMock()
        exp_model.id = 'exp_err'
        type(exp_model).states = mock.PropertyMock(
            side_effect=Exception('boom')
        )
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {}
        )
        self.assertTrue(result.is_err())

    def test_update_exploration_model_updates_content_html(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': HTML_WITH_KNOWN_MATH_TAG},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_content', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)
        content = states['Introduction']['content']
        assert isinstance(content, dict)
        self.assertIn(NEW_SVG_FILENAME, content['html'])

    def test_update_exploration_model_updates_hints(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [
                    {
                        'hint_content': {
                            'html': HTML_WITH_KNOWN_MATH_TAG,
                            'content_id': 'hint_1',
                        }
                    }
                ],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_hints', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_updates_answer_group_feedback(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [
                        {
                            'outcome': {
                                'feedback': {
                                    'html': HTML_WITH_KNOWN_MATH_TAG,
                                    'content_id': 'feedback_1',
                                }
                            }
                        }
                    ],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_answer', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_updates_default_outcome(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': {
                        'feedback': {
                            'html': HTML_WITH_KNOWN_MATH_TAG,
                            'content_id': 'default_outcome',
                        }
                    },
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_default', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_updates_solution(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': {
                    'explanation': {
                        'html': HTML_WITH_KNOWN_MATH_TAG,
                        'content_id': 'solution',
                    }
                },
            }
        }
        exp_model = self._make_mock_exp_model('exp_solution', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_logs_when_replacements_made(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': HTML_WITH_KNOWN_MATH_TAG},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_log', states)
        with self.capture_logging(min_level=logging.INFO) as logs:
            regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
                exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
            )
        self.assertTrue(any('updated' in log for log in logs))

    def test_unescape_html_handles_double_escaped_quotes(self) -> None:
        double_escaped = '&amp;quot;hello&amp;quot;'
        result = regenerate_math_svgs_migration_job._unescape_html(  # pylint: disable=protected-access
            double_escaped
        )
        self.assertEqual(result, '"hello"')

    def test_update_exploration_model_with_no_states(self) -> None:
        exp_model = self._make_mock_exp_model('exp_empty_states', {})
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )

        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertEqual(count, 0)

    def test_update_exploration_model_empty_content_html(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_empty_content', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )

        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertEqual(count, 0)

    def test_update_exploration_model_empty_answer_group_feedback_html(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [
                        {
                            'outcome': {
                                'feedback': {
                                    'html': '',
                                    'content_id': 'feedback_1',
                                }
                            }
                        }
                    ],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_empty_feedback', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertEqual(count, 0)

    def test_update_exploration_model_no_replacements_when_no_math(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': HTML_WITHOUT_MATH},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [
                        {
                            'outcome': {
                                'feedback': {
                                    'html': HTML_WITHOUT_MATH,
                                    'content_id': 'feedback_1',
                                }
                            }
                        }
                    ],
                    'default_outcome': {
                        'feedback': {
                            'html': HTML_WITHOUT_MATH,
                            'content_id': 'default_outcome',
                        }
                    },
                },
                'hints': [
                    {
                        'hint_content': {
                            'html': HTML_WITHOUT_MATH,
                            'content_id': 'hint_1',
                        }
                    }
                ],
                'solution': {
                    'explanation': {
                        'html': HTML_WITHOUT_MATH,
                        'content_id': 'solution',
                    }
                },
            }
        }
        exp_model = self._make_mock_exp_model('exp_no_math', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertEqual(count, 0)

    def test_update_math_tags_skips_tag_without_math_content_attribute(
        self,
    ) -> None:
        html = '<oppia-noninteractive-math></oppia-noninteractive-math>'
        _, count = (
            regenerate_math_svgs_migration_job._update_math_tags_in_html(  # pylint: disable=protected-access
                html, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
            )
        )
        self.assertEqual(count, 0)

    def test_update_exploration_model_updates_customization_args(self) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {
                        'choices': {
                            'value': [{'html': HTML_WITH_KNOWN_MATH_TAG}]
                        }
                    },
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_cust_args', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())

    def test_exploration_has_math_in_multiple_answer_groups(self) -> None:
        exp_id = 'exp_multi_answer_groups'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['interaction']['answer_groups'] = [
            {
                'outcome': {
                    'feedback': {'html': HTML_WITHOUT_MATH, 'content_id': 'f1'},
                    'dest': init_state,
                    'dest_if_really_stuck': None,
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                },
                'rule_specs': [],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            },
            {
                'outcome': {
                    'feedback': {
                        'html': HTML_WITH_KNOWN_MATH_TAG,
                        'content_id': 'f2',
                    },
                    'dest': init_state,
                    'dest_if_really_stuck': None,
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                },
                'rule_specs': [],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            },
        ]
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)

    def test_exploration_has_no_math_in_default_outcome_feedback(self) -> None:
        exp_id = 'exp_default_outcome_no_math'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['content']['html'] = ''
        exp_model.states[init_state]['interaction']['answer_groups'] = []
        exp_model.states[init_state]['hints'] = []
        exp_model.states[init_state]['interaction']['default_outcome'] = {
            'feedback': {'html': HTML_WITHOUT_MATH, 'content_id': 'default'},
            'dest': init_state,
            'dest_if_really_stuck': None,
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
        }
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertFalse(result)

    def test_update_exploration_model_multiple_states_with_solution(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': {
                    'explanation': {
                        'html': '',
                        'content_id': 'solution',
                    }
                },
            },
            'SecondState': {
                'content': {'html': HTML_WITH_KNOWN_MATH_TAG},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            },
        }
        exp_model = self._make_mock_exp_model(
            'exp_solution_multi_states', states
        )
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_hint_loop_continues_after_no_math(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': ''},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [
                    {
                        'hint_content': {
                            'html': '',
                            'content_id': 'hint_1',
                        }
                    },
                    {
                        'hint_content': {
                            'html': HTML_WITH_KNOWN_MATH_TAG,
                            'content_id': 'hint_2',
                        }
                    },
                ],
                'solution': None,
            }
        }
        exp_model = self._make_mock_exp_model('exp_hint_loop', states)
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_update_exploration_model_two_states_first_has_no_solution(
        self,
    ) -> None:
        states = {
            'Introduction': {
                'content': {'html': HTML_WITH_KNOWN_MATH_TAG},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            },
            'SecondState': {
                'content': {'html': HTML_WITH_KNOWN_MATH_TAG},
                'interaction': {
                    'customization_args': {},
                    'answer_groups': [],
                    'default_outcome': None,
                },
                'hints': [],
                'solution': None,
            },
        }
        exp_model = self._make_mock_exp_model(
            'exp_no_solution_two_states', states
        )
        result = regenerate_math_svgs_migration_job._update_exploration_model(  # pylint: disable=protected-access
            exp_model, {OLD_SVG_FILENAME: NEW_SVG_FILENAME}
        )
        self.assertTrue(result.is_ok())
        _, count = result.unwrap()
        self.assertGreater(count, 0)

    def test_exploration_has_math_in_second_hint_not_first(self) -> None:
        exp_id = 'exp_math_in_second_hint'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test', category='Test'
        )
        exp_services.save_new_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration
        )
        exp_model = exp_models.ExplorationModel.get(exp_id)
        init_state = exp_model.init_state_name
        exp_model.states[init_state]['content']['html'] = ''
        exp_model.states[init_state]['interaction']['answer_groups'] = []
        exp_model.states[init_state]['interaction']['default_outcome'] = None
        exp_model.states[init_state]['hints'] = [
            {
                'hint_content': {
                    'html': HTML_WITHOUT_MATH,
                    'content_id': 'hint_1',
                }
            },
            {
                'hint_content': {
                    'html': HTML_WITH_KNOWN_MATH_TAG,
                    'content_id': 'hint_2',
                }
            },
        ]
        result = regenerate_math_svgs_migration_job._exploration_has_math_content(  # pylint: disable=protected-access
            exp_model
        )
        self.assertTrue(result)


class AuditRegenerateMathSvgsJobTests(job_test_utils.JobTestBase):
    """Tests for AuditRegenerateMathSvgsJob.

    The audit job runs the same logic as RegenerateMathSvgsJob but does NOT
    write to the datastore. All the output assertions are identical, but we
    additionally verify that models are NOT updated.
    """

    JOB_CLASS: Type[
        regenerate_math_svgs_migration_job.AuditRegenerateMathSvgsJob
    ] = regenerate_math_svgs_migration_job.AuditRegenerateMathSvgsJob

    EXP_ID: Final = 'exp_1'

    def setUp(self) -> None:
        super().setUp()
        _patch_svg_mapping(
            self,
            {OLD_SVG_FILENAME: NEW_SVG_FILENAME},
        )

    def test_empty_storage(self) -> None:
        """Audit job produces no output when there are no explorations."""
        self.assert_job_output_is_empty()

    def test_exploration_without_math_produces_no_output(self) -> None:
        """Audit job produces no output for explorations without math."""
        _create_exploration_with_html(self.EXP_ID, HTML_WITHOUT_MATH)

        self.assert_job_output_is_empty()

    def test_audit_job_reports_migration_without_writing(self) -> None:
        """Audit job reports the same results as the real job but does NOT
        update the datastore model.
        """
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)
        model_before = exp_models.ExplorationModel.get(self.EXP_ID)
        version_before = model_before.version

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MIGRATED SUCCESS: 1'
                ),
            ]
        )

        model_after = exp_models.ExplorationModel.get(self.EXP_ID)
        self.assertEqual(model_after.version, version_before)

        init_state_name = model_after.init_state_name
        html_after = model_after.states[init_state_name]['content']['html']
        self.assertIn(OLD_SVG_FILENAME, html_after)
        self.assertNotIn(NEW_SVG_FILENAME, html_after)

    def test_audit_job_datastore_updates_not_allowed(self) -> None:
        self.assertFalse(
            regenerate_math_svgs_migration_job.AuditRegenerateMathSvgsJob.DATASTORE_UPDATES_ALLOWED
        )
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_KNOWN_MATH_TAG)
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MIGRATED SUCCESS: 1'
                ),
            ]
        )

    def test_audit_job_does_not_update_unknown_filenames(self) -> None:
        """Audit job leaves unknown filenames untouched (same as real job)."""
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_UNKNOWN_MATH_TAG)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION PROCESSED SUCCESS: 1'
                ),
            ]
        )

        model_after = exp_models.ExplorationModel.get(self.EXP_ID)
        init_state_name = model_after.init_state_name
        html_after = model_after.states[init_state_name]['content']['html']
        self.assertIn(UNKNOWN_SVG_FILENAME, html_after)

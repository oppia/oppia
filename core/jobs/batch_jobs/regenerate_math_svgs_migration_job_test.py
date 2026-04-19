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

from core import feconf
from core.domain import exp_domain, exp_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import regenerate_math_svgs_migration_job
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, Final, Type

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
        self.assertNotIn(OLD_SVG_FILENAME, updated_html)

    def test_exploration_with_unknown_math_filename_is_unchanged(self) -> None:
        """Exploration whose math tag filename is NOT in the mapping is
        processed but not migrated — the filename is left as-is.
        """
        _create_exploration_with_html(self.EXP_ID, HTML_WITH_UNKNOWN_MATH_TAG)

        self.assert_job_output_is(
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
                job_run_result.JobRunResult(
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

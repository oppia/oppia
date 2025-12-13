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

"""Unit tests for jobs.job_options."""

from __future__ import annotations

import os
import tempfile
from unittest import mock

from core.constants import constants
from core.jobs import job_options
from core.tests import test_utils

from apache_beam.options import pipeline_options


class JobOptionsTests(test_utils.TestBase):

    def test_default_values(self) -> None:
        options = job_options.JobOptions()

        self.assertIsNone(options.namespace)

    def test_overwritten_values(self) -> None:
        options = job_options.JobOptions(namespace='abc')

        self.assertEqual(options.namespace, 'abc')

    def test_unsupported_values(self) -> None:
        with self.assertRaisesRegex(ValueError, r'Unsupported option\(s\)'):
            job_options.JobOptions(a='a', b='b')

    def test_repo_tmp_selected_when_dev_mode_and_tmpdir_repo_local(
        self,
    ) -> None:
        repo_path = '/fake/repo'
        beam_tmp = os.path.join(repo_path, os.pardir, 'oppia-tmpfiles', 'beam')
        with (
            mock.patch.dict(constants, {'DEV_MODE': True}),
            mock.patch('os.getcwd', return_value=repo_path),
            mock.patch('os.makedirs') as mock_makedirs,
            mock.patch.object(tempfile, 'tempdir', None),
            mock.patch('logging.getLogger') as mock_logger,
        ):
            options = job_options.JobOptions()

            mock_makedirs.assert_called_once_with(beam_tmp, exist_ok=True)
            self.assertEqual(tempfile.tempdir, beam_tmp)
            mock_logger.return_value.info.assert_called_once_with(
                'Using repo-local Beam tmpdir: %s', beam_tmp
            )
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).temp_location,
                beam_tmp,
            )
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).staging_location,
                beam_tmp,
            )

    def test_no_repo_tmp_when_not_dev_mode(self) -> None:
        with (
            mock.patch.dict(constants, {'DEV_MODE': False}),
            mock.patch.dict(os.environ, {'TMPDIR': '/tmp'}),
            mock.patch('os.getcwd', return_value='/fake/repo'),
            mock.patch('os.path.abspath', side_effect=lambda p: p),
            mock.patch('os.makedirs') as mock_makedirs,
        ):
            options = job_options.JobOptions()

            mock_makedirs.assert_not_called()
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).temp_location,
                'gs://dev-project-id-beam-jobs-temp/',
            )
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).staging_location,
                'gs://dev-project-id-beam-jobs-staging/',
            )

    def test_no_repo_tmp_when_tmpdir_not_repo_local(self) -> None:
        repo_path = '/fake/repo'
        beam_tmp = os.path.join(repo_path, 'tmp', 'beam')
        with (
            mock.patch.dict(constants, {'DEV_MODE': True}),
            mock.patch.dict(os.environ, {'TMPDIR': '/system/tmp'}),
            mock.patch('os.getcwd', return_value=repo_path),
            mock.patch('os.path.abspath', side_effect=lambda p: p),
            mock.patch('os.makedirs') as mock_makedirs,
        ):
            options = job_options.JobOptions()

            mock_makedirs.assert_called_once_with(beam_tmp, exist_ok=True)
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).temp_location,
                beam_tmp,
            )
            self.assertEqual(
                options.view_as(
                    pipeline_options.GoogleCloudOptions
                ).staging_location,
                beam_tmp,
            )

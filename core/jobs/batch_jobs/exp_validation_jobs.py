# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for exploration models"""

from __future__ import annotations

from urllib.parse import urlparse   # pylint: disable-msg=C0003

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
from typing import Iterator

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetExpsWithInvalidURLJob(base_jobs.JobBase):
    """Job that returns invalid exploration models."""

    # The following function has been adapted from
    # https://stackoverflow.com/questions/39233973/get-all-keys-of-a-nested-dictionary
    def recursive_items(self, dictionary: dict) -> Iterator[tuple]:
        """Yields an iterator containing tuples of key, value pairs

        Yields:
            tuple. Yields tuples of key, value pairs.
        """
        for key, value in dictionary.items():
            if isinstance(value, dict):
                yield from self.recursive_items(value)
            else:
                yield (key, value)

    def get_invalid_links(self, dictionary: dict) -> list:
        """Returns list of invalid links

            Returns:
                list. Returns list of invalid links.
            """
        string = ''
        for key, value in self.recursive_items(dictionary):
            if key == 'html':
                string += value

        soup = bs4.BeautifulSoup(string, 'html.parser')

        # Extract links.
        links = soup.find_all('oppia-noninteractive-link')
        cleaned_links = []
        for link in links:
            # Remove &quot; from the links.
            cleaned_links.append(
                link.get('url-with-value').replace('&quot;', ''))

        invalid_links = []
        for link in cleaned_links:
            # Separate protocol from the link.
            link_info = urlparse(link)
            # Protocols other than 'https' are invalid.
            if link_info.scheme not in ('https', ''):
                invalid_links.append(link)

        return invalid_links

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations

        Returns:
            PCollection. Returns PCollection of invalid explorations.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
        )

        exp_ids_invalid_links = (
            total_explorations
            | 'Combine exploration title and states' >> beam.Map(
                lambda exp: (exp.id, exp.states))
            | 'Combine exp ids and the invalid links' >>
                beam.Map(lambda exp: (exp[0], self.get_invalid_links(exp[1])))
            | 'Filter exps with invalid links' >>
                beam.Filter(lambda exp: len(exp[1]) > 0)
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_invalid_links
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids = (
            exp_ids_invalid_links
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the invalid links are %s'
                    % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids
            )
            | 'Combine results' >> beam.Flatten()
        )


# TODO(#14943): Remove this job after we fix the exploration titles length.
class GetNumberOfExpExceedsMaxTitleLengthJob(base_jobs.JobBase):
    """Job that returns exploration having title length more than 36."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        actual length.

        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and actual length.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exp_ids_with_exceeding_max_title_len = (
            total_explorations
            | 'Combine exploration title and ids' >> beam.Map(
                lambda exp: (exp.id, exp.title))
            | 'Filter exploraton with title length greater than 36' >>
                beam.Filter(lambda exp: len(exp[1]) > 36)
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_exceeding_max_title_len
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_actual_len = (
            exp_ids_with_exceeding_max_title_len
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and its actual len is %s'
                    % (objects[0], len(objects[1]))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids_and_their_actual_len
            )
            | 'Combine results' >> beam.Flatten()
        )

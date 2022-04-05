
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

"""Validation Jobs for tags of exploration"""

from __future__ import annotations

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import List

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpHavingInvalidTagsListJob(base_jobs.JobBase):
    """Job that returns invalid exploration tags"""

    def _check_tags_validity(self, tags: List[str]) -> bool:
        """checks whether tags list is valid or not.

        Args:
            tags: List[str]. The list of all tags in exploration.

        Returns:
            bool. If the list containing tags have length more than 10 or
            individual tag have length more than 30, then it returns True
            otherwise False.
        """
        if len(tags) > 10:
            return True
        if len(set(tags)) < len(tags):
            return True
        for tag in tags:
            if tag.strip() == '':
                return True
            elif len(tag) > 30:
                return True
        return False

    def _get_description_of_wrong_exp(self, tags: List[str]) -> str:
        """Returns the description of invalid tags property.

        Args:
            tags: List[str]. The list of all tag in exlporation.

        Returns:
            str. Description of invalid tags property.
        """
        output_string = ''
        visited = set()
        dup: List[str] = []
        empty_tag = max_length_exceed_tag = 0

        if len(tags) > 10:
            output_string += ' tags length more than 10,'
        if len(set(tags)) < len(tags):
            for ele in tags:
                if ele.strip() != '':
                    if ele in visited or (visited.add(ele)):
                        dup.append(ele)
            if len(dup) != 0:
                output_string += f' {len(dup)} duplicate values {dup},'

        for tag in tags:
            if tag.strip() == '':
                empty_tag += 1
            elif len(tag) > 30:
                max_length_exceed_tag += 1

        if (empty_tag != 0) or (max_length_exceed_tag != 0):
            output_string += (
                f' {empty_tag} empty tag and'
                + f' {max_length_exceed_tag} tag having length more than 30, ')

        last_comma_index = output_string.rfind(',')
        output_string = (
            output_string[:last_comma_index] + '.'
            + output_string[last_comma_index + 1:])

        return output_string.rstrip()

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        actual tags list.

        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and actual tags list.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exp_ids_with_invalid_tags = (
            total_explorations
            | 'Combine exploration tags and ids' >> beam.Map(
                lambda exp: (exp.id, exp.tags))
            | 'Filter exploraton with tags length greater than 10' >>
                beam.Filter(lambda exp: self._check_tags_validity(exp[1]))
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_invalid_tags
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_actual_len = (
            exp_ids_with_invalid_tags
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The exp of id %s contains%s'
                    % (
                        objects[0],
                        self._get_description_of_wrong_exp(objects[1])
                    )
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

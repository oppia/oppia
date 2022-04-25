
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

"""Validation Jobs for tags of exploration."""

from __future__ import annotations

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpHavingInvalidTagsListJob(base_jobs.JobBase):
    """Job that returns invalid exploration tags."""

    def _check_tags_are_valid(
        self, exp: exp_models.ExplorationModel
    ) -> result.Result[
        exp_models.ExplorationModel, str
    ]:
        """Returns the Result object based on the validity of tags
        in the exploration model.

        Args:
            exp: exp_models.ExplorationModel. The model of exploration
                from which tags are fetched.

        Returns:
            Result[exp_models.ExplorationModel, str]. Result object that
            contains ExplorationModel when the operation is successful
            and str (containing error message) when invalid tags occurs.
        """
        tags = exp.tags
        tags_are_valid = True
        output_string = 'The exp of id %s contains' % exp.id
        visited = set()
        dup: List[str] = []
        empty_tag = max_length_exceed_tag = 0

        if len(tags) > 10:
            tags_are_valid = False
            output_string += ' tags length more than 10,'
        if len(set(tags)) < len(tags):
            tags_are_valid = False
            for ele in tags:
                if ele.strip() != '':
                    if ele in visited or (visited.add(ele)):
                        dup.append(ele)
            if len(dup) != 0:
                output_string += f' {len(dup)} duplicate values {dup},'

        for tag in tags:
            if tag.strip() == '':
                tags_are_valid = False
                empty_tag += 1
            elif len(tag) > 30:
                tags_are_valid = False
                max_length_exceed_tag += 1

        if (empty_tag != 0) or (max_length_exceed_tag != 0):
            output_string += (
                f' {empty_tag} empty tag and'
                + f' {max_length_exceed_tag} tag having length more than 30, ')

        last_comma_index = output_string.rfind(',')
        output_string = (
            output_string[:last_comma_index] + '.'
            + output_string[last_comma_index + 1:])

        if tags_are_valid:
            return result.Ok(exp)
        else:
            return result.Err(output_string)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of explorations having invalid tags list
        with the respective exploration id.

        Returns:
            PCollection. Returns PCollection of explorations having invalid
            tags list with the respective exploration id.
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
            | beam.Map(self._check_tags_are_valid)
        )

        return (
            exp_ids_with_invalid_tags
            | 'Transform Results to JobRunResults' >> (
                job_result_transforms.ResultsToJobRunResults())
        )

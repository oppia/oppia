
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
from typing import List

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpExceedsMaxTagsListLengthJob(base_jobs.JobBase):
    """Job that returns exploration having tags list length more than 10"""

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

        exp_ids_with_exceeding_max_tags_len = (
            total_explorations
            | 'Combine exploration tags and ids' >> beam.Map(
                lambda exp: (exp.id, exp.tags))
            | 'Filter exploraton with tags length greater than 10' >>
                beam.Filter(lambda exp: len(exp[1]) > 10)
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_exceeding_max_tags_len
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_actual_len = (
            exp_ids_with_exceeding_max_tags_len
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and its actual tags len is %s'
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

class GetNumberOfExpHavingDuplicatetTagValuesJob(base_jobs.JobBase):
    """Job that returns exploration having duplicate values in tags"""

    def _get_duplicate_values_in_tags(self, tags: List[str]) -> List[str]:
        """return all duplicate values in tags of exploration.
        
        Args:
            tags: List[str]. The list of all tag in exploration.
        
        Returns:
            List[str]. List of all the duplicate values in tags.
        """
        visited = set()
        dup: List[str] = []
        for ele in tags:
            if ele in visited or (visited.add(ele) or False):
                dup.append(ele)

        return dup

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        duplicate values in tags.
        
        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and duplicate values in tags.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exp_ids_with_duplicate_tags = (
            total_explorations
            | 'Combine exploration tags and ids' >> beam.Map(
                lambda exp: (exp.id, exp.tags))
            | 'Filter exploraton with tags containing duplicates' >>
                beam.Filter(lambda exp: len(set(exp[1])) < len(exp[1]))
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_duplicate_tags
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_duplicate_values = (
            exp_ids_with_duplicate_tags
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and its duplicate tags are %s'
                    % (objects[0], self._get_duplicate_values_in_tags(objects[1]))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids_and_their_duplicate_values
            )
            | 'Combine results' >> beam.Flatten()
        )


# class GetNumberOfExpHavingIncorrectTagLengthJob(base_jobs.JobBase):
#     """Job that returns exploration in which tags having empty stings
#     or having strings with length more than 30.
#     """

#     def _check_tag_string_validity(self, tags: List[str]) -> str:
#         empty_strings = 0;
#         length_limit_exceeding_strings = 0;

#         for tag in tags:
#             if tag.strip() == '':
#                 empty_strings += 1
#             elif len(tag) > 30:
#                 length_limit_exceeding_strings += 1



#     def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
#         """Returns PCollection of invalid explorations with their id,
#         number of empty strings and number of strings having length more
#         than 30.
        
#         Returns:
#             PCollection. Returns PCollection of invalid explorations with
#             their id, number of empty strings and number of strings having
#             length more than 30.
#         """
#         total_explorations = (
#             self.pipeline
#             | 'Get all ExplorationModels' >> ndb_io.GetModels(
#                 exp_models.ExplorationModel.get_all(include_deleted=False))
#             | 'Get exploration from model' >> beam.Map(
#                 exp_fetchers.get_exploration_from_model)
#         )

#         exp_ids_with_duplicate_tags = (
#             total_explorations
#             | 'Combine exploration tags and ids' >> beam.Map(
#                 lambda exp: (exp.id, exp.tags))
#             | 'Filter exploraton with tags containing duplicates' >>
#                 beam.Filter(lambda exp: len(set(exp[1])) < len(exp[1]))
#         )
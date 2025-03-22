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

"""Audit jobs that check if any skills in the datastore have hanging
    prerequisites. If a skill A is added as a prerequisite skill to
    some topic/skill and deleted or merged to another skill B, A is
    called a hanging prerequisite.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable, Tuple, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([
    models.Names.SKILL])


class CountHangingPrerequisiteSkillsJob(base_jobs.JobBase):
    """Job that counts skills having hanging prerequisites."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of skills having hanging
        prerequisites aggregated from all Skill models.

        Returns:
            PCollection. A PCollection of hanging prerequisite
            skills discovered during the validation.
        """
        skill_models_pcoll = (
            self.pipeline
            | 'Get all SkillModels' >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(
                    include_deleted=False))
        )

        all_skill_ids = (
            skill_models_pcoll
            | 'Extract skill model ids' >> beam.Map(
                lambda skill_model: skill_model.id
            )
        )

        prerequisite_skill_ids = (
            skill_models_pcoll
            | 'Extract prerequisite skill ids' >> beam.FlatMap(
                lambda skill_model: skill_model.prerequisite_skill_ids
                if skill_model.prerequisite_skill_ids else []
            )
            | 'Remove duplicate prerequisites' >> beam.Filter(
                lambda x, seen=set(): not (x in seen or seen.add(x))
            )
        )

        hanging_prerequisites = (
            prerequisite_skill_ids
            | 'Check if prerequisite exists' >> beam.ParDo(
                CheckPrerequisiteExists(),
                beam.pvalue.AsIter(all_skill_ids)
            )
            | 'Filter hanging prerequisites' >> beam.Filter(
                # Keep only skills that don't exist (False)
                lambda result: not result[1]
            )
            | 'Create collection of hanging prerequisites' >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    f"""Skill with ID: {result[0]} is referenced as a prerequisite but does not exist""" # pylint: disable=line-too-long
                )
            )
        )

        return hanging_prerequisites


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class CheckPrerequisiteExists(beam.DoFn): # type: ignore[misc]
    """DoFn to check if a prerequisite skill exists in the list of all
    skills.
    """

    def process(
        self,
        prerequisite_id: str,
        all_skill_ids: List[str]
    ) -> Iterable[Tuple[str, bool]]:
        """Check if the prerequisite exists in all skill IDs.

        Args:
            prerequisite_id: string. The ID of the prerequisite skill to check.
            all_skill_ids: list(string). List of all valid skill IDs.

        Yields:
            Tuple(string, boolean). A tuple (prerequisite_id, exists) where
            exists is True if the prerequisite exists in all_skill_ids, False
            otherwise.
        """
        exists = prerequisite_id in all_skill_ids
        yield (prerequisite_id, exists)

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

"""Jobs used for fetching voice artist names from curated explorations."""

from __future__ import annotations

import logging

from core import utils
from core.domain import exp_domain
from core.domain import opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import voiceover_models
    from mypy_imports import exp_models

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


class GetVoiceArtistNamesFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching voice artist names from curated explorations."""

    @staticmethod
    def _printing(exp_id):
        print(exp_id)
        return result.Ok(exp_id)

    @staticmethod
    def get_voice_artist_name_from_exploration_model(exp_model):
        exp_id = exp_model.id
        exp_id = exp_model.id
        exp_latest_version = exp_model.version
        exp_version_list = [
            exp_version for exp_version in range(1, exp_latest_version + 1)]
        exp_commit_log_entry_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                exp_id, exp_version_list))

        for exp_commit_log_model in exp_commit_log_entry_models:
            exp_change_dicts = exp_commit_log_model.commit_cmds
            user_id = exp_commit_log_model.user_id
            print('.....')
            print(user_id)
            print(exp_change_dicts)
            print('-------------------')

        return result.Ok(exp_id)



    def run(self):
        print('Hello')
        # -> beam.PCollection[job_run_result.JobRunResult]
        curated_exploration_models = (
            self.pipeline
            | 'Get Explorations' >> (
                ndb_io.GetModels(exp_models.ExplorationModel.get_all()))
            | 'Curated Explorations'  >> beam.Filter(
                lambda model: opportunity_services.
                is_exploration_available_for_contribution(model.id))
            | 'Print userID' >> beam.Map(
                lambda model: self.get_voice_artist_name_from_exploration_model(model)
            )
        )

        print(curated_exploration_models)


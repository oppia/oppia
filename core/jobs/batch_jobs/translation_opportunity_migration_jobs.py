# coding: utf-8
#
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

"""Jobs that migrate TranslationOpportunityModel and ExplorationOpportunitySummaryModel."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain, exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, List, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, opportunity_models, translation_models

(
    exp_models,
    opportunity_models,
    translation_models,
) = models.Registry.import_models(
    [
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
    ]
)
datastore_services = models.Registry.import_datastore_services()


class BackfillTranslationMissingReasonsJob(base_jobs.JobBase):
    """Backfills translation_missing_reasons for opportunity models."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _backfill_missing_reasons(
        element: Tuple[
            str,
            Dict[
                str,
                Iterable[
                    Union[
                        str,
                        exp_domain.Exploration,
                        translation_models.EntityTranslationsModel,
                        opportunity_models.TranslationOpportunityModel,
                        opportunity_models.ExplorationOpportunitySummaryModel,
                    ]
                ],
            ],
        ],
    ) -> result.Result[
        Tuple[
            List[opportunity_models.TranslationOpportunityModel],
            List[opportunity_models.ExplorationOpportunitySummaryModel],
        ],
        str,
    ]:
        """Calculates and updates translation_missing_reasons for models."""
        grouped_data = element[1]

        # Here we use cast because we are narrowing down the type of exps.
        exps = list(cast(Iterable[exp_domain.Exploration], grouped_data['exp']))
        if not exps:
            return result.Err('Missing ExplorationModel')
        exp = exps[0]

        # Here we use cast because we are narrowing down the type of translations.
        translations = [
            t
            for t in cast(
                Iterable[translation_models.EntityTranslationsModel],
                grouped_data['translations'],
            )
            if t.entity_version == exp.version
        ]

        # Here we use cast because we are narrowing down the type of trans_opp_models.
        trans_opp_models = list(
            cast(
                Iterable[opportunity_models.TranslationOpportunityModel],
                grouped_data['trans_opp_models'],
            )
        )
        # Here we use cast because we are narrowing down the type of exp_opp_summary_models.
        exp_opp_summary_models = list(
            cast(
                Iterable[opportunity_models.ExplorationOpportunitySummaryModel],
                grouped_data['exp_opp_summary_models'],
            )
        )

        with datastore_services.get_ndb_context():
            translation_missing_reasons = {}
            for translation_model in translations:
                lang_code = translation_model.language_code
                reasons = set()
                for state in exp.states.values():
                    pending_contents = (
                        state.get_all_contents_which_need_translations(
                            translation_model
                        ).values()
                    )
                    for content in pending_contents:
                        reasons.add(content.status.value)
                if reasons:
                    translation_missing_reasons[lang_code] = sorted(
                        list(reasons)
                    )

            updated_trans_opp_models = []
            for trans_opp_model in trans_opp_models:
                trans_opp_model.translation_missing_reasons = (
                    translation_missing_reasons
                )
                trans_opp_model.update_timestamps()
                updated_trans_opp_models.append(trans_opp_model)

            updated_exp_opp_summary_models = []
            for exp_opp_summary_model in exp_opp_summary_models:
                exp_opp_summary_model.translation_missing_reasons = (
                    translation_missing_reasons
                )
                exp_opp_summary_model.update_timestamps()
                updated_exp_opp_summary_models.append(exp_opp_summary_model)

        return result.Ok(
            (updated_trans_opp_models, updated_exp_opp_summary_models)
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Get exploration from model'
            >> beam.Map(exp_fetchers.get_exploration_from_model)
            | 'Map exp to exp_id' >> beam.Map(lambda exp: (exp.id, exp))
        )

        entity_translations_pcoll = (
            self.pipeline
            | 'Get all EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter exploration translations'
            >> beam.Filter(
                lambda model: model.entity_type
                == feconf.TranslatableEntityType.EXPLORATION.value
            )
            | 'Map translation to exp_id'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        trans_opp_models_pcoll = (
            self.pipeline
            | 'Get all TranslationOpportunityModels'
            >> ndb_io.GetModels(
                opportunity_models.TranslationOpportunityModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter exploration TranslationOpportunityModels'
            >> beam.Filter(
                lambda model: model.entity_type
                == feconf.TranslatableEntityType.EXPLORATION.value
            )
            | 'Map trans opp model to exp_id'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        exp_opp_summary_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationOpportunitySummaryModels'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False
                )
            )
            | 'Map exp opp summary model to exp_id'
            >> beam.Map(lambda model: (model.id, model))
        )

        grouped_data = {
            'exp': exp_models_pcoll,
            'translations': entity_translations_pcoll,
            'trans_opp_models': trans_opp_models_pcoll,
            'exp_opp_summary_models': exp_opp_summary_models_pcoll,
        } | 'Group by exp_id' >> beam.CoGroupByKey()

        processed_models = (
            grouped_data
            | 'Backfill missing reasons'
            >> beam.Map(self._backfill_missing_reasons)
        )

        ok_results = (
            processed_models
            | 'Filter OK results' >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap results' >> beam.Map(lambda res: res.unwrap())
        )

        # Separate the Trans Opp Models and Exp Opp Summary Models for datastore saving.
        trans_opp_models_to_save = (
            ok_results
            | 'Extract Trans Opp Models' >> beam.FlatMap(lambda res: res[0])
        )
        exp_opp_summary_models_to_save = (
            ok_results
            | 'Extract Exp Opp Summary Models'
            >> beam.FlatMap(lambda res: res[1])
        )

        unused_trans_opp_put_results = (
            trans_opp_models_to_save
            | 'Put Trans Opp Models' >> ndb_io.PutModels()
        )

        unused_exp_opp_put_results = (
            exp_opp_summary_models_to_save
            | 'Put Exp Opp Summary Models' >> ndb_io.PutModels()
        )

        job_run_results = (
            processed_models
            | 'Generate results'
            >> job_result_transforms.ResultsToJobRunResults(
                'BACKFILL_TRANSLATION_MISSING_REASONS'
            )
        )

        return job_run_results

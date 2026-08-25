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

"""Jobs that backfill TranslationOpportunityModel from existing ExplorationModels and StoryModels."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    exp_fetchers,
    topic_domain,
    topic_fetchers,
    translation_fetchers,
)
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
    from mypy_imports import (
        exp_models,
        opportunity_models,
        story_models,
        topic_models,
        translation_models,
    )

(
    exp_models,
    opportunity_models,
    translation_models,
    story_models,
    topic_models,
) = models.Registry.import_models(
    [
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
        models.Names.STORY,
        models.Names.TOPIC,
    ]
)
datastore_services = models.Registry.import_datastore_services()


class BackfillTranslationOpportunityModelJob(base_jobs.JobBase):
    """Backfills TranslationOpportunityModels from existing ExplorationModels and StoryModels."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _create_translation_opportunity(
        element: Tuple[
            str,
            Dict[
                str,
                Iterable[
                    Union[
                        str,
                        exp_domain.Exploration,
                        translation_models.EntityTranslationsModel,
                    ]
                ],
            ],
        ],
    ) -> result.Result[opportunity_models.TranslationOpportunityModel, str]:
        """Creates a TranslationOpportunityModel from the grouped data."""
        exp_id = element[0]
        grouped_data = element[1]

        # Here we use cast because we are narrowing down the type of topic_ids.
        topic_ids = list(set(cast(Iterable[str], grouped_data['topic_ids'])))
        if not topic_ids:
            return result.Err('Missing topic_id')

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
        with datastore_services.get_ndb_context():
            content_count = exp.get_content_count(
                override_metadata_feature_flag=True
            )

            translation_counts = {}
            translation_missing_reasons = {}
            for translation_model in translations:
                lang_code = translation_model.language_code
                count = 0
                for (
                    translated_content
                ) in translation_model.translations.values():
                    if not translated_content['needs_update']:
                        count += 1
                translation_counts[lang_code] = count

                reasons = set()
                entity_translation = (
                    translation_fetchers.get_entity_translation_from_model(
                        translation_model
                    )
                )
                for state in exp.states.values():
                    pending_contents = (
                        state.get_all_contents_which_need_translations(
                            entity_translation
                        ).values()
                    )
                    for content in pending_contents:
                        reasons.add(content.status.value)
                if reasons:
                    translation_missing_reasons[lang_code] = sorted(
                        list(reasons)
                    )

            audio_language_codes = set(
                language['id']
                for language in constants.SUPPORTED_AUDIO_LANGUAGES
            )
            complete_languages = [
                lang
                for lang, count in translation_counts.items()
                if count == content_count
            ]
            incomplete_translation_language_codes = sorted(
                list(audio_language_codes - set(complete_languages))
            )
            if exp.language_code in incomplete_translation_language_codes:
                incomplete_translation_language_codes.remove(exp.language_code)

            model = opportunity_models.TranslationOpportunityModel(
                id=opportunity_models.TranslationOpportunityModel._generate_id(  # pylint: disable=protected-access
                    feconf.TranslatableEntityType.EXPLORATION.value, exp_id
                ),
                entity_type=feconf.TranslatableEntityType.EXPLORATION.value,
                entity_id=exp_id,
                topic_ids=topic_ids,
                content_count=content_count,
                incomplete_translation_language_codes=incomplete_translation_language_codes,
                translation_counts=translation_counts,
                translation_missing_reasons=translation_missing_reasons,
            )
            model.update_timestamps()
        return result.Ok(model)

    def _compute_translation_opportunities(
        self,
    ) -> beam.PCollection[
        result.Result[opportunity_models.TranslationOpportunityModel, str]
    ]:
        """Computes the new translation opportunity models from datastore."""

        def get_published_story_ids(
            topic: topic_domain.Topic,
        ) -> Iterable[str]:
            for reference in topic.canonical_story_references:
                if reference.story_is_published:
                    yield reference.story_id
            for reference in topic.additional_story_references:
                if reference.story_is_published:
                    yield reference.story_id

        def extract_topic_ids_from_story(
            story_model: story_models.StoryModel,
        ) -> Iterable[Tuple[str, str]]:
            topic_id = story_model.corresponding_topic_id
            nodes = story_model.story_contents.get('nodes', [])
            for node in nodes:
                node_exp_id = node.get('exploration_id')
                if node_exp_id:
                    yield (node_exp_id, topic_id)

        published_story_ids_pcoll = (
            self.pipeline
            | 'Get all TopicModels'
            >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False)
            )
            | 'Get topic from model'
            >> beam.Map(topic_fetchers.get_topic_from_model)
            | 'Extract published story IDs'
            >> beam.FlatMap(get_published_story_ids)
            | 'Distinct story IDs'
            >> beam.Distinct()  # pylint: disable=no-value-for-parameter
        )

        story_topic_ids_pcoll = (
            self.pipeline
            | 'Get all StoryModels'
            >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False)
            )
            | 'Filter published StoryModels'
            >> beam.Filter(
                lambda story, published_ids: story.id in published_ids,
                beam.pvalue.AsList(published_story_ids_pcoll),
            )
            | 'Extract exp_id and topic_id'
            >> beam.FlatMap(extract_topic_ids_from_story)
        )

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

        grouped_data = {
            'topic_ids': story_topic_ids_pcoll,
            'exp': exp_models_pcoll,
            'translations': entity_translations_pcoll,
        } | 'Group by exp_id' >> beam.CoGroupByKey()

        return grouped_data | 'Create TranslationOpportunityModels' >> beam.Map(
            self._create_translation_opportunity
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        created_models_results = self._compute_translation_opportunities()

        computed_opp_models_pcoll = (
            created_models_results
            | 'Filter OK results for cleanup'
            >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap models for cleanup' >> beam.Map(lambda res: res.unwrap())
        )

        existing_opp_models_pcoll = (
            self.pipeline
            | 'Get all TranslationOpportunityModels for cleanup'
            >> ndb_io.GetModels(
                opportunity_models.TranslationOpportunityModel.get_all(
                    include_deleted=False
                )
            )
        )

        computed_by_id = (
            computed_opp_models_pcoll
            | 'Map computed by id' >> beam.Map(lambda model: (model.id, model))
        )
        existing_by_id = (
            existing_opp_models_pcoll
            | 'Map existing by id' >> beam.Map(lambda model: (model.id, model))
        )

        grouped_opp_models = {
            'computed': computed_by_id,
            'existing': existing_by_id,
        } | 'Group opp models for deletion' >> beam.CoGroupByKey()

        def get_orphans(
            element: Tuple[
                str,
                Dict[
                    str,
                    Iterable[opportunity_models.TranslationOpportunityModel],
                ],
            ],
        ) -> Iterable[opportunity_models.TranslationOpportunityModel]:
            _, grouped_data = element
            existing = list(grouped_data['existing'])
            computed = list(grouped_data['computed'])
            if existing and not computed:
                yield existing[0]

        orphans_pcoll = grouped_opp_models | 'Extract orphans' >> beam.FlatMap(
            get_orphans
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                computed_opp_models_pcoll | 'Put models' >> ndb_io.PutModels()
            )

            unused_delete_results = (
                orphans_pcoll
                | 'Get orphan keys' >> beam.Map(lambda model: model.key)
                | 'Delete orphan models' >> ndb_io.DeleteModels()
            )

        creation_results = (
            created_models_results
            | 'Generate creation results'
            >> job_result_transforms.ResultsToJobRunResults(
                'TRANSLATION OPPORTUNITY MODEL CREATION'
            )
        )

        deletion_results = (
            orphans_pcoll
            | 'Generate deletion results'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'TRANSLATION OPPORTUNITY MODEL DELETION'
            )
        )

        return (
            creation_results,
            deletion_results,
        ) | 'Flatten results' >> beam.Flatten()


class AuditBackfillTranslationOpportunityModelJob(
    BackfillTranslationOpportunityModelJob
):
    """Audit job for BackfillTranslationOpportunityModelJob."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        created_models_results = self._compute_translation_opportunities()

        computed_opp_models_pcoll = (
            created_models_results
            | 'Filter OK results' >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap models' >> beam.Map(lambda res: res.unwrap())
            | 'Map computed models' >> beam.Map(lambda model: (model.id, model))
        )

        existing_opp_models_pcoll = (
            self.pipeline
            | 'Get all TranslationOpportunityModels'
            >> ndb_io.GetModels(
                opportunity_models.TranslationOpportunityModel.get_all(
                    include_deleted=False
                )
            )
            | 'Map existing models' >> beam.Map(lambda model: (model.id, model))
        )

        def compare_models(
            element: Tuple[
                str,
                Dict[
                    str,
                    Iterable[opportunity_models.TranslationOpportunityModel],
                ],
            ],
        ) -> Iterable[Tuple[str, int]]:
            opp_id, grouped_data = element
            existing = list(grouped_data['existing'])
            computed = list(grouped_data['computed'])

            if not computed:
                yield ('orphaned', 1)
                exist_model = existing[0]
                yield ('exist_content_count', exist_model.content_count)
                for lang, count in exist_model.translation_counts.items():
                    yield (f'exist_translation_count_{lang}', count)
                return

            comp_model = computed[0]
            yield ('comp_content_count', comp_model.content_count)
            for lang, count in comp_model.translation_counts.items():
                yield (f'comp_translation_count_{lang}', count)

            if not existing:
                yield ('missing', 1)
                return

            exist_model = existing[0]
            yield ('exist_content_count', exist_model.content_count)
            for lang, count in exist_model.translation_counts.items():
                yield (f'exist_translation_count_{lang}', count)

            if (
                exist_model.content_count != comp_model.content_count
                or exist_model.translation_counts
                != comp_model.translation_counts
            ):
                yield ('discrepancy', 1)
                yield (
                    f'error_details: Discrepancy for model {opp_id}: '
                    f'Existing (content_count={exist_model.content_count}, '
                    f'translation_counts={exist_model.translation_counts}), '
                    f'Computed (content_count={comp_model.content_count}, '
                    f'translation_counts={comp_model.translation_counts})',
                    1,
                )
            else:
                yield ('match', 1)

        def generate_audit_results(
            key_and_counts: Iterable[Tuple[str, int]],
        ) -> Iterable[job_run_result.JobRunResult]:
            totals: Dict[str, int] = {}
            error_details: List[str] = []
            for key, count in key_and_counts:
                if key.startswith('error_details:'):
                    error_details.append(key.split('error_details: ')[1])
                else:
                    totals[key] = totals.get(key, 0) + count

            exist_translation_totals = {}
            comp_translation_totals = {}
            for key, count in totals.items():
                if key.startswith('exist_translation_count_'):
                    lang = key.split('exist_translation_count_')[1]
                    exist_translation_totals[lang] = count
                elif key.startswith('comp_translation_count_'):
                    lang = key.split('comp_translation_count_')[1]
                    comp_translation_totals[lang] = count

            exist_translation_totals_str = (
                ', '.join(
                    f'{lang}: {count}'
                    for lang, count in sorted(exist_translation_totals.items())
                )
                or 'None'
            )
            comp_translation_totals_str = (
                ', '.join(
                    f'{lang}: {count}'
                    for lang, count in sorted(comp_translation_totals.items())
                )
                or 'None'
            )

            yield job_run_result.JobRunResult.as_stdout(
                f'Audit Summary:\n'
                f'- Matches: {totals.get("match", 0)}\n'
                f'- Missing in Datastore: {totals.get("missing", 0)}\n'
                f'- Discrepancies: {totals.get("discrepancy", 0)}\n'
                f'- Orphaned in Datastore: {totals.get("orphaned", 0)}\n'
                f'- Total Content Count (Existing): {totals.get("exist_content_count", 0)}\n'
                f'- Total Content Count (Computed): {totals.get("comp_content_count", 0)}\n'
                f'- Total Translation Counts (Existing): {exist_translation_totals_str}\n'
                f'- Total Translation Counts (Computed): {comp_translation_totals_str}'
            )

            for detail in error_details:
                yield job_run_result.JobRunResult.as_stderr(detail)

        compare_results = (
            {
                'existing': existing_opp_models_pcoll,
                'computed': computed_opp_models_pcoll,
            }
            | 'Group opp models' >> beam.CoGroupByKey()
            | 'Compare models' >> beam.FlatMap(compare_models)
            | 'Combine counts' >> beam.combiners.ToList()
            | 'Generate audit results' >> beam.FlatMap(generate_audit_results)
        )

        summary_results = (
            created_models_results
            | 'Generate results'
            >> job_result_transforms.ResultsToJobRunResults(
                'TRANSLATION OPPORTUNITY MODEL CREATION'
            )
        )

        return (
            compare_results,
            summary_results,
        ) | 'Flatten results' >> beam.Flatten()

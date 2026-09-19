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

"""Jobs that backfill TranslationOpportunityModel from existing ExplorationModels, StoryModels and SkillModels."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    exp_fetchers,
    skill_domain,
    skill_fetchers,
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
        skill_models,
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
    skill_models,
) = models.Registry.import_models(
    [
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
        models.Names.STORY,
        models.Names.TOPIC,
        models.Names.SKILL,
    ]
)
datastore_services = models.Registry.import_datastore_services()

# The domain objects a translation opportunity can be built from. Both extend
# translation_domain.BaseTranslatableObject, and both expose the version,
# language_code, get_content_count() and get_translation_count() members the
# shared code below reads.
TranslatableEntity = Union[exp_domain.Exploration, skill_domain.Skill]

# One element of the CoGroupByKey over an entity ID: the topic IDs the entity
# belongs to, the entity's own domain object, and its translation models.
GroupedEntityData = Tuple[
    str,
    Dict[
        str,
        Iterable[
            Union[
                str,
                TranslatableEntity,
                translation_models.EntityTranslationsModel,
            ]
        ],
    ],
]

# One element of the CoGroupByKey over an opportunity model ID, holding the
# recomputed model and the model already in the datastore.
GroupedOpportunityModels = Tuple[
    str,
    Dict[str, Iterable[opportunity_models.TranslationOpportunityModel]],
]


class BackfillTranslationOpportunityModelJobBase(base_jobs.JobBase):
    """Base class for jobs that backfill TranslationOpportunityModels for a
    single entity type.

    A subclass supplies the entity type and the pipeline that reads that
    entity's models. Everything from the opportunity model's field values
    onwards is shared, as is the audit variant of the run.
    """

    DATASTORE_UPDATES_ALLOWED = True

    # The entity type this job backfills. It both tags the models the job
    # writes and scopes the existing models it reads, so a job for one entity
    # type never treats another type's opportunities as orphans.
    ENTITY_TYPE: feconf.TranslatableEntityType

    # Prefix of this job's result strings. 'TRANSLATION OPPORTUNITY MODEL'
    # yields 'TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'.
    RESULT_LABEL_PREFIX: str

    # Reported when the grouped data has no domain object for the entity ID.
    MISSING_ENTITY_ERROR: str

    # Whether to count translatable metadata fields that are still behind a
    # feature flag. Explorations must count them so that the backfill does not
    # depend on the flag's state at run time; skills have no gated fields.
    OVERRIDE_METADATA_FEATURE_FLAG = False

    @classmethod
    def _create_translation_opportunity(
        cls, element: GroupedEntityData
    ) -> result.Result[opportunity_models.TranslationOpportunityModel, str]:
        """Creates a TranslationOpportunityModel from the grouped data."""
        entity_id = element[0]
        grouped_data = element[1]

        # Here we use cast because we are narrowing down the type of topic_ids.
        topic_ids = list(set(cast(Iterable[str], grouped_data['topic_ids'])))
        if not topic_ids:
            return result.Err('Missing topic_id')

        # Here we use cast because we are narrowing down the type of entities.
        entities = list(
            cast(Iterable[TranslatableEntity], grouped_data['entity'])
        )
        if not entities:
            return result.Err(cls.MISSING_ENTITY_ERROR)
        entity = entities[0]

        # Here we use cast because we are narrowing down the type of translations.
        translations = [
            t
            for t in cast(
                Iterable[translation_models.EntityTranslationsModel],
                grouped_data['translations'],
            )
            if t.entity_version == entity.version
        ]
        with datastore_services.get_ndb_context():
            content_count = entity.get_content_count(
                override_metadata_feature_flag=(
                    cls.OVERRIDE_METADATA_FEATURE_FLAG
                )
            )

            # The count has to come from the entity, the same way
            # translation_services.get_translation_counts computes it live.
            # A translation model can hold entries for content the entity no
            # longer has, or for content whose value is now empty, and neither
            # is part of content_count. Counting the model's entries directly
            # would let a stored count exceed content_count, which fails
            # TranslationOpportunity validation when the opportunity is read.
            translation_counts = {}
            for translation_model in translations:
                entity_translation = (
                    translation_fetchers.get_entity_translation_from_model(
                        translation_model
                    )
                )
                translation_counts[translation_model.language_code] = (
                    entity.get_translation_count(
                        entity_translation,
                        override_metadata_feature_flag=(
                            cls.OVERRIDE_METADATA_FEATURE_FLAG
                        ),
                    )
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
            if entity.language_code in incomplete_translation_language_codes:
                incomplete_translation_language_codes.remove(
                    entity.language_code
                )

            model = opportunity_models.TranslationOpportunityModel.create_new(
                entity_type=cls.ENTITY_TYPE.value,
                entity_id=entity_id,
                topic_ids=topic_ids,
                content_count=content_count,
                incomplete_translation_language_codes=(
                    incomplete_translation_language_codes
                ),
                translation_counts=translation_counts,
            )
            model.update_timestamps()
        return result.Ok(model)

    def _compute_translation_opportunities(
        self,
    ) -> beam.PCollection[
        result.Result[opportunity_models.TranslationOpportunityModel, str]
    ]:
        """Computes the new translation opportunity models from datastore.

        Raises:
            NotImplementedError. Needs to be overridden by a subclass.
        """
        raise NotImplementedError(
            'Subclasses must implement the '
            '_compute_translation_opportunities() method'
        )

    def _get_existing_opportunity_models(
        self,
    ) -> beam.PCollection[opportunity_models.TranslationOpportunityModel]:
        """Returns the opportunity models already in the datastore for this
        job's entity type.
        """
        return (
            self.pipeline
            | 'Get all TranslationOpportunityModels'
            >> ndb_io.GetModels(
                opportunity_models.TranslationOpportunityModel.get_all(
                    include_deleted=False
                )
            )
            # The entity type is passed as a side input rather than captured,
            # because a closure over self would drag the pipeline into the
            # pickled function.
            | 'Filter models of this entity type'
            >> beam.Filter(
                lambda model, entity_type: model.entity_type == entity_type,
                self.ENTITY_TYPE.value,
            )
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        created_models_results = self._compute_translation_opportunities()

        computed_opp_models_pcoll = (
            created_models_results
            | 'Filter OK results for cleanup'
            >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap models for cleanup' >> beam.Map(lambda res: res.unwrap())
        )

        computed_by_id = (
            computed_opp_models_pcoll
            | 'Map computed by id' >> beam.Map(lambda model: (model.id, model))
        )
        existing_by_id = (
            self._get_existing_opportunity_models()
            | 'Map existing by id' >> beam.Map(lambda model: (model.id, model))
        )

        grouped_opp_models = {
            'computed': computed_by_id,
            'existing': existing_by_id,
        } | 'Group opp models for deletion' >> beam.CoGroupByKey()

        def get_orphans(
            element: GroupedOpportunityModels,
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
                f'{self.RESULT_LABEL_PREFIX} CREATION'
            )
        )

        deletion_results = (
            orphans_pcoll
            | 'Generate deletion results'
            >> job_result_transforms.CountObjectsToJobRunResult(
                f'{self.RESULT_LABEL_PREFIX} DELETION'
            )
        )

        return (
            creation_results,
            deletion_results,
        ) | 'Flatten results' >> beam.Flatten()

    def _run_audit(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Recomputes the opportunity models and reports how they differ from
        the models already in the datastore, without writing anything.
        """
        created_models_results = self._compute_translation_opportunities()

        computed_opp_models_pcoll = (
            created_models_results
            | 'Filter OK results' >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap models' >> beam.Map(lambda res: res.unwrap())
            | 'Map computed models' >> beam.Map(lambda model: (model.id, model))
        )

        existing_opp_models_pcoll = (
            self._get_existing_opportunity_models()
            | 'Map existing models' >> beam.Map(lambda model: (model.id, model))
        )

        def compare_models(
            element: GroupedOpportunityModels,
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
                f'{self.RESULT_LABEL_PREFIX} CREATION'
            )
        )

        return (
            compare_results,
            summary_results,
        ) | 'Flatten results' >> beam.Flatten()


class BackfillExplorationTranslationOpportunityModelJob(
    BackfillTranslationOpportunityModelJobBase
):
    """Backfills TranslationOpportunityModels from existing ExplorationModels and StoryModels."""

    ENTITY_TYPE = feconf.TranslatableEntityType.EXPLORATION
    RESULT_LABEL_PREFIX = 'TRANSLATION OPPORTUNITY MODEL'
    MISSING_ENTITY_ERROR = 'Missing ExplorationModel'
    OVERRIDE_METADATA_FEATURE_FLAG = True

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
            'entity': exp_models_pcoll,
            'translations': entity_translations_pcoll,
        } | 'Group by exp_id' >> beam.CoGroupByKey()

        return grouped_data | 'Create TranslationOpportunityModels' >> beam.Map(
            self._create_translation_opportunity
        )


class AuditBackfillExplorationTranslationOpportunityModelJob(
    BackfillExplorationTranslationOpportunityModelJob
):
    """Audit job for BackfillExplorationTranslationOpportunityModelJob."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return self._run_audit()


class BackfillSkillOpportunityModelJob(
    BackfillTranslationOpportunityModelJobBase
):
    """Backfills TranslationOpportunityModels from existing SkillModels and TopicModels."""

    ENTITY_TYPE = feconf.TranslatableEntityType.SKILL
    RESULT_LABEL_PREFIX = 'SKILL TRANSLATION OPPORTUNITY MODEL'
    MISSING_ENTITY_ERROR = 'Missing SkillModel'

    def _compute_translation_opportunities(
        self,
    ) -> beam.PCollection[
        result.Result[opportunity_models.TranslationOpportunityModel, str]
    ]:
        """Computes the new skill translation opportunity models from datastore."""

        def extract_skill_topic_ids(
            topic: topic_domain.Topic,
        ) -> Iterable[Tuple[str, str]]:
            for skill_id in topic.get_all_skill_ids():
                yield (skill_id, topic.id)

        topic_skill_ids_pcoll = (
            self.pipeline
            | 'Get all TopicModels for skill opportunities'
            >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False)
            )
            | 'Get topic from model for skill opportunities'
            >> beam.Map(topic_fetchers.get_topic_from_model)
            | 'Extract skill_id and topic_id'
            >> beam.FlatMap(extract_skill_topic_ids)
        )

        skill_models_pcoll = (
            self.pipeline
            | 'Get all SkillModels'
            >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(include_deleted=False)
            )
            | 'Get skill from model'
            >> beam.Map(skill_fetchers.get_skill_from_model)
            | 'Map skill to skill_id'
            >> beam.Map(lambda skill: (skill.id, skill))
        )

        entity_translations_pcoll = (
            self.pipeline
            | 'Get all EntityTranslationsModels for skills'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter skill translations'
            >> beam.Filter(
                lambda model: model.entity_type
                == feconf.TranslatableEntityType.SKILL.value
            )
            | 'Map translation to skill_id'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        grouped_data = {
            'topic_ids': topic_skill_ids_pcoll,
            'entity': skill_models_pcoll,
            'translations': entity_translations_pcoll,
        } | 'Group by skill_id' >> beam.CoGroupByKey()

        return (
            grouped_data
            | 'Create Skill TranslationOpportunityModels'
            >> beam.Map(self._create_translation_opportunity)
        )


class AuditBackfillSkillOpportunityModelJob(BackfillSkillOpportunityModelJob):
    """Audit job for BackfillSkillOpportunityModelJob."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return self._run_audit()

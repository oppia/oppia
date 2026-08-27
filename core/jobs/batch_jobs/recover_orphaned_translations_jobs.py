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

"""Jobs that recover orphaned translations from old exploration versions.

Due to a historic bug (fixed in PR #24726), accepted translation
suggestions were sometimes written to an outdated exploration version's
EntityTranslationsModel instead of the current one. This job scans all
EntityTranslationsModel entries for explorations, finds translations
stuck on old versions, and forward-propagates them to the latest
version so they become visible again on the contributor dashboard.
"""

from __future__ import annotations

import collections

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Any, Dict, Iterable, List, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, translation_models

(exp_models, translation_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.TRANSLATION]
)
datastore_services = models.Registry.import_datastore_services()


class RecoverOrphanedTranslationsJob(base_jobs.JobBase):
    """Recovers orphaned translations by forward-propagating them to the
    latest exploration version.

    The job groups all EntityTranslationsModel entries by
    (entity_id, language_code), merges their translations dictionaries
    in ascending version order, and writes the merged result to the
    model for the current exploration version.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _merge_and_forward_propagate(
        element: Tuple[
            str,
            # Here we use type Any because the value could be an int (version) or
            # a list of translation models.
            Dict[str, Iterable[Any]],
        ],
    ) -> Iterable[Tuple[translation_models.EntityTranslationsModel, int]]:
        """Merges translations from old versions into the latest version.

        For a given exploration, this function groups all
        EntityTranslationsModel entries by language_code, sorts them by
        version in ascending order, and merges their translation
        dictionaries. Translations from newer versions take precedence
        over those from older versions when content_ids collide. The merged
        result is written to the model corresponding to the current
        exploration version.

        Args:
            element: tuple(str, dict). A tuple of
                (entity_id, {'exploration_version': [...],
                'translation_models': [...]}).

        Yields:
            tuple(EntityTranslationsModel, int). Tuples of
            (updated_or_new_model, number_of_translations_recovered)
            for models that were actually changed.
        """
        entity_id = element[0]
        grouped = element[1]

        exploration_versions = list(grouped['exploration_version'])
        translation_model_list: List[
            translation_models.EntityTranslationsModel
        ] = list(grouped['translation_models'])

        # If the exploration no longer exists, skip.
        if not exploration_versions:
            return

        current_version = exploration_versions[0]

        # Group translation models by language_code.
        lang_to_models: Dict[
            str,
            List[translation_models.EntityTranslationsModel],
        ] = collections.defaultdict(list)
        for t_model in translation_model_list:
            lang_to_models[t_model.language_code].append(t_model)

        for language_code, models_for_lang in lang_to_models.items():
            # Sort by entity_version ascending so newer overwrites older.
            models_for_lang.sort(key=lambda m: int(m.entity_version))

            # Merge all translations into a single dict.
            # Here we use type Any because the translation dictionary can contain
            # various nested structures depending on the content type.
            merged_translations: Dict[str, Any] = {}
            for t_model in models_for_lang:
                merged_translations.update(t_model.translations)

            # Find the model at the current version, if it exists.
            current_version_model = None
            for t_model in models_for_lang:
                if t_model.entity_version == current_version:
                    current_version_model = t_model
                    break

            if current_version_model is not None:
                # Check if the merged dict adds anything new.
                existing_translations = current_version_model.translations
                if merged_translations == existing_translations:
                    # Nothing new to add.
                    continue
                # Count only newly recovered translations.
                new_count = len(merged_translations) - len(
                    existing_translations
                )
                current_version_model.translations = merged_translations
                current_version_model.update_timestamps()
                yield (current_version_model, max(new_count, 0))
            else:
                # No model exists at the current version for this
                # language. Create a new one.
                with datastore_services.get_ndb_context():
                    new_model = (
                        translation_models.EntityTranslationsModel.create_new(
                            'exploration',
                            entity_id,
                            current_version,
                            language_code,
                            merged_translations,
                        )
                    )
                    new_model.update_timestamps()
                    yield (new_model, len(merged_translations))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the recovery job.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        exploration_versions = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Key explorations by ID'
            >> beam.Map(lambda model: (model.id, model.version))
        )

        translation_models_pcoll = (
            self.pipeline
            | 'Get all Exploration EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.query(
                    translation_models.EntityTranslationsModel.entity_type
                    == 'exploration'
                )
            )
            | 'Key translations by entity_id'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        grouped = {
            'exploration_version': exploration_versions,
            'translation_models': translation_models_pcoll,
        } | 'Group by exploration ID' >> beam.CoGroupByKey()

        model_and_count_pairs = (
            grouped
            | 'Merge and forward-propagate translations'
            >> beam.FlatMap(self._merge_and_forward_propagate)
        )

        updated_models = model_and_count_pairs | 'Extract models' >> beam.Map(
            lambda pair: pair[0]
        )

        recovered_counts = model_and_count_pairs | 'Extract counts' >> beam.Map(
            lambda pair: pair[1]
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_result = (
                updated_models
                | 'Put updated models into the datastore' >> ndb_io.PutModels()
            )

        models_updated_job_run_results = (
            updated_models
            | 'Count updated models'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'TRANSLATION MODELS UPDATED'
            )
        )

        translations_recovered_job_run_results = (
            recovered_counts
            | 'Sum recovered counts' >> beam.CombineGlobally(sum)
            | 'Filter zero sums' >> beam.Filter(lambda x: x > 0)
            | 'Report recovered translations'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS RECOVERED SUCCESS: %s' % count
                )
            )
        )

        explorations_traversed_job_run_results = (
            exploration_versions
            | 'Count explorations traversed'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'EXPLORATIONS TRAVERSED'
            )
        )

        return (
            models_updated_job_run_results,
            translations_recovered_job_run_results,
            explorations_traversed_job_run_results,
        ) | 'Flatten results' >> beam.Flatten()


class AuditRecoverOrphanedTranslationsJob(RecoverOrphanedTranslationsJob):
    """Audit version of RecoverOrphanedTranslationsJob.

    This job performs all the same steps as the recovery job, but does
    not write any changes to the datastore. Use this to preview the
    impact of the recovery before running the actual job.
    """

    DATASTORE_UPDATES_ALLOWED = False

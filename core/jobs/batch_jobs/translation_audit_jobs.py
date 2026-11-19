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

"""Beam jobs for auditing translations."""

from __future__ import annotations

from core import feconf
from core.domain import html_validation_service, translation_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
from typing import Dict, Iterable, Iterator, List, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models, translation_models

(opportunity_models, translation_models) = models.Registry.import_models(
    [
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
    ]
)


class ValidateExplorationOpportunityCountsJob(base_jobs.JobBase):
    """Job that validates translation_counts in
    ExplorationOpportunitySummaryModel.

    This job computes the true translation counts by looking at
    EntityTranslationsModel and compares it to the translation_counts
    recorded in ExplorationOpportunitySummaryModel. It returns SUCCESS
    if all counts match, and logs the mismatches otherwise.
    """

    def _get_translation_counts(
        self, translation_model: translation_models.EntityTranslationsModel
    ) -> Tuple[str, Tuple[str, int]]:
        """Extracts translation counts from an EntityTranslationsModel.

        Args:
            translation_model: EntityTranslationsModel. The model
                to extract counts from.

        Returns:
            tuple(str, tuple(str, int)). A tuple of
            (exploration_id, (language_code, translation_count)).
        """
        translation_count = len(translation_model.translations)
        return (
            translation_model.entity_id,
            (translation_model.language_code, translation_count),
        )

    def _validate_counts(
        self,
        exploration_id: str,
        opportunity_summary_models_list: Iterable[
            opportunity_models.ExplorationOpportunitySummaryModel
        ],
        translation_counts_list: Iterable[Tuple[str, int]],
    ) -> Iterable[job_run_result.JobRunResult]:
        """Validates the translation counts for a given exploration.

        Args:
            exploration_id: str. The exploration ID.
            opportunity_summary_models_list:
                list(ExplorationOpportunitySummaryModel). The list
                of opportunity summary models for the exploration.
            translation_counts_list: list(tuple(str, int)). True
                counts from EntityTranslationsModel.

        Yields:
            JobRunResult. Results detailing whether counts match or
            describing the mismatches.
        """
        summary_models = list(opportunity_summary_models_list)
        actual_translations = list(translation_counts_list)

        if not summary_models:
            return

        summary_model = summary_models[0]
        stored_translation_counts = summary_model.translation_counts

        actual_translation_counts_dict: Dict[str, int] = {}
        for language_code, count in actual_translations:
            actual_translation_counts_dict[language_code] = count

        mismatch_found = False

        for lang_code, stored_count in stored_translation_counts.items():
            actual_count = actual_translation_counts_dict.get(lang_code, 0)
            if stored_count != actual_count:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in %s: '
                    'stored=%s, actual=%s'
                    % (exploration_id, lang_code, stored_count, actual_count)
                )

        for lang_code, actual_count in actual_translation_counts_dict.items():
            if lang_code not in stored_translation_counts and actual_count > 0:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in %s: '
                    'stored=0 (missing), actual=%s'
                    % (exploration_id, lang_code, actual_count)
                )

        if not mismatch_found:
            yield job_run_result.JobRunResult.as_stdout(
                'SUCCESS - Exploration %s counts are valid.' % exploration_id
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the translation
        count validation.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        opportunity_summaries = (
            self.pipeline
            | 'Get all ExplorationOpportunitySummaryModels'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all()
            )
            | 'Key Opportunity by exploration_id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id
            )
        )

        translation_counts = (
            self.pipeline
            | 'Get all Exploration EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.query(
                    translation_models.EntityTranslationsModel.entity_type
                    == 'exploration'
                )
            )
            | 'Extract translation counts'
            >> beam.Map(self._get_translation_counts)
        )

        grouped_data = {
            'opportunity_summary': opportunity_summaries,
            'translation_counts': translation_counts,
        } | 'Group by exploration_id' >> beam.CoGroupByKey()

        return grouped_data | 'Process and Validate Counts' >> beam.FlatMap(
            lambda kv: self._validate_counts(
                exploration_id=kv[0],
                opportunity_summary_models_list=(kv[1]['opportunity_summary']),
                translation_counts_list=kv[1]['translation_counts'],
            )
        )


# Tags that the learner facing RTE output display can render: the standard
# HTML tags in the CKEditor RTE content spec, the tags of all registered RTE
# components (the spec does not list all of them e.g.
# oppia-noninteractive-skillreview) and h1 and span which the output display
# also renders. The output display silently drops any other tag along with all
# of its content.
ALLOWED_HTML_TAGS = frozenset(
    feconf.RTE_CONTENT_SPEC['RTE_TYPE_CKEDITOR']['ALLOWED_TAG_LIST']
    + html_validation_service.INLINE_COMPONENT_TAG_NAMES
    + html_validation_service.BLOCK_COMPONENT_TAG_NAMES
    + ['h1', 'span']
)

# The (entity type, entity ID, entity version) that an EntityTranslationsModel
# belongs to.
EntityVersionKey = Tuple[str, str, int]

# The language code of an EntityTranslationsModel and the invalid HTML tags in
# its translations, keyed by content ID.
LanguageAndInvalidTags = Tuple[str, Dict[str, List[str]]]


def get_invalid_html_tags(html_string: str) -> List[str]:
    """Returns the tags in the given HTML string that the RTE output display
    cannot render.

    Args:
        html_string: str. The HTML string to check.

    Returns:
        list(str). The sorted names of the invalid tags.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    return sorted(
        {
            tag.name
            for tag in soup.find_all()
            if tag.name not in ALLOWED_HTML_TAGS
        }
    )


def _get_invalid_html_tags_by_content_id(
    translations: Dict[str, feconf.TranslatedContentDict],
) -> Dict[str, List[str]]:
    """Returns the invalid HTML tags in each HTML translation.

    Args:
        translations: dict(str, TranslatedContentDict). The translations of
            an EntityTranslationsModel, keyed by content ID.

    Returns:
        dict(str, list(str)). The invalid tags keyed by the content ID of the
        translation they appear in. Translations without invalid tags are
        omitted.
    """
    invalid_tags_by_content_id: Dict[str, List[str]] = {}
    for content_id, translated_content in translations.items():
        if (
            translated_content['content_format']
            != translation_domain.TranslatableContentFormat.HTML.value
        ):
            continue
        content_value = translated_content['content_value']
        assert isinstance(content_value, str)
        invalid_tags = get_invalid_html_tags(content_value)
        if invalid_tags:
            invalid_tags_by_content_id[content_id] = invalid_tags
    return invalid_tags_by_content_id


def _get_keyed_invalid_translations(
    model: translation_models.EntityTranslationsModel,
) -> Iterator[Tuple[EntityVersionKey, LanguageAndInvalidTags]]:
    """Yields the language code and invalid HTML tags of the model, keyed by
    its entity and version, if any of its HTML translations contain invalid
    tags. Only these fields are kept so that the translations themselves are
    not passed on to later steps.

    Args:
        model: EntityTranslationsModel. The model to check.

    Yields:
        tuple(tuple(str, str, int), tuple(str, dict(str, list(str)))). The
        (entity type, entity ID, entity version) key, and the language code
        with the invalid tags keyed by content ID.
    """
    invalid_tags_by_content_id = _get_invalid_html_tags_by_content_id(
        model.translations
    )
    if invalid_tags_by_content_id:
        yield (
            (model.entity_type, model.entity_id, model.entity_version),
            (model.language_code, invalid_tags_by_content_id),
        )


def _get_invalid_translation_report(
    entity_version_key: EntityVersionKey,
    language_and_invalid_tags: LanguageAndInvalidTags,
) -> job_run_result.JobRunResult:
    """Returns the report of the invalid HTML tags in the translations of an
    entity version in one language.

    Args:
        entity_version_key: tuple(str, str, int). The (entity type, entity ID,
            entity version) of the translations.
        language_and_invalid_tags: tuple(str, dict(str, list(str))). The
            language code of the translations and their invalid tags keyed by
            content ID.

    Returns:
        JobRunResult. The stderr report listing the invalid tags of each
        translation.
    """
    entity_type, entity_id, entity_version = entity_version_key
    language_code, invalid_tags_by_content_id = language_and_invalid_tags
    return job_run_result.JobRunResult.as_stderr(
        'Invalid HTML tags in %s %s version %s (%s): %s'
        % (
            entity_type,
            entity_id,
            entity_version,
            language_code,
            '; '.join(
                '%s: %s' % (content_id, ', '.join(tags))
                for content_id, tags in sorted(
                    invalid_tags_by_content_id.items()
                )
            ),
        )
    )


def _get_entity_key(
    entity_version_key: EntityVersionKey,
    unused_language_and_invalid_tags: LanguageAndInvalidTags,
) -> Tuple[str, str]:
    """Returns the (entity type, entity ID) of the given entity version.

    Args:
        entity_version_key: tuple(str, str, int). The (entity type, entity ID,
            entity version) of the translations.
        unused_language_and_invalid_tags: tuple(str, dict(str, list(str))).
            The language code and invalid tags of the translations.

    Returns:
        tuple(str, str). The (entity type, entity ID).
    """
    entity_type, entity_id, _ = entity_version_key
    return (entity_type, entity_id)


def _get_invalid_tags(
    unused_entity_version_key: EntityVersionKey,
    language_and_invalid_tags: LanguageAndInvalidTags,
) -> List[str]:
    """Returns the invalid HTML tags of each translation, with one entry per
    translation that contains the tag.

    Args:
        unused_entity_version_key: tuple(str, str, int). The (entity type,
            entity ID, entity version) of the translations.
        language_and_invalid_tags: tuple(str, dict(str, list(str))). The
            language code of the translations and their invalid tags keyed by
            content ID.

    Returns:
        list(str). The invalid tags of all the translations.
    """
    _, invalid_tags_by_content_id = language_and_invalid_tags
    return [tag for tags in invalid_tags_by_content_id.values() for tag in tags]


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class GetLatestInvalidHtmlTranslations(beam.PTransform):  # type: ignore[misc]
    """Finds the EntityTranslationsModels of the latest version of each entity
    whose HTML translations contain tags that the RTE output display cannot
    render. Older versions are skipped because learners are only shown the
    latest version.
    """

    def expand(
        self,
        entity_translations_models: beam.PCollection[
            translation_models.EntityTranslationsModel
        ],
    ) -> beam.PCollection[Tuple[EntityVersionKey, LanguageAndInvalidTags]]:
        """Returns the invalid HTML tags of the latest version models that have
        translations with invalid HTML tags.

        Args:
            entity_translations_models: PCollection. The
                EntityTranslationsModels to check.

        Returns:
            PCollection. Tuples of ((entity type, entity ID, entity version),
            (language code, invalid tags keyed by content ID)) for each
            latest-version model with at least one invalid tag.
        """
        latest_entity_versions = (
            entity_translations_models
            | 'Get version of each entity'
            >> beam.Map(
                lambda model: (
                    (model.entity_type, model.entity_id),
                    model.entity_version,
                )
            )
            | 'Get latest version of each entity' >> beam.CombinePerKey(max)
            | 'Key latest versions by entity and version'
            >> beam.MapTuple(
                lambda entity, version: ((entity[0], entity[1], version), True)
            )
        )

        invalid_translations_by_entity_version = (
            entity_translations_models
            | 'Get invalid translations keyed by entity and version'
            >> beam.FlatMap(_get_keyed_invalid_translations)
        )

        return (
            {
                'is_latest_version': latest_entity_versions,
                'invalid_translations': invalid_translations_by_entity_version,
            }
            | 'Group invalid translations with latest versions'
            >> beam.CoGroupByKey()
            | 'Keep invalid translations of latest versions'
            >> beam.FlatMap(
                lambda grouped: (
                    [
                        (grouped[0], language_and_invalid_tags)
                        for language_and_invalid_tags in grouped[1][
                            'invalid_translations'
                        ]
                    ]
                    if list(grouped[1]['is_latest_version'])
                    else []
                )
            )
        )


class AuditInvalidHtmlTagsInTranslationsJob(base_jobs.JobBase):
    """Reports translations of the latest version of each entity that contain
    tags that the RTE output display cannot render. The output
    display drops these tags along with their content so learners see
    blank cards.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results listing the translations that
        contain invalid HTML tags, along with summary counts.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        all_translation_models = (
            self.pipeline
            | 'Get all EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all()
            )
        )

        scanned_models_count = (
            all_translation_models
            | 'Count scanned models' >> beam.combiners.Count.Globally()
            | 'Report count of scanned models'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS SCANNED: %s' % count
                )
            )
        )

        invalid_translations = (
            all_translation_models
            | 'Get latest translations with invalid HTML tags'
            >> GetLatestInvalidHtmlTranslations()
        )

        invalid_translation_reports = (
            invalid_translations
            | 'Report translations with invalid HTML tags'
            >> beam.MapTuple(_get_invalid_translation_report)
        )

        invalid_translation_models_count = (
            invalid_translations
            | 'Count models with invalid HTML tags'
            >> beam.combiners.Count.Globally()
            | 'Report count of models with invalid HTML tags'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'TRANSLATION MODELS WITH INVALID HTML TAGS: %s' % count
                )
            )
        )

        affected_entities_count = (
            invalid_translations
            | 'Get affected entities' >> beam.MapTuple(_get_entity_key)
            | 'Deduplicate affected entities'
            >> beam.Distinct()  # pylint: disable=no-value-for-parameter
            | 'Count affected entities' >> beam.combiners.Count.Globally()
            | 'Report count of affected entities'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'ENTITIES WITH INVALID HTML TAGS IN TRANSLATIONS: %s'
                    % count
                )
            )
        )

        invalid_tag_counts = (
            invalid_translations
            | 'Get invalid tags of each translation'
            >> beam.FlatMapTuple(_get_invalid_tags)
            | 'Count translations per invalid tag'
            >> beam.combiners.Count.PerElement()
            | 'Report count of translations per invalid tag'
            >> beam.MapTuple(
                lambda tag, count: job_run_result.JobRunResult.as_stdout(
                    'TRANSLATIONS CONTAINING <%s>: %s' % (tag, count)
                )
            )
        )

        return (
            scanned_models_count,
            invalid_translation_reports,
            invalid_translation_models_count,
            affected_entities_count,
            invalid_tag_counts,
        ) | 'Combine results' >> beam.Flatten()

# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Stats generation jobs for contributor admin dashboard."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import exp_domain
from core.domain import html_cleaner
from core.domain import opportunity_domain
from core.domain import opportunity_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import translation_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

import result

from typing import (
    Dict, Iterable, Iterator, List, Optional, Set, Tuple, TypedDict, Union)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(opportunity_models, suggestion_models) = models.Registry.import_models([
    models.Names.OPPORTUNITY, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class GenerateContributorAdminStats(base_jobs.JobBase):
    """Job that populates model with stats used in contributor admin
    dashboard
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Generates the stats for contributor admin dashboard.

        Returns:
            PCollection. A PCollection of 'SUCCESS x' results, where x is
            the number of generated stats..
        """
        translation_contribution_total_stats_models = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False))
            | 'TransformStats' >> beam.Map(self.transform_stats)
            | 'GroupByLanguageAndContributor' >> beam.GroupByKey()
            | 'SumFields' >> beam.Map(lambda key, stats: {
                'language_code': key[0],
                'contributor_id': key[1],
                'topic_ids_with_translation_submissions': list(set(topic for stat in stats for topic in stat['topic_ids_with_translation_submissions'])),
                'recent_review_outcomes': [],
                'recent_performance':
                    sum(stat['recent_performance'] for stat in stats),
                'overall_accuracy':
                    sum(stat['overall_accuracy'] for stat in stats),
                'submitted_translations_count':
                    sum(stat['submitted_translations_count'] for stat in stats),
                'submitted_translation_word_count':
                    sum(stat['submitted_translation_word_count'] for stat in stats),
                'accepted_translations_count':
                    sum(stat['accepted_translations_count'] for stat in stats),
                'accepted_translations_without_reviewer_edits_count':
                    sum(stat['accepted_translations_without_reviewer_edits_count'] for stat in stats),
                'accepted_translation_word_count':
                    sum(stat['accepted_translation_word_count'] for stat in stats),
                'rejected_translations_count':
                    sum(stat['rejected_translations_count'] for stat in stats),
                'rejected_translation_word_count':
                    sum(stat['rejected_translation_word_count'] for stat in stats),
                'first_contribution_date':
                    min(stat['first_contribution_date'] for stat in stats),
                'last_contribution_date':
                    max(stat['last_contribution_date'] for stat in stats)
            })
        )

        non_deleted_translation_review_models = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.TranslationReviewStatsModel.get_all(
                    include_deleted=False))
            | 'Map to new keys' >> beam.Map(
                lambda model: (
                    (model.language_code, model.reviewer_user_id), model)
            )
            | 'Group by new keys' >> beam.GroupByKey()
        )

        non_deleted_question_contribution_models = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False))
            | 'Map to new keys' >> beam.Map(
                lambda model: (
                    (model.language_code, model.contributor_user_id), model)
            )
            | 'Group by new keys' >> beam.GroupByKey()
        )

        non_deleted_question_review_models = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.QuestionReviewStatsModel.get_all(
                    include_deleted=False))
            | 'Map to new keys' >> beam.Map(
                lambda model: (
                    (model.language_code, model.reviewer_user_id), model)
            )
            | 'Group by new keys' >> beam.GroupByKey()
        )

        last_100_general_suggestions_model = (
            self.pipeline
            | 'Get last 100 GeneralSuggestionModel' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.query()
                .filter(
                    datastore_services.all_of(
                        suggestion_models.GeneralSuggestionModel.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                        suggestion_models.GeneralSuggestionModel.status == suggestion_models.STATUS_REJECTED,
                        suggestion_models.GeneralSuggestionModel.status == suggestion_models.STATUS_ACCEPTED
                    ))
                .order(-suggestion_models.GeneralSuggestionModel.created_on)
                .fetch(100))
            | 'Group submitted suggestions by target' >> (
                beam.GroupBy(lambda m: m.target_id))
        )

    @staticmethod
    def transform_stats(stats):
        (
        language_code,
        contributor_user_id,
        topic_id,
        submitted_translations_count,
        submitted_translation_word_count,
        accepted_translations_count,
        accepted_translations_without_reviewer_edits_count,
        accepted_translation_word_count,
        rejected_translations_count,
        rejected_translation_word_count,
        contribution_dates) = stats

        topic_ids_with_translation_submissions = [topic_id]
        recent_review_outcomes = []
        recent_performance = 0
        overall_accuracy = 0.0

        return (
            (language_code, contributor_user_id),
            {
                'language_code': language_code,
                'contributor_id': contributor_user_id,
                'topic_ids_with_translation_submissions':
                    topic_ids_with_translation_submissions,
                'recent_review_outcomes': recent_review_outcomes,
                'recent_performance': recent_performance,
                'overall_accuracy': overall_accuracy,
                'submitted_translations_count': submitted_translations_count,
                'submitted_translation_word_count':
                    submitted_translation_word_count,
                'accepted_translations_count': accepted_translations_count,
                'accepted_translations_without_reviewer_edits_count':
                    accepted_translations_without_reviewer_edits_count,
                'accepted_translation_word_count':
                    accepted_translation_word_count,
                'rejected_translations_count': rejected_translations_count,
                'rejected_translation_word_count':
                    rejected_translation_word_count,
                'first_contribution_date': min(contribution_dates),
                'last_contribution_date': max(contribution_dates)
            }
        )

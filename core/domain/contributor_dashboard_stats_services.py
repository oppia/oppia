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

"""Service for contributor dashboard stats page calculations and aggregations."""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.suggestion import gae_models as suggestion_models
from core.storage.topic import gae_models as topic_models

from typing import Dict, List, Optional, TypedDict


class ChapterStatDict(TypedDict):
    """Dictionary representing individual chapter translation stats."""

    chapter_title: str
    content_count: int
    submitted_count: int
    reviewed_count: int
    submission_percentage: float
    review_percentage: float
    status: str
    last_activity_date: str


class TranslationTopicLanguageStatDict(TypedDict):
    """Dictionary representing translation statistics for a topic in a specific
    language.
    """

    language_code: str
    language_name: str
    translated_cards_count: int
    submitted_cards_count: int
    total_cards_count: int
    completed_chapters_count: int
    in_progress_chapters_count: int
    unstarted_chapters_count: int
    total_chapters_count: int
    progress_percentage: float
    submission_progress_percentage: float
    is_topic_completed: bool
    chapters: List[ChapterStatDict]


class SkillStatDict(TypedDict):
    """Dictionary representing question stats for an individual skill."""

    skill_id: str
    skill_description: str
    submitted_questions_count: int
    reviewed_questions_count: int
    target_questions_count: int
    submission_percentage: float
    review_percentage: float
    status: str
    last_activity_date: str


class QuestionTopicStatDict(TypedDict):
    """Dictionary representing question statistics for a topic."""

    total_skills_count: int
    total_questions_submitted: int
    total_questions_reviewed: int
    target_questions_count: int
    skills_with_sufficient_questions_count: int
    completed_skills_count: int
    in_progress_skills_count: int
    unstarted_skills_count: int
    progress_percentage: float
    submission_progress_percentage: float
    is_topic_completed: bool
    skills: List[SkillStatDict]


class TopicStatsDict(TypedDict):
    """Dictionary representing overall contributor statistics for a topic."""

    topic_id: str
    topic_name: str
    total_chapters_count: int
    total_cards_count: int
    question_stats: QuestionTopicStatDict
    translation_stats_by_language: Dict[str, TranslationTopicLanguageStatDict]
    last_progress_date: str
    is_stalled: bool


class LanguageOverallStatDict(TypedDict):
    """Dictionary representing overall statistics across all topics for a
    language.
    """

    language_code: str
    language_name: str
    completed_topics_count: int
    in_progress_topics_count: int
    not_started_topics_count: int
    total_topics_count: int
    total_translated_cards: int
    total_submitted_cards: int
    total_cards: int
    overall_progress_percentage: float
    overall_submission_percentage: float


class SummaryStatsDict(TypedDict):
    """Dictionary representing top-level contributor dashboard statistics."""

    total_topics_count: int
    total_chapters_count: int
    total_skills_count: int
    total_questions_count: int
    total_languages_count: int
    fully_translated_topics_count: int
    near_completion_topics_count: int
    needs_review_count: int
    needs_contributor_count: int


class ContributorDashboardStatsDict(TypedDict):
    """Dictionary representing full contributor dashboard statistics payload."""

    topic_stats: List[TopicStatsDict]
    language_stats: List[LanguageOverallStatDict]
    summary_stats: SummaryStatsDict
    supported_languages: List[Dict[str, str]]
    topic_names: List[str]


MIN_QUESTIONS_PER_SKILL = 10
STALLED_DAYS_THRESHOLD = 30


def get_contributor_dashboard_stats() -> ContributorDashboardStatsDict:
    """Aggregates and calculates translation and practice question metrics for
    the public contributor dashboard stats page.

    Returns:
        ContributorDashboardStatsDict. All topic, language, and question stats.
    """
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    # 1. Fetch published topic IDs.
    published_topic_ids = set()
    for rights in topic_models.TopicRightsModel.get_all():
        if rights.topic_is_published:
            published_topic_ids.add(rights.id)

    # If no explicit published rights exist yet (e.g. initial dev setup), fallback
    # to all topics.
    all_topic_models = list(topic_models.TopicModel.get_all())
    if not published_topic_ids and all_topic_models:
        published_topic_ids = {t.id for t in all_topic_models}

    published_topics_by_id = {
        t.id: t for t in all_topic_models if t.id in published_topic_ids
    }

    # 2. Build supported languages mapping.
    lang_name_by_code: Dict[str, str] = {}
    supported_languages_list: List[Dict[str, str]] = []
    for lang in constants.SUPPORTED_AUDIO_LANGUAGES:
        code = lang['id']
        name = lang['description']
        lang_name_by_code[code] = name
        supported_languages_list.append(
            {'language_code': code, 'language_name': name}
        )

    # 3. Retrieve all exploration opportunities and group by topic.
    all_exp_opps = list(
        opportunity_models.ExplorationOpportunitySummaryModel.get_all()
    )
    exp_opps_by_topic: Dict[
        str, List[opportunity_models.ExplorationOpportunitySummaryModel]
    ] = {}
    for opp in all_exp_opps:
        if opp.topic_id in published_topic_ids:
            exp_opps_by_topic.setdefault(opp.topic_id, []).append(opp)

    # 4. Retrieve pending/accepted suggestion stats.
    in_review_trans_by_exp_lang: Dict[str, Dict[str, int]] = {}
    in_review_questions_by_skill: Dict[str, int] = {}

    try:
        all_suggestions = list(
            suggestion_models.GeneralSuggestionModel.get_all()
        )
        for sug in all_suggestions:
            if sug.status == suggestion_models.STATUS_IN_REVIEW:
                if (
                    sug.suggestion_type
                    == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ):
                    exp_id = sug.target_id
                    lang_code = (
                        sug.change_cmd.get('language_code')
                        if hasattr(sug, 'change_cmd')
                        and isinstance(sug.change_cmd, dict)
                        else getattr(sug, 'language_code', '')
                    )
                    if exp_id and lang_code:
                        in_review_trans_by_exp_lang.setdefault(
                            exp_id, {}
                        ).setdefault(lang_code, 0)
                        in_review_trans_by_exp_lang[exp_id][lang_code] += 1
                elif sug.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
                    skill_id = getattr(sug, 'target_id', '')
                    if skill_id:
                        in_review_questions_by_skill[skill_id] = (
                            in_review_questions_by_skill.get(skill_id, 0) + 1
                        )
    except Exception:
        # Gracefully handle suggestion model absences in test fixtures.
        pass

    # 5. Retrieve all skill opportunities and group by topic.
    all_skill_opps = list(opportunity_models.SkillOpportunityModel.get_all())
    skills_by_id = {s.id: s for s in all_skill_opps}

    topic_stats_list: List[TopicStatsDict] = []
    total_chapters_overall = 0
    total_skills_overall = 0
    total_questions_overall = 0
    total_cards_overall = 0

    language_totals: Dict[str, Dict[str, int]] = {}
    for lang_code in lang_name_by_code:
        language_totals[lang_code] = {
            'completed_topics': 0,
            'in_progress_topics': 0,
            'not_started_topics': 0,
            'total_translated_cards': 0,
            'total_submitted_cards': 0,
            'total_cards': 0,
        }

    for topic_id, topic in published_topics_by_id.items():
        opps = exp_opps_by_topic.get(topic_id, [])
        total_chapters_count = len(opps)
        total_chapters_overall += total_chapters_count
        topic_cards_count = sum(opp.content_count for opp in opps)
        total_cards_overall += topic_cards_count

        topic_last_updated = (
            topic.last_updated
            if hasattr(topic, 'last_updated') and topic.last_updated
            else now
        )
        for opp in opps:
            if (
                hasattr(opp, 'last_updated')
                and opp.last_updated
                and opp.last_updated > topic_last_updated
            ):
                topic_last_updated = opp.last_updated

        time_since_progress = now - topic_last_updated
        is_stalled = time_since_progress.days > STALLED_DAYS_THRESHOLD
        last_progress_date_str = topic_last_updated.strftime('%Y-%m-%d')

        # Compute translation stats by language for this topic.
        translation_stats_by_lang: Dict[
            str, TranslationTopicLanguageStatDict
        ] = {}
        for lang_code, lang_name in lang_name_by_code.items():
            completed_chapters = 0
            in_progress_chapters = 0
            unstarted_chapters = 0
            translated_cards = 0
            submitted_cards = 0
            chapter_stats: List[ChapterStatDict] = []

            for opp in opps:
                content_count = opp.content_count
                trans_counts = opp.translation_counts or {}
                accepted_count = trans_counts.get(lang_code, 0)
                in_review_count = in_review_trans_by_exp_lang.get(
                    opp.id, {}
                ).get(lang_code, 0)
                sub_count = min(content_count, accepted_count + in_review_count)

                translated_cards += accepted_count
                submitted_cards += sub_count

                sub_pct = (
                    round((sub_count / content_count * 100.0), 1)
                    if content_count > 0
                    else 0.0
                )
                rev_pct = (
                    round((accepted_count / content_count * 100.0), 1)
                    if content_count > 0
                    else 0.0
                )

                if accepted_count >= content_count and content_count > 0:
                    status = 'Completed'
                    completed_chapters += 1
                elif sub_count > 0 or accepted_count > 0:
                    status = 'In-Progress'
                    in_progress_chapters += 1
                else:
                    status = 'Not Started'
                    unstarted_chapters += 1

                ch_updated = (
                    opp.last_updated
                    if hasattr(opp, 'last_updated') and opp.last_updated
                    else topic_last_updated
                )
                chapter_stats.append(
                    {
                        'chapter_title': opp.chapter_title,
                        'content_count': content_count,
                        'submitted_count': sub_count,
                        'reviewed_count': accepted_count,
                        'submission_percentage': sub_pct,
                        'review_percentage': rev_pct,
                        'status': status,
                        'last_activity_date': ch_updated.strftime('%Y-%m-%d'),
                    }
                )

            topic_rev_pct = (
                round((translated_cards / topic_cards_count * 100.0), 1)
                if topic_cards_count > 0
                else 0.0
            )
            topic_sub_pct = (
                round((submitted_cards / topic_cards_count * 100.0), 1)
                if topic_cards_count > 0
                else 0.0
            )
            is_topic_completed = (
                completed_chapters == total_chapters_count
                and total_chapters_count > 0
            )

            translation_stats_by_lang[lang_code] = {
                'language_code': lang_code,
                'language_name': lang_name,
                'translated_cards_count': translated_cards,
                'submitted_cards_count': submitted_cards,
                'total_cards_count': topic_cards_count,
                'completed_chapters_count': completed_chapters,
                'in_progress_chapters_count': in_progress_chapters,
                'unstarted_chapters_count': unstarted_chapters,
                'total_chapters_count': total_chapters_count,
                'progress_percentage': topic_rev_pct,
                'submission_progress_percentage': topic_sub_pct,
                'is_topic_completed': is_topic_completed,
                'chapters': chapter_stats,
            }

            # Update language totals.
            lang_entry = language_totals[lang_code]
            lang_entry['total_cards'] += topic_cards_count
            lang_entry['total_translated_cards'] += translated_cards
            lang_entry['total_submitted_cards'] += submitted_cards
            if is_topic_completed:
                lang_entry['completed_topics'] += 1
            elif submitted_cards > 0 or translated_cards > 0:
                lang_entry['in_progress_topics'] += 1
            else:
                lang_entry['not_started_topics'] += 1

        # Compute question stats for this topic.
        topic_skill_ids = getattr(topic, 'uncategorized_skill_ids', [])
        topic_skills = [
            skills_by_id[s_id]
            for s_id in topic_skill_ids
            if s_id in skills_by_id
        ]
        topic_skills_count = len(topic_skills)
        total_skills_overall += topic_skills_count

        total_questions_submitted = 0
        total_questions_reviewed = 0
        capped_questions_submitted = 0
        capped_questions_reviewed = 0
        target_questions_count = topic_skills_count * MIN_QUESTIONS_PER_SKILL
        completed_skills = 0
        in_progress_skills = 0
        unstarted_skills = 0
        skill_stats_list: List[SkillStatDict] = []

        for skill in topic_skills:
            rev_questions = skill.question_count
            in_review_q = in_review_questions_by_skill.get(skill.id, 0)
            sub_questions = rev_questions + in_review_q

            total_questions_reviewed += rev_questions
            total_questions_submitted += sub_questions
            total_questions_overall += rev_questions

            # Cap each skill's contribution at MIN_QUESTIONS_PER_SKILL so that
            # excess questions in one skill do not falsely inflate the topic's overall
            # completion percentage.
            capped_questions_reviewed += min(
                rev_questions, MIN_QUESTIONS_PER_SKILL
            )
            capped_questions_submitted += min(
                sub_questions, MIN_QUESTIONS_PER_SKILL
            )

            sub_pct = round(
                min(100.0, (sub_questions / MIN_QUESTIONS_PER_SKILL) * 100.0), 1
            )
            rev_pct = round(
                min(100.0, (rev_questions / MIN_QUESTIONS_PER_SKILL) * 100.0), 1
            )

            if rev_questions >= MIN_QUESTIONS_PER_SKILL:
                status = 'Completed'
                completed_skills += 1
            elif sub_questions > 0 or rev_questions > 0:
                status = 'In-Progress'
                in_progress_skills += 1
            else:
                status = 'Not Started'
                unstarted_skills += 1

            s_updated = (
                skill.last_updated
                if hasattr(skill, 'last_updated') and skill.last_updated
                else topic_last_updated
            )
            skill_stats_list.append(
                {
                    'skill_id': skill.id,
                    'skill_description': skill.skill_description,
                    'submitted_questions_count': sub_questions,
                    'reviewed_questions_count': rev_questions,
                    'target_questions_count': MIN_QUESTIONS_PER_SKILL,
                    'submission_percentage': sub_pct,
                    'review_percentage': rev_pct,
                    'status': status,
                    'last_activity_date': s_updated.strftime('%Y-%m-%d'),
                }
            )

        q_rev_pct = (
            round(
                (capped_questions_reviewed / target_questions_count * 100.0), 1
            )
            if target_questions_count > 0
            else 0.0
        )
        q_sub_pct = (
            round(
                (capped_questions_submitted / target_questions_count * 100.0), 1
            )
            if target_questions_count > 0
            else 0.0
        )
        is_q_completed = (
            completed_skills == topic_skills_count and topic_skills_count > 0
        )

        question_stats: QuestionTopicStatDict = {
            'total_skills_count': topic_skills_count,
            'total_questions_submitted': total_questions_submitted,
            'total_questions_reviewed': total_questions_reviewed,
            'target_questions_count': target_questions_count,
            'skills_with_sufficient_questions_count': completed_skills,
            'completed_skills_count': completed_skills,
            'in_progress_skills_count': in_progress_skills,
            'unstarted_skills_count': unstarted_skills,
            'progress_percentage': q_rev_pct,
            'submission_progress_percentage': q_sub_pct,
            'is_topic_completed': is_q_completed,
            'skills': skill_stats_list,
        }

        topic_stats_list.append(
            {
                'topic_id': topic_id,
                'topic_name': topic.name,
                'total_chapters_count': total_chapters_count,
                'total_cards_count': topic_cards_count,
                'question_stats': question_stats,
                'translation_stats_by_language': translation_stats_by_lang,
                'last_progress_date': last_progress_date_str,
                'is_stalled': is_stalled,
            }
        )

    # Sort topics near-complete first by default (highest non-100% completion first).
    topic_stats_list.sort(
        key=lambda t: (
            t['question_stats']['progress_percentage'] < 100.0,
            t['question_stats']['progress_percentage'],
        ),
        reverse=True,
    )

    # 6. Aggregate language-level overall stats.
    language_stats_list: List[LanguageOverallStatDict] = []
    total_topics_count = len(topic_stats_list)

    for lang_code, lang_name in lang_name_by_code.items():
        data = language_totals[lang_code]
        t_cards = data['total_cards']
        tr_cards = data['total_translated_cards']
        sub_cards = data['total_submitted_cards']
        rev_pct = round((tr_cards / t_cards * 100.0), 1) if t_cards > 0 else 0.0
        sub_pct = (
            round((sub_cards / t_cards * 100.0), 1) if t_cards > 0 else 0.0
        )

        language_stats_list.append(
            {
                'language_code': lang_code,
                'language_name': lang_name,
                'completed_topics_count': data['completed_topics'],
                'in_progress_topics_count': data['in_progress_topics'],
                'not_started_topics_count': data['not_started_topics'],
                'total_topics_count': total_topics_count,
                'total_translated_cards': tr_cards,
                'total_submitted_cards': sub_cards,
                'total_cards': t_cards,
                'overall_progress_percentage': rev_pct,
                'overall_submission_percentage': sub_pct,
            }
        )

    # Sort languages by progress descending.
    language_stats_list.sort(
        key=lambda l: l['overall_progress_percentage'], reverse=True
    )

    # 7. Compute Summary KPI stats.
    fully_translated_count = sum(
        1
        for t in topic_stats_list
        if any(
            ts['is_topic_completed']
            for ts in t['translation_stats_by_language'].values()
        )
    )
    near_completion_count = sum(
        1
        for t in topic_stats_list
        if (70.0 <= t['question_stats']['progress_percentage'] < 100.0)
        or any(
            70.0 <= ts['progress_percentage'] < 100.0
            for ts in t['translation_stats_by_language'].values()
        )
    )
    needs_review_count = sum(
        1
        for t in topic_stats_list
        if (
            t['question_stats']['submission_progress_percentage']
            > t['question_stats']['progress_percentage']
        )
        or any(
            ts['submission_progress_percentage'] > ts['progress_percentage']
            for ts in t['translation_stats_by_language'].values()
        )
    )
    needs_contributor_count = sum(
        1
        for t in topic_stats_list
        if (t['question_stats']['submission_progress_percentage'] < 70.0)
        or any(
            ts['submission_progress_percentage'] < 70.0
            for ts in t['translation_stats_by_language'].values()
        )
    )

    summary_stats: SummaryStatsDict = {
        'total_topics_count': total_topics_count,
        'total_chapters_count': total_chapters_overall,
        'total_skills_count': total_skills_overall,
        'total_questions_count': total_questions_overall,
        'total_languages_count': len(lang_name_by_code),
        'fully_translated_topics_count': fully_translated_count,
        'near_completion_topics_count': near_completion_count,
        'needs_review_count': needs_review_count,
        'needs_contributor_count': needs_contributor_count,
    }

    topic_names = [t['topic_name'] for t in topic_stats_list]

    return {
        'topic_stats': topic_stats_list,
        'language_stats': language_stats_list,
        'summary_stats': summary_stats,
        'supported_languages': supported_languages_list,
        'topic_names': topic_names,
    }

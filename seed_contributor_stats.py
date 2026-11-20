# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
"""Seed script for local contributor dashboard stats demonstration.

Run this while the Oppia dev server is running (with datastore emulator on port 8089)
to inject realistic topics, skills, and translation opportunities.
"""

from __future__ import annotations

import datetime
import os
import sys

sys.path.insert(0, '/mnt/d/gsoc/oppia')

os.environ['DATASTORE_DATASET'] = 'dev-project-id'
os.environ['DATASTORE_EMULATOR_HOST'] = 'localhost:8089'
os.environ['DATASTORE_EMULATOR_HOST_PATH'] = 'localhost:8089/datastore'
os.environ['DATASTORE_HOST'] = 'http://localhost:8089'
os.environ['GOOGLE_CLOUD_PROJECT'] = 'dev-project-id'

try:
    from scripts import common
    for p in common.DIRS_TO_ADD_TO_SYS_PATH:
        if p not in sys.path:
            sys.path.insert(0, p)
except Exception:
    pass

from core.platform import models
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.topic import gae_models as topic_models

datastore_services = models.Registry.import_datastore_services()


def seed() -> None:
    print('Connecting to Datastore Emulator and seeding demo stats data...')
    now = datetime.datetime.utcnow()
    past_stalled = now - datetime.timedelta(days=45)
    recent = now - datetime.timedelta(days=2)

    with datastore_services.get_ndb_context():
        # 1. Topic 1: Fractions (Near-Complete in Hindi: 85% Submissions, 70% Reviews)
        t1 = topic_models.TopicModel(
            id='fractions_topic',
            name='Fractions',
            canonical_name='fractions',
            url_fragment='fractions',
            description='Master adding, subtracting, and multiplying fractions.',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=3,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_frac_1', 'skill_frac_2'],
            page_title_fragment_for_web='fractions'
        )
        t1.last_updated = recent
        t1.put()

        topic_models.TopicRightsModel(id='fractions_topic', topic_is_published=True).put()

        exp1 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_frac_ch1',
            topic_id='fractions_topic',
            topic_name='Fractions',
            story_id='story_frac_1',
            story_title='Adventures with Fractions',
            chapter_title='Chapter 1: Pizza Slices & Halves',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'es'],
            translation_counts={'hi': 18, 'es': 12},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi']
        )
        exp1.last_updated = recent
        exp1.put()

        exp2 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_frac_ch2',
            topic_id='fractions_topic',
            topic_name='Fractions',
            story_id='story_frac_1',
            story_title='Adventures with Fractions',
            chapter_title='Chapter 2: Common Denominators',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'es'],
            translation_counts={'hi': 16, 'es': 5},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi']
        )
        exp2.last_updated = recent
        exp2.put()

        s1 = opportunity_models.SkillOpportunityModel(
            id='skill_frac_1',
            skill_description='Adding Fractions with Like Denominators',
            question_count=12
        )
        s1.last_updated = recent
        s1.put()

        s2 = opportunity_models.SkillOpportunityModel(
            id='skill_frac_2',
            skill_description='Multiplying Fractions',
            question_count=8
        )
        s2.last_updated = recent
        s2.put()

        # 2. Topic 2: Place Value (Needs Reviewers: 90% Submissions, 45% Reviews)
        t2 = topic_models.TopicModel(
            id='place_value_topic',
            name='Place Value',
            canonical_name='place value',
            url_fragment='place-value',
            description='Understand units, tens, hundreds, and thousands.',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_pv_1', 'skill_pv_2'],
            page_title_fragment_for_web='place-value'
        )
        t2.last_updated = recent
        t2.put()

        topic_models.TopicRightsModel(id='place_value_topic', topic_is_published=True).put()

        exp3 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_pv_ch1',
            topic_id='place_value_topic',
            topic_name='Place Value',
            story_id='story_pv_1',
            story_title='Counting Blocks',
            chapter_title='Chapter 1: The Magic of Tens',
            content_count=30,
            incomplete_translation_language_codes=['hi', 'es'],
            translation_counts={'hi': 14, 'es': 8},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi']
        )
        exp3.last_updated = recent
        exp3.put()

        s3 = opportunity_models.SkillOpportunityModel(
            id='skill_pv_1',
            skill_description='Identifying Tens and Units',
            question_count=10
        )
        s3.last_updated = recent
        s3.put()

        s4 = opportunity_models.SkillOpportunityModel(
            id='skill_pv_2',
            skill_description='Comparing Multi-Digit Numbers',
            question_count=4
        )
        s4.last_updated = recent
        s4.put()

        # 3. Topic 3: Negative Numbers (Stalled / Inactive > 30 days)
        t3 = topic_models.TopicModel(
            id='negative_numbers_topic',
            name='Negative Numbers',
            canonical_name='negative numbers',
            url_fragment='negative-numbers',
            description='Explore numbers below zero on the number line.',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_neg_1'],
            page_title_fragment_for_web='negative-numbers'
        )
        t3.last_updated = past_stalled
        t3.put()

        topic_models.TopicRightsModel(id='negative_numbers_topic', topic_is_published=True).put()

        exp4 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_neg_ch1',
            topic_id='negative_numbers_topic',
            topic_name='Negative Numbers',
            story_id='story_neg_1',
            story_title='Below Zero',
            chapter_title='Chapter 1: Sub-zero Temperatures',
            content_count=25,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 6},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi']
        )
        exp4.last_updated = past_stalled
        exp4.put()

        s5 = opportunity_models.SkillOpportunityModel(
            id='skill_neg_1',
            skill_description='Adding Opposite Integers',
            question_count=3
        )
        s5.last_updated = past_stalled
        s5.put()

        # 4. Topic 4: Basic Addition (100% Fully Completed topic for Accordion testing)
        t4 = topic_models.TopicModel(
            id='basic_addition_topic',
            name='Basic Addition',
            canonical_name='basic addition',
            url_fragment='basic-addition',
            description='Learn single digit addition and basic counting.',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_add_1'],
            page_title_fragment_for_web='basic-addition'
        )
        t4.last_updated = recent
        t4.put()

        topic_models.TopicRightsModel(id='basic_addition_topic', topic_is_published=True).put()

        exp5 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_add_ch1',
            topic_id='basic_addition_topic',
            topic_name='Basic Addition',
            story_id='story_add_1',
            story_title='Counting Apples',
            chapter_title='Chapter 1: 1 plus 1',
            content_count=15,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 15, 'es': 15},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[]
        )
        exp5.last_updated = recent
        exp5.put()

        s6 = opportunity_models.SkillOpportunityModel(
            id='skill_add_1',
            skill_description='Adding Numbers Under 10',
            question_count=15
        )
        s6.last_updated = recent
        s6.put()

        print('\n>>> SUCCESS: Demo topics, skills, and translations seeded into datastore! <<<\n')


if __name__ == '__main__':
    seed()

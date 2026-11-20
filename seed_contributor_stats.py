# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
"""Seed script for local contributor dashboard stats demonstration."""

from __future__ import annotations

import datetime
import os
import sys

# Support running from either /home/acer/oppia or /mnt/d/gsoc/oppia
for base in ['/home/acer/oppia', '/mnt/d/gsoc/oppia']:
    if os.path.exists(base):
        if base not in sys.path:
            sys.path.insert(0, base)
        third_party_libs = os.path.join(base, 'third_party', 'python_libs')
        if os.path.exists(third_party_libs) and third_party_libs not in sys.path:
            sys.path.insert(0, third_party_libs)

os.environ['DATASTORE_DATASET'] = 'dev-project-id'
os.environ['DATASTORE_EMULATOR_HOST'] = 'localhost:8089'
os.environ['DATASTORE_EMULATOR_HOST_PATH'] = 'localhost:8089/datastore'
os.environ['DATASTORE_HOST'] = 'http://localhost:8089'
os.environ['GOOGLE_CLOUD_PROJECT'] = 'dev-project-id'

import google.auth.credentials
from google.cloud import ndb
from core.platform.datastore import cloud_datastore_services
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.topic import gae_models as topic_models

cloud_datastore_services.NdbClientSingleton()._client = ndb.Client(
    project='dev-project-id',
    credentials=google.auth.credentials.AnonymousCredentials()
)


def seed() -> None:
    print('Connecting to Datastore Emulator and seeding demo stats data across multiple languages...')
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    past_stalled = now - datetime.timedelta(days=45)
    recent = now - datetime.timedelta(days=2)

    with cloud_datastore_services.get_ndb_context():
        # 1. Topic 1: Fractions
        # Near-Complete in Hindi (85%) & French (90%), In-Progress in Spanish (42%) & Swahili (80%)
        r1 = topic_models.TopicRightsModel(id='fractions_topic', topic_is_published=True)
        super(topic_models.base_models.VersionedModel, r1).put()

        t1 = topic_models.TopicModel(
            id='fractions_topic',
            name='Fractions',
            canonical_name='fractions',
            url_fragment='fractions',
            description='Master adding, subtracting, and multiplying fractions.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=3,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_frac_1', 'skill_frac_2'],
            page_title_fragment_for_web='fractions'
        )
        super(topic_models.base_models.VersionedModel, t1).put()

        exp1 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_frac_ch1',
            topic_id='fractions_topic',
            topic_name='Fractions',
            story_id='story_frac_1',
            story_title='Adventures with Fractions',
            chapter_title='Chapter 1: Pizza Slices & Halves',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'es', 'fr', 'ar', 'sw', 'bn'],
            translation_counts={'hi': 18, 'es': 12, 'fr': 19, 'ar': 15, 'sw': 17, 'bn': 6},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi', 'es', 'fr', 'ar']
        )
        exp1.put()

        exp2 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_frac_ch2',
            topic_id='fractions_topic',
            topic_name='Fractions',
            story_id='story_frac_1',
            story_title='Adventures with Fractions',
            chapter_title='Chapter 2: Common Denominators',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'es', 'fr', 'ar', 'sw', 'bn'],
            translation_counts={'hi': 16, 'es': 5, 'fr': 17, 'ar': 13, 'sw': 15, 'bn': 4},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi', 'es', 'fr', 'ar']
        )
        exp2.put()

        s1 = opportunity_models.SkillOpportunityModel(
            id='skill_frac_1',
            skill_description='Adding Fractions with Like Denominators',
            question_count=12
        )
        s1.put()

        s2 = opportunity_models.SkillOpportunityModel(
            id='skill_frac_2',
            skill_description='Multiplying Fractions',
            question_count=8
        )
        s2.put()

        # 2. Topic 2: Place Value
        # Near-Complete in Spanish (86%) & Bangla (93%), Needs Reviewers in Hindi (47%)
        r2 = topic_models.TopicRightsModel(id='place_value_topic', topic_is_published=True)
        super(topic_models.base_models.VersionedModel, r2).put()

        t2 = topic_models.TopicModel(
            id='place_value_topic',
            name='Place Value',
            canonical_name='place value',
            url_fragment='place-value',
            description='Understand units, tens, hundreds, and thousands.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_pv_1', 'skill_pv_2'],
            page_title_fragment_for_web='place-value'
        )
        super(topic_models.base_models.VersionedModel, t2).put()

        exp3 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_pv_ch1',
            topic_id='place_value_topic',
            topic_name='Place Value',
            story_id='story_pv_1',
            story_title='Counting Blocks',
            chapter_title='Chapter 1: The Magic of Tens',
            content_count=30,
            incomplete_translation_language_codes=['hi', 'es', 'fr', 'ar', 'sw', 'bn'],
            translation_counts={'hi': 14, 'es': 26, 'fr': 12, 'ar': 15, 'sw': 24, 'bn': 28},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi', 'es', 'fr', 'ar']
        )
        exp3.put()

        s3 = opportunity_models.SkillOpportunityModel(
            id='skill_pv_1',
            skill_description='Identifying Tens and Units',
            question_count=10
        )
        s3.put()

        s4 = opportunity_models.SkillOpportunityModel(
            id='skill_pv_2',
            skill_description='Comparing Multi-Digit Numbers',
            question_count=4
        )
        s4.put()

        # 3. Topic 3: Negative Numbers (Stalled / Inactive > 30 days)
        r3 = topic_models.TopicRightsModel(id='negative_numbers_topic', topic_is_published=True)
        super(topic_models.base_models.VersionedModel, r3).put()

        t3 = topic_models.TopicModel(
            id='negative_numbers_topic',
            name='Negative Numbers',
            canonical_name='negative numbers',
            url_fragment='negative-numbers',
            description='Explore numbers below zero on the number line.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_neg_1'],
            page_title_fragment_for_web='negative-numbers'
        )
        super(topic_models.base_models.VersionedModel, t3).put()

        exp4 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_neg_ch1',
            topic_id='negative_numbers_topic',
            topic_name='Negative Numbers',
            story_id='story_neg_1',
            story_title='Below Zero',
            chapter_title='Chapter 1: Sub-zero Temperatures',
            content_count=25,
            incomplete_translation_language_codes=['hi', 'es'],
            translation_counts={'hi': 6, 'es': 5},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=['hi', 'es']
        )
        exp4.put()

        s5 = opportunity_models.SkillOpportunityModel(
            id='skill_neg_1',
            skill_description='Adding Opposite Integers',
            question_count=3
        )
        s5.put()

        # 4. Topic 4: Basic Addition (100% Fully Completed topic for Accordion testing)
        r4 = topic_models.TopicRightsModel(id='basic_addition_topic', topic_is_published=True)
        super(topic_models.base_models.VersionedModel, r4).put()

        t4 = topic_models.TopicModel(
            id='basic_addition_topic',
            name='Basic Addition',
            canonical_name='basic addition',
            url_fragment='basic-addition',
            description='Learn single digit addition and basic counting.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_add_1'],
            page_title_fragment_for_web='basic-addition'
        )
        super(topic_models.base_models.VersionedModel, t4).put()

        exp5 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_add_ch1',
            topic_id='basic_addition_topic',
            topic_name='Basic Addition',
            story_id='story_add_1',
            story_title='Counting Apples',
            chapter_title='Chapter 1: 1 plus 1',
            content_count=15,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 15, 'es': 15, 'fr': 15, 'ar': 15, 'sw': 15, 'bn': 15},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[]
        )
        exp5.put()

        s6 = opportunity_models.SkillOpportunityModel(
            id='skill_add_1',
            skill_description='Adding Numbers Under 10',
            question_count=15
        )
        s6.put()

        print('\n>>> SUCCESS: Demo topics, skills, and translations seeded into datastore across Hindi, Spanish, French, Arabic, Swahili, and Bangla! <<<\n')


if __name__ == '__main__':
    seed()

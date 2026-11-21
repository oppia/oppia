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

"""Tests for blog model validation jobs."""

from __future__ import annotations

import datetime

from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import blog_jobs
from core.jobs.types import (
    base_validation_errors,
    blog_validation_errors,
    model_property,
)
from core.platform import models

from typing import List, Optional, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models, user_models

(blog_models, user_models) = models.Registry.import_models(
    [models.Names.BLOG, models.Names.USER]
)

BLOG_POST_ID = 'blogpostid01'
AUTHOR_ID = 'uid_%s' % ('a' * 32)
EDITOR_ID = 'uid_%s' % ('b' * 32)
PSEUDONYMOUS_AUTHOR_ID = 'pid_%s' % ('c' * 32)


class BlogPostRightsModelValidationJobTests(job_test_utils.JobTestBase):
    """Tests BlogPostRightsModelValidationJob."""

    JOB_CLASS: Type[blog_jobs.BlogPostRightsModelValidationJob] = (
        blog_jobs.BlogPostRightsModelValidationJob
    )

    def create_blog_post_rights_model(
        self,
        editor_ids: Optional[List[str]] = None,
        blog_post_is_published: bool = True,
    ) -> blog_models.BlogPostRightsModel:
        """Creates a blog post rights model for a job test.

        Args:
            editor_ids: list(str)|None. The editor IDs; defaults to the author.
            blog_post_is_published: bool. Whether the post is published.

        Returns:
            BlogPostRightsModel. The new model.
        """
        return self.create_model(
            blog_models.BlogPostRightsModel,
            id=BLOG_POST_ID,
            editor_ids=[AUTHOR_ID] if editor_ids is None else editor_ids,
            blog_post_is_published=blog_post_is_published,
        )

    def create_blog_post_model(
        self,
        author_id: str = AUTHOR_ID,
        published_on: Optional[datetime.datetime] = None,
    ) -> blog_models.BlogPostModel:
        """Creates a blog post model for a job test.

        Args:
            author_id: str. The author ID.
            published_on: datetime|None. When the post was published.

        Returns:
            BlogPostModel. The new model.
        """
        return self.create_model(
            blog_models.BlogPostModel,
            id=BLOG_POST_ID,
            author_id=author_id,
            title='Sample title',
            content='<p>Hello</p>',
            url_fragment='sample-title',
            tags=['News'],
            thumbnail_filename='thumbnail.svg',
            published_on=published_on,
        )

    def create_blog_post_summary_model(
        self,
        author_id: str = AUTHOR_ID,
        published_on: Optional[datetime.datetime] = None,
    ) -> blog_models.BlogPostSummaryModel:
        """Creates a blog post summary model for a job test.

        Args:
            author_id: str. The author ID.
            published_on: datetime|None. When the post was published.

        Returns:
            BlogPostSummaryModel. The new model.
        """
        return self.create_model(
            blog_models.BlogPostSummaryModel,
            id=BLOG_POST_ID,
            author_id=author_id,
            title='Sample title',
            summary='Hello',
            url_fragment='sample-title',
            tags=['News'],
            thumbnail_filename='thumbnail.svg',
            published_on=published_on,
        )

    def create_user_settings_model(
        self, user_id: str
    ) -> user_models.UserSettingsModel:
        """Creates a user settings model for a job test.

        Args:
            user_id: str. The user ID.

        Returns:
            UserSettingsModel. The new model.
        """
        return self.create_model(
            user_models.UserSettingsModel,
            id=user_id,
            email='%s@example.com' % user_id,
        )

    def create_published_post_models(
        self,
    ) -> List[
        Union[blog_models.BlogPostModel, blog_models.BlogPostSummaryModel]
    ]:
        """Creates a published blog post and its summary, both by the author.

        Returns:
            list(BlogPostModel|BlogPostSummaryModel). The new models.
        """
        published_on = datetime.datetime(2026, 1, 1)
        return [
            self.create_blog_post_model(published_on=published_on),
            self.create_blog_post_summary_model(published_on=published_on),
        ]

    def test_valid_published_blog_post_rights_produce_no_errors(
        self,
    ) -> None:
        self.put_multi(
            [
                self.create_blog_post_rights_model(),
                self.create_user_settings_model(AUTHOR_ID),
                *self.create_published_post_models(),
            ]
        )

        self.assert_job_output_is([])

    def test_valid_draft_blog_post_rights_produce_no_errors(self) -> None:
        self.put_multi(
            [
                self.create_blog_post_rights_model(
                    blog_post_is_published=False
                ),
                self.create_user_settings_model(AUTHOR_ID),
                self.create_blog_post_model(),
                self.create_blog_post_summary_model(),
            ]
        )

        self.assert_job_output_is([])

    def test_other_blog_models_are_not_checked_by_this_job(self) -> None:
        self.put_multi([self.create_blog_post_model()])

        self.assert_job_output_is([])

    def test_missing_blog_post_and_summary_produce_relationship_errors(
        self,
    ) -> None:
        model = self.create_blog_post_rights_model()
        self.put_multi([model, self.create_user_settings_model(AUTHOR_ID)])
        id_property = model_property.ModelProperty(
            blog_models.BlogPostRightsModel,
            blog_models.BlogPostRightsModel.id,
        )
        expected_errors = [
            base_validation_errors.ModelRelationshipError(
                id_property=id_property,
                model=model,
                target_kind=target_kind,
                target_id=BLOG_POST_ID,
            ).stderr
            for target_kind in ('BlogPostModel', 'BlogPostSummaryModel')
        ]

        self.assert_job_output_is(
            [{'ModelRelationshipError': sorted(expected_errors)}]
        )

    def test_missing_user_settings_produce_relationship_error(self) -> None:
        model = self.create_blog_post_rights_model(
            editor_ids=[AUTHOR_ID, EDITOR_ID]
        )
        self.put_multi(
            [
                model,
                self.create_user_settings_model(AUTHOR_ID),
                *self.create_published_post_models(),
            ]
        )
        expected_error = base_validation_errors.ModelRelationshipError(
            id_property=model_property.ModelProperty(
                blog_models.BlogPostRightsModel,
                blog_models.BlogPostRightsModel.editor_ids,
            ),
            model=model,
            target_kind='UserSettingsModel',
            target_id=EDITOR_ID,
        )

        self.assert_job_output_is(
            [{'ModelRelationshipError': [expected_error.stderr]}]
        )

    def test_published_rights_for_draft_post_produce_errors(self) -> None:
        model = self.create_blog_post_rights_model(blog_post_is_published=True)
        self.put_multi(
            [
                model,
                self.create_user_settings_model(AUTHOR_ID),
                self.create_blog_post_model(),
                self.create_blog_post_summary_model(),
            ]
        )
        expected_errors = [
            blog_validation_errors.InconsistentBlogPostPublishedStatusError(
                model, target_kind
            ).stderr
            for target_kind in ('BlogPostModel', 'BlogPostSummaryModel')
        ]

        self.assert_job_output_is(
            [
                {
                    'InconsistentBlogPostPublishedStatusError': sorted(
                        expected_errors
                    )
                }
            ]
        )

    def test_unpublished_rights_for_published_summary_produce_error(
        self,
    ) -> None:
        model = self.create_blog_post_rights_model(
            blog_post_is_published=False
        )
        self.put_multi(
            [
                model,
                self.create_user_settings_model(AUTHOR_ID),
                self.create_blog_post_model(),
                self.create_blog_post_summary_model(
                    published_on=datetime.datetime(2026, 1, 1)
                ),
            ]
        )
        expected_error = (
            blog_validation_errors.InconsistentBlogPostPublishedStatusError(
                model, 'BlogPostSummaryModel'
            )
        )

        self.assert_job_output_is(
            [
                {
                    'InconsistentBlogPostPublishedStatusError': [
                        expected_error.stderr
                    ]
                }
            ]
        )

    def test_author_missing_from_editors_produces_error(self) -> None:
        model = self.create_blog_post_rights_model(editor_ids=[EDITOR_ID])
        self.put_multi(
            [
                model,
                self.create_user_settings_model(EDITOR_ID),
                *self.create_published_post_models(),
            ]
        )
        expected_error = blog_validation_errors.BlogPostAuthorNotEditorError(
            model, AUTHOR_ID
        )

        self.assert_job_output_is(
            [{'BlogPostAuthorNotEditorError': [expected_error.stderr]}]
        )

    def test_pseudonymized_author_missing_from_editors_produces_no_errors(
        self,
    ) -> None:
        published_on = datetime.datetime(2026, 1, 1)
        self.put_multi(
            [
                self.create_blog_post_rights_model(editor_ids=[EDITOR_ID]),
                self.create_user_settings_model(EDITOR_ID),
                self.create_blog_post_model(
                    author_id=PSEUDONYMOUS_AUTHOR_ID, published_on=published_on
                ),
                self.create_blog_post_summary_model(
                    author_id=PSEUDONYMOUS_AUTHOR_ID, published_on=published_on
                ),
            ]
        )

        self.assert_job_output_is([])

    def test_invalid_domain_object_produces_error(self) -> None:
        # Duplicate editor IDs are rejected by BlogPostRights.validate().
        model = self.create_blog_post_rights_model(
            editor_ids=[AUTHOR_ID, AUTHOR_ID]
        )
        self.put_multi(
            [
                model,
                self.create_user_settings_model(AUTHOR_ID),
                *self.create_published_post_models(),
            ]
        )
        expected_error = base_validation_errors.ModelDomainObjectValidateError(
            model, 'Editor ID %s appears more than once' % AUTHOR_ID
        )

        self.assert_job_output_is(
            [{'ModelDomainObjectValidateError': [expected_error.stderr]}]
        )

    def test_inconsistent_timestamps_produce_error(self) -> None:
        now = datetime.datetime.now()
        model = self.create_blog_post_rights_model()
        model.created_on = now + datetime.timedelta(days=1)
        model.last_updated = now
        self.put_multi(
            [
                model,
                self.create_user_settings_model(AUTHOR_ID),
                *self.create_published_post_models(),
            ]
        )

        self.assert_job_output_is(
            [
                {
                    'InconsistentTimestampsError': [
                        base_validation_errors.InconsistentTimestampsError(
                            model
                        ).stderr
                    ]
                }
            ]
        )

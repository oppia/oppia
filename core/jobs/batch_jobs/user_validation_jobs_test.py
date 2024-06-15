# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.user_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class GetUsersWithInvalidBioJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        user_validation_jobs.GetUsersWithInvalidBioJob
    ] = user_validation_jobs.GetUsersWithInvalidBioJob

    USER_USERNAME_1: Final = 'user_1'
    USER_USERNAME_2: Final = 'user_2'
    USER_USERNAME_3: Final = 'user_3'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_user_with_null_bio(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            username=self.USER_USERNAME_1,
            email='a@a.com'
        )
        user.update_timestamps()
        self.put_multi([user])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='The username of user is "user_1"'
                ' and their bio is "None"'),
            job_run_result.JobRunResult(
                stdout='CountInvalidUserBios SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CountTotalUsers SUCCESS: 1')
        ])

    def test_user_with_valid_bio(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            username=self.USER_USERNAME_2,
            email='b@b.com',
            user_bio='Test Bio'
        )
        user.update_timestamps()
        self.put_multi([user])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='CountTotalUsers SUCCESS: 1')
        ])

    def test_user_with_too_long_bio(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            username=self.USER_USERNAME_3,
            email='c@c.com',
            user_bio='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis convallis ut felis eget fringilla. Phasellus congue quam et odio venenatis viverra. Maecenas pharetra, dui a convallis vestibulum, augue sem posuere enim, ac hendrerit nisl diam eu dolor. Sed mattis risus in quam mollis pellentesque. Proin mi nisl, dignissim at euismod in, fermentum ut nisi. Donec vel mauris ipsum. Nulla quis egestas nisl. Phasellus urna nisi, iaculis tincidunt dui volutpat, sagittis congue urna. Suspendisse commodo mollis sem, porttitor molestie justo laoreet in. Nullam facilisis dui sapien, et viverra lorem elementum vel.Integer tincidunt feugiat orci, vitae molestie erat facilisis eget. Nullam venenatis, tellus gravida varius condimentum, orci nunc ornare purus, quis pretium diam nulla vitae ipsum. In vel lorem consectetur, mattis enim a, varius magna. Nunc consequat nisl vel mi feugiat, a consequat turpis dapibus. Cras lectus magna, ullamcorper id orci vel, malesuada hendrerit enim. Nunc in quam felis. Proin posuere justo sed consectetur molestie. Quisque non aliquet magna. Vivamus non vulputate augue, quis placerat est.Nullam vel ornare arcu. Integer ornare est lacinia ligula vehicula efficitur. Aliquam varius elit sit amet eros vestibulum, eu pharetra justo maximus. Proin a sagittis felis, ac tempus ipsum. Cras egestas lorem quis ante ullamcorper, vitae accumsan sapien luctus. Nulla sodales elit sit amet dignissim ornare. In non porttitor tellus, sit amet interdum nisl. Vivamus ut lobortis lacus. Duis feugiat tempor eros vitae aliquet. Integer varius elit quis erat cursus, faucibus bibendum sapien varius. In ut luctus elit, bibendum posuere felis. Donec pretium enim id eleifend venenatis. Cras aliquet magna nec ante sodales, vel imperdiet velit posuere.Nunc nulla sem, condimentum sit amet tempor eu, pharetra at nulla. Nulla auctor pellentesque condimentum. In vestibulum, lectus nec pulvinar dignissim, elit quam viverra metus, ut fermentum ipsum dui ac mauris. Aliquam imperdiet dictum nulla, eget dignissim risus vehicula sit amet. Nam et blandit turpis, ut varius nulla. Mauris dui.' # pylint: disable=line-too-long
        )
        user.update_timestamps()
        self.put_multi([user])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='The username of user is "user_3" and their bio is "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis convallis ut felis eget fringilla. Phasellus congue quam et odio venenatis viverra. Maecenas pharetra, dui a convallis vestibulum, augue sem posuere enim, ac hendrerit nisl diam eu dolor. Sed mattis risus in quam mollis pellentesque. Proin mi nisl, dignissim at euismod in, fermentum ut nisi. Donec vel mauris ipsum. Nulla quis egestas nisl. Phasellus urna nisi, iaculis tincidunt dui volutpat, sagittis congue urna. Suspendisse commodo mollis sem, porttitor molestie justo laoreet in. Nullam facilisis dui sapien, et viverra lorem elementum vel.Integer tincidunt feugiat orci, vitae molestie erat facilisis eget. Nullam venenatis, tellus gravida varius condimentum, orci nunc ornare purus, quis pretium diam nulla vitae ipsum. In vel lorem consectetur, mattis enim a, varius magna. Nunc consequat nisl vel mi feugiat, a consequat turpis dapibus. Cras lectus magna, ullamcorper id orci vel, malesuada hendrerit enim. Nunc in quam felis. Proin posuere justo sed consectetur molestie. Quisque non aliquet magna. Vivamus non vulputate augue, quis placerat est.Nullam vel ornare arcu. Integer ornare est lacinia ligula vehicula efficitur. Aliquam varius elit sit amet eros vestibulum, eu pharetra justo maximus. Proin a sagittis felis, ac tempus ipsum. Cras egestas lorem quis ante ullamcorper, vitae accumsan sapien luctus. Nulla sodales elit sit amet dignissim ornare. In non porttitor tellus, sit amet interdum nisl. Vivamus ut lobortis lacus. Duis feugiat tempor eros vitae aliquet. Integer varius elit quis erat cursus, faucibus bibendum sapien varius. In ut luctus elit, bibendum posuere felis. Donec pretium enim id eleifend venenatis. Cras aliquet magna nec ante sodales, vel imperdiet velit posuere.Nunc nulla sem, condimentum sit amet tempor eu, pharetra at nulla. Nulla auctor pellentesque condimentum. In vestibulum, lectus nec pulvinar dignissim, elit quam viverra metus, ut fermentum ipsum dui ac mauris. Aliquam imperdiet dictum nulla, eget dignissim risus vehicula sit amet. Nam et blandit turpis, ut varius nulla. Mauris dui."'), # pylint: disable=line-too-long
            job_run_result.JobRunResult(
                stdout='CountInvalidUserBios SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CountTotalUsers SUCCESS: 1')
        ])

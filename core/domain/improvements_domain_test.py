# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for domain objects related to Oppia improvement tasks."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import improvements
from core.domain import improvements_domain
from core.tests import test_utils


class TaskEntryTests(test_utils.GenericTestBase):
    """Unit tests for the TaskEntry domain object."""

    MOCK_DATE = datetime.datetime(2020, 6, 15, 9, 0, 0, 123456)

    def setUp(self) -> None:
        super(TaskEntryTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL) # type: ignore[no-untyped-call]
        self.exp_id = 'eid'
        self.save_new_valid_exploration(self.exp_id, self.owner_id) # type: ignore[no-untyped-call]
        self.maxDiff = 0

    def test_task_id_has_expected_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(
            task_entry.task_id,
            'exploration.eid.1.high_bounce_rate.state.Introduction')

    def test_composite_entity_id_has_expected_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task_entry.composite_entity_id, 'exploration.eid.1')

    def test_to_dict_has_expected_value(self) -> None:
        # Data url for images/avatar/user_blue_72px.png.
        # Generated using utils.convert_png_to_data_url.
        default_identicon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAABMCAYAAADHl1ErAAAAAXNSR0IArs4c6QAADhtJREFUeAHtXHlwVdUZ/859jyxmIQESyCaglC0iAgkJIntrIpvKphSwY2ttxbFOp9R/cGGqdhykLaMVO2OtoyRSCEKNEpYKyBIVQ1iNkBhNMCtb8shiQpJ3b7/fTW7m5uUlecu9L4nTM5Pce8895zvf93vnnPud833fEdQLKXb5jsC6%2BuZERZbHKaSMYRbGKERxgpQQUkSIIigEbAmFavlfrUKiVhCVcFa%2BIJEvJOlCcNCAnNKMFQ0o58vEfPgmhS5Mn0ot8n2KIs8lIZJJUfy8almIJqbxhRDSIbJKe2s%2BXvWlV/RcrGwqYGGp20bI1LyaeVmjKMrodp4EycGBAy6MjgsrSxozqG7O5GgxcVREeEigNDAwwBpmsUiRKGu3y1caGltstQ3yjbOFV6sPnypXTuRXBReU2GLqGprHkUKSRlMIUcD3WyUakGbbt7JYyzf6agpgYfe9O8kui/U8nB7UhJIkUTljwrBTTz449mZKUlyCEBTnjTCKQiX7T5ScfGP3Rf9j5ysny7IyTKXHPwYP690WSXnZtvcXp71pw1ldQwELm59%2BlyzbX%2BbeNL%2Btscb4EYOyNz2ZWD99wtAFnGdxxoQBefbs85f3rHsjJyivuGo60wsATe51WZJkWW/LWnXGgDZUEoYAFr58x0B7beOLPHGv5XnFIpGoS0mKOfze%2Bpmj/f2smNR9lm42teQ/8vLRgv0nyuZwVwtm1Ows5BZLSMBz1RkrbnjLiNeAhaWmPWgn%2BxYeejwkRMu9idH7tm%2BYE8/z0EhvmfOmPs9/RQ9tOJx3IKc8lUixkqBKC1nW2vat3u0NXY8Bi1%2B%2Bw6%2BktnETD7%2BnwEB4iP/pL/5xf03U4IBZ3jBkdN2K641Hkn/7YWh17c1JoM3D9PW4kIB1eRkrmjxpyyPAeK4aLttbPuAhOIU5aHpm1cTMZ1ffuRT8eMKED%2BooL6Wd%2B2Bj%2BtnFUGeYyVzJYl3Kc9sld9t2W8Dw%2BWkTWuz2fdxQ9ACr9P3Jfy7%2BZuSw0HnuNtwb5Ysqaw4mPJb5k%2BYW%2BVZuv9xqsaRWZ60%2B7w4vbgEWnrJ1hp3kTO5ZYUPCAnK%2B3bYiitWDWHca7O2yrI6U3r5yR8U1W2MiC2%2BzkLS4ev%2BaY67y1a749VQBYLUIZT/AGhUTduS7f68Y39/AgozgGbxDBsgCmSBbT/Jr710CDMMQPYvHf2DC2Mj9p95efA8TCNKI9MNrEGSALJAJskFGV%2BTocUhigrfbWz5jYtH4VdrAMksBdYVnI8vYJ/8q83hhmW0WEy23WKx39/Qh6LaHQXXA1xBgYc5isBL4/scCFoC3QCbIBhkhK2TGi65St4CpeharDvgaYoJnIv15GHaFQRBkg4w8p02BzF0VRH6XgEGDV5VS1rOgOvTHCb47wfXvIBtkhE4JmSG7/r3%2B3ilg6toQyx1OUEr7i56lF8zde8gIWVEPSz1g4IyGU8CwkMbaEMudNg3eWd0fXR5khcyQXcXAiYSdAMMWDY/ltVhIY23IdXr8kjqh21%2BzRKvMogUYAAtHQToBhv0sbNFg16GvLaQdmTfjGTJDdmCgYuHQSIfe07pTSqewn3V9z6qrvb1F48Crzx6xNTR4QXoE9tN4c2%2ByfufWqudC3VbmAYzNPwZrkf6dL%2B4LSm5Q9vkrVH79B6qs%2BoH8B1goatAtNCIqmOZOiabw4G5VJMNYREdhDD7ae6J0USsmtEwj3t7DYLCwK83f8WbbzauZP7/kq53SxiY7vfmfC5R24Fv6prTrDVEWgqbfEUlPLY2nlKkxGv%2BmXbFzG7H4/eE8g/tZyO92zbDSPoe1WncUgT14X4G189NimvjobnrhX6e6BQuo8DCho2crafnzB2n%2BMwe4PL5H5iVgACx4wEltli%2B1sXbA%2BGkNcmCwUN%2BY%2BI%2B3WOjZt3Lpl68cpQoefu6m4%2Bcqae7TWfTfk%2BXuVnWrvA4LFRtUVockjKxKc8sJmMJsWWsiON/U9eJvNmXTtk%2B%2BdYt5Z4WZX0p/bjYtmBbn7LURefaw%2BVuvwoQnBliTYCxu7WFskQb1WROjcvliKlibM/IMAQv8siD0643H6etiGx7NSBbYUlXCbRipgKnme859Ysl4jwwDrnKaV2SjDe%2B0tu9qnZ7KsQWch/YxVpt6KunZexieUVPDSIJjCC86k3lwyikJ0di%2BMS09/3au2iuMbuDr4mpKN2CIO%2BMLVnpgA4yAlVRX1ziV4fODrwOv2k2bDM4UVvEkXeaMJ0PyXn3/nCF0HIkAE2ADjICVpChiLArBMcSxsJHPmdmXjCTXiVZRRS19VVTdKd%2BIDA0bYCW1%2BWcRvGiMIN4Vjb1flHb1yrD8rM9LDKOlJ6RhA6ww6au%2BD3A50hcy%2Bt5sRRP8FpSYo8zqsBnDPax13oJ/ltEgafSqam5SU7NdezTtWsHrTzOShg2wYtWP3SQ5wZnNjMZA80Z9s1mkO9CtMakdDRtgJcGnFK3C869D6wY%2BRISp7loGUnROKtKkdtqxYawkzQGXdwNUN0nnrHiXGxxoJf40e0fEhdpRg29xoZT7RTRsgJV%2B8e0%2BJTdqJIwd4kZpz4pOGWN%2BG5Lq2s38wQHXMzZdq2XiAlllgP2%2BaH6yOX4xGjbAinejlVq0CG9l10T3rNT99wwnf96KMyvNuHMoDR0UaAr5dmwYK1YrhAoYXLtNaa2N6DAW5vFF6qLClGZeeHSyKXRBVMMGWLFaoUZYEPzgTWuxjfC6lROI/RgMb2bZ7JGUaOIcqWEDrDDp50MCBA0YLokDQRgx0p%2BdTezH4PDG88dxI8LotaeneU7AhZo6bPK5hwkVMERYuFDX6yLT2JDx99/fTVY2anibYiOCaPuGuayydDB%2BeUu2U30NG2AlCaFcRAmEo3QqaVLGynm30a6X5sHz2uMWksZH0pHXF9CIYeb/zho2CAqTgoMDvoTXCmJ3EI7isQRuVpw9KYqytyykhxk8qASuJoD84mNTKGvjveSLFQQwUeOaGCNE0Flqvs5o8b/9gZ8xwyMmj404NComZJyrzHtbLjTIjxZNv1X9C/S30pXqRrLVdd4lh7EjOX4oPfHAOHrzD9Np9l1RZMHnygeJ45kOZXxaPJ6byr6WueotdfAjhI73rGdu2ZXnn5oY7QM2OjZxx8hw%2BvPjCepf2bUfqJz/Llc1qHpb1OBAiosMpoFB5i%2BtOnLV%2BoTgL9ypYYZ8bZ0tOd6QmuUNbCiFMoN9GPM0TCbeXYoZcgvhr48kOyLlVF6AESf1UwV7G88jBbC/ISqsjzDb62wAC9UmydhoAaz6b/tWcIgQul7ntI8woMNCxQZstQOGSFYeqQriDeGI0Ud47jU2gIEae8kmtlZsWllpB6zNO2UXZwcg3rDXOO0jDbdhEIDoXs1zB6y1A4YHhP3iiuBMOJXh3tfJzuZ/qBbfX65nR5UGqmto8TUL2OoqAgZoWMNEY6KTMhOa%2Bt4ehCDfmxjz8c4X5y3UChp5hVk/j63Vpwuu0zdlNVTIrkuFfC1hkOobO%2B//Qw8LD/an26JDaFRsKI2KCWU76kCaOi6CoHYYnZY9d/DjAzllC/lDmFWz75EFevqdFmGIkbbL9hREsiI40yg/11wGhxex9PlXV%2BjEhatUU99ZQdUzpr%2BH08n1mkb1L%2BfiVf0rGs5Lo2nxkXT3HUPZ0S7WawAhsxrFy6HPwKJDY/zQqYehAPey1%2BDgDxfsSxkPwZPYaTmU7S7BPWDXkWLafayYLlWaaidW2cASK5nBWzJzOD3AG5YebCgqw5dvP4PoXab1Oveu3znK5xQIOPW31DZchL/6M6vv2sn%2B68scK3b1jDlo%2B6Hv6G878ij/e1M3cbtiQc3HML4vKZbWrbyTpowe3G1Z7SVH7e7cmHZmGXePSmtI4FhnQfVOAQMBNfhdse/CwvzsO/cf6ykapKlZpq0HCmlzxlc%2B6U2akK5c2XJNf3x4At3D29hdJUTrTnz0wxlwOrEIy5Kugum7BAyEtaGJwKVrH63mrSDn0besEdNTmz9XJ%2B6uGOoL%2BbAr/OXJJIoM77jryx%2Bh0iGL0mSENnc1FDX%2BO6gVWqZ2RfQ9I5oLQgj75fxO/q%2BvpJ9TnXTxlevr6cPjlyj5iUx2bb%2BsZ7UesqlgsayQWf/S8b7bHobC3QWYrv3rZ%2BwuXuhIs88/Y4v8vfWz4BvrdoBpj4BBejWE2W4/yupTGMJ%2BD21O/emf3j1t2bTNrYD8PgWkv7/FflvUwE8uFFelMAg2i8Uy05UTBlwCTAWtLUieJ8XA2MiQIxXX6xNYI%2B6XC3Wep%2Br5xz/Jsszij1qDVREprp4s4DJgGmjaMQzcUA5bgaNkRTbH3GxSf5SEVMoxRBUMlrnHMIB//ArounxbjgZZuWWtSzlokmyGkwWv4Bm8QwZ1GLpxZgUYcquHaRLgQ6A/SobJ4IiGpeyc7RE9ja55V/aKEOID5s/3R8loQjkeVsTzwmmeF2oYuFlamT5xFeII/4qh3LMmgR/oWT4/rEgPhONxWEKifUJW4mWikfpyvr5nBbNIkUQeD8BU7lm9fxyWHgDHA9fYQlzHg/0w/6qjuZzqdKwvb/J9PveiAl4Hz%2BE5q%2B8duKYXHjHSjkf6sXkqWyEZK4QFLIQ51iihWrr2CJKCeE6fzm2pax8Grm8e6acHDffth0YSLdF9CCoZvFye55okRU7gIetV1AkPuRJZSCfZUdefezJMYf3v0MhOwHVzLKlQxAWSRJlQlDr%2BzrPcUjjbGwbyBB2mCKH62/K7KwywjWM8b5CQq%2BH9x%2B%2BCSVZiFKH8eI4ldQQOz4jJ/P/Bt86QcSFPPVqZA50Qu4NwFK7i3tHK7HEEJ5reOFr5fwkK97jkk8ywAAAAAElFTkSuQmCC')  # pylint: disable=line-too-long
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(
            improvements.get_task_dict_with_username_and_profile_picture( # type: ignore[no-untyped-call]
                task_entry), {
            'entity_type': 'exploration',
            'entity_id': self.exp_id,
            'entity_version': 1,
            'task_type': 'high_bounce_rate',
            'target_type': 'state',
            'target_id': 'Introduction',
            'issue_description': 'issue description',
            'status': 'resolved',
            'resolver_username': self.OWNER_USERNAME,
            'resolver_profile_picture_data_url': (
                default_identicon_data_url),
            'resolved_on_msecs': utils.get_time_in_millisecs(self.MOCK_DATE),
        })

    def test_to_dict_with_non_existing_resolver_id_raises_exception(
        self
    ) -> None:
        invalid_resolver_id = 'non_existing_user_id'
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, invalid_resolver_id,
            self.MOCK_DATE)
        with self.assertRaisesRegex(Exception, 'User not found'): # type: ignore[no-untyped-call]
            improvements.get_task_dict_with_username_and_profile_picture( # type: ignore[no-untyped-call]
             task_entry)

    def test_can_create_open_task_with_corresponding_values(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OPEN, None, None)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'open')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_can_create_obsolete_task_with_corresponding_values(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OBSOLETE, None, None)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'obsolete')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_can_create_resolved_task_with_corresponding_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'resolved')
        self.assertEqual(task_entry.resolver_id, self.owner_id)
        self.assertEqual(task_entry.resolved_on, self.MOCK_DATE)

    def test_constructor_ignores_resolution_args_when_task_is_open(
        self
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OPEN, self.owner_id, self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'open')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_constructor_ignores_resolution_args_when_task_is_obsolete(
        self
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OBSOLETE, self.owner_id,
            self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'obsolete')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

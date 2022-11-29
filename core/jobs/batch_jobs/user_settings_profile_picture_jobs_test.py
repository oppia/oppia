# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for user_settings_profile_picture_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import image_services
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_settings_profile_picture_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

datastore_services = models.Registry.import_datastore_services()

(user_models,) = models.Registry.import_models([models.Names.USER])

VALID_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAVjklEQVR4nO1da7AdVZlde%2B/uPvceHqXCwBSDo/gIESzUqanyz0zNKPKIhIQIMiUQ3gmvAUVkfISXFkwNzqhAEAlBRQekSJBoAkbCSygUZMAHCiMPIcww0RQZHgM5957d%2BzE/uu%2B95957Ht29v%2B7d58b1J8m53V9/qbvOt1evvfe3mbXWggDWbkFLLoDFmHOsUJwIZTbC2q3OsRrBhQjFUuc4dYSxL8DalyD4X/tOZRY4VSDG9kIgjiSKtQsisZwkVqy/DYvtJLHqAmM3o61WoCUXQtuHfKfTFWTEAoBInAYgcg9kgUAcCcb%2B3DmUsS9C6XXuOdUAxj6PtroALbkYsV4LoO07pZ4gJRZjeyIURxMEAhiaiMSJ7rEw/FXL2BfQViswJo9ArNcABHKjbJASCwAicSqAUZJYoTgejP2Zcxxj/xtK/4Ago2ph7ItphToMsV5Lol%2BrAjmxGNsLoTiKKFqASJxMEknq1UPzi5moUC15cFqhpO%2BUcoOcWAAQipPAsBNRrGNJtJa1W6D09wkyKg%2BdojzRUMp3SoVRCrE42xuBWEIUbQSROIUkktSrUMdvv5MoJzGL6FEKsQDaqpW8Ie7pHMfarenQUg%2BQiHJGnhYJSiMWZ29FII4gicWwc2pluEPq6%2BH7rWqYRXlWlEYsAIjEMjCiN8RALCaqWlsQ61sJMsqPuSDKs6JUYpG68RheN34uifKsKJVYAKEbj%2BFz4ytxync08T4BMjcew%2BPGD6NTTo3SiQXsOG68F1G%2Bo70VdmKuu/E7kijPikqIBcxNN35HFOVZURmx5pIbX6vlKzuqeO/EsLvxtRTljEa7UsLaP1RLrGF34%2BvklHM2DyPhSkTiBN%2BpTMLarWirS9GSC6olFjDsbrxvUc7A2XyMhFehGd2OgB8CIPScE2DtH9FWl2G7PAix/i4sWtUT609ufBEwcLY/RsIr0IzWIeCH%2Bk4IQDLktdW/oCUXINbfATA%2B%2BbPKiQVkcONzCNJhc%2BPzIiHUlWhGaxDwBQCE75RSQl2Oljwcsf5W1y%2BkF2INdONzmH7D4sbnBWf7pUPeLWmFqsOQ9xKk%2BjJachFi/U1Y/F/Pa70QC9hx3Pi8mBDlzWhtSiiaeVYXWPsypPoKWnIBpL4eFq8NvMcbsea6G58PdRXl2yDVV9GSH4HUq/pWqJnwRixgbrrx%2BVBXUf4SpLoyrVDXwuKN3DG8EqunG1/ITR6utfH1FOXbINVVaMWLIPXXMw15veCVWECPqlVwxn4Y1sbXU5S/CqlWpoS6Gtb%2Br3NM78Qadjc%2BK2opyvE6pL4GrXgBpF4Ja7eRxfZOLGDY3fh%2BqKkox2uQ%2BhuJKFdXkFSomagFseaeG19XUf4qpL4uEeXqa7D2ldKeVQtiATPceMelID7d%2BFqKcrwKqVcnGkr9G%2BmQ1wu1IdY0N95xua0PN76WohxvINbXoyUXQap/hbV/rOzZtSEWMJxufD1F%2BRhi/W205AK01ZcrJdQEgsqf2AdluPFtdblzJKlXIxAf6/iEgbN9EQVn1kY/AYDFdii9Npk9sC95zaVWxAISX0ubTUSxjoXU33H%2Bxk658Qyc7YcoWI6AH4w66CcgGfKUXpcSqvrq1A1M6futNr/OeRdmCWzG9kg1kvt%2BJGXWw5gXnOOACcBKSH2Neyi2Jxh2RcAPhKt%2B4nw%2BrN1GIqIFfz%2Bs3QZjX0wTRfK76fwdVfyZta8jYGw3SL3S%2BT8ICAj%2BPnA23zmSsS%2BQ5NQIvogwOBoWryHWNznFsnYrLLZC6mec4nA2H6PiE7DsZYzFS51f%2BSOcjSg42ykGFSxaUPo2xGYNOGf7EekEDancKwMVGsElCMUnAAg0ggvSv/sFZ/MwGn4LjO2e/v27YOzNbkFrsWFVIdY3pC8LX4K1W8EBhlCcAgq9oMyPYezT7nk6QSSVShwz4LNqwdm%2BGA3/HYzt3vez3PC6/auNWN%2BA7fJDaKt/hrV/mPwJBwDB34eAf4TkUVJRDKtF0b86TVWxatGvOnVWsULwULEstiPWN2K7PCQl1OyDHiZ9rDBYBgpTT5l7YeyTbkEKfQsnSHVs36sawUUDr6EEZ/MxGt7Qd8hLrilIrgorVkKom9GSh6VD3pae104SS7ADEPC/JXh8DKmuJYiTD9kJk42AFMhDmCwE9IcxxPpmjMmFaKuL%2BxJqAtOc9yg4BxTWVlK1nigeIGd5zz/ElS/oiwxxZIKeDBqxvimtUBfD2P/JfOc0YiVviBRVS0KqVSi/TruI8vIEvYsoJxH0zmgj1t/DdvlhtNUXpzyyHJg1VxgF55Gkpsw97lqrL2iqDrWgp6g6uaodoXi3aCHWt6QV6pJpb3l5MYtYnM0jekOMIdV1KFS1Bt5Cq5OoBD2lTsqszwgGhWTSei3G5CK01YUw9r%2BcY3Zd3RAFZzkHBgBlNsHYp0hidYL%2Bzc6dqE5vdn1jlino2x2EWkFCqAl0JZZ3N75PeS/Piyo%2BtDp7UQNjUwt6jVivQUsuTAlFMC87Az3WY9XRja/CPc//jCrENt0zJGJ9K1ryILTVBaUQagI9F/rVy42vdr4va1Ws0h7oWRUzifcxxPr7aMnD0VZfKPSWlxd9V5B6c%2BOnCdLqDM1ODNJxPgzNrjqur3gfh9K3oSWXoK0%2BD2OfLzvFSfQlVh3c%2BKqnYKbQm9BlCPWsyEZoCaXXoSWXYFx9DsY%2BV1V6kxi45t2LG5%2BWd1%2BTxlOYPQSXKdSzovcQbBDrdWjJRSmhfu8lPwBg1tqBTsh4fBqUuc/5YQE/FCPhlRgkDKS%2BBgxvrsUaqgm01SXQ5rFaTbkY%2BzS0eQyhOBJKb4TUV5cqyPMgE7GMfRotuZDgcSGa0Rpwtn/fq7R5FIJ/AHVZU55gDNo8DsE/6DuRadDmfrTV5TD2Wd%2BpAEgavYTipGzbv6p247V5CG11KQBN8Ex3WLQwFp%2BBcXUujP2d73QmocxdGIvPrgWpOPsLNIILMBqtRyiWZt9XWLUbH%2Bub0FZfInmmCyxaGI/PgjY/g7XbMBafXAtyKXMPxuNPo7OhrA8wticawYqUUMeDYWcAOTasVurGpxIs1jejrS4heGZRjGE8PhPa/HTykyly%2BVuCrcxPMB6fDZ8nYjC2OxrB59CMNiIUJ4Bhl2k/z7ET2o8bH%2Bvvoa0uRtXDosUYxuLl0OZns39mt2EsXlrKPOggJJXqTPg6t4exPdAIPotmdDdCcfJkhZqJXFvsfbnxSeWqUnONYTxeDm1%2B3vMKa1/BWHx8pZVLmbswHn8KPkjF2J6Igs%2BkFeoUMDT7Xp%2B7d0MlbnwXbZ9orvLJNSHU%2B5Fq8lr7CsbiEyvRXAmpzkPVwx9jeyAKzkMzXI9ILJ815PVCbmL5dOPLFvSdQj3zPRUIeh9CnbHdEAWfRjPcgEicltu7K9RtpnQ3vo9/Wp6gny3Us6JMQV%2B1UGd4EyLxSTSjjYjE6YXN4ELE8r02nlrQ9xPqmWOUIOirFOqMvQVRcA6ajbsRBWeB4U1O8Qr3x/K9Np5O0A8W6llBKeirEuqMvQWROAvNcCMi8Y9g2JUkbmFilerGZyxgroI%2Bj1DPHJNA0Fch1BNCnZloqOCT5POfTh396rA2vqigLyLUM8d2EPRlC3WGXRGJM5K3vOBTJF0Pu8GJWKW58Tm3NOUX9MWFelYUEfRlCnWGnRCJZYkoD84FY3uQP6MTjj1I67M2PqugpxDqWZFH0Jcl1Bl2QSiWoRndjSg4v7QKNRPOzW3rtDZ%2BsKCnE%2BpZkUXQlyHUGXZFKE5CM9qIRnA%2BGNuNLHYWkHRNJnfjHTZh9hL0ZQj1rOgn6KmFelKhTkQzWo9G8PnSh7xeICFWHdbGT4syQ9CXKdSzopugpxXqowjFCWhGG9AIvgDG9iKIWRyZVpBmgbFPoiWPgns5jxDwv4Ey9zrnFIpj0Ag%2Bm1Yqf6TqBGO7YzS8AcZuIdJUEUJxNCJxqncydYKsHTdn%2B2HnhnsTEGNfQFtdRJARoM1j0ObxGrSvnIK1r0Cbx1JB766pQnEMlNmIWN/oHKsRXIhQLHWOA9ToZApjN6OtVqAlF0Kbh5zjTexkEfyD3nfVTGFq1w/VDiTG6nAo1Wx4J5axz6OtLkBLLkas14JCxM7ce%2BdzH%2BAUZu9TJNkzaf0eStUL3oiVDHkrMCaPSE8zpTl0sheJfLdi7E4iml3ePg6lGoTKiWXsi2mFOgyxXkt6YvygzaS%2BWjH2H/Zo%2BlJUdShVVlRGrIkK1ZIHpxWK9jDvrB1Zqm3FmLV7DUUnneRQKgpIvdr5C186sTpFeaKh6JeB5K1E1WyTz1%2BJXAV9KI4l0VpTh1IVR2nEKkOUd0NR7VSuoC%2BundwE/QgicUrBe6dD6lVwGVXIiVWWKO8GV3KUJejdyOEm6JM3RIrD1remv79iICNWmaK8G6iGM2pBT%2BNPFRf0DDun52u7Q%2BrrUbQwOBOrbFHeDdQCnCYedSvL4vECsZioam1BrG8tdG9hYlUhyruhLMvArQKW18qySAVk8O/G5yZWVaK8G8o2OYtptvJbWRbRbL7d%2BMzEqlKUd0NV0zJ5yVtNK8v85PXtxg8kVtWivBuqbs%2BYdbittpVl/uHWpxvfk1g%2BRHk3%2BDq0qP9zfZ3Ymve5/tz4WcTyJcq7wfcxa90rpf8zpvNUSl9u/CSxfIrybvC9GmF6HhPk8tNzvhuyazs/bjzTZrON9XVQ%2BnYv%2BqkbBP8ARoKv12RxXoKpDsX16eQMaBi7GZy9s%2B9VFm%2BgJRd0Pbs5LxJCHzfwOu5TlM9Khs3DSLgSAT8MFi/7TmcajN3ipYNff0hYu23gVT7ceO5LlE%2BBgbP5GAmvQjO6HQE/BBaveWvF2A0Tm0l9ta3shqmNt49kur5qN97j0mQGzvbHSHgFmtG6WVv1fbRi7IaZm0mrb1vZDfk33lbtxnshVkKoK9GM1iDgCzBri366Ia3KVozd0GszaVVtK7vBZeNtlW58pcTibL90yLslrVA9dk93NAXx1Vt90GZSH33oXTfeVunGV0KsCVHejNamhIpy3V91b/WsXV%2Bq7UNP0yGnKje%2BRGLNFuUu/R2q6q2et%2BtLFYKetkNONW58CcTqL8pdULagL9r1pVxBT98hpwo3npRYA0V5VvTpJlGWoHft%2BlKGoC%2BvQ075bjwJsTKL8qwY0NGPWtBTdX2hFPRld8gpe228Y6tIN1HuAipBT92ekUbQl9/Ksmw3vgCxaEW5C1wFfVntGV0EfZWtLMt043Od/lWWKHdBUUFfdh/1YoK%2B2laWZbrxGU9YJRLlWZGzFVxeQV/VgUd5BL2vVpZlufF9iUUuyrMiZztuILugr/rAoyyC3mcry7Lc%2BK7E8inKXTBI0Ps6mbS/oC9fqA9CGW58B7HqI8pd0EvQ%2Bz6ZtJugr1Ko9we9G8/rKspdMFPQ%2BzyZtBPTBX31Pef7gdqNZ9vbH7UBPxBgYSKaO/VNt38jw2fd7s3zGSJMc3M7n2E7/hzwGWO7IxRHQOobAYznunf2ZxLaPgxtfj0z2dwIxYkI%2BIeg7aPd/485Pkv6uh8LitFFmweh7S8L5zLxGWO7gL0%2B/m6SdtwU4OxtCMVyBGIhGEZ9p5MihjI/glSrMRJejpZcQhBToBndBs7e4xxJqpXgfH8E/MMEedHBe3NbAOBsbzSCS9GM7kAoPl4TUhko80O05GKMx/8EY59OD6VaQBB7xqFUjpDqSvge5meCrM97EUxUqFAs8Z1KBySUuRNSrYSxm2f8LDmUSplNcJ1sVuZOGPsUONvXKQ4AGPufUOaBWlUtT0uT345GcBma0e0IxcdRD1KNQ5n1aMklGI/P60KqBIIfgIAfRPJEqa4iiZPE%2BgqcDiEiRqW/Uc72QShOQSgOB2ox3AFJhdoIqVZnnhaKguVQ8l647nBS5j4Y%2B1tw9l6nOABg7DNQ5i4E/GDnWBSoaGny29AILsNo9AOE4mjUg1RxqqE%2BhvH4/FxzjZy9FwH/O4IcFMmhVBNIdFs9qlapFYuzvRGK0xGKI1Af995AmQ2QahWM/T2K/iKi4Gwo%2BRMAsVM2ytwHbR%2BHYAc4xQEmtNaPEPDDnGO5opSKNVGhmtGmtELVgVQSymxASx6aVqhn4fLt5mw%2BAv73BHnFiNUqp1ymYCHVN1GHN0TSisXZ2xGKZQjFIgANytAOGIcym9IK9Qxp5Cg4F0reDVdSJFrrN%2BAkVeu3UGYTAv5R51guIFqavE/qQ/0wfcurA6lkqqGOwnj8GXJSAQBn7yKaAlOQahUAQxALkGo1fLdOcKpYdXfKq9iHGAVnQMk74UoKZe6BsU8SvSE%2BAWXuSxcS%2BEGhijUsTnkV4GxfomHHQKqrCeIkSA5ud3uxcEGuijV8TnkVYIiCU9Oq5fqGeC%2BMfQKc7e%2BclbFPQ5l7vK1Wybg0eXid8iqQzCHSDDvJvB8NpLoCVLotL/oyZK445VUgCpZBybvgujpVmQehza8g%2BPudczL2OSiz0Yuv1WNp8txyyqsAZ%2B9BwA8kiKQQa0o3/hvw0W5pWsWay055FYiCs9Kq5aq1HoA2v4Dgf%2BWck7HPQOk7EIhFzrHygAM7hlNeBTh7N9EksEKsrwOZG6%2BvR9W%2BFq%2BfKAe0eaQWonwCDDtlbsEdBeeAwndW5n5o80vnOABg7O%2Bg9I9JYmUFr49TPgVtfl6KU54XCaGOw2i0Ho3g4kz3cLYPkVjWqdYicuP1alR6oFZlT8qDAhtWaTGKUCzFaLQBjeAicPbWXHdHwemgqP7KPABtf%2BMcBwCMfQrK3EUSKwvqSSxviBCK47BTtBGN4EJwtnehKJy9C4FYSJCPIfa1rkFVWutPxALAMJoS6h40govA2F7OESNxKigkhjYPQpvHneMAgLHPQplqtNYOTawJUd6MNqaEcm/pMwHO5iEQFDt6AKm/RhIHQDofWb6vVU9ilewqzBTl7hWqO5KqNeIcR5uHoc2jgy/MAGM3Q5nbSWL1Qz2JVZp4dxPlecHZPKI5RA1J6sZfi7JXPtSTWOSgEeWFnhycAQrDWZufkvV5MPY5KF1u1ZrTxKIX5fnB2TsQCBpfK3HQqdz4cn2tOUmsMkV5EUTiLFB0QdTmAWjzH%2B4JIXlDjPUdJLG6oZ7EKvilrEqU5wVnf4lQLCaIZFOtRePGxxnPHiyCehIrt3ivVpQXQShOA53W%2BpV7Qkh9rZLmEOtJrMzwJ8rzIlk0eThBJAupv0oQJ0FSAend%2BKEkVh1EeRGEYhlofK1HoM0v3BNCcsh8rDeQxOrEUBGrbqI8Lzh7B0KSOUSQVq1YXwPq3dP1JNYM8V5XUV4EoTiVZLucNo9Bm4cJMkq6Hcd9zh4sgnoSa1K811%2BU5wWtr0XnxicrVul8rXoSC0Ao/mEoRHkR0L0hPgxtafrDG7sZsV5PEgsA/h8mgptFNsAk2gAAAABJRU5ErkJggg%3D%3D' # pylint: disable=line-too-long


class AuditInvalidProfilePictureJobTests(job_test_utils.JobTestBase):
    """Fetch invalid profile pictures data."""

    JOB_CLASS = user_settings_profile_picture_jobs.AuditInvalidProfilePictureJob

    def setUp(self) -> None:
        super().setUp()

        self.user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_1',
            email='test_1@example.com',
            username='test_1',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=user_services.DEFAULT_IDENTICON_DATA_URL
        )

        self.user_2 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_2',
            email='test_2@example.com',
            username='test_2',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_get_invalid_image_dimension_data(self) -> None:
        self.put_multi([self.user_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL INVALID IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The username is test_1 and the invalid image details '
                    'are [\'wrong dimensions - height = 76 and width = 76\'].'
                )
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL USERS WITH VALID USERNAME SUCCESS: 1'
            )
        ])

    def test_get_invalid_image_base64_data(self) -> None:
        self.put_multi([self.user_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL INVALID IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The username is test_2 and the invalid image details '
                    'are [\'Image is not base64 having value - None\'].'
                )
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL USERS WITH VALID USERNAME SUCCESS: 1'
            )
        ])

    def test_ignore_valid_images(self) -> None:
        self.user_1.profile_picture_data_url = VALID_IMAGE
        self.put_multi([self.user_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL USERS WITH VALID USERNAME SUCCESS: 1'
            )
        ])


class FixInvalidProfilePictureJobTests(job_test_utils.JobTestBase):
    """Tests to check the fixing of invalid profile picture."""

    JOB_CLASS = user_settings_profile_picture_jobs.FixInvalidProfilePictureJob

    def setUp(self) -> None:
        super().setUp()

        self.user_3 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_3',
            email='test_3@example.com',
            username='test_3',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=VALID_IMAGE
        )

        self.user_4 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_4',
            email='test_4@example.com',
            username='test_4',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
        )

        self.user_5 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_5',
            email='test_5@example.com',
            username='test_5',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=user_services.DEFAULT_IDENTICON_DATA_URL
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_iterate_user_model_with_valid_profile_picture(self) -> None:
        self.put_multi([self.user_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED SUCCESS: 1'
            )
        ])

        migrated_user_model_1 = (
            user_models.UserSettingsModel.get(self.user_3.id)
        )

        self.assertEqual(
            migrated_user_model_1.profile_picture_data_url, VALID_IMAGE
        )

    def test_update_user_model_with_invalid_profile_picture(self) -> None:
        self.put_multi([self.user_4])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED SUCCESS: 1'
            )
        ])

        migrated_user_model_2 = (
            user_models.UserSettingsModel.get(self.user_4.id)
        )

        self.assertEqual(
            migrated_user_model_2.profile_picture_data_url,
            user_services.fetch_gravatar(migrated_user_model_2.email)
        )

    def test_default_profile_picture(self) -> None:
        self.put_multi([self.user_5])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED SUCCESS: 1'
            )
        ])

    def test_default_profile_picture_report(self) -> None:
        self.put_multi([self.user_5])
        with self.swap_to_always_return(
            image_services, 'get_image_dimensions',
            (76, 76)
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='USER MODELS ITERATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='DEFAULT PROFILE PICTURE SUCCESS: 1'
                )
            ])

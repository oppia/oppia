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

"""Tests for stor_profile_images_to_gcs_jobs"""

from __future__ import annotations

import io

from core import feconf
from core import utils
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import store_profile_images_to_gcs_jobs
from core.jobs.types import job_run_result
from core.platform import models

from PIL import Image

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

app_identity_services = models.Registry.import_app_identity_services()
storage_services = models.Registry.import_storage_services()

VALID_IMAGE = 'data:image/png;base64,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' # pylint: disable=line-too-long
INVALID_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAg%0AAElEQVR4nO2d6XfcxtXmnwLQC9lNtihSEneZlCxRsmXZmXjJa8%2BMj08mf%2B6c9%2BtMTpJ3Ejtx4kQ2%0ALWsjRcniIkoURXHpfUHNh0IBhUIBKKA3UnGdI5F8ujYUCrd%2BuF24ILZtUwAghIBSCvn3YaSTqo2x%0AUcPtCwBff5JolXoHozkjVVlZ%2B8%2BvDwHi9ZNSCgICCv9YDUKzTILLl3Lo2BQ/v2j0pL7f3CxiqmT5%0AxkCeB7qaxT8Qf4q/U0p9uq4mTtKk2u5BEx2awUTRO0i5Xzpao2nj7w8q%2BO%2B3xmCZycrKae%2Bw7U0q%0ACoAI4wZFHX3SLBNYuJjDtbkcRvMmHmzW/OctRRumAfzmZhEXzmWC%2BVKOmQUgdAZ2c3XzlEazbWBt%0Au45PrhdCraeOtv68jqNKG5t7DSzP5Lrq04PNGigoCJx5RQkocT6nABsCwRL0WMuYBIsXc7g6l0Mh%0Abwb6l7YN0yD4zJlUaY2ISguaBKHD3UyUrhIBdvdbOJrvoFQwU7XfaNl48rwBUODxTgOLF3OwzHTH%0A8%2BJNC29OOuwqpxR8/HyWgFuxHmuWwZa8q3M5d0lX9TlNG6YBfHajiAslqyfnXNTciaWyUrImVhCl%0Aqcom0QDABvBoq45PbxS12xW1jecNdGwAhKBa72Brr4Hl2Xyi4%2BBpfbvh/UHY5PKtLgTgNsM9cV1q%0ABgEuT3tLXmSfQRO3YZpglqpk9cxKiZql4ir596Qpitl0NVBgZ7%2BJo0obpYIV2ieV1mhRPN6pg1dE%0ACbC2U8fipRwsM/oYZW33dROvj1tsLhHi1kdAXY2CwlsVaVcah/Jr83mMCDcdUX0GTd5GGFPpjkuc%0AZqksiNvfYS2FAhM83PRbLZ3kWiuwOgCg1qB49rKBK5LViko2pVjfaQAg8IZFnJhcIQChvmUmqZYx%0AiQ/KtROVLsyYdqNAvZcpwFhhEycpRHe1FBKw5QbA7kELh%2BU2zjl3iHEmud608XS34ZZ3xhQAuyF4%0AZzoH0yDKsrL26rCN10ct/8EJ9Yka6zZNrFkWweLFvMtQScfL%2BUCrXYsvf86k6vY8RWnKu0JVku8C%0A43wZKhjU1RgM8M4y1vpkpaDsi6w93qmj1aagRLxmGV3UmsznI94hhtVnU4qHmzV%2BdM7y569P1IQV%0AXEszDfignI9fqlWCkNh2LTMI6onaSKidTngnzqA4I/PioIWjCrtDjGq30bLx88umc/cjJUdb36nj%0AssNaUcexf9jCwUnHV1ZVn1DSD8wRWtYy8Pn7RdcK64xpqEYkeFe0axr9BXWVZhBCoiE6ReoF/DnT%0ADKCA7VituLbWtpi14kXd1UC4hGt1xlpx7d99WguUVdXnc2BTPa3RsvGXH09w/1kNjaaNrlNEu5yp%0ALvaZqeTku%2B2Ql6hu4b2bCeZ8AOp8tHvQwmGlo84HoNG08exlUygLt6ysPd5peBNQkV6%2BUbQVUZ/v%0AODS1tg083Krj93eO2QRr%2BfujayFceFe0YZoeqPfLMoVphjwpVBMqrfOsG%2BYCpQClIJRdetSmWNuu%0Ah7a3/ryOVsd2y4llZa3a6GBzrxHa/webtdCyYRr7kVxrtW083KzhD3eOcf/nGuqSBdMac0Ub7vIn%0AWapB8BWllFmsMOsUVUHYBOyJRp2rjxBQQsBAmTBvfKUTmIjNNmVedicfZzSxrKyJVkusb/egiTcn%0AnciyKo0DdFqt0bLxcMuZYM9qaLa88RDHJqDxfgj1WSbxgXpo2T5q7lIocpbMXGk0sd7EGoHLC%2B6d%0AjiM92qoHyop%2BK5fQiL%2BsrFUbNrb2gqy1vt0A/04wSX3OddC11mxTPHKWyAfPGDPysZEZ2Bt3rz7P%0AUlm%2BfKqy/dQSwfsgNUKIY%2BL9nz/fb%2BGo0nb/dr3sUj5CSay2tlMXHKncy97WKhvUHE98j7RWm1mw%0A//PdUQDyg2zDysqgPsxzeGbg3dOAh5veHSK3VnFgrdK4Nx4Qvex6ZVVaEnjvFeRzeB8mqKu0MwPv%0AIjBzb7zoZU8K2/zvte06Ojb1vOwJyvYC3nW1KMgfNqirNFJvdmjWCrEYXSTu%2BEyjPdys48FWDQSe%0AR5n9dAacEMxNZlDIG1jfqbuaKp%2BO9sHyKHb2m3h90klcVtTAj2MAWi5jYGkmB0qBCyXLZarTkqyv%0A75bxxa0ichnDZ8rCvOLa3nMnpdK8s6cAZgbWz1%2B3vE%2BICrb1tZ9%2BroE321V9xO1237V8lqBUMDE9%0AkYFh%2BMdQHNthadZxpY2v757g8/fHkM8G94aLaSjwLs4uOIAL9FSjVC9ftOYAOPqpAeMFCysLecxN%0AZd1%2BKB2nGO45tEAIjqs2vrlXxufvFd3JFdZZ3dQNBAa%2BOoFw5RKcSg0Qt9b0XisVTFybz2N2KgND%0A4aoJlB6yZoGyLyyPyu3A5ApL8tIna%2BJP1WdxGhAChYq%2BnCatH%2Blc0cL1hTxmzmfciRbnzD4NyWJg%0AyCbXcaWDb346wRe3xpC1ok9ymN4Tja9%2BxL8dBBCM2SnS4H4mula7084VTFxfyGP6fAZG0DCc%2BmSx%0AhZyAD9NR1UYvgJ6ntBqfUMExlbeIvF1aadTEyuKIz0KdJijXhncuuDe0lOC42nGBPpfxL3dyehvg%0AvTfavweU62qWnxo9YPQDfXJb/Au862lnDcp1NRfeVSkM6H%2BB9%2B7h/axCuW7ywTv3dAMAoQAFDQC9%0AmH6Bd3/SBfWcRXBjkYH525qMgHfQ%2BYs/KEDhAX2z7VkpQvq4bQbqE8k/OW0a/6erNds2vn1QwV/u%0AlvHqqB2w/PJYnEXN24/lwjsfC%2Br9pHCBXt7h2Hd4l8xCui0tg9CSbZEBBV4ftfHNT2X8%2BccTvDps%0AK5fXYbNSWs0Ig3dC2E5JNhOZxoE%2BsHVDkXoG78QviabgNGls7Egq7fUxY9mv75ax96YFW3Eb75Y%2B%0AI1okvANBjtAB%2Bl/gPV3aP2rhm%2BM2pkoWrs3ncfGU7VhIkmLhnUgATSllk6ufQP%2BWw3uURgG8Ompj%0A/6iMyXF253gWJ5gWvPPkesMJ%2B%2BI6Cujdun6B91QaALw%2BbuGv98pnEvK14Z3lcT8EKO0r0L/t8P62%0AQ34ieAeI75ElIBzof4H33mtnCfKta/O5wFcJXi7416TgqulqBydtx4vcPbxPlSysIB9cixMmCmD/%0AqI0LpT4ziqqfEdpRpYN8liCXMRKX5en1SRvEYNr%2BcVt9noagGQYwfT4LK581AtFX0qQXb1o4rnYw%0APhqM7ZQU3scLpi96L%2BBdCUl2SaxuVHFw3Mb8VAbLs/me7LoI03TTcaWDpy8ayGWI8uYnaXq4WcfD%0ArVrXNw3dagaA6fMZXF/IY3zUgLHuPFunAvAk2vp2Aw83gw%2BTJoX3Zpti%2B1XTp8knUkdb3ajh6Ysm%0AKIDVJzU82W1ol02j6QCuhw02jqqdwM1P0vrcpZL1qG83EnHa9EQG/%2BP2GD69UcC5IjMsFo%2B%2BcmU2%0AH%2Bi4nMK03ddN7B%2B1QAhxQzumfUJnbavuC%2Bfodj8Bs61uVPF0t%2BkxEQVWN6oAKJZn8onr0%2BJCRI/Z%0AUaXNJlLLBt%2BJJW5PUu3a1WqDApQ6m3D4R1QIbNQnjQC4cC6DG4sjOD8eRA0DxIu%2BEmfaVY5M/qAn%0AP2DxYVLdycQ1N2IMUeejNDrmg00pVp8wSyVabX4uVjc8y6VTXxJN5djlvx9VPOsEfoPk9IlbsXrT%0A1q4vOH7wHa/cRi81NqEsfH6riP94r4iJMX/gXf7TAqWo1DvKWOiq5UpOrw7b2BfCKYqhHeVBkSeL%0ArK0/r6PZtp2r0D%2BIYr4w7ccnNTx5ro6jxdPqRhWg1MdcSdoI08TfRY1/U9FoCS4Z6foVv83ICRse%0AdNtQGgSVjehCIyCYKjGHrXwzpOqLAcfEPd5poN2Jvjrlg%2BLhFEXWojYL3JH06vMixqhT3JK0ulHF%0A0%2Bd1QOARQrj59jMKn4D9XgqPKx3XFeONUZCZCPGeN2gKcbuSLLdyfb3SCCGYKmXwH%2B8V8fl7Rd%2Bk%0AiuqfwRfOSoPFQo8ERamC10dtFk6RCn4I4oV2lMtG3QzwGAyiGZbz8RMqaxzUwSeSeGEoNBHodduI%0A0%2BSxUvr3CCLdCOK3GXFjrzqpOm0k0SaKJn5zs4gvbhVxaSIDw9C/ETO4P4KAYG2njnYnnLPkCu4%2B%0ArbF%2BEKFHVB3aMZKtfBFjSOCAxRMpawzURW5y%2BiPUEaatblTxZLce24aOJv595DwE3GjarG2nXWeK%0AR2oc6GWHc9gJjKsvsUYIzhVNfHajgC8/HHeeEtKbTKJmiJAmxudUJZExXr5hVokXdyt1fvDQjjrw%0A7r1FAm4dcfAeB%2Bq6Wq%2BAXgfUeSfitCRA7x5LD0B9vGDik5UC/uftMd/u1qSsRyllX0K7DAUv%2BooK%0ACMUZ%2BWCz5mMv%2BZ/thHYUG1XBe6NF8XS34ec4Cd5lCyGCelQfchmCW0sjMAxE5lvdqAaYK6zdMA2A%0Au%2Buj0bLd8Qy0B4qlmZwv2p4qnwf9ar6VNbmNNJplsJdBEcWxhbUbprnwziurN73338mDxwvxcIoE%0AMvgR18SCBEM7qmb34x0WO9RXVpGSgnouY%2BDz98dwZTaHj68XYBr9BXpdUF%2BezeOD5RFf2KEwiE4C%0A9L0A9dfHbfz1Xhnf/FTG/lE70Iaq3TDNhXfqNALKYqGLke7k9dN9aZE3tb0/iNNhABTUF9pRhvdm%0Am7K47G5D8fCuA%2BpZi%2BCLW0X3zWGzk1l8slIQlsTeAr0uqC/P5HB7eQQGIf732fQA6KPaTaJRSvHK%0A2U3x13tlL9Z9SLta8A6nLTHSnVyAe9l5ZhW8A04EFxA8f81CO6qYaW2rjmZLmJQx8K4D6vw7OPHF%0ATpRSzExm8dmNoju5VGVpCqDXBfWl6Rw%2BvFrw1SVOrqiyUUAv5lOVTatRyl7%2B%2BecfT/C3%2B2UcHLfd%0A85cY3kE9qFXFQpe97NwTKx6ksBK6SeWN5152X/9C4F0X1HMZgs/fK2J81AhMYkopLk1Y%2BHSlAIME%0Ay4r16QK9LqgvzWTx4dVRt5z40zLZiygvTlipgN7tdw/gPUx7ecAm2LcPKnhz0lYylXxsAXjnv3Nv%0AvJi4lz0KhFX/uDdenCzcy67KL8O7Lqh//l4RJek1IrLFmT6fwccrha6BnvOPDqjfvjIaCb3yCynT%0AAH0v4D1KsynF7usm/t%2BPJ/jHwwoOy51A%2B%2BKxBeDdM2nE541Xednj4J3DoeyN93nZhXwqeE8C6uMF%0AMzCR%2BMGK2sz5TFdAL55gHVCXk4qPuOVKC/S9gHcdjVL2Hsk//3iC7x5VcFz1v8EjEt45fvA3kxIS%0A7mV3zpxPI8ISyTXRGy962eV8ohlOA%2Bo6sA2kB3oX1MXt2DGgrgu93QB9VF/6odk2xc5%2BC3/64QT/%0AXKuiXPOHC1fCu1sX8bzxYV72OHjnGvfGy152OR/XVjeqePoiHahHwbaoJQV6Dur1JvXl0wF13m6c%0Alhzok3v3e6lRG9h%2B1cQf7hzjznoVJ1W2RJL//ZcD/yUatNK4NGHh5Zt28IOEiRBgqmTh1WF0XZPj%0AFrsLianv1tIIrszmnLr5wfqXCB3tznoVm3uC20ORTAOYGLMC/h03OWOXyxD87tcl32vrxImtqx1X%0AOviv1WOf20d1fkwD/jwh%2BQalFUcNfHqjqHhgVXE2Xxy0gmKKRCmw9ya%2BrgslC/NTGaw%2BqfkmgJzu%0APathNG9g5nzGzSfeIOho69uNyK%2BxAI9/xkdNfHOvjKNy%2BOSqNym%2BvV/GZzeLMI3gXaD4e5hWa9j4%0A%2B8Oy%2BntbQZqdzKI4Yvi%2B4VDlG4Q2mjdxdTaHy5eysEwSDe86oK4D74k1wL2bUoE11zo28N3Dim/i%0A68A719a267j3rBbZhvjCI/HOMwpwXx218e2Dsm/Lt5iitFqT4pufyijXOpFtzExm8fGKdAMyAHiX%0AtXzWwK2lUXz1EfuWI2OxnbCR8A5KPeAKAXWVFgbluhoXl2dyuH1lJBLebZvi7w8r7lKtC%2B/r2w3c%0Af1YP1Ce2Ybp3at5EEn1lYr/lK3rvsIVv7zOrowvvjRbF13dPcFLvREK06I8LpAHBe9YycPNyHr/9%0Ab%2BN4dz6PjLCdXAveQZ3HVENAXRfek2jigSzP5HH7yijvcQCsQZg749sHZbw4aMXCO7dUP/1cE9r0%0A1wfqvZlUft0tn1xf3Bpzn0gKA9xXhy387b63pEVNsGrDxp9/PEGlbkcC8/T5DD67UfTtjRokvGct%0AgpuLI/hfvy7h%2BsIIso6Fko8t1PPuLY2eFRGXS55JpfFy3ugl00D8XMRv3YmYRyxL2IH/42EFuwee%0AA1dMXFvbruP%2Bs7qvrFyf%2BMIjsayYuJvDs1zEZ225tn/U9k0uFV9V6x18c5dNKrGsXN%2BM7CIR%2By21%0A22stlyG4vsgs1MriCDLOVvcwTtSC94EnGjwBy7Ps6ZoooO9Q4LtHFXx8vaAE%2BvXtBu5xSxWSOKhP%0AOV7wKPDPWgSfvz/mAX0I4L5ylkUV0NcazC92UlO8llgC9Y%2Bve8uf6oSGle1Gy2UMvDOdw/JMzo1F%0Aq/oGQe7LqYX3wLFS9gBEWqBPCupi2aibgW6APimoGwYCfRHPWS%2BhPGMRXJvP46uPxnHzch4juWSP%0Ap51qeFcBeBqgTwvqYrtRWhqg7wbUVawW1W4SzTAIrszm8NtflfD%2B0qgvYrbuTQghBFYUvPsmGoUw%0A%2BZxcIRoIg3K3wYSafMAygLOHTgl7lIvnd5cIJ78D9AsXst4uCkU%2BUI%2BpphSgruvJz2cZ0H99t4zj%0AascZT%2Bpem3yMOdDXGrYA6sF8AMX0%2BQybVCGvphDhXS6bRpufyuLW0qjPOkVZpSjtTMC72z0BonWB%0AfnOv6dPkfDqgrqNRSpHLGNpAnwbUVUzjHovURhpt77CNn180Uj88eybhXQXROkAflZKAepzGf9cF%0A%2BihNB9T7Ae/NFsWDzRqevmAPLy/N5NygJUkn15mCdxVE6wC9SksD6lEaP35AH%2BjTgrpK6yW8N1oU%0ADzbr%2BOOdY6xt19HqJI9VcebgPS3Q9wrUwzRxYJMAfRpQ7ye8i1q9RXH/WR1/cCaY6iuqsP6des87%0A72gcROt46OM86km23MiaanDzWUPLQw8EPeq6JzCsvl5pAFBv2PjpaQ3/959HeLxTR7sTP8HOLLyr%0AtDig7xWoq7Qw3tABel1Q7ze8x2mNFtuX98fvj7HxvB6IUPTWwHsSoO8lqEfBu0qLAvq0oD4oz7tK%0Aq9Q7WN2oYuN5A1fn8li8mIVp%2BPty5uFdB%2Bh7Depx8K7SVECfFtRVWi/hXVer1G2sblTxpx%2BO8exl%0AEzb1%2BvdWwHsU0PcD1HXgXaWJQN8NqA8K3nW1cs3G94%2Br%2BOP3x%2B6mSeOrj8Z8L2E8q/Cu0ibHLUyM%0AWRgfNROXTarpTohchmBy3GJRXBKC%2BjDgPQnkl6sd/Gutiv/8%2BhBWqWDh0xtFHJbbeLRVx4uDFjNp%0AbueFA5EOaBDwLg6myDhxmvgkixctj6SuL04TuS1Msyl7RvLpC76/nmB5JqdVNkwLjKFT77A1i3e4%0A5ISwOap08Girjt2DFmx7SCTfBbwTQgLhGVWhGJPU1y28859yKEsetnLJmVxJ65M1eQyHqRlyp0pC%0AjKS5C1nvubgzAu/yw6TEaUN%2B0HPQ8O49We1f1n58UsPT3Ubi%2BmStl1DeC82Q127%2B90TRwifXC/jy%0AwzHMTma8ZeoUw7v6YVJncknLo059STR5/MTkPXiLwFVugyqj3ETVp9LEMRw0vKs07yVNIQdQKpj4%0A9EYRX33EJhgxhBpOEbyHPUwK8HnPNPHFUlH1JdXCwPqHxxU3Qk4oCFOKHx77o9zoTjBlfadA820L%0AlNdt8e9SwcInKwV8eXsMc1NZdpvszgfqEaS3wgkjkExz6xXaFwFW1sSoL0Sog7r5/FpY5JaoNqI0%0APlbimMkRcnhp6iz9Ko1HuVHVF6a5x6fZxqA0SwTSqEHkSQX51AYgTK6uTxb1a1yXr1pKqRtJr%2BmA%0AurAoeyu1QvO/KdZrW9VGnKZisB%2Bf1FgwE1%2B7BEQwpSpNjEMvpkje4udQs41BaAGLJZ9s%2BSrhByNC%0A/uyFrKNLE4XBTWJNtFhyn0RNDM8I8SQTOAAXrR1X/DFDVW3oaqIV8QWI422KQBmlAb67xzjrlaqN%0AAWguvMuWS4chCCE4VzDxyfUCPrnhBcHwr4rpNLldXVBnI%2B9JOf6OGpHbhHy9AnqevJdDBe/FuZa1%0AiNCFYL40QC%2B3MWwtEt7lpDL5lTpz5//jYUWAuf7Cuy6oL03n8Ltfl9h3hBH5egH0gB6o55ytNDzK%0ATbdAryx7CjRteJe1cq2D7x9X8Yc7x/j5ZQOuL5VbIXEMEmpR8K4L6jw8oyV8V9gvoNcF9bDvCrsB%0AevdYItodhmao%2BCkK3v1fODbRsSkIBUiXjCJqYfDO46g3WzbAyzn/iPOTUi88I09iKEYxn1xWdK76%0A%2BqPoC9d8oO6rD269oBT5iN0NpoHIspzZZEzxwXtI2WFp2vDOLdSffmAWqsNNFJ%2BMBBDXml7Duy6o%0Ai%2BEZxeNx92O5oRiDZdMAvQ6oZ6VQlmJ9PGylYajL8r6FAX1Uu8PUYuG92rDxg7PkPXvZRKdDnVlE%0AxDng1/gyJ/6fUBP7ogvqS8IOUhVs82h5fHJ1C/S6oC6GspSPDWAxUcUdpGmAXm532JoS3rmFurNe%0Awe//dYynL5qwbec8EAL3jFC1hh7CexJQ//BqwT0W8bhE2HZDMXYJ9KKligN1MZRl2B2eGLYyCdAr%0A850CLbAUKqHcM0ZQedn75XlPCupM8y4Ot1pJ6wbo04B6nPec/0sD9G6/I/oyDI3Yzt6Ycs3G%2Bk4d%0A26%2BaXjwn8WTDufK9s%2BUOjEoLO6k62o3FEcxOZnzLH5/fYqJgTHV7ecRXXuUWUWkdG/j2fhmvDluR%0AbZSKlrufa5WH6PblEiw2mO9MjjmfJD1/3cR3jyqwfaEi/W2AENxeHkGjxcKkh%2BYbkkYqtTZ9uMUm%0AVId/NQPmnCeUrZzEmWGu5rJaiOacSAqaSpudzOLgpO3sp2JLgLfccjNJseSAujwZRGaM09odir/d%0AL2P/sKVsg2vjoyYmxy22/Mn5hLyMqcbcp3KS9EXUdg9a%2BO5hBb4tcW5/nDIACiOGLxS2Kh%2B/LwgG%0AwfXn09GyFnsHUlw%2BI5sxUCqYyFh8MIl/yAgcMBe0PsN7Psu28AbWSwm2y9UObNvPLkm95%2B0Oi1EV%0A1gbXRnIGxgumMp8Iri1en6%2Ba5NthylXbN6lUwGwYQD7rDy%2Bkynd5Oof33hmJzaej3b4yyrZRxeQz%0ALJPgymwev/t1CR8sj2AkTzyjRog70cJAvR/wzp7F8x70BPxgzdPeYTsQilHXU04pRa1J3fCMYW1Q%0ACkw7YB32UKwIrmLYyqSTidXhxPL6uRoJx/zB26lxKzbftbkcFi86gdO6gPLxUQPzF7J4dz4PEKIH%0A76bB9l//9ldsghVyhgPl8P5hcPAuh2IMg3c5FKMu09UathueMQzeAWB20u8KkB%2BKVYGrTVnYyuev%0Am6GgHqbxUJZRcCyGXXL7HdKXy5dyGMkZsEzg2nw%2BNJ%2BOtrLIrN5E0WR78yLKBjzvlskm2FcfjeP2%0A8igKOQPudgga9LKrtF553uV35MD5J3vP94WAZnGecsCJ%2BXmPRdJT1cc1%2BZ07PC3N5FwnbJgn2rZZ%0A2MpdwXKJPkKVtr7dwP2fa8r6uGYacN%2B5E%2Bd5NwibTLz%2By5eY1UrjUS8VTMyc95zL787nnYUqoefd%0AMoErs3l3go3kiHtJ%2B7zsKo2fxJSax87SW72I055wUrgmhmKMmrTVhu2EZ7Qj65sWHiZV1ccfioXb%0Af6EuR7M7FN89rGBXsFxhlurRVg33ntUi6zOFB291PO%2BXp9lE4nktk%2BDqXD6yjTDt%2BgKbSLyuiaKJ%0ASxOZ0LKxnnfLZIP421%2BVcHt5BPmc0Xd454n3w/MJmeKHTrue9OqwrYytzo%2BPh2cs86BnIm8K9fnf%0Aaxj/UGwU9NoUvrCV8rEBwVCWqvq4pbo4kVGymlyWs5Wc78pMDrkMSQTvpSJ7DlJu98ZiXhg2f1nt%0AbTMi5N%2B%2BMsLCCfYJ3uXj45OrG6BPCur8YdK4m4HlmTw%2BvFJAFMyGAX1SUL94zn83FuV5v3wph9G8%0A90Y0ntcwCN6dyyeC9%2BsLeZiGfwwIIThXtHCJf/caBu/8QMXfZV8LddZtBvnj%2BOCKCPk%2B89M1vMv9%0AYZPLSAX0aUGdt6vqi6gtTWedV8j564sD%2BqSgrlpO3WMRyloWwdU5/7OK4j8eWlsH3jlbhS3jN98Z%0A0YP3sEGUE7dgIuTz1Ct4VwF4UqDnuyLSgrrOzQAhxLerQgfo04C6CvydDvnKLl7MoZA3ffnEf6bp%0AWK04eAeDfzkUgFhXqWBi9nxGH955BfLJFycfA0JgaTrn3SUIZXsB76qJlwTo/2v1uGtQ19EopYmA%0APg2oqyyGXNaygKtzOWX/RO3ypRzj5Qh4Hy%2BYmJ3KKNsVteuL%2BUDZrva8A8DWqyb%2B%2BP0xVjccTkBy%0AUI%2BDd/67CNG6QO9%2BjdElqMdpPOkCvayJKQ7Uo3h44WIOozn1%2B21EzfVrKfrH08pCHkRRVq7vXMEM%0AeONT7Xm3KbC118Tv/3WMf65VcVITNsX1Cd5VEK0L9GFaUlCP0sS/dYA%2BDaiHXdxiWdWdYFjZKG/8%0A%2BKiBuams1sQmhAS88YngvdOh2Nxr4E8/HOOfaxXvDmtA8K7SdIFe1tKCukpTLRE6QJ8U1OPgnXvZ%0AdctGeeO5lz1qORU12Ruv9cBqx6bY2W9ifbuB40rbf7Yo35ngTa6kJyaghcC7fKVwjQM9D8UozU9Q%0A%2BOfsjBOe0ZTe%2BBDVRpSmsvQc6AEWtpJ9M0G8bzHcPjHNlN5ir6ovVKMUhkFcL3uSspcv5bC2XUe9%0AYbt9KRUtn5ddt7535/POA8wUvg1DsoWiFNh61WATqtpxTxDbIuP8RQi7yxI1pyG2ZifXVBYrrI9c%0A48z1zb2yM/mFiU%2BIW//0%2BQwD9RRtxGkiq/K0PMuWiNWNqlMIkplm39OKoB5VnxwtY/UAAAhOSURB%0AVEoD8XvZk5Tl3vifnnrvbxS97En6wr3xLw5aangHPCj/11oVxxX2yjN3OAbseRcPohug7xWoR8F7%0AUqBPA%2BqylpStZE30xod52XXr4954H7yrodxZmfhP9%2BoP18KgvNfwngToewnqcfCu0lRAnxTUw%2BA9%0AzMuuW5/ojQ/zsuvWx73xFsCgfOd1E2vbdRxXGZCzqSJAuZMGtW0GgO8EigwWp7HJVcTXd09wXLUx%0AO8mWP9kadtOGqOksOYQQLE1nAcqeQzQMP6jHlQ3TLItg8VI2cV8CS/ZMDvvHbeULRJPWd/OdEbbn%0A/fnrFo6rHQ9zxHLiiVfpcXlTaOfHLDSaNioNW90n6GmNlo3NvSaWZ3J%2BUE9ZX6%2B07f0m8lkDU%2BNW%0A1/UV8wYWLubQi/TsZQPVurR/OWX/3IcpupntSqDsMrU7wNZeA2s7ddTqfOuwAPiUnh7Np2Og2spC%0AHjcuj/Tk3DVa1Ln5kV4jnKJ/XUebCdPEn2k0cbvOB1dGfY48J5NzMMPX0u4f76WWFrZFTfViqbT9%0AIzTG1MigqqvJd5ndah2b4ucXDazvNNyHFU6V0aIUlPuuB6hxi9XL1GjZ7pti0/bPN7HEyRHn0OS6%0AShPr66UGAO0OxbOXDTzeaaAqPA0jLUwD13xzbIDaykIeK4vMEdtLnGm2qXvzk6Z/PsZyB0sxqcL0%0AuLy91MS/W2329dLjnQaqdY8JhjPB%2BLAOXltZ7L3F4qneZE%2BCH5fb0ifx/Tu18K5KqnZOBeT7dAxU%0A6yW8q7S0QH9q4V2lqTzgpwHy3xZ4V2lpgf7MwLtuP4YF%2BW8TvKtSUqA/c/CuO8E45K9t11kIJJ5X%0AGIdeam8bvKu0JECfOM57lD4Ii6WvARmLwDQIKLW9uxVpMHqjhW%2BH6bcG%2BMcp7rx0o%2BUy3ptiRaBX%0A9S9y20zULFZ9v6VaVQetUerf6gPXmvnXsp5q4H9KJ2YQmmIMgP5ZL//2JBnovf5ZspWKmrW67gbx%0AC9FBaZRSbL1qYm2rjpNaSEhJ0h%2BNkYU/DUrjKc05SqvlMmCT66cTd9OC3D9LLhSVkpjPflwtssmn%0AlMKmwPNXTTzYrLHnBkNhm/RNIw5hUAoXZgen6Z2PXmv5LNuexIFe7t%2BZhXdxq8%2BJBJNu3gFq/w7w%0ArtLCgP7MwbtNgR2HoY4q8fvbB6P9e8C7SgsD%2BjMD70OB8l/gXUtTAf2ph/dhQvkv8J4e6E8tvJ8G%0AKNfV/h3hXaWJQJ/6JU3iT1kTG0%2Bq2ZS9u/nRVh131ituLCv3WJzzedo0/qDnu/PeNuFuYqZbFsHS%0ATDY2Hx87%2BXwMS%2BMhPk8VvFPKHjTIWQQ3FvOYncy4b3G1bW8p4D%2BHA%2Brh8H5uzMLNyyMo123s7re6%0AgvLFiyzS8cuDlvOd5%2BmEd5WWy5Duo82oNJXl09FWN6rsRUROH8W3uM7xt7jyf7xdguFrzu/8Qc%2BV%0AhWD0FTefhmZZBO/O5fRDO2L4lkrWTs22Gf7CI7FKno%2B/xfXLD8e8qCY8o7gmDEmjoJgYMzHtPHRa%0AKpiYm4qPhR6mvXMpyyImAl6QtJiyac5RP7Wu3rAapSUB9dWNKp6%2BaDgnSwIIoY1zRQuf3ijiq4/G%0AhAAU/vyUDl7jD3oahnexvDuXBzG8h1N5Prd8iJZxrBQ/ZjcmQ0RZeaxOwwQbKrz7XngEyOASWrZU%0AYBPsy9tsghnGcOH9/LiJS%2Bf84RTPacRCV2nvzGR9kY4ppXhnmsW8Ogvwzv8NDd45qPOXO/rapur6%0A5KuiVDDx6Y0iDsvt4UE%2BIbg%2BP%2BJaK3Esrs3nsfta7FM0vDO2CkaMMQnw7nweq48rgbLyOJ0GeAeG%0A6Hlf3ai6L3VkrCCcLoXFiqqPQ/5hpYO17Tp291ve6aP99bxPjlu4NGG5E1/sX6lgYmYyg539lnAA%0AEEyeX1ueySNrkcAFCACLF7NY3677nkyKGpekONJrbSjwLoO6/%2BoLr0%2B2WrI2DMjnXwCHjcvKwohQ%0AJBzAsxbBldnwiDGmAVxbCA/teFrYimsDh3cZ1CkHdiAS3imlvrbCNMAP%2BefHzL7B%2B1TJwsVz0SF/%0AxoX4nFEAvjybc9/kFVbfwoUsCnkjUFbV7rC1gcF7GKj7%2BqcJ7zpaudbBxvMGDssdr40ewzu3VnEw%0AKz7soALwXNbA0nR4XHaumUYwtKOYX6cvbxW8R4K6VDYJvKu0k2rHfVNsx3mBQD/g/dJEBpPj3rue%0Ao8ZibMTEwoUstvaaSnhnvipDWVbWFi5ksbZdR6XW8WpQWO2wvgxKGwi8R4F6L%2BCdUopK3cbaNn9T%0ArFMXIX2Bd4M4XnYEL46w8bq2kMf2fhPUhs9M57MESzNeXHZVWTGZJrvb/P5xNXJchg3vfd82owPq%0AUfAu1ydrlXoHa1t1bO41vfjpfn9Az7WLExYmx61E4zI2YmDhQhabLxsQ0/JMDlmLRJaVtcVLWTza%0AqqPS6ETmG6bW120zDNSb7u00pUL%2BCC0O3kULtbnHrYBTBa%2BP9kcjBLi%2BMOI7bp1xIYRFFd7eb6LT%0AYdXnc2wZVOWNqs8gLGbDnfVqZL5haoGlUDUDxc/lvCrNdphKB9Tj4J33R4Tyte06tkQLJcwFGbZ7%0ArU1PZHB%2BzAwdA95XlTY2YmB%2BKovNPTYuV%2BfysEwSuNp16pt3WIv3I0nZQWg9h/fEoK7SFPA%2BKCiP%0A0gyDsZXc5yRX9bX5PHb2m8iYBEvTQWulW59JgOvzeVTqdmLrOQit5/CeFNTj4H2QUB6nTZ/PYKIo%0ARmNOfjUXR9irREoFE6bRnbWZm8rixZtW6r70U%2BspvKcFdZVWbdgDh/I47Yb0mFVawF1ZzCOXMQIn%0AJml9hkE952vKvvRL%2B/9WiFUz1yMl1gAAAABJRU5ErkJggg%3D%3D%0A' # pylint: disable=line-too-long


class StoreProfilePictureToGCSJobTests(job_test_utils.JobTestBase):
    """Tests for StoreProfilePictureToGCSJob."""

    JOB_CLASS = store_profile_images_to_gcs_jobs.StoreProfilePictureToGCSJob

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
            profile_picture_data_url=None
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_profile_picture_stored_to_gcs(self) -> None:
        self.put_multi([self.user_1, self.user_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES SUCCESS: 2'
            )
        ])

    def test_none_profile_picture_store_to_gcs(self) -> None:
        self.put_multi([self.user_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES SUCCESS: 1'
            )
        ])


class AuditProfilePictureFromGCSJobTests(job_test_utils.JobTestBase):
    """Tests for AuditProfilePictureFromGCSJob."""

    JOB_CLASS = store_profile_images_to_gcs_jobs.AuditProfilePictureFromGCSJob

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
            profile_picture_data_url=VALID_IMAGE
        )

        self.user_3 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_3',
            email='test_3@example.com',
            username='test_3',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=INVALID_IMAGE
        )

        self.user_4 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_4',
            email='test_4@example.com',
            username='test_4',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=None
        )

    def _get_webp_binary_data(self, png_binary: bytes) -> bytes:
        """Convert png binary data to webp binary data."""
        output = io.BytesIO()
        image = Image.open(io.BytesIO(png_binary)).convert('RGB')
        image.save(output, 'webp')
        return output.getvalue()

    def _push_file_to_gcs(self, username: str, data_url: str) -> None:
        """Push file to the fake gcs client."""
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        filepath_png = f'user/{username}/assets/profile_picture.png'
        filepath_webp = f'user/{username}/assets/profile_picture.webp'
        png_binary = utils.convert_data_url_to_binary(data_url, 'png')
        webp_binary = self._get_webp_binary_data(png_binary)
        storage_services.commit(bucket, filepath_png, png_binary, None)
        storage_services.commit(bucket, filepath_webp, webp_binary, None)

    def test_images_on_gcs_and_model_are_same(self) -> None:
        self.put_multi([self.user_1, self.user_2])
        self._push_file_to_gcs(
            'test_1', user_services.DEFAULT_IDENTICON_DATA_URL)
        self._push_file_to_gcs('test_2', VALID_IMAGE)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES ITERATED ON GCS SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES ITERATED ON GCS SUCCESS: 2'
            )
        ])

    def test_invalid_images_are_valid(self) -> None:
        self.put_multi([self.user_3])
        self._push_file_to_gcs('test_3', VALID_IMAGE)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES ITERATED ON GCS SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES ITERATED ON GCS SUCCESS: 1'
            )
        ])

    def test_images_on_gcs_and_model_are_not_same(self) -> None:
        self.user_1.profile_picture_data_url = VALID_IMAGE
        self.user_2.profile_picture_data_url = (
            user_services.DEFAULT_IDENTICON_DATA_URL)
        self.put_multi([self.user_1, self.user_2])
        self._push_file_to_gcs(
            'test_1', user_services.DEFAULT_IDENTICON_DATA_URL)
        self._push_file_to_gcs('test_2', VALID_IMAGE)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES ITERATED ON GCS SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL MISMATCHED PNG IMAGES SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The user having username test_1, have mismatched png image'
                    ' on GCS and in the model.'
                )
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES ITERATED ON GCS SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL MISMATCHED WEBP IMAGES SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The user having username test_1, has incompatible webp '
                    'image on GCS and png in the model.'
                )
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The user having username test_2, have mismatched png image'
                    ' on GCS and in the model.'
                )
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The user having username test_2, has incompatible webp '
                    'image on GCS and png in the model.'
                )
            )
        ])

    def test_same_png_different_webp_on_gcs_and_in_model(self) -> None:
        self.put_multi([self.user_1])
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        filepath_png = f'user/{self.user_1.username}/assets/profile_picture.png'
        filepath_webp = (
            f'user/{self.user_1.username}/assets/profile_picture.webp')
        png_binary = utils.convert_data_url_to_binary(
            user_services.DEFAULT_IDENTICON_DATA_URL, 'png')
        valid_image_png_binary = utils.convert_data_url_to_binary(
            VALID_IMAGE, 'png')
        webp_binary = self._get_webp_binary_data(valid_image_png_binary)
        storage_services.commit(bucket, filepath_png, png_binary, None)
        storage_services.commit(bucket, filepath_webp, webp_binary, None)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES ITERATED ON GCS SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES ITERATED ON GCS SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL MISMATCHED WEBP IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The user having username test_1, has incompatible webp '
                    'image on GCS and png in the model.'
                )
            )
        ])

    def test_model_having_none_profile_picture_and_none_on_gcs_logs_error(
        self) -> None:
        self.put_multi([self.user_4])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='The user having username test_4, have the following '
                'error log -- Images are not available on GCS'
            )
        ])

    def test_model_having_none_profile_picture_and_valid_on_gcs_confirmation(
        self) -> None:
        self.put_multi([self.user_4])
        self._push_file_to_gcs('test_4', VALID_IMAGE)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USERS WITH NONE PROFILE PICTURES ON MODEL BUT '
                'VALID ON GCS SUCCESS: 1'
            )
        ])

# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import proto  # type: ignore


__protobuf__ = proto.module(
    package="google.cloud.recommendationengine.v1beta1",
    manifest={
        "FeatureMap",
    },
)


class FeatureMap(proto.Message):
    r"""FeatureMap represents extra features that customers want to
    include in the recommendation model for catalogs/user events as
    categorical/numerical features.

    Attributes:
        categorical_features (Mapping[str, google.cloud.recommendationengine_v1beta1.types.FeatureMap.StringList]):
            Categorical features that can take on one of a limited
            number of possible values. Some examples would be the
            brand/maker of a product, or country of a customer.

            Feature names and values must be UTF-8 encoded strings.

            For example:
            ``{ "colors": {"value": ["yellow", "green"]}, "sizes": {"value":["S", "M"]}``
        numerical_features (Mapping[str, google.cloud.recommendationengine_v1beta1.types.FeatureMap.FloatList]):
            Numerical features. Some examples would be the height/weight
            of a product, or age of a customer.

            Feature names must be UTF-8 encoded strings.

            For example:
            ``{ "lengths_cm": {"value":[2.3, 15.4]}, "heights_cm": {"value":[8.1, 6.4]} }``
    """

    class StringList(proto.Message):
        r"""A list of string features.

        Attributes:
            value (Sequence[str]):
                String feature value with a length limit of
                128 bytes.
        """

        value = proto.RepeatedField(
            proto.STRING,
            number=1,
        )

    class FloatList(proto.Message):
        r"""A list of float features.

        Attributes:
            value (Sequence[float]):
                Float feature value.
        """

        value = proto.RepeatedField(
            proto.FLOAT,
            number=1,
        )

    categorical_features = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=1,
        message=StringList,
    )
    numerical_features = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=2,
        message=FloatList,
    )


__all__ = tuple(sorted(__protobuf__.manifest))

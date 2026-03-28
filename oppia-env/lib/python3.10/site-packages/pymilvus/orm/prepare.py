# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

from typing import List, Tuple, Union

import numpy as np
import pandas as pd

from pymilvus.client.types import DataType
from pymilvus.exceptions import (
    DataNotMatchException,
    DataTypeNotSupportException,
    ExceptionsMessage,
    ParamError,
)

from .schema import CollectionSchema


class Prepare:
    @classmethod
    def prepare_data(
        cls,
        data: Union[List, Tuple, pd.DataFrame],
        schema: CollectionSchema,
        is_insert: bool = True,
    ) -> List:
        if not isinstance(data, (list, tuple, pd.DataFrame)):
            raise DataTypeNotSupportException(message=ExceptionsMessage.DataTypeNotSupport)

        fields = schema.fields
        entities = []  # Entities

        if isinstance(data, pd.DataFrame):
            if (
                schema.auto_id
                and schema.primary_field.name in data
                and is_insert
                and not data[schema.primary_field.name].isnull().all()
            ):
                raise DataNotMatchException(message=ExceptionsMessage.AutoIDWithData)
            # TODO(SPARSE): support pd.SparseDtype for sparse float vector field
            for field in fields:
                if field.is_primary and field.auto_id and is_insert:
                    continue
                if field.is_function_output:
                    continue
                values = []
                if field.name in list(data.columns):
                    values = list(data[field.name])
                entities.append({"name": field.name, "type": field.dtype, "values": values})
            return entities

        tmp_fields = list(
            filter(
                lambda field: not (field.is_primary and field.auto_id and is_insert)
                and not field.is_function_output,
                fields,
            )
        )

        vec_dtype_checker = {
            DataType.FLOAT_VECTOR: lambda ndarr: ndarr.dtype in ("float32", "float64"),
            DataType.FLOAT16_VECTOR: lambda ndarr: ndarr.dtype in ("float16",),
            DataType.BFLOAT16_VECTOR: lambda ndarr: ndarr.dtype in ("bfloat16",),
        }

        wrong_field_type = "Wrong type for vector field: {}, expect={}, got={}"
        wrong_ndarr_type = "Wrong type for np.ndarray for vector field: {}, expect={}, got={}"
        for i, field in enumerate(tmp_fields):
            try:
                f_data = data[i]
            # the last missing part of data is also completed in order according to the schema
            except IndexError:
                entities.append({"name": field.name, "type": field.dtype, "values": []})

            d = []
            if field.dtype == DataType.FLOAT_VECTOR:
                is_valid_ndarray = vec_dtype_checker[field.dtype]
                if isinstance(f_data, np.ndarray):
                    if not is_valid_ndarray(f_data):
                        raise ParamError(
                            message=wrong_ndarr_type.format(
                                field.name, "np.float32/np.float64", f_data.dtype
                            )
                        )
                    d = f_data.tolist()

                elif isinstance(f_data[0], np.ndarray):
                    for ndarr in f_data:
                        if not is_valid_ndarray(ndarr):
                            raise ParamError(
                                message=wrong_ndarr_type.format(
                                    field.name, "np.float32/np.float64", ndarr.dtype
                                )
                            )
                        d.append(ndarr.tolist())

                else:
                    d = f_data if f_data is not None else []

            elif field.dtype == DataType.FLOAT16_VECTOR:
                is_valid_ndarray = vec_dtype_checker[field.dtype]
                if isinstance(f_data[0], np.ndarray):
                    for ndarr in f_data:
                        if not is_valid_ndarray(ndarr):
                            raise ParamError(
                                message=wrong_ndarr_type.format(
                                    field.name, "np.float16", ndarr.dtype
                                )
                            )
                        d.append(ndarr.view(np.uint8).tobytes())
                else:
                    raise ParamError(
                        message=wrong_field_type.format(
                            field.name,
                            "List<np.ndarray(dtype='float16')>",
                            f"List{type(f_data[0])})",
                        )
                    )

            elif field.dtype == DataType.BFLOAT16_VECTOR:
                is_valid_ndarray = vec_dtype_checker[field.dtype]
                if isinstance(f_data[0], np.ndarray):
                    for ndarr in f_data:
                        if not is_valid_ndarray(ndarr):
                            raise ParamError(
                                message=wrong_ndarr_type.format(
                                    field.name, "np.bfloat16", ndarr.dtype
                                )
                            )
                        d.append(ndarr.view(np.uint8).tobytes())
                else:
                    raise ParamError(
                        message=wrong_field_type.format(
                            field.name,
                            "List<np.ndarray(dtype='bfloat16')>",
                            f"List{type(f_data[0])})",
                        )
                    )

            else:
                d = f_data if f_data is not None else []

            entities.append({"name": field.name, "type": field.dtype, "values": d})

        return entities

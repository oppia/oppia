import warnings
import zlib
from io import StringIO

import numpy as np
import pandas as pd

from .. import decode, encode
from ..handlers import BaseHandler, register, unregister
from ..tags_pd import REVERSE_TYPE_MAP, TYPE_MAP
from ..util import b64decode, b64encode
from .numpy import register_handlers as register_numpy_handlers
from .numpy import unregister_handlers as unregister_numpy_handlers

__all__ = ['register_handlers', 'unregister_handlers']


def pd_encode(obj, **kwargs):
    if isinstance(obj, np.generic):
        # convert pandas/numpy scalar to native Python type
        return obj.item()
    return encode(obj, **kwargs)


def pd_decode(s, **kwargs):
    return decode(s, **kwargs)


def rle_encode(types_list):
    """
    Encodes a list of type codes using Run-Length Encoding (RLE). This allows for object columns in dataframes to contain items of different types without massively bloating the encoded representation.
    """
    if not types_list:
        return []

    encoded = []
    current_type = types_list[0]
    count = 1

    for typ in types_list[1:]:
        if typ == current_type:
            count += 1
        else:
            encoded.append([current_type, count])
            current_type = typ
            count = 1
    encoded.append([current_type, count])

    return encoded


def rle_decode(encoded_list):
    """
    Decodes a Run-Length Encoded (RLE) list back into the original list of type codes.
    """
    decoded = []
    for typ, count in encoded_list:
        decoded.extend([typ] * count)
    return decoded


class PandasProcessor(object):
    def __init__(self, size_threshold=500, compression=zlib):
        """
        :param size_threshold: nonnegative int or None
            valid values for 'size_threshold' are all nonnegative
            integers and None.  If size_threshold is None,
            dataframes are always stored as csv strings
        :param compression: a compression module or None
            valid values for 'compression' are {zlib, bz2, None}
            if compression is None, no compression is applied
        """
        self.size_threshold = size_threshold
        self.compression = compression

    def flatten_pandas(self, buf, data, meta=None):
        if self.size_threshold is not None and len(buf) > self.size_threshold:
            if self.compression:
                buf = self.compression.compress(buf.encode())
                data['comp'] = True
            data['values'] = b64encode(buf)
            data['txt'] = False
        else:
            data['values'] = buf
            data['txt'] = True

        data['meta'] = meta
        return data

    def restore_pandas(self, data):
        if data.get('txt', True):
            # It's just text...
            buf = data['values']
        else:
            buf = b64decode(data['values'])
            if data.get('comp', False):
                buf = self.compression.decompress(buf).decode()
        meta = data.get('meta', {})
        return (buf, meta)


def make_read_csv_params(meta, context):
    meta_dtypes = context.restore(meta.get('dtypes', {}), reset=False)
    # The header is used to select the rows of the csv from which
    # the columns names are retrieved
    header = meta.get('header', [0])
    parse_dates = []
    converters = {}
    timedeltas = []
    # this is only for pandas v2+ due to a backwards-incompatible change
    parse_datetime_v2 = {}
    dtype = {}
    for k, v in meta_dtypes.items():
        if v.startswith('datetime'):
            parse_dates.append(k)
            parse_datetime_v2[k] = v
        elif v.startswith('complex'):
            converters[k] = complex
        elif v.startswith('timedelta'):
            timedeltas.append(k)
            dtype[k] = 'object'
        else:
            dtype[k] = v

    return (
        dict(
            dtype=dtype, header=header, parse_dates=parse_dates, converters=converters
        ),
        timedeltas,
        parse_datetime_v2,
    )


class PandasDfHandler(BaseHandler):
    pp = PandasProcessor()

    def flatten(self, obj, data):
        pp = PandasProcessor()
        # handle multiindex columns
        if isinstance(obj.columns, pd.MultiIndex):
            columns = [tuple(col) for col in obj.columns]
            column_names = obj.columns.names
            is_multicolumns = True
        else:
            columns = obj.columns.tolist()
            column_names = obj.columns.name
            is_multicolumns = False

        # handle multiindex index
        if isinstance(obj.index, pd.MultiIndex):
            index_values = [tuple(idx) for idx in obj.index.values]
            index_names = obj.index.names
            is_multiindex = True
        else:
            index_values = obj.index.tolist()
            index_names = obj.index.name
            is_multiindex = False

        data_columns = {}
        type_codes = []
        for col in obj.columns:
            col_data = obj[col]
            dtype_name = col_data.dtype.name

            if dtype_name == "object":
                # check if items are complex types
                if col_data.apply(
                    lambda x: isinstance(x, (list, dict, set, tuple, np.ndarray))
                ).any():
                    # if items are complex, erialize each item individually
                    serialized_values = col_data.apply(lambda x: encode(x)).tolist()
                    data_columns[col] = serialized_values
                    type_codes.append("py/jp")
                else:
                    # treat it as regular object dtype
                    data_columns[col] = col_data.tolist()
                    type_codes.append(TYPE_MAP.get(dtype_name, "object"))
            else:
                # for other dtypes, store their values directly
                data_columns[col] = col_data.tolist()
                type_codes.append(TYPE_MAP.get(dtype_name, "object"))

        # store index data
        index_encoded = encode(index_values, keys=True)

        rle_types = rle_encode(type_codes)
        # prepare metadata
        meta = {
            "dtypes_rle": rle_types,
            "index": index_encoded,
            "index_names": index_names,
            "columns": encode(columns, keys=True),
            "column_names": column_names,
            "is_multiindex": is_multiindex,
            "is_multicolumns": is_multicolumns,
        }

        # serialize data_columns with keys=True to allow for non-object keys
        data_encoded = encode(data_columns, keys=True)

        # use PandasProcessor to flatten
        data = pp.flatten_pandas(data_encoded, data, meta)
        return data

    def restore(self, obj):
        data_encoded, meta = self.pp.restore_pandas(obj)

        data_columns = decode(data_encoded, keys=True)

        # get type codes, un-RLE-ed
        try:
            rle_types = meta["dtypes_rle"]
        except KeyError:
            # was encoded with pre-v3.4 scheme
            return self.restore_v3_3(obj)
        type_codes = rle_decode(rle_types)

        # handle multicolumns
        columns_decoded = decode(meta["columns"], keys=True)
        if meta.get("is_multicolumns", False):
            columns = pd.MultiIndex.from_tuples(
                columns_decoded, names=meta.get("column_names")
            )
        else:
            columns = columns_decoded

        # progressively reconstruct dataframe as a dict
        df_data = {}
        dtypes = {}
        for col, type_code in zip(columns, type_codes):
            col_data = data_columns[col]
            if type_code == "py/jp":
                # deserialize each item in the column
                col_values = [decode(item) for item in col_data]
                df_data[col] = col_values
            else:
                df_data[col] = col_data
                # used later to get correct dtypes
                dtype_str = REVERSE_TYPE_MAP.get(type_code, "object")
                dtypes[col] = dtype_str

        # turn dict into df
        df = pd.DataFrame(df_data)
        df.columns = columns

        # apply dtypes
        for col in df.columns:
            dtype_str = dtypes.get(col, "object")
            try:
                dtype = np.dtype(dtype_str)
                df[col] = df[col].astype(dtype)
            except Exception:
                msg = (
                    f"jsonpickle was unable to properly deserialize "
                    f"the column {col} into its inferred dtype. "
                    f"Please file a bugreport on the jsonpickle GitHub! "
                )
                warnings.warn(msg)

        # decode and set the index
        index_values = decode(meta["index"], keys=True)
        if meta.get("is_multiindex", False):
            index = pd.MultiIndex.from_tuples(
                index_values, names=meta.get("index_names")
            )
        else:
            index = pd.Index(index_values, name=meta.get("index_names"))
        df.index = index

        # restore column names for easy readability
        if "column_names" in meta:
            if meta.get("is_multicolumns", False):
                df.columns.names = meta.get("column_names")
            else:
                df.columns.name = meta.get("column_names")

        return df

    def restore_v3_3(self, data):
        csv, meta = self.pp.restore_pandas(data)
        params, timedeltas, parse_datetime_v2 = make_read_csv_params(meta, self.context)
        # None makes it compatible with objects serialized before
        # column_levels_names has been introduced.
        column_level_names = meta.get("column_level_names", None)
        df = (
            pd.read_csv(StringIO(csv), **params)
            if data["values"].strip()
            else pd.DataFrame()
        )
        for col in timedeltas:
            df[col] = pd.to_timedelta(df[col])
        df = df.astype(parse_datetime_v2)

        df.set_index(decode(meta["index"]), inplace=True)
        # restore the column level(s) name(s)
        if column_level_names:
            df.columns.names = column_level_names
        return df


class PandasSeriesHandler(BaseHandler):
    pp = PandasProcessor()

    def flatten(self, obj, data):
        """Flatten the index and values for reconstruction"""
        data['name'] = obj.name
        # This relies on the numpy handlers for the inner guts.
        data['index'] = self.context.flatten(obj.index, reset=False)
        data['values'] = self.context.flatten(obj.values, reset=False)
        return data

    def restore(self, data):
        """Restore the flattened data"""
        name = data['name']
        index = self.context.restore(data['index'], reset=False)
        values = self.context.restore(data['values'], reset=False)
        return pd.Series(values, index=index, name=name)


class PandasIndexHandler(BaseHandler):
    pp = PandasProcessor()
    index_constructor = pd.Index

    def name_bundler(self, obj):
        return {'name': obj.name}

    def flatten(self, obj, data):
        name_bundle = self.name_bundler(obj)
        meta = dict(dtype=str(obj.dtype), **name_bundle)
        buf = encode(obj.tolist())
        data = self.pp.flatten_pandas(buf, data, meta)
        return data

    def restore(self, data):
        buf, meta = self.pp.restore_pandas(data)
        dtype = meta.get('dtype', None)
        name_bundle = {
            'name': (tuple if v is not None else lambda x: x)(v)
            for k, v in meta.items()
            if k in {'name', 'names'}
        }
        idx = self.index_constructor(decode(buf), dtype=dtype, **name_bundle)
        return idx


class PandasPeriodIndexHandler(PandasIndexHandler):
    index_constructor = pd.PeriodIndex


class PandasMultiIndexHandler(PandasIndexHandler):
    def name_bundler(self, obj):
        return {'names': obj.names}


class PandasTimestampHandler(BaseHandler):
    pp = PandasProcessor()

    def flatten(self, obj, data):
        meta = {'isoformat': obj.isoformat()}
        buf = ''
        data = self.pp.flatten_pandas(buf, data, meta)
        return data

    def restore(self, data):
        _, meta = self.pp.restore_pandas(data)
        isoformat = meta['isoformat']
        obj = pd.Timestamp(isoformat)
        return obj


class PandasPeriodHandler(BaseHandler):
    pp = PandasProcessor()

    def flatten(self, obj, data):
        meta = {
            'start_time': encode(obj.start_time),
            'freqstr': obj.freqstr,
        }
        buf = ''
        data = self.pp.flatten_pandas(buf, data, meta)
        return data

    def restore(self, data):
        _, meta = self.pp.restore_pandas(data)
        start_time = decode(meta['start_time'])
        freqstr = meta['freqstr']
        obj = pd.Period(start_time, freqstr)
        return obj


class PandasIntervalHandler(BaseHandler):
    pp = PandasProcessor()

    def flatten(self, obj, data):
        meta = {
            'left': encode(obj.left),
            'right': encode(obj.right),
            'closed': obj.closed,
        }
        buf = ''
        data = self.pp.flatten_pandas(buf, data, meta)
        return data

    def restore(self, data):
        _, meta = self.pp.restore_pandas(data)
        left = decode(meta['left'])
        right = decode(meta['right'])
        closed = str(meta['closed'])
        obj = pd.Interval(left, right, closed=closed)
        return obj


def register_handlers():
    register_numpy_handlers()
    register(pd.DataFrame, PandasDfHandler, base=True)
    register(pd.Series, PandasSeriesHandler, base=True)
    register(pd.Index, PandasIndexHandler, base=True)
    register(pd.PeriodIndex, PandasPeriodIndexHandler, base=True)
    register(pd.MultiIndex, PandasMultiIndexHandler, base=True)
    register(pd.Timestamp, PandasTimestampHandler, base=True)
    register(pd.Period, PandasPeriodHandler, base=True)
    register(pd.Interval, PandasIntervalHandler, base=True)


def unregister_handlers():
    unregister_numpy_handlers()
    unregister(pd.DataFrame)
    unregister(pd.Series)
    unregister(pd.Index)
    unregister(pd.PeriodIndex)
    unregister(pd.MultiIndex)
    unregister(pd.Timestamp)
    unregister(pd.Period)
    unregister(pd.Interval)

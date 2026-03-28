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

COMMON_TYPE_PARAMS = (
    "dim",
    "max_length",
    "max_capacity",
    "enable_match",
    "enable_analyzer",
    "analyzer_params",
    "multi_analyzer_params",
)

CALC_DIST_IDS = "ids"
CALC_DIST_FLOAT_VEC = "float_vectors"
CALC_DIST_BIN_VEC = "bin_vectors"
CALC_DIST_METRIC = "metric"
CALC_DIST_L2 = "L2"
CALC_DIST_IP = "IP"
CALC_DIST_BM25 = "BM25"
CALC_DIST_HAMMING = "HAMMING"
CALC_DIST_TANIMOTO = "TANIMOTO"
CALC_DIST_JACCARD = "JACCARD"
CALC_DIST_COSINE = "COSINE"
CALC_DIST_SQRT = "sqrt"
CALC_DIST_DIM = "dim"

OFFSET = "offset"
MILVUS_LIMIT = "limit"
BATCH_SIZE = "batch_size"
ID = "id"
TYPE = "type"
METRIC_TYPE = "metric_type"
PARAMS = "params"
DISTANCE = "distance"
RADIUS = "radius"
RANGE_FILTER = "range_filter"
FIELDS = "fields"
EF = "ef"
IS_PRIMARY = "is_primary"
REDUCE_STOP_FOR_BEST = "reduce_stop_for_best"
COLLECTION_ID = "collection_id"
ITERATOR_FIELD = "iterator"
ITERATOR_SESSION_TS_FIELD = "iterator_session_ts"
DEFAULT_MAX_L2_DISTANCE = 99999999.0
DEFAULT_MIN_IP_DISTANCE = -99999999.0
DEFAULT_MAX_HAMMING_DISTANCE = 99999999.0
DEFAULT_MAX_TANIMOTO_DISTANCE = 99999999.0
DEFAULT_MAX_JACCARD_DISTANCE = 2.0
DEFAULT_MIN_COSINE_DISTANCE = -2.0
MAX_FILTERED_IDS_COUNT_ITERATION = 100000
INT64_MAX = 9223372036854775807
MAX_BATCH_SIZE: int = 16384
DEFAULT_SEARCH_EXTENSION_RATE: int = 10
UNLIMITED: int = -1
MAX_TRY_TIME: int = 20
GUARANTEE_TIMESTAMP = "guarantee_timestamp"
ITERATOR_SESSION_CP_FILE = "iterator_cp_file"
BM25_k1 = "bm25_k1"
BM25_b = "bm25_b"

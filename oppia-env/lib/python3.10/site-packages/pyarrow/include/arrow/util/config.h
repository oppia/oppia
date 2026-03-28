// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

#define ARROW_VERSION_MAJOR 7
#define ARROW_VERSION_MINOR 0
#define ARROW_VERSION_PATCH 0
#define ARROW_VERSION ((ARROW_VERSION_MAJOR * 1000) + ARROW_VERSION_MINOR) * 1000 + ARROW_VERSION_PATCH

#define ARROW_VERSION_STRING "7.0.0"

#define ARROW_SO_VERSION "700"
#define ARROW_FULL_SO_VERSION "700.0.0"

#define ARROW_CXX_COMPILER_ID "GNU"
#define ARROW_CXX_COMPILER_VERSION "10.2.1"
#define ARROW_CXX_COMPILER_FLAGS " -fdiagnostics-color=always -O3 -DNDEBUG"

#define ARROW_BUILD_TYPE "RELEASE"

#define ARROW_GIT_ID "e90472e35b40f58b17d408438bb8de1641bfe6ef"
#define ARROW_GIT_DESCRIPTION ""

#define ARROW_PACKAGE_KIND "python-wheel-manylinux2014"

#define ARROW_COMPUTE
#define ARROW_CSV
#define ARROW_DATASET
#define ARROW_FILESYSTEM
#define ARROW_FLIGHT
#define ARROW_IPC
#define ARROW_JSON

#define ARROW_S3
#define ARROW_USE_NATIVE_INT128
/* #undef ARROW_WITH_OPENTELEMETRY */

#define GRPCPP_PP_INCLUDE

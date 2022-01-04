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

"""Provides an Apache Beam API for interacting with Google Cloud Storage."""

from __future__ import annotations

import apache_beam as beam
from apache_beam import pvalue
from apache_beam.io.gcp.gcsio import GcsIO

from typing import Optional


class GetFile(beam.PTransform):  # type: ignore[misc]
    """Gets a file from Google Cloud Storage."""

    def __init__(self, filename: str, label: Optional[str] = None) -> None:
        """Initializes the GetFile PTransform.

        Args:
            filename: str. GCS file path in the form gs://<bucket>/<object>
            label: str|None. The label of the PTransform.
        """
        super(GetFile, self).__init__(label=label)
        self.filename = filename

    def expand(self, pbegin: pvalue.PBegin) -> beam.PCollection[bytes]:
        """Returns a PCollection a GCS file.

        This overrides the expand() method from the parent class.

        Args:
            pbegin: PValue. The initial pipeline. This pipeline is used to anchor the file to itself.

        Returns:
            PCollection. The PCollection of the GCS file.
        """
        return (
          pbegin.pipeline
          | 'Reading the file from Google Cloud Storage.' >> (
            GcsIO.open(self.filename, mode="r"))
        )


class WriteFile(beam.PTransform):  # type: ignore[misc]
    """Writes a file to Google Cloud Storage."""

    def __init__(self, filename: str, label: Optional[str] = None) -> None:
        """Initializes the WriteFile PTransform.

        Args:
            filename: str. GCS file path in the form gs://<bucket>/<object>
            label: str|None. The label of the PTransform.
        """
        super(WriteFile, self).__init__(label=label)
        self.filename = filename

    def expand(self, file: beam.PCollection[bytes]) -> pvalue.PDone:
        """Writes the given file to the Google Cloud Storage.

        This overrides the expand() method from the parent class.

        Args:
            file: PCollection. The PCollection of the file to write to Google Cloud Storage.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
          file 
          | 'Writing the file to Google Cloud Storage.' >> (
            GcsIO.open(self.filename, mode="w"))
        )

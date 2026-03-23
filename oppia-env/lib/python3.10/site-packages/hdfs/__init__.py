#!/usr/bin/env python
# encoding: utf-8

"""HdfsCLI: API and command line interface for HDFS."""

from .client import Client, InsecureClient, TokenClient
from .config import Config, NullHandler
from .util import HdfsError
import logging as lg


__version__ = '2.7.3'
__license__ = 'MIT'


lg.getLogger(__name__).addHandler(NullHandler())

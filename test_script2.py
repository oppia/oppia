import sys

sys.path.insert(0, '/root/oppia/third_party/python_libs')
import sys

sys.path.append('.')
import requests_mock

print("requests_mock imported correctly")
from core.domain import story_services

print("story_services imported correctly")

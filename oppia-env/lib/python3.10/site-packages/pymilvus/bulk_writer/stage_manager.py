import logging

from pymilvus.bulk_writer.stage_restful import create_stage, delete_stage, list_stages

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StageManager:
    def __init__(self, cloud_endpoint: str, api_key: str):
        """
        private preview feature. Please submit a request and contact us if you need it.

        Args:
            cloud_endpoint (str): The fixed cloud endpoint URL.
                - For international regions: https://api.cloud.zilliz.com
                - For regions in China: https://api.cloud.zilliz.com.cn
            api_key (str): The API key associated with your organization or cluster.
        """
        self.cloud_endpoint = cloud_endpoint
        self.api_key = api_key

    def create_stage(self, project_id: str, region_id: str, stage_name: str):
        """
        Create a stage under the specified project and regionId.
        """
        create_stage(self.cloud_endpoint, self.api_key, project_id, region_id, stage_name)

    def delete_stage(self, stage_name: str):
        """
        Delete a stage.
        """
        delete_stage(self.cloud_endpoint, self.api_key, stage_name)

    def list_stages(self, project_id: str, current_page: int = 1, page_size: int = 10):
        """
        Paginated query of the stage list under a specified projectId.
        """
        return list_stages(self.cloud_endpoint, self.api_key, project_id, current_page, page_size)

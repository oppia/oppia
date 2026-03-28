# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
from google.cloud.vision_v1p4beta1 import gapic_version as package_version

__version__ = package_version.__version__


from google.cloud.vision_helpers import VisionHelpers
from google.cloud.vision_helpers.decorators import add_single_feature_methods

from .services.image_annotator import ImageAnnotatorAsyncClient
from .services.image_annotator import ImageAnnotatorClient as IacImageAnnotatorClient
from .services.product_search import ProductSearchAsyncClient, ProductSearchClient
from .types.face import Celebrity, FaceRecognitionParams, FaceRecognitionResult
from .types.geometry import BoundingPoly, NormalizedVertex, Position, Vertex
from .types.image_annotator import (
    AnnotateFileRequest,
    AnnotateFileResponse,
    AnnotateImageRequest,
    AnnotateImageResponse,
    AsyncAnnotateFileRequest,
    AsyncAnnotateFileResponse,
    AsyncBatchAnnotateFilesRequest,
    AsyncBatchAnnotateFilesResponse,
    AsyncBatchAnnotateImagesRequest,
    AsyncBatchAnnotateImagesResponse,
    BatchAnnotateFilesRequest,
    BatchAnnotateFilesResponse,
    BatchAnnotateImagesRequest,
    BatchAnnotateImagesResponse,
    ColorInfo,
    CropHint,
    CropHintsAnnotation,
    CropHintsParams,
    DominantColorsAnnotation,
    EntityAnnotation,
    FaceAnnotation,
    Feature,
    GcsDestination,
    GcsSource,
    Image,
    ImageAnnotationContext,
    ImageContext,
    ImageProperties,
    ImageSource,
    InputConfig,
    LatLongRect,
    Likelihood,
    LocalizedObjectAnnotation,
    LocationInfo,
    OperationMetadata,
    OutputConfig,
    Property,
    SafeSearchAnnotation,
    TextDetectionParams,
    WebDetectionParams,
)
from .types.product_search import ProductSearchParams, ProductSearchResults
from .types.product_search_service import (
    AddProductToProductSetRequest,
    BatchOperationMetadata,
    CreateProductRequest,
    CreateProductSetRequest,
    CreateReferenceImageRequest,
    DeleteProductRequest,
    DeleteProductSetRequest,
    DeleteReferenceImageRequest,
    GetProductRequest,
    GetProductSetRequest,
    GetReferenceImageRequest,
    ImportProductSetsGcsSource,
    ImportProductSetsInputConfig,
    ImportProductSetsRequest,
    ImportProductSetsResponse,
    ListProductSetsRequest,
    ListProductSetsResponse,
    ListProductsInProductSetRequest,
    ListProductsInProductSetResponse,
    ListProductsRequest,
    ListProductsResponse,
    ListReferenceImagesRequest,
    ListReferenceImagesResponse,
    Product,
    ProductSet,
    ProductSetPurgeConfig,
    PurgeProductsRequest,
    ReferenceImage,
    RemoveProductFromProductSetRequest,
    UpdateProductRequest,
    UpdateProductSetRequest,
)
from .types.text_annotation import Block, Page, Paragraph, Symbol, TextAnnotation, Word
from .types.web_detection import WebDetection


@add_single_feature_methods
class ImageAnnotatorClient(VisionHelpers, IacImageAnnotatorClient):
    __doc__ = IacImageAnnotatorClient.__doc__
    Feature = Feature


__all__ = (
    "ImageAnnotatorAsyncClient",
    "ProductSearchAsyncClient",
    "AddProductToProductSetRequest",
    "AnnotateFileRequest",
    "AnnotateFileResponse",
    "AnnotateImageRequest",
    "AnnotateImageResponse",
    "AsyncAnnotateFileRequest",
    "AsyncAnnotateFileResponse",
    "AsyncBatchAnnotateFilesRequest",
    "AsyncBatchAnnotateFilesResponse",
    "AsyncBatchAnnotateImagesRequest",
    "AsyncBatchAnnotateImagesResponse",
    "BatchAnnotateFilesRequest",
    "BatchAnnotateFilesResponse",
    "BatchAnnotateImagesRequest",
    "BatchAnnotateImagesResponse",
    "BatchOperationMetadata",
    "Block",
    "BoundingPoly",
    "Celebrity",
    "ColorInfo",
    "CreateProductRequest",
    "CreateProductSetRequest",
    "CreateReferenceImageRequest",
    "CropHint",
    "CropHintsAnnotation",
    "CropHintsParams",
    "DeleteProductRequest",
    "DeleteProductSetRequest",
    "DeleteReferenceImageRequest",
    "DominantColorsAnnotation",
    "EntityAnnotation",
    "FaceAnnotation",
    "FaceRecognitionParams",
    "FaceRecognitionResult",
    "Feature",
    "GcsDestination",
    "GcsSource",
    "GetProductRequest",
    "GetProductSetRequest",
    "GetReferenceImageRequest",
    "Image",
    "ImageAnnotationContext",
    "ImageAnnotatorClient",
    "ImageContext",
    "ImageProperties",
    "ImageSource",
    "ImportProductSetsGcsSource",
    "ImportProductSetsInputConfig",
    "ImportProductSetsRequest",
    "ImportProductSetsResponse",
    "InputConfig",
    "LatLongRect",
    "Likelihood",
    "ListProductSetsRequest",
    "ListProductSetsResponse",
    "ListProductsInProductSetRequest",
    "ListProductsInProductSetResponse",
    "ListProductsRequest",
    "ListProductsResponse",
    "ListReferenceImagesRequest",
    "ListReferenceImagesResponse",
    "LocalizedObjectAnnotation",
    "LocationInfo",
    "NormalizedVertex",
    "OperationMetadata",
    "OutputConfig",
    "Page",
    "Paragraph",
    "Position",
    "Product",
    "ProductSearchClient",
    "ProductSearchParams",
    "ProductSearchResults",
    "ProductSet",
    "ProductSetPurgeConfig",
    "Property",
    "PurgeProductsRequest",
    "ReferenceImage",
    "RemoveProductFromProductSetRequest",
    "SafeSearchAnnotation",
    "Symbol",
    "TextAnnotation",
    "TextDetectionParams",
    "UpdateProductRequest",
    "UpdateProductSetRequest",
    "Vertex",
    "WebDetection",
    "WebDetectionParams",
    "Word",
)

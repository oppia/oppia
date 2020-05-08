// Reference - https://developer.mozilla.org/en-US/docs/Web/API/BlobBuilder

class BlobBuilder {
  append: (data: ArrayBuffer) => void;
  append: (data: Blob) => void;
  append: (data: String, endings?: String) => void;
  getBlob: (contentType?: String) => void;
  getFile: (name: String, contentType?: String) => File;
}

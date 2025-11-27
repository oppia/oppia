# Debug Image Flow for Nested RTE Components in Create New Skill Modal

## Problem Summary
Images inserted in nested RTE components (Collapsible, Tabs) within the Review Material field of Create New Skill Modal are not appearing after skill creation.

## Investigation Results

### 1. PageContextService is correctly set ✓
- `create-new-skill-modal.component.ts` line 79: Calls `setImageSaveDestinationToLocalStorage()` in `ngOnInit()`
- This ensures all images (including nested ones) are saved to sessionStorage

### 2. Image Editor respects PageContextService ✓
- `image-editor.component.ts` lines 1220-1228: Checks `getImageSaveDestination()` before saving
- When set to LOCAL_STORAGE, calls `saveImageToLocalStorage()` which uses `ImageLocalStorageService.saveImage()`

### 3. Images are uploaded to backend ✓
- `create-new-skill-modal.service.ts` lines 68-76: Gets `imageLocalStorageService.getStoredImagesData()` and passes to `skillCreationBackendApiService.createSkillAsync()`

### 4. Backend extraction enhanced ✓
- `core/domain/html_cleaner.py`: Added recursive `_traverse_and_collect_components()` and `_collect_from_value()` methods
- Handles nested components like Collapsible and Tabs

## Most Likely Root Cause

**HTML Encoding Mismatch**: The HTML stored in nested RTE components undergoes multiple levels of escaping:
- Level 1: `"nested_img.svg"` → stored as attribute value
- Level 2: `&quot;nested_img.svg&quot;` → HTML entity encoding
- Level 3: `&amp;quot;nested_img.svg&amp;quot;` → Double encoding for nesting
- Level 4: `\\&amp;quot;` → Additional escaping for JSON stringification in tabs

When extracting, if we don't properly decode ALL levels, we might extract:
- `&amp;quot;nested_img.svg&amp;quot;` (incorrect - still encoded)

But ImageLocalStorageService saved it as:
- `nested_img_height_100_width_200.svg` (with dimensions added by `ImageUploadHelperService.generateImageFilename()`)

## Solution Strategy

Instead of trying to perfectly parse all encoding levels, we should:

1. **Log what's in sessionStorage** before submission
2. **Log what the backend extracts** from the HTML
3. **Compare** to find the mismatch

Then apply the appropriate fix.

## Debugging Steps for User

### Step 1: Add console logging to see what's saved

In `core/templates/services/image-local-storage.service.ts`, add logging in `saveImage()`:

```typescript
saveImage(filename: string, imageData: string): void {
  console.log('[ImageLocalStorage] Saving image:', filename);
  // ... existing code
}
```

### Step 2: Add logging to see what's extracted

In `core/domain/html_cleaner.py`, add logging in `get_image_filenames_from_html_strings()`:

```python
def get_image_filenames_from_html_strings(html_strings):
    """..."""
    filenames = set()
    for html_string in html_strings:
        # ... existing code
        result = _traverse_and_collect_components(...)
        python.logging.info('[HTMLCleaner] Extracted filenames: %s', result)
        filenames.update(result)
    return list(filenames)
```

### Step 3: Test the flow

1. Open Create New Skill Modal
2. In Review Material, insert a Collapsible
3. Inside the Collapsible, insert an Image
4. Open browser console (F12)
5. Click Create
6. Check console logs:
   - Should see: `[ImageLocalStorage] Saving image: imagename_height_X_width_Y.ext`
   - Check server logs for: `[HTMLCleaner] Extracted filenames: [...]`

### Step 4: Compare

If saved filename !== extracted filename, that's the bug!

## Likely Fix

Based on patterns in Oppia, the most likely fix is ensuring we decode HTML entities properly in `html_cleaner.py`:

```python
import html as html_module  # Python's html.unescape

def _collect_from_value(value):
    """..."""
    if isinstance(value, str):
        # Decode HTML entities at multiple levels
        decoded = value
        # Keep decoding until no more changes (handles multi-level encoding)
        for _ in range(5):  # Max 5 levels
            new_decoded = html_module.unescape(decoded)
            if new_decoded == decoded:
                break
            decoded = new_decoded
        
        # Now extract image filenames from decoded HTML
        # ... existing extraction logic
```

This ensures we handle `&amp;quot;` → `&quot;` → `"` correctly.

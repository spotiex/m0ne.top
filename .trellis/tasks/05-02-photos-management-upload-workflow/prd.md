# Fix Photos Management Upload Workflow

## Goal
Make the `/photos/management` page generate the image URL immediately after an image is selected, while still ensuring the save action uploads the file and updates the gallery metadata JSON in the same submission flow.

## Requirements
- Generate the future public image URL as soon as the user selects or drags in a local image.
- Keep the generated URL consistent with the existing R2 object key and public URL logic.
- Ensure clicking save in new-photo mode always uploads the selected image before updating the gallery index JSON.
- Preserve edit mode behavior for existing gallery items that only update metadata.

## Acceptance Criteria
- [ ] Selecting or dragging an image fills the read-only URL field automatically.
- [ ] Saving a new photo with a selected image triggers both image upload and gallery JSON update.
- [ ] Saving an existing photo in edit mode only updates gallery JSON metadata.
- [ ] Duplicate URL validation still works with the auto-generated URL flow.

## Technical Notes
- Reuse the current R2 key generation logic instead of introducing a second naming scheme.
- Avoid inferring upload completion from whether `src` is filled, because the URL may be precomputed before upload.

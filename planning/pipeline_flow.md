# Overview

1. Lightweight OCR to extract text with bounding boxes
2. Do manual text processing steps (see "Manual text processing" heading)
2. Give a highly structured prompt, outlining the liquor checklist,
   to an LLM. Specify the output format.
3. Store this output for use in the UI.
   - If needed, coalesce with help tooltips that give user
     easy context on additional documents to reference


# Manual text processing

Test the effectiveness in the UI.  For things that don't work well,
add deterministic processing steps before the LLM call. There are
two options:
- add the results to the llm query
- add the results to a separate json. Then overwrite the llm result
  json with the deterministic values (coalesce).

The latter seems less error prone if feasible.



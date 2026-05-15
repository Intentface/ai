---
'@ai-sdk/openai': patch
---

Fix `WorkflowAgent` crash with `TypeError: this.config.url is not a function` when an `@ai-sdk/openai` model is passed as a non-string `LanguageModel`. The `url` closure could not be reconstructed after workflow serialization because the base URL was captured by the closure only. The config now stores `baseURL` as plain data alongside the closure, and `[WORKFLOW_DESERIALIZE]` synthesizes a fresh `url` closure from `baseURL` when the closure is missing on rehydrated models.

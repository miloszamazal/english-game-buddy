<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Bulk question deletion must validate the admin password server-side and constrain deletion by both explicit IDs and the selected subject; this prevents accidental cross-subject deletion.
- Keep subject navigation in the shared SubjectMenu component so quiz and administration use the same responsive layout.
- Quiz question components return immutable evaluated attempts to the active round; the end screen uses them for mistake review and persists distinct incorrect question IDs with each completed score record, so retry rounds survive reloads.
- Build mistake retry rounds from the union of completed results for the exact trimmed player name and selected subject, resolving IDs against current questions and omitting deleted questions; historical scores without attempt data cannot reconstruct mistakes.

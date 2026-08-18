// lib/searchFilter.ts
//
// PostgREST's `.or()` filter strings use commas and parentheses as
// structural syntax, and ILIKE uses % / _ as wildcards. Raw user search
// input can contain any of these, which either breaks the filter
// expression outright or lets the searcher influence which fields/logic
// get matched (filter injection). Every call site that interpolates
// search input into `.or(...)` must run it through this first.
export function sanitizeOrFilterInput(input: string): string {
  return input
    .replace(/[,()]/g, ' ')          // structural in .or() syntax
    .replace(/[%_\\]/g, '\\$&')      // ILIKE wildcards
    .trim()
}

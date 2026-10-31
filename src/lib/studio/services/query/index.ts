/**
 * Layanan retrieval Studio (DC-14; register 05_document_contract_specs.md §8, §15 I65/I66).
 *
 * - `queryContracts(filter, opts?)`: filter kontrak atas kolom cermin MX09 + M20 (`matchedItems`).
 * - `searchBlocks(filter, opts?)`: teks penuh paragraf v2 revisi terkini (tsvector `simple`).
 * - `parseContractQuery` / `parseSearchQuery`: query string R21/R22 -> filter tervalidasi
 *   (`StudioEngineError("SCHEMA_INVALID")`, isu pointer `/query/<nama>`).
 * Server-only (memakai Prisma).
 */
export { queryContracts, contractWhere, dateOnly, missingRequiredOf, DOC_NUMBER_MATCH_MAX, type QueryContractsResult } from "./contracts";
export { searchBlocks, searchConditions, type SearchBlocksResult } from "./search";
export {
  parseContractQuery,
  parseSearchQuery,
  contractFilterIssues,
  searchFilterIssues,
  assertContractFilter,
  assertSearchFilter,
  encodeSearchCursor,
  decodeSearchCursor,
  isCalendarDate,
  splitList,
  CONTRACT_STATUS_SET,
  SEARCH_TYPE_SET,
  DOCUMENT_ID_PATTERN,
  type ContractQueryFilter,
  type SearchQueryFilter,
  type SearchCursor,
} from "./filters";
export { type QueryDb, type QueryOptions } from "./db";
export {
  setQueryLogSink,
  logQueryRead,
  readLogIdentity,
  truncateForLog,
  QUERY_SOURCE,
  READ_LOG_VALUE_MAX,
  type QueryLogEntry,
  type QueryLogSink,
  type QueryReadCaller,
} from "./log";

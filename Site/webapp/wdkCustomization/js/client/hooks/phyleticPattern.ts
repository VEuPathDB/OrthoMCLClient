import { ResultType, getStandardReport } from 'wdk-client/Utils/WdkResult';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import {
  DOMAIN_FREQUENCY_TABLE_NAME,
  KEYWORD_FREQUENCY_TABLE_NAME,
  TAXON_COUNTS_TABLE_NAME
} from 'ortho-client/records/utils';

export function usePhyleticPatternData(
  resultType: ResultType,
  numRecords: number = -1,
  offset: number = 0
) {
  return useWdkService(
    wdkService => getStandardReport(
      wdkService,
      resultType,
      {
        tables: [
          DOMAIN_FREQUENCY_TABLE_NAME,
          KEYWORD_FREQUENCY_TABLE_NAME,
          TAXON_COUNTS_TABLE_NAME
        ],
        pagination: {
          numRecords,
          offset
        }
      }
    ),
    [ resultType ]
  );
}

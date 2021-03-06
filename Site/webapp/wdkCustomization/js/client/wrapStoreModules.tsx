import storeModules from '@veupathdb/wdk-client/lib/StoreModules';

import * as orthoRecord from 'ortho-client/store-modules/RecordStoreModule';

// FIXME: Refine these types once EbrcWebsiteCommon's Redux has
// been converted to TypeScript
type EbrcStoreModules = typeof storeModules;
type OrthoMclStoreModules = EbrcStoreModules;

export function wrapStoreModules(ebrcStoreModules: EbrcStoreModules): OrthoMclStoreModules {
  return {
    ...ebrcStoreModules,
    record: {
      ...ebrcStoreModules.record,
      ...orthoRecord
    }
  };
}

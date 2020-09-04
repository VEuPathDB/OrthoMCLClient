import React from 'react';

import { Loading } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { ResultType } from 'wdk-client/Utils/WdkResult';

import { usePhyleticPatternData } from 'ortho-client/hooks/phyleticPattern';

const cx = makeClassNameHelper('PhyleticPatternSummaryView');

interface Props {
  resultType: ResultType;
  viewId: string;
}

export function PhyleticPattern({ resultType }: Props) {
  const phyleticPatternData = usePhyleticPatternData(resultType);

  return (
    <div className={cx('')}>
      {
        phyleticPatternData == null
          ? <Loading />
          : <pre>
              {JSON.stringify(phyleticPatternData, null, 2)}
            </pre>
      }
    </div>
  );
}

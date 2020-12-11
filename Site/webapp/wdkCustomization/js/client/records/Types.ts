import React from 'react';

import { requestPartialRecord } from 'wdk-client/Actions/RecordActions';
import { CategoryTreeNode } from 'wdk-client/Utils/CategoryUtils';
import {
  AttributeField,
  RecordInstance,
  RecordClass,
  TableField,
  TableValue
} from 'wdk-client/Utils/WdkModel';

export type WrappedComponentProps<T> = T & { DefaultComponent: React.ComponentType<T> };

export interface RecordAttributeProps {
  attribute: AttributeField;
  record: RecordInstance;
  recordClass: RecordClass;
}

export interface RecordTableProps {
  className?: string;
  record: RecordInstance;
  recordClass: RecordClass;
  table: TableField;
  value: TableValue;
}

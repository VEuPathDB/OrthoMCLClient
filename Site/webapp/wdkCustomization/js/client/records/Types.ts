import React from 'react';

import { requestPartialRecord } from 'wdk-client/Actions/RecordActions';
import { AttributeField, RecordInstance, RecordClass, TableField, TableValue } from 'wdk-client/Utils/WdkModel';
import { CategoryTreeNode } from 'wdk-client/Utils/CategoryUtils';

export type WrappedComponentProps<T> = T & { DefaultComponent: React.ComponentType<T> };

export interface RecordAttributeSectionProps {
  attribute: AttributeField;
  isCollapsed: boolean;
  onCollapsedChange: () => void;
  ontologyProperties: CategoryTreeNode['properties'];
  record: RecordInstance;
  recordClass: RecordClass;
  requestPartialRecord: typeof requestPartialRecord;
}

export interface RecordTableProps {
  className?: string;
  record: RecordInstance;
  recordClass: RecordClass;
  table: TableField;
  value: TableValue;
}

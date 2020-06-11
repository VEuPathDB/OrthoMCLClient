import React from 'react';

import { OrthoMCLPage } from './components/layout/OrthoMCLPage';
import {
  RecordAttributeSection as GroupRecordAttributeSection,
  RecordAttributeSectionProps
} from './records/GroupRecordClasses.GroupRecordClass';

export default {
  Page: () => OrthoMCLPage,
  RecordAttributeSection: makeDynamicWrapper('RecordAttributeSection', (props: RecordAttributeSectionProps) => props.recordClass.fullName)
};

const GROUP_RECORD_CLASS_NAME = 'GroupRecordClasses.GroupRecordClass';
const SEQUENCE_RECORD_CLASS_NAME = 'SequenceRecordClasses.SequenceRecordClass';

const wrappedComponentsByRecordClass: Record<string, Record<string, React.ComponentType<any>>> = {
  [GROUP_RECORD_CLASS_NAME]: {
    RecordAttributeSection: GroupRecordAttributeSection
  },
  [SEQUENCE_RECORD_CLASS_NAME]: {}
};

function makeDynamicWrapper<P>(componentName: string, getWrapperType: (props: P) => string) {
  return function dynamicWrapper(DefaultComponent: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      const wrapperType = getWrapperType(props);
      const availableWrappers = wrappedComponentsByRecordClass[wrapperType] || {};
      const ResolvedComponent = availableWrappers[componentName] || DefaultComponent;

      return <ResolvedComponent {...props} DefaultComponent={DefaultComponent} />;
    };
  };
}
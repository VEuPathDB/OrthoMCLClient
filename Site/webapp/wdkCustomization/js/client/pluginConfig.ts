import { ClientPluginRegistryEntry } from 'wdk-client/Utils/ClientPlugin';

import { Form as GroupsByPhyleticPatternForm } from '../questions/GroupsByPhyleticPattern/Form';

import { PhyleticPattern } from 'ortho-client/results/PhyleticPattern';

const orthoPluginConfig: ClientPluginRegistryEntry<any>[] = [
  {
    type: 'questionForm',
    searchName: 'GroupsByPhyleticPattern',
    component: GroupsByPhyleticPatternForm
  },
  {
    type: 'summaryView',
    name: 'phyletic',
    component: PhyleticPattern
  }
];

export default orthoPluginConfig;

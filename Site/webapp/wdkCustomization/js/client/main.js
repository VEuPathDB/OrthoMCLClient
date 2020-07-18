import { initialize } from 'ebrc-client/bootstrap';
import componentWrappers from './component-wrappers';
import { wrapRoutes } from './routes';
import { wrapWdkService } from './services';

import 'eupathdb/wdkCustomization/css/client.scss';
import '../../css/client.scss';

initialize({
  componentWrappers,
  wrapRoutes,
  wrapWdkService
});

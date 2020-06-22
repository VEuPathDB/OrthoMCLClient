import { RouteEntry } from 'wdk-client/Core/RouteEntry';

import { OrthoMCLHomePageController } from './controllers/OrthoMCLHomePageController';
import { ClusterGraphController } from './controllers/ClusterGraphController';

export function wrapRoutes(ebrcRoutes: RouteEntry[]): RouteEntry[] {
  return [
    {
      path: '/',
      component: OrthoMCLHomePageController,
      rootClassNameModifier: 'home-page'
    },
    // TODO: Delete this route once the initial implementation
    // TODO: of the cluster graph is complete
    {
      path: '/cluster-graph/:groupName',
      component: ClusterGraphController
    },
    ...ebrcRoutes
  ];
}

import React, { useEffect, useMemo, useRef } from 'react';

import cytoscape, {
  Core,
  CytoscapeOptions,
  EdgeDefinition,
  EventObjectEdge,
  EventObjectNode,
  EdgeSingular,
  NodeDefinition,
  NodeSingular,
  Stylesheet
} from 'cytoscape';
import { noop, orderBy, range } from 'lodash';

import {
  EdgeTypeOption,
  NodeDisplayType,
  EdgeType,
  edgeTypeDisplayNames
} from '../../utils/clusterGraph';
import {
  EcNumberEntry,
  EdgeEntry,
  GroupLayout,
  NodeEntry,
  PfamDomainEntry
} from '../../utils/groupLayout';
import { TaxonUiMetadata } from '../../utils/taxons';

import './ClusterGraphCanvas.scss';

const MAX_PIE_SLICES = 16;

interface Props {
  layout: GroupLayout;
  taxonUiMetadata: TaxonUiMetadata;
  edgeTypeOptions: EdgeTypeOption[];
  highlightedEdgeType: EdgeType | undefined;
  eValueExp: number;
  selectedNodeDisplayType: NodeDisplayType;
  highlightedLegendNodeIds: string[];
  highlightedSequenceNodeId: string | undefined;
  highlightedBlastEdgeId: string | undefined;
  onClickNode: (clickedNode: string) => void;
}

export function ClusterGraphCanvas({
  layout,
  taxonUiMetadata,
  edgeTypeOptions,
  highlightedEdgeType,
  eValueExp,
  selectedNodeDisplayType,
  highlightedLegendNodeIds,
  highlightedSequenceNodeId,
  highlightedBlastEdgeId,
  onClickNode
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core>();

  useInitializeCyEffect(canvasRef, cyRef, layout, taxonUiMetadata);

  useCyEffect(cyRef, cy => {
    const handleNodeClick = makeHandleNodeClick(onClickNode);

    cy.on('click', 'node', handleNodeClick);

    return () => {
      cy.off('click', 'node', handleNodeClick);
    };
  }, [ onClickNode ]);

  useCyEffect(cyRef, cy => {
    cy.on('mouseover', 'node', handleNodeMouseOver);
    cy.on('mouseout', 'node', handleNodeMouseOut);

    return () => {
      cy.off('mouseover', 'node', handleNodeMouseOver);
      cy.off('mouseout', 'node', handleNodeMouseOut);
    };
  }, []);

  useCyEffect(cyRef, cy => {
    cy.on('mouseover', 'edge', handleEdgeMouseOver);
    cy.on('mouseout', 'edge', handleEdgeMouseOut);

    return () => {
      cy.off('mouseover', 'edge', handleEdgeMouseOver);
      cy.off('mouseout', 'edge', handleEdgeMouseOut);
    };
  }, []);

  useCyEffect(cyRef, cy => {
    cy.edges().forEach(unhighlightEdgeType);

    cy.batch(() => {
      cy.edges().forEach(edge => {
        if (edge.data('type') === highlightedEdgeType) {
          highlightEdgeType(edge);
        }
      })
    })
  }, [ highlightedEdgeType ]);

  useCyEffect(cyRef, cy => {
    cy.edges().forEach(unfilterEdge);

    const selectedEdgeTypes = new Set(
      edgeTypeOptions
        .filter(edgeTypeOption => edgeTypeOption.isSelected)
        .map(edgeTypeOption => edgeTypeOption.key)
    );

    const maxEValue = parseFloat(`1e${eValueExp}`);

    cy.batch(() => {
      cy.edges().forEach(edge => {
        if (
          !selectedEdgeTypes.has(edge.data('type')) ||
          edge.data('eValue') > maxEValue
        ) {
          filterEdge(edge);
        }
      });
    });
  }, [ eValueExp, edgeTypeOptions ]);

  useCyEffect(cyRef, cy => {
    cy.nodes().classes(selectedNodeDisplayType);
  }, [ selectedNodeDisplayType ]);

  useCyEffect(cyRef, cy => {
    cy.nodes().forEach(unhighlightNode);

    cy.batch(() => {
      highlightedLegendNodeIds.forEach(highlightedLegendNodeId => {
        const element = cy.getElementById(highlightedLegendNodeId);

        if (element.isNode()) {
          highlightNode(element);
        }
      });
    });
  }, [ highlightedLegendNodeIds ]);

  useCyEffect(cyRef, cy => {
    cy.nodes().forEach(unhighlightNode);

    if (highlightedSequenceNodeId != null) {
      const element = cy.getElementById(highlightedSequenceNodeId);

      highlightNode(element);
    }
  }, [ highlightedSequenceNodeId ]);

  useCyEffect(cyRef, cy => {
    cy.edges().forEach(unhighlightEdge);

    if (highlightedBlastEdgeId != null) {
      const element = cy.getElementById(highlightedBlastEdgeId);

      highlightEdge(element);
    }
  }, [ highlightedBlastEdgeId ]);

  return <div ref={canvasRef} className="ClusterGraphCanvas"></div>;
}

function useInitializeCyEffect(
  canvasRef: React.RefObject<HTMLDivElement>,
  cyRef: React.MutableRefObject<Core | undefined>,
  layout: GroupLayout,
  taxonUiMetadata: TaxonUiMetadata
) {
  const orderedEcNumbers = useOrderedEcNumbers(layout);
  const ecNumberNPieSlices = Math.min(orderedEcNumbers.length, MAX_PIE_SLICES);

  const orderedPfamDomains = useOrderedPfamDomains(layout);
  const pfamDomainNPieSlices = Math.min(orderedPfamDomains.length, MAX_PIE_SLICES);

  const nodes = useNodes(
    layout,
    taxonUiMetadata,
    orderedEcNumbers,
    ecNumberNPieSlices,
    orderedPfamDomains,
    pfamDomainNPieSlices
  );

  const edges = useEdges(layout);
  const style = useStyle(ecNumberNPieSlices, pfamDomainNPieSlices);
  const options = useOptions();

  useEffect(() => {
    if (canvasRef.current != null) {
      const cy = cytoscape({
        container: canvasRef.current,
        elements: { nodes, edges },
        style,
        ...options
      });

      cyRef.current = cy;
    }

    return () => {
      if (cyRef.current != null) {
        cyRef.current.destroy();
      }
    };
  }, [ canvasRef.current, nodes, edges, style, options ]);
}

interface CyEffectCallback {
  (cy: Core): (void | (() => void | undefined));
};

function useCyEffect(
  cyRef: React.MutableRefObject<Core | undefined>,
  effect: CyEffectCallback,
  deps?: React.DependencyList
) {
  useEffect(() => {
    if (cyRef.current == null) {
      return noop;
    }

    return effect(cyRef.current);
  }, deps == null ? [ cyRef.current ] : [ cyRef.current, ...deps ]);
}

function useOrderedEcNumbers(layout: GroupLayout) {
  return useMemo(
    () => orderBy(
      Object.values(layout.group.ecNumbers),
      [ ecNumber => ecNumber.count, ecNumber => ecNumber.index ],
      [ 'desc', 'asc' ]
    ),
    [ layout ]
  );
}

function useOrderedPfamDomains(layout: GroupLayout) {
  return useMemo(
    () => orderBy(
      Object.values(layout.group.pfamDomains),
      [ pfamDomain => pfamDomain.count, pfamDomain => pfamDomain.index ],
      [ 'desc', 'asc' ]
    ),
    [ layout ]
  );
}

function useNodes(
  layout: GroupLayout,
  taxonUiMetadata: TaxonUiMetadata,
  orderedEcNumbers: EcNumberEntry[],
  ecNumberNPieSlices: number,
  orderedPfamDomains: PfamDomainEntry[],
  pfamDomainNPieSlices: number,
): NodeDefinition[] {
  return useMemo(
    () =>
      Object.values(layout.nodes).map(
        nodeEntry =>
          ({
            group: 'nodes',
            data: nodeEntryToCytoscapeData(
              nodeEntry,
              layout,
              taxonUiMetadata,
              orderedEcNumbers,
              ecNumberNPieSlices,
              orderedPfamDomains,
              pfamDomainNPieSlices
            ),
            position: {
              x: Number(nodeEntry.x),
              y: Number(nodeEntry.y)
            }
          })
      ),
      [ layout ]
  );
}

interface NodeData {
  id: string;
  groupColor: string;
  speciesColor: string;
  ecPieColors: string[];
  ecPieSliceSize: string;
  pfamPieColors: string[];
  pfamPieSliceSize: string;
}

function nodeEntryToCytoscapeData(
  nodeEntry: NodeEntry,
  layout: GroupLayout,
  taxonUiMetadata: TaxonUiMetadata,
  orderedEcNumbers: EcNumberEntry[],
  ecNumberNPieSlices: number,
  orderedPfamDomains: PfamDomainEntry[],
  pfamDomainNPieSlices: number
): NodeData {
  return {
    id: nodeEntry.id,
    ...nodeEntryToTaxonColors(nodeEntry, layout, taxonUiMetadata),
    ...nodeEntryToEcNumberPieData(nodeEntry, layout, orderedEcNumbers, ecNumberNPieSlices),
    ...nodeEntryToPfamDomainPieData(nodeEntry, layout, orderedPfamDomains, pfamDomainNPieSlices),
  };
}

function nodeEntryToTaxonColors(
  nodeEntry: NodeEntry,
  { group: { genes } }: GroupLayout,
  { species }: TaxonUiMetadata
) {
  const taxonAbbrev = genes[nodeEntry.id].taxon.abbrev;
  const nodeSpecies = species[taxonAbbrev];

  return {
    groupColor: nodeSpecies.groupColor,
    speciesColor: nodeSpecies.color
  };
}

function nodeEntryToEcNumberPieData(
  nodeEntry: NodeEntry,
  { group: { genes } }: GroupLayout,
  orderedEcNumbers: EcNumberEntry[],
  ecNumberNPieSlices: number
) {
  const nodeEcNumbers = genes[nodeEntry.id].ecNumbers;

  const ecPieColors = orderedEcNumbers.slice(0, ecNumberNPieSlices).map(
    ecNumber => nodeEcNumbers.includes(ecNumber.code)
      ? ecNumber.color
      : 'white'
  );

  return {
    ecPieColors,
    ecPieSliceSize: `${(100 / ecNumberNPieSlices)}%`
  };
}

function nodeEntryToPfamDomainPieData(
  nodeEntry: NodeEntry,
  { group: { genes } }: GroupLayout,
  orderedPfamDomains: PfamDomainEntry[],
  pfamDomainNPieSlices: number
) {
  const nodePfamDomains = Object.keys(genes[nodeEntry.id].pfamDomains);

  const pfamPieColors = orderedPfamDomains.slice(0, pfamDomainNPieSlices).map(
    pfamDomain => nodePfamDomains.includes(pfamDomain.accession)
      ? pfamDomain.color
      : 'white'
  );

  return {
    pfamPieColors,
    pfamPieSliceSize: `${(100 / pfamDomainNPieSlices)}%`
  };
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  eValue: number;
}

function useEdges(layout: GroupLayout): EdgeDefinition[] {
  return useMemo(
    () =>
      Object.entries(layout.edges).map(([ edgeId, edgeEntry ]) =>
        ({
          group: 'edges',
          data: makeEdgeData(edgeId, edgeEntry),
          selectable: false
        })
  ), [ layout.edges ]);
}

function makeEdgeData(edgeId: string, edgeEntry: EdgeEntry): EdgeData {
  return {
    id: edgeId,
    source: edgeEntry.queryId,
    target: edgeEntry.subjectId,
    type: edgeEntry.T,
    label: `${edgeTypeDisplayNames[edgeEntry.T]}, evalue=${edgeEntry.E}`,
    eValue: Number(edgeEntry.E)
  };
}

function useStyle(ecNumberNPieSlices: number, pfamDomainNPieSlices: number): Stylesheet[] {
  return useMemo(
    () => [
      {
        selector: 'node',
        css: {
          'shape': 'ellipse',
          'width': 20,
          'height': 20,
          'z-index-compare': 'manual',
          'z-index': 2
        }
      },
      {
        selector: 'node.taxa',
        css: {
          'background-color': 'data(speciesColor)',
          'border-color': 'data(groupColor)',
          'border-width': 6
        }
      },
      {
        selector: 'node.ec-numbers',
        css: {
          'background-color': 'white',
          'border-color': 'black',
          'border-width': 1,
          ...makePieStyles(ecNumberNPieSlices, 'ec')
        }
      },
      {
        selector: 'node.pfam-domains',
        css: {
          'background-color': 'white',
          'border-color': 'black',
          'border-width': 1,
          ...makePieStyles(pfamDomainNPieSlices, 'pfam')
        }
      },
      {
        selector: 'node.highlighted',
        css: {
          'label': 'data(id)',
          'width': 30,
          'height': 30,
          'text-outline-color': 'white',
          'text-outline-width': 2,
          'text-halign': 'right',
          'text-valign': 'center',
          'text-margin-x': 2,
          'text-margin-y': -6,
          'z-index': 3,
          'font-size': 15,
          'font-weight': 'bold'
        }
      },
      {
        selector: 'node.highlighted.source.left-to-right, node.highlighted.target.right-to-left',
        css: {
          'text-halign': 'left'
        }
      },
      {
        selector: 'node.highlighted.target.left-to-right, node.highlighted.source.right-to-left',
        css: {
          'text-halign': 'right'
        }
      },
      {
        selector: 'node.highlighted.source.top-to-bottom, node.highlighted.target.bottom-to-top',
        css: {
          'text-valign': 'top',
          'text-margin-y': 10
        }
      },
      {
        selector: 'node.highlighted.target.top-to-bottom, node.highlighted.source.bottom-to-top',
        css: {
          'text-valign': 'bottom',
          'text-margin-y': -16
        }
      },
      {
        selector: 'edge',
        css: {
          'curve-style': 'straight',
          'line-color': 'black',
          'width': 1,
          'opacity': 0.2,
          'z-index-compare': 'manual',
          'z-index': 1
        }
      },
      {
        selector: 'edge.highlighted',
        css: {
          'opacity': 1,
          'width': 3,
          'label': 'data(label)',
          'text-outline-color': 'white',
          'text-outline-width': 2,
          'z-index': 4,
          'font-size': 15,
          'font-weight': 'bold'
        }
      },
      {
        selector: 'edge.type-highlighted',
        css: {
          'line-color': 'red'
        }
      },
      {
        selector: 'edge.filtered-out',
        css: {
          'display': 'none'
        }
      }
    ],
    []
  );
}

function makePieStyles(nPieSlices: number, dataPrefix: string) {
  const sliceStyles = range(0, nPieSlices).reduce(
    (memo, i) => ({
      ...memo,
      [`pie-${i + 1}-background-color`]: `data(${dataPrefix}PieColors.${i})`,
      [`pie-${i + 1}-background-size`]: `data(${dataPrefix}PieSliceSize)`
    }),
    {}
  );

  return {
    'pie-size': '100%',
    ...sliceStyles
  };
}

function useOptions(): CytoscapeOptions {
  return useMemo(
    () => ({
      layout: { name: 'preset' },
      zoom: 1,
      zoomingEnabled: false,
      userZoomingEnabled: false,
      autolock: true,
      panningEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
      autoungrabbify: true,
      autounselectify: true,
      pixelRatio: window.devicePixelRatio
    }),
    []
  );
}

function makeHandleNodeClick(onClickNode: Props['onClickNode']) {
  return function(evt: EventObjectNode) {
    onClickNode(evt.target.data('id'));
  };
}

function handleNodeMouseOver(evt: EventObjectNode) {
  highlightNode(evt.target);
}

function handleNodeMouseOut(evt: EventObjectNode) {
  unhighlightNode(evt.target);
}

function handleEdgeMouseOver(evt: EventObjectEdge) {
  highlightEdge(evt.target);
};

function handleEdgeMouseOut(evt: EventObjectEdge) {
  unhighlightEdge(evt.target);
};

function highlightNode(node: NodeSingular) {
  node.addClass('highlighted');
}

function unhighlightNode(node: NodeSingular) {
  node.removeClass('highlighted');
}

function highlightEdge(edge: EdgeSingular) {
  const source = edge.source();
  const target = edge.target();

  const horizontalFlow = source.position('x') >= target.position('x')
    ? 'right-to-left'
    : 'left-to-right';

  const verticalFlow = source.position('y') <= target.position('y')
    ? 'top-to-bottom'
    : 'bottom-to-top';

  source
    .addClass('highlighted')
    .addClass('source')
    .addClass(horizontalFlow)
    .addClass(verticalFlow);

  target
    .addClass('highlighted')
    .addClass('target')
    .addClass(horizontalFlow)
    .addClass(verticalFlow);

  edge.addClass('highlighted');
}

function unhighlightEdge(edge: EdgeSingular) {
  const source = edge.source();
  const target = edge.target();

  source
    .removeClass('highlighted')
    .removeClass('source')
    .removeClass('left-to-right')
    .removeClass('right-to-left')
    .removeClass('top-to-bottom')
    .removeClass('bottom-to-top');

  target
    .removeClass('highlighted')
    .removeClass('target')
    .removeClass('left-to-right')
    .removeClass('right-to-left')
    .removeClass('top-to-bottom')
    .removeClass('bottom-to-top');

  edge.removeClass('highlighted');
}

function highlightEdgeType(edge: EdgeSingular) {
  edge.addClass('type-highlighted');
}

function unhighlightEdgeType(edge: EdgeSingular) {
  edge.removeClass('type-highlighted');
}

function filterEdge(edge: EdgeSingular) {
  edge.addClass('filtered-out');
}

function unfilterEdge(edge: EdgeSingular) {
  edge.removeClass('filtered-out');
}

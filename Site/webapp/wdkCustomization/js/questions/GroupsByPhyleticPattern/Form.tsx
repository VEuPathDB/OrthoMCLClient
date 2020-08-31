import React, { useCallback, useMemo, useState } from 'react';

import { orderBy } from 'lodash';

import { CheckboxTree, Loading } from 'wdk-client/Components';
import { LinksPosition } from 'wdk-client/Components/CheckboxTree/CheckboxTree';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { mapStructure } from 'wdk-client/Utils/TreeUtils';
import { ParameterGroup } from 'wdk-client/Utils/WdkModel';
import { Props } from 'wdk-client/Views/Question/DefaultQuestionForm';

import { EbrcDefaultQuestionForm } from 'ebrc-client/components/questions/EbrcDefaultQuestionForm';

import { useTaxonUiMetadata } from 'ortho-client/hooks/taxons';
import { TaxonTree } from 'ortho-client/utils/taxons';

import './Form.scss';

const cxDefaultQuestionForm = makeClassNameHelper('wdk-QuestionForm');
const cxPhyleticExpression = makeClassNameHelper('PhyleticExpression');

const PHYLETIC_EXPRESSION_PARAM_NAME = 'phyletic_expression';

export function Form(props: Props) {
  const renderParamGroup = useCallback((group: ParameterGroup, formProps: Props) => {
    return (
      <div key={group.name} className={cxDefaultQuestionForm('ParameterList')}>
        <div className={cxDefaultQuestionForm('ParameterControl')}>
          <PhyleticExpressionParameter
            phyleticExpressionTextField={formProps.parameterElements[PHYLETIC_EXPRESSION_PARAM_NAME]}
          />
        </div>
      </div>
    );
  }, []);

  return (
    <EbrcDefaultQuestionForm
      {...props}
      containerClassName={`${cxDefaultQuestionForm()} ${cxDefaultQuestionForm('GroupsByPhyleticPattern')}`}
      renderParamGroup={renderParamGroup}
    />
  );
}

interface PhyleticExpressionParameterProps {
  phyleticExpressionTextField: React.ReactNode;
}

function PhyleticExpressionParameter(props: PhyleticExpressionParameterProps) {
  const taxonUiMetadata = useTaxonUiMetadata();

  const [ expandedNodes, setExpandedNodes ] = useState([] as string[]);

  const phyleticExressionUiTree = useMemo(
    () => taxonUiMetadata == null
      ? undefined
      : makePhyleticExpressionUiTree(taxonUiMetadata.taxonTree),
    [ taxonUiMetadata ]
  );

  return phyleticExressionUiTree == null
    ? <Loading />
    : <div className="PhyleticExpressionParameter">
        {props.phyleticExpressionTextField}
        <CheckboxTree
          tree={phyleticExressionUiTree}
          getNodeId={getNodeId}
          getNodeChildren={getNodeChildren}
          onExpansionChange={setExpandedNodes}
          shouldExpandOnClick={false}
          expandedList={expandedNodes}
          renderNode={renderNode}
          showRoot
          linksPosition={LinksPosition.Top}
        />
      </div>;
}

type SelectionState =
  | 'free'
  | 'include-at-least-one'
  | 'include-all'
  | 'exclude'
  | 'mixed';

interface PhyleticExressionUiTree extends TaxonTree {
  children: PhyleticExressionUiTree[];
  selectionState: SelectionState;
  speciesCount: number;
}

function makePhyleticExpressionUiTree(taxonTree: TaxonTree): PhyleticExressionUiTree {
  return mapStructure(
    (node, mappedChildren) => ({
      ...node,
      children: orderBy(
        mappedChildren,
        child => child.species,
        'desc'
      ),
      selectionState: 'free',
      speciesCount: node.species
        ? 1
        : mappedChildren.reduce(
            (memo, { speciesCount }) => memo + speciesCount,
            0
          )
    }),
    taxonTree => taxonTree.children,
    taxonTree
  );
}

function getNodeId(node: PhyleticExressionUiTree) {
  return node.abbrev;
}

function getNodeChildren(node: PhyleticExressionUiTree) {
  return node.children;
}

function renderNode(node: PhyleticExressionUiTree, path: number[] | undefined) {
  const containerClassName = cxPhyleticExpression(
    '--Node',
    path?.length === 1 ? 'root' : 'interior',
    node.species && 'species'
  );

  const selectionClassName = cxPhyleticExpression(
    '--NodeSelection',
    node.selectionState
  );

  return (
    <div className={containerClassName}>
      <span className={selectionClassName}></span>
      <span>{node.name} ({node.abbrev})</span>
    </div>
  );
}

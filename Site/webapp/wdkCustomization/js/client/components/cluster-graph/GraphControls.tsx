import React, { useCallback, useEffect, useState } from 'react';

import { Checkbox, SliderInput, TextBox, RadioList } from 'wdk-client/Components';

import { EdgeTypeOption, EdgeType, NodeDisplayType, TaxonLegendEntry } from '../../utils/clusterGraph';

type Props = EdgeOptionsProps & NodeOptionsProps;

export function GraphControls({
  edgeTypeOptions,
  selectEdgeTypeOption,
  minEValueExp,
  maxEValueExp,
  eValueExp,
  selectEValueExp,
  nodeDisplayTypeOptions,
  selectedNodeDisplayType,
  setSelectedNodeDisplayType,
  taxonLegendEntries
}: Props) {
  return (
    <div className="GraphControls">
      <EdgeOptions
        edgeTypeOptions={edgeTypeOptions}
        selectEdgeTypeOption={selectEdgeTypeOption}
        minEValueExp={minEValueExp}
        maxEValueExp={maxEValueExp}
        eValueExp={eValueExp}
        selectEValueExp={selectEValueExp}
      />
      <NodeOptions
        nodeDisplayTypeOptions={nodeDisplayTypeOptions}
        selectedNodeDisplayType={selectedNodeDisplayType}
        setSelectedNodeDisplayType={setSelectedNodeDisplayType}
        taxonLegendEntries={taxonLegendEntries}
      />
    </div>
  );
}

interface EdgeOptionsProps {
  edgeTypeOptions: EdgeTypeOption[];
  selectEdgeTypeOption: (selectedEdge: EdgeType, newValue: boolean) => void;
  minEValueExp: number;
  maxEValueExp: number;
  eValueExp: number;
  selectEValueExp: (newEValueExp: number) => void;
}

function EdgeOptions({
  edgeTypeOptions,
  selectEdgeTypeOption,
  minEValueExp,
  maxEValueExp,
  eValueExp,
  selectEValueExp
}: EdgeOptionsProps) {
  const { internalEValueText, setInternalEValueText } = useInternalEValueTextState(
    minEValueExp,
    maxEValueExp,
    eValueExp,
    selectEValueExp
  );

  return (
    <div className="EdgeOptions">
      <details open>
        <summary>
          Edge Options
        </summary>
        <fieldset className="EdgeTypeOptions">
          <legend>
            Edge Type
          </legend>
          {
            edgeTypeOptions.map(
              ({ key, display, isSelected }) =>
                <div className="EdgeTypeOption" key={key}>
                  <Checkbox
                    key={key}
                    value={isSelected}
                    onChange={newValue => selectEdgeTypeOption(key, newValue)}
                  />
                  <label>
                    {display}
                  </label>
                </div>
            )
          }
        </fieldset>
        <fieldset className="ScoreControl">
          <legend>
            E-Value Cutoff
          </legend>
          <div className="EValueHead">
            <div>
              Max E-Value:
            </div>
            <div className="EValueText">
              1E
              <TextBox
                value={internalEValueText}
                onChange={setInternalEValueText}
              />
            </div>
          </div>
          <SliderInput
            className="EValueSlider"
            value={eValueExp}
            min={minEValueExp}
            max={maxEValueExp}
            step={1}
            onChange={selectEValueExp}
          />
        </fieldset>
      </details>
    </div>
  );
}

function useInternalEValueTextState(
  minEValueExp: EdgeOptionsProps['minEValueExp'],
  maxEValueExp: EdgeOptionsProps['maxEValueExp'],
  eValueExp: EdgeOptionsProps['eValueExp'],
  selectEValueExp: EdgeOptionsProps['selectEValueExp']
) {
  const [ internalEValueText, setInternalEValueText ] = useState(String(eValueExp));

  useEffect(() => {
    setInternalEValueText(String(eValueExp));
  }, [ eValueExp ]);

  useEffect(() => {
    const numericValue = Number(internalEValueText);

    if (
      minEValueExp <= numericValue &&
      numericValue <= maxEValueExp &&
      eValueExp !== numericValue
    ) {
      selectEValueExp(numericValue);
    }
  }, [ internalEValueText ]);

  return {
    internalEValueText,
    setInternalEValueText
  };
}

interface NodeOptionsProps {
  nodeDisplayTypeOptions: { value: NodeDisplayType, display: React.ReactNode, disabled?: boolean }[];
  selectedNodeDisplayType: NodeDisplayType;
  setSelectedNodeDisplayType: (newNodeDisplayType: NodeDisplayType) => void;
  taxonLegendEntries: TaxonLegendEntry[];
}

function NodeOptions({
  nodeDisplayTypeOptions,
  selectedNodeDisplayType,
  setSelectedNodeDisplayType,
  taxonLegendEntries
}: NodeOptionsProps) {
  const onNodeDisplayTypeChange = useCallback((newValue: string) => {
    setSelectedNodeDisplayType(newValue as NodeDisplayType);
  }, [ setSelectedNodeDisplayType ]);

  return (
    <div className="NodeOptions">
      <details open>
        <summary>
          Node Options
        </summary>
      </details>
      <RadioList
        name="node-display-type"
        value={selectedNodeDisplayType}
        items={nodeDisplayTypeOptions}
        onChange={onNodeDisplayTypeChange}
      />
      {
        selectedNodeDisplayType === 'taxa' &&
        <div className="TaxaControlSection">
          {
            taxonLegendEntries.map(
              taxonLegendEntry =>
                <div key={taxonLegendEntry.id} className="TaxonLegendEntry">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    width="11"
                    height="11"
                  >
                    <circle
                      r="5.5"
                      cx="5.5"
                      cy="5.5"
                      fill={taxonLegendEntry.color}
                    />
                  </svg>
                  {taxonLegendEntry.abbrev}
                </div>
            )
          }
        </div>
      }
      {
        selectedNodeDisplayType !== 'taxa' &&
        <div>Under Construction</div>
      }
    </div>
  );
}

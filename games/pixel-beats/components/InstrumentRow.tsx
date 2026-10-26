import React from 'react';
import { SequencerStep } from './SequencerStep';
import { InstrumentSelector } from './InstrumentSelector';
import { GridRow, Instrument } from '../types';
import { AVAILABLE_INSTRUMENTS, STEPS } from '../constants';

interface InstrumentRowProps {
  row: GridRow;
  rowIndex: number;
  currentStep: number;
  onPatternChange: (stepIndex: number) => void;
  onInstrumentChange: (newInstrumentId: string) => void;
  onRowDelete: () => void;
}

export const InstrumentRow: React.FC<InstrumentRowProps> = ({
  row,
  currentStep,
  onPatternChange,
  onInstrumentChange,
  onRowDelete
}) => {
  const instrument = AVAILABLE_INSTRUMENTS.find(i => i.id === row.instrumentId);

  // Fallback if instrument ID is invalid (e.g. from old save)
  if (!instrument) return null;

  return (
    <div className="flex items-center mb-4 bg-black/20 p-2 rounded border border-gray-800 hover:border-gray-600 transition-colors">
      
      {/* Instrument Controls Left */}
      <div className="flex-shrink-0 z-20">
        <InstrumentSelector 
          currentInstrumentId={row.instrumentId} 
          onChange={onInstrumentChange} 
          onDelete={onRowDelete}
        />
      </div>

      {/* Steps Grid */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {row.pattern.map((active, stepIndex) => {
          // Add visual separator for beat grouping (every 4 steps)
          const isBeatStart = stepIndex > 0 && stepIndex % 4 === 0;
          
          return (
            <React.Fragment key={stepIndex}>
              {isBeatStart && <div className="w-2" />}
              <SequencerStep
                active={active}
                isCurrent={currentStep === stepIndex}
                color={instrument.color}
                onClick={() => onPatternChange(stepIndex)}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
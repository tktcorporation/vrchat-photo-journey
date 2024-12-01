import { ArrowRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import FixedHeightList from './FixedHeightList';
import VariableHeightList from './VariableHeightList';

const VirtualDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'fixed' | 'variable'>('fixed');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {activeView === 'fixed'
                ? 'Fixed Height Rows'
                : 'Variable Height Rows'}
            </h2>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setActiveView('fixed')}
              className={`px-3 py-1 rounded-md text-sm ${
                activeView === 'fixed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fixed Height
            </button>
            <button
              type="button"
              onClick={() => setActiveView('variable')}
              className={`px-3 py-1 rounded-md text-sm ${
                activeView === 'variable'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Variable Height
            </button>
          </div>
        </div>
      </div>
      <div className="h-[600px] relative">
        {activeView === 'fixed' ? <FixedHeightList /> : <VariableHeightList />}
      </div>
    </div>
  );
};

export default VirtualDemo;

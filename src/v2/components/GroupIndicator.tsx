import React from 'react';
import { ChevronDown } from 'lucide-react';

interface GroupIndicatorProps {
  currentGroup: string;
  totalGroups: number;
}

const GroupIndicator: React.FC<GroupIndicatorProps> = ({ currentGroup, totalGroups }) => {
  if (!currentGroup) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{currentGroup}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <span className="text-gray-500">全{totalGroups}グループ</span>
        </div>
      </div>
    </div>
  );
};

export default GroupIndicator;
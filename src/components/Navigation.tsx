import React from 'react';
import { Bot, Settings } from 'lucide-react';

interface NavigationProps {
  currentView: 'bots' | 'settings';
  onViewChange: (view: 'bots' | 'settings') => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex">
            <button
              onClick={() => onViewChange('bots')}
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                currentView === 'bots'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="w-5 h-5 mr-2" />
              Bots
            </button>

            <button
              onClick={() => onViewChange('settings')}
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                currentView === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
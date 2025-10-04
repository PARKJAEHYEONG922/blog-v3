import React from 'react';

export type ModuleType = 'blog' | 'neighbor';

export interface SidebarProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentModule, onModuleChange }) => {
  const modules = [
    {
      id: 'blog' as ModuleType,
      icon: '📝',
      label: '블로그 자동화',
      description: '콘텐츠 생성 & 발행'
    },
    {
      id: 'neighbor' as ModuleType,
      icon: '👥',
      label: '서로이웃 추가',
      description: '이웃 맺기'
    }
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex-shrink-0">
      <div className="h-full flex flex-col p-4">
        {/* Logo/Title */}
        <div className="mb-8 px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Blog Auto</h2>
              <p className="text-xs text-gray-500">v3.0</p>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <nav className="flex-1 space-y-2">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${
                currentModule === module.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl flex-shrink-0">{module.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${
                    currentModule === module.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {module.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    currentModule === module.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {module.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Powered by Claude AI
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';

const NeighborAddPage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              서로이웃 추가 기능
            </h2>
            <p className="text-gray-600 mb-4">
              이 기능은 곧 구현될 예정입니다.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800">
                💡 Python 코드를 TypeScript로 변환 중입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborAddPage;

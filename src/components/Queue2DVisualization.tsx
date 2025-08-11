import React, { useEffect, useState } from 'react';
import { Clock, Users, TrendingUp } from 'lucide-react';
import { DepartmentStats } from '../types';
import { Card, CardContent, CardHeader } from './ui/Card';

interface Queue2DVisualizationProps {
  departmentStats: DepartmentStats[];
  className?: string;
}

export const Queue2DVisualization: React.FC<Queue2DVisualizationProps> = ({ 
  departmentStats, 
  className = '' 
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getQueueEmojis = (waitingCount: number) => {
    const emojis = ['👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍🔬', '👩‍🔬', '🧑‍🔬'];
    const maxShow = Math.min(waitingCount, 12);
    const selectedEmojis = [];
    
    for (let i = 0; i < maxShow; i++) {
      selectedEmojis.push(emojis[i % emojis.length]);
    }
    
    return selectedEmojis;
  };

  const totalWaiting = departmentStats.reduce((sum, dept) => sum + dept.total_waiting, 0);
  const totalCompleted = departmentStats.reduce((sum, dept) => sum + dept.total_completed, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Waiting</p>
                <p className="text-2xl font-bold text-blue-600">{totalWaiting}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Departments</p>
                <p className="text-2xl font-bold text-purple-600">{departmentStats.length}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Queue Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentStats.map((dept, index) => {
          const queueEmojis = getQueueEmojis(dept.total_waiting);
          const isActive = dept.total_waiting > 0;
          
          return (
            <Card 
              key={dept.department} 
              className={`transition-all duration-500 ${
                isActive ? 'ring-2 ring-blue-200 shadow-lg' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: dept.color_code }}
                    ></div>
                    <h3 className="font-semibold text-gray-900">{dept.display_name}</h3>
                  </div>
                  {isActive && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-blue-600">{dept.now_serving}</div>
                    <div className="text-xs text-blue-700">Now Serving</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-orange-600">{dept.total_waiting}</div>
                    <div className="text-xs text-orange-700">Waiting</div>
                  </div>
                </div>

                {/* Queue Visualization */}
                <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Queue</span>
                    <span className="text-xs text-gray-500">
                      ~{dept.average_wait_time}min avg
                    </span>
                  </div>
                  
                  {dept.total_waiting === 0 ? (
                    <div className="flex items-center justify-center h-16 text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-xs">No Queue</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Current Patient */}
                      <div className="flex items-center space-x-2 p-2 bg-green-100 rounded border-l-4 border-green-500">
                        <span className="text-lg">🏥</span>
                        <span className="text-sm font-medium text-green-800">
                          Serving Token #{dept.now_serving}
                        </span>
                      </div>
                      
                      {/* Waiting Queue */}
                      <div className="flex flex-wrap gap-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xs font-medium text-yellow-800">Waiting:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {queueEmojis.map((emoji, emojiIndex) => (
                            <span
                              key={`${animationKey}-${emojiIndex}`}
                              className="text-lg animate-bounce"
                              style={{
                                animationDelay: `${emojiIndex * 0.1}s`,
                                animationDuration: '2s'
                              }}
                            >
                              {emoji}
                            </span>
                          ))}
                          {dept.total_waiting > 12 && (
                            <span className="text-sm text-gray-600 ml-1">
                              +{dept.total_waiting - 12} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium text-green-600">{dept.total_completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doctors:</span>
                    <span className="font-medium text-blue-600">{dept.doctor_count}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      backgroundColor: dept.color_code,
                      width: `${Math.min(100, (dept.total_completed / Math.max(1, dept.total_completed + dept.total_waiting)) * 100)}%`
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {departmentStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Departments</h3>
            <p className="text-gray-500">Add departments in the admin settings to see queue visualization.</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Currently Serving</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Waiting in Queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Active Department</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">👨‍⚕️👩‍⚕️</span>
              <span>Patients in Queue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
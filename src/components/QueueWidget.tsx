import React from 'react';
import { Clock, Users } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { useTranslation } from '../lib/translations';
import { estimateWaitTime } from '../lib/utils';

interface QueueWidgetProps {
  userSTN?: number;
  department?: string;
}

export const QueueWidget: React.FC<QueueWidgetProps> = ({ userSTN, department }) => {
  const { t } = useTranslation();
  const { queueStatus, loading } = useQueue(department);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-blue-200 rounded w-24"></div>
          <div className="h-4 bg-blue-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  const userPosition = userSTN ? Math.max(0, userSTN - queueStatus.now_serving) : 0;
  const estimatedWait = estimateWaitTime(userPosition);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600 mr-1" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{queueStatus.now_serving}</div>
          <div className="text-sm text-blue-700">{t('now_serving')}</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-blue-600 mr-1" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{queueStatus.total_waiting}</div>
          <div className="text-sm text-blue-700">{t('waiting')}</div>
        </div>

        {userSTN && (
          <>
            <div>
              <div className="text-2xl font-bold text-green-900">{userSTN}</div>
              <div className="text-sm text-green-700">{t('your_token')}</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-orange-900">{estimatedWait}m</div>
              <div className="text-sm text-orange-700">{t('est_wait')}</div>
            </div>
          </>
        )}
      </div>

      {userSTN && userPosition > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">{t('position_in_queue')}</span>
            <span className="font-semibold text-blue-900">#{userPosition}</span>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((queueStatus.now_serving - 1) / userSTN) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
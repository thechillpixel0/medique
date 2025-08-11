import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Analytics } from '../types';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Today's stats
      const { data: todayVisits } = await supabase
        .from('visits')
        .select('*, payment_transactions(*)')
        .eq('visit_date', today);

      const { data: weeklyVisits } = await supabase
        .from('visits')
        .select('visit_date, department, payment_transactions(*)')
        .gte('visit_date', weekAgo);

      const { data: monthlyVisits } = await supabase
        .from('visits')
        .select('department, payment_transactions(*)')
        .gte('visit_date', monthAgo);

      // Calculate today's analytics
      const completedToday = todayVisits?.filter(v => v.status === 'completed').length || 0;
      const revenueToday = todayVisits?.reduce((sum, visit) => {
        const transactions = visit.payment_transactions || [];
        return sum + transactions.reduce((tSum: number, t: any) => 
          t.status === 'completed' ? tSum + parseFloat(t.amount) : tSum, 0);
      }, 0) || 0;

      // Calculate weekly trends
      const visitsTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return weeklyVisits?.filter(v => v.visit_date === date).length || 0;
      }).reverse();

      const revenueTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dayVisits = weeklyVisits?.filter(v => v.visit_date === date) || [];
        return dayVisits.reduce((sum, visit) => {
          const transactions = visit.payment_transactions || [];
          return sum + transactions.reduce((tSum: number, t: any) => 
            t.status === 'completed' ? tSum + parseFloat(t.amount) : tSum, 0);
        }, 0);
      }).reverse();

      // Department distribution
      const departmentDistribution: { [key: string]: number } = {};
      weeklyVisits?.forEach(visit => {
        departmentDistribution[visit.department] = (departmentDistribution[visit.department] || 0) + 1;
      });

      // Monthly stats
      const monthlyRevenue = monthlyVisits?.reduce((sum, visit) => {
        const transactions = visit.payment_transactions || [];
        return sum + transactions.reduce((tSum: number, t: any) => 
          t.status === 'completed' ? tSum + parseFloat(t.amount) : tSum, 0);
      }, 0) || 0;

      const topDepartments = Object.entries(departmentDistribution)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        today: {
          total_visits: todayVisits?.length || 0,
          completed_visits: completedToday,
          revenue: revenueToday,
          average_wait_time: 15, // This would be calculated from actual wait times
        },
        weekly: {
          visits_trend: visitsTrend,
          revenue_trend: revenueTrend,
          department_distribution: departmentDistribution,
        },
        monthly: {
          total_visits: monthlyVisits?.length || 0,
          total_revenue: monthlyRevenue,
          top_departments: topDepartments,
          patient_satisfaction: 4.5, // This would come from feedback system
        },
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { analytics, loading, refetch: fetchAnalytics };
};
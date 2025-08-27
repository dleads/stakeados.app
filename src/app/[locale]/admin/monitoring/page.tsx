import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorMonitoringDashboard from '@/components/admin/monitoring/ErrorMonitoringDashboard';
import PerformanceMonitoringDashboard from '@/components/admin/monitoring/PerformanceMonitoringDashboard';
import SystemHealthDashboard from '@/components/admin/monitoring/SystemHealthDashboard';

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system health, performance, and errors',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Comprehensive monitoring of system health, performance, and errors
          </p>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Error Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <SystemHealthDashboard />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMonitoringDashboard />
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <ErrorMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

-- Create admin error logs table
CREATE TABLE IF NOT EXISTS admin_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    user_id UUID REFERENCES profiles(id),
    operation TEXT,
    context JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    duration NUMERIC NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES profiles(id),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id TEXT NOT NULL UNIQUE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('slow_operation', 'high_error_rate', 'memory_usage', 'api_latency')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system health checks table
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type TEXT NOT NULL,
    status TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    checked_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_error_logs_error_code ON admin_error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_admin_error_logs_user_id ON admin_error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_error_logs_created_at ON admin_error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_error_logs_operation ON admin_error_logs(operation);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_success ON performance_metrics(success);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_alert_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_acknowledged ON performance_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_check_type ON system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON system_health_checks(checked_at);

-- Enable RLS
ALTER TABLE admin_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admin can view all error logs" ON admin_error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert error logs" ON admin_error_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all performance alerts" ON performance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert performance alerts" ON performance_alerts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can update performance alerts" ON performance_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete performance alerts" ON performance_alerts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all health checks" ON system_health_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert health checks" ON system_health_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
    -- Delete error logs older than 90 days
    DELETE FROM admin_error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete performance metrics older than 30 days
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete acknowledged alerts older than 7 days
    DELETE FROM performance_alerts 
    WHERE acknowledged = true 
    AND acknowledged_at < NOW() - INTERVAL '7 days';
    
    -- Delete health checks older than 7 days
    DELETE FROM system_health_checks 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    error_code TEXT,
    error_count BIGINT,
    first_occurrence TIMESTAMPTZ,
    last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ael.error_code,
        COUNT(*) as error_count,
        MIN(ael.created_at) as first_occurrence,
        MAX(ael.created_at) as last_occurrence
    FROM admin_error_logs ael
    WHERE ael.created_at >= start_date 
    AND ael.created_at <= end_date
    GROUP BY ael.error_code
    ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_statistics(
    operation_name TEXT DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    operation TEXT,
    total_operations BIGINT,
    avg_duration NUMERIC,
    min_duration NUMERIC,
    max_duration NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.operation,
        COUNT(*) as total_operations,
        AVG(pm.duration) as avg_duration,
        MIN(pm.duration) as min_duration,
        MAX(pm.duration) as max_duration,
        (COUNT(*) FILTER (WHERE pm.success = true)::NUMERIC / COUNT(*)::NUMERIC) as success_rate
    FROM performance_metrics pm
    WHERE pm.timestamp >= start_date 
    AND pm.timestamp <= end_date
    AND (operation_name IS NULL OR pm.operation = operation_name)
    GROUP BY pm.operation
    ORDER BY total_operations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
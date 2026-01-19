import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Clock, Eye, MousePointer, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceData {
  avg_load_time: number;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
}

interface PerformanceMetricsProps {
  metrics: PerformanceData | null;
  loading?: boolean;
}

function getPerformanceScore(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function getScoreColor(score: 'good' | 'needs-improvement' | 'poor'): string {
  switch (score) {
    case 'good': return 'text-green-600 bg-green-100 dark:bg-green-950/30';
    case 'needs-improvement': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
    case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-950/30';
  }
}

function getScoreLabel(score: 'good' | 'needs-improvement' | 'poor'): string {
  switch (score) {
    case 'good': return 'Good';
    case 'needs-improvement': return 'Needs Work';
    case 'poor': return 'Poor';
  }
}

function getScoreIcon(score: 'good' | 'needs-improvement' | 'poor') {
  switch (score) {
    case 'good': return <TrendingUp className="h-4 w-4" />;
    case 'needs-improvement': return <Minus className="h-4 w-4" />;
    case 'poor': return <TrendingDown className="h-4 w-4" />;
  }
}

export function PerformanceMetrics({ metrics, loading = false }: PerformanceMetricsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const avgLoadTime = metrics?.avg_load_time || 0;
  const ttfb = metrics?.ttfb || 0;
  const fcp = metrics?.fcp || 0;
  const lcp = metrics?.lcp || 0;
  const cls = metrics?.cls || 0;

  const loadTimeScore = getPerformanceScore(avgLoadTime, { good: 2000, poor: 4000 });
  const ttfbScore = getPerformanceScore(ttfb, { good: 200, poor: 500 });
  const fcpScore = getPerformanceScore(fcp, { good: 1800, poor: 3000 });
  const lcpScore = getPerformanceScore(lcp, { good: 2500, poor: 4000 });
  const clsScore = getPerformanceScore(cls * 1000, { good: 100, poor: 250 });

  const metricsData = [
    {
      name: 'Page Load Time',
      value: `${(avgLoadTime / 1000).toFixed(2)}s`,
      description: 'Average time to fully load the page',
      score: loadTimeScore,
      icon: <Clock className="h-4 w-4" />,
      progress: Math.min(100, (4000 / Math.max(avgLoadTime, 100)) * 100),
    },
    {
      name: 'Time to First Byte (TTFB)',
      value: `${ttfb.toFixed(0)}ms`,
      description: 'Server response time',
      score: ttfbScore,
      icon: <Zap className="h-4 w-4" />,
      progress: Math.min(100, (500 / Math.max(ttfb, 10)) * 100),
    },
    {
      name: 'First Contentful Paint (FCP)',
      value: `${(fcp / 1000).toFixed(2)}s`,
      description: 'Time until first content appears',
      score: fcpScore,
      icon: <Eye className="h-4 w-4" />,
      progress: Math.min(100, (3000 / Math.max(fcp, 100)) * 100),
    },
    {
      name: 'Largest Contentful Paint (LCP)',
      value: `${(lcp / 1000).toFixed(2)}s`,
      description: 'Time until main content loads',
      score: lcpScore,
      icon: <Eye className="h-4 w-4" />,
      progress: Math.min(100, (4000 / Math.max(lcp, 100)) * 100),
    },
    {
      name: 'Cumulative Layout Shift (CLS)',
      value: cls.toFixed(3),
      description: 'Visual stability score',
      score: clsScore,
      icon: <MousePointer className="h-4 w-4" />,
      progress: Math.min(100, (0.25 / Math.max(cls, 0.001)) * 100),
    },
  ];

  // Calculate overall score
  const scores = [loadTimeScore, ttfbScore, fcpScore, lcpScore, clsScore];
  const goodCount = scores.filter(s => s === 'good').length;
  const overallScore = goodCount >= 4 ? 'good' : goodCount >= 2 ? 'needs-improvement' : 'poor';

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Website Performance</CardTitle>
          <Badge className={getScoreColor(overallScore)}>
            {getScoreIcon(overallScore)}
            <span className="ml-1">{getScoreLabel(overallScore)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metricsData.map((metric) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{metric.icon}</span>
                <span className="text-sm font-medium">{metric.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{metric.value}</span>
                <Badge variant="outline" className={`text-xs ${getScoreColor(metric.score)}`}>
                  {getScoreLabel(metric.score)}
                </Badge>
              </div>
            </div>
            <Progress value={metric.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

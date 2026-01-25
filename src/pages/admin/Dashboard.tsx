import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock, CheckCircle, Archive, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PostStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
}

export default function AdminDashboard() {
  const { profile, role } = useAuthContext();
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: posts } = await supabase
          .from('journal_posts')
          .select('status');

        if (posts) {
          setStats({
            total: posts.length,
            published: posts.filter(p => p.status === 'published').length,
            drafts: posts.filter(p => p.status === 'draft').length,
            scheduled: posts.filter(p => p.status === 'scheduled').length,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Total Posts', 
      value: stats.total, 
      icon: FileText,
      color: 'text-foreground',
    },
    { 
      label: 'Published', 
      value: stats.published, 
      icon: CheckCircle,
      color: 'text-green-600',
    },
    { 
      label: 'Drafts', 
      value: stats.drafts, 
      icon: Clock,
      color: 'text-yellow-600',
    },
    { 
      label: 'Scheduled', 
      value: stats.scheduled, 
      icon: Archive,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.display_name || 'there'}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/posts/new" className="tracking-widest uppercase">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-input rounded-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '—' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border border-input p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto py-4 rounded-none">
            <Link to="/admin/posts/new" className="flex flex-col items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-xs tracking-widest uppercase">Write New Post</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-none">
            <Link to="/admin/posts" className="flex flex-col items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-xs tracking-widest uppercase">Manage Drafts</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-none">
            <Link to="/admin/media" className="flex flex-col items-center gap-2">
              <Archive className="h-5 w-5" />
              <span className="text-xs tracking-widest uppercase">Media Library</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Role Info */}
      <div className="text-xs text-muted-foreground">
        You are signed in as <span className="uppercase font-medium">{role}</span>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useCaerholdDrafts, useCaerholdFeed } from '@/hooks/caerhold/useCaerholdPosts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileEdit, Clock, CheckCircle } from 'lucide-react';

export default function CaerholdAdminDashboard() {
  const { data: drafts, isLoading: draftsLoading } = useCaerholdDrafts();
  const { data: published, isLoading: publishedLoading } = useCaerholdFeed(5);

  const draftCount = drafts?.filter(d => d.status === 'draft').length || 0;
  const approvedCount = drafts?.filter(d => d.status === 'approved').length || 0;
  const scheduledCount = drafts?.filter(d => d.status === 'scheduled').length || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Dashboard</h1>
        <Button asChild className="tracking-widest uppercase">
          <Link to="/caerhold/admin/media">
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm tracking-widest uppercase text-muted-foreground flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm tracking-widest uppercase text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm tracking-widest uppercase text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">Pending publication</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm tracking-widest uppercase text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{published?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recent posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Drafts Needing Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg tracking-widest uppercase">Drafts Needing Review</CardTitle>
            <Button variant="outline" size="sm" asChild className="tracking-widest uppercase">
              <Link to="/caerhold/admin/drafts">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {draftsLoading ? (
            <p className="text-muted-foreground">Loading drafts...</p>
          ) : drafts && drafts.length > 0 ? (
            <div className="space-y-3">
              {drafts.slice(0, 5).map((draft) => (
                <Link
                  key={draft.id}
                  to={`/caerhold/admin/drafts/${draft.id}`}
                  className="flex items-center justify-between p-3 border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                      {draft.resident?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {draft.resident?.display_name || 'Unknown Resident'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {draft.media?.length || 0} media attached
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="tracking-widest uppercase">
                    {draft.status}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No drafts to review. Upload media and tag residents to create drafts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Published */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-widest uppercase">Recently Published</CardTitle>
        </CardHeader>
        <CardContent>
          {publishedLoading ? (
            <p className="text-muted-foreground">Loading published posts...</p>
          ) : published && published.length > 0 ? (
            <div className="space-y-3">
              {published.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                      {post.resident?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {post.resident?.display_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {post.caption || 'No caption'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {post.published_at && new Date(post.published_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No published posts yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

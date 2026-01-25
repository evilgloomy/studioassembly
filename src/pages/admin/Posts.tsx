import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePosts, useDeletePost } from '@/hooks/usePosts';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type PostStatus = Database['public']['Enums']['post_status'];

const statusColors: Record<PostStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function AdminPosts() {
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { isAdmin, isEditor } = useAuthContext();
  const { data: posts, isLoading } = usePosts({ 
    status: statusFilter, 
    search: search || undefined 
  });
  const deletePost = useDeletePost();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePost.mutateAsync(deleteId);
      toast({
        title: 'Post deleted',
        description: 'The post has been permanently removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the post. Please try again.',
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Posts</h1>
        <Button asChild>
          <Link to="/admin/posts/new" className="tracking-widest uppercase">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PostStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Table */}
      <div className="border border-input">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-widest uppercase">Title</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Author</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Status</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Date</TableHead>
              <TableHead className="text-xs tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No posts found. Create your first post!
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="font-medium">{post.title}</div>
                    {post.summary && (
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {post.summary}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author_profile?.display_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${statusColors[post.status]} rounded-none text-xs uppercase tracking-wider`}
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.published_at 
                      ? format(new Date(post.published_at), 'MMM d, yyyy')
                      : format(new Date(post.created_at), 'MMM d, yyyy')
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'published' && (
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/journal/${post.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/posts/${post.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {(isAdmin || isEditor) && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useCaerholdDrafts } from '@/hooks/caerhold/useCaerholdPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Image } from 'lucide-react';
import type { CaerholdPostStatus } from '@/types/caerhold';

const statusColors: Record<CaerholdPostStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  published: 'bg-green-100 text-green-800',
};

export default function CaerholdAdminDrafts() {
  const { data: drafts, isLoading } = useCaerholdDrafts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Drafts</h1>
      </div>

      {/* Drafts Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-widest uppercase">Resident</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Location</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Media</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Status</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Created</TableHead>
              <TableHead className="text-xs tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading drafts...
                </TableCell>
              </TableRow>
            ) : drafts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No drafts yet. Upload media and tag residents to create drafts.
                </TableCell>
              </TableRow>
            ) : (
              drafts?.map((draft) => (
                <TableRow key={draft.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-sm font-medium">
                        {draft.resident?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {draft.resident?.display_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {draft.resident?.handle}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {draft.location?.name || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Image className="h-4 w-4" />
                      {draft.media?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[draft.status]} tracking-widest uppercase`}>
                      {draft.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/caerhold/drafts/${draft.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

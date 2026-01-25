import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  email?: string;
}

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  author: 'bg-green-100 text-green-800',
};

const inviteSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  role: z.enum(['admin', 'editor', 'author']),
});

export default function AdminTeam() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'author' as AppRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for all users
      const members: TeamMember[] = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', role.user_id)
            .maybeSingle();

          return {
            ...role,
            profile,
          };
        })
      );

      return members;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Role removed',
        description: 'The team member role has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove the role.',
      });
    },
  });

  const handleInvite = async () => {
    setErrors({});

    const result = inviteSchema.safeParse(inviteForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: {
          data: {
            display_name: inviteForm.displayName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      // Add role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: inviteForm.role,
        });

      if (roleError) throw roleError;

      queryClient.invalidateQueries({ queryKey: ['team-members'] });

      toast({
        title: 'Team member added',
        description: `${inviteForm.displayName} has been added as ${inviteForm.role}.`,
      });

      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        password: '',
        displayName: '',
        role: 'author',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add team member.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Team</h1>
        <Button onClick={() => setShowInviteDialog(true)} className="tracking-widest uppercase">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Team Table */}
      <div className="border border-input">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-widest uppercase">Member</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Role</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Added</TableHead>
              <TableHead className="text-xs tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : teamMembers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No team members yet. Add your first team member!
                </TableCell>
              </TableRow>
            ) : (
              teamMembers?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.profile?.display_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.user_id === user?.id && '(You)'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${roleColors[member.role]} rounded-none text-xs uppercase tracking-wider`}
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new account for a team member with access to the admin panel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs tracking-widest uppercase">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={inviteForm.displayName}
                onChange={(e) => setInviteForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="John Doe"
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">{errors.displayName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-widest uppercase">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@studioassembly.ca"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-widest uppercase">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs tracking-widest uppercase">
                Role
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Author - Can create and edit own posts</SelectItem>
                  <SelectItem value="editor">Editor - Can manage all posts</SelectItem>
                  <SelectItem value="admin">Admin - Full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member's role? They will lose access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

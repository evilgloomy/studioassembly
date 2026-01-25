import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePost, useCreatePost, useUpdatePost, generateSlug } from '@/hooks/usePosts';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Send, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MediaPicker } from '@/components/admin/MediaPicker';

type PostStatus = Database['public']['Enums']['post_status'];

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  content: z.string().optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
});

type PostFormData = z.infer<typeof postSchema>;

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isEditor } = useAuthContext();
  const { toast } = useToast();

  const isEditing = !!id;
  const { data: existingPost, isLoading: isLoadingPost } = usePost(id);
  
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    cover_image_url: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PostFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [contentMediaPickerOpen, setContentMediaPickerOpen] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        summary: existingPost.summary || '',
        content: existingPost.content || '',
        cover_image_url: existingPost.cover_image_url || '',
        status: existingPost.status,
      });
      setAutoSlug(false);
    }
  }, [existingPost]);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.title),
      }));
    }
  }, [formData.title, autoSlug]);

  const handleChange = (field: keyof PostFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    
    if (field === 'slug') {
      setAutoSlug(false);
    }
  };

  const validateForm = (): boolean => {
    const result = postSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PostFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PostFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleGenerateSummary = async () => {
    if (!formData.content || formData.content.length < 100) {
      toast({
        variant: 'destructive',
        title: 'Not enough content',
        description: 'Please write at least 100 characters of content before generating a summary.',
      });
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          title: formData.title,
          content: formData.content,
        },
      });

      if (error) throw error;

      if (data?.summary) {
        handleChange('summary', data.summary);
        toast({
          title: 'Summary generated',
          description: 'AI has created an SEO-optimized summary for your post.',
        });
      }
    } catch (error: any) {
      console.error('Summary generation error:', error);
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: error.message || 'Failed to generate summary. Please try again.',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleInsertImage = (url: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      // Fallback: append to end
      const markdown = `\n![Image](${url})\n`;
      handleChange('content', formData.content + markdown);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = formData.content || '';
    const markdown = `![Image](${url})`;
    
    const newContent = content.substring(0, start) + markdown + content.substring(end);
    handleChange('content', newContent);

    // Restore cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + markdown.length, start + markdown.length);
    }, 0);
  };

  const handleSave = async (publishNow: boolean = false) => {
    if (!validateForm()) return;
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save posts.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        cover_image_url: formData.cover_image_url || null,
        summary: formData.summary || null,
        content: formData.content || null,
        status: publishNow ? 'published' as PostStatus : formData.status,
        published_at: publishNow ? new Date().toISOString() : (formData.status === 'published' && !isEditing ? new Date().toISOString() : undefined),
      };
      if (isEditing && existingPost) {
        await updatePost.mutateAsync({ id: existingPost.id, ...postData });
        toast({
          title: 'Post updated',
          description: publishNow ? 'Your post is now live!' : 'Changes saved successfully.',
        });
      } else {
        const newPost = await createPost.mutateAsync({
          ...postData,
          author_id: user.id,
        });
        toast({
          title: 'Post created',
          description: publishNow ? 'Your post is now live!' : 'Draft saved successfully.',
        });
        navigate(`/admin/posts/${newPost.id}/edit`, { replace: true });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save the post.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canPublish = isAdmin || isEditor || formData.status === 'draft';
  const summaryCharCount = formData.summary?.length || 0;

  if (isLoadingPost && isEditing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground tracking-widest uppercase text-sm">
          Loading post...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/posts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-widest uppercase">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="tracking-widest uppercase"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          {canPublish && (
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="tracking-widest uppercase"
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-input p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs tracking-widest uppercase">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter post title..."
                className="text-lg"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs tracking-widest uppercase">
                Slug *
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/journal/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="post-url-slug"
                  className="flex-1"
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="summary" className="text-xs tracking-widest uppercase">
                  Summary
                </Label>
                <span className={`text-xs ${summaryCharCount > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {summaryCharCount}/160
                </span>
              </div>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Brief description for previews and SEO..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || !formData.content || formData.content.length < 100}
                  className="tracking-widest uppercase text-xs"
                >
                  {isGeneratingSummary ? (
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-2" />
                  )}
                  {isGeneratingSummary ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              {errors.summary && (
                <p className="text-xs text-destructive">{errors.summary}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs tracking-widest uppercase">
                  Content
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setContentMediaPickerOpen(true)}
                  className="tracking-widest uppercase text-xs"
                >
                  <ImageIcon className="h-3 w-3 mr-2" />
                  Insert Image
                </Button>
              </div>
              <Textarea
                ref={contentTextareaRef}
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Write your post content here... (Markdown supported)"
                rows={20}
                className="font-mono text-sm"
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-input p-6 space-y-6">
            <h2 className="text-sm font-bold tracking-widest uppercase">
              Post Settings
            </h2>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs tracking-widest uppercase">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  {(isAdmin || isEditor) && (
                    <>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">
                Cover Image
              </Label>
              
              <ImageUploader
                currentImage={formData.cover_image_url}
                onUpload={(url) => handleChange('cover_image_url', url)}
                onClear={() => handleChange('cover_image_url', '')}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaPickerOpen(true)}
                className="w-full tracking-widest uppercase text-xs"
              >
                <ImageIcon className="h-3 w-3 mr-2" />
                Browse Media Library
              </Button>

              <Input
                id="cover_image_url"
                value={formData.cover_image_url}
                onChange={(e) => handleChange('cover_image_url', e.target.value)}
                placeholder="Or paste URL..."
                className="text-xs"
              />
              {errors.cover_image_url && (
                <p className="text-xs text-destructive">{errors.cover_image_url}</p>
              )}
            </div>
          </div>

          {isEditing && existingPost && (
            <div className="border border-input p-6 space-y-4">
              <h2 className="text-sm font-bold tracking-widest uppercase">
                Post Info
              </h2>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Created: {new Date(existingPost.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(existingPost.updated_at).toLocaleString()}</p>
                {existingPost.published_at && (
                  <p>Published: {new Date(existingPost.published_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cover Image Media Picker Dialog */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(url) => handleChange('cover_image_url', url)}
      />

      {/* Content Image Media Picker Dialog */}
      <MediaPicker
        open={contentMediaPickerOpen}
        onOpenChange={setContentMediaPickerOpen}
        onSelect={handleInsertImage}
      />
    </div>
  );
}

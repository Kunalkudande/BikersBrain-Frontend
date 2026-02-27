import { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Eye, EyeOff, Pencil, Loader2, Save, X, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  category: string;
  isPublished: boolean;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  views: number;
  createdAt: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  author: "Admin",
  tags: "",
  category: "General",
  isPublished: false,
  metaTitle: "",
  metaDesc: "",
};

const BLOG_CATEGORIES = [
  "General", "Helmet Guide", "Safety Tips", "Product Review",
  "Riding Tips", "News", "Maintenance",
];

const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500 focus:ring-orange-500/20";

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminBlog() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchPosts = async () => {
    try {
      const res = await adminApi.getBlogPosts();
      setPosts((res.data as BlogPost[]) || []);
    } catch {
      toast({ title: "Failed to load blog posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || "",
      author: post.author,
      tags: post.tags.join(", "),
      category: post.category,
      isPublished: post.isPublished,
      metaTitle: post.metaTitle || "",
      metaDesc: post.metaDesc || "",
    });
    setShowEditor(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.excerpt || !form.content) {
      toast({ title: "Title, excerpt and content are required", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateBlogPost(editingId, payload);
        toast({ title: "Post updated!" });
      } else {
        await adminApi.createBlogPost(payload);
        toast({ title: "Post created!" });
      }
      setShowEditor(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save post";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      await adminApi.deleteBlogPost(id);
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {editingId ? "Edit Post" : "New Blog Post"}
          </h1>
          <Button variant="outline" onClick={() => setShowEditor(false)} className="gap-2 border-white/10 text-white/60 hover:text-white">
            <X size={16} /> Cancel
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Main content */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({
                    ...form,
                    title: e.target.value,
                    slug: editingId ? form.slug : generateSlug(e.target.value),
                  })}
                  placeholder="Blog post title"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Excerpt *</Label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="A short summary shown in blog listing..."
                rows={2}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-white text-sm resize-vertical placeholder:text-white/30 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Content * (HTML supported)</Label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Full blog post content. HTML tags are supported for formatting."
                rows={14}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-white text-xs font-mono resize-vertical placeholder:text-white/30 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Cover Image URL</Label>
                <Input
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. safety, full-face, ISI"
                  className={inputCls}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className="text-sm text-white/60 font-medium">Publish immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">SEO Settings</h2>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Meta Title</Label>
              <Input
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                placeholder="Defaults to post title"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Meta Description</Label>
              <textarea
                value={form.metaDesc}
                onChange={(e) => setForm({ ...form, metaDesc: e.target.value })}
                placeholder="Defaults to excerpt"
                rows={2}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-white text-sm resize-vertical placeholder:text-white/30 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEditor(false)} className="border-white/10 text-white/60 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingId ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-sm text-white/40 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus size={16} /> New Post
        </Button>
      </div>

      {/* Posts Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No blog posts yet</h3>
            <p className="text-sm text-white/40 mb-6">Start writing to improve your SEO and engage riders</p>
            <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus size={16} /> Write First Post
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Post</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Views</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={18} className="text-white/30" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white text-sm">{post.title}</p>
                          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{post.excerpt}</p>
                          <p className="text-xs text-white/20 mt-0.5 font-mono">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Badge className="bg-white/5 text-white/60 border-0 text-xs">{post.category}</Badge>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-white/60">{post.views.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      {post.isPublished ? (
                        <Badge className="bg-green-500/10 text-green-400 border-0 gap-1">
                          <Eye size={10} /> Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-0 gap-1">
                          <EyeOff size={10} /> Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(post)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

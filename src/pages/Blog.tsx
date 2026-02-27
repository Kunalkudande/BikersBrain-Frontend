import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { blogApi } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  author: string;
  publishedAt: string;
}

interface Category {
  name: string;
  count: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    blogApi.getAll({ page: String(page), category: selectedCategory || undefined, limit: '9' })
      .then((res) => {
        if (res.success) {
          const posts = res.data as BlogPost[];
          const totalPages = res.pagination?.totalPages || 1;
          setPosts(posts || []);
          setTotalPages(totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, selectedCategory]);

  useEffect(() => {
    blogApi.getCategories()
      .then((res) => { if (res.success) setCategories(res.data as Category[]); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-oswald text-3xl md:text-4xl font-bold uppercase mb-3">
              The <span className="text-primary">Blog</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Riding tips, gear reviews, motorcycle culture, and everything a biker needs to know.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => { setSelectedCategory(""); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImage || "https://placehold.co/600x340/1F2937/FF6B35?text=BikersBrain+Blog"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2 text-[10px]">{post.category || "General"}</Badge>
                      <h2 className="font-oswald font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-md text-sm font-semibold transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

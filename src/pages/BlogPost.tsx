import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ChevronRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { articleJsonLd, breadcrumbJsonLd } from "@/components/SEO";
import { blogApi } from "@/lib/api";

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogApi.getBySlug(slug)
      .then((res) => { if (res.success) setPost(res.data as BlogPostDetail); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="aspect-video rounded-lg mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-oswald text-2xl font-bold mb-4">Post Not Found</h2>
          <Link to="/blog">
            <button className="text-primary hover:underline">Back to Blog</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.title}
        description={post.excerpt?.slice(0, 155) || `Read ${post.title} on the BikersBrain blog.`}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.coverImage}
        keywords={`${post.category}, ${post.tags?.join(", ") || "motorcycle blog"}, BikersBrain blog`}
        jsonLd={[
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Blog", url: "/blog" },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/blog" className="hover:text-primary">Blog</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate">{post.title}</span>
        </nav>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          itemScope
          itemType="https://schema.org/Article"
        >
          {/* Category + Date */}
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary">{post.category || "General"}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-oswald text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          {/* Author */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <User className="h-4 w-4" />
            <span>By {post.author}</span>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-orange max-w-none mb-8 
              prose-headings:font-oswald prose-headings:uppercase
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          )}

          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to all posts
          </Link>
        </motion.article>
      </main>
      <Footer />
    </div>
  );
}

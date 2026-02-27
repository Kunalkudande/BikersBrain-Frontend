import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email.trim());
      toast({ title: "Subscribed!", description: "You'll receive exclusive deals and riding tips." });
      setEmail("");
    } catch {
      toast({ title: "Already subscribed", description: "This email is already on our list.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-oswald text-3xl font-bold uppercase mb-2">
          Join the <span className="text-primary">Ride</span>
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get exclusive deals, new arrivals & riding tips delivered to your inbox.
        </p>
        <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            className="bg-background border-border"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="font-barlow-condensed font-semibold tracking-wider uppercase flex-shrink-0"
          >
            {loading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;

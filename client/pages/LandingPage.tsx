import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus, Minus, GraduationCap, Users, Building2, Briefcase, ArrowRight, ChevronDown } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - Glass effect */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">IIITNR Alumni</span>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <Button
                onClick={() => navigate("/sign-in")}
                variant="ghost"
                className="text-foreground hover:bg-muted"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/sign-up")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Get Started
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Dashboard
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section - Image based */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80"
            alt="Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 border border-primary/30">
                IIIT Naya Raipur Alumni Network
              </span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
              Connect with Your
              <span className="block text-gradient">Alumni Community</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-lg animate-fade-in opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
              Join 1000+ alumni across 100+ companies. Build lasting connections,
              discover opportunities, and give back to your alma mater.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
              <SignedOut>
                <Button
                  onClick={() => navigate("/sign-up")}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base glow-sm"
                >
                  Join the Network
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  onClick={() => navigate("/sign-in")}
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 h-12 text-base"
                >
                  Sign In
                </Button>
              </SignedOut>
              <SignedIn>
                <Button
                  onClick={() => navigate("/dashboard")}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignedIn>
            </div>
          </div>

          {/* Right - Stats Cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4 animate-slide-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
            {[
              { value: "1000+", label: "Alumni Members", icon: Users },
              { value: "100+", label: "Partner Companies", icon: Building2 },
              { value: "500+", label: "Active Connections", icon: Users },
              { value: "50+", label: "Job Opportunities", icon: Briefcase },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 text-white hover-lift"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-subtle">
          <ChevronDown className="w-6 h-6 text-white/60" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Why Join The Alumni Cell
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be part of a thriving community that connects, supports, and grows together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Connect with 1000+ Alumni", desc: "Access our growing network of successful graduates across industries." },
              { icon: Building2, title: "100+ Partner Companies", desc: "Exclusive access to opportunities at top companies worldwide." },
              { icon: Users, title: "Re-connect with Cohorts", desc: "Find and reconnect with your batchmates and former classmates." },
              { icon: Briefcase, title: "Career Opportunities", desc: "Get valuable insights and job referrals from industry leaders." },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Benefits Of Membership
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Access the Community", desc: "Full access to our directory of alumni, events, and resources." },
              { title: "Build Lasting Connections", desc: "Network with professionals who share your background and values." },
              { title: "Career Opportunities", desc: "Exclusive job postings and referral opportunities from alumni." },
            ].map((benefit, i) => (
              <div
                key={i}
                className="relative p-8 rounded-2xl bg-card border border-border hover-lift"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "What is this Alumni Tracking Website for?", a: "It's a platform to connect alumni with their alma mater and fellow graduates. You can update your profile, track career progress, and stay connected with the community." },
              { q: "Who can register on the website?", a: "All graduates, current students, and faculty members of IIIT Naya Raipur can register and join our community." },
              { q: "Do I need to pay to use the website?", a: "No, the platform is completely free for all IIIT Naya Raipur community members." },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
                <button
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i + 1 ? 0 : i + 1)}
                >
                  <span className="font-medium text-foreground">{faq.q}</span>
                  {openFaq === i + 1 ? (
                    <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i + 1 && (
                  <div className="px-5 pb-5 text-muted-foreground animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Connect?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join the alumni network today and unlock exclusive opportunities.
          </p>
          <SignedOut>
            <Button
              onClick={() => navigate("/sign-up")}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 h-12"
            >
              Create Your Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 h-12"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-lg font-bold">IIITNR Alumni</span>
              </div>
              <p className="text-sm text-slate-400">
                IIIT Naya Raipur's official alumni management platform.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Address</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                IIIT–Naya Raipur, Plot No. 7, Sector 24,<br />
                Near Purkhoti Muktangan, Atal Nagar – 493661<br />
                Chhattisgarh
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://iiitnr.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Official Website</a></li>
                <li><Link to="/sign-in" className="hover:text-accent transition-colors">Sign In</Link></li>
                <li><Link to="/sign-up" className="hover:text-accent transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Alumni Management Cell, IIIT Naya Raipur. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
I
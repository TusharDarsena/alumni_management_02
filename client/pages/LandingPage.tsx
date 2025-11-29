import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Users, Building2, GraduationCap, LineChart } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-xl font-bold text-slate-900">Alumni Cell</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign In</Button>
            <Button onClick={() => navigate("/signup")}>Register</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Connect, Grow, and <span className="text-primary">Thrive Together.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              The official Alumni Management Cell of IIIT Naya Raipur. Bridging the gap between past, present, and future.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="text-lg px-8 h-14" onClick={() => navigate("/signup")}>
                Join the Community <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14" onClick={() => navigate("/login")}>
                Member Login
              </Button>
            </div>
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </section>

      {/* Stats/Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, label: "Alumni Network", value: "1000+", desc: "Connected graduates" },
              { icon: Building2, label: "Companies", value: "100+", desc: "Global organizations" },
              { icon: GraduationCap, label: "Mentorship", value: "50+", desc: "Active mentors" },
              { icon: LineChart, label: "Growth", value: "∞", desc: "Career opportunities" },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-primary">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="font-semibold text-slate-900 mb-1">{stat.label}</p>
                <p className="text-sm text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Why Join The Alumni Cell?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Unlock a world of opportunities and stay connected with your alma mater.
              </p>
              <div className="space-y-6">
                {[
                  "Exclusive networking events and reunions",
                  "Career guidance and mentorship programs",
                  "Job opportunities and referrals",
                  "Access to institute resources and updates"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-lg text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-blue-500/20 absolute -inset-4 blur-2xl" />
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80" 
                alt="Community" 
                className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

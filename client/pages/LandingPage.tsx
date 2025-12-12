import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Users, Building2, GraduationCap, LineChart, ChevronDown, Star, Shield } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();
  
  // Parallax Refs
  const heroRef = useRef(null);
  const legacyRef = useRef(null);
  
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const { scrollYProgress: legacyScroll } = useScroll({
    target: legacyRef,
    offset: ["start end", "end start"],
  });

  const heroY = useTransform(heroScroll, [0, 1], ["0%", "50%"]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  
  const legacyY = useTransform(legacyScroll, [0, 1], ["-20%", "10%"]);
  const legacyScale = useTransform(legacyScroll, [0, 1], [1.1, 1]);

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans overflow-x-hidden selection:bg-amber-500/30">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/40 backdrop-blur-lg border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
           {/* Logo Area */}
           <div className="flex items-center gap-4">
             <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
               <div className="relative w-12 h-12 rounded-xl bg-black border border-amber-500/30 flex items-center justify-center">
                 <span className="text-2xl font-serif font-bold text-amber-500">A</span>
               </div>
             </div>
             <div className="flex flex-col">
               <span className="text-lg font-bold text-white tracking-wide">ALUMNI CELL</span>
               <span className="text-xs text-amber-500/80 tracking-[0.2em] uppercase">IIIT Naya Raipur</span>
             </div>
           </div>

           {/* Actions */}
           <div className="flex items-center gap-6">
             <button onClick={() => navigate("/sign-in")} className="text-sm font-medium text-amber-100/70 hover:text-amber-400 transition-colors tracking-wider uppercase">
               Member Login
             </button>
             <Button 
               onClick={() => navigate("/sign-up")}
               className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold hover:from-amber-500 hover:to-yellow-400 shadow-[0_0_20px_-5px_rgba(217,119,6,0.4)] border-none px-8 rounded-full"
             >
               Join Network
             </Button>
           </div>
        </div>
      </header>

      {/* SECTION 1: HERO (Animation 2 - Fireworks/Text) */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black z-10" />
           <img 
             src="/iiitnrlandingpageanimation2.webp" 
             alt="IIITNR Celebration" 
             className="w-full h-full object-cover"
           />
        </motion.div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center mt-32">
          {/* The animation already has text, so we provide a complementary sub-message after a delay */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 3.5 }} // Wait for animation text
          >
            <h2 className="text-2xl md:text-3xl font-light text-amber-100/90 tracking-[0.3em] uppercase mb-8 drop-shadow-2xl [text-shadow:_0_4px_12px_rgb(0_0_0_/_0.8)]">
              Forging Legacies • Illuminating Futures
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-12">
              <Button 
                size="lg" 
                className="h-16 px-12 text-lg rounded-full bg-amber-500 text-black font-bold hover:bg-amber-400 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all hover:scale-105 border-none" 
                onClick={() => navigate("/sign-up")}
              >
                Begin Your Journey
              </Button>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-amber-500/50"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-10 h-10" />
        </motion.div>
      </section>

      {/* SECTION 2: GLOSSY STATS */}
      <section className="relative py-32 bg-black z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Global Alumni", value: "1000+", icon: Users },
              { label: "Partner Companies", value: "100+", icon: Building2 },
              { label: "Mentorships", value: "50+", icon: GraduationCap },
              { label: "Success Stories", value: "∞", icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <stat.icon className="w-8 h-8 text-amber-600 mb-4 group-hover:text-amber-400 transition-colors" />
                <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider group-hover:text-amber-500/80 transition-colors">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: THE LEGACY (Animation 1 - Flipping/Water) */}
      <section ref={legacyRef} className="relative h-[80vh] flex items-center overflow-hidden">
        <motion.div style={{ y: legacyY, scale: legacyScale }} className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-black/60 z-10" /> {/* Darker overlay for text readability */}
           <img 
             src="/iiitnrlandingpageanimation.webp" 
             alt="IIITNR Legacy" 
             className="w-full h-full object-cover scale-110"
           />
        </motion.div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-none">
              A Golden <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-600">Heritage.</span>
            </h2>
            <p className="text-xl text-zinc-300 leading-relaxed max-w-lg">
              From the flipping pages of history to the splashing waves of innovation. Our alumni are the golden threads weaving the future of technology.
            </p>
          </motion.div>
          
          <div className="hidden md:block">
             {/* Empty right side to let the animation show through */}
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES / WHY JOIN */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Elevate Your Career</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Exclusive benefits tailored for the distinguished alumni of IIIT Naya Raipur.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { title: "Elite Networking", desc: "Connect with industry leaders and pioneers from your alma mater.", icon: Users },
               { title: "Career Acceleration", desc: "Access exclusive job boards and executive mentorship programs.", icon: LineChart },
               { title: "Institute Access", desc: "Lifetime access to campus resources, library, and guest houses.", icon: Shield },
             ].map((feature, i) => (
               <motion.div
                 key={i}
                 whileHover={{ y: -10 }}
                 className="p-10 rounded-3xl bg-zinc-900 border border-white/5 hover:border-amber-500/40 hover:shadow-[0_0_30px_-10px_rgba(217,119,6,0.2)] transition-all duration-300"
               >
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-600/10 flex items-center justify-center mb-8">
                   <feature.icon className="w-8 h-8 text-amber-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                 <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold text-2xl">A</div>
            <div className="text-white">
              <div className="font-bold text-lg">IIITNR Alumni Cell</div>
              <div className="text-zinc-500 text-sm">Connecting Generations</div>
            </div>
          </div>
          <div className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} IIIT Naya Raipur. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
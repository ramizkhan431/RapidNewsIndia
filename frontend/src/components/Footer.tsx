"use client";

import React from "react";
import Link from "next/link";
import { 
  Send, MessageCircle, MapPin, Mail, Phone, Info, Globe 
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t-4 border-brand-red mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* About & Branding Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-xl font-black tracking-tighter text-white flex items-center">
              RAPID<span className="text-brand-red">NEWS</span>
              <span className="text-blue-500 font-extrabold">INDIA</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 inline-block animate-ping"></span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Rapid News India is a state-of-the-art regional and national reporting agency, delivering uncompromised news directly from the soil. Focused on rural development, civic issues, and grassroots journalism.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <MapPin className="w-4 h-4 text-brand-red shrink-0" />
            <span className="text-xs text-slate-300">Salt Lake Sector V, Kolkata, India</span>
          </div>
        </div>

        {/* Categories Quick Links */}
        <div>
          <h3 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
            News Categories
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/?level=national" className="hover:text-white transition-colors">National Feed</Link>
            </li>
            <li>
              <Link href="/?level=state" className="hover:text-white transition-colors">State Coverage</Link>
            </li>
            <li>
              <Link href="/?level=district" className="hover:text-white transition-colors">District Corners</Link>
            </li>
            <li>
              <Link href="/videos" className="hover:text-white transition-colors">Video Broadcasts</Link>
            </li>
            <li>
              <Link href="/submit" className="hover:text-white transition-colors">Citizen Submissions</Link>
            </li>
          </ul>
        </div>

        {/* Social Networks Integration */}
        <div>
          <h3 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
            Social Channels
          </h3>
          <p className="text-[11px] mb-3 text-slate-400 leading-snug">
            Subscribe to our instant channels for real-time headlines:
          </p>
          <div className="flex flex-col gap-2.5">
            <a 
              href="https://whatsapp.com/channel/placeholder" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded px-3 py-1.5 hover:bg-emerald-900/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>WhatsApp Channel</span>
            </a>
            <a 
              href="https://t.me/placeholder" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-xs bg-sky-950/40 text-sky-400 border border-sky-900/60 rounded px-3 py-1.5 hover:bg-sky-900/50 transition-colors"
            >
              <Send className="w-4 h-4 fill-current shrink-0" />
              <span>Telegram Channel</span>
            </a>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <a href="https://facebook.com/placeholder" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-brand-blue hover:text-white text-slate-400 rounded-full transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://youtube.com/placeholder" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-brand-red hover:text-white text-slate-400 rounded-full transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://instagram.com/placeholder" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-pink-600 hover:text-white text-slate-400 rounded-full transition-colors">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Contact & Support */}
        <div>
          <h3 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
            Citizen Grievances
          </h3>
          <p className="text-xs mb-3">
            Are you witnessing corruption, traffic congestion, or public service failures?
          </p>
          <Link 
            href="/submit" 
            className="inline-block w-full text-center bg-brand-saffron hover:bg-orange-600 text-white font-bold text-xs uppercase py-2.5 rounded shadow transition-colors"
          >
            Submit Complaint
          </Link>
          <div className="space-y-1.5 text-xs pt-4">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>contact@rapidnewsindia.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>+91 33 2938 1029</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
        <div>
          © {new Date().getFullYear()} Rapid News India Agency. All Rights Reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-white transition-colors">Reporter Access</Link>
          <span className="text-slate-700">|</span>
          <Link href="/submit" className="hover:text-white transition-colors">Content Submit Policies</Link>
        </div>
      </div>
    </footer>
  );
}

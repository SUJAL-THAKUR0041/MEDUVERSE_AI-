import React from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground({ children, variant = "emerald" }) {
  const colors = {
    emerald: "from-emerald-100 via-teal-100 to-cyan-100",
    blue: "from-blue-100 via-indigo-100 to-purple-100",
    green: "from-green-100 via-emerald-100 to-teal-100",
    purple: "from-purple-100 via-pink-100 to-rose-100"
  };

  const glowColors = {
    emerald: ["bg-emerald-300", "bg-teal-300", "bg-cyan-300"],
    blue: ["bg-blue-300", "bg-indigo-300", "bg-purple-300"],
    green: ["bg-green-300", "bg-emerald-300", "bg-teal-300"],
    purple: ["bg-purple-300", "bg-pink-300", "bg-rose-300"]
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors[variant]} relative overflow-hidden`}>
      {/* Animated 3D medical orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
          opacity: [0.4, 0.6, 0.4],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-10 left-10 w-72 h-72 ${glowColors[variant][0]} rounded-full blur-3xl`}
        style={{ filter: 'blur(80px)' }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-10 right-10 w-96 h-96 ${glowColors[variant][1]} rounded-full blur-3xl`}
        style={{ filter: 'blur(80px)' }}
      />
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.3, 0.4, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/2 left-1/3 w-80 h-80 ${glowColors[variant][2]} rounded-full blur-3xl`}
        style={{ filter: 'blur(80px)' }}
      />
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity,
            delay: Math.random() * 5
          }}
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}


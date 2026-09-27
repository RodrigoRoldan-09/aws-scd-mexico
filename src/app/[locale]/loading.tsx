"use client";

import { motion } from "motion/react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0E0E1A]">
      
      {/* Contenedor de la animación geométrica "Tech" */}
      <div className="relative flex h-24 w-24 items-center justify-center mb-10">
        {/* Cuadro exterior rotando lento */}
        <motion.div
          className="absolute inset-0 border-2 border-[#C143BC] opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Cuadro interior rotando rápido en sentido contrario */}
        <motion.div
          className="absolute inset-3 border border-[#3DD6D0] opacity-50"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Núcleo central pulsante (Color de conversión: Naranja) */}
        <motion.div
          className="h-4 w-4 bg-[#D85A30]"
          animate={{ 
            scale: [1, 1.4, 1], 
            opacity: [0.6, 1, 0.6],
            boxShadow: [
              "0 0 10px rgba(216,90,48,0.3)", 
              "0 0 25px rgba(216,90,48,0.8)", 
              "0 0 10px rgba(216,90,48,0.3)"
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Textos de carga */}
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="m-0 font-display text-2xl tracking-widest text-[#E6E4DA] sm:text-3xl">
          CARGANDO
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="text-[#C143BC]"
          >
            _
          </motion.span>
        </h2>
        
        <p className="m-0 font-mono text-[11px] tracking-[0.2em] uppercase text-[#8B84A0] sm:text-xs">
          ESTABLECIENDO CONEXIÓN CON LA NUBE
        </p>
      </div>

      {/* Barra de progreso estilo terminal */}
      <div className="mt-8 h-[2px] w-48 overflow-hidden bg-[#1E1838] sm:w-64">
        <motion.div
          className="h-full bg-gradient-to-r from-[#C143BC] via-[#3DD6D0] to-[#C143BC]"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

    </div>
  );
}
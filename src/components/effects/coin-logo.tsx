"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function CoinLogo() {
  // 1. Valores para la inclinación sutil (tilt) al mover el mouse
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const tiltY = useTransform(mouseXSpring, [-0.5, 0.5], ["-30deg", "30deg"]);

  // 2. Estado para el giro completo tipo moneda (spin)
  const [spin, setSpin] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    
    // Detectamos si el cursor entró por la mitad izquierda o derecha
    const rect = e.currentTarget.getBoundingClientRect();
    const enterX = e.clientX - rect.left;
    const isFromLeft = enterX < rect.width / 2;

    // Generamos entre 1 y 3 vueltas completas (360, 720 o 1080 grados) de manera random
    const randomTurns = Math.floor(Math.random() * 3) + 1;
    const degrees = 360 * randomTurns;

    // Sumamos o restamos los grados dependiendo de la dirección
    setSpin((prev) => prev + (isFromLeft ? degrees : -degrees));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reiniciamos solo el tilt, mantenemos el acumulado del giro
    x.set(0);
    y.set(0);
  };

  return (
    <div
      className="relative w-full aspect-square max-h-[550px] flex items-center justify-center [perspective:1200px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* CONTENEDOR EXTERNO: Maneja los giros de 360 grados */}
      <motion.div
        className="w-full h-full flex items-center justify-center [transform-style:preserve-3d]"
        animate={{ rotateY: spin }}
        transition={{
          type: "spring",
          stiffness: 30, // Valores bajos para que el giro se vea pesado y fluido
          damping: 12,
        }}
      >
        {/* CONTENEDOR INTERNO: Maneja la inclinación y flotación */}
        <motion.div
          className="relative w-[75%] h-[75%] sm:w-[85%] sm:h-[85%] md:w-[95%] md:h-[95%] [transform-style:preserve-3d] cursor-pointer"
          style={{
            rotateX,
            rotateY: tiltY,
          }}
          animate={
            !isHovered
              ? {
                  y: [0, -10, 0], // Flotación constante
                  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }
              : { y: 0 }
          }
        >
          {/* CARA FRONTAL */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:translateZ(1px)]">
            <Image
              src="/images/logo_SCD-01.png"
              alt="Logo SCD Frontal"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {/* CARA TRASERA */}
          {/* Rotada 180 grados para que el texto se lea correctamente al dar la vuelta */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(1px)]">
            <Image
              src="/images/logo_SCD-01.png"
              alt="Logo SCD Trasero"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>


        </motion.div>
      </motion.div>
    </div>
  );
}
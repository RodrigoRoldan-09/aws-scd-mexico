"use client";

import { useEffect } from "react";

/**
 * Congela el fondo mientras hay algo abierto encima.
 *
 * El candado va en `<html>` (lleva `h-full`, así que es quien desplaza la
 * página, no el `<body>`), y además se fija el `<body>` a la altura
 * en la que estaba. Lo segundo es por el teléfono: en iOS el `overflow: hidden`
 * a secas no impide arrastrar la página, y sin la posición fija el fondo se
 * despega y rebota. Al soltar se vuelve al mismo punto, que si no la página
 * saltaría al principio cada vez que se cierra un modal.
 *
 * Se lleva una cuenta de cuántos hay abiertos porque se solapan: desde un
 * modal se abre el diálogo de confirmación, y si cada uno restaurara al
 * cerrarse, el primero en irse soltaría el fondo con el otro todavía encima.
 */

let abiertos = 0;
let soltar: (() => void) | null = null;

function cerrar() {
  if (abiertos++ > 0) return;

  const html = document.documentElement;
  const body = document.body;
  const y = window.scrollY;
  // Al quitar la barra de desplazamiento la página se ensancha y todo salta
  // unos píxeles a la derecha. Se compensa con relleno del mismo ancho.
  const barra = window.innerWidth - html.clientWidth;

  const antes = {
    htmlOverflow: html.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  html.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${y}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.overflow = "hidden";
  if (barra > 0) body.style.paddingRight = `${barra}px`;

  soltar = () => {
    html.style.overflow = antes.htmlOverflow;
    body.style.position = antes.position;
    body.style.top = antes.top;
    body.style.left = antes.left;
    body.style.right = antes.right;
    body.style.overflow = antes.overflow;
    body.style.paddingRight = antes.paddingRight;
    window.scrollTo(0, y);
  };
}

function abrir() {
  if (abiertos === 0) return;
  if (--abiertos > 0) return;
  soltar?.();
  soltar = null;
}

/** Mientras `activo` sea verdadero, el fondo no se mueve. */
export function useScrollLock(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    cerrar();
    return abrir;
  }, [activo]);
}

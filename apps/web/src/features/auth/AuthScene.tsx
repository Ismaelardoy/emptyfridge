import { cn } from '@/shared/lib/cn';
import { type ReactNode, useEffect, useState } from 'react';

const FRIDGES = [
  '/brand/fridges/worried.webp',
  '/brand/fridges/happy.webp',
  '/brand/fridges/angry.webp',
  '/brand/fridges/sleepy.webp',
  '/brand/fridges/surprised.webp',
  '/brand/fridges/sad.webp',
];

/**
 * Fondo de las pantallas de entrada: crema, limpio y con una nevera gigante
 * que se mueve despacio y va cambiando de cara.
 */
export function AuthScene({ children }: { children: ReactNode }) {
  const [faceIndex, setFaceIndex] = useState(0);

  // El crema pinta también html y body: así el rebote del móvil o el borde
  // inferior no cortan el fondo con una franja de otro color.
  useEffect(() => {
    document.documentElement.classList.add('auth-page');
    document.body.classList.add('auth-page');
    return () => {
      document.documentElement.classList.remove('auth-page');
      document.body.classList.remove('auth-page');
    };
  }, []);

  // La nevera cambia de expresión cada pocos segundos, con fundido.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = window.setInterval(() => {
      setFaceIndex((index) => (index + 1) % FRIDGES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="auth-scene flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-blob auth-blob-emerald -top-36 -left-28 h-[26rem] w-[26rem]" />
        <div className="auth-blob auth-blob-amber top-[28%] -right-32 h-[24rem] w-[24rem]" />
        <div className="auth-blob auth-blob-sky -bottom-40 left-[8%] h-[28rem] w-[28rem]" />
        <div className="auth-veil" />

        <div className="auth-hero">
          <div className="auth-hero-drift">
            {FRIDGES.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className={cn('auth-hero-face', index === faceIndex && 'auth-hero-face-on')}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

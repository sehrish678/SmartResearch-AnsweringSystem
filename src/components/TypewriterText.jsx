import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

export function TypewriterText({ text, color }) {
  const textRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Reset any existing text
    tl.set(textRef.current, {
      text: "",
    });

    // Animate typing
    tl.to(textRef.current, {
      duration: 2,
      text: text,
      ease: "none",
      delay: 0.5
    });
  }, [text]); // Re-run if text changes

  return (
    <h2 
      ref={textRef} 
      style={{ 
        color: color,
        textAlign: 'center',
        minHeight: '2em', // Prevent layout shift during animation
      }}
    />
  );
}
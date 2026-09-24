import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Aura3DAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  isWakeWordActive?: boolean;
}

export const Aura3DAvatar: React.FC<Aura3DAvatarProps> = ({ state, isWakeWordActive = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 3.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xff6b81, 2.0); // Warm rose key light
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 2.8); // Cyber cyan rim light
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0xff0055, 1.5, 5);
    bottomGlow.position.set(0, -1.5, 1);
    scene.add(bottomGlow);

    // 3. Avatar Hierarchy Group
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // --- Face & Head ---
    // Smooth stylized anime female face
    const headGeo = new THREE.SphereGeometry(0.72, 36, 36);
    headGeo.scale(1, 1.2, 0.95);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffe8df,
      roughness: 0.35,
      metalness: 0.05
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.2;
    avatarGroup.add(head);

    // Hair - Cyber bangs and twin futuristic tails
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b2e,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x3d1240,
      emissiveIntensity: 0.25
    });

    // Top hair dome
    const hairTopGeo = new THREE.SphereGeometry(0.78, 32, 32);
    hairTopGeo.scale(1.02, 1.15, 0.98);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.28, -0.05);
    avatarGroup.add(hairTop);

    // Bangs over forehead
    const bangGeo = new THREE.ConeGeometry(0.3, 0.6, 16);
    const bang1 = new THREE.Mesh(bangGeo, hairMat);
    bang1.rotation.set(0.2, 0, -0.4);
    bang1.position.set(-0.35, 0.75, 0.65);
    avatarGroup.add(bang1);

    const bang2 = new THREE.Mesh(bangGeo, hairMat);
    bang2.rotation.set(0.2, 0, 0.4);
    bang2.position.set(0.35, 0.75, 0.65);
    avatarGroup.add(bang2);

    // Anime Eyes (Sparkling & Expressive)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.14, 24, 24);
    eyeWhiteGeo.scale(1.2, 0.85, 0.5);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.28, 0.28, 0.65);
    leftEyeWhite.rotation.y = -0.15;
    avatarGroup.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.28, 0.28, 0.65);
    rightEyeWhite.rotation.y = 0.15;
    avatarGroup.add(rightEyeWhite);

    // Sparkling Purple-Cyan Anime Irises
    const irisGeo = new THREE.CircleGeometry(0.085, 24);
    const irisMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide
    });

    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(-0.28, 0.28, 0.72);
    leftIris.rotation.y = -0.15;
    avatarGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0.28, 0.28, 0.72);
    rightIris.rotation.y = 0.15;
    avatarGroup.add(rightIris);

    // Pupils with anime heart / star shine
    const pupilGeo = new THREE.CircleGeometry(0.045, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x110022 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.28, 0.28, 0.725);
    leftPupil.rotation.y = -0.15;
    avatarGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.28, 0.28, 0.725);
    rightPupil.rotation.y = 0.15;
    avatarGroup.add(rightPupil);

    // Eyelids for blinking
    const eyelidGeo = new THREE.BoxGeometry(0.32, 0.2, 0.1);
    const eyelidMat = new THREE.MeshStandardMaterial({ color: 0xffdcd0 });
    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(-0.28, 0.44, 0.7);
    avatarGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(0.28, 0.44, 0.7);
    avatarGroup.add(rightEyelid);

    // Eyelashes & Brows
    const browGeo = new THREE.BoxGeometry(0.26, 0.025, 0.02);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x241433 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.28, 0.46, 0.71);
    leftBrow.rotation.z = 0.08;
    avatarGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.28, 0.46, 0.71);
    rightBrow.rotation.z = -0.08;
    avatarGroup.add(rightBrow);

    // Cute nose & blush
    const blushGeo = new THREE.CircleGeometry(0.08, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff6688,
      transparent: true,
      opacity: 0.4
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.4, 0.12, 0.65);
    leftBlush.rotation.y = -0.25;
    avatarGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.4, 0.12, 0.65);
    rightBlush.rotation.y = 0.25;
    avatarGroup.add(rightBlush);

    // Animated Mouth (Viseme - Opens & syncs when speaking)
    const mouthGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.04, 16);
    mouthGeo.scale(1.5, 0.6, 1);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xcc2955 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.08, 0.68);
    mouth.rotation.x = Math.PI / 2;
    avatarGroup.add(mouth);

    // Studio DJ Headphones on Ears
    const phoneGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 24);
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.15,
      metalness: 0.8
    });
    const leftPhone = new THREE.Mesh(phoneGeo, phoneMat);
    leftPhone.rotation.z = Math.PI / 2;
    leftPhone.position.set(-0.76, 0.22, 0);
    avatarGroup.add(leftPhone);

    const rightPhone = new THREE.Mesh(phoneGeo, phoneMat);
    rightPhone.rotation.z = Math.PI / 2;
    rightPhone.position.set(0.76, 0.22, 0);
    avatarGroup.add(rightPhone);

    // Glowing Neon Rings on Headphones (Spectrum Light)
    const neonRingGeo = new THREE.TorusGeometry(0.18, 0.025, 16, 32);
    const neonRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });
    const leftNeon = new THREE.Mesh(neonRingGeo, neonRingMat);
    leftNeon.rotation.y = Math.PI / 2;
    leftNeon.position.set(-0.84, 0.22, 0);
    avatarGroup.add(leftNeon);

    const rightNeon = new THREE.Mesh(neonRingGeo, neonRingMat);
    rightNeon.rotation.y = Math.PI / 2;
    rightNeon.position.set(0.84, 0.22, 0);
    avatarGroup.add(rightNeon);

    // Headphone Bridge band
    const bandGeo = new THREE.TorusGeometry(0.76, 0.04, 16, 32, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, metalness: 0.8 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.24, 0);
    avatarGroup.add(band);

    // Cyber Collar / Jacket
    const collarGeo = new THREE.CylinderGeometry(0.48, 0.85, 0.6, 24, 1, true);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x0f0e17,
      roughness: 0.3,
      metalness: 0.6
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -0.7, 0);
    avatarGroup.add(collar);

    // Glowing Neon Zipper / Crest
    const zipperGeo = new THREE.BoxGeometry(0.04, 0.5, 0.02);
    const zipperMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const zipper = new THREE.Mesh(zipperGeo, zipperMat);
    zipper.position.set(0, -0.65, 0.42);
    avatarGroup.add(zipper);

    // Floating Cyber Halo / Hologram Ring around her head
    const haloGeo = new THREE.TorusGeometry(1.05, 0.018, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.3;
    halo.position.set(0, 0.75, 0);
    avatarGroup.add(halo);

    // Orbiting Audio Particles
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.3 + Math.random() * 0.3;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff0077,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Tracking for natural eye & head tilt
    let targetRotY = 0;
    let targetRotX = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.35;
      targetRotX = -y * 0.2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;

      // 1. Head & Eye Smooth Tracking
      avatarGroup.rotation.y += (targetRotY - avatarGroup.rotation.y) * 0.05;
      avatarGroup.rotation.x += (targetRotX - avatarGroup.rotation.x) * 0.05;

      // 2. Idle Natural Breathing
      avatarGroup.position.y = Math.sin(elapsed * 2) * 0.04;

      // 3. Eye Blinking Loop (Blinks every ~3.5 seconds)
      blinkTimer += delta;
      if (blinkTimer > 3.5) {
        isBlinking = true;
        blinkTimer = 0;
      }
      if (isBlinking) {
        leftEyelid.position.y = 0.28; // closed
        rightEyelid.position.y = 0.28;
        if (blinkTimer > 0.15) {
          leftEyelid.position.y = 0.44; // open
          rightEyelid.position.y = 0.44;
          isBlinking = false;
        }
      }

      // 4. State Dynamics
      if (currentState === 'speaking') {
        // Mouth lip-sync flapping
        const mouthOpen = 0.5 + Math.sin(elapsed * 18) * 0.4;
        mouth.scale.set(1.5, mouthOpen, 1);
        mouth.position.y = -0.08 - (mouthOpen - 0.5) * 0.03;

        // Glowing vibrant headphone LEDs
        neonRingMat.color.setHex(0xff0055);
        haloMat.color.setHex(0xff3366);
        halo.rotation.z += 0.02;

        // Head gentle beat bobbing
        avatarGroup.position.y += Math.sin(elapsed * 8) * 0.025;
      } else if (currentState === 'listening') {
        mouth.scale.set(1.3, 0.4, 1);
        // Alert listening pulse (Emerald)
        neonRingMat.color.setHex(0x00ff88);
        haloMat.color.setHex(0x00ff88);
        halo.rotation.z += 0.01;
      } else if (currentState === 'thinking') {
        mouth.scale.set(1.1, 0.3, 1);
        // Fast spinning violet halo
        neonRingMat.color.setHex(0x9900ff);
        haloMat.color.setHex(0xaa33ff);
        halo.rotation.z += 0.05;
      } else {
        // Idle
        mouth.scale.set(1.2, 0.3, 1);
        neonRingMat.color.setHex(0x00f0ff);
        haloMat.color.setHex(0x00f0ff);
        halo.rotation.z += 0.005;
      }

      // 5. Halo and Particle Orbit
      halo.position.y = 0.75 + Math.sin(elapsed * 3) * 0.03;
      particles.rotation.y = elapsed * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-[280px] max-h-[360px] cursor-grab active:cursor-grabbing" />

      {/* Cyber HUD State Rings */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-[10px] font-bold tracking-wider uppercase text-slate-300 pointer-events-none shadow-xl">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'speaking'
              ? 'bg-rose-500 animate-ping'
              : state === 'listening'
              ? 'bg-emerald-400 animate-pulse'
              : state === 'thinking'
              ? 'bg-indigo-400 animate-spin'
              : 'bg-cyan-400'
          }`}
        />
        <span>
          {state === 'speaking'
            ? 'Aura Speaking'
            : state === 'listening'
            ? 'Listening to your voice...'
            : state === 'thinking'
            ? 'AI Executive Thinking...'
            : isWakeWordActive
            ? 'Wake Word Active ("Hey Aura")'
            : 'Aura 3D Idle'}
        </span>
      </div>
    </div>
  );
};

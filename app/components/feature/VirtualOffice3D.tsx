import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Agent, Division } from '~/schemas/office.schema';
import {
  type VirtualOffice3DProps,
  type CameraTransitionState,
  type VirtualOfficeChatMessage,
  DIVISION_CONFIG,
  buildOfficeEnvironment,
  VirtualOfficeToolbar,
  VirtualOfficeIdentityBadges,
  VirtualOfficeChatModal,
  VirtualOfficeTaskModal,
  VirtualOfficeTeamChatModal,
  VirtualOfficeTeamGrid,
} from './virtual-office';

export type { VirtualOffice3DProps };

export function VirtualOffice3D({
  agents,
  zones: _zones = [],
  selectedAgentId,
  onSelectAgent,
  onUpdateStatus: _onUpdateStatus,
  onAssignTask,
  onPingAgent: _onPingAgent,
  className = '',
}: VirtualOffice3DProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportBoxRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const officeGroupRef = useRef<THREE.Group | null>(null);
  const agentCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const divisionWatermarkRef = useRef<HTMLDivElement>(null);
  const hoverPopoverRef = useRef<HTMLDivElement>(null);

  const [activeAgent, setActiveAgent] = useState<Agent | null>(
    selectedAgentId ? agents.find((a) => a.id === selectedAgentId) || null : null
  );
  const activeAgentRef = useRef<Agent | null>(activeAgent);
  activeAgentRef.current = activeAgent;

  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const hoveredAgentRef = useRef<Agent | null>(null);
  hoveredAgentRef.current = hoveredAgent;

  const [selectedDivision, setSelectedDivision] = useState<Division | 'all'>('all');
  const selectedDivisionRef = useRef<Division | 'all'>('all');
  selectedDivisionRef.current = selectedDivision;

  const [zoomLevel, setZoomLevel] = useState(220);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const isChatModalOpenRef = useRef(isChatModalOpen);
  isChatModalOpenRef.current = isChatModalOpen;

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistories, setChatHistories] = useState<Record<string, VirtualOfficeChatMessage[]>>({});
  const [callStatusMsg, setCallStatusMsg] = useState<string | null>(null);

  const currentDivisionAgents =
    selectedDivision === 'all'
      ? agents
      : agents.filter(
          (a) =>
            a.division === selectedDivision ||
            (isChatModalOpen && activeAgent && a.id === activeAgent.id)
        );
  const currentDivisionAgentsRef = useRef<Agent[]>(currentDivisionAgents);
  currentDivisionAgentsRef.current = currentDivisionAgents;

  // Camera glide transition controller
  const cameraTransitionRef = useRef<CameraTransitionState>({
    isMoving: false,
    startCamPos: new THREE.Vector3(),
    targetCamPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    startZoom: 1.0,
    targetZoom: 1.0,
    progress: 0,
    duration: 0.65,
  });

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Synchronize 3D Ground Ring and Status Orb with active communication & hover state
  useEffect(() => {
    if (!officeGroupRef.current) return;
    officeGroupRef.current.children.forEach((child) => {
      if (child.userData?.isAgent) {
        const isChatActive = Boolean(
          isChatModalOpen && activeAgent && child.userData.agentId === activeAgent.id
        );
        const isHovered = Boolean(
          hoveredAgent && child.userData.agentId === hoveredAgent.id
        );
        if (child.userData.statusRing) {
          child.userData.statusRing.visible = isHovered || isChatActive;
        }
        if (child.userData.statusOrb) {
          child.userData.statusOrb.visible = isHovered || isChatActive;
        }
      }
    });
  }, [isChatModalOpen, activeAgent, hoveredAgent]);

  // Sync activeAgent when selectedAgentId updates
  useEffect(() => {
    if (selectedAgentId) {
      const found = agents.find((a) => a.id === selectedAgentId);
      if (found) setActiveAgent(found);
    }
  }, [selectedAgentId, agents]);

  // Initialize Three.js Scene, Camera, Lighting, OrbitControls, and 3D Office Environment
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 580;
    const aspect = width / height;
    const frustumSize = 46;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f7f9);
    scene.fog = new THREE.FogExp2(0xf6f7f9, 0.0035);
    sceneRef.current = scene;

    // 2. Isometric Orthographic Camera
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.set(18, 20, 18);
    camera.lookAt(0, 0.2, 0);
    camera.zoom = 2.2;
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minPolarAngle = Math.PI / 8;
    controls.target.set(0, 0.2, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.5);
    mainSun.position.set(35, 50, 30);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.left = -28;
    mainSun.shadow.camera.right = 28;
    mainSun.shadow.camera.top = 28;
    mainSun.shadow.camera.bottom = -28;
    mainSun.shadow.camera.near = 1;
    mainSun.shadow.camera.far = 130;
    mainSun.shadow.bias = -0.00035;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.85);
    fillLight.position.set(-35, 25, -30);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.75);
    scene.add(hemiLight);

    // 6. 3D Office Mesh Group
    const officeGroup = new THREE.Group();
    officeGroup.name = 'Office_Island_Root';
    officeGroupRef.current = officeGroup;
    scene.add(officeGroup);

    // Build 3D models and procedural geometry
    buildOfficeEnvironment(officeGroup, agents);

    // 7. Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mousePos, camera);
      const intersects = raycaster.intersectObjects(officeGroup.children, true);

      let found: Agent | null = null;
      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent && parent !== officeGroup) {
          if (parent.userData?.isAgent && parent.userData?.agentId) {
            found = agents.find((a) => a.id === parent?.userData.agentId) || null;
            break;
          }
          parent = parent.parent;
        }
        if (found) break;
      }

      setHoveredAgent(found);
      renderer.domElement.style.cursor = found ? 'pointer' : 'grab';
    };

    const onPointerLeave = () => {
      setHoveredAgent(null);
      if (renderer.domElement) {
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mousePos, camera);
      const intersects = raycaster.intersectObjects(officeGroup.children, true);

      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent && parent !== officeGroup) {
          if (parent.userData?.isAgent && parent.userData?.agentId) {
            const targetAgent = agents.find((a) => a.id === parent?.userData.agentId);
            if (targetAgent) {
              focusAgentDesk(targetAgent);
              return;
            }
          }
          parent = parent.parent;
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mouseleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onClick);

    // 8. Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Handle smooth camera glide
      const trans = cameraTransitionRef.current;
      if (trans.isMoving) {
        trans.progress += delta / trans.duration;
        if (trans.progress >= 1) {
          trans.progress = 1;
          trans.isMoving = false;
        }
        const t = THREE.MathUtils.smoothstep(trans.progress, 0, 1);
        camera.position.lerpVectors(trans.startCamPos, trans.targetCamPos, t);
        controls.target.lerpVectors(trans.startLookAt, trans.targetLookAt, t);
        camera.zoom = THREE.MathUtils.lerp(trans.startZoom, trans.targetZoom, t);
        camera.updateProjectionMatrix();
      }

      // Sync 3D HTML overlays
      if (cameraRef.current && viewportBoxRef.current) {
        // Division Watermark
        const curDiv = selectedDivisionRef.current;
        if (curDiv !== 'all' && divisionWatermarkRef.current) {
          const config = DIVISION_CONFIG[curDiv];
          if (config) {
            const [tx, , tz] = config.cameraTarget;
            const wPos = new THREE.Vector3(tx, 0.05, tz);
            wPos.project(camera);
            if (wPos.z < 1) {
              const sx = ((wPos.x + 1) / 2) * 100;
              const sy = ((-wPos.y + 1) / 2) * 100;
              divisionWatermarkRef.current.style.left = `${sx}%`;
              divisionWatermarkRef.current.style.top = `${sy}%`;
              divisionWatermarkRef.current.style.display = 'block';
            } else {
              divisionWatermarkRef.current.style.display = 'none';
            }
          }
        } else if (divisionWatermarkRef.current) {
          divisionWatermarkRef.current.style.display = 'none';
        }

        // Floating Identity Badges
        currentDivisionAgentsRef.current.forEach((ag) => {
          const el = agentCardRefs.current[ag.id];
          if (!el) return;

          const isHovered = hoveredAgentRef.current?.id === ag.id;
          const isChatActive = Boolean(
            isChatModalOpenRef.current && activeAgentRef.current?.id === ag.id
          );
          const isDivisionActive = selectedDivisionRef.current !== 'all';

          if (!isDivisionActive && !isHovered && !isChatActive) {
            el.style.display = 'none';
            return;
          }

          const pos = new THREE.Vector3(ag.position[0], 2.1, ag.position[2] - 0.45);
          pos.project(camera);
          if (pos.z < 1 && pos.x >= -1.2 && pos.x <= 1.2 && pos.y >= -1.2 && pos.y <= 1.2) {
            const sx = ((pos.x + 1) / 2) * 100;
            const sy = ((-pos.y + 1) / 2) * 100;
            el.style.left = `${sx}%`;
            el.style.top = `${sy}%`;
            el.style.display = 'block';
          } else {
            el.style.display = 'none';
          }
        });

        // Hover Popover
        if (hoverPopoverRef.current && hoveredAgentRef.current) {
          const hAg = hoveredAgentRef.current;
          const hPos = new THREE.Vector3(hAg.position[0] + 0.55, 1.35, hAg.position[2] - 0.45);
          hPos.project(camera);
          if (hPos.z < 1 && hPos.x >= -1.2 && hPos.x <= 1.2 && hPos.y >= -1.2 && hPos.y <= 1.2) {
            const sx = ((hPos.x + 1) / 2) * 100;
            const sy = ((-hPos.y + 1) / 2) * 100;
            hoverPopoverRef.current.style.left = `${sx}%`;
            hoverPopoverRef.current.style.top = `${sy}%`;
            hoverPopoverRef.current.style.display = 'flex';
          } else {
            hoverPopoverRef.current.style.display = 'none';
          }
        } else if (hoverPopoverRef.current) {
          hoverPopoverRef.current.style.display = 'none';
        }
      }

      if (isAutoRotate && !trans.isMoving) {
        officeGroup.rotation.y += 0.003;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const asp = w / h;
      camera.left = (frustumSize * asp) / -2;
      camera.right = (frustumSize * asp) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('mouseleave', onPointerLeave);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, [agents, isAutoRotate]);

  // Focus on specific Division or 'all' overview
  const focusDivision = (div: Division | 'all') => {
    setSelectedDivision(div);
    if (!cameraRef.current || !controlsRef.current) return;

    if (div === 'all') {
      const trans = cameraTransitionRef.current;
      trans.startCamPos.copy(cameraRef.current.position);
      trans.targetCamPos.set(18, 20, 18);
      trans.startLookAt.copy(controlsRef.current.target);
      trans.targetLookAt.set(0, 0.2, 0);
      trans.startZoom = cameraRef.current.zoom;
      trans.targetZoom = 2.2;
      trans.progress = 0;
      trans.duration = 0.65;
      trans.isMoving = true;
      setZoomLevel(220);
    } else {
      const config = DIVISION_CONFIG[div];
      if (config) {
        const [tx, ty, tz] = config.cameraTarget;
        const trans = cameraTransitionRef.current;
        trans.startCamPos.copy(cameraRef.current.position);
        trans.targetCamPos.set(tx + 8.5, 9.5, tz + 8.5);
        trans.startLookAt.copy(controlsRef.current.target);
        trans.targetLookAt.set(tx, ty + 0.3, tz);
        trans.startZoom = cameraRef.current.zoom;
        trans.targetZoom = 3.8;
        trans.progress = 0;
        trans.duration = 0.65;
        trans.isMoving = true;
        setZoomLevel(380);
      }
    }
  };

  // Toggle Division Focus
  const toggleOrFocusDivision = (div: Division | 'all') => {
    if (div !== 'all' && selectedDivision === div) {
      focusDivision('all');
    } else {
      focusDivision(div);
    }
  };

  // Smooth Focus Camera onto Clicked/Selected Agent Desk & Open Room Chat
  const focusAgentDesk = useCallback(
    (targetAgent: Agent) => {
      setActiveAgent(targetAgent);
      setIsChatModalOpen(true);
      if (onSelectAgent) onSelectAgent(targetAgent);

      const [dx, , dz] = targetAgent.position;
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;
      if (cam && ctrl) {
        setIsAutoRotate(false);
        const trans = cameraTransitionRef.current;
        trans.startCamPos.copy(cam.position);
        trans.targetCamPos.set(dx + 1.2, 1.4, dz + 1.2);
        trans.startLookAt.copy(ctrl.target);
        trans.targetLookAt.set(dx, 0.85, dz - 0.2);
        trans.startZoom = cam.zoom;
        trans.targetZoom = 15.0;
        trans.progress = 0;
        trans.duration = 0.65;
        trans.isMoving = true;
        setZoomLevel(1500);
      }
    },
    [onSelectAgent]
  );

  // Close Room Chat Modal and restore camera view
  const handleCloseChat = useCallback(() => {
    setIsChatModalOpen(false);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    setIsAutoRotate(false);
    if (selectedDivision === 'all') {
      const trans = cameraTransitionRef.current;
      trans.startCamPos.copy(cam.position);
      trans.targetCamPos.set(18, 20, 18);
      trans.startLookAt.copy(ctrl.target);
      trans.targetLookAt.set(0, 0.2, 0);
      trans.startZoom = cam.zoom;
      trans.targetZoom = 2.2;
      trans.progress = 0;
      trans.duration = 0.65;
      trans.isMoving = true;
      setZoomLevel(220);
    } else {
      const config = DIVISION_CONFIG[selectedDivision];
      if (config) {
        const [tx, ty, tz] = config.cameraTarget;
        const trans = cameraTransitionRef.current;
        trans.startCamPos.copy(cam.position);
        trans.targetCamPos.set(tx + 8.5, 9.5, tz + 8.5);
        trans.startLookAt.copy(ctrl.target);
        trans.targetLookAt.set(tx, ty + 0.3, tz);
        trans.startZoom = cam.zoom;
        trans.targetZoom = 3.8;
        trans.progress = 0;
        trans.duration = 0.65;
        trans.isMoving = true;
        setZoomLevel(380);
      }
    }
  }, [selectedDivision]);

  // Zoom Adjuster
  const adjustZoom = (delta: number) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const newZoom = THREE.MathUtils.clamp(camera.zoom + delta, 0.6, 25.0);
    camera.zoom = newZoom;
    camera.updateProjectionMatrix();
    setZoomLevel(Math.round(newZoom * 100));
  };

  const toggleFullscreen = () => {
    const viewportBox = viewportBoxRef.current;
    if (!viewportBox) return;

    if (!document.fullscreenElement) {
      viewportBox.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeAgent) return;

    const targetAg = activeAgent;
    const userMsg: VirtualOfficeChatMessage = {
      sender: 'user',
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistories((prev) => {
      const existing = prev[targetAg.id] || [
        {
          sender: 'agent',
          text:
            targetAg.initialMessage ||
            `Halo! Saya ${targetAg.name}, ${targetAg.role}. Ada yang bisa saya bantu terkait tugas "${targetAg.currentTask}"?`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      return {
        ...prev,
        [targetAg.id]: [...existing, userMsg],
      };
    });

    const sentText = chatMessage.trim();
    setChatMessage('');

    setTimeout(() => {
      const replies = [
        `Siap, pesan terkait "${sentText}" sudah saya catat! Saya segera koordinasikan dengan tim ${DIVISION_CONFIG[targetAg.division]?.shortName || ''}.`,
        `Oke! Untuk tugas "${targetAg.currentTask}", saya pastikan progressnya selesai sesuai milestone proyek "${targetAg.currentProject}".`,
        `Terima kasih masukannya! Saya sesuaikan komponen workflow ini dan kabari lagi setelah update terbaru selesai.`,
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setChatHistories((prev) => {
        const existing = prev[targetAg.id] || [];
        return {
          ...prev,
          [targetAg.id]: [
            ...existing,
            {
              sender: 'agent',
              text: reply,
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      });
    }, 600);
  };

  const handleStartCall = () => {
    if (!activeAgent) return;
    setCallStatusMsg(`Menghubungkan panggilan suara dengan ${activeAgent.name}... 📞`);
    setTimeout(() => setCallStatusMsg(null), 4000);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgent || !taskInput.trim()) return;
    if (onAssignTask) {
      onAssignTask(activeAgent.id, taskInput.trim(), projectInput.trim() || undefined);
    }
    setActiveAgent({
      ...activeAgent,
      currentTask: taskInput.trim(),
      currentProject: projectInput.trim() || activeAgent.currentProject,
    });
    setTaskInput('');
    setProjectInput('');
    setIsTaskModalOpen(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Toolbar with Division Cards & Zoom Controls */}
      <VirtualOfficeToolbar
        agents={agents}
        selectedDivision={selectedDivision}
        activeAgent={activeAgent}
        zoomLevel={zoomLevel}
        isAutoRotate={isAutoRotate}
        isFullscreen={isFullscreen}
        onSelectDivision={toggleOrFocusDivision}
        onToggleAutoRotate={() => setIsAutoRotate(!isAutoRotate)}
        onToggleFullscreen={toggleFullscreen}
        onAdjustZoom={adjustZoom}
        onOpenTeamChat={() => setIsTeamChatOpen(true)}
        onFocusAgent={focusAgentDesk}
      />

      {/* 2. Main 3D Office Explorer Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          ref={viewportBoxRef}
          className="relative bg-[#f6f7f9] rounded-2xl overflow-hidden border border-slate-200/80 select-none"
        >
          {/* 3D Floating Identity Badges & Watermark Overlays */}
          <VirtualOfficeIdentityBadges
            currentDivisionAgents={currentDivisionAgents}
            selectedDivision={selectedDivision}
            activeAgent={activeAgent}
            hoveredAgent={hoveredAgent}
            isChatModalOpen={isChatModalOpen}
            agentCardRefs={agentCardRefs}
            divisionWatermarkRef={divisionWatermarkRef}
            hoverPopoverRef={hoverPopoverRef}
            onFocusAgent={focusAgentDesk}
            onHoverAgent={setHoveredAgent}
          />

          {/* Room Chat Modal Overlay */}
          <VirtualOfficeChatModal
            isOpen={isChatModalOpen}
            activeAgent={activeAgent}
            chatHistories={chatHistories}
            chatMessage={chatMessage}
            callStatusMsg={callStatusMsg}
            onClose={handleCloseChat}
            onStartCall={handleStartCall}
            onClearCallStatus={() => setCallStatusMsg(null)}
            onChatMessageChange={setChatMessage}
            onSendChat={handleSendChat}
          />

          {/* Three.js WebGL Viewport Container */}
          <div
            ref={containerRef}
            className={`w-full cursor-grab active:cursor-grabbing relative ${
              isFullscreen ? 'h-screen' : 'h-[520px] md:h-[620px]'
            }`}
          />
        </div>

        {/* Footer Info Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Preview · gerak kantor ilustratif</span>
          </div>
          <div className="text-slate-400 text-center">
            Drag: putar · Klik kanan / dua jari: geser · Scroll / pinch: zoom
          </div>
          <div>
            <span className="text-slate-600 font-semibold">Klik orang / meja untuk chat</span>
          </div>
        </div>
      </div>

      {/* 3. Team Members Grid for Active Division */}
      <VirtualOfficeTeamGrid
        currentDivisionAgents={currentDivisionAgents}
        selectedDivision={selectedDivision}
        activeAgent={activeAgent}
        onFocusAgent={focusAgentDesk}
      />

      {/* 4. Team Broadcast Chat Modal */}
      <VirtualOfficeTeamChatModal
        isOpen={isTeamChatOpen}
        agents={agents}
        onClose={() => setIsTeamChatOpen(false)}
        onSelectAgent={focusAgentDesk}
      />

      {/* 5. Quick Task Assignment Modal */}
      <VirtualOfficeTaskModal
        isOpen={isTaskModalOpen}
        activeAgent={activeAgent}
        taskInput={taskInput}
        projectInput={projectInput}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskInputChange={setTaskInput}
        onProjectInputChange={setProjectInput}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}

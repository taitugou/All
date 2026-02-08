document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initSolar3D();
});

function initBackground() {
    const container = document.getElementById('canvas-container');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > width) this.x = 0;
            if (this.x < 0) this.x = width;
            if (this.y > height) this.y = 0;
            if (this.y < 0) this.y = height;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = Math.floor((width * height) / 10000);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Background Gradient
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Mouse light effect
        if (mouse.x) {
            const mouseGradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
            mouseGradient.addColorStop(0, 'rgba(0, 122, 255, 0.15)');
            mouseGradient.addColorStop(1, 'rgba(0, 122, 255, 0)');
            ctx.fillStyle = mouseGradient;
            ctx.fillRect(0, 0, width, height);
        }

        requestAnimationFrame(animate);
    }

    const mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('resize', resize);
    resize();
    animate();
}

function initSolar3D() {
    const host = document.querySelector('.solar-system');
    if (!host || !window.THREE) return;

    const { innerWidth: vw, innerHeight: vh } = window;
    const width = host.clientWidth || vw;
    const height = host.clientHeight || vh;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.45);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(200, 120, 250);
    dir.castShadow = true;
    scene.add(dir);

    const sunGeo = new THREE.SphereGeometry(60, 48, 48);
    const sunMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.12,
        roughness: 0.25,
        metalness: 0.0,
        transmission: 0,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.receiveShadow = false;
    sun.castShadow = false;
    // Universe group for auto-rotate
    const universe = new THREE.Group();
    scene.add(universe);
    universe.add(sun);

    // Helper: auto-fit label sprite (dynamic font size / two-line wrap) and always-on-top
    function makeLabelSprite(text, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        const w = 1024, h = 512;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        let lines = [text];
        let fontSize = 96;
        const padding = 80;
        ctx.font = `bold ${fontSize}px -apple-system, Segoe UI, Roboto, Arial`;
        let width = ctx.measureText(text).width;
        if (width > w - padding) {
            const parts = text.split(' ');
            if (parts.length > 1) {
                lines = [parts[0], parts.slice(1).join(' ')];
                fontSize = 84;
                ctx.font = `bold ${fontSize}px -apple-system, Segoe UI, Roboto, Arial`;
            } else {
                const scale = (w - padding) / width;
                fontSize = Math.max(42, Math.floor(fontSize * scale));
                ctx.font = `bold ${fontSize}px -apple-system, Segoe UI, Roboto, Arial`;
            }
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = 6;
        if (lines.length === 2) {
            const lh = 140;
            const y1 = h / 2 - lh / 2;
            const y2 = h / 2 + lh / 2;
            ctx.strokeText(lines[0], w / 2, y1);
            ctx.fillText(lines[0], w / 2, y1);
            ctx.strokeText(lines[1], w / 2, y2);
            ctx.fillText(lines[1], w / 2, y2);
        } else {
            ctx.strokeText(text, w / 2, h / 2);
            ctx.fillText(text, w / 2, h / 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: false
        });
        const sprite = new THREE.Sprite(material);
        if (lines.length === 2) {
            sprite.scale.set(280, 140, 1);
        } else {
            sprite.scale.set(220, 100, 1);
        }
        sprite.renderOrder = 999;
        return sprite;
    }

    // remove center label, use info card instead

    // Volumetric glow (sprite-based)
    function makeGlowSprite(size, innerColor = 'rgba(255,230,150,1)', outerColor = 'rgba(255,140,60,0)') {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        const s = 512;
        c.width = s; c.height = s;
        const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(1, outerColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
        const spr = new THREE.Sprite(mat);
        spr.scale.set(size, size, 1);
        return spr;
    }
    const glowInner = makeGlowSprite(320);
    const glowOuter = makeGlowSprite(620, 'rgba(255,230,150,0.35)', 'rgba(255,140,60,0)');
    universe.add(glowInner);
    universe.add(glowOuter);
    const startRadius = THREE.MathUtils.lerp(160, 340, Math.random());
    const startTheta = Math.random() * Math.PI * 2;
    const startY = THREE.MathUtils.lerp(-120, 120, Math.random());
    const universeStart = new THREE.Vector3(
        Math.cos(startTheta) * startRadius,
        startY,
        Math.sin(startTheta) * startRadius
    );
    const universeEnd = new THREE.Vector3(0, 0, 0);
    universe.position.copy(universeStart);

    function makePlanet(radius, colorHex) {
        const geo = new THREE.SphereGeometry(radius, 48, 48);
        const matParams = {
            color: colorHex,
            roughness: 0.42,
            metalness: 0.06,
        };
        const mat = new THREE.MeshStandardMaterial(matParams);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function makeRing(inner, outer, colorHex = 0xffffff) {
        const ringGeo = new THREE.RingGeometry(inner, outer, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        return ring;
    }

    function makeOrbit(a, b, colorHex = 0xffffff) {
        const curve = new THREE.EllipseCurve(
            0, 0,            // ax, ay
            a, b,            // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );

        const points = curve.getPoints(128);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });

        const orbit = new THREE.LineLoop(geometry, material);
        orbit.rotation.x = Math.PI / 2; // Rotate to lie in XZ plane
        return orbit;
    }

    function makeCanvasTexture(drawFn, size = 512) {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        drawFn(ctx, size);
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 4;
        return tex;
    }

    function makeLabelSprite(text) {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        const fontSize = 64;
        ctx.font = `600 ${fontSize}px -apple-system, Segoe UI, Roboto, Arial`;
        const metrics = ctx.measureText(text);
        const pad = 32;
        const width = Math.ceil(metrics.width + pad * 2);
        const height = Math.ceil(fontSize + pad * 2);
        c.width = width;
        c.height = height;
        const ctx2 = c.getContext('2d');
        ctx2.font = `600 ${fontSize}px -apple-system, Segoe UI, Roboto, Arial`;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillStyle = 'rgba(0,0,0,0.7)';
        ctx2.fillRect(0, 0, width, height);
        ctx2.lineWidth = 6;
        ctx2.strokeStyle = 'rgba(0,0,0,0.95)';
        ctx2.fillStyle = 'rgba(255,255,255,0.98)';
        const cx = width / 2;
        const cy = height / 2;
        ctx2.strokeText(text, cx, cy);
        ctx2.fillText(text, cx, cy);
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        const labelHeight = 38;
        const labelWidth = (width / height) * labelHeight;
        sprite.scale.set(labelWidth, labelHeight, 1);
        return sprite;
    }

    const planetConfigs = [
        {
            name: 'TTG Chat',
            color: 0x98745e,
            r: 20,
            a: 200,
            b: 160,
            speed: 0.012,
            tilt: { x: 8, y: 0, z: 0 },
            url: 'https://taitugou.top:888/',
            descMain: 'TTG Chat 是一款社交 + 娱乐一体的平台，集即时通讯、动态社区、智能匹配和在线游戏于一体，主打轻松、有趣的社交体验。',
            descFeatures: [
                { label: '社交互动：', text: '发布图文 / 视频动态，点赞、评论、转发、收藏，算法推荐你更感兴趣的内容。' },
                { label: '即时通讯：', text: '基于 Socket.IO，支持私聊 / 群聊、消息撤回、阅后即焚等高级聊天能力。' },
                { label: '智能匹配：', text: '综合年龄、位置、兴趣标签和活跃度，为你推荐更合适的交友对象。' },
            ],
        },
        {
            name: 'TTG Game',
            color: 0xf5b8a1,
            r: 22,
            a: 250,
            b: 180,
            speed: 0.010,
            tilt: { x: 15, y: 0, z: 10 },
            url: 'https://taitugou.top:888/game',
            descMain: 'TTG Game 是一个休闲娱乐聚合平台，精选多款经典棋牌与益智游戏，让你随时随地享受竞技与放松的乐趣。',
            descFeatures: [
                { label: '丰富玩法：', text: '涵盖斗地主、麻将、德州扑克等多种经典棋牌玩法，满足不同喜好。' },
                { label: '实时对战：', text: '万人在线匹配，快速开局，体验真实的真人博弈快感。' },
                { label: '公平竞技：', text: '采用先进的防作弊系统，确保每一场对局的公平与公正。' },
            ],
        },
        {
            name: 'TTG MindMap',
            color: 0xbb2671,
            r: 18,
            a: 300,
            b: 210,
            speed: 0.009,
            tilt: { x: 5, y: 0, z: -12 },
            url: 'https://taitugou.top:111',
            descMain: 'TTG MindMap 是一款轻量级在线思维导图工具，帮助你高效捕捉灵感、梳理逻辑结构，提升学习与工作效率。',
            descFeatures: [
                { label: '云端同步：', text: '支持多端实时同步，随时随地查看和编辑你的思维导图。' },
                { label: '多种结构：', text: '提供逻辑图、组织结构图、鱼骨图等多种布局，满足不同场景需求。' },
                { label: '协作分享：', text: '支持一键分享与多人实时协作，让团队头脑风暴更简单。' },
            ],
        },
        {
            name: 'TTG Vlog',
            color: 0x6667ab,
            r: 19,
            a: 360,
            b: 250,
            speed: 0.008,
            tilt: { x: -10, y: 0, z: 14 },
            url: 'https://taitugou.top:222',
            descMain: 'TTG Vlog 是一个充满活力的短视频分享社区，鼓励用户用镜头记录生活点滴，发现世界精彩，展示真实的自我。',
            descFeatures: [
                { label: '创意拍摄：', text: '提供丰富的滤镜、特效和剪辑工具，助你轻松制作大片级Vlog。' },
                { label: '个性推荐：', text: '智能算法根据你的兴趣，推荐最合口味的视频内容。' },
                { label: '互动社区：', text: '弹幕、评论、点赞，与创作者零距离互动，结识志同道合的朋友。' },
            ],
        },
        {
            name: 'TTG Movie',
            color: 0x0f4c92,
            r: 24,
            a: 420,
            b: 290,
            speed: 0.007,
            tilt: { x: 12, y: 0, z: -8 },
            url: 'https://movie.taitugou.top',
            descMain: 'TTG Movie 拥有海量高清影视资源库，涵盖最新电影、热门剧集、动漫综艺，为你提供极致的免费在线观影体验。',
            descFeatures: [
                { label: '海量片库：', text: '聚合全网优质资源，每日更新，想看的这里都有。' },
                { label: '高清画质：', text: '支持1080P/4K超清播放，画面细腻，视觉享受。' },
                { label: '极速播放：', text: '高速CDN节点加速，拖拽进度条无缓冲，告别卡顿。' },
            ],
        },
        {
            name: 'TTG Music',
            color: 0x91a8d0,
            r: 20,
            a: 480,
            b: 320,
            speed: 0.006,
            tilt: { x: -6, y: 0, z: 22 },
            url: 'https://taitugou.top:333',
            descMain: 'TTG Music 是一款纯净的在线音乐播放器，汇聚全网热门歌曲与独立音乐人作品，为你提供无损音质的听觉盛宴。',
            descFeatures: [
                { label: '无损音质：', text: '支持高解析度音频播放，还原音乐最真实的细节。' },
                { label: '个性歌单：', text: '智能推荐每日必听，支持创建专属歌单，收藏你的心动旋律。' },
                { label: '纯净体验：', text: '界面简洁，无广告打扰，让你专注于音乐本身。' },
            ],
        },
        {
            name: 'TTG Coin',
            color: 0xf7cac9,
            r: 26,
            a: 540,
            b: 360,
            speed: 0.005,
            tilt: { x: 18, y: 0, z: -18},
            url: 'https://taitugou.top:444',
            ring: true,
            descMain: 'TTG Coin 是一个数字资产管理与交易模拟平台，带你安全探索区块链世界，实时掌握加密货币市场脉搏。',
            descFeatures: [
                { label: '实时行情：', text: '对接全球主流交易所数据，毫秒级更新币种价格与走势。' },
                { label: '模拟交易：', text: '提供仿真交易环境，零风险体验投资策略，提升交易技巧。' },
                { label: '资产安全：', text: '采用多重加密技术，保障你的数字资产账户安全。' },
            ],
        },
        {
            name: 'TTG AiUI',
            color: 0x955251,
            r: 21,
            a: 600,
            b: 390,
            speed: 0.0045,
            tilt: { x: -15,y: 0, z: 25 },
            url: 'https://taitugou.top:555',
            descMain: 'TTG AiUI 集成了前沿的人工智能技术，提供智能问答、创意写作、代码生成与数据分析等全方位AI服务。',
            descFeatures: [
                { label: '智能对话：', text: '理解上下文，像人类一样流畅交流，解答你的各类疑问。' },
                { label: '内容生成：', text: '一键生成文章、文案、脚本，激发创作灵感，提升生产力。' },
                { label: '多模态交互：', text: '支持语音、图像等多种交互方式，体验未来的交互形态。' },
            ],
        },
    ];

    const planets = [];
    planetConfigs.forEach(cfg => {
        const group = new THREE.Group();
        group.rotation.set(
            THREE.MathUtils.degToRad(cfg.tilt.x),
            THREE.MathUtils.degToRad(cfg.tilt.y),
            THREE.MathUtils.degToRad(cfg.tilt.z),
        );
        universe.add(group);

        const mesh = makePlanet(cfg.r, cfg.color);
        group.add(mesh);

        const orbit = makeOrbit(cfg.a, cfg.b, cfg.color);
        group.add(orbit);

        let ring = null;
        if (cfg.ring) {
            ring = makeRing(cfg.r + 6, cfg.r + 12, 0xffffff);
            mesh.add(ring);
        }

        const label = makeLabelSprite(cfg.name);
        scene.add(label);

        planets.push({
            cfg, group, mesh, label,
            angle: Math.random() * Math.PI * 2,
        });
    });

    const clock = new THREE.Clock();
    let autoRotate = true;
    let autoRotateSpeed = 0.0015;
    let autoPauseFrames = 0;
    const orbitSpeedMultiplier = 0.55;
    let introActive = true;
    let introElapsed = 0;
    const introDuration = 2400;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const targetR = Math.sqrt(800*800 + 180*180);
    const targetEl = Math.asin(180 / targetR);
    const startOptions = [
        [THREE.MathUtils.degToRad(52),  THREE.MathUtils.degToRad(32)],
        [THREE.MathUtils.degToRad(-52), THREE.MathUtils.degToRad(32)],
        [THREE.MathUtils.degToRad(52),  THREE.MathUtils.degToRad(-26)],
        [THREE.MathUtils.degToRad(-52), THREE.MathUtils.degToRad(-26)],
        [THREE.MathUtils.degToRad(30),  THREE.MathUtils.degToRad(18)],
        [THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(18)],
        [THREE.MathUtils.degToRad(65),  THREE.MathUtils.degToRad(10)],
        [THREE.MathUtils.degToRad(-65), THREE.MathUtils.degToRad(10)],
    ];
    const pick = startOptions[Math.floor(Math.random() * startOptions.length)];
    const jitterAz = THREE.MathUtils.degToRad((Math.random() * 12) - 6);
    const jitterEl = THREE.MathUtils.degToRad((Math.random() * 10) - 5);
    const startAz = pick[0] + jitterAz;
    const startEl = pick[1] + jitterEl;
    const startR = THREE.MathUtils.lerp(4800, 6200, Math.random());
    function polarVec(r, az, el) {
        const x = r * Math.cos(el) * Math.sin(az);
        const y = r * Math.sin(el);
        const z = r * Math.cos(el) * Math.cos(az);
        return new THREE.Vector3(x, y, z);
    }
    camera.position.copy(polarVec(startR, startAz, startEl));
    const infoEl = document.getElementById('info-panel');
    const infoTitle = infoEl ? infoEl.querySelector('.info-title') : null;
    const infoDesc = infoEl ? infoEl.querySelector('.info-desc') : null;
    const infoLink = infoEl ? infoEl.querySelector('.info-link') : null;
    const infoExit = infoEl ? infoEl.querySelector('.info-exit') : null;
    const raycaster = new THREE.Raycaster();
    const mouseN = new THREE.Vector2();
    let selected = null;
    let exitSeqActive = false;
    let exitPhase = 0;
    let exitElapsed = 0;
    const exitPlanetDuration = 1000;
    const exitUniverseDuration = 1300;
    let exitCamStart = new THREE.Vector3();
    let exitCamMid = new THREE.Vector3();
    const exitCamEnd = new THREE.Vector3(0, 180, 800);
    let exitSel = null;
    let exitSelWorld = new THREE.Vector3();
    let exitSelLocal = new THREE.Vector3();
    let exitTargetStart = new THREE.Vector3();
    const exitTargetEnd = new THREE.Vector3(0, 0, 0);
    let camCtrl2a = new THREE.Vector3();
    let camCtrl2b = new THREE.Vector3();
    let userZoom = 1.0;
    const idleThreshold = 8000;
    const autoFollowHoldDuration = 8000;
    const panelTypingCharInterval = 30;
    let lastInteraction = performance.now();
    let autoFollowActive = false;
    let autoFollowTarget = null;
    let lastAutoFollowIndex = -1;
    const autoFollowTransitionDuration = 1400;
    let autoFollowTransitionActive = false;
    let autoFollowTransitionElapsed = 0;
    const autoFollowFromPos = new THREE.Vector3();
    const autoFollowToPos = new THREE.Vector3();
    const autoFollowCtrl1 = new THREE.Vector3();
    const autoFollowCtrl2 = new THREE.Vector3();
    const autoFollowFromLook = new THREE.Vector3();
    const autoFollowToLook = new THREE.Vector3();
    let panelTypingElapsed = 0;
    let panelTypingActive = false;
    let panelTypingTotal = 0;
    let panelTypingFields = [];
    let panelTypingMode = '';
    let autoFollowFullShownAt = 0;
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const clickables = [];
    planets.forEach(p => {
        clickables.push(p.mesh);
        if (p.label) clickables.push(p.label);
    });
    const labelPos = new THREE.Vector3();
    const labelUp = new THREE.Vector3();
    function registerInteraction() {
        lastInteraction = performance.now();
        if (autoFollowActive && autoFollowTarget && !exitSeqActive) {
            beginExitFromPlanet(autoFollowTarget, true);
        }
        autoFollowActive = false;
        autoFollowTarget = null;
        autoFollowTransitionActive = false;
        autoFollowTransitionElapsed = 0;
        panelTypingActive = false;
        panelTypingElapsed = 0;
        panelTypingTotal = 0;
        panelTypingFields = [];
        panelTypingMode = '';
        autoFollowFullShownAt = 0;
        if (infoEl) {
            infoEl.classList.remove('visible');
            infoEl.classList.remove('auto-follow');
        }
    }

    function pickAutoFollowTarget() {
        if (!planets.length) return null;
        let idx = Math.floor(Math.random() * planets.length);
        if (planets.length > 1 && idx === lastAutoFollowIndex) {
            idx = (idx + 1) % planets.length;
        }
        lastAutoFollowIndex = idx;
        return planets[idx];
    }

    function buildPanelDescText(p) {
        if (!p || !p.cfg) return '';
        if (p.cfg.descMain || p.cfg.descFeatures) {
            const lines = [];
            if (p.cfg.descMain) lines.push(p.cfg.descMain);
            if (Array.isArray(p.cfg.descFeatures) && p.cfg.descFeatures.length) {
                lines.push('核心功能');
                p.cfg.descFeatures.forEach(item => {
                    const label = item.label || '';
                    const text = item.text || '';
                    lines.push(`${label}${text}`);
                });
            }
            return lines.join('\n');
        }
        return p.cfg.desc || '';
    }

    function beginPanelTyping({ title, linkText, exitText, descText, mode }) {
        if (!infoEl) return;
        panelTypingElapsed = 0;
        panelTypingActive = true;
        panelTypingMode = mode;
        panelTypingFields = [];
        panelTypingTotal = 0;
        if (infoTitle) {
            panelTypingFields.push({ el: infoTitle, text: title || '' });
            panelTypingTotal += (title || '').length;
        }
        if (infoLink) {
            panelTypingFields.push({ el: infoLink, text: linkText || '' });
            panelTypingTotal += (linkText || '').length;
        }
        if (infoExit) {
            panelTypingFields.push({ el: infoExit, text: exitText || '' });
            panelTypingTotal += (exitText || '').length;
        }
        if (infoDesc) {
            panelTypingFields.push({ el: infoDesc, text: descText || '' });
            panelTypingTotal += (descText || '').length;
        }
        panelTypingFields.forEach(field => {
            if (field.el) field.el.textContent = '';
        });
    }

    function beginAutoFollowContent(target) {
        if (!infoEl) return;
        const title = target.cfg.name;
        const descText = buildPanelDescText(target);
        let linkText = '敬请期待';
        if (infoLink) {
            if (target.cfg.url) {
                linkText = '进入';
                infoLink.href = target.cfg.url;
                infoLink.target = '_blank';
                infoLink.rel = 'noopener';
            } else {
                infoLink.href = '#';
                infoLink.removeAttribute('target');
                infoLink.removeAttribute('rel');
            }
        }
        const exitText = infoExit ? infoExit.textContent || '退出' : '';
        infoEl.classList.add('visible');
        infoEl.classList.add('auto-follow');
        autoFollowFullShownAt = 0;
        beginPanelTyping({ title, linkText, exitText, descText, mode: 'auto' });
    }

    function getAutoFollowDesired(target) {
        const wPos = new THREE.Vector3();
        target.mesh.getWorldPosition(wPos);
        const toCam = camera.position.clone().sub(wPos).normalize();
        const fovY = THREE.MathUtils.degToRad(camera.fov);
        const marginN = 0.28;
        const minDistVert = (target.cfg.r / marginN) / Math.tan(fovY / 2);
        const minDistHorz = (target.cfg.r / (marginN * camera.aspect)) / Math.tan(fovY / 2);
        const minDist = Math.max(minDistVert, minDistHorz, 520);
        const desiredPos = wPos.clone().add(toCam.multiplyScalar(minDist));
        return { wPos, desiredPos };
    }

    function beginAutoFollowTransition(nextTarget) {
        if (!nextTarget) return;
        const { wPos, desiredPos } = getAutoFollowDesired(nextTarget);
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        autoFollowFromPos.copy(camera.position);
        autoFollowToPos.copy(desiredPos);
        autoFollowFromLook.copy(camera.position).add(camDir.multiplyScalar(1000));
        autoFollowToLook.copy(wPos);
        const dist = autoFollowFromPos.distanceTo(autoFollowToPos);
        const ctrlDist = Math.min(600, dist * 0.35);
        const fromDir = autoFollowFromPos.clone().sub(autoFollowFromLook).normalize();
        const toDir = autoFollowToPos.clone().sub(autoFollowToLook).normalize();
        autoFollowCtrl1.copy(autoFollowFromPos).add(fromDir.multiplyScalar(ctrlDist));
        autoFollowCtrl2.copy(autoFollowToPos).add(toDir.multiplyScalar(ctrlDist));
        autoFollowTransitionElapsed = 0;
        autoFollowTransitionActive = true;
    }

    function setSelected(p, silent) {
        if (!silent) registerInteraction();
        selected = p;
        userZoom = 1.0;
        if (infoEl && p) {
            infoEl.classList.remove('auto-follow');
            const title = p.cfg.name;
            const descText = buildPanelDescText(p);
            if (infoLink) {
                if (p.cfg.url) {
                    infoLink.href = p.cfg.url;
                    infoLink.target = '_blank';
                    infoLink.rel = 'noopener';
                } else {
                    infoLink.href = '#';
                    infoLink.removeAttribute('target');
                    infoLink.removeAttribute('rel');
                }
            }
            const linkText = p.cfg.url ? '进入' : '敬请期待';
            const exitText = infoExit ? infoExit.textContent || '退出' : '';
            infoEl.classList.add('visible');
            beginPanelTyping({ title, linkText, exitText, descText, mode: 'click' });
        } else if (infoEl) {
            infoEl.classList.remove('visible');
            infoEl.classList.remove('auto-follow');
        }
        autoPauseFrames = 260;
    }
    function beginExitFromPlanet(picked, silent) {
        const wPos = new THREE.Vector3();
        picked.mesh.getWorldPosition(wPos);
        if (silent) {
            autoFollowActive = false;
            autoFollowTarget = null;
            autoFollowTransitionActive = false;
            autoFollowTransitionElapsed = 0;
            panelTypingActive = false;
            panelTypingElapsed = 0;
            panelTypingTotal = 0;
            panelTypingFields = [];
            panelTypingMode = '';
            autoFollowFullShownAt = 0;
            if (infoEl) {
                infoEl.classList.remove('visible');
                infoEl.classList.remove('auto-follow');
            }
        } else {
            registerInteraction();
        }
        exitSel = picked;
        exitSelWorld.copy(wPos);
        exitSelLocal.copy(picked.group.worldToLocal(wPos.clone()));
        exitTargetStart.copy(wPos);
        setSelected(null, true);
        const toCam = camera.position.clone().sub(wPos).normalize();
        const farDist = Math.max(2400, (picked.cfg.a + picked.cfg.b) + 1800);
        exitCamStart.copy(camera.position);
        exitCamMid.copy(wPos.clone().add(toCam.multiplyScalar(farDist)));
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const lateral = Math.min(240, exitCamMid.distanceTo(exitCamEnd) * 0.2);
        camCtrl2a.copy(exitCamMid.clone().add(right.clone().multiplyScalar(lateral)));
        camCtrl2b.copy(exitCamEnd.clone().add(up.clone().multiplyScalar(-lateral * 0.3)));
        exitSeqActive = true;
        exitPhase = 1;
        exitElapsed = 0;
        autoPauseFrames = 240;
    }
    if (infoExit) {
        infoExit.addEventListener('click', (e) => {
            e.preventDefault();
            registerInteraction();
            if (selected) {
                beginExitFromPlanet(selected);
            } else if (infoEl) {
                infoEl.classList.remove('visible');
            }
        });
    }
    host.addEventListener('click', (e) => {
        if (typeof dragging !== 'undefined' && dragging) return;
        registerInteraction();
        const rect = renderer.domElement.getBoundingClientRect();
        mouseN.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseN.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseN, camera);
        const hits = raycaster.intersectObjects(clickables, true);
        if (hits.length > 0) {
            const obj = hits[0].object;
            const picked = planets.find(pp =>
                pp.mesh === obj ||
                obj.parent === pp.mesh ||
                pp.label === obj
            );
            if (picked) {
                if (selected && picked === selected) {
                    beginExitFromPlanet(picked);
                } else {
                    setSelected(picked);
                }
            }
        } else {
            if (selected) {
                beginExitFromPlanet(selected);
            } else {
                setSelected(null);
            }
        }
    });
    window.addEventListener('keydown', (e) => {
        registerInteraction();
        if (e.key === 'Escape') setSelected(null);
    });
    function animate() {
        const dt = clock.getDelta();
        const now = performance.now();
        planets.forEach(p => {
            if (exitSeqActive && exitSel && p === exitSel) {
                p.mesh.position.copy(exitSelLocal);
            } else {
                p.angle += p.cfg.speed * dt * 60 * orbitSpeedMultiplier;
                const x = p.cfg.a * Math.cos(p.angle);
                const z = p.cfg.b * Math.sin(p.angle);
                p.mesh.position.set(x, 0, z);
            }
            if (p.label) {
                p.mesh.getWorldPosition(labelPos);
                labelUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
                labelUp.multiplyScalar(p.cfg.r + 28);
                labelPos.add(labelUp);
                p.label.position.copy(labelPos);
                p.label.quaternion.copy(camera.quaternion);
            }
        });
        if (autoRotate && autoPauseFrames <= 0) {
            universe.rotation.y += autoRotateSpeed;
        } else if (autoPauseFrames > 0) {
            autoPauseFrames--;
        }
        if (introActive) {
            introElapsed += dt * 1000;
            let t = introElapsed / introDuration;
            if (t > 1) t = 1;
            const k = easeOutCubic(t);
            const az = THREE.MathUtils.lerp(startAz, 0, k);
            const el = THREE.MathUtils.lerp(startEl, targetEl, k);
            const r = THREE.MathUtils.lerp(startR, targetR, k);
            const pos = polarVec(r, az, el);
            camera.position.copy(pos);
            camera.lookAt(0, 0, 0);
            const upos = new THREE.Vector3().lerpVectors(universeStart, universeEnd, k);
            universe.position.copy(upos);
            if (t >= 1) {
                introActive = false;
                autoPauseFrames = 160;
            }
        }
        if (!introActive && !exitSeqActive && !selected) {
            if (now - lastInteraction >= idleThreshold) {
                if (!autoFollowActive) {
                    autoFollowActive = true;
                    autoFollowTarget = pickAutoFollowTarget();
                    beginAutoFollowTransition(autoFollowTarget);
                    beginAutoFollowContent(autoFollowTarget);
                }
            } else if (autoFollowActive) {
                autoFollowActive = false;
                autoFollowTarget = null;
                autoFollowTransitionActive = false;
                autoFollowTransitionElapsed = 0;
                panelTypingActive = false;
                panelTypingElapsed = 0;
                panelTypingTotal = 0;
                panelTypingFields = [];
                panelTypingMode = '';
                autoFollowFullShownAt = 0;
                if (infoEl) infoEl.classList.remove('visible');
            }
        } else if (autoFollowActive) {
            autoFollowActive = false;
            autoFollowTarget = null;
            autoFollowTransitionActive = false;
            autoFollowTransitionElapsed = 0;
            panelTypingActive = false;
            panelTypingElapsed = 0;
            panelTypingTotal = 0;
            panelTypingFields = [];
            panelTypingMode = '';
            autoFollowFullShownAt = 0;
            if (infoEl) infoEl.classList.remove('visible');
        }

        if (panelTypingActive && panelTypingTotal > 0) {
            panelTypingElapsed += dt * 1000;
            const chars = Math.min(panelTypingTotal, Math.floor(panelTypingElapsed / panelTypingCharInterval));
            let remaining = chars;
            panelTypingFields.forEach(field => {
                const text = field.text || '';
                const take = Math.max(0, Math.min(text.length, remaining));
                if (field.el) field.el.textContent = text.slice(0, take);
                remaining -= take;
            });
            if (chars >= panelTypingTotal) {
                panelTypingActive = false;
                if (panelTypingMode === 'auto') {
                    autoFollowFullShownAt = now;
                }
            }
        }

        if (selected) {
            const wPos = new THREE.Vector3();
            selected.mesh.getWorldPosition(wPos);
            const toCam = camera.position.clone().sub(wPos).normalize();
            const fovY = THREE.MathUtils.degToRad(camera.fov);
            const dCur = camera.position.distanceTo(wPos);
            const heightHalfCur = dCur * Math.tan(fovY / 2);
            const marginN = 0.22;
            const minDistVert = (selected.cfg.r / marginN) / Math.tan(fovY / 2);
            const minDistHorz = (selected.cfg.r / (marginN * camera.aspect)) / Math.tan(fovY / 2);
            const minDist = Math.max(minDistVert, minDistHorz, 450) * userZoom;
            const desiredPos = wPos.clone().add(toCam.multiplyScalar(minDist));
            camera.position.lerp(desiredPos, 0.08);
            const heightHalf = minDist * Math.tan(fovY / 2);
            const widthHalf = heightHalf * camera.aspect;
            const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
            const ndcX = 0.78;
            const ndcY = -0.78;
            const target = wPos.clone()
                .add(camRight.clone().multiplyScalar(widthHalf * ndcX))
                .add(camUp.clone().multiplyScalar(heightHalf * ndcY));
            camera.lookAt(target);
            if (infoEl) {
                const rect = renderer.domElement.getBoundingClientRect();
                const d = camera.position.distanceTo(wPos);
                const pxPerUnit = (rect.height / (2 * Math.tan(fovY / 2))) / d;
                const pxRadius = selected.cfg.r * pxPerUnit;
                const margin = 24;
                const sx = ((wPos.clone().project(camera).x + 1) / 2) * rect.width + rect.left;
                let left = sx + pxRadius + margin;
                const minLeft = 24;
                const maxLeft = window.innerWidth - 360;
                if (left < minLeft) left = minLeft;
                if (left > maxLeft) left = maxLeft;
                infoEl.style.left = `${left}px`;
                infoEl.style.top = `100px`;
                infoEl.style.right = `24px`;
                infoEl.style.bottom = `100px`;
                infoEl.classList.add('visible');
            }
        } else if (autoFollowActive && autoFollowTarget && !introActive && !exitSeqActive) {
            if (autoFollowFullShownAt && now - autoFollowFullShownAt >= autoFollowHoldDuration) {
                autoFollowTarget = pickAutoFollowTarget();
                beginAutoFollowTransition(autoFollowTarget);
                beginAutoFollowContent(autoFollowTarget);
            }
            if (autoFollowTransitionActive) {
                autoFollowTransitionElapsed += dt * 1000;
                let t = autoFollowTransitionElapsed / autoFollowTransitionDuration;
                if (t > 1) t = 1;
                const k = easeInOutCubic(t);
                const it = 1 - k;
                const posX = it*it*it*autoFollowFromPos.x + 3*it*it*k*autoFollowCtrl1.x + 3*it*k*k*autoFollowCtrl2.x + k*k*k*autoFollowToPos.x;
                const posY = it*it*it*autoFollowFromPos.y + 3*it*it*k*autoFollowCtrl1.y + 3*it*k*k*autoFollowCtrl2.y + k*k*k*autoFollowToPos.y;
                const posZ = it*it*it*autoFollowFromPos.z + 3*it*it*k*autoFollowCtrl1.z + 3*it*k*k*autoFollowCtrl2.z + k*k*k*autoFollowToPos.z;
                camera.position.set(posX, posY, posZ);
                const lookPos = new THREE.Vector3().lerpVectors(autoFollowFromLook, autoFollowToLook, k);
                camera.lookAt(lookPos);
                if (t >= 1) {
                    autoFollowTransitionActive = false;
                }
            } else {
                const { wPos, desiredPos } = getAutoFollowDesired(autoFollowTarget);
                const dist = camera.position.distanceTo(desiredPos);
                const lerpSpeed = THREE.MathUtils.clamp(dist / 2400, 0.02, 0.12);
                camera.position.lerp(desiredPos, lerpSpeed);
                camera.lookAt(wPos);
            }
        } else if (!introActive && !exitSeqActive) {
            // Keep center centered during zoom when no planet is selected
            const targetDist = targetR * userZoom;
            camera.position.setLength(targetDist);
            camera.lookAt(0, 0, 0);
        }
        if (exitSeqActive) {
            exitElapsed += dt * 1000;
            if (exitPhase === 1) {
                let t2 = exitElapsed / exitPlanetDuration;
                if (t2 > 1) t2 = 1;
                const k2 = easeInOutCubic(t2);
                camera.position.lerpVectors(exitCamStart, exitCamMid, k2);
                camera.lookAt(exitSelWorld);
                if (t2 >= 1) {
                    exitPhase = 2;
                    exitElapsed = 0;
                }
            } else if (exitPhase === 2) {
                let t3 = exitElapsed / exitUniverseDuration;
                if (t3 > 1) t3 = 1;
                const k3 = easeInOutCubic(t3);
                const it = 1 - k3;
                const pos3x = it*it*it*exitCamMid.x + 3*it*it*k3*camCtrl2a.x + 3*it*k3*k3*camCtrl2b.x + k3*k3*k3*exitCamEnd.x;
                const pos3y = it*it*it*exitCamMid.y + 3*it*it*k3*camCtrl2a.y + 3*it*k3*k3*camCtrl2b.y + k3*k3*k3*exitCamEnd.y;
                const pos3z = it*it*it*exitCamMid.z + 3*it*it*k3*camCtrl2a.z + 3*it*k3*k3*camCtrl2b.z + k3*k3*k3*exitCamEnd.z;
                camera.position.set(pos3x, pos3y, pos3z);
                const targetBlend = new THREE.Vector3().lerpVectors(exitTargetStart, exitTargetEnd, k3);
                camera.lookAt(targetBlend);
                if (t3 >= 1) {
                    exitSeqActive = false;
                    exitSel = null;
                    autoPauseFrames = 160;
                }
            }
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
        const w = host.clientWidth || window.innerWidth;
        const h = host.clientHeight || window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // Simple orbit control by dragging
    let dragging = false;
    let sx = 0, sy = 0;
    host.addEventListener('mousedown', (e) => {
        registerInteraction();
        dragging = true; sx = e.clientX; sy = e.clientY; autoPauseFrames = 300;
    });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        registerInteraction();
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        universe.rotation.y += dx * 0.002;
        universe.rotation.x += dy * 0.002;
        sx = e.clientX; sy = e.clientY;
    });

    // Touch interactions
    let lastTouchX = 0;
    let lastTouchY = 0;
    let initialPinchDist = 0;
    let initialUserZoom = 1.0;
    const minZoom = 0.4;
    const maxZoom = 4.0;

    host.addEventListener('touchstart', (e) => {
        registerInteraction();
        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            autoPauseFrames = 300;
        } else if (e.touches.length === 2) {
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialUserZoom = userZoom;
        }
    }, { passive: false });

    host.addEventListener('touchmove', (e) => {
        registerInteraction();
        if (e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastTouchX;
            const dy = e.touches[0].clientY - lastTouchY;
            universe.rotation.y += dx * 0.005;
            universe.rotation.x += dy * 0.005;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            autoPauseFrames = 300;
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (initialPinchDist > 0) {
                const ratio = initialPinchDist / currentDist;
                userZoom = Math.min(maxZoom, Math.max(minZoom, initialUserZoom * ratio));
                autoPauseFrames = 200;
            }
        }
    }, { passive: false });

    // Wheel zoom
    host.addEventListener('wheel', (e) => {
        e.preventDefault();
        registerInteraction();
        const step = 0.1;
        const dir = Math.sign(e.deltaY);
        userZoom = Math.min(maxZoom, Math.max(minZoom, userZoom + dir * step));
        autoPauseFrames = 200;
    }, { passive: false });
}

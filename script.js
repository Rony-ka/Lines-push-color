// script.js

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');

    // --- Grid cell dimensions (must match CSS) ---
    const actualGridRowHeight = 45;
    const actualGridColWidth = 20;
    // --- END Grid cell dimensions ---

    // --- Interaction parameters ---
    const baseInteractionRadius = 100;
    const maxInteractionRadius = 250; // The maximum radius under full pressure
    let interactionRadius = baseInteractionRadius; // This will be dynamic
    const maxMoveDistance = 40;
    const lerpFactor = 0.1; // Controls the "lag" or smoothing of the movement
    // --- END Interaction parameters ---

    // --- Color parameters ---
    const startColor = { r: 200, g: 128, b: 253 };
    const endColor = { r: 240, g: 61, b: 42 };
    // --- END Color parameters ---

    // --- New width parameters ---
    const minWidth = 1.5; // The initial width of the line
    const maxWidth = 15;  // The maximum width of the line when at the center of the interaction radius
    // --- END New width parameters ---

    // Change mousePos to a mutable state for touch
    let interactionPoint = { x: null, y: null, active: false };
    let lineElements = [];

    const lerp = (a, b, t) => a + (b - a) * t;

    const lerpColor = (color1, color2, progress) => {
        const r = Math.round(lerp(color1.r, color2.r, progress));
        const g = Math.round(lerp(color1.g, color2.g, progress));
        const b = Math.round(lerp(color1.b, color2.b, progress));
        return `rgb(${r}, ${g}, ${b})`;
    };

    const clearAllLineAnimations = () => {
        gridContainer.innerHTML = '';
        lineElements = [];
    };

    const populateGrid = () => {
        clearAllLineAnimations();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const rowsThatFit = Math.floor(viewportHeight / actualGridRowHeight);
        const colsThatFit = Math.floor(viewportWidth / actualGridColWidth);

        const numLinesToCreate = rowsThatFit * colsThatFit;

        for (let i = 0; i < numLinesToCreate; i++) {
            const line = document.createElement('div');
            line.classList.add('line');
            gridContainer.appendChild(line);
            // Store the current and target translateX values and width values directly on the element
            line.currentTranslateX = 0;
            line.targetTranslateX = 0;
            line.currentWidth = minWidth;
            line.targetWidth = minWidth;
            lineElements.push(line);
        }
        requestAnimationFrame(animateLines);
    };

    const animateLines = () => {
        lineElements.forEach(line => {
            const rect = line.getBoundingClientRect();
            const lineCenterX = rect.left + rect.width / 2;
            const lineCenterY = rect.top + rect.height / 2;

            // Only animate if there's an active interaction point
            let newTargetTranslateX = 0;
            let newTargetWidth = minWidth;
            let finalColor = 'transparent';

            if (interactionPoint.active) {
                const dx = interactionPoint.x - lineCenterX;
                const dy = interactionPoint.y - lineCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < interactionRadius) {
                    const influence = 1 - (distance / interactionRadius);
                    const direction = Math.sign(dx);
                    newTargetTranslateX = -direction * influence * maxMoveDistance;
                    newTargetWidth = lerp(minWidth, maxWidth, influence);
                    const movementProgress = Math.abs(newTargetTranslateX) / maxMoveDistance;
                    finalColor = lerpColor(startColor, endColor, movementProgress);
                }
            }

            // Interpolate the line's current position and width towards the target
            line.currentTranslateX = lerp(line.currentTranslateX, newTargetTranslateX, lerpFactor);
            line.currentWidth = lerp(line.currentWidth, newTargetWidth, lerpFactor);

            // Apply the new position, color, and width
            line.style.transform = `translateX(${line.currentTranslateX}px)`;
            line.style.setProperty('--line-color', finalColor);
            line.style.setProperty('--line-width', `${line.currentWidth}px`);
        });

        requestAnimationFrame(animateLines);
    };

    // Use touch events for mobile compatibility
    window.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        interactionPoint.x = touch.clientX;
        interactionPoint.y = touch.clientY;
        interactionPoint.active = true;

        if (touch.force !== undefined) {
            const pressure = touch.force;
            interactionRadius = baseInteractionRadius + (maxInteractionRadius - baseInteractionRadius) * pressure;
        } else {
            // Default to base radius for devices without pressure support
            interactionRadius = baseInteractionRadius;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        interactionPoint.x = touch.clientX;
        interactionPoint.y = touch.clientY;

        if (touch.force !== undefined) {
            const pressure = touch.force;
            interactionRadius = baseInteractionRadius + (maxInteractionRadius - baseInteractionRadius) * pressure;
        }
    });

    window.addEventListener('touchend', () => {
        interactionPoint.active = false;
        interactionPoint.x = null;
        interactionPoint.y = null;
        // Reset the radius to the base value when the touch ends
        interactionRadius = baseInteractionRadius;
    });

    // Also keep mouse events for desktop users
    window.addEventListener('mousemove', (e) => {
        interactionPoint.x = e.clientX;
        interactionPoint.y = e.clientY;
        interactionPoint.active = true;
        // For mouse, the radius is always the base value
        interactionRadius = baseInteractionRadius;
    });

    window.addEventListener('mouseleave', () => {
        interactionPoint.active = false;
        interactionPoint.x = null;
        interactionPoint.y = null;
        // Reset the radius to the base value when the mouse leaves
        interactionRadius = baseInteractionRadius;
    });

    populateGrid();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            populateGrid();
        }, 200);
    });
});

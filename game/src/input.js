// BATIK HEIST — keyboard and mouse input. WASD / arrows to move, Shift to
// sneak, E or click to steal, H or Space to hide in a dye vat, R to restart,
// Enter to start. One shared input object: the game loop reads it, the
// screenshot autopilot writes it.
export function makeInput(canvas) {
  const input = {
    moveX: 0,
    moveY: 0,
    sneak: false,
    interact: false, // edge: pressed this frame
    interactHeld: false,
    hidePressed: false, // edge: pressed this frame
    restartPressed: false, // edge
    startPressed: false, // edge
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
  };
  const keys = new Set();

  function recompute() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    input.moveX = x;
    input.moveY = y;
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'KeyE') {
      input.interact = true;
      input.interactHeld = true;
    }
    if (event.code === 'KeyH' || event.code === 'Space') input.hidePressed = true;
    if (event.code === 'KeyR') input.restartPressed = true;
    if (event.code === 'Enter') input.startPressed = true;
    recompute();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'KeyE') input.interactHeld = false;
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    input.interactHeld = false;
    recompute();
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    input.mouseDown = true;
    input.interact = true;
    input.interactHeld = true;
  });
  window.addEventListener('pointerup', () => {
    input.mouseDown = false;
    input.interactHeld = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  });
  return input;
}

/** Clear the one-frame edge flags at the end of each game step. */
export function clearEdges(input) {
  input.interact = false;
  input.hidePressed = false;
  input.restartPressed = false;
  input.startPressed = false;
}

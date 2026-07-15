use macroquad::prelude::*;

#[derive(Clone, Copy, PartialEq, Debug)]
enum GameState {
    StartScreen,
    Playing,
    LevelClear,
    Stuck,
    GameComplete,
}

struct Level {
    grid: [[u8; 8]; 8],
    start_pos: (usize, usize),
}

fn get_levels() -> Vec<Level> {
    vec![
        // Level 1: Winding intro with splitter stops
        Level {
            grid: [
                [0, 0, 0, 0, 0, 0, 3, 1],
                [1, 1, 1, 1, 1, 1, 0, 1],
                [1, 1, 0, 0, 1, 1, 0, 1],
                [1, 1, 1, 0, 1, 1, 0, 1],
                [1, 1, 1, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 0, 0, 1],
                [1, 1, 1, 1, 1, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 2: Staircase with center stopper
        Level {
            grid: [
                [0, 0, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 0, 0, 0, 1],
                [1, 0, 0, 3, 0, 0, 0, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 3: Branch hunt with forced split
        Level {
            grid: [
                [0, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 3, 0, 0, 0, 1],
                [0, 0, 1, 1, 1, 1, 0, 1],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 0, 0, 0, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 4: Rail maze with branch node
        Level {
            grid: [
                [0, 0, 0, 0, 1, 1, 1, 1],
                [1, 1, 1, 0, 1, 1, 1, 1],
                [1, 0, 1, 0, 0, 0, 1, 1],
                [1, 0, 1, 1, 1, 0, 1, 1],
                [1, 0, 0, 3, 1, 0, 0, 1],
                [1, 1, 1, 0, 1, 1, 0, 1],
                [1, 1, 1, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 5: Compact maze with splitter stop
        Level {
            grid: [
                [0, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 1, 1, 1, 1],
                [0, 0, 3, 0, 0, 1, 1, 1],
                [0, 0, 1, 1, 0, 1, 1, 1],
                [0, 0, 1, 1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 6: Web maze with central stopper
        Level {
            grid: [
                [0, 0, 1, 0, 0, 1, 1, 1],
                [1, 0, 1, 3, 0, 0, 0, 0],
                [1, 0, 1, 0, 1, 1, 1, 1],
                [1, 0, 0, 0, 1, 1, 1, 1],
                [1, 0, 0, 0, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 7: Junction web with explicit split point
        Level {
            grid: [
                [0, 0, 1, 0, 0, 0, 1, 1],
                [0, 0, 1, 0, 1, 0, 1, 1],
                [1, 0, 1, 0, 1, 0, 0, 1],
                [1, 0, 0, 3, 1, 1, 0, 1],
                [1, 1, 1, 0, 1, 1, 0, 1],
                [1, 1, 1, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 8: Grid puzzle with stopper hub
        Level {
            grid: [
                [0, 0, 0, 1, 0, 0, 0, 1],
                [1, 1, 0, 1, 0, 1, 0, 1],
                [0, 1, 0, 0, 0, 1, 0, 1],
                [0, 1, 1, 1, 1, 1, 0, 1],
                [0, 0, 0, 3, 1, 1, 0, 1],
                [1, 1, 1, 0, 1, 0, 0, 1],
                [1, 1, 1, 0, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 9: Deep maze with forced branch stop
        Level {
            grid: [
                [0, 1, 1, 0, 0, 0, 1, 1],
                [0, 1, 1, 0, 0, 0, 1, 1],
                [0, 1, 1, 0, 1, 0, 1, 1],
                [0, 1, 1, 0, 1, 0, 1, 1],
                [0, 1, 0, 3, 0, 0, 1, 1],
                [0, 0, 0, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
        // Level 10: Expert with late-game stopper
        Level {
            grid: [
                [0, 0, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 0, 0, 1],
                [1, 0, 0, 3, 1, 1, 0, 1],
                [1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 1, 1, 1, 1, 1],
            ],
            start_pos: (0, 0),
        },
    ]
}

struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    color: Color,
    lifetime: f32,
    max_lifetime: f32,
}

fn point_in_rect(px: f32, py: f32, x: f32, y: f32, w: f32, h: f32) -> bool {
    px >= x && px <= x + w && py >= y && py <= y + h
}

fn is_uncharged_node(cell: u8) -> bool {
    cell == 0 || cell == 3
}

fn restart_button_rect(sw: f32, sh: f32, offset_y: f32, grid_size: f32) -> (f32, f32, f32, f32) {
    let w = 164.0;
    let h = 36.0;
    let x = sw / 2.0 - w / 2.0;
    let bottom_space = sh - (offset_y + grid_size);
    let info_y = offset_y + grid_size + bottom_space / 2.0;
    let y = (info_y + 34.0).min(sh - h - 8.0);
    (x, y, w, h)
}

fn restart_confirm_buttons(sw: f32, sh: f32) -> ((f32, f32, f32, f32), (f32, f32, f32, f32)) {
    let button_w = 120.0;
    let button_h = 42.0;
    let gap = 16.0;
    let total_w = button_w * 2.0 + gap;
    let left_x = sw / 2.0 - total_w / 2.0;
    let y = sh / 2.0 + 28.0;
    (
        (left_x, y, button_w, button_h),
        (left_x + button_w + gap, y, button_w, button_h),
    )
}

fn has_available_move(
    grid: &[[u8; 8]; 8],
    player_row: usize,
    player_col: usize,
    cross_charge_available: bool,
) -> bool {
    let dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)];
    for &(dy, dx) in &dirs {
        let nr = player_row as i32 + dy;
        let nc = player_col as i32 + dx;
        if nr >= 0 && nr < 8 && nc >= 0 && nc < 8 {
            let cell = grid[nr as usize][nc as usize];
            if is_uncharged_node(cell) || (cross_charge_available && cell == 2) {
                return true;
            }
        }
    }
    false
}

fn window_conf() -> Conf {
    Conf {
        window_title: "LumenTrace".to_owned(),
        window_width: 800,
        window_height: 600,
        fullscreen: false,
        ..Default::default()
    }
}

#[macroquad::main(window_conf)]
async fn main() {
    let levels = get_levels();
    let mut current_level_idx = 0;
    
    // Load custom modern font
    let font = load_ttf_font("Outfit-Medium.ttf").await.ok();
    
    // Game state variables
    let mut state = GameState::StartScreen;
    let mut grid = [[0u8; 8]; 8];
    let mut player_row = 0;
    let mut player_col = 0;
    
    // Animation/Movement variables
    let mut slide_dir: Option<(i32, i32)> = None;
    let mut crossing_active = false;
    let mut cross_charge_available = true;
    let mut step_timer = 0.0;
    let step_duration = 0.04; // Seconds per step
    let mut drag_start: Option<Vec2> = None;
    let drag_threshold = 10.0;
    let mut show_restart_confirm = false;
    
    // Particles
    let mut particles: Vec<Particle> = Vec::new();
    
    // Initialize the level
    let init_level = |idx: usize, grid_ref: &mut [[u8; 8]; 8], pr: &mut usize, pc: &mut usize| {
        let lvl = &levels[idx];
        *grid_ref = lvl.grid;
        *pr = lvl.start_pos.0;
        *pc = lvl.start_pos.1;
        grid_ref[*pr][*pc] = 2; // Starting position is charged
    };
    
    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
    
    loop {
        let dt = get_frame_time();
        let sw = screen_width();
        let sh = screen_height();
        let grid_size = f32::min(sw * 0.7, sh * 0.7);
        let cell_size = grid_size / 8.0;
        let offset_x = (sw - grid_size) / 2.0;
        let offset_y = (sh - grid_size) / 2.0;
        let (restart_btn_x, restart_btn_y, restart_btn_w, restart_btn_h) =
            restart_button_rect(sw, sh, offset_y, grid_size);
        
        // Update particles
        particles.retain_mut(|p| {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.lifetime -= dt;
            p.lifetime > 0.0
        });
        
        // Handle input and state updates
        match state {
            GameState::StartScreen => {
                if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::Enter) || is_mouse_button_pressed(MouseButton::Left) {
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    crossing_active = false;
                    cross_charge_available = true;
                    show_restart_confirm = false;
                }
            }
            GameState::Playing => {
                // Restart level
                if is_key_pressed(KeyCode::R) {
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
                    crossing_active = false;
                    cross_charge_available = true;
                    drag_start = None;
                    show_restart_confirm = false;
                }

                if show_restart_confirm {
                    if is_key_pressed(KeyCode::Escape) {
                        show_restart_confirm = false;
                    }
                    if is_mouse_button_pressed(MouseButton::Left) {
                        let (mx, my) = mouse_position();
                        let (confirm_btn, cancel_btn) = restart_confirm_buttons(sw, sh);
                        if point_in_rect(
                            mx,
                            my,
                            confirm_btn.0,
                            confirm_btn.1,
                            confirm_btn.2,
                            confirm_btn.3,
                        ) {
                            init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                            slide_dir = None;
                            crossing_active = false;
                            cross_charge_available = true;
                            drag_start = None;
                            show_restart_confirm = false;
                        } else if point_in_rect(
                            mx,
                            my,
                            cancel_btn.0,
                            cancel_btn.1,
                            cancel_btn.2,
                            cancel_btn.3,
                        ) {
                            show_restart_confirm = false;
                        }
                    }
                } else if let Some((dx, dy)) = slide_dir {
                    step_timer += dt;
                    if step_timer >= step_duration {
                        step_timer = 0.0;
                        let next_row = player_row as i32 + dy;
                        let next_col = player_col as i32 + dx;
                        
                        if next_row >= 0 && next_row < 8 && next_col >= 0 && next_col < 8 {
                            let nr = next_row as usize;
                            let nc = next_col as usize;
                            if is_uncharged_node(grid[nr][nc]) {
                                // Charge!
                                player_row = nr;
                                player_col = nc;
                                let hit_splitter = grid[player_row][player_col] == 3;
                                grid[player_row][player_col] = 2;
                                
                                // Spawn movement particles
                                let sw = screen_width();
                                let sh = screen_height();
                                let grid_size = f32::min(sw * 0.7, sh * 0.7);
                                let cell_size = grid_size / 8.0;
                                let offset_x = (sw - grid_size) / 2.0;
                                let offset_y = (sh - grid_size) / 2.0;
                                let px = offset_x + player_col as f32 * cell_size + cell_size / 2.0;
                                let py = offset_y + player_row as f32 * cell_size + cell_size / 2.0;
                                
                                for _ in 0..5 {
                                    particles.push(Particle {
                                        x: px,
                                        y: py,
                                        vx: rand::gen_range(-100.0, 100.0) - dx as f32 * 50.0,
                                        vy: rand::gen_range(-100.0, 100.0) - dy as f32 * 50.0,
                                        color: Color::new(0.0, 1.0, 1.0, 0.8),
                                        lifetime: rand::gen_range(0.2, 0.5),
                                        max_lifetime: 0.5,
                                    });
                                }
                                if hit_splitter {
                                    slide_dir = None;
                                    crossing_active = false;
                                }
                            } else if grid[nr][nc] == 2 && (crossing_active || cross_charge_available) {
                                // Consume one cross ability the first time we step onto charged trail.
                                if !crossing_active {
                                    crossing_active = true;
                                    cross_charge_available = false;
                                }
                                player_row = nr;
                                player_col = nc;
                            } else {
                                // Hit a wall or trail
                                slide_dir = None;
                                crossing_active = false;
                            }
                        } else {
                            // Hit grid boundary
                            slide_dir = None;
                            crossing_active = false;
                        }
                        
                        // Check states after step finishes
                        if slide_dir.is_none() {
                            // Check win
                            let mut empty_count = 0;
                            for r in 0..8 {
                                for c in 0..8 {
                                    if is_uncharged_node(grid[r][c]) {
                                        empty_count += 1;
                                    }
                                }
                            }
                            
                            if empty_count == 0 {
                                if current_level_idx + 1 < levels.len() {
                                    state = GameState::LevelClear;
                                } else {
                                    state = GameState::GameComplete;
                                }
                            } else if !has_available_move(
                                &grid,
                                player_row,
                                player_col,
                                cross_charge_available,
                            ) {
                                state = GameState::Stuck;
                            }
                        }
                    }
                } else {
                    // Check for keyboard/touch drag input to start slide
                    let mut intended_dir: Option<(i32, i32)> = None;
                    if is_key_pressed(KeyCode::Left) || is_key_pressed(KeyCode::A) {
                        intended_dir = Some((-1, 0));
                    } else if is_key_pressed(KeyCode::Right) || is_key_pressed(KeyCode::D) {
                        intended_dir = Some((1, 0));
                    } else if is_key_pressed(KeyCode::Up) || is_key_pressed(KeyCode::W) {
                        intended_dir = Some((0, -1));
                    } else if is_key_pressed(KeyCode::Down) || is_key_pressed(KeyCode::S) {
                        intended_dir = Some((0, 1));
                    }

                    if is_mouse_button_pressed(MouseButton::Left) {
                        let (mx, my) = mouse_position();
                        if point_in_rect(mx, my, restart_btn_x, restart_btn_y, restart_btn_w, restart_btn_h)
                        {
                            show_restart_confirm = true;
                            drag_start = None;
                        } else {
                            let tile_x = offset_x + player_col as f32 * cell_size;
                            let tile_y = offset_y + player_row as f32 * cell_size;
                            if mx >= tile_x
                                && mx <= tile_x + cell_size
                                && my >= tile_y
                                && my <= tile_y + cell_size
                            {
                                drag_start = Some(vec2(mx, my));
                            }
                        }
                    }

                    if let Some(start) = drag_start {
                        if is_mouse_button_down(MouseButton::Left) {
                            let (mx, my) = mouse_position();
                            let drag = vec2(mx, my) - start;
                            if drag.x.abs().max(drag.y.abs()) >= drag_threshold {
                                if drag.x.abs() > drag.y.abs() {
                                    intended_dir = Some((if drag.x > 0.0 { 1 } else { -1 }, 0));
                                } else {
                                    intended_dir = Some((0, if drag.y > 0.0 { 1 } else { -1 }));
                                }
                                drag_start = None;
                            }
                        } else {
                            drag_start = None;
                        }
                    }
                    
                    if let Some((dx, dy)) = intended_dir {
                        let next_row = player_row as i32 + dy;
                        let next_col = player_col as i32 + dx;
                        if next_row >= 0 && next_row < 8 && next_col >= 0 && next_col < 8 {
                            if is_uncharged_node(grid[next_row as usize][next_col as usize]) {
                                slide_dir = Some((dx, dy));
                                crossing_active = false;
                                step_timer = step_duration; // Trigger first step immediately
                            } else if grid[next_row as usize][next_col as usize] == 2
                                && cross_charge_available
                            {
                                slide_dir = Some((dx, dy));
                                crossing_active = false;
                                step_timer = step_duration; // Trigger first step immediately
                            } else if !has_available_move(
                                &grid,
                                player_row,
                                player_col,
                                cross_charge_available,
                            ) {
                                state = GameState::Stuck;
                            }
                        } else if !has_available_move(
                            &grid,
                            player_row,
                            player_col,
                            cross_charge_available,
                        ) {
                            state = GameState::Stuck;
                        }
                    }
                }
            }
            GameState::LevelClear => {
                if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::Enter) || is_mouse_button_pressed(MouseButton::Left) {
                    current_level_idx += 1;
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    crossing_active = false;
                    cross_charge_available = true;
                    drag_start = None;
                    show_restart_confirm = false;
                }
            }
            GameState::Stuck => {
                if is_key_pressed(KeyCode::R) {
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
                    crossing_active = false;
                    cross_charge_available = true;
                    drag_start = None;
                    show_restart_confirm = false;
                }
            }
            GameState::GameComplete => {
                if is_key_pressed(KeyCode::R) || is_key_pressed(KeyCode::Space) || is_mouse_button_pressed(MouseButton::Left) {
                    current_level_idx = 0;
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
                    crossing_active = false;
                    cross_charge_available = true;
                    drag_start = None;
                    show_restart_confirm = false;
                }
            }
        }
        
        // --- DRAWING ---
        clear_background(Color::from_rgba(10, 11, 16, 255));
        
        // Get layout dimensions dynamically
        let sw = screen_width();
        let sh = screen_height();
        let grid_size = f32::min(sw * 0.7, sh * 0.7);
        let cell_size = grid_size / 8.0;
        let offset_x = (sw - grid_size) / 2.0;
        let offset_y = (sh - grid_size) / 2.0;
        
        // Draw decorative background grid/neon lines
        draw_rectangle_lines(
            offset_x - 5.0,
            offset_y - 5.0,
            grid_size + 10.0,
            grid_size + 10.0,
            2.0,
            Color::from_rgba(128, 0, 255, 100),
        );
        
        // Draw the 8x8 Grid
        for r in 0..8 {
            for c in 0..8 {
                let cell_x = offset_x + c as f32 * cell_size;
                let cell_y = offset_y + r as f32 * cell_size;
                
                match grid[r][c] {
                    1 => {
                        // Wall: Dark magenta base with glowing border
                        draw_rectangle(cell_x, cell_y, cell_size, cell_size, Color::from_rgba(35, 10, 30, 255));
                        draw_rectangle_lines(
                            cell_x + 2.0,
                            cell_y + 2.0,
                            cell_size - 4.0,
                            cell_size - 4.0,
                            2.5,
                            Color::from_rgba(255, 0, 128, 255),
                        );
                    }
                    2 => {
                        // Charged Trail: Vibrant glowing cyan path
                        draw_rectangle(
                            cell_x + 1.0,
                            cell_y + 1.0,
                            cell_size - 2.0,
                            cell_size - 2.0,
                            Color::from_rgba(0, 150, 180, 50),
                        );
                        draw_rectangle_lines(
                            cell_x + 4.0,
                            cell_y + 4.0,
                            cell_size - 8.0,
                            cell_size - 8.0,
                            1.5,
                            Color::from_rgba(0, 255, 255, 180),
                        );
                        draw_rectangle(
                            cell_x + cell_size * 0.35,
                            cell_y + cell_size * 0.35,
                            cell_size * 0.3,
                            cell_size * 0.3,
                            Color::from_rgba(0, 255, 255, 255),
                        );
                    }
                    3 => {
                        // Splitter/Stopper node: entering this tile immediately ends the current slide.
                        draw_rectangle(
                            cell_x + 2.0,
                            cell_y + 2.0,
                            cell_size - 4.0,
                            cell_size - 4.0,
                            Color::from_rgba(42, 34, 20, 255),
                        );
                        draw_rectangle_lines(
                            cell_x + 3.0,
                            cell_y + 3.0,
                            cell_size - 6.0,
                            cell_size - 6.0,
                            2.0,
                            Color::from_rgba(255, 200, 70, 220),
                        );
                        let cx = cell_x + cell_size / 2.0;
                        let cy = cell_y + cell_size / 2.0;
                        draw_line(
                            cx - cell_size * 0.2,
                            cy,
                            cx + cell_size * 0.2,
                            cy,
                            2.0,
                            Color::from_rgba(255, 220, 130, 255),
                        );
                        draw_line(
                            cx,
                            cy - cell_size * 0.2,
                            cx,
                            cy + cell_size * 0.2,
                            2.0,
                            Color::from_rgba(255, 220, 130, 255),
                        );
                    }
                    _ => {
                        // Empty: Subtle grid lines
                        draw_rectangle_lines(
                            cell_x,
                            cell_y,
                            cell_size,
                            cell_size,
                            1.0,
                            Color::from_rgba(30, 35, 45, 255),
                        );
                    }
                }
            }
        }
        
        // Draw particles
        for p in &particles {
            let size = 4.0 * (p.lifetime / p.max_lifetime);
            let mut col = p.color;
            col.a = p.lifetime / p.max_lifetime;
            draw_rectangle(p.x - size / 2.0, p.y - size / 2.0, size, size, col);
        }
        
        // Draw Player with Neon Glow
        if state == GameState::Playing || state == GameState::Stuck {
            let px = offset_x + player_col as f32 * cell_size;
            let py = offset_y + player_row as f32 * cell_size;
            let p_size = cell_size - 10.0;
            let center_x = px + cell_size / 2.0;
            let center_y = py + cell_size / 2.0;
            
            // Layered translucent glow
            for i in (1..=4).rev() {
                let glow_size = p_size + (i as f32 * 5.0);
                let alpha = 0.07 * (5 - i) as f32;
                draw_rectangle(
                    center_x - glow_size / 2.0,
                    center_y - glow_size / 2.0,
                    glow_size,
                    glow_size,
                    Color::new(0.0, 1.0, 1.0, alpha),
                );
            }
            // Inner player core
            draw_rectangle(
                center_x - p_size / 2.0,
                center_y - p_size / 2.0,
                p_size,
                p_size,
                Color::new(1.0, 1.0, 1.0, 1.0),
            );
            draw_rectangle_lines(
                center_x - p_size / 2.0,
                center_y - p_size / 2.0,
                p_size,
                p_size,
                2.0,
                Color::new(0.0, 1.0, 1.0, 1.0),
            );
        }
        
        // Render HUD/Texts
        let font_ref = font.as_ref();
        let title = "LUMEN TRACE";
        let title_size = 40;
        let title_center = get_text_center(title, font_ref, title_size, 1.0, 0.0);
        draw_text_ex(
            title,
            sw / 2.0 - title_center.x,
            offset_y / 2.0 + 10.0,
            TextParams {
                font: font_ref,
                font_size: title_size,
                color: Color::from_rgba(0, 255, 255, 255),
                ..Default::default()
            },
        );
        
        let level_str = format!("LEVEL {} / {}", current_level_idx + 1, levels.len());
        let level_size = 20;
        let level_center = get_text_center(&level_str, font_ref, level_size, 1.0, 0.0);
        draw_text_ex(
            &level_str,
            sw / 2.0 - level_center.x,
            offset_y / 2.0 + 35.0,
            TextParams {
                font: font_ref,
                font_size: level_size,
                color: Color::from_rgba(200, 200, 255, 255),
                ..Default::default()
            },
        );
        
        // Draw instructions/status overlay
        match state {
            GameState::StartScreen => {
                draw_rectangle(0.0, 0.0, sw, sh, Color::from_rgba(10, 10, 20, 220));
                
                let big_title = "LUMEN TRACE";
                let bt_center = get_text_center(big_title, font_ref, 60, 1.0, 0.0);
                draw_text_ex(
                    big_title,
                    sw / 2.0 - bt_center.x,
                    sh / 2.0 - 50.0,
                    TextParams {
                        font: font_ref,
                        font_size: 60,
                        color: Color::from_rgba(0, 255, 255, 255),
                        ..Default::default()
                    },
                );
                
                let prompt = "Press SPACE, ENTER or CLICK to Begin";
                let pr_center = get_text_center(prompt, font_ref, 24, 1.0, 0.0);
                draw_text_ex(
                    prompt,
                    sw / 2.0 - pr_center.x,
                    sh / 2.0 + 20.0,
                    TextParams {
                        font: font_ref,
                        font_size: 24,
                        color: Color::from_rgba(255, 255, 255, 255),
                        ..Default::default()
                    },
                );
                
                let rules_1 = "Slide and charge all empty nodes.";
                let r1_center = get_text_center(rules_1, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    rules_1,
                    sw / 2.0 - r1_center.x,
                    sh / 2.0 + 70.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: Color::from_rgba(180, 180, 200, 255),
                        ..Default::default()
                    },
                );
                
                let rules_2 = "Splitter nodes stop your slide and create branch points.";
                let r2_center = get_text_center(rules_2, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    rules_2,
                    sw / 2.0 - r2_center.x,
                    sh / 2.0 + 95.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: Color::from_rgba(180, 180, 200, 255),
                        ..Default::default()
                    },
                );

                let rules_3 = "You can cross charged trail once per level.";
                let r3_center = get_text_center(rules_3, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    rules_3,
                    sw / 2.0 - r3_center.x,
                    sh / 2.0 + 120.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: Color::from_rgba(150, 210, 175, 255),
                        ..Default::default()
                    },
                );
            }
            GameState::Playing => {
                let info = "Arrow/WASD or Drag to Slide | Gold + tiles are splitter stops";
                let info_center = get_text_center(info, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    info,
                    sw / 2.0 - info_center.x,
                    sh - (sh - (offset_y + grid_size)) / 2.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: Color::from_rgba(150, 150, 180, 255),
                        ..Default::default()
                    },
                );
                let cross_text = if cross_charge_available {
                    "Trail Cross: READY (1 use)"
                } else {
                    "Trail Cross: USED"
                };
                let cross_center = get_text_center(cross_text, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    cross_text,
                    sw / 2.0 - cross_center.x,
                    sh - (sh - (offset_y + grid_size)) / 2.0 + 22.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: if cross_charge_available {
                            Color::from_rgba(140, 220, 180, 255)
                        } else {
                            Color::from_rgba(160, 120, 120, 255)
                        },
                        ..Default::default()
                    },
                );

                draw_rectangle(
                    restart_btn_x,
                    restart_btn_y,
                    restart_btn_w,
                    restart_btn_h,
                    Color::from_rgba(45, 45, 58, 220),
                );
                draw_rectangle_lines(
                    restart_btn_x,
                    restart_btn_y,
                    restart_btn_w,
                    restart_btn_h,
                    2.0,
                    Color::from_rgba(130, 130, 170, 220),
                );
                let restart_label = "Restart...";
                let restart_center = get_text_center(restart_label, font_ref, 22, 1.0, 0.0);
                draw_text_ex(
                    restart_label,
                    restart_btn_x + restart_btn_w / 2.0 - restart_center.x,
                    restart_btn_y + restart_btn_h / 2.0 + restart_center.y / 2.0,
                    TextParams {
                        font: font_ref,
                        font_size: 22,
                        color: Color::from_rgba(230, 230, 255, 255),
                        ..Default::default()
                    },
                );

                if show_restart_confirm {
                    draw_rectangle(0.0, 0.0, sw, sh, Color::from_rgba(8, 8, 16, 190));
                    let panel_w = 430.0;
                    let panel_h = 190.0;
                    let panel_x = sw / 2.0 - panel_w / 2.0;
                    let panel_y = sh / 2.0 - panel_h / 2.0;
                    draw_rectangle(panel_x, panel_y, panel_w, panel_h, Color::from_rgba(30, 30, 45, 245));
                    draw_rectangle_lines(
                        panel_x,
                        panel_y,
                        panel_w,
                        panel_h,
                        2.0,
                        Color::from_rgba(120, 120, 190, 220),
                    );

                    let confirm_msg = "Restart this level?";
                    let msg_center = get_text_center(confirm_msg, font_ref, 34, 1.0, 0.0);
                    draw_text_ex(
                        confirm_msg,
                        sw / 2.0 - msg_center.x,
                        panel_y + 70.0,
                        TextParams {
                            font: font_ref,
                            font_size: 34,
                            color: Color::from_rgba(240, 240, 255, 255),
                            ..Default::default()
                        },
                    );

                    let detail = "Your current trail progress will be reset.";
                    let detail_center = get_text_center(detail, font_ref, 18, 1.0, 0.0);
                    draw_text_ex(
                        detail,
                        sw / 2.0 - detail_center.x,
                        panel_y + 102.0,
                        TextParams {
                            font: font_ref,
                            font_size: 18,
                            color: Color::from_rgba(180, 180, 210, 255),
                            ..Default::default()
                        },
                    );

                    let (confirm_btn, cancel_btn) = restart_confirm_buttons(sw, sh);
                    draw_rectangle(
                        confirm_btn.0,
                        confirm_btn.1,
                        confirm_btn.2,
                        confirm_btn.3,
                        Color::from_rgba(100, 40, 40, 240),
                    );
                    draw_rectangle_lines(
                        confirm_btn.0,
                        confirm_btn.1,
                        confirm_btn.2,
                        confirm_btn.3,
                        2.0,
                        Color::from_rgba(255, 120, 120, 220),
                    );
                    let confirm_label = "Restart";
                    let confirm_center = get_text_center(confirm_label, font_ref, 24, 1.0, 0.0);
                    draw_text_ex(
                        confirm_label,
                        confirm_btn.0 + confirm_btn.2 / 2.0 - confirm_center.x,
                        confirm_btn.1 + confirm_btn.3 / 2.0 + confirm_center.y / 2.0,
                        TextParams {
                            font: font_ref,
                            font_size: 24,
                            color: Color::from_rgba(255, 240, 240, 255),
                            ..Default::default()
                        },
                    );

                    draw_rectangle(
                        cancel_btn.0,
                        cancel_btn.1,
                        cancel_btn.2,
                        cancel_btn.3,
                        Color::from_rgba(45, 45, 58, 240),
                    );
                    draw_rectangle_lines(
                        cancel_btn.0,
                        cancel_btn.1,
                        cancel_btn.2,
                        cancel_btn.3,
                        2.0,
                        Color::from_rgba(130, 130, 170, 220),
                    );
                    let cancel_label = "Cancel";
                    let cancel_center = get_text_center(cancel_label, font_ref, 24, 1.0, 0.0);
                    draw_text_ex(
                        cancel_label,
                        cancel_btn.0 + cancel_btn.2 / 2.0 - cancel_center.x,
                        cancel_btn.1 + cancel_btn.3 / 2.0 + cancel_center.y / 2.0,
                        TextParams {
                            font: font_ref,
                            font_size: 24,
                            color: Color::from_rgba(230, 230, 255, 255),
                            ..Default::default()
                        },
                    );
                }
            }
            GameState::LevelClear => {
                draw_rectangle(0.0, 0.0, sw, sh, Color::from_rgba(10, 20, 15, 200));
                
                let msg = "LEVEL CLEARED!";
                let msg_center = get_text_center(msg, font_ref, 48, 1.0, 0.0);
                draw_text_ex(
                    msg,
                    sw / 2.0 - msg_center.x,
                    sh / 2.0 - 20.0,
                    TextParams {
                        font: font_ref,
                        font_size: 48,
                        color: Color::from_rgba(0, 255, 128, 255),
                        ..Default::default()
                    },
                );
                
                let prompt = "Press SPACE, ENTER or CLICK for Next Level";
                let pr_center = get_text_center(prompt, font_ref, 20, 1.0, 0.0);
                draw_text_ex(
                    prompt,
                    sw / 2.0 - pr_center.x,
                    sh / 2.0 + 30.0,
                    TextParams {
                        font: font_ref,
                        font_size: 20,
                        color: Color::from_rgba(255, 255, 255, 255),
                        ..Default::default()
                    },
                );
            }
            GameState::Stuck => {
                // Subtle warning overlay
                draw_rectangle(
                    offset_x,
                    offset_y,
                    grid_size,
                    grid_size,
                    Color::from_rgba(255, 0, 0, 30),
                );
                
                let msg = "NO MORE MOVES!";
                let msg_center = get_text_center(msg, font_ref, 36, 1.0, 0.0);
                draw_text_ex(
                    msg,
                    sw / 2.0 - msg_center.x,
                    sh / 2.0 - 10.0,
                    TextParams {
                        font: font_ref,
                        font_size: 36,
                        color: Color::from_rgba(255, 60, 60, 255),
                        ..Default::default()
                    },
                );
                
                let prompt = "Press R to Restart Level";
                let pr_center = get_text_center(prompt, font_ref, 20, 1.0, 0.0);
                draw_text_ex(
                    prompt,
                    sw / 2.0 - pr_center.x,
                    sh / 2.0 + 30.0,
                    TextParams {
                        font: font_ref,
                        font_size: 20,
                        color: Color::from_rgba(255, 255, 255, 255),
                        ..Default::default()
                    },
                );
            }
            GameState::GameComplete => {
                draw_rectangle(0.0, 0.0, sw, sh, Color::from_rgba(15, 10, 25, 230));
                
                let msg = "GRID COMPLETELY CHARGED!";
                let msg_center = get_text_center(msg, font_ref, 44, 1.0, 0.0);
                draw_text_ex(
                    msg,
                    sw / 2.0 - msg_center.x,
                    sh / 2.0 - 40.0,
                    TextParams {
                        font: font_ref,
                        font_size: 44,
                        color: Color::from_rgba(0, 255, 255, 255),
                        ..Default::default()
                    },
                );
                
                let sub = "Congratulations! You have completed LumenTrace.";
                let sub_center = get_text_center(sub, font_ref, 20, 1.0, 0.0);
                draw_text_ex(
                    sub,
                    sw / 2.0 - sub_center.x,
                    sh / 2.0 + 10.0,
                    TextParams {
                        font: font_ref,
                        font_size: 20,
                        color: Color::from_rgba(200, 200, 255, 255),
                        ..Default::default()
                    },
                );
                
                let prompt = "Press R, SPACE or CLICK to play again";
                let pr_center = get_text_center(prompt, font_ref, 18, 1.0, 0.0);
                draw_text_ex(
                    prompt,
                    sw / 2.0 - pr_center.x,
                    sh / 2.0 + 60.0,
                    TextParams {
                        font: font_ref,
                        font_size: 18,
                        color: Color::from_rgba(255, 255, 255, 255),
                        ..Default::default()
                    },
                );
            }
        }
        
        next_frame().await
    }
}

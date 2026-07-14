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
        // Level 1: Simple introductory layout
        Level {
            grid: [
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
            ],
            start_pos: (0, 0),
        },
        // Level 2: Maze-like paths
        Level {
            grid: [
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 0, 1],
                [1, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 1, 0],
                [0, 1, 1, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
            ],
            start_pos: (0, 0),
        },
        // Level 3: Symmetric blocks with tricky corners
        Level {
            grid: [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 1, 1, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 1, 1, 0, 1, 0],
                [0, 1, 0, 1, 1, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 1, 1, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
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
    let mut step_timer = 0.0;
    let step_duration = 0.04; // Seconds per step
    
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
                }
            }
            GameState::Playing => {
                // Restart level
                if is_key_pressed(KeyCode::R) {
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
                }
                
                // Sliding physics
                if let Some((dx, dy)) = slide_dir {
                    step_timer += dt;
                    if step_timer >= step_duration {
                        step_timer = 0.0;
                        let next_row = player_row as i32 + dy;
                        let next_col = player_col as i32 + dx;
                        
                        if next_row >= 0 && next_row < 8 && next_col >= 0 && next_col < 8 {
                            let nr = next_row as usize;
                            let nc = next_col as usize;
                            if grid[nr][nc] == 0 {
                                // Charge!
                                player_row = nr;
                                player_col = nc;
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
                            } else {
                                // Hit a wall or trail
                                slide_dir = None;
                            }
                        } else {
                            // Hit grid boundary
                            slide_dir = None;
                        }
                        
                        // Check states after step finishes
                        if slide_dir.is_none() {
                            // Check win
                            let mut empty_count = 0;
                            for r in 0..8 {
                                for c in 0..8 {
                                    if grid[r][c] == 0 {
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
                            } else {
                                // Check if stuck
                                let mut can_move = false;
                                let dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)];
                                for &(dy, dx) in &dirs {
                                    let nr = player_row as i32 + dy;
                                    let nc = player_col as i32 + dx;
                                    if nr >= 0 && nr < 8 && nc >= 0 && nc < 8 {
                                        if grid[nr as usize][nc as usize] == 0 {
                                            can_move = true;
                                            break;
                                        }
                                    }
                                }
                                if !can_move {
                                    state = GameState::Stuck;
                                }
                            }
                        }
                    }
                } else {
                    // Check for keyboard input to start slide
                    let mut dx = 0;
                    let mut dy = 0;
                    if is_key_pressed(KeyCode::Left) || is_key_pressed(KeyCode::A) {
                        dx = -1;
                    } else if is_key_pressed(KeyCode::Right) || is_key_pressed(KeyCode::D) {
                        dx = 1;
                    } else if is_key_pressed(KeyCode::Up) || is_key_pressed(KeyCode::W) {
                        dy = -1;
                    } else if is_key_pressed(KeyCode::Down) || is_key_pressed(KeyCode::S) {
                        dy = 1;
                    }
                    
                    if dx != 0 || dy != 0 {
                        let next_row = player_row as i32 + dy;
                        let next_col = player_col as i32 + dx;
                        if next_row >= 0 && next_row < 8 && next_col >= 0 && next_col < 8 {
                            if grid[next_row as usize][next_col as usize] == 0 {
                                slide_dir = Some((dx, dy));
                                step_timer = step_duration; // Trigger first step immediately
                            }
                        }
                    }
                }
            }
            GameState::LevelClear => {
                if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::Enter) || is_mouse_button_pressed(MouseButton::Left) {
                    current_level_idx += 1;
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                }
            }
            GameState::Stuck => {
                if is_key_pressed(KeyCode::R) {
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
                }
            }
            GameState::GameComplete => {
                if is_key_pressed(KeyCode::R) || is_key_pressed(KeyCode::Space) || is_mouse_button_pressed(MouseButton::Left) {
                    current_level_idx = 0;
                    state = GameState::Playing;
                    init_level(current_level_idx, &mut grid, &mut player_row, &mut player_col);
                    slide_dir = None;
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
                
                let rules_2 = "You cannot cross walls or charged paths.";
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
            }
            GameState::Playing => {
                let info = "Use Arrow Keys or WASD to Slide | Press R to Restart";
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
